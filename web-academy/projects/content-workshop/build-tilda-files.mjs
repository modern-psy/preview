// Сборщик пакета Тильды для «Мастерской профессионального контента».
// Переписан 12.11.2026 под посекционную передачу (web-academy/rules/engineering/tilda-delivery.md):
// каждая секция страницы — отдельный блок T123, стили и скрипты — отдельные блоки,
// в HEAD страницы только шрифт и JSON-LD. Один блок T123 вмещает около 65 000 символов.
//
// Исходники: index.html, styles.css, script.js, schema.org. Файлы в tilda/ не править руками.
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const outputRoot = path.join(projectRoot, "tilda");
const T123_LIMIT = 65000;
const T123_BUDGET = 60000;
const PART_ATTR = "data-content-workshop-part";

// Локальные файлы страницы → адреса на CDN. Тильда не видит файлы репозитория,
// поэтому у каждой картинки должна быть ссылка (S3 asp-media или Tilda CDN).
// Пустая строка — ссылки ещё нет: сборщик остановится и перечислит такие файлы.
// Ссылки на S3 прислала Дарья 12.11.2026, файлы совпадают с локальными байт в байт.
const assetUrls = {
  "./assets/case-andrey-gromov.webp": "https://s3.twcstorage.ru/asp-media/case_andrey_gromov_4efbfdc0bc.webp",
  "./assets/case-lera-shakhova.webp": "https://s3.twcstorage.ru/asp-media/case_lera_shakhova_9c5647f140.webp",
  "./assets/case-sasha-svanidze.webp": "https://s3.twcstorage.ru/asp-media/case_sasha_svanidze_474c825c79.webp",
  "./assets/content-video-poster.png": "https://s3.twcstorage.ru/asp-media/content_video_poster_e69708281b.png",
};

// Части страницы по порядку: как найти начало, короткое имя файла, название для комментария.
const partNames = [
  [/^<header class="nav_component"/, "header", "Шапка"],
  [/^<section class="section_hero/, "hero", "Первый экран"],
  [/^<div class="story_component"/, "chain", "Как блог приводит к записи"],
  [/^<section class="section_pain"/, "pain", "Что мешает публиковать"],
  [/^<section class="section_who"/, "who", "Для кого этот клуб"],
  [/^<section class="section_growth"/, "results", "Что меняется за время в клубе"],
  [/^<section class="section_cases"/, "cases", "Истории участников"],
  [/^<section class="section_cta is-reels"/, "reels", "Рилсы Романа"],
  [/^<section class="section_team"/, "team", "Кто стоит за клубом"],
  [/^<section class="section_week"/, "week", "Как проходит неделя в клубе"],
  [/^<section class="section_price"/, "price", "Что входит в подписку"],
  [/^<section class="section_trial"/, "trial", "Пробные дни"],
  [/^<section class="section_faq"/, "faq", "Частые вопросы"],
  [/^<footer class="footer_component"/, "footer", "Подвал"],
];

const fail = (message) => {
  throw new Error(message);
};

const [sourceHtml, sourceCss, sourceJs, sourceSchema] = await Promise.all(
  ["index.html", "styles.css", "script.js", "schema.org"].map((name) =>
    fs.readFile(path.join(projectRoot, name), "utf8"),
  ),
);

// ---------- разметка ----------
const bodyMatch = sourceHtml.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
if (!bodyMatch) fail("The source document body could not be extracted.");

let markup = bodyMatch[1]
  .replace(/\s*<script\b[^>]*\bsrc="\.\/script\.js"[^>]*><\/script>\s*/i, "")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace('class="nav_logo" href="./"', 'class="nav_logo" href="https://modern-psy.ru/"');

const missingAssets = [];
for (const [localPath, url] of Object.entries(assetUrls)) {
  if (!markup.includes(`"${localPath}"`)) continue;
  if (!url) missingAssets.push(localPath);
  else markup = markup.split(`"${localPath}"`).join(`"${url}"`);
}
if (missingAssets.length) {
  fail(
    `Нет ссылки на CDN для файлов: ${missingAssets.join(", ")}. ` +
      "Залейте их на S3 (asp-media) и впишите адреса в assetUrls в build-tilda-files.mjs.",
  );
}

// Делим страницу на части по отступам исходника: шапка и подвал на 6 пробелах,
// секции внутри <main> на 8.
const lines = markup.split("\n");
const parts = [];
for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i];
  const opening = line.match(/^( {6}| {8})<(header|footer|section|div)\b/);
  if (!opening) continue;
  const [, indent, tag] = opening;
  if (indent.length === 6 && tag !== "header" && tag !== "footer") continue;
  const closing = `${indent}</${tag}>`;
  const end = lines.findIndex((candidate, index) => index > i && candidate === closing);
  if (end === -1) fail(`Не найдено закрытие части, начатой строкой: ${line.trim()}`);
  const block = lines
    .slice(i, end + 1)
    .map((row) => (row.startsWith(indent) ? row.slice(indent.length) : row.trimStart()))
    .join("\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n");
  parts.push(block);
  i = end;
}

