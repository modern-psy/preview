import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const read = (relativePath) =>
  fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

const sourceHtml = read("index.html");
const sourceCss = read("styles.css");
const sourceJs = read("script.js");
const head = read("tilda/head.html");
const body = read("tilda/body.html");
const footer = read("tilda/footer.html");
const manifest = JSON.parse(read("tilda/manifest.json"));
const allGenerated = `${head}\n${body}\n${footer}`;

assert.doesNotMatch(
  allGenerated,
  /\b(?:src|href)="(?:assets\/|styles\.css|script\.js)/i,
);
assert.doesNotMatch(body, /<!doctype|<html\b|<head\b|<body\b/i);
assert.doesNotMatch(allGenerated, /application\/ld\+json|schema\.org/i);
assert.equal((body.match(/data-page="anti-crisis-conference"/g) || []).length, 1);
assert.equal((body.match(/id="bh-widget-button-root"/g) || []).length, 1);
assert.equal((head.match(/widget-button\.js/g) || []).length, 0);
assert.equal((body.match(/class="anti-crisis-svg-sprite"/g) || []).length, 1);
assert.match(sourceHtml, /<section class="section_speakers conference-anchor-target"/);
assert.doesNotMatch(sourceHtml, /section_speakers section-spacing/);
assert.equal(
  (sourceHtml.match(/class="conference-speakers_slide splide__slide"/g) || [])
    .length,
  13,
);
const speakerList = sourceHtml.match(
  /<ul class="conference-speakers_list splide__list">([\s\S]*?)<\/ul>/,
)?.[1];
assert.ok(speakerList);
assert.deepEqual(
  [...speakerList.matchAll(/<h3>([^<]+)<\/h3>/g)].map((match) => match[1]),
  [
    "Александр Затона",
    "Логинова Марина",
    "Кристина Шишкова",
    "Ксения Вавилова",
    "Роман Дубченко",
    "Иона Гусаченко",
    "Диана Рамазанова",
    "Ася Мкртчян",
    "Анна Шилова",
    "Александра Эммус",
    "Екатерина Исупова",
    "Анна Морозова",
    "Дарья Батищева",
  ],
);
assert.deepEqual(
  [...speakerList.matchAll(/--reveal-index: (\d+)/g)].map((match) => Number(match[1])),
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
);
assert.equal(
  (sourceHtml.match(/class="conference-partners_item"/g) || []).length,
  13,
);
assert.match(sourceHtml, /aria-label="АПДП"[\s\S]*?aria-label="Hungrie\.ru"/);
assert.match(
  sourceHtml,
  /aria-label="Hungrie\.ru"[\s\S]*?--partner-logo-width: 4\.875rem; --partner-logo-height: 5\.25rem/,
);
assert.match(
  sourceHtml,
  /class="conference-speakers_card-photo is-position-raised-subtle"\s+src="[^"]*asya-mkrtchyan-avata\.webp"/,
);
assert.match(
  sourceHtml,
  /class="conference-speakers_card-photo is-position-raised-subtle"\s+src="[^"]*anna-morozova-avatar\.webp"/,
);

for (const symbolId of [
  "anti-crisis-date-spark",
  "anti-crisis-benefit-star",
  "anti-crisis-practice-connector",
  "anti-crisis-registration-shape",
  "anti-crisis-speakers-arrow",
]) {
  assert.match(body, new RegExp(`<symbol id="${symbolId}"`));
  assert.match(body, new RegExp(`<use href="#${symbolId}"`));
}

