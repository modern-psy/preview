// Сборка лендинга «Первый уровень РО ДБТ» (slug rodbt-lvl1) из компонентов Академии.
// Запуск из apps/preview: node rodbt/build.mjs
// Вход: data/*.json (тексты), page.css (тема и проектные блоки), общие компоненты web-academy/shared/academy (только при сборке).
// Выход: index.html, style.css, script.js — самодостаточные, без runtime-ссылок на web-academy.
import fs from 'node:fs/promises';
import {renderHeroSection} from '../web-academy/shared/academy/hero-render.mjs';
import {renderCourseAudience} from '../web-academy/shared/academy/course-audience-render.mjs';
import {renderFoundation} from '../web-academy/shared/academy/foundation-render.mjs';
import {renderLearningTimeline} from '../web-academy/shared/academy/learning-timeline-render.mjs';
import {renderLeadFormSection} from '../web-academy/shared/academy/lead-form-render.mjs';
import {renderFaq} from '../web-academy/shared/academy/faq-render.mjs';
import {renderAcademyShowcase} from '../web-academy/shared/academy/academy-showcase-render.mjs';
import {escapeHtml, renderText, sectionId} from '../web-academy/shared/academy/html-render.mjs';
import {loadPricingPromo} from '../web-academy/shared/academy/pricing-promo-tilda.mjs';
import {assertMotionContract} from '../web-academy/shared/academy/motion-contract.mjs';
import {assertResponsiveContract} from '../web-academy/shared/academy/responsive.mjs';

const root = new URL('./', import.meta.url);
const shared = new URL('../web-academy/shared/academy/', import.meta.url);
const consultant = new URL('../web-academy/projects/psychologist-consultant/', import.meta.url);
const read = (base, name) => fs.readFile(new URL(name, base), 'utf8');
const json = async name => JSON.parse(await read(root, `data/${name}.json`));
const dataUrl = async (base, name) => `data:image/svg+xml;base64,${Buffer.from(await read(base, name), 'utf8').toString('base64')}`;

const SLUG = 'rodbt-lvl1';
const API = 'https://modern-psy-asp-prod-8ceb.twc1.net';
const CHECK_ICON = 'https://static.tildacdn.com/tild3564-3264-4839-a534-613766326230/Frame_1131.svg';
const NBSP = ' ';

// Типографика (rules/product/typography.md): служебные слова, частицы, тире, числа с единицами не остаются на строке одни.
const SHORT_WORDS = 'а|в|и|к|о|с|у|я|во|до|за|из|на|не|ни|но|об|от|по|со|без|для|над|под|при|про';
export function typography(text) {
  return text
    .replace(new RegExp(`(?<=^|[\\s(«„"])(${SHORT_WORDS}) `, 'giu'), `$1${NBSP}`)
    .replace(/ (бы|же|ли)(?=[\s?.,!;:)»]|$)/giu, `${NBSP}$1`)
    .replace(/ —/g, `${NBSP}—`)
    .replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NBSP}`)
    .replace(/(\d) (?=[\p{L}₽%№])/gu, `$1${NBSP}`)
    .replace(/№ /g, `№${NBSP}`);
}
// Пробелы связываются только в текстовых узлах: URL, атрибуты, идентификаторы и alt не трогаем.
const SKIP_KEYS = new Set(['id', 'src', 'url', 'href', 'asset', 'alt', 'datetime', 'gridSource', 'errorIcon', 'successIcon', 'agreementUrl', 'privacyUrl', 'nativeMarker', 'action', 'value', 'listLabel', 'icon', 'expertIcon', 'variant', 'composition', 'position', 'heading_id', 'label', 'destination']);
function typeset(node, key) {
  if (typeof node === 'string') return SKIP_KEYS.has(key) ? node : typography(node);
  if (Array.isArray(node)) return node.map(item => typeset(item, key));
  if (node && typeof node === 'object') return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, typeset(v, k)]));
  return node;
}
// Подписи шагов и кнопок видны на странице, а aria-подписи (listLabel, metadata.label, benefits.label) нет.
const typesetVisibleLabels = data => ({...data, steps: data.steps?.map(step => ({...step, label: typography(step.label)})), action: data.action && {...data.action, label: typography(data.action.label)}});

const image = (media, className, {lazy = true, decorative = false} = {}) => {
  if (!/^https:\/\//.test(media.src) || ![media.width, media.height].every(n => Number.isInteger(n) && n > 0)) throw new Error(`Изображение без CDN-ссылки или размеров: ${media.src}`);
  if (!decorative && typeof media.alt !== 'string') throw new Error(`Нужен alt: ${media.src}`);
  return `<img class="${className}" src="${escapeHtml(media.src)}" width="${media.width}" height="${media.height}" alt="${decorative ? '' : escapeHtml(media.alt)}"${decorative ? ' aria-hidden="true"' : ''} draggable="false"${lazy ? ' loading="lazy" decoding="async"' : ''}>`;
};
const checkItem = (text, copy = '') => `<li class="feature-list_item"><img class="feature-list_icon" src="${CHECK_ICON}" width="24" height="24" alt="" draggable="false" loading="lazy">${copy || `<span class="body-text_component feature-list_text">${renderText(text)}</span>`}</li>`;
const header = (id, heading, {align = 'center', subtitle = ''} = {}) => `<div class="section-header_component is-${align} is-responsive"><h2 class="section-title_component is-${align} is-responsive" id="${id}-heading">${renderText(heading)}</h2>${subtitle ? `<p class="section-subtitle_component">${renderText(subtitle)}</p>` : ''}</div>`;
const section = (name, id, inner, {wide = false, extra = ''} = {}) => `<section class="section_${name} section-spacing_component${extra}" id="${sectionId(id)}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge">${wide ? '<div class="column-grid_component"><div class="column-grid_content is-content-wide">' : ''}
    ${inner}
  ${wide ? '</div></div>' : ''}</div></div>
