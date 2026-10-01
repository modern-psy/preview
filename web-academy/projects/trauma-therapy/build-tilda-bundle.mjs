import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(projectRoot, "../..");
const outputRoot = path.join(projectRoot, "tilda");
const sourcePaths = {
  html: path.join(projectRoot, "index.html"),
  projectCss: path.join(projectRoot, "styles.css"),
  projectJs: path.join(projectRoot, "script.js"),
  schema: path.join(projectRoot, "schema.org"),
  sharedCss: path.join(repositoryRoot, "shared/academy/components.css"),
  sharedJs: path.join(repositoryRoot, "shared/academy/components.js"),
  formCss: path.join(repositoryRoot, "shared/academy/lead-form.css"),
  formJs: path.join(repositoryRoot, "shared/academy/lead-form.js"),
};

const [sourceHtml, projectCssSource, projectJs, sourceSchema, sharedCss, sharedJs, formCss, formJs] =
  await Promise.all([
    fs.readFile(sourcePaths.html, "utf8"),
    fs.readFile(sourcePaths.projectCss, "utf8"),
    fs.readFile(sourcePaths.projectJs, "utf8"),
    fs.readFile(sourcePaths.schema, "utf8"),
    fs.readFile(sourcePaths.sharedCss, "utf8"),
    fs.readFile(sourcePaths.sharedJs, "utf8"),
    fs.readFile(sourcePaths.formCss, "utf8"),
    fs.readFile(sourcePaths.formJs, "utf8"),
  ]);

const [anchorCss, anchorJs] = await Promise.all(
  ['css', 'js'].map(ext => fs.readFile(path.join(repositoryRoot, `shared/academy/anchor-scroll.${ext}`), 'utf8')),
);
const graduationCss = await fs.readFile(path.join(repositoryRoot, "shared/academy/graduation.css"), "utf8");

const mainMatch = sourceHtml.match(/<main\b[^>]*>[\s\S]*?<\/main>/i);

if (!mainMatch) {
  throw new Error("The source document main landmark could not be extracted.");
}

let bodyMarkup = mainMatch[0]
  .replace(
    'class="main-wrapper"',
    'class="main-wrapper academy-page trauma-page"',
  )
  .trim()
  .replace(/[ \t]+$/gm, "");
let projectCss = projectCssSource;
const transparentPixel =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const normalizeAssetPath = (relativePath) => relativePath.replace(/^\.\//, "");
const toSvgDataUrl = async (relativePath) => {
  const normalizedPath = normalizeAssetPath(relativePath);

  if (!normalizedPath.startsWith("assets/") || !normalizedPath.endsWith(".svg")) {
    throw new Error(`Refusing to inline unexpected asset path: ${relativePath}.`);
  }

  const bytes = await fs.readFile(path.join(projectRoot, normalizedPath));

  return `data:image/svg+xml;base64,${bytes.toString("base64")}`;
};

const bodySvgPaths = [
  ...new Set(
    [...bodyMarkup.matchAll(/\b(?:src|href)="((?:\.\/)?assets\/[^"]+\.svg)"/gi)].map(
      (match) => match[1],
    ),
  ),
];
const bodySvgDataUrls = new Map();

for (const relativePath of bodySvgPaths) {
  const normalizedPath = normalizeAssetPath(relativePath);

  bodySvgDataUrls.set(normalizedPath, await toSvgDataUrl(relativePath));
  bodyMarkup = bodyMarkup.replaceAll(relativePath, transparentPixel);
}

const requiredBodySvgPaths = [
  "assets/cta/grid.svg",
  "assets/cta/grid-tall.svg",
  "assets/icons/slider-arrow-light.svg",
  "assets/icons/slider-arrow-muted.svg",
  "assets/icons/form-error.svg",
  "assets/icons/form-success.svg",
];

for (const relativePath of requiredBodySvgPaths) {
  if (!bodySvgDataUrls.has(relativePath)) {
    throw new Error(`The required Tilda BODY asset is missing: ${relativePath}.`);
  }
}

const inlineBodySvgCss = `
.trauma-page .cta_grid-scene:not(.is-tall) .cta_grid-image {
  background: url("${bodySvgDataUrls.get("assets/cta/grid.svg")}") center / 100% 100% no-repeat;
}

.trauma-page .cta_grid-scene.is-tall .cta_grid-image {
  background: url("${bodySvgDataUrls.get("assets/cta/grid-tall.svg")}") center / 100% 100% no-repeat;
}

.trauma-page .teachers_control-icon.is-active {
  background: url("${bodySvgDataUrls.get("assets/icons/slider-arrow-light.svg")}") center / contain no-repeat;
}

.trauma-page .teachers_control-icon.is-muted {
  background: url("${bodySvgDataUrls.get("assets/icons/slider-arrow-muted.svg")}") center / contain no-repeat;
}

.trauma-page .lead-form_state-icon.is-error {
  background: url("${bodySvgDataUrls.get("assets/icons/form-error.svg")}") center / contain no-repeat;
}

.trauma-page .lead-form_state-icon.is-success {
  background: url("${bodySvgDataUrls.get("assets/icons/form-success.svg")}") center / contain no-repeat;
}`;