assert.match(head, /intl-tel-input@29\.1\.2\/dist\/css\/intlTelInput\.css/);
assert.match(head, /@splidejs\/splide@4\.1\.4\/dist\/css\/splide-core\.min\.css/);
assert.match(head, /<style>[\s\S]*\.anti-crisis-page/);
assert.doesNotMatch(sourceCss, /^:root\s*\{/m);
assert.doesNotMatch(sourceCss, /^body\s*\{/m);
assert.doesNotMatch(sourceCss, /^\*\s*,/m);
assert.match(sourceCss, /\.section_topics\s*\{[\s\S]*?overflow:\s*visible/);
assert.doesNotMatch(sourceCss, /\.section_topics\s*\{\s*overflow:\s*clip;/);
assert.match(
  sourceCss,
  /\.conference-topics_heading-scene\.is-topics-motion-ready\s*\{[\s\S]*?clip-path:\s*inset\(0 -100vw -100vh -100vw\)/,
);
assert.match(sourceCss, /\.conference-speakers_arrow::before/);
assert.match(
  sourceCss,
  /\.conference-practice_connector > svg[\s\S]*?fill:\s*none !important/,
);
assert.match(
  sourceCss,
  /\.conference-speakers_arrow :is\(img, svg\)\s*\{[\s\S]*?display:\s*none !important/,
);
assert.match(
  body,
  /<symbol id="anti-crisis-practice-connector"[^>]*\bfill="none"/,
);
assert.doesNotMatch(sourceJs, /const offset = index \* staggerStep/);
assert.match(
  sourceHtml,
  /data-speakers-slider[\s\S]*?aria-keyshortcuts="ArrowLeft ArrowRight"[\s\S]*?tabindex="0"/,
);
assert.match(
  sourceCss,
  /\.conference-speakers_slider-viewport\s*\{[\s\S]*?overscroll-behavior-x:\s*contain/,
);
assert.match(
  sourceJs,
  /addEventListener\("wheel", handleSpeakerWheel,\s*\{\s*passive:\s*false/,
);
assert.match(
  sourceJs,
  /speakersKeyboardRegion\.addEventListener\("keydown", handleSpeakerKeydown\)/,
);
assert.match(sourceJs, /addEventListener\("pointerdown", focusSpeakerSlider\)/);
assert.match(sourceJs, /event\.key === "ArrowLeft"/);
assert.match(sourceJs, /event\.key === "ArrowRight"/);
assert.match(sourceJs, /keyboard:\s*false/);
assert.match(sourceJs, /wheel:\s*false/);
assert.match(sourceJs, /waitForTransition:\s*false/);
assert.match(sourceJs, /const wheelImpulseDelay = 96/);
assert.match(sourceJs, /wheelAwaitingFreshImpulse/);
assert.doesNotMatch(sourceJs, /wheelGestureMoved/);
assert.match(sourceJs, /removeEventListener\("wheel", handleSpeakerWheel\)/);
assert.match(
  sourceJs,
  /speakersKeyboardRegion\.removeEventListener\("keydown", handleSpeakerKeydown\)/,
);
assert.match(sourceJs, /removeEventListener\("pointerdown", focusSpeakerSlider\)/);

const splideScriptIndex = footer.indexOf(
  "@splidejs/splide@4.1.4/dist/js/splide.min.js",
);
const phoneScriptIndex = footer.indexOf(
  "intl-tel-input@29.1.2/dist/js/intlTelInput.min.js",
);
const projectScriptIndex = footer.indexOf("const TILDA_RECORDINGS_PRODUCT");

assert.ok(splideScriptIndex >= 0);
assert.ok(phoneScriptIndex > splideScriptIndex);
assert.ok(projectScriptIndex > phoneScriptIndex);

assert.match(
  sourceJs,
  /name: "Антикризисная конференция — записи всех выступлений"/,
);
assert.match(sourceJs, /price: 1999/);
assert.match(
  body,
  /href="#order:Антикризисная конференция — записи всех выступлений=1999"/,
);
assert.match(body, /data-conference-recordings-order/);
assert.match(sourceJs, /\[data-conference-recordings-order\]/);
assert.doesNotMatch(sourceJs, /document\.createElement\("a"\)/);
assert.match(sourceJs, /\.t706__orderform form/);
assert.match(sourceJs, /input\[name="Name"\]/);
assert.match(sourceJs, /input\[name="Email"\]/);
assert.match(sourceJs, /input\[name="Phone"\]/);
assert.match(sourceJs, /input\.t-input-phonemask/);
assert.match(sourceJs, /closest\("\.t-input-group_ph"\).*dataset\.inputReady === "true"/s);
assert.match(sourceJs, /window\.tcart\?\.products/);
assert.match(sourceJs, /t_form_phonemask__setValue/);
assert.match(sourceJs, /\.js-phonemask-result/);
assert.doesNotMatch(sourceJs, /\.t-input-group_ph input,/);
assert.doesNotMatch(sourceJs, /paymentsystem|formservices\[\]|requestSubmit\(|\.submit\(/);
assert.match(sourceJs, /initialCountry: "ru"/);
assert.match(sourceJs, /countryOrder: \["ru", "kz", "by", "uz"\]/);
assert.match(sourceJs, /separateDialCode: true/);
assert.match(sourceJs, /strictMode: true/);
assert.match(sourceJs, /conference:free-registration/);
assert.match(sourceJs, /conference:recordings-registration/);
assert.match(sourceJs, /__antiCrisisRegistrationCleanup/);
assert.doesNotMatch(`${sourceHtml}\n${sourceJs}\n${body}\n${footer}`, /Перейти в бота/);
assert.match(
  body,
  /data-registration-submit-label[^>]*>Зарегистрироваться<\/span>/,
);

for (const field of ["name", "email", "phone"]) {
  assert.match(
    body,
    new RegExp(`<input[^>]+name="${field}"[^>]+required`, "i"),
  );
}

const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
assert.deepEqual(duplicateIds, []);

const idSet = new Set(ids);
const localAnchors = [...body.matchAll(/\bhref="#([^"#]+)"/g)].map(
  (match) => match[1],
);
const unresolvedAnchors = localAnchors.filter(
  (id) => !id.startsWith("order:") && !idSet.has(id),
);
assert.deepEqual(unresolvedAnchors, []);

assert.equal((sourceHtml.match(/data-registration-form/g) || []).length, 1);
assert.equal((sourceHtml.match(/data-registration-phone/g) || []).length, 2);

for (const [filename, metadata] of Object.entries(manifest.files)) {
  const content = read(`tilda/${filename}`);
  assert.equal(Buffer.byteLength(content), metadata.bytes);
  assert.equal(
    crypto.createHash("sha256").update(content).digest("hex"),
    metadata.sha256,
  );
}

console.log("Tilda transfer bundle: ok");
