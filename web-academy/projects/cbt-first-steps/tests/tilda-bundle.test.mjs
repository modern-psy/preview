import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import test from "node:test";

const read = (relativePath) =>
  fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

const sourceHtml = read("index.html");
const sourceSchema = read("schema.org");
const head = read("tilda/head.html");
const body = read("tilda/body.html");
const footer = read("tilda/footer.html");
const schema = read("tilda/schema.html");
const manifest = JSON.parse(read("tilda/manifest.json"));
const allGenerated = `${head}\n${body}\n${footer}\n${schema}`;
const schemaMatch = schema.match(
  /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/,
);

assert.ok(schemaMatch, "schema.html must contain one JSON-LD script");
const schemaData = JSON.parse(schemaMatch[1]);

test("Tilda package is self-contained and within the T123 budget", () => {
  assert.doesNotMatch(
    allGenerated,
    /\b(?:src|href|poster)="(?:\.\/)?(?:assets\/|\.\.\/|styles\.css|script\.js)/i,
  );
  assert.doesNotMatch(allGenerated, /url\(["']?(?:\.\/)?assets\//i);
  assert.doesNotMatch(allGenerated, /localhost|127\.0\.0\.1/i);
  assert.doesNotMatch(body, /<!doctype|<html\b|<head\b|<body\b/i);
  assert.equal((body.match(/class="[^"]*cbt-first-steps-page/g) || []).length, 1);
  assert.equal((body.match(/<main\b/g) || []).length, 1);
  assert.equal((body.match(/<h1\b/g) || []).length, 1);
  assert.equal(body.trim().split(/\r?\n/).length, 1);
  assert.ok(body.length < 65000, `body.html is ${body.length} characters`);
  assert.ok((head.match(/data:image\/svg\+xml;base64,/g) || []).length >= 6);
  assert.match(
    head,
    /Page-scoped typography[\s\S]*?\.cbt-first-steps-page\s*\{[^}]*font-family:\s*var\(--font-family-body\)/,
  );
  assert.match(head, /\.cbt-first-steps-page a\.button\s*\{[^}]*!important/s);
  assert.match(head, /\.footer_contact-link[^}]*\.footer_social-link/s);
  assert.match(footer, /__cbtFirstStepsStackController/);
});

test("generated assets use data URLs or permanent Tilda CDN URLs", () => {
  const urls = [...body.matchAll(/\b(?:src|href)="(https:[^"]+|data:[^"]+)"/g)].map(
    (match) => match[1].replaceAll("&amp;", "&"),
  );

  for (const value of urls) {
    if (value.startsWith("data:")) continue;

    const url = new URL(value);

    if (url.hostname === "modern-psy.ru" || url.hostname.endsWith("youtube.com")) {
      continue;
    }

    if (
      url.hostname === "t.me" ||
      url.hostname === "vk.com" ||
      url.hostname === "islod.obrnadzor.gov.ru"
    ) {
      continue;
    }

    assert.ok(
      ["static.tildacdn.com", "optim.tildacdn.com"].includes(url.hostname),
      `unexpected production asset host: ${url.hostname}`,
    );
  }

  const images = [...body.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
  assert.ok(images.length > 0);
  assert.equal(images.filter((tag) => !/\balt="[^"]*"/.test(tag)).length, 0);
});

test("same-page anchors are complete and IDs are unique", () => {
  const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

  assert.deepEqual(duplicateIds, []);

  const idSet = new Set(ids);
  const unresolvedAnchors = [...body.matchAll(/<a\b[^>]*\bhref="#([^"#]+)"/g)]
    .map((match) => match[1])
    .filter((id) => !idSet.has(id));

  assert.deepEqual(unresolvedAnchors, []);
  assert.match(body, /id="programma"/);
});

test("SEO source and schema use the approved canonical", () => {
  const canonical = "https://modern-psy.ru/cbt-first-steps";

  assert.match(sourceHtml, new RegExp(`<link rel="canonical" href="${canonical}"`));
  assert.match(sourceHtml, /<meta\s+property="og:title"/);
  assert.match(sourceHtml, /<meta\s+property="og:description"/);
  assert.doesNotMatch(sourceHtml, /<meta property="og:image"/);
  assert.equal(schema, sourceSchema);
  assert.equal(schemaData["@context"], "https://schema.org");

  const graph = schemaData["@graph"];
  const byType = (type) => graph.find((node) => node["@type"] === type);
  const webpage = byType("WebPage");
  const course = byType("Course");
  const courseInstance = byType("CourseInstance");

  assert.equal(webpage.url, canonical);
  assert.equal(webpage.mainEntity["@id"], `${canonical}#course`);
  assert.equal(course.name, "Первые шаги в КПТ");
  assert.equal(course.isAccessibleForFree, true);
  assert.equal(course.teaches.length, 5);
  assert.equal(courseInstance.courseWorkload, "PT2H5M");
  assert.equal(courseInstance.isAccessibleForFree, true);
  assert.equal(courseInstance.offers.price, "0");
});

test("manifest hashes match every generated transfer file", () => {
  for (const [filename, metadata] of Object.entries(manifest.files)) {
    const content = read(`tilda/${filename}`);

    assert.equal(metadata.bytes, Buffer.byteLength(content));
    assert.equal(metadata.characters, content.length);
    assert.equal(
      metadata.sha256,
      crypto.createHash("sha256").update(content).digest("hex"),
    );
  }
});
