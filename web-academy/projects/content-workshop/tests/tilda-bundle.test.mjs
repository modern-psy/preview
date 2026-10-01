import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import test from "node:test";

const read = (relativePath) =>
  fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("Tilda package is complete, scoped, and copy-paste ready", () => {
  const sourceCss = read("styles.css");
  const sourceJs = read("script.js");
  const sourceSchema = read("schema.org").trim();
  const head = read("tilda/head.html");
  const body = read("tilda/body.html");
  const footer = read("tilda/footer.html");
  const manifest = JSON.parse(read("tilda/manifest.json"));
  const allGenerated = `${head}\n${body}\n${footer}`;

  assert.doesNotMatch(
    allGenerated,
    /\b(?:src|href)="(?:\.\/|assets\/|styles\.css|script\.js)/i,
  );
  assert.doesNotMatch(body, /<!doctype|<html\b|<head\b|<body\b/i);
  assert.equal((body.match(/class="page-wrapper"/g) || []).length, 1);
  assert.equal((head.match(/type="application\/ld\+json"/g) || []).length, 1);
  assert.ok(head.includes(sourceSchema));
  assert.match(head, /<style>[\s\S]*\.page-wrapper/);
  assert.match(head, /color:\s*var\(--link-color, inherit\) !important/);
  assert.match(head, /text-decoration:\s*none !important/);
  assert.match(head, /\.page-wrapper :is\(ul, ol, li\)/);
  assert.match(footer, /<script>[\s\S]*__contentWorkshopAnchorScrollCleanup/);
  assert.ok(footer.includes(sourceJs.trim()));

  assert.equal(
    (body.match(/id="content-workshop-pricing-sparkle"/g) || []).length,
    1,
  );
  assert.equal(
    (body.match(/href="#content-workshop-pricing-sparkle"/g) || []).length,
    11,
  );

  const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual(duplicateIds, []);

  const idSet = new Set(ids);
  const localAnchors = [
    ...body.matchAll(/<a\b[^>]*\bhref="#([^"#]+)"/g),
  ].map((match) => match[1]);
  assert.deepEqual(
    localAnchors.filter((id) => !id.startsWith("popup:") && !idSet.has(id)),
    [],
  );
  assert.equal(
    (body.match(/href="#popup:getcourse"/g) || []).length,
    2,
  );
  assert.match(body, /class="button is-nav" href="#price"/);
  assert.match(body, /class="button is-primary" href="#price"/);
  assert.match(body, /class="button is-cta" href="#price"/);
  assert.match(body, /class="button is-tabs" href="#price"/);
  assert.match(body, /class="button is-pricing" href="#popup:getcourse"/);
  assert.match(body, /class="button is-faq-primary" href="#popup:getcourse"/);

  assert.match(sourceJs, /const duration = Math\.min\(900, Math\.max\(480/);
  assert.match(sourceJs, /const easedProgress = 1 - \(1 - progress\) \*\* 3/);
  assert.match(sourceJs, /anchorScrollInterruptEvents = \["wheel", "touchstart", "keydown"\]/);
  assert.match(sourceJs, /scrollMarginTop/);
  assert.match(sourceJs, /__contentWorkshopAnchorScrollCleanup/);
  assert.match(sourceCss, /scroll-margin-top:\s*5rem/);

  for (const [filename, metadata] of Object.entries(manifest.files)) {
    const content = read(`tilda/${filename}`);
    assert.equal(Buffer.byteLength(content), metadata.bytes);
    assert.equal(
      crypto.createHash("sha256").update(content).digest("hex"),
      metadata.sha256,
    );
  }

  for (const obsoleteFile of ["index.html", "styles.css", "script.js"]) {
    assert.equal(
      fs.existsSync(new URL(`../tilda/${obsoleteFile}`, import.meta.url)),
      false,
    );
  }
});
