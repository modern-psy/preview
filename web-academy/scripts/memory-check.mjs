import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { promisify } from "node:util";

const repositoryRoot = process.cwd();
const manifestFile = "docs/memory/registries.json";
const toonExecutable = resolve(repositoryRoot, "node_modules/.bin/toon");
const writeToon = process.argv.includes("--write-toon");
const runFile = promisify(execFile);

const errors = [];
const allIds = new Set();
let manifest;

try {
  manifest = JSON.parse(
    await readFile(resolve(repositoryRoot, manifestFile), "utf8"),
  );
} catch (error) {
  console.error(`${manifestFile}: cannot parse registry manifest (${error.message})`);
  process.exit(1);
}

if (!Array.isArray(manifest.registries)) {
  console.error(`${manifestFile}: registries must be an array`);
  process.exit(1);
}

let recordCount = 0;

for (const [registryIndex, registry] of manifest.registries.entries()) {
  const registryLabel = `${manifestFile}#registries[${registryIndex}]`;
  const requiredConfig = [
    "file",
    "toon_file",
    "collection",
    "required_fields",
  ];

  for (const field of requiredConfig) {
    if (!(field in registry)) errors.push(`${registryLabel}: missing ${field}`);
  }
  if (requiredConfig.some((field) => !(field in registry))) continue;
  if (!Array.isArray(registry.required_fields)) {
    errors.push(`${registryLabel}: required_fields must be an array`);
    continue;
  }

  const absoluteFile = resolve(repositoryRoot, registry.file);
  const absoluteToonFile = resolve(repositoryRoot, registry.toon_file);
  let document;

  try {
    document = JSON.parse(await readFile(absoluteFile, "utf8"));
  } catch (error) {
    errors.push(`${registry.file}: cannot parse JSON (${error.message})`);
    continue;
  }

  const records = document[registry.collection];
  if (!Array.isArray(records)) {
    errors.push(`${registry.file}: ${registry.collection} must be an array`);
    continue;
  }
  recordCount += records.length;

  try {
    const { stdout: generatedToon } = await runFile(toonExecutable, [absoluteFile], {
      maxBuffer: 1024 * 1024,
    });
    const normalizedToon = `${generatedToon.trimEnd()}\n`;

    if (writeToon) {
      await mkdir(dirname(absoluteToonFile), { recursive: true });
      await writeFile(absoluteToonFile, normalizedToon, "utf8");
    } else {
      const storedToon = await readFile(absoluteToonFile, "utf8");
      if (storedToon.trimEnd() !== generatedToon.trimEnd()) {
        errors.push(
          `${registry.toon_file}: stale; regenerate from ${registry.file}`,
        );
      }
    }
  } catch (error) {
    errors.push(`${registry.toon_file}: cannot process TOON (${error.message})`);
  }

  for (const [recordIndex, record] of records.entries()) {
    const label = `${registry.file}#${recordIndex}`;
    for (const field of registry.required_fields) {
      if (!(field in record)) errors.push(`${label}: missing ${field}`);
    }

    if (record.id) {
      if (allIds.has(record.id)) errors.push(`${label}: duplicate id ${record.id}`);
      allIds.add(record.id);
    }

    if (record.updated_at && !/^\d{4}-\d{2}-\d{2}$/.test(record.updated_at)) {
      errors.push(`${label}: updated_at must use YYYY-MM-DD`);
    }

    if (record.canonical_path) {
      try {
        await access(resolve(repositoryRoot, record.canonical_path));
      } catch {
        errors.push(
          `${label}: canonical_path does not exist (${record.canonical_path})`,
        );
      }
    }
  }

  for (const [ruleIndex, rule] of (registry.count_rules ?? []).entries()) {
    const ruleLabel = `${registryLabel}.count_rules[${ruleIndex}]`;
    if (!rule.where || typeof rule.where !== "object") {
      errors.push(`${ruleLabel}: where must be an object`);
      continue;
    }
    if (!Number.isInteger(rule.equals) || rule.equals < 0) {
      errors.push(`${ruleLabel}: equals must be a non-negative integer`);
      continue;
    }

    const matches = records.filter((record) =>
      Object.entries(rule.where).every(([field, value]) => record[field] === value),
    );
    if (matches.length !== rule.equals) {
      errors.push(
        `${rule.message ?? ruleLabel}; found ${matches.length}, expected ${rule.equals}`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error(`Memory validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const action = writeToon ? "TOON regenerated" : "validation passed";
  const registryWord = manifest.registries.length === 1 ? "registry" : "registries";
  const recordWord = recordCount === 1 ? "record" : "records";
  console.log(
    `Memory ${action}: ${manifest.registries.length} ${registryWord}, ${recordCount} ${recordWord}.`,
  );
}
