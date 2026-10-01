import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import test from "node:test";

const read = (relativePath) =>
  fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

const canonicalUrl = "https://modern-psy.ru/how-to-enter-psy";
const alexeyVideoUrl =
  "https://static.tildacdn.com/vide3764-6532-4334-b737-353830323931/alexey-baburin-10s.mp4";
const yaroslavaVideoUrl =
  "https://static.tildacdn.com/vide3030-3636-4634-b537-346462333131/yaroslava-sarancheva.mp4";

test("source SEO, semantics, and structured data stay synchronized", () => {
  const html = read("index.html");
  const schemaSource = read("schema.org").trim();
  const jsonText = schemaSource.match(
    /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i,
  )?.[1];

  assert.match(
    html,
    /<title>А что, если стать психологом\? Бесплатный разбор — АСП<\/title>/,
  );
  assert.match(html, new RegExp(`<link rel="canonical" href="${canonicalUrl}"`));
  assert.match(html, new RegExp(`<meta property="og:url" content="${canonicalUrl}"`));
  assert.doesNotMatch(html, /property="og:image(?::[^"]+)?"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<p class="hero_heading"[^>]*>\s*А что, если стать психологом\?/);
  assert.match(html, /<h1 class="hero_description" id="hero-heading"/);
  assert.doesNotMatch(html, /<h2 class="(?:decision_card-heading|speaker_name|academy_card-heading)"/);
  assert.match(html, /6 августа 2026, 19:00 \(МСК\)/);

  assert.ok(jsonText, "schema.org must contain one JSON-LD script");
  const schema = JSON.parse(jsonText);
  const graph = schema["@graph"];
  const byId = new Map(graph.map((node) => [node["@id"], node]));

  assert.equal(schema["@context"], "https://schema.org");
  assert.equal(byId.get(`${canonicalUrl}#webpage`)?.url, canonicalUrl);
  assert.equal(byId.get(`${canonicalUrl}#event`)?.["@type"], "EducationEvent");
  assert.equal(
    byId.get(`${canonicalUrl}#event`)?.startDate,
    "2026-08-06T19:00:00+03:00",
  );
  assert.equal(byId.get(`${canonicalUrl}#event`)?.isAccessibleForFree, true);
  assert.equal(byId.get(`${canonicalUrl}#event`)?.offers?.price, "0");
  assert.equal(byId.get(`${canonicalUrl}#speaker`)?.name, "Алексей Бабурин");
  assert.equal(
    byId.get("https://modern-psy.ru/#organization")?.["@type"],
    "EducationalOrganization",
  );
  assert.equal(graph.some((node) => node["@type"] === "FAQPage"), false);
});

test("mobile WebKit fallbacks remain explicit", () => {
  const css = read("styles.css");
  const js = read("script.js");

  assert.match(
    css,
    /@media screen and \(max-width: 48rem\)[\s\S]*?\.hero_media\s*\{[\s\S]*?display: flex;[\s\S]*?flex-direction: column;/,
  );
  assert.match(
    css,
    /\.hero_event-progressive-blur\s*\{[\s\S]*?-webkit-backdrop-filter: none;[\s\S]*?mask-image: none;/,
  );
  assert.match(
    css,
    /@media screen and \(max-width: 47\.9375rem\)[\s\S]*?\.dialogue_track,[\s\S]*?flex-direction: column;/,
  );
  assert.match(js, /const dialogueMobileQuery = window\.matchMedia/);
  assert.match(js, /!dialogueMobileQuery\.matches &&/);
});

test("generated Tilda package is reproducible and copy-safe", () => {
  const sourceJs = read("script.js").trim();
  const sourceSchema = read("schema.org").trim();
  const head = read("tilda/head.html");
  const body = read("tilda/body.html");
  const footer = read("tilda/footer.html");
  const schema = read("tilda/schema.html").trim();
  const transferReadme = read("tilda/README.md");
  const assetMap = JSON.parse(read("tilda/asset-map.json"));
  const manifest = JSON.parse(read("tilda/manifest.json"));
  const allGenerated = `${head}\n${body}\n${footer}\n${schema}`;

  assert.doesNotMatch(
    allGenerated,
    /\b(?:src|href|poster)="(?:\.\/|assets\/|styles\.css|script\.js)/i,
  );
  assert.doesNotMatch(body, /<!doctype|<html\b|<head\b|<body\b/i);
  assert.doesNotMatch(body, /FAQ temporarily disabled|Вопрос №1/);
  assert.equal((body.match(/class="[^"]*psychologist-page/g) || []).length, 1);
  assert.equal((schema.match(/type="application\/ld\+json"/g) || []).length, 1);
  assert.equal(sourceSchema, schema);
  assert.ok(footer.includes(sourceJs));
  assert.match(head, /<style>[\s\S]*\.psychologist-page/);
  assert.doesNotMatch(head, /(^|\n):root\s*\{/);
  assert.doesNotMatch(head, /(^|\n)body\s*\{/);
  assert.doesNotMatch(head, /(^|\n)\*,\n\*::before/);
  assert.match(body, /data:image\/svg\+xml;base64,/);
  assert.equal(assetMap.alexeyVideo.url, alexeyVideoUrl);
  assert.equal(assetMap.alexeyVideo.ready, true);
  assert.equal(assetMap.yaroslavaVideo.url, yaroslavaVideoUrl);
  assert.equal(assetMap.yaroslavaVideo.ready, true);
  assert.match(
    body,
    new RegExp(
      `data-video-sources="${alexeyVideoUrl}\\|${yaroslavaVideoUrl}"`,
    ),
  );
  assert.doesNotMatch(body, /__TILDA_(?:ALEXEY|YAROSLAVA)_VIDEO_URL__/);
  assert.doesNotMatch(body, /\b(?:poster|data-video-posters)=/);
  assert.deepEqual(Object.keys(assetMap), ["alexeyVideo", "yaroslavaVideo"]);
  assert.match(
    transferReadme,
    /OG Title: «А что, если стать психологом\? Бесплатный разбор — АСП»/,
  );
  assert.match(
    transferReadme,
    /OG Description: «Бесплатный онлайн-разбор для тех, кто думает о профессии/,
  );
  assert.doesNotMatch(
    transferReadme,
    /OG Title: «А что, если стать психологом\?»;/,
  );

  for (const [key, asset] of Object.entries(assetMap)) {
    assert.match(asset.source, /^\.\/assets\//, key);
    assert.equal(typeof asset.ready, "boolean", key);
    assert.ok(asset.bytes > 0, key);
    assert.match(asset.sha256, /^[a-f0-9]{64}$/, key);

    if (!asset.ready) {
      assert.ok(body.includes(asset.placeholder), key);
    }
  }

  const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual(duplicateIds, []);

  const idSet = new Set(ids);
  const unresolvedAnchors = [
    ...body.matchAll(/<a\b[^>]*\bhref="#([^"#]+)"/g),
  ]
    .map((match) => match[1])
    .filter((id) => !idSet.has(id));
  assert.deepEqual(unresolvedAnchors, []);

  for (const [filename, metadata] of Object.entries(manifest.files)) {
    const content = read(`tilda/${filename}`);
    assert.equal(Buffer.byteLength(content), metadata.bytes, filename);
    assert.equal(
      crypto.createHash("sha256").update(content).digest("hex"),
      metadata.sha256,
      filename,
    );
  }
});