if (parts.length !== partNames.length) {
  fail(`Ожидалось ${partNames.length} частей страницы, найдено ${parts.length}.`);
}

const indentBlock = (text, spaces) =>
  text
    .split("\n")
    .map((row) => (row ? " ".repeat(spaces) + row : row))
    .join("\n");

const bodyFiles = parts.map((block, index) => {
  const [pattern, slug, title] = partNames[index];
  if (!pattern.test(block)) fail(`Часть ${index + 1} не похожа на «${title}».`);
  const number = String(index + 1).padStart(2, "0");
  const isMainSection = slug !== "header" && slug !== "footer";
  const inner = isMainSection
    ? `  <div class="main-wrapper">\n${indentBlock(block, 4)}\n  </div>`
    : indentBlock(block, 2);
  const content = `<!-- Секция ${number}: ${title} -->
<div class="page-wrapper" ${PART_ATTR}="${slug}">
${inner}
</div>
`;
  return { filename: `${number}-body-${slug}.html`, slug, title, content };
});

// ---------- стили ----------
const minifyCss = (css) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};,>])\s*/g, "$1")
    .replace(/:\s+/g, ":")
    .trim();

const scopedCss = `${sourceCss
  .replace(/^:root\s*\{/m, ".page-wrapper {")
  .replace(
    /^\*,\n\*::before,\n\*::after\s*\{/m,
    ".page-wrapper,\n.page-wrapper *,\n.page-wrapper *::before,\n.page-wrapper *::after {",
  )
  .replace(/^body\s*\{/m, ".page-wrapper {")}

/* Каждая часть страницы стоит в своём T123: обёртка не растягивается на экран */
[${PART_ATTR}] { min-height: 0; height: auto; }
`;

const splitTopLevel = (text, isBoundary) => {
  const pieces = [];
  let depth = 0;
  let quote = "";
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === quote && text[i - 1] !== "\\") quote = "";
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0 && isBoundary(i)) {
        pieces.push(text.slice(start, i + 1));
        start = i + 1;
      }
    } else if (ch === ";" && depth === 0) {
      pieces.push(text.slice(start, i + 1));
      start = i + 1;
    }
  }
  if (text.slice(start).trim()) pieces.push(text.slice(start));
  return pieces;
};

const packChunks = (pieces, glue) => {
  const chunks = [];
  let current = "";
  for (const piece of pieces) {
    if (current && current.length + glue.length + piece.length > T123_BUDGET) {
      chunks.push(current);
      current = piece;
    } else {
      current = current ? current + glue + piece : piece;
    }
  }
  if (current) chunks.push(current);
  return chunks;
};

const cssChunks = packChunks(splitTopLevel(minifyCss(scopedCss), () => true), "");
const styleFiles = cssChunks.map((chunk, index) => ({
  filename: `styles-${index + 1}.html`,
  content: `<!-- Стили страницы, часть ${index + 1} из ${cssChunks.length} -->\n<style>\n${chunk}\n</style>\n`,
}));
const allCss = cssChunks.join("");

// ---------- скрипты ----------
// Режем только между самостоятельными блоками: строка «})();» в начале строки.
const jsPieces = [];
let jsCurrent = [];
for (const row of sourceJs.trim().split("\n")) {
  jsCurrent.push(row);
  if (/^\}\)\(\);\s*$/.test(row)) {
    jsPieces.push(jsCurrent.join("\n"));
    jsCurrent = [];
  }
}
if (jsCurrent.join("").trim()) jsPieces.push(jsCurrent.join("\n"));
const jsChunks = packChunks(jsPieces, "\n");
const scriptFiles = jsChunks.map((chunk, index) => ({
  filename: jsChunks.length === 1 ? "scripts.html" : `scripts-${index + 1}.html`,
  content: `<!-- Скрипты страницы${jsChunks.length === 1 ? "" : `, часть ${index + 1} из ${jsChunks.length}`}: последний блок страницы -->\n<script>\n${chunk}\n</script>\n`,
}));

