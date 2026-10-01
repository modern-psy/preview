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
  assets: path.join(projectRoot, "tilda-assets.json"),
};

const [sourceHtml, sourceCss, sourceJs, sourceSchema, sourceAssetConfig] =
  await Promise.all([
    fs.readFile(sourcePaths.html, "utf8"),
    fs.readFile(sourcePaths.css, "utf8"),
    fs.readFile(sourcePaths.js, "utf8"),
    fs.readFile(sourcePaths.schema, "utf8"),
    fs.readFile(sourcePaths.assets, "utf8"),
  ]);

const assetConfig = JSON.parse(sourceAssetConfig);
const bodyMatch = sourceHtml.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);

if (!bodyMatch) {
  throw new Error("The source document body could not be extracted.");
}

let body = bodyMatch[1]
  .replace(/\s*<script\b[^>]*\bsrc="\.\/script\.js[^\"]*"[^>]*><\/script>\s*/i, "")
  .replace(/\s*<!-- FAQ temporarily disabled[\s\S]*?-->\s*/i, "\n")
  .trim()
  .replace(/[ \t]+$/gm, "");

const toDataUrl = async (relativePath) => {
  const bytes = await fs.readFile(path.join(projectRoot, relativePath));
  return `data:image/svg+xml;base64,${bytes.toString("base64")}`;
};

const bodySvgPaths = [
  ...new Set(
    [...body.matchAll(/\b(?:src|href)="(\.\/assets\/[^\"]+\.svg)"/gi)].map(
      (match) => match[1],
    ),
  ),
];

for (const relativePath of bodySvgPaths) {
  body = body.replaceAll(relativePath, await toDataUrl(relativePath));
}

let tildaCss = sourceCss;
const cssSvgPaths = [
  ...new Set(
    [...tildaCss.matchAll(/url\(["']?(\.\/assets\/[^"')]+\.svg)["']?\)/gi)].map(
      (match) => match[1],
    ),
  ),
];

for (const relativePath of cssSvgPaths) {
  tildaCss = tildaCss.replaceAll(relativePath, await toDataUrl(relativePath));
}