const cssSvgPaths = [
  ...new Set(
    [
      ...projectCss.matchAll(
        /url\(["']?((?:\.\/)?assets\/[^"')]+\.svg)["']?\)/gi,
      ),
    ].map((match) => match[1]),
  ),
];

for (const relativePath of cssSvgPaths) {
  projectCss = projectCss.replaceAll(relativePath, await toSvgDataUrl(relativePath));
}

const minifiedBodyMarkup = bodyMarkup
  .replace(/\sdata-node-id="[^"]*"/g, "")
  .replace(/\s+/g, " ")
  .trim();

const head = `<!-- Терапия травмы: вставить целиком в HEAD страницы Tilda -->
<link rel="preconnect" href="https://static.tildacdn.com" crossorigin>
<link rel="preconnect" href="https://optim.tildacdn.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@700&amp;family=Wix+Madefor+Text:wght@400;500;600&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide-core.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/css/intlTelInput.css">
<style>
${sharedCss.trim()}

${graduationCss.trim()}

${anchorCss.trim()}

${formCss.trim()}

${projectCss.trim()}

${inlineBodySvgCss.trim()}
</style>`;

const body = `<!-- Терапия травмы: вставить целиком в один блок T123 -->
${minifiedBodyMarkup}`;

const footer = `<!-- Терапия травмы: вставить целиком в последний блок T123 -->
<script src="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/js/intlTelInput.min.js"></script>
<script>
${sharedJs.trim()}
</script>
<script>
${anchorJs.trim()}
${projectJs.trim()}
</script>
<script>
${formJs.trim()}
</script>`;

const readme = `# Перенос в Tilda

Пакет сгенерирован командой \`node build-tilda-bundle.mjs\`. Не редактируйте
файлы этой папки вручную: меняйте исходные \`index.html\`, \`styles.css\`,
\`script.js\`, \`schema.org\` или общие Academy-компоненты и пересобирайте пакет.

## Куда вставлять

1. В «Настройки страницы → Дополнительно → HTML-код для вставки внутрь HEAD»
   вставьте \`head.html\` целиком. Существующую аналитику Tilda сохраните, а
   предыдущую page-specific CSS этого лендинга удалите, чтобы не было дублей.
2. В тот же HEAD вставьте \`schema.html\` ровно один раз. Если на странице уже
   есть JSON-LD этого курса, сначала удалите старую версию.
3. Добавьте один блок T123 и вставьте в него \`body.html\` целиком. Header и
   footer остаются штатными блоками Tilda и в пакет не входят. BODY намеренно
   минифицирован до одной строки, а повторяющиеся SVG вынесены в CSS из HEAD,
   чтобы пройти ограничение объёма редактора T123; не форматируйте его перед
   вставкой. Обновляйте \`head.html\` и \`body.html\` одновременно: прозрачные
   SVG-заглушки BODY и фоновые SVG из HEAD составляют один комплект.
4. Оставьте на странице служебную нативную Tilda-форму с hidden-полем
   \`tildaspec-formname=trauma-therapy\` и настроенными получателями. Не меняйте
   имена полей \`Name\`, \`email\`, \`Phone\`, \`messenger-type\` и
   \`messenger-id\` без повторной проверки моста. Перед публикацией инспекцией
   DOM убедитесь, что все пять input действительно существуют с этими именами:
   подпись поля в редакторе не подтверждает runtime-контракт.
5. Добавьте последний T123 ниже служебной формы и вставьте \`footer.html\`.
   Splide и intl-tel-input загружаются до общего и проектного JavaScript.
6. Опубликуйте страницу: код T123 полноценно работает только на опубликованной
   странице, а не внутри редактора.

## SEO-настройки Tilda

- Title: «Терапия травмы: ПТСР и кПТСР — АСП».
- Description: «Обучение терапии ПТСР и кПТСР: оценка состояния,
  концептуализация случая, выбор интервенций и пересмотр терапевтического плана.»
- Canonical: \`https://modern-psy.ru/trauma-therapy\`.
- OG Title: «Терапия травмы: ПТСР и кПТСР — АСП».
- OG Description: используйте Description выше.
- OG image: \`https://static.tildacdn.com/tild6635-3339-4231-b461-326138626337/trauma-therapy-hero.webp\`,
  1680 × 938, alt «Специалисты обсуждают материалы для составления плана
  терапии».

## Проверка после публикации

- Плавные переходы к \`#registration\`, \`#application\` и заголовкам секций
  должны учитывать верхний отступ 112px, прерываться колесом, касанием или
  клавишей и становиться мгновенными при reduced motion.
- На ширинах 375, 520, 521, 767, 768, 1024 и 1440px проверьте overflow,
  клавиатуру, focus/hover, FAQ, программу, слайдер, CTA и обе сетки.
- Проверьте управляемые переносы: тире, короткие служебные слова, даты,
  длительности и цены не должны оставаться на новой строке отдельно; \`&nbsp;\`
  не должны создавать горизонтальный overflow.
- Убедитесь, что единственная видимая форма — кастомная, а её значения зеркально
  попадают в служебную Tilda-форму для MAX и Telegram. Кнопка должна начинать в
  disabled-состоянии и включаться только после валидного заполнения всех
  активных полей. Проверьте полный формат маски в \`Phone\` и
  \`messenger-id\`, а
  также пустые неактивные контакты.
- Отправьте по одной согласованной тестовой заявке для MAX и Telegram. Экран
  «Заявка отправлена» должен появиться только после реального
  \`tildaform:aftersuccess\`; ожидание само по себе не считается успехом.
  CAPTCHA Tilda является промежуточным loading-состоянием и проходится внутри
  того же workflow без преждевременного success или error.
- После каждого native success подтвердите, что соответствующая тестовая заявка
  появилась в настроенной CRM. Только matching event вместе с записью в CRM
  завершает end-to-end проверку.
- Проверьте консоль, отсутствующие сетевые ресурсы, один H1, один canonical и
  один JSON-LD script.
- Ссылка «Скачать полную программу» открывает Tilda-popup
  \`#form-download\`. Сохраните на странице popup с этой ссылкой-хуком и
  проверьте его открытие после публикации.

Все локальные SVG из BODY и CSS встроены как data URL. Остальные runtime-медиа
используют постоянные Tilda CDN URL; production не зависит от файлов репозитория.
`;

