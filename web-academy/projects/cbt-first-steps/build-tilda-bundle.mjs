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
  assets: path.join(projectRoot, "data/assets.json"),
};

const [sourceHtml, sourceCss, sourceJs, sourceSchema, sourceAssetRegistry] =
  await Promise.all([
    fs.readFile(sourcePaths.html, "utf8"),
    fs.readFile(sourcePaths.css, "utf8"),
    fs.readFile(sourcePaths.js, "utf8"),
    fs.readFile(sourcePaths.schema, "utf8"),
    fs.readFile(sourcePaths.assets, "utf8"),
  ]);

const assetRegistry = JSON.parse(sourceAssetRegistry);
const assetsByPath = new Map(
  assetRegistry.assets
    .filter((asset) => asset.canonical_path)
    .map((asset) => [asset.canonical_path, asset]),
);
const allowedTildaHosts = new Set([
  "static.tildacdn.com",
  "optim.tildacdn.com",
]);
const bodyMatch = sourceHtml.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);

if (!bodyMatch) {
  throw new Error("The source document body could not be extracted.");
}

const toSvgDataUrl = async (relativePath) => {
  const bytes = await fs.readFile(path.join(projectRoot, relativePath));
  return `data:image/svg+xml;base64,${bytes.toString("base64")}`;
};

