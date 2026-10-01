import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import test from "node:test";

const read = (relativePath) =>
  fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

const sourceHtml = read("index.html");
const sourceJs = read("../../shared/academy/anchor-scroll.js");
const formJs = fs.readFileSync(new URL("../../../shared/academy/lead-form.js", import.meta.url), "utf8");
const sourceSchema = read("schema.org");
const head = read("tilda/head.html");
const body = read("tilda/body.html");
const footer = read("tilda/footer.html");
const schema = read("tilda/schema.html");
const manifest = JSON.parse(read("tilda/manifest.json"));
const formContract = JSON.parse(read("data/form-contract.json"));
const allGenerated = `${head}\n${body}\n${footer}\n${schema}`;
const transparentPixel =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const schemaMatch = schema.match(
  /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/,
);

assert.ok(schemaMatch, "schema.html must contain one JSON-LD script");
const schemaData = JSON.parse(schemaMatch[1]);

test("Tilda package is self-contained and keeps the required library order", () => {
  assert.doesNotMatch(
    allGenerated,
    /\b(?:src|href|poster)="(?:\.\/)?(?:assets\/|\.\.\/|styles\.css|script\.js|components\.(?:css|js))/i,
  );
  assert.doesNotMatch(allGenerated, /url\(["']?(?:\.\/)?assets\//i);
  assert.doesNotMatch(allGenerated, /localhost|127\.0\.0\.1/i);
  assert.doesNotMatch(body, /<!doctype|<html\b|<head\b|<body\b/i);
  assert.equal((body.match(/class="[^"]*trauma-page/g) || []).length, 1);
  assert.equal((body.match(/<main\b/g) || []).length, 1);
  assert.ok(body.length < 65000, `body.html is ${body.length} characters`);
  assert.match(head, /@splidejs\/splide@4\.1\.4\/dist\/css\/splide-core\.min\.css/);
  assert.match(head, /intl-tel-input@29\.1\.2\/dist\/css\/intlTelInput\.css/);
  assert.match(head, /\.academy-page/);
  assert.match(head, /\.trauma-page/);
  assert.ok((head.match(/data:image\/svg\+xml;base64,/g) || []).length >= 8);
  assert.ok((body.match(/data:image\/gif;base64,/g) || []).length >= 16);
  assert.ok((body.split(transparentPixel).length - 1) >= 16);
  const transparentPixelBytes = Buffer.from(
    transparentPixel.slice(transparentPixel.indexOf(",") + 1),
    "base64",
  );
  const graphicControlIndex = transparentPixelBytes.indexOf(
    Buffer.from([0x21, 0xf9, 0x04]),
  );

  assert.ok(graphicControlIndex >= 0, "placeholder GIF must declare transparency");
  assert.equal(
    transparentPixelBytes[graphicControlIndex + 3] & 0x01,
    0x01,
    "placeholder GIF transparency flag must be enabled",
  );
  assert.doesNotMatch(
    body,
    /R0lGODlhAQABAIAAAAAAAP\/\/\/ywAAAAAAQABAAACAUwAOw==/,
  );
  assert.doesNotMatch(body, /data:image\/svg\+xml;base64,/);
  assert.match(head, /a\.button\.is-accent\s*\{[^}]*color:[^;]+!important/s);
  assert.match(head, /button\.lead-form_submit\s*\{[^}]*color:[^;]+!important/s);
  assert.match(
    head,
    /\.academy-showcase_heading span\s*\{[^}]*display:\s*inline;/s,
  );

  const splideIndex = footer.indexOf(
    "@splidejs/splide@4.1.4/dist/js/splide.min.js",
  );
  const phoneIndex = footer.indexOf(
    "intl-tel-input@29.1.2/dist/js/intlTelInput.min.js",
  );
  const sharedIndex = footer.indexOf("__academyComponentsCleanup");
  const anchorIndex = footer.indexOf("__academyAnchorScrollCleanup");
  const formIndex = footer.indexOf("__academyLeadFormCleanup");

  assert.ok(splideIndex >= 0);
  assert.ok(phoneIndex > splideIndex);
  assert.ok(sharedIndex > phoneIndex);
  assert.ok(anchorIndex > sharedIndex);
  assert.ok(formIndex > anchorIndex);
});

test("same-page anchors are complete and use the interruptible motion contract", () => {
  assert.match(sourceJs, /__academyAnchorScrollCleanup/);
  assert.match(sourceJs, /prefers-reduced-motion: reduce/);
  assert.match(sourceJs, /interruptEvents = \['wheel', 'touchstart', 'pointerdown', 'keydown'/);
  assert.match(sourceJs, /window\.history\.pushState/);
  assert.match(sourceJs, /window\.history\.replaceState/);
  assert.match(sourceJs, /scrollMarginTop/);
  assert.match(head, /--anchor-scroll-offset:\s*7rem/);

  const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

  assert.deepEqual(duplicateIds, []);

  const idSet = new Set(ids);
  const tildaOwnedAnchors = new Set(["form-download"]);
  const unresolvedAnchors = [
    ...body.matchAll(/<a\b[^>]*\bhref="#([^"#]+)"/g),
  ]
    .map((match) => match[1])
    .filter((id) => !idSet.has(id) && !tildaOwnedAnchors.has(id));

  assert.deepEqual(unresolvedAnchors, []);
  assert.doesNotMatch(body, /href="#"(?:\s|>)/);
  assert.match(
    body,
    /href="#form-download"[^>]*data-program-download[^>]*data-tilda-popup-link/,
  );
  assert.match(sourceJs, /link\.hasAttribute\("data-tilda-popup-link"\)/);
});

test("native Tilda form bridge and custom field contract remain intact", () => {
  assert.match(body, /data-tilda-form-name="trauma-therapy"/);
  assert.match(body, /data-lead-submit disabled/);
  assert.match(body, /data-lead-success hidden/);
  assert.match(body, /id="lead-form-success-heading"/);
  assert.match(formJs, /input\[name="tildaspec-formname"\]/);
  assert.match(formJs, /input\[name="Name"\]/);
  assert.match(formJs, /input\[name="email"\]/);
  assert.match(formJs, /fillTildaPhoneGroup\(phoneGroup, formData\.phone, "Phone"\)/);
  assert.match(formJs, /formattedPhone \|\| e164Phone/);
  assert.match(formJs, /name="messenger-type"/);
  assert.match(formJs, /name="messenger-id"/);
  assert.match(formJs, /input\[name="messenger-id"\]:not\(\[type="hidden"\]\):not\(:disabled\)/);
  assert.match(formJs, /selectedRadio\.value = "max"/);
  assert.match(formJs, /radio\.value === "telegram"/);
  assert.match(formJs, /submit\.disabled = busy \|\| !formIsValid/);
  assert.match(formJs, /tildaform:aftersuccess/);
  assert.match(formJs, /form\.dataset\.state = "success"/);
  assert.doesNotMatch(formJs, /resetBusyTimer/);
  assert.doesNotMatch(formJs, /Данные переданы в Tilda/);
  assert.match(formJs, /record\.hidden = true/);
});

test("documented lead-data contract matches the source and native bridge", () => {
  assert.equal(formContract.project, "trauma-therapy");
  assert.equal(formContract.custom_form.selector, "[data-academy-lead-form]");
  assert.deepEqual(formContract.native_tilda_form.discovery, {
    field: "tildaspec-formname",
    value: "trauma-therapy",
  });
  assert.deepEqual(formContract.native_tilda_form.required_field_names, [
    "Name",
    "email",
    "Phone",
    "messenger-type",
    "messenger-id",
  ]);

  for (const field of formContract.custom_form.fields) {
    assert.match(
      sourceHtml,
      new RegExp(`name=["']${field.name}["']`),
      `custom field ${field.name} must exist in index.html`,
    );
  }

  for (const fieldName of formContract.native_tilda_form.required_field_names) {
    assert.match(
      formJs,
      new RegExp(fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `native field ${fieldName} must remain in the bridge`,
    );
  }

  assert.deepEqual(
    formContract.messenger_mapping.map((channel) => channel.custom_value),
    ["max", "telegram"],
  );
  assert.equal(formContract.lifecycle.timeout_is_success, false);
  assert.equal(
    formContract.transport_and_storage.direct_project_network_request,
    false,
  );
  assert.equal(formContract.transport_and_storage.project_browser_storage, false);
  assert.match(formJs, /academy-lead-form:validated/);
  assert.doesNotMatch(
    formJs,
    /fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie/,
  );
  assert.equal(
    formContract.lifecycle.success_event,
    "matching tildaform:aftersuccess from the submitted native form",
  );
  assert.deepEqual(formContract.production_verification.scenarios, [
    "max",
    "telegram",
  ]);
});

test("schema matches the canonical course, teachers, price, and visible FAQ", () => {
  assert.equal(schema, sourceSchema);
  assert.equal(schemaData["@context"], "https://schema.org");

  const graph = schemaData["@graph"];
  const byType = (type) => graph.filter((node) => node["@type"] === type);
  const webpage = byType("WebPage")[0];
  const course = byType("Course")[0];
  const courseInstance = byType("CourseInstance")[0];
  const faq = byType("FAQPage")[0];

  assert.equal(webpage.url, "https://modern-psy.ru/trauma-therapy");
  assert.equal(
    webpage.name,
    "Терапия травмы: ПТСР и кПТСР — курс для психологов",
  );
  assert.equal(
    webpage.description,
    "Научитесь оценивать состояние, строить концептуализацию случая и выбирать интервенции при ПТСР и кПТСР. 120 академических часов, практика и супервизии.",
  );
  assert.equal(course.name, "Терапия травмы: ПТСР и кПТСР");
  assert.equal(courseInstance.startDate, "2026-11-24");
  assert.equal(courseInstance.courseWorkload, "120 академических часов");
  assert.equal(courseInstance.offers.price, "65000");
  assert.equal(courseInstance.offers.priceCurrency, "RUB");

  const normalizeText = (value) =>
    value
      .replace(/&nbsp;/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.:;!?])/g, "$1")
      .trim();
  const visibleFaqItems = [
    ...sourceHtml.matchAll(
      /<details class="faq_item accordion_item"[^>]*>([\s\S]*?)<\/details>/g,
    ),
  ].map((match) => match[1]);
  const visibleFaqQuestions = visibleFaqItems.map((item) => {
    const question = item.match(
      /<h3 class="faq_question-heading">([\s\S]*?)<\/h3>/,
    );

    assert.ok(question, "every FAQ item must expose its question as an H3");
    return normalizeText(question[1]);
  });
  const visibleFaqAnswers = visibleFaqItems.map((item) => {
    const answer = item.match(
      /<div class="faq_answer-inner accordion_panel-inner">([\s\S]*?)<\/div>/,
    );

    assert.ok(answer, "every FAQ item must contain a crawlable answer");
    return normalizeText(answer[1]);
  });
  const schemaFaqQuestions = faq.mainEntity.map((question) => question.name);
  const schemaFaqAnswers = faq.mainEntity.map(
    (question) => question.acceptedAnswer.text,
  );

  assert.deepEqual(schemaFaqQuestions, visibleFaqQuestions);
  assert.deepEqual(schemaFaqAnswers, visibleFaqAnswers);

  const visibleTeachers = [
    ...sourceHtml.matchAll(/<h3 class="teacher-card_name">([^<]+)<\/h3>/g),
  ].map((match) => normalizeText(match[1]));
  const peopleById = new Map(
    byType("Person").map((person) => [person["@id"], person.name]),
  );
  const schemaTeachers = courseInstance.instructor.map((person) =>
    peopleById.get(person["@id"]),
  );

  assert.deepEqual(schemaTeachers, visibleTeachers);
});

test("source and Tilda body preserve the semantic content hierarchy", () => {
  assert.equal((body.match(/<h1\b/g) || []).length, 1);
  assert.equal(
    (body.match(/<h3 class="program-module_title">/g) || []).length,
    4,
  );
  assert.equal(
    (body.match(/<h4 class="program-module_topic-heading">/g) || []).length,
    6,
  );
  assert.equal(
    (body.match(/<h3 class="faq_question-heading">/g) || []).length,
    11,
  );
  assert.match(body, /<time datetime="2026-11-24">24&nbsp;ноября<\/time>/);
  assert.match(body, /<span lang="la">in vivo<\/span>/);
});

test("icon cards share one spacing contract and the hero statistic matches Figma", () => {
  for (const markup of [sourceHtml, body]) {
    const iconCards = [
      ...markup.matchAll(
        /<li class="card_component([^"]*)"[^>]*>\s*<span class="card_icon"/g,
      ),
    ];

    assert.ok(iconCards.length >= 15);
    for (const card of iconCards) {
      assert.match(card[1], /\bis-spacious\b/);
    }

    assert.match(markup, /<data class="stat-card_value" value="120"[^>]*>120<\/data>/);
    assert.match(
      markup,
      /<span class="stat-card_label"[^>]*>\s*<span>академических часов<\/span>\s*<span>полноценного обучения<\/span>\s*<\/span>/,
    );
  }

  assert.match(sourceHtml, /data-node-id="108:388"/);
  assert.match(sourceHtml, /data-node-id="108:389"/);
  assert.match(sourceHtml, /data-node-id="108:390"/);

  assert.match(
    head,
    /\.stat-card_label\s*\{[^}]*font-size:\s*var\(--stat-card-label-size,\s*var\(--text-body-size\)\)/s,
  );
  assert.match(head, /--stat-card-label-size:\s*clamp\(1rem,\s*2\.016vw,\s*1\.125rem\)/);
});

test("Russian typography preserves critical non-breaking pairs", () => {
  assert.ok((sourceHtml.match(/&nbsp;/g) || []).length >= 300);
  assert.ok((body.match(/&nbsp;/g) || []).length >= 300);

  const visibleTextNodes = [...sourceHtml.matchAll(/>([^<>]+)</g)].map(
    (match) => match[1],
  );

  for (const textNode of visibleTextNodes) {
    assert.doesNotMatch(textNode, /\s—/u);
    assert.doesNotMatch(
      textNode,
      /(?:^|\s)(?:а|в|и|к|о|с|у|я|во|до|за|из|на|не|ни|но|об|от|по|со|без|для|над|под|при|про)\s+(?=[А-Яа-яЁёA-Za-z0-9])/iu,
    );
  }

  for (const markup of [sourceHtml, body]) {
    assert.match(markup, /травмы&nbsp;— от&nbsp;понимания случая/);
    assert.match(
      markup,
      /Ближайший старт потока&nbsp;— <time datetime="2026-11-24">/,
    );
    assert.match(
      markup,
      /От&nbsp;неопределённости&nbsp;— <span class="section-intro_accent">/,
    );
    assert.match(
      markup,
      /Психологии&nbsp;— <span>от&nbsp;интереса\s+к&nbsp;практике<\/span>/,
    );
    assert.match(markup, /65&nbsp;000&nbsp;₽/);
    assert.match(markup, /24&nbsp;ноября/);
  }
});

test("manifest checksums match every generated deliverable", () => {
  for (const [filename, metadata] of Object.entries(manifest.files)) {
    const content = read(`tilda/${filename}`);

    assert.equal(Buffer.byteLength(content), metadata.bytes);
    assert.equal(
      crypto.createHash("sha256").update(content).digest("hex"),
      metadata.sha256,
    );
  }
});
