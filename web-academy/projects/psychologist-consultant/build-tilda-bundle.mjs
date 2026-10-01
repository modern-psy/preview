import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {assertResponsiveContract} from '../../shared/academy/responsive.mjs';
import {splitTildaBody, splitTildaScripts, splitTildaStyles, fragmentName, T123_LIMIT} from './tilda-fragments.mjs';
await import('./render-hero.mjs');
await import('./render-pricing.mjs');
await import('./render-admission.mjs');
await import('./render-ratings.mjs');
await import('./render-recognition.mjs');
await import('./render-adaptive-sections.mjs');
await import('./render-program.mjs');
await import('./render-learning-timeline.mjs');
await import('./render-trial-lectures.mjs');
await import('./render-support-team.mjs');
await import('./render-diploma.mjs');
await import('./render-graduation.mjs');
await import('./render-lead-form.mjs');
await import('./render-academy-showcase.mjs');
await import('./render-faq.mjs');
await import('./render-reviews.mjs');
const {teacherDataModule, teacherAssetsHead, teacherPhotoCss, teacherCss, teacherRuntime, teacherSection} = await import('./teachers/build-tilda.mjs');
await import('./render-actions.mjs');
await import('./build-seo.mjs');

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, '../..');
const output = path.join(root, 'tilda');
const previewOnly = process.argv.includes('--preview-only');
const read = (name) => fs.readFile(path.join(root, name), 'utf8');
const [html, css, sharedCss, sharedJs, actions, ratingsCss, formCss, formJs, heroCss, admissionCss, sectionHeadingCss, pricingCss, pricingJs] = await Promise.all([
  read('index.html'), read('styles.css'),
  fs.readFile(path.join(repo, 'shared/academy/components.css'), 'utf8'),
  fs.readFile(path.join(repo, 'shared/academy/components.js'), 'utf8'),
  read('data/actions.json').then(JSON.parse),
  fs.readFile(path.join(repo, 'shared/academy/ratings.css'), 'utf8'),
  fs.readFile(path.join(repo, 'shared/academy/lead-form.css'), 'utf8'),
  fs.readFile(path.join(repo, 'shared/academy/lead-form.js'), 'utf8'),
  fs.readFile(path.join(repo, 'shared/academy/hero.css'), 'utf8'),
  fs.readFile(path.join(repo, 'shared/academy/admission.css'), 'utf8'),
  fs.readFile(path.join(repo, 'shared/academy/section-heading.css'), 'utf8'),
  fs.readFile(path.join(repo, 'shared/academy/pricing.css'), 'utf8'),
  fs.readFile(path.join(repo, 'shared/academy/pricing.js'), 'utf8'),
]);