</section>`;

/* Проектный блок strategy: три карточки с фото, заголовком и текстом (см. README). */
function renderStrategy(data, id) {
  const cards = data.cards.map(card => `<li class="card_component strategy_card"><div class="strategy_media">${image(card.image, 'strategy_image', {decorative: true})}</div><div class="content-header_component"><h3 class="content-heading_component is-card">${renderText(card.heading)}</h3><p class="body-text_component">${renderText(card.text)}</p></div></li>`).join('\n');
  return section('strategy', id, `<div class="section-layout_component is-responsive">${header(id, data.heading)}<ul class="card-grid_component is-triple strategy_list" aria-label="${escapeHtml(data.listLabel)}">${cards}</ul></div>`);
}

/* Проектный блок feature-split: копия с группами списков и фото; секции «уровень» и «инструктор». */
function renderFeatureSplit(name, data, id) {
  const groups = data.groups.map((group, index) => `<div class="feature-split_group"><h3 class="content-heading_component is-card" id="${id}-group-${index + 1}">${renderText(group.heading)}</h3>${group.intro ? `<p class="body-text_component">${renderText(group.intro)}</p>` : ''}<ul class="feature-list_component" aria-labelledby="${id}-group-${index + 1}">${group.items.map(item => checkItem(item)).join('')}</ul></div>`).join('\n');
  const copy = `<div class="feature-split_copy"><div class="feature-split_intro">${header(id, data.heading, {align: 'left', subtitle: data.subtitle})}<p class="body-text_component is-summary is-emphasis feature-split_lead">${renderText(data.lead)}</p>${data.paragraphs.map(text => `<p class="body-text_component is-summary is-regular">${renderText(text)}</p>`).join('')}</div><div class="feature-split_groups">${groups}</div>${data.note ? `<p class="body-text_component is-fine-print feature-split_note">${renderText(data.note)}</p>` : ''}</div>`;
  const media = `<div class="feature-split_media"${data.image.position ? ` style="--feature-split-image-position: ${escapeHtml(data.image.position)}"` : ''}>${image(data.image, 'feature-split_image')}</div>`;
  return section(name, id, `<div class="feature-split_component">${copy}${media}</div>`);
}

/* Проектный блок highlights: особенности курса слева, тёмная карточка практики со списком справа. */
function renderHighlights(data, id) {
  const cards = data.cards.map(card => `<li class="card_component highlights_card"><div class="content-header_component"><h3 class="content-heading_component is-card">${renderText(card.heading)}</h3><p class="body-text_component">${renderText(card.text)}</p></div></li>`).join('\n');
  const items = data.practice.items.map(item => checkItem(null, `<div class="feature-list_copy"><h4 class="body-text_component is-emphasis feature-list_text">${renderText(item.heading)}</h4><p class="body-text_component">${renderText(item.text)}</p></div>`)).join('');
  const practice = `<div class="card_component highlights_practice"><h3 class="content-heading_component is-card" id="${id}-practice">${renderText(data.practice.heading)}</h3><ul class="feature-list_component" aria-labelledby="${id}-practice">${items}</ul></div>`;
  return section('highlights', id, `<div class="section-layout_component is-responsive">${header(id, data.heading)}<div class="highlights_layout"><ul class="highlights_list" aria-label="${escapeHtml(data.listLabel)}">${cards}</ul>${practice}</div></div>`);
}

/* Проектный блок modules: программа курса модулями (длительность, вводная, темы) и литература. */
function renderModules(data, id) {
  const modules = data.modules.map(module => `<li class="card_component modules_card"><div class="modules_header"><span class="modules_badge">${renderText(module.duration)}</span><h3 class="content-heading_component is-card modules_heading">${renderText(module.heading)}</h3></div><div class="modules_copy">${module.lead.map(text => `<p class="body-text_component is-detailed modules_lead">${renderText(text)}</p>`).join('')}<ul class="modules_points">${module.points.map(text => `<li class="body-text_component is-detailed">${renderText(text)}</li>`).join('')}</ul></div></li>`).join('\n');
  const literature = `<div class="card_component modules_card modules_literature"><h3 class="content-heading_component is-card" id="${id}-literature">${renderText(data.literature.heading)}</h3><ul class="modules_points" aria-labelledby="${id}-literature">${data.literature.items.map(text => `<li class="body-text_component is-detailed">${renderText(text)}</li>`).join('')}</ul><p class="body-text_component modules_literature-note">${renderText(data.literature.note)}</p></div>`;
  return section('program', id, `<div class="section-layout_component is-responsive">${header(id, data.heading)}<div class="modules_body"><ol class="modules_list" aria-label="${escapeHtml(data.listLabel)}">${modules}</ol>${literature}</div></div>`, {wide: true});
}

/* Проектный блок program-tabs: та же программа в лейауте «Психосоматики» (модули-табы слева, панель справа). */
function renderProgramTabs(data, id) {
  const tabs = data.modules.map((module, i) => `<button class="program-tabs_tab" type="button" role="tab" id="${id}-tab-${i + 1}" aria-controls="${id}-panel-${i + 1}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-program-tab><span class="program-tabs_tab-label">Модуль ${i + 1} · ${renderText(module.duration)}</span><span class="program-tabs_tab-title">${renderText(module.heading)}</span></button>`).join('\n');
  const panels = data.modules.map((module, i) => `<div class="program-tabs_panel" role="tabpanel" id="${id}-panel-${i + 1}" aria-labelledby="${id}-tab-${i + 1}" data-program-panel${i === 0 ? '' : ' hidden'}><h3 class="content-heading_component is-profile">${renderText(module.heading)}</h3><div class="program-tabs_panel-copy">${module.lead.map(text => `<p class="body-text_component is-detailed program-tabs_lead">${renderText(text)}</p>`).join('')}</div><div class="program-tabs_panel-copy"><p class="program-tabs_list-title">${renderText(data.topicsLabel)}</p><ul class="program-tabs_topics">${module.points.map(text => `<li class="body-text_component is-detailed program-tabs_topic">${renderText(text)}</li>`).join('')}</ul></div></div>`).join('\n');
  const literature = `<div class="card_component program-tabs_literature"><h3 class="content-heading_component is-card" id="${id}-literature">${renderText(data.literature.heading)}</h3><ul class="program-tabs_topics" aria-labelledby="${id}-literature">${data.literature.items.map(text => `<li class="body-text_component is-detailed program-tabs_topic">${renderText(text)}</li>`).join('')}</ul><p class="body-text_component program-tabs_literature-note">${renderText(data.literature.note)}</p></div>`;
  return section('program', id, `<div class="program-tabs_component"><div class="section-header_component is-center is-responsive"><h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(data.heading)}</h2></div><div class="program-tabs_layout" data-program-tabs><div class="program-tabs_nav" role="tablist" aria-label="${escapeHtml(data.listLabel)}" aria-orientation="vertical">${tabs}</div><div class="program-tabs_panels">${panels}</div></div>${literature}</div>`);
}