// ---------- HEAD ----------
const head = `<!-- Мастерская контента: вставить в HEAD страницы Tilda (шрифт и JSON-LD) -->
<link rel="preconnect" href="https://static.tildacdn.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Wix+Madefor+Text:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
${sourceSchema.trim()}
`;

// ---------- локальная проверка ----------
const preview = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Пакет Тильды: Мастерская контента</title>
<style>body { margin: 0; } /* в Тильде у body нет полей; только для этой проверки */</style>
${head}</head>
<body>
${[...styleFiles, ...bodyFiles, ...scriptFiles].map((file) => file.content).join("\n")}
</body>
</html>
`;

const t123Files = [...styleFiles, ...bodyFiles, ...scriptFiles];

const readme = `# Пакет Тильды: Мастерская профессионального контента

Сгенерировано командой \`npm run tilda:content-workshop\`. Файлы в этой папке
руками не править: меняйте \`index.html\`, \`styles.css\`, \`script.js\` или
\`schema.org\` в корне проекта и запускайте сборщик заново.

Страница передаётся по секциям: каждая часть — отдельный блок T123, один блок
вмещает не больше 65 000 символов.

## Куда вставлять

1. «Настройки страницы → Дополнительно → HTML-код для вставки внутрь HEAD»:
   содержимое \`head.html\`. Старый CSS и JSON-LD мастерской из HEAD удалить:
   теперь стили лежат в блоках T123, а дубль JSON-LD поисковик сочтёт ошибкой.
   Аналитику Тильды не трогать.
2. Удалить со страницы старые блоки T123 мастерской (прежние body и footer).
3. Добавить блоки T123 строго по порядку, у каждого верхний и нижний отступ 0:
${t123Files.map((file, index) => `   ${index + 1}. \`${file.filename}\``).join("\n")}
4. Опубликовать и проверить на опубликованной странице, не в редакторе.

## После публикации