let reviewCss = (await Promise.all(['card-spacing', 'anchor-scroll', 'benefits', 'review-controls', 'review-panel', 'review-card', 'reviews', 'reviews-responsive', 'graduation', 'graduation-responsive', 'diploma', 'lead-form-responsive', 'section-spacing', 'icon-card', 'body-text', 'recognition', 'cta-responsive', 'practice-path', 'button', 'program', 'learning-timeline', 'trial-lectures', 'academy-showcase-responsive', 'team-card', 'support-team', 'toggle-icon', 'faq-responsive'].map(name => fs.readFile(path.join(repo, `shared/academy/${name}.css`), 'utf8')))).join('\n');
for (const match of reviewCss.matchAll(/url\(["']?(\.\/assets\/[^"')]+\.svg)["']?\)/g)) {
  const bytes = await fs.readFile(path.join(repo, 'shared/academy', match[1]));
  reviewCss = reviewCss.replaceAll(match[0], `url("data:image/svg+xml;base64,${bytes.toString('base64')}")`);
}
const reviewJs = (await Promise.all(['anchor-scroll', 'review-panel', 'review-card', 'learning-timeline'].map(name => fs.readFile(path.join(repo, `shared/academy/${name}.js`), 'utf8')))).join('\n');
let body = html.match(/<main\b[\s\S]*?<\/main>/)?.[0];
if (!body) throw new Error('Missing main landmark.');
body = body.replace(/<script\b[^>]*id="consultant-teachers-data"[^>]*>[\s\S]*?<\/script>/, '');
body = body.replace(/<section class="section_teachers\b[\s\S]*?<\/section>/, () => teacherSection);
// Repeated decorative grids belong in HEAD once, keeping the T123 BODY small.
const grid = await fs.readFile(path.join(root, 'assets/cta/grid.svg'));
const gridCss = `.psychologist-consultant-page .cta_grid-image{background:url("data:image/svg+xml;base64,${grid.toString('base64')}") center/100% 100% no-repeat}`;
body = body.replace(/<img\b(?=[^>]*class="cta_grid-image")(?=[^>]*src="assets\/cta\/grid\.svg")[^>]*>/g, '<span class="cta_grid-image" aria-hidden="true"></span>');
// Decorative local SVGs live once in HEAD. Keep the actual images transparent,
// with explicit dimensions and semantics; this preserves the single-T123 budget.
const transparent = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const svgRules = [];
const svgSources = new Map();
for (const match of [...body.matchAll(/<img\b[^>]*src="(assets\/[^\"]+\.svg)"[^>]*>/g)]) {
  
  const file = path.resolve(root, match[1]);
  if (!file.startsWith(path.join(root, 'assets') + path.sep)) throw new Error('Invalid asset path.');
  if (!svgSources.has(match[1])) {
    const id = `svg-${svgSources.size + 1}`;
    svgSources.set(match[1], id);
    const bytes = await fs.readFile(file);
    svgRules.push(`.psychologist-consultant-page [data-tilda-svg="${id}"]{background:url("data:image/svg+xml;base64,${bytes.toString('base64')}") center/contain no-repeat}`);
  }
  const replacement = /\balt=""/.test(match[0])
    ? `<span class="${match[0].match(/class="([^"]+)"/)?.[1] || 'tilda-icon_intrinsic'}" data-tilda-svg="${svgSources.get(match[1])}" aria-hidden="true"></span>`
    : match[0].replace(`src="${match[1]}"`, `src="${transparent}" data-tilda-svg="${svgSources.get(match[1])}"`);
  body = body.replace(match[0], replacement);
}
for (const match of [...body.matchAll(/src="(assets\/[^"]+\.svg)"/g)]) {
  const file = path.resolve(root, match[1]);
  if (!file.startsWith(path.join(root, 'assets') + path.sep)) throw new Error('Invalid asset path.');
  const bytes = await fs.readFile(file);
  body = body.replaceAll(`src="${match[1]}"`, `src="data:image/svg+xml;base64,${bytes.toString('base64')}"`);
}
// Локальные webp по умолчанию не инлайнятся: для каждого нужна постоянная CDN-ссылка.
// Явное исключение только с флагом --allow-local-webp, и даже тогда каждый файл выводится в stderr.
const allowLocalWebp = process.argv.includes('--allow-local-webp');
const localWebpMatches = [...body.matchAll(/<(?:img|video)\b[^>]*(src|poster)="(assets\/[^\"]+\.webp)"[^>]*>/g)];
if (localWebpMatches.length && !allowLocalWebp) {
  const list = [...new Set(localWebpMatches.map(match => match[2]))].map(file => `  - ${file}`).join('\n');
  throw new Error(`Локальные webp не инлайнятся по умолчанию. Запросите у пользователя CDN-ссылку для каждого файла и замените src/poster в index.html:\n${list}\nВременный обход для проверки сборки: node projects/psychologist-consultant/build-tilda-bundle.mjs --allow-local-webp`);
}
for (const match of localWebpMatches) {
  console.error(`[webp] ${match[2]} встроен как data URL по флагу --allow-local-webp; запросите CDN-ссылку и замените ${match[1]}`);
  const file = path.resolve(root, match[2]);
  if (!file.startsWith(path.join(root, 'assets') + path.sep)) throw new Error('Invalid asset path.');
  if (!svgSources.has(match[2])) {
    const id = `photo-${svgSources.size + 1}`;
    svgSources.set(match[2], id);
    const bytes = await fs.readFile(file);
    svgRules.push(`.psychologist-consultant-page [data-tilda-photo="${id}"]{background-image:url("data:image/webp;base64,${bytes.toString('base64')}");background-size:cover;background-position:var(--review-image-position,center 20%)}`);
  }
  body = body.replace(match[0], match[0].replace(`${match[1]}="${match[2]}"`, `${match[1]}="${transparent}" data-tilda-photo="${svgSources.get(match[2])}"`));
}
// Decorative CDN images become semantic-free spans with a shared background.
// Original assets remain unchanged; repeated URLs and image attributes stay in HEAD.
for (const match of [...body.matchAll(/<img\b[^>]*src="(https:\/\/[^\"]+)"[^>]*>/g)]) {
  if (!/\balt=""/.test(match[0]) || !match[1].endsWith('.svg')) continue;
  if (!svgSources.has(match[1])) {
    const id = `icon-${svgSources.size + 1}`;
    svgSources.set(match[1], id);
    svgRules.push(`.psychologist-consultant-page [data-tilda-icon="${id}"]{background:url("${match[1]}") center/contain no-repeat}`);
  }
  const className = match[0].match(/class="([^"]+)"/)?.[1] || 'tilda-icon_intrinsic';
  body = body.replace(match[0], `<span class="${className}" data-tilda-icon="${svgSources.get(match[1])}" aria-hidden="true"></span>`);
}
// Asset defaults must not override component visibility states (for example form icons).
svgRules.push(':where(.psychologist-consultant-page [data-tilda-icon],.psychologist-consultant-page [data-tilda-svg]){display:inline-block}.psychologist-consultant-page .tilda-icon_intrinsic{width:1.25rem;height:1.25rem;flex:none}');
body = body.replace(/<!--[\s\S]*?-->/g, '').replace(/\sdata-node-id="[^"]*"/g, '').replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim().replaceAll('&nbsp;', '\u00a0').replace(/\b(draggable|loading)="([a-z]+)"/g, '$1=$2');
const bodyParts = splitTildaBody(body);