/* Проектный блок documents: карточки документов с логотипом выдающей организации и изображением. */
function renderDocuments(data, id) {
  const cards = data.cards.map(card => `<li class="card_component documents_card">${image(card.logo, 'documents_logo', {decorative: true})}<div class="content-header_component documents_copy"><h3 class="content-heading_component is-card">${renderText(card.heading)}</h3><p class="body-text_component is-fine-print">${renderText(card.text)}</p></div>${image(card.image, 'documents_image')}</li>`).join('\n');
  return section('documents', id, `<div class="section-layout_component is-responsive">${header(id, data.heading)}<ul class="card-grid_component is-paired documents_list" aria-label="${escapeHtml(data.listLabel)}">${cards}</ul></div>`, {wide: true});
}

/* Проектный блок reasons: карточки «заголовок + текст» в три колонки. */
function renderReasons(data, id) {
  const cards = data.cards.map(card => `<li class="card_component reasons_card"><div class="content-header_component"><h3 class="content-heading_component is-card">${renderText(card.heading)}</h3><p class="body-text_component">${renderText(card.text)}</p></div></li>`).join('\n');
  return section('reasons', id, `<div class="section-layout_component is-responsive">${header(id, data.heading)}<ul class="card-grid_component is-triple reasons_list" aria-label="${escapeHtml(data.listLabel)}">${cards}</ul></div>`);
}