const validateTildaUrl = (value, assetId) => {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid production URL for asset ${assetId}.`);
  }

  if (url.protocol !== "https:" || !allowedTildaHosts.has(url.hostname)) {
    throw new Error(
      `Asset ${assetId} must use an HTTPS URL from the Tilda CDN.`,
    );
  }

  return value;
};

const productionSourceFor = async (htmlPath) => {
  const canonicalPath = htmlPath.replace(/^\.\//, "");
  const asset = assetsByPath.get(canonicalPath);

  if (!asset) {
    throw new Error(`Missing asset registry entry for ${canonicalPath}.`);
  }

  const publicUrl = asset.tilda_cdn_url || asset.source_url;

  if (publicUrl) return validateTildaUrl(publicUrl, asset.id);
  if (canonicalPath.endsWith(".svg")) return toSvgDataUrl(canonicalPath);

  throw new Error(
    `Local raster asset ${asset.id} needs a permanent Tilda CDN URL.`,
  );
};

let body = bodyMatch[1].trim().replace(/[ \t]+$/gm, "");
const bodyAssetPaths = [
  ...new Set(
    [...body.matchAll(/\b(?:src|href)="(\.\/assets\/[^"]+)"/gi)].map(
      (match) => match[1],
    ),
  ),
];

for (const relativePath of bodyAssetPaths) {
  body = body.replaceAll(relativePath, await productionSourceFor(relativePath));
}

let tildaCss = sourceCss;
const cssAssetPaths = [
  ...new Set(
    [...tildaCss.matchAll(/url\(["']?(\.\/assets\/[^"')]+)["']?\)/gi)].map(
      (match) => match[1],
    ),
  ),
];

for (const relativePath of cssAssetPaths) {
  const canonicalPath = relativePath.replace(/^\.\//, "");

  if (!canonicalPath.endsWith(".svg")) {
    throw new Error(`CSS asset ${canonicalPath} must be an SVG data URL.`);
  }

  tildaCss = tildaCss.replaceAll(relativePath, await toSvgDataUrl(canonicalPath));
}

tildaCss = tildaCss
  .replace(
    /(^|\n)([ \t]*):root\s*\{/g,
    "$1$2.cbt-first-steps-page {",
  )
  .replace(
    /^\*,\n\*::before,\n\*::after\s*\{/m,
    ".cbt-first-steps-page,\n.cbt-first-steps-page *,\n.cbt-first-steps-page *::before,\n.cbt-first-steps-page *::after {",
  )
  .replace(/^html\s*\{/gm, "html:has(.cbt-first-steps-page) {")
  .replace(/^body\s*\{/gm, "body:has(.cbt-first-steps-page) {")
  .replace(/^:where\(/gm, ".cbt-first-steps-page :where(")
  .replace(/^a\s*\{/gm, ".cbt-first-steps-page a {")
  .trim();

const tildaProtectionCss = `
/* Page-scoped typography: variables live on the page root, not on Tilda body. */
body:has(.cbt-first-steps-page) {
  margin: 0;
  background: #eeeeef;
}

.cbt-first-steps-page {
  min-height: 100vh;
  background: var(--color-page-background);
  color: var(--color-text-primary);
  font-family: var(--font-family-body);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* Page-scoped protection against Tilda global link rules. */
.cbt-first-steps-page a.button {
  color: var(--color-surface-primary) !important;
  text-decoration: none !important;
}

.cbt-first-steps-page a.button.is-grant-cta {
  color: var(--color-surface-inverse) !important;
}

.cbt-first-steps-page :where(.footer_contact-link, .footer_social-link, .footer_legal a) {
  color: var(--color-text-primary) !important;
  text-decoration: none !important;
}

.cbt-first-steps-page :where(.footer_contact-link, .footer_legal a):hover {
  color: var(--color-text-muted) !important;
}

.cbt-first-steps-page .footer_social-link:hover {
  color: var(--color-text-primary) !important;
}`;

const minifyHtmlFragment = (html) =>
  html
    .replace(/<!--([\s\S]*?)-->/g, "")
    .split(/(<[^>]+>)/g)
    .map((token) =>
      token.startsWith("<")
        ? token.replace(/\s+/g, " ").replace(/\s+>/g, ">")
        : token.replace(/\s+/g, " "),
    )
    .join("")
    .replace(/>\s+</g, "><")
    .trim();

body = minifyHtmlFragment(body);

const head = `<!-- Первые шаги в КПТ: вставить целиком в HEAD страницы Tilda -->
<link rel="preconnect" href="https://static.tildacdn.com" crossorigin>
<link rel="preconnect" href="https://optim.tildacdn.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Wix+Madefor+Text:wght@400;500;600&amp;display=swap" rel="stylesheet">
<style>
${tildaCss}
${tildaProtectionCss}
</style>`;

const bodyFragment = `<!-- Первые шаги в КПТ: вставить целиком в один блок T123 -->${body}`;
const footer = `<!-- Первые шаги в КПТ: вставить целиком в последний блок T123 -->
<script>
${sourceJs.trim()}
</script>`;
const readme = `# Перенос в Tilda

Пакет сгенерирован командой \`node build-tilda-bundle.mjs\`. Не редактируйте
файлы этой папки вручную: меняйте исходные \`index.html\`, \`styles.css\`,
\`script.js\`, \`schema.org\` или \`data/assets.json\`, затем пересобирайте
пакет.

## Куда вставлять

1. В «Настройки страницы → Дополнительно → HTML-код для вставки внутрь HEAD»
   вставьте \`head.html\` целиком. Сохраните существующую аналитику Tilda и
   удалите предыдущие page-specific стили этого лендинга, чтобы не было дублей.
2. Следом в тот же HEAD вставьте \`schema.html\` ровно один раз. Если на
   странице уже есть JSON-LD этого курса, сначала удалите старую версию.
3. Добавьте один блок T123 и вставьте в него \`body.html\` целиком. В этот
   фрагмент уже входят header, основной контент и footer. BODY намеренно
   минифицирован в одну строку для лимита T123; не форматируйте его перед
   вставкой.
4. Добавьте последний T123 сразу после BODY и вставьте \`footer.html\`. Этот
   файл содержит проектный JavaScript для sticky-программы и текущего года.
5. Опубликуйте страницу: код T123 полноценно проверяется на опубликованной
   странице, а не только внутри редактора.

## SEO-настройки Tilda

- Page URL: \`cbt-first-steps\`.
- Title: «Первые шаги в КПТ — бесплатный мини-курс | АСП».
- Description: «Бесплатный мини-курс по когнитивно-поведенческой терапии:
  базовая модель КПТ, когнитивные искажения, работа с мыслями и практические
  техники.»
- Canonical: \`https://modern-psy.ru/cbt-first-steps\`.
- OG Title: «Первые шаги в КПТ — бесплатный мини-курс».
- OG Description: «Познакомьтесь с основами КПТ за 5 коротких уроков: изучите
  базовую модель, когнитивные искажения и техники для практической работы.»
- OG image не задаётся.

## Проверка после публикации

- На ширинах 375, 520/521, 767/768, 991/992, 1024 и 1440px проверьте overflow,
  sticky-программу, мобильные маски иллюстраций, footer, клавиатуру, hover/focus
  и reduced motion.
- Убедитесь, что CTA-якоря ведут к \`#programma\`, изображения загружаются, а в
  консоли и Network нет ошибок.
- В исходном коде опубликованной страницы должен быть один H1, один canonical
  и один JSON-LD script.
- Проверьте плавное уменьшение телефона и аватаров Academy-блока на диапазоне
  521–1439px. В двухколоночном диапазоне 992–1439px заголовки/body-текст
  карточек должны плавно меняться от 24/16px до 36/20px; композиция от 1440px
  должна оставаться без изменений.

Локальные SVG без постоянного CDN-адреса и все CSS-маски встроены как data URL.
WebP, фотографии и остальные изображения используют постоянные Tilda CDN URL;
production-пакет не зависит от файлов репозитория.
`;

const generatedFiles = {
  "head.html": `${head}\n`,
  "body.html": `${bodyFragment}\n`,
  "footer.html": `${footer}\n`,
  "schema.html": `${sourceSchema.trim()}\n`,
  "README.md": readme,
};

generatedFiles["manifest.json"] = `${JSON.stringify(
  {
    files: Object.fromEntries(
      Object.entries(generatedFiles).map(([filename, content]) => [
        filename,
        {
          bytes: Buffer.byteLength(content),
          characters: content.length,
          sha256: crypto.createHash("sha256").update(content).digest("hex"),
        },
      ]),
    ),
  },
  null,
  2,
)}\n`;

const allGenerated = Object.values(generatedFiles).join("\n");

if (
  /\b(?:src|href|poster)="(?:\.\/)?(?:assets\/|\.\.\/|styles\.css|script\.js)/i.test(
    allGenerated,
  ) ||
  /url\(["']?(?:\.\/)?assets\//i.test(allGenerated)
) {
  throw new Error("The Tilda package still contains a local runtime dependency.");
}

if (/localhost|127\.0\.0\.1/i.test(allGenerated)) {
  throw new Error("The Tilda package must not contain local preview URLs.");
}

if (/<!doctype|<html\b|<head\b|<body\b/i.test(bodyFragment)) {
  throw new Error("The Tilda BODY file must remain a body fragment.");
}

if ((bodyFragment.match(/class="[^"]*cbt-first-steps-page/g) || []).length !== 1) {
  throw new Error("The generated BODY must contain exactly one project root.");
}

if ((bodyFragment.match(/<main\b/g) || []).length !== 1) {
  throw new Error("The generated BODY must contain exactly one main landmark.");
}

if ((bodyFragment.match(/<h1\b/g) || []).length !== 1) {
  throw new Error("The generated BODY must contain exactly one H1.");
}

if (bodyFragment.length > 65000) {
  throw new Error(
    `The generated BODY is too large for the guarded T123 budget: ${bodyFragment.length} characters.`,
  );
}

if ((sourceSchema.match(/type="application\/ld\+json"/g) || []).length !== 1) {
  throw new Error("The schema source must contain exactly one JSON-LD script.");
}

const ids = [...bodyFragment.matchAll(/\bid="([^"]+)"/g)].map(
  (match) => match[1],
);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

if (duplicateIds.length) {
  throw new Error(`The generated BODY has duplicate IDs: ${duplicateIds.join(", ")}.`);
}

const idSet = new Set(ids);
const unresolvedAnchors = [
  ...bodyFragment.matchAll(/<a\b[^>]*\bhref="#([^"#]+)"/g),
]
  .map((match) => match[1])
  .filter((id) => !idSet.has(id));

if (unresolvedAnchors.length) {
  throw new Error(
    `The generated BODY has unresolved anchors: ${unresolvedAnchors.join(", ")}.`,
  );
}

const imageTags = [...bodyFragment.matchAll(/<img\b[^>]*>/g)].map(
  (match) => match[0],
);
const imagesWithoutAlt = imageTags.filter((tag) => !/\balt="[^"]*"/.test(tag));

if (imagesWithoutAlt.length) {
  throw new Error("Every generated image must keep an intentional alt value.");
}

await fs.mkdir(outputRoot, { recursive: true });
await Promise.all(
  Object.entries(generatedFiles).map(([filename, content]) =>
    fs.writeFile(path.join(outputRoot, filename), content, "utf8"),
  ),
);

console.log(
  `Tilda bundle generated: ${Object.keys(generatedFiles).join(", ")}`,
);