tildaCss = tildaCss
  .replace(/(^|\n)([ \t]*):root\s*\{/g, "$1$2.psychologist-page {")
  .replace(
    /^\*,\n\*::before,\n\*::after\s*\{/m,
    ".psychologist-page,\n.psychologist-page *,\n.psychologist-page *::before,\n.psychologist-page *::after {",
  )
  .replace(/^html\s*\{/m, "html:has(.psychologist-page) {")
  .replace(/^body\s*\{/m, ".psychologist-page {")
  .trim();

const placeholderFor = (key) =>
  `__TILDA_${key.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()}_URL__`;
const assetMap = {};
const allowedTildaAssetHosts = new Set([
  "static.tildacdn.com",
  "optim.tildacdn.com",
]);

for (const [key, asset] of Object.entries(assetConfig)) {
  if (!asset.source?.startsWith("./assets/")) {
    throw new Error(`Invalid local source for Tilda asset ${key}.`);
  }

  const token = placeholderFor(key);
  const configuredUrl = String(asset.url || "").trim();

  if (configuredUrl) {
    let parsedUrl;

    try {
      parsedUrl = new URL(configuredUrl);
    } catch {
      throw new Error(`Invalid public URL for Tilda asset ${key}.`);
    }

    if (
      parsedUrl.protocol !== "https:" ||
      !allowedTildaAssetHosts.has(parsedUrl.hostname)
    ) {
      throw new Error(
        `Tilda asset ${key} must use an HTTPS URL from static.tildacdn.com or optim.tildacdn.com.`,
      );
    }
  }

  const publicUrl = configuredUrl || token;
  const absoluteSource = path.join(projectRoot, asset.source);
  const bytes = await fs.readFile(absoluteSource);

  body = body.replaceAll(asset.source, publicUrl);
  assetMap[key] = {
    source: asset.source,
    url: configuredUrl,
    placeholder: token,
    ready: Boolean(configuredUrl),
    bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  };
}

const head = `<!-- А что, если стать психологом: вставить в HEAD страницы Tilda -->
<link rel="preconnect" href="https://static.tildacdn.com" crossorigin>
<link rel="preconnect" href="https://optim.tildacdn.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400&amp;family=Wix+Madefor+Text:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>
${tildaCss}
</style>`;

const bodyFragment = `<!-- А что, если стать психологом: вставить целиком в один блок T123 -->
${body}`;

const footer = `<!-- А что, если стать психологом: вставить целиком в последний блок T123 -->
<script>
${sourceJs.trim()}
</script>`;

const readme = `# Перенос в Tilda

Пакет сгенерирован командой \`node build-tilda-bundle.mjs\`. Не редактируйте
файлы в этой папке вручную: меняйте исходные \`index.html\`, \`styles.css\`,
\`script.js\`, \`schema.org\` или \`tilda-assets.json\`, затем запускайте сборку.

## До переноса

1. Откройте \`asset-map.json\` и убедитесь, что у обоих видео указано
   \`ready: true\`.
2. При замене пары сначала загрузите оба новых видео в Tilda, впишите их
   абсолютные HTTPS Tilda CDN URL в \`tilda-assets.json\` и пересоберите пакет.
   Плейсхолдеры \`__TILDA_*_URL__\` нельзя оставлять на опубликованной странице.

## Куда вставлять

1. В «Настройки страницы → Дополнительно → HTML-код внутри HEAD» вставьте
   \`head.html\`, сохранив существующую аналитику.
2. Следом в тот же HEAD вставьте \`schema.html\` ровно один раз. Удалите старую
   JSON-LD-разметку страницы, если она уже была добавлена вручную.
3. Добавьте один блок T123 и вставьте в него \`body.html\`.
4. Добавьте последний T123 под BODY и вставьте \`footer.html\`.
5. В нативных настройках Tilda укажите:
   - Title: «А что, если стать психологом? Бесплатный разбор — АСП»;
   - Description: «Бесплатный онлайн-разбор для тех, кто думает о профессии
     психолога: проверьте, подходит ли она вам, и получите карту пути от
     обучения до первых клиентов.»;
   - Canonical: \`https://modern-psy.ru/how-to-enter-psy\`;
   - OG Title: «А что, если стать психологом? Бесплатный разбор — АСП»;
   - OG Description: «Бесплатный онлайн-разбор для тех, кто думает о профессии
     психолога: проверьте, подходит ли она вам, и получите карту пути от
     обучения до первых клиентов.»
6. OG image задаётся только в Tilda. Пакет намеренно не содержит \`og:image\`.

## Проверка после публикации

- Убедитесь, что дата отображается как «6 августа 2026, 19:00 (МСК)» и видео
  Бабурин → Саранчева переключаются без звука.
- Проверьте якоря, горизонтальную секцию, обе CTA-сетки, клавиатуру и reduced
  motion на ширинах 375, 768, 1024 и 1440px.
- Проверьте консоль, сетевые ошибки, overflow и отсутствие \`__TILDA_*_URL__\`.
- В исходном коде опубликованной страницы должен быть один \`h1\`, один
  canonical и один JSON-LD script.

Локальные SVG встроены в BODY/CSS как data URL. После заполнения
\`tilda-assets.json\` пакет не зависит от файлов репозитория или Vercel.
`;

const generatedFiles = {
  "head.html": `${head}\n`,
  "body.html": `${bodyFragment}\n`,
  "footer.html": `${footer}\n`,
  "schema.html": `${sourceSchema.trim()}\n`,
  "asset-map.json": `${JSON.stringify(assetMap, null, 2)}\n`,
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

if (/\b(?:src|href|poster)="(?:\.\/|assets\/|styles\.css|script\.js)/i.test(allGenerated)) {
  throw new Error("The Tilda package still contains a local runtime dependency.");
}

if (/<!doctype|<html\b|<head\b|<body\b/i.test(bodyFragment)) {
  throw new Error("The Tilda BODY file must remain a body fragment.");
}

if ((bodyFragment.match(/class="[^"]*psychologist-page/g) || []).length !== 1) {
  throw new Error("The generated BODY must contain exactly one project root.");
}

if ((sourceSchema.match(/type="application\/ld\+json"/g) || []).length !== 1) {
  throw new Error("The schema source must contain exactly one JSON-LD script.");
}

const ids = [...bodyFragment.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
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
  throw new Error(`The generated BODY has unresolved anchors: ${unresolvedAnchors.join(", ")}.`);
}

await fs.mkdir(outputRoot, { recursive: true });
await Promise.all(
  Object.entries(generatedFiles).map(([filename, content]) =>
    fs.writeFile(path.join(outputRoot, filename), content, "utf8"),
  ),
);

console.log(`Tilda bundle generated: ${Object.keys(generatedFiles).join(", ")}`);