/* Промо-блок цены из CMS: запаска строится из ответа API на момент сборки, в браузере блок перерисовывает pricing-promo.js. */
async function renderPricing(id) {
  let course;
  try {
    const response = await fetch(`${API}/api/public/course/${SLUG}`, {headers: {Accept: 'application/json'}, signal: AbortSignal.timeout(8000)});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    course = await response.json();
    if (course.error) throw new Error(course.error);
    await fs.writeFile(new URL('data/course.json', root), JSON.stringify(course, null, 2) + '\n');
  } catch (error) {
    course = await json('course');
    console.warn(`API недоступен (${error.message}), запаска цены из data/course.json`);
  }
  const PricingPromo = await loadPricingPromo();
  const markup = PricingPromo.render(PricingPromo.fromApi(course, {id}));
  return {
    // Внешняя карточка pricing-promo_card из pricing-promo.css: колонка формы, поля и скругление контейнера программы.
    html: `<section class="section_pricing section-spacing_component" id="${sectionId(id)}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge column-grid_component"><div class="column-grid_content is-content-wide"><div class="pricing-promo_card"><div class="pricing-promo" data-price-block data-course="${SLUG}" data-api="${API}" data-block-id="${id}">${markup}</div></div></div></div></div>
</section>`,
    mode: markup.match(/data-mode="([a-z-]+)"/)[1],
  };
}

