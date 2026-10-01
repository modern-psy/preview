import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const outputRoot = path.join(projectRoot, "tilda");
const sourcePaths = {
  html: path.join(projectRoot, "index.html"),
  css: path.join(projectRoot, "styles.css"),
  js: path.join(projectRoot, "script.js"),
  schema: path.join(projectRoot, "schema.org"),
};

const [sourceHtml, sourceCss, sourceJs, sourceSchema] = await Promise.all([
  fs.readFile(sourcePaths.html, "utf8"),
  fs.readFile(sourcePaths.css, "utf8"),
  fs.readFile(sourcePaths.js, "utf8"),
  fs.readFile(sourcePaths.schema, "utf8"),
]);

const bodyMatch = sourceHtml.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);

if (!bodyMatch) {
  throw new Error("The source document body could not be extracted.");
}

const bodyMarkup = bodyMatch[1]
  .replace(/\s*<script\b[^>]*\bsrc="\.\/script\.js"[^>]*><\/script>\s*/i, "")
  .replace(
    'href="./" aria-label="АСП — на главную"',
    'href="https://modern-psy.ru/" aria-label="АСП — на главную"',
  )
  .trim()
  .replace(/[ \t]+$/gm, "");

const tildaCss = sourceCss
  .replace(/^:root\s*\{/m, ".page-wrapper {")
  .replace(
    /^\*,\n\*::before,\n\*::after\s*\{/m,
    ".page-wrapper,\n.page-wrapper *,\n.page-wrapper *::before,\n.page-wrapper *::after {",
  )
  .replace(/^body\s*\{/m, ".page-wrapper {")
  .trim();

const head = `<!-- Мастерская контента: вставить в HEAD страницы Tilda -->
<link rel="preconnect" href="https://static.tildacdn.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Wix+Madefor+Text:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>
${tildaCss}
</style>
${sourceSchema.trim()}`;

const body = `<!-- Мастерская контента: вставить целиком в один блок T123 -->
${bodyMarkup}`;

const footer = `<!-- Мастерская контента: вставить целиком в последний блок T123 -->
<script>
${sourceJs.trim()}
</script>`;

const readme = `# Tilda transfer package

Сгенерировано командой \`node build-tilda-files.mjs\`. Не редактируйте файлы
в этой папке вручную: меняйте \`index.html\`, \`styles.css\`, \`script.js\` или
\`schema.org\` в корне проекта и сразу запускайте сборщик повторно.

## Куда вставлять

1. Откройте «Настройки страницы → Дополнительно → HTML-код для вставки внутрь
   HEAD» и добавьте туда содержимое \`head.html\` целиком. Файл уже содержит
   шрифт, всю scoped CSS страницы и единственный JSON-LD. Если старый CSS или
   JSON-LD мастерской уже вставлен вручную, сначала удалите его, чтобы не было
   дублей. Существующую аналитику Tilda сохраните.
2. Добавьте на страницу один блок T123 и вставьте в него \`body.html\` целиком.
3. Добавьте ещё один T123 самым последним блоком страницы и вставьте в него
   \`footer.html\` целиком. Он содержит весь JavaScript и должен идти после
   BODY-разметки.
4. Сохраните и опубликуйте страницу. Код T123 полноценно проверяется только на
   опубликованной странице, а не внутри редактора Tilda.

## После публикации

- Проверьте плавные якоря «Что внутри», «Результаты», «Куратор» и «Стоимость».
  Прокрутка должна останавливаться с отступом 80px и прерываться от
  колеса, касания или клавиши; при reduced motion переход должен быть мгновенным.
- Проверьте, что header, hero, центральный CTA и CTA результатов прокручивают к
  \`#price\`, а кнопки регистрации в цене и FAQ открывают попап GetCourse через
  \`#popup:getcourse\`.
- Проверьте FAQ, tabs, меню, сравнение видео, звук и CTA с клавиатуры.
- Проверьте ширины 375, 768, 1024 и 1440px, горизонтальный overflow, консоль и
  отсутствующие сетевые ресурсы.
- Убедитесь, что JSON-LD опубликован ровно один раз и содержит цену 9 900 RUB.

Все runtime-ассеты BODY используют Tilda CDN или inline SVG. Локальные файлы
репозитория загружать в Tilda отдельно не требуется.
`;

const generatedFiles = {
  "head.html": `${head}\n`,
  "body.html": `${body}\n`,
  "footer.html": `${footer}\n`,
  "README.md": readme,
};

generatedFiles["manifest.json"] = `${JSON.stringify(
  {
    files: Object.fromEntries(
      Object.entries(generatedFiles).map(([filename, content]) => [
        filename,
        {
          bytes: Buffer.byteLength(content),
          sha256: crypto.createHash("sha256").update(content).digest("hex"),
        },
      ]),
    ),
  },
  null,
  2,
)}\n`;

const allGenerated = Object.values(generatedFiles).join("\n");

if (/\b(?:src|href)="(?:\.\/|assets\/|styles\.css|script\.js)/i.test(allGenerated)) {
  throw new Error("The Tilda package still contains a local runtime dependency.");
}

if (/<!doctype|<html\b|<head\b|<body\b/i.test(body)) {
  throw new Error("The Tilda BODY file must remain a body fragment.");
}

if ((body.match(/class="page-wrapper"/g) || []).length !== 1) {
  throw new Error("The generated BODY must contain exactly one page root.");
}

if ((head.match(/type="application\/ld\+json"/g) || []).length !== 1) {
  throw new Error("The generated HEAD must contain exactly one JSON-LD script.");
}

if (!/color:\s*var\(--link-color, inherit\) !important/.test(head)) {
  throw new Error("The protected Tilda link-color rule is missing from HEAD.");
}

if (!/text-decoration:\s*none !important/.test(head)) {
  throw new Error("The protected Tilda link-decoration rule is missing from HEAD.");
}

if (!/\.page-wrapper :is\(ul, ol, li\)[\s\S]*?padding:\s*0 !important/.test(head)) {
  throw new Error("The protected Tilda list reset is missing from HEAD.");
}

if (!/:where\(\.page-wrapper button, \.page-wrapper a\)\s*\{\s*font:\s*inherit/.test(head)) {
  throw new Error("The low-specificity page-scoped font rule is missing from HEAD.");
}

if (/\.page-wrapper button,\s*\.page-wrapper a\s*\{\s*font:\s*inherit/.test(head)) {
  throw new Error("A high-specificity font rule would override Tilda component typography.");
}

const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

if (duplicateIds.length) {
  throw new Error(`The generated BODY has duplicate IDs: ${duplicateIds.join(", ")}.`);
}

const idSet = new Set(ids);
const localAnchors = [...body.matchAll(/<a\b[^>]*\bhref="#([^"#]+)"/g)].map(
  (match) => match[1],
);
const unresolvedAnchors = localAnchors.filter(
  (id) => !id.startsWith("popup:") && !idSet.has(id),
);

if (unresolvedAnchors.length) {
  throw new Error(
    `The generated BODY has unresolved anchors: ${unresolvedAnchors.join(", ")}.`,
  );
}

const finalCtaRoutes = [
  ['class="button is-nav" href="#price"', "header CTA → #price"],
  ['class="button is-primary" href="#price"', "hero CTA → #price"],
  ['class="button is-cta" href="#price"', "centered CTA → #price"],
  ['class="button is-tabs" href="#price"', "results CTA → #price"],
  [
    'class="button is-pricing" href="#popup:getcourse"',
    "pricing CTA → #popup:getcourse",
  ],
  [
    'class="button is-faq-primary" href="#popup:getcourse"',
    "FAQ CTA → #popup:getcourse",
  ],
];

for (const [fragment, label] of finalCtaRoutes) {
  if (!body.includes(fragment)) {
    throw new Error(`The final T123 route is missing: ${label}.`);
  }
}

if ((body.match(/href="#popup:getcourse"/g) || []).length !== 2) {
  throw new Error("The final T123 BODY must contain exactly two GetCourse popup links.");
}

await fs.mkdir(outputRoot, { recursive: true });
await Promise.all(
  Object.entries(generatedFiles).map(([filename, content]) =>
    fs.writeFile(path.join(outputRoot, filename), content, "utf8"),
  ),
);

await Promise.all(
  ["index.html", "styles.css", "script.js"].map((filename) =>
    fs.rm(path.join(outputRoot, filename), { force: true }),
  ),
);

console.log(
  `Tilda package generated: ${Object.keys(generatedFiles).join(", ")}`,
);
