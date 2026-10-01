import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = dirname(fileURLToPath(import.meta.url));
const outputDirectory = join(projectDirectory, "tilda");

const [sourceHtml, sourceCss, sourceJavaScript, sourceSchema] = await Promise.all([
  readFile(join(projectDirectory, "index.html"), "utf8"),
  readFile(join(projectDirectory, "styles.css"), "utf8"),
  readFile(join(projectDirectory, "script.js"), "utf8"),
  readFile(join(projectDirectory, "schema.org"), "utf8"),
]);

const bodyMatch = sourceHtml.match(/<body>\s*([\s\S]*?)\s*<\/body>/i);

if (!bodyMatch) {
  throw new Error("Could not extract BODY content from index.html");
}

const head = `<!-- ast-shrek-in-psychologists-office: HEAD -->
<link rel="preconnect" href="https://optim.tildacdn.com" crossorigin>
<link rel="preconnect" href="https://static.tildacdn.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Wix+Madefor+Text:wght@400;500&display=swap" rel="stylesheet">
<style id="ast-shrek-page-styles">
${sourceCss.trim()}
</style>
`;

const body = `<!-- ast-shrek-in-psychologists-office: BODY -->
${bodyMatch[1].trim()}
`;

const footer = `<!-- ast-shrek-in-psychologists-office: FOOTER -->
<script>
${sourceJavaScript.trim()}
</script>
`;

const outputs = {
  "head.html": head,
  "body.html": body,
  "footer.html": footer,
  "schema.html": `${sourceSchema.trim()}\n`,
};

await Promise.all(
  Object.entries(outputs).map(([filename, contents]) =>
    writeFile(join(outputDirectory, filename), contents, "utf8"),
  ),
);

const manifest = Object.fromEntries(
  Object.entries(outputs).map(([filename, contents]) => [
    filename,
    {
      bytes: Buffer.byteLength(contents),
      sha256: createHash("sha256").update(contents).digest("hex"),
    },
  ]),
);

await writeFile(
  join(outputDirectory, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);
