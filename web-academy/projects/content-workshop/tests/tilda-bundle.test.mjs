// Регрессия пакета Тильды «Мастерской контента» (посекционная передача с 12.11.2026).
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import test from "node:test";

const read = (relativePath) =>
  fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
const exists = (relativePath) => fs.existsSync(new URL(`../${relativePath}`, import.meta.url));

const T123_LIMIT = 65000;

test("Tilda package is split by sections, scoped, and copy-paste ready", () => {
  const sourceCss = read("styles.css");
  const sourceJs = read("script.js");
  const sourceSchema = read("schema.org").trim();
  const manifest = JSON.parse(read("tilda/manifest.json"));
  const head = read("tilda/head.html");

  // Порядок вставки: HEAD, затем блоки T123
  assert.equal(manifest.order[0], "head.html");
  const t123 = manifest.order.slice(1);
  const styleFiles = t123.filter((name) => /^styles-\d+\.html$/.test(name));
  const bodyFiles = t123.filter((name) => /^\d{2}-body-[a-z]+\.html$/.test(name));
  const scriptFiles = t123.filter((name) => /^scripts(-\d+)?\.html$/.test(name));
  assert.deepEqual(t123, [...styleFiles, ...bodyFiles, ...scriptFiles]);
  assert.ok(styleFiles.length >= 1);
  assert.ok(scriptFiles.length >= 1);
  assert.equal(bodyFiles.length, 14);
  bodyFiles.forEach((name, index) => {
    assert.ok(name.startsWith(`${String(index + 1).padStart(2, "0")}-body-`), name);
  });

  // Манифест совпадает с файлами
  for (const [filename, metadata] of Object.entries(manifest.files)) {
    const content = read(`tilda/${filename}`);
    assert.equal(content.length, metadata.chars, filename);
    assert.equal(Buffer.byteLength(content), metadata.bytes, filename);
    assert.equal(
      crypto.createHash("sha256").update(content).digest("hex"),
      metadata.sha256,
      filename,
    );
  }

  // Лимит одного блока T123
  for (const name of t123) {
    assert.ok(read(`tilda/${name}`).length < T123_LIMIT, `${name} is over the T123 limit`);
  }

  const bodies = bodyFiles.map((name) => read(`tilda/${name}`));
  const allBody = bodies.join("\n");
  const allCss = styleFiles.map((name) => read(`tilda/${name}`)).join("\n");
  const allScripts = scriptFiles.map((name) => read(`tilda/${name}`)).join("\n");
  const allGenerated = [head, allCss, allBody, allScripts].join("\n");

  assert.doesNotMatch(
    allGenerated,
    /\b(?:src|href|poster)="(?:\.\/|assets\/|styles\.css|script\.js)/i,
  );

  for (const [index, body] of bodies.entries()) {
    assert.match(body, new RegExp(`^<!-- Секция ${String(index + 1).padStart(2, "0")}: .+ -->\\n`));
    assert.equal((body.match(/class="page-wrapper"/g) || []).length, 1, bodyFiles[index]);
    assert.match(body, /data-content-workshop-part="[a-z]+"/);
    assert.doesNotMatch(body, /<!doctype|<html\b|<head\b|<body\b|<script>/i);
  }

  // HEAD: шрифт и единственный JSON-LD, без стилей
  assert.equal((head.match(/type="application\/ld\+json"/g) || []).length, 1);
  assert.ok(head.includes(sourceSchema));
  assert.match(head, /"price":\s*"7900"/);
  assert.doesNotMatch(head, /<style>/);

  // Защита от глобальных стилей Тильды и сброс высоты частей
  assert.match(allCss, /\.page-wrapper a,\.page-wrapper a:visited\{color:var\(--link-color,inherit\) !important;text-decoration:none !important/);
  assert.match(allCss, /\.page-wrapper :is\(ul,ol,li\)\{margin:0 !important;padding:0 !important/);
  assert.match(allCss, /:where\(\.page-wrapper button,\.page-wrapper a\)\{font:inherit/);
  assert.match(allCss, /\[data-content-workshop-part\]\{min-height:0;height:auto/);

  // ID и якоря
  const ids = [...allBody.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(ids.filter((id, index) => ids.indexOf(id) !== index), []);
  const idSet = new Set(ids);
  assert.deepEqual(
    [...allBody.matchAll(/<a\b[^>]*\bhref="#([^"#]+)"/g)]
      .map((match) => match[1])
      .filter((id) => !id.startsWith("popup:") && !idSet.has(id)),
    [],
  );

  // Маршруты кнопок
  assert.equal((allBody.match(/href="#popup:getcourse"/g) || []).length, 2);
  assert.match(allBody, /class="button is-nav" href="#price"/);
  assert.match(allBody, /class="button is-primary" href="#price"/);
  assert.match(allBody, /class="button is-secondary" href="#trial"/);
  assert.match(allBody, /class="button is-cta" href="#price"/);
  assert.match(allBody, /class="button is-pricing[^"]*" href="#popup:getcourse"/);
  assert.match(allBody, /class="button is-faq-primary" href="#popup:getcourse"/);

  // Пробные дни: кнопка открывает окно, скрипт виджета GetCourse подгружается из скриптов страницы
  const trial = bodies[bodyFiles.findIndex((name) => name.endsWith("-body-trial.html"))];
  assert.match(trial, /<button class="button is-primary trial_button" type="button" data-trial-open/);
  assert.match(trial, /<dialog class="trial_dialog"[^>]*data-trial-dialog/);
  assert.doesNotMatch(allBody, /lk\.modern-psy\.ru\/pl\/lite\/widget/);
  assert.equal(
    (allScripts.match(/https:\/\/lk\.modern-psy\.ru\/pl\/lite\/widget\/script\?id=1682138/g) || []).length,
    1,
  );
  assert.match(allScripts, /StartWidget\$\{WIDGET_ID\}/);

  // Скрипты страницы и плавные якоря
  assert.match(allScripts, /__contentWorkshopAnchorScrollCleanup/);
  assert.match(sourceJs, /const duration = Math\.min\(900, Math\.max\(480/);
  assert.match(sourceJs, /const easedProgress = 1 - \(1 - progress\) \*\* 3/);
  assert.match(sourceJs, /anchorScrollInterruptEvents = \["wheel", "touchstart", "keydown"\]/);
  assert.match(sourceJs, /scrollMarginTop/);
  assert.match(sourceJs, /document\.querySelectorAll\("\.page-wrapper"\)/);
  assert.match(sourceCss, /scroll-margin-top:\s*5rem/);

  // Старые файлы прежней сборки одним блоком удалены
  for (const obsolete of ["body.html", "footer.html", "index.html", "styles.css", "script.js"]) {
    assert.equal(exists(`tilda/${obsolete}`), false, obsolete);
  }
});