const font = html.match(/<link rel="stylesheet" href="https:\/\/fonts.googleapis.com[^>]+>/)?.[0];
if (!font) throw new Error('Missing font stylesheet.');
const phoneCss = html.match(/<link rel="stylesheet" href="https:\/\/cdn.jsdelivr.net\/npm\/intl-tel-input@[^>]+>/)?.[0];
const phoneScript = html.match(/<script src="https:\/\/cdn.jsdelivr.net\/npm\/intl-tel-input@[^>]+><\/script>/)?.[0]?.replace(' defer', '');
if (!phoneCss || !phoneScript) throw new Error('Missing pinned phone input dependencies.');
let deliveredFormCss = formCss;
for (const match of formCss.matchAll(/url\(["']?(\.\/assets\/[^"')]+\.svg)["']?\)/g)) {
  const asset = await fs.readFile(path.join(root, match[1]));
  deliveredFormCss = deliveredFormCss.replaceAll(match[0], `url("data:image/svg+xml;base64,${asset.toString('base64')}")`);
}
let deliveredCss = css;
for (const match of css.matchAll(/url\(["']?(\.\/assets\/[^"')]+\.svg)["']?\)/g)) {
  const bytes = await fs.readFile(path.join(root, match[1]));
  deliveredCss = deliveredCss.replaceAll(match[0], `url("data:image/svg+xml;base64,${bytes.toString('base64')}")`);
}
const sliderCss = html.match(/<link rel="stylesheet" href="https:\/\/cdn.jsdelivr.net\/npm\/@splidejs\/splide@[^>]+>/)?.[0];
const sliderScript = html.match(/<script src="https:\/\/cdn.jsdelivr.net\/npm\/@splidejs\/splide@[^>]+><\/script>/)?.[0]?.replace(' defer', '');
if (!sliderCss || !sliderScript) throw new Error('Missing pinned slider dependency.');
const head = `${font}\n${phoneCss}\n${sliderCss}\n${teacherAssetsHead}`;
const styles = `\n${sharedCss}\n${heroCss}\n${ratingsCss}\n${admissionCss}\n${pricingCss}\n${reviewCss}\n${deliveredCss}\n${deliveredFormCss}\n${teacherCss}\n${teacherPhotoCss}\n${sectionHeadingCss}\n${gridCss}\n${svgRules.join('\n')}\n`;
const styleParts = splitTildaStyles(styles);
// Tilda's existing record container owns the one main landmark; records stay in place.
const landmarkJs = `(() => {
  const parts = [...document.querySelectorAll('[data-tilda-page-part]')];
  const host = parts[0]?.closest('.t-records');
  if (host && parts.every(part => host.contains(part)) && !document.querySelector('main,[role="main"]')) host.setAttribute('role', 'main');
})();`;
const runtimeModules = [landmarkJs, sharedJs, formJs, pricingJs, reviewJs, teacherRuntime, await read('script.js')];
const runtimeJs = runtimeModules.join('\n');
assertResponsiveContract(styles, 'Tilda CSS');
assertResponsiveContract(runtimeJs, 'Tilda JavaScript');
const footerParts = splitTildaScripts(runtimeModules, `${phoneScript}\n${sliderScript}\n`);
const footer = footerParts.join('\n');
for (const fragment of [head, ...styleParts, body, footer]) {
  if (/localhost|127\.0\.0\.1|(?:src|href|poster)="(?:\.\.?\/|assets\/)|url\(["']?(?:\.\.?\/|assets\/)/.test(fragment)) {
    throw new Error('Repository-local runtime reference in Tilda output.');
  }
}

const bodyNames = bodyParts.map((_, index) => fragmentName('body', index));
const styleNames = styleParts.map((_, index) => fragmentName('styles', index));
const footerNames = footerParts.map((_, index) => fragmentName('footer', index));
const artifacts = {
  'head.html': head,
  ...Object.fromEntries(styleParts.map((content, index) => [styleNames[index], content])),
  ...Object.fromEntries(bodyParts.map((content, index) => [bodyNames[index], content])),
  'teachers-data.html': teacherDataModule,
  ...Object.fromEntries(footerParts.map((content, index) => [footerNames[index], content])),
};
for (const [name, content] of Object.entries(artifacts)) {
  if (content.length >= T123_LIMIT) throw new Error(`${name} exceeds the Tilda budget: ${content.length}.`);
}
const pending = actions.filter((action) => action.destination === null).map((action) => action.label);
const manifest = {
  status: 'ready-for-transfer-with-pending-integrations',
  body_characters: body.length,
  body_files: bodyNames,
  style_files: styleNames,
  footer_files: footerNames,
  t123_order: [...styleNames, ...bodyNames, '[native Tilda form]', 'teachers-data.html', ...footerNames],
  pending_actions: pending,
  files: Object.fromEntries(Object.entries(artifacts).map(([name, content]) => [name, {
    sha256: crypto.createHash('sha256').update(content).digest('hex'),
    characters: content.length,
    bytes: Buffer.byteLength(content),
  }])),
};
const readme = `# Tilda — Психолог-консультант

Generated: изменять исходники и запускать build-tilda-bundle.mjs, не эти файлы.

## Как заменить текущую версию

1. В настройках страницы полностью заменить дополнительный HEAD содержимым head.html.
2. Перед BODY добавить STYLE-файлы из списка ниже, каждый в отдельный T123. Затем заменить старые HTML-блоки лендинга файлами BODY ниже: каждый файл целиком в отдельный T123, в указанном порядке. Поля сверху/снизу у этих T123 — 0; интервалы уже включены в секции.
3. Сохранить настроенный нативный блок формы из «Терапии травмы» после всех BODY. Не удалять его и не менять marker, поля, маски и получателей: источник — ../data/form-contract.json.
4. В отдельном T123 разместить teachers-data.html, затем каждый FOOTER из списка. При повторном переносе удалить из страницы прежний дублирующий код FOOTER и отдельные старые секции преподавателей/рейтингов: они уже входят в BODY.
5. HEAD и все STYLE/BODY/FOOTER переносить одной сборкой. Старый большой HEAD полностью заменить коротким head.html; не оставлять прежние стили или их дубли. Файлы не форматировать. Опубликовать страницу и проверить форму, якоря и слайдеры.

## Порядок T123

${[...styleNames, ...bodyNames, 'Настроенный нативный блок формы Tilda', 'teachers-data.html', ...footerNames].map((name, index) => `${index + 1}. ${name}${artifacts[name] ? ` — ${artifacts[name].length.toLocaleString('ru-RU')} символов` : ''}`).join('\n')}

Каждый файл, включая HEAD, меньше 65 000 символов. HEAD (${head.length} символов) вставляется только в настройки страницы. STYLE-файлы содержат готовые теги style и вставляются целиком в T123 с нулевыми полями до всех BODY; видимого содержимого у них нет.
CSS разделён между целыми правилами с сохранением порядка и media queries. BODY разделены между целыми секциями, FOOTER — между целыми JavaScript-модулями.
Каждый BODY имеет собственную тему и anchor opt-in. Общий runtime обслуживает все корни;
при запуске существующий контейнер Tilda .t-records получает единственный role=main,
если на странице ещё нет main. DOM-блоки не перемещаются, нативная форма остаётся на месте.
Без JavaScript все секции и статичная программа доступны.

Все секции текущего лендинга включены, в том числе программа и обновлённый таймлайн: текущая сетка сохранена, оформление карточек и шрифты перенесены из четырёх адаптивов.
Состав преподавателей редактируется только в teachers-data.html; встроенные фото находятся в STYLE-файлах.
Локальные CSS/JS/SVG встроены; остальные медиа используют постоянные CDN URL.

## Правила формы и настройка Tilda

${await fs.readFile(path.join(root, "FORM-TILDA.md"), "utf8")}

## Что остаётся настроить на целевой странице

Назначения кнопок: ${actions.filter(action => action.destination).map(action => action.label + ' — ' + action.destination).join('; ')}.
Цели с tilda_managed: true в data/actions.json настраиваются пользователем в Tilda.

Не назначены действия: ${pending.join(', ') || 'нет'}.
Адрес опубликованной страницы и статус формы — в data/form-contract.json.
Формы, попапы и получателей в Tilda настраивает пользователь.

preview.html — текущие фрагменты в отдельных .t-rec/.t123 контейнерах, с тестовым конфликтом цвета Tilda.
Параметры: ?input=touch, ?js=off, ?init=twice. Этот файл не вставлять в Tilda.
--preview-only обновляет только preview; обычная сборка обновляет весь комплект и manifest.
`;
// Local verification harness. It does not ship in the Tilda fragments.
const harness = `<script>
const params = new URLSearchParams(location.search);
const nativeMatchMedia = window.matchMedia.bind(window);
window.matchMedia = (query) => {
  const result = nativeMatchMedia(query);
  let forced;
  if (params.get('input') === 'touch') {
    if (query === '(hover: hover) and (pointer: fine)') forced = false;
    if (query === '(hover: none), (pointer: coarse)') forced = true;
  }
  if (forced !== undefined) Object.defineProperty(result, 'matches', {value:forced});
  return result;
};
<\/script>`;
const encodedJs = Buffer.from(runtimeJs).toString('base64');
const boot = `<script>
if (params.get('js') !== 'off') {
  const add = () => { const script = document.createElement('script'); script.textContent = new TextDecoder().decode(Uint8Array.from(atob('${encodedJs}'), char => char.charCodeAt(0))); document.body.append(script); };
  add(); if (params.get('init') === 'twice') add();
}
<\/script>`;
const records = bodyParts.map((part, index) => `<div class="t-rec" id="rec-preview-${index + 1}"><div class="t123"><div class="t-container_100"><div class="t-width t-width_100">${part}</div></div></div></div>`).join('');
const styleRecords = styleParts.map(part => `<div class="t-rec" data-tilda-styles><div class="t123" style="padding:0">${part}</div></div>`).join('');
const preview = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><link rel="icon" href="data:,"><title>Проверка Tilda — Психолог-консультант</title><style>a,button{color:red!important}</style>${head}${harness}</head><body>${styleRecords}<main class="t-records">${records}</main>${teacherDataModule}${phoneScript}${sliderScript}${boot}</body></html>`;
// Exact copy/paste fixture: separate records and unmodified ordered footer fragments.
const transferFixture = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><link rel="icon" href="data:,"><title>Tilda transfer fixture</title><style>a,button{color:red!important}.t-rec{padding:0}</style>${head}</head><body><div class="t-records">${styleRecords}${records}<div class="t-rec">${teacherDataModule}</div>${footerParts.map(part => `<div class="t-rec">${part}</div>`).join('')}</div></body></html>`;
await fs.writeFile(path.join(root, 'tests/tilda-transfer-fixture.html'), transferFixture);
await fs.mkdir(output, {recursive:true});
const outputs = previewOnly ? {'preview.html':preview} : {...artifacts, 'preview.html':preview, 'README.md':readme, 'manifest.json':JSON.stringify(manifest,null,2)+'\n'};
for (const [name, content] of Object.entries(outputs)) {
  await fs.writeFile(path.join(output, name), content);
}
console.log(previewOnly
  ? `Local preview built: ${bodyParts.length} BODY parts and ${footerParts.length} FOOTER parts. Transfer fragments unchanged.`
  : `Tilda package built: HEAD ${head.length}; CSS ${styleParts.map(part => part.length).join(" + ")}; ${bodyParts.map(part => part.length).join(" + ")} BODY characters; ${footerParts.map(part => part.length).join(" + ")} FOOTER characters; ${pending.length} pending actions.`);