const generatedFiles = {
  "head.html": `${head}\n`,
  "body.html": `${body}\n`,
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
  /\b(?:src|href|poster)="(?:\.\/)?(?:assets\/|\.\.\/|styles\.css|script\.js|components\.(?:css|js))/i.test(
    allGenerated,
  ) ||
  /url\(["']?(?:\.\/)?assets\//i.test(allGenerated)
) {
  throw new Error("The Tilda package still contains a local runtime dependency.");
}

if (/localhost|127\.0\.0\.1/i.test(allGenerated)) {
  throw new Error("The Tilda package must not contain local preview URLs.");
}

if (/<!doctype|<html\b|<head\b|<body\b/i.test(body)) {
  throw new Error("The Tilda BODY file must remain a body fragment.");
}

if ((body.match(/class="[^"]*trauma-page/g) || []).length !== 1) {
  throw new Error("The generated BODY must contain exactly one project root.");
}

if ((body.match(/<main\b/g) || []).length !== 1) {
  throw new Error("The generated BODY must contain exactly one main landmark.");
}

if (body.length > 65000) {
  throw new Error(
    `The generated BODY is too large for the guarded T123 budget: ${body.length} characters.`,
  );
}

if ((sourceSchema.match(/type="application\/ld\+json"/g) || []).length !== 1) {
  throw new Error("The schema source must contain exactly one JSON-LD script.");
}

const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

if (duplicateIds.length) {
  throw new Error(`The generated BODY has duplicate IDs: ${duplicateIds.join(", ")}.`);
}

const idSet = new Set(ids);
const tildaOwnedAnchors = new Set(["form-download"]);
const unresolvedAnchors = [
  ...body.matchAll(/<a\b[^>]*\bhref="#([^"#]+)"/g),
]
  .map((match) => match[1])
  .filter((id) => !idSet.has(id) && !tildaOwnedAnchors.has(id));

if (unresolvedAnchors.length) {
  throw new Error(
    `The generated BODY has unresolved anchors: ${unresolvedAnchors.join(", ")}.`,
  );
}

await fs.mkdir(outputRoot, { recursive: true });
await Promise.all(
  Object.entries(generatedFiles).map(([filename, content]) =>
    fs.writeFile(path.join(outputRoot, filename), content, "utf8"),
  ),
);

console.log(`Tilda bundle generated: ${Object.keys(generatedFiles).join(", ")}`);