- Якоря шапки и кнопок ведут к нужным блокам и не прячутся под шапкой.
- Кнопки в цене и в вопросах открывают попап GetCourse (\`#popup:getcourse\`).
- Кнопка «Воспользоваться пробным периодом» открывает окно с формой GetCourse
  (виджет 1682138); окно закрывается крестиком, Esc и кликом по фону.
- Рилсы играют без звука, кнопка звука работает.
- Между блоками нет лишних пустых промежутков.
- Ширины 375, 768, 1024 и 1440 px: без горизонтальной прокрутки, консоль чистая.
- JSON-LD опубликован один раз, цена в нём 7 900 RUB, как на странице.

Для проверки до переноса откройте \`preview.html\`: он собран из тех же файлов.
`;

const generatedFiles = {
  "head.html": head,
  ...Object.fromEntries(t123Files.map((file) => [file.filename, file.content])),
  "preview.html": preview,
  "README.md": readme,
};

generatedFiles["manifest.json"] = `${JSON.stringify(
  {
    order: ["head.html", ...t123Files.map((file) => file.filename)],
    files: Object.fromEntries(
      Object.entries(generatedFiles).map(([filename, content]) => [
        filename,
        {
          chars: content.length,
          bytes: Buffer.byteLength(content),
          sha256: crypto.createHash("sha256").update(content).digest("hex"),
        },
      ]),
    ),
  },
  null,
  2,
)}\n`;

// ---------- проверки ----------
const allGenerated = Object.values(generatedFiles).join("\n");
const allBody = bodyFiles.map((file) => file.content).join("\n");

if (/\b(?:src|href|poster)="(?:\.\/|assets\/|styles\.css|script\.js)/i.test(allGenerated)) {
  fail("The Tilda package still contains a local runtime dependency.");
}

for (const file of t123Files) {
  if (file.content.length >= T123_LIMIT) {
    fail(`${file.filename}: ${file.content.length} символов, больше лимита T123 ${T123_LIMIT}.`);
  }
}

for (const file of bodyFiles) {
  if (!/^<!-- Секция \d{2}: .+ -->\n/.test(file.content)) {
    fail(`${file.filename}: нет начального комментария секции.`);
  }
  if ((file.content.match(/class="page-wrapper"/g) || []).length !== 1) {
    fail(`${file.filename}: должна быть ровно одна обёртка .page-wrapper.`);
  }
  if (/<!doctype|<html\b|<head\b|<body\b|<script>/i.test(file.content)) {
    fail(`${file.filename}: в части страницы не должно быть документа или встроенных скриптов.`);
  }
}

if ((head.match(/type="application\/ld\+json"/g) || []).length !== 1) {
  fail("The generated HEAD must contain exactly one JSON-LD script.");
}
if (!/"price":\s*"7900"/.test(head)) {
  fail("JSON-LD price must match the page price 7 900 RUB.");
}

const protectedRules = [
  [/\.page-wrapper a,\.page-wrapper a:visited\{color:var\(--link-color,inherit\) !important;text-decoration:none !important/, "link color and decoration"],
  [/\.page-wrapper :is\(ul,ol,li\)\{margin:0 !important;padding:0 !important/, "list reset"],
  [/:where\(\.page-wrapper button,\.page-wrapper a\)\{font:inherit/, "low-specificity font rule"],
  [new RegExp(`\\[${PART_ATTR}\\]\\{min-height:0;height:auto`), "part height reset"],
];
for (const [pattern, label] of protectedRules) {
  if (!pattern.test(allCss)) fail(`The protected CSS rule is missing: ${label}.`);
}

const ids = [...allBody.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length) fail(`Duplicate IDs across parts: ${[...new Set(duplicateIds)].join(", ")}.`);

const idSet = new Set(ids);
const unresolvedAnchors = [...allBody.matchAll(/<a\b[^>]*\bhref="#([^"#]+)"/g)]
  .map((match) => match[1])
  .filter((id) => !id.startsWith("popup:") && !idSet.has(id));
if (unresolvedAnchors.length) fail(`Unresolved anchors: ${unresolvedAnchors.join(", ")}.`);

const routes = [
  [/class="button is-nav" href="#price"/, "header CTA → #price"],
  [/class="button is-primary" href="#price"/, "hero CTA → #price"],
  [/class="button is-secondary" href="#trial"/, "hero trial CTA → #trial"],
  [/class="button is-cta" href="#price"/, "reels CTA → #price"],
  [/class="button is-pricing[^"]*" href="#popup:getcourse"/, "pricing CTA → #popup:getcourse"],
  [/class="button is-faq-primary" href="#popup:getcourse"/, "FAQ CTA → #popup:getcourse"],
];
for (const [pattern, label] of routes) {
  if (!pattern.test(allBody)) fail(`The CTA route is missing: ${label}.`);
}
if ((allBody.match(/href="#popup:getcourse"/g) || []).length !== 2) {
  fail("The page must contain exactly two GetCourse popup links.");
}

// Форма GetCourse открывается окном по кнопке в блоке пробных дней; скрипт виджета подгружает script.js
const trialPart = bodyFiles.find((file) => file.slug === "trial").content;
if (!/<button class="button is-primary trial_button" type="button" data-trial-open/.test(trialPart) || !/<dialog class="trial_dialog"[^>]*data-trial-dialog/.test(trialPart)) {
  fail("The trial part must contain the trial button and the GetCourse dialog.");
}
if (/lk\.modern-psy\.ru\/pl\/lite\/widget/.test(allBody)) {
  fail("The GetCourse widget script must not be in the page parts: script.js loads it on demand.");
}
const allScriptsText = scriptFiles.map((file) => file.content).join("\n");
if ((allScriptsText.match(/https:\/\/lk\.modern-psy\.ru\/pl\/lite\/widget\/script\?id=1682138/g) || []).length !== 1) {
  fail("The GetCourse widget address must appear exactly once in the page scripts.");
}

// ---------- запись ----------
await fs.mkdir(outputRoot, { recursive: true });
const keep = new Set(Object.keys(generatedFiles));
for (const name of await fs.readdir(outputRoot)) {
  if (!keep.has(name) && /\.(html|md|json)$/.test(name)) {
    await fs.rm(path.join(outputRoot, name), { force: true });
  }
}
await Promise.all(
  Object.entries(generatedFiles).map(([filename, content]) =>
    fs.writeFile(path.join(outputRoot, filename), content, "utf8"),
  ),
);

console.log(
  `Tilda package generated: ${t123Files.length} T123 blocks ` +
    `(${styleFiles.length} styles, ${bodyFiles.length} sections, ${scriptFiles.length} scripts) + head.html`,
);
for (const file of t123Files) console.log(`  ${file.filename}: ${file.content.length} chars`);