async function buildHtml() {
  const seo = await json('seo');
  const hero = typeset(await json('hero'));
  hero.metadata.label = (await json('hero')).metadata.label;
  const context = {assets: await json('assets'), actions: await json('actions')};
  // Hero-renderer сохраняет только сущность &nbsp;, поэтому неразрывные пробелы передаём ей текстом.
  const heroMarkup = renderHeroSection(JSON.parse(JSON.stringify(hero).replaceAll(NBSP, '&nbsp;')), context);

  const learningData = typesetVisibleLabels(typeset(await json('learning')));
  // Заголовки с акцентом одной строкой (решение пользователя 17.09.2026): убираем принудительный <br> перед акцентом.
  let learning = renderLearningTimeline(learningData, {id: `${SLUG}-learning`}).replace('<br><span class="section-title_accent">', ' <span class="section-title_accent">');
  const note = `<div class="learning-note_component" role="note"><span class="learning-note_icon" aria-hidden="true">⚠️</span><p class="body-text_component is-callout learning-note_text">${renderText(learningData.note)}</p></div>`;
  const learningTail = '\n    </div>\n  </div></div></div></div>\n</section>';
  if (learning.split(learningTail).length !== 2) throw new Error('Learning: не найден хвост компонента для заметки');
  learning = learning.replace(learningTail, `\n      ${note}${learningTail}`);

  const skills = typeset(await json('skills'));
  skills.cta.gridSource = await dataUrl(shared, 'assets/cta-grid.svg');

  const leadForm = typeset(await json('lead-form'));
  leadForm.errorIcon = await dataUrl(consultant, 'assets/icons/form-error.svg');
  leadForm.successIcon = await dataUrl(consultant, 'assets/icons/form-success.svg');
  const form = renderLeadFormSection(leadForm, {id: `${SLUG}-application`, formId: `${SLUG}-form`});

  // Блок об Академии: тексты и фото общие для лендингов Академии, свечения из assets эталона как data URL.
  const academy = typeset(await json('academy'));
  for (const card of [academy.community, academy.graduates]) for (const key of ['glow', 'compactGlow']) card[key].src = await dataUrl(consultant, card[key].src);

  const pricing = await renderPricing(`${SLUG}-pricing`);
  const sections = [
    heroMarkup,
    renderStrategy(typeset(await json('strategy')), `${SLUG}-strategy`),
    renderCourseAudience(typeset(await json('audience')), {id: `${SLUG}-audience`}),
    renderFeatureSplit('level', typeset(await json('level')), `${SLUG}-level`),
    renderHighlights(typeset(await json('highlights')), `${SLUG}-highlights`),
    renderFoundation(skills, {id: `${SLUG}-skills`}).replace('<br><span class="section-title_accent">', ' <span class="section-title_accent">'), // заголовок одной строкой, перенос только естественный
    renderFeatureSplit('instructor', typeset(await json('instructor')), `${SLUG}-instructor`),
    learning,
    renderProgramTabs(typeset(await json('program')), `${SLUG}-program`),
    renderDocuments(typeset(await json('documents')), `${SLUG}-documents`),
    renderAcademyShowcase(academy, {id: `${SLUG}-academy`}),
    pricing.html,
    form,
    renderFaq(typeset(await json('faq')), {id: `${SLUG}-faq`}),
  ];

  const body = sections.join('\n').replaceAll(NBSP, '&nbsp;');
  const html = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(seo.title)}</title>
    <meta name="description" content="${escapeHtml(seo.description)}">
    <link rel="icon" href="data:,">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://static.tildacdn.com" crossorigin>
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Wix+Madefor+Text:wght@400;444;500;600&amp;display=swap">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/css/intlTelInput.css">
    <link rel="stylesheet" href="./style.css">
    <script src="https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/js/intlTelInput.min.js" defer></script>
    <script src="./script.js" defer></script>
  </head>
  <body>
    <!-- Сгенерировано: node rodbt/build.mjs. Тексты в data/*.json, тема и проектные блоки в page.css. Руками не править. -->
    <main class="main-wrapper academy-page rodbt-lvl1-page" id="main-content" tabindex="-1" data-academy-anchor-scroll>
${body}
    </main>
  </body>
</html>
`;
  const ids = [...html.matchAll(/(?<![\w-])id="([^"]+)"/g)].map(m => m[1]);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length) throw new Error(`Повторяющиеся id: ${duplicates.join(', ')}`);
  for (const link of html.matchAll(/href="#([a-z][a-z0-9-]*)"/g)) if (!ids.includes(link[1])) throw new Error(`Якорь без цели: #${link[1]}`);
  if (/src="assets\/|\.\.\/web-academy|localhost|127\.0\.0\.1/.test(html)) throw new Error('В index.html остались локальные ссылки');
  return {html, mode: pricing.mode};
}

async function buildCss() {
  const order = ['components.css', 'card-spacing.css', 'hero.css', 'benefits.css', 'section-spacing.css', 'icon-card.css', 'body-text.css', 'cta-responsive.css', 'button.css', 'learning-timeline.css', 'course-audience.css', 'academy-showcase-responsive.css', 'toggle-icon.css', 'faq-responsive.css', 'lead-form.css', 'lead-form-responsive.css', 'pricing-promo.css', 'section-heading.css', 'anchor-scroll.css'];
  const parts = [];
  for (const name of order) {
    let css = await read(shared, name);
    if (name === 'toggle-icon.css') css = css.replaceAll("url('./assets/disclosure-cross.svg')", `url("${await dataUrl(shared, 'assets/disclosure-cross.svg')}")`);
    assertResponsiveContract(css, name);
    parts.push(`/* === web-academy/shared/academy/${name} === */\n${css.trim()}`);
  }
  const page = await read(root, 'page.css');
  assertResponsiveContract(page, 'page.css');
  const css = `/* Сгенерировано: node rodbt/build.mjs. Общие компоненты Академии, затем тема и проектные блоки из page.css. Руками не править. */\n\n${parts.join('\n\n')}\n\n/* === rodbt/page.css === */\n${page.trim()}\n`;
  assertMotionContract(css, 'style.css');
  if (/url\((['"]?)(\.\/|\.\.\/|assets\/)/.test(css)) throw new Error('В style.css остались локальные url()');
  return css;
}

async function buildJs() {
  const order = ['components.js', 'anchor-scroll.js', 'pricing.js', 'pricing-promo-render.js', 'pricing-promo.js', 'lead-form.js', 'learning-timeline.js'];
  const parts = [];
  for (const name of order) parts.push(`/* === web-academy/shared/academy/${name} === */\n${(await read(shared, name)).trim()}`);
  parts.push(`/* === rodbt/page.js === */\n${(await read(root, 'page.js')).trim()}`);
  const js = `/* Сгенерировано: node rodbt/build.mjs. Общие скрипты Академии в порядке зависимостей. Руками не править. */\n\n${parts.join('\n\n')}\n`;
  assertResponsiveContract(js, 'script.js');
  return js;
}

const {html, mode} = await buildHtml();
await fs.writeFile(new URL('index.html', root), html);
await fs.writeFile(new URL('style.css', root), await buildCss());
await fs.writeFile(new URL('script.js', root), await buildJs());
console.log(`rodbt: index.html ${html.length} символов, блок цены в режиме ${mode}`);
