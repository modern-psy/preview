// Сборка лендинга курса «Основы нарративной практики» (префикс narrative-therapy) из компонентов Академии.
// Основа: лендинг rodbt-record (тема, сборка, блок цены); контент по ТЗ «нарративная практика» (05.10.2026)
// и со старой страницы modern-psy.ru/narrative-therapy там, где ТЗ говорит «оставляем как есть».
// Запуск из apps/preview: node narrative-therapy/build.mjs
// Вход: data/*.json (тексты), page.css (тема и проектные блоки), общие компоненты web-academy/shared/academy (только при сборке).
// Выход: index.html, style.css, script.js — самодостаточные, без runtime-ссылок на web-academy.
import fs from 'node:fs/promises';
import {renderHeroSection} from '../web-academy/shared/academy/hero-render.mjs';
import {renderLeadFormSection} from '../web-academy/shared/academy/lead-form-render.mjs';
import {renderDiploma} from '../web-academy/shared/academy/diploma-render.mjs';
import {renderFaq} from '../web-academy/shared/academy/faq-render.mjs';
import {renderCourseAudience} from '../web-academy/shared/academy/course-audience-render.mjs';
import {escapeHtml, renderText, sectionId} from '../web-academy/shared/academy/html-render.mjs';
import {loadPricingPromo} from '../web-academy/shared/academy/pricing-promo-tilda.mjs';
import {assertMotionContract} from '../web-academy/shared/academy/motion-contract.mjs';
import {assertResponsiveContract} from '../web-academy/shared/academy/responsive.mjs';
import {renderScene} from './scenes.mjs';

const root = new URL('./', import.meta.url);
const shared = new URL('../web-academy/shared/academy/', import.meta.url);
const consultant = new URL('../web-academy/projects/psychologist-consultant/', import.meta.url);
const read = (base, name) => fs.readFile(new URL(name, base), 'utf8');
const json = async name => JSON.parse(await read(root, `data/${name}.json`));
const dataUrl = async (base, name) => `data:image/svg+xml;base64,${Buffer.from(await read(base, name), 'utf8').toString('base64')}`;

const SLUG = 'narrative-therapy';
const API = 'https://modern-psy-asp-prod-8ceb.twc1.net';
// Слаг курса в CMS. Пока null: цена берётся из data/course.json и в браузере не перерисовывается.
// В CMS курс narrative-therapy есть, но без тарифов (одна цена 45 000 ₽), а по ТЗ тарифов два.
const CMS_SLUG = null;
const CHECK_ICON = 'https://static.tildacdn.com/tild3564-3264-4839-a534-613766326230/Frame_1131.svg';
const NBSP = '\u00a0';

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
const SKIP_KEYS = new Set(['id', 'src', 'url', 'href', 'asset', 'alt', 'datetime', 'errorIcon', 'successIcon', 'agreementUrl', 'privacyUrl', 'nativeMarker', 'action', 'value', 'listLabel', 'icon', 'variant', 'scene', 'heading_id', 'destination']);
function typeset(node, key) {
  if (typeof node === 'string') return SKIP_KEYS.has(key) ? node : typography(node);
  if (Array.isArray(node)) return node.map(item => typeset(item, key));
  if (node && typeof node === 'object') return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, typeset(v, k)]));
  return node;
}

const image = (media, className, {lazy = true, decorative = false} = {}) => {
  if (!/^(https:\/\/|assets\/)/.test(media.src) || ![media.width, media.height].every(n => Number.isInteger(n) && n > 0)) throw new Error(`Изображение без CDN-ссылки (или файла в assets/) или без размеров: ${media.src}`);
  if (!decorative && typeof media.alt !== 'string') throw new Error(`Нужен alt: ${media.src}`);
  return `<img class="${className}" src="${escapeHtml(media.src)}" width="${media.width}" height="${media.height}" alt="${decorative ? '' : escapeHtml(media.alt)}"${decorative ? ' aria-hidden="true"' : ''} draggable="false"${lazy ? ' loading="lazy" decoding="async"' : ''}>`;
};
const number = i => String(i + 1).padStart(2, '0');
const paragraphs = list => (list || []).map(text => `<p class="body-text_component is-summary is-regular">${renderText(text)}</p>`).join('');
const header = (id, data, {align = 'center'} = {}) => `<div class="section-header_component is-${align} is-responsive"><h2 class="section-title_component is-${align} is-responsive" id="${id}-heading">${renderText(data.heading)}</h2>${data.lead ? `<p class="body-text_component is-summary is-emphasis">${renderText(data.lead)}</p>` : ''}${paragraphs(data.paragraphs)}</div>`;
const section = (name, id, inner) => `<section class="section_${name} section-spacing_component" id="${sectionId(id)}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge">
    ${inner}
  </div></div>
</section>`;

/* Проектный блок card-set: заголовок секции, вводные абзацы и сетка карточек. Один рендерер на шесть секций
   (что такое подход, принципы, где применять, для кого, чему научитесь, почему мы).
   Карточка: необязательный номер 01, 02…, заголовок, выделенная первая фраза (lead) и текст.
   Число колонок на desktop задаёт data.columns (3 или 4); dark: тёмный контейнер вокруг сетки. */
function renderCardSet(name, data, id) {
  const cards = data.cards.map((card, i) => `<li class="card_component card-set_card">${data.numbered ? `<span class="card-set_number" aria-hidden="true">${number(i)}</span>` : ''}<div class="content-header_component"><h3 class="content-heading_component is-card">${renderText(card.heading)}</h3>${card.lead ? `<p class="body-text_component is-emphasis card-set_lead">${renderText(card.lead)}</p>` : ''}${card.text ? `<p class="body-text_component">${renderText(card.text)}</p>` : ''}</div></li>`).join('\n');
  const list = `${data.listHeading ? `<h3 class="content-heading_component is-profile card-set_list-heading">${renderText(data.listHeading)}</h3>` : ''}<ul class="card-set_list is-columns-${data.columns}" aria-label="${escapeHtml(data.listLabel)}">${cards}</ul>`;
  return section(name, id, `<div class="section-layout_component is-responsive${data.dark ? ' card-set_component is-dark' : ' card-set_component'}">${header(id, data)}<div class="card-set_body">${list}</div></div>`);
}

/* Проектный блок about-steps: «Как работает специалист» (выбран вариант 2 из трёх, 05.10.2026).
   Заголовок и описание слева, четыре шага справа в белой панели, номера соединены вертикальной линией.
   На телефоне и планшете заголовок сверху, шаги под ним. */
function renderAboutSteps(data, id) {
  const steps = data.cards.map((card, i) => `<li class="about-steps_item"><span class="about-steps_marker" aria-hidden="true">${number(i)}</span><div class="about-steps_copy"><h3 class="content-heading_component is-card">${renderText(card.heading)}</h3><p class="body-text_component">${renderText(card.text)}</p></div></li>`).join('\n');
  return section('about', id, `<div class="about-steps_component">${header(id, data, {align: 'left'})}<ol class="about-steps_list" aria-label="${escapeHtml(data.listLabel)}">${steps}</ol></div>`);
}

/* Проектный блок use-cases: «Где можно применять нарративный подход», шесть ситуаций с анимированными схемами
   (scenes.mjs). Три варианта на выбор (плашка variant-note над заголовком), остаться должен один:
   лишние убрать из sections и из titles в build-tilda.mjs.
   cards — сетка карточек, схема сверху; tabs — список ситуаций слева, большая схема и текст справа;
   rows  — одна белая панель, ситуации строками, схема справа от текста. */
const variantNote = text => `<p class="variant-note_component">${renderText(text)}</p>`;
const useCasesHead = (data, id, index) => `<div class="section-header_component is-center is-responsive">${variantNote(data.variantLabels[index])}<h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(data.heading)}</h2></div>`;
const useCaseCopy = card => `<div class="content-header_component"><h3 class="content-heading_component is-card">${renderText(card.heading)}</h3><p class="body-text_component">${renderText(card.text)}</p></div>`;
function renderUseCasesCards(data, id) {
  const cards = data.cards.map(card => `<li class="card_component use-cases_card"><div class="use-cases_stage">${renderScene(card.scene)}</div>${useCaseCopy(card)}</li>`).join('\n');
  return section('use-cases-cards', id, `<div class="section-layout_component is-responsive">${useCasesHead(data, id, 0)}<ul class="use-cases_grid" aria-label="${escapeHtml(data.listLabel)}">${cards}</ul></div>`);
}
function renderUseCasesTabs(data, id) {
  const tabs = data.cards.map((card, i) => `<button class="use-cases_tab" type="button" role="tab" id="${id}-tab-${i + 1}" aria-selected="${i === 0}" aria-controls="${id}-panel-${i + 1}" tabindex="${i === 0 ? 0 : -1}" data-use-case-tab><span class="use-cases_tab-number" aria-hidden="true">${number(i)}</span><span>${renderText(card.heading)}</span></button>`).join('');
  const panels = data.cards.map((card, i) => `<div class="use-cases_panel" role="tabpanel" id="${id}-panel-${i + 1}" aria-labelledby="${id}-tab-${i + 1}" data-use-case-panel><div class="use-cases_stage is-large">${renderScene(card.scene)}</div>${useCaseCopy(card)}</div>`).join('');
  return section('use-cases-tabs', id, `<div class="section-layout_component is-responsive">${useCasesHead(data, id, 1)}<div class="use-cases_tabs-layout" data-use-case-tabs><div class="use-cases_tablist" role="tablist" aria-label="${escapeHtml(data.tabsLabel)}">${tabs}</div><div class="use-cases_panels">${panels}</div></div></div>`);
}
function renderUseCasesRows(data, id) {
  const rows = data.cards.map((card, i) => `<li class="use-cases_row"><span class="use-cases_row-number" aria-hidden="true">${number(i)}</span>${useCaseCopy(card)}<div class="use-cases_stage is-row">${renderScene(card.scene)}</div></li>`).join('\n');
  return section('use-cases-rows', id, `<div class="section-layout_component is-responsive">${useCasesHead(data, id, 2)}<ol class="use-cases_rows" aria-label="${escapeHtml(data.listLabel)}">${rows}</ol></div>`);
}

/* Проектный блок practice: три карточки форматов практики и фото группы рядом. */
function renderPractice(data, id) {
  const cards = data.cards.map(card => `<li class="card_component practice_card"><div class="content-header_component"><h3 class="content-heading_component is-card">${renderText(card.heading)}</h3><p class="body-text_component">${renderText(card.text)}</p></div></li>`).join('\n');
  return section('practice', id, `<div class="section-layout_component is-responsive">${header(id, data)}<div class="practice_layout"><ul class="practice_list" aria-label="${escapeHtml(data.listLabel)}">${cards}</ul><div class="practice_media">${image(data.image, 'practice_image')}</div></div></div>`);
}

/* Проектный блок evidence: «Доказательная база подхода», три варианта на выбор (05.10.2026), во всех на первом
   плане текст: вывод исследования, пояснение, источник. Остаться должен один: лишние убрать из sections и из titles
   в build-tilda.mjs. Картинки декоративные (смысл передаёт текст).
   zigzag   — исследования строками, текст и картинка чередуются сторонами (Z-паттерн), картинка меньше текста;
   explorer — слева список выводов, справа карточка выбранного исследования: пояснение, источник, под ними картинка (светлый topic-tabs,
              до 1025px аккордеон);
   compact  — текстовые карточки, картинка маленьким кружком рядом с источником. */
const evidenceHead = (data, id, index) => `<div class="section-header_component is-center is-responsive">${variantNote(data.variantLabels[index])}<h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(data.heading)}</h2>${paragraphs(data.paragraphs)}</div>`;
const evidenceSource = card => `<p class="body-text_component is-fine-print evidence_source">${renderText(card.source)}</p>`;
function renderEvidenceZigzag(data, id) {
  const rows = data.cards.map(card => `<li class="evidence-zigzag_row"><div class="evidence-zigzag_copy"><h3 class="content-heading_component is-profile">${renderText(card.heading)}</h3><p class="body-text_component is-summary is-regular">${renderText(card.text)}</p>${evidenceSource(card)}</div><div class="evidence-zigzag_media">${image(card.image, 'evidence-zigzag_image', {decorative: true})}</div></li>`).join('\n');
  return section('evidence-zigzag', id, `<div class="section-layout_component is-responsive">${evidenceHead(data, id, 0)}<ol class="evidence-zigzag_list" aria-label="${escapeHtml(data.listLabel)}">${rows}</ol></div>`);
}
function renderEvidenceExplorer(data, id) {
  const items = data.cards.map((card, i) => `<h3 class="topic-tabs_heading" style="--topic-index: ${i + 1}"><button class="topic-tabs_tab" type="button" id="${id}-tab-${i + 1}" aria-controls="${id}-panel-${i + 1}" aria-expanded="${i === 0}" data-topic-tab><span class="topic-tabs_tab-label" aria-hidden="true">${number(i)}</span><span class="topic-tabs_tab-title">${renderText(card.heading)}</span></button></h3>
<div class="topic-tabs_panel" role="region" id="${id}-panel-${i + 1}" aria-labelledby="${id}-tab-${i + 1}" data-topic-panel><p class="body-text_component is-summary is-regular">${renderText(card.text)}</p>${evidenceSource(card)}<div class="evidence-explorer_media">${image(card.image, 'evidence-explorer_image', {decorative: true})}</div></div>`).join('\n');
  return section('evidence-explorer', id, `<div class="topic-tabs_component is-light">${evidenceHead(data, id, 1)}<div class="topic-tabs_layout" style="--topic-count: ${data.cards.length}" data-topic-tabs>${items}</div></div>`);
}
function renderEvidenceCompact(data, id) {
  const cards = data.cards.map(card => `<li class="card_component evidence-compact_card"><div class="content-header_component"><h3 class="content-heading_component is-card">${renderText(card.heading)}</h3><p class="body-text_component">${renderText(card.text)}</p></div><div class="evidence-compact_footer">${image(card.image, 'evidence-compact_thumb', {decorative: true})}${evidenceSource(card)}</div></li>`).join('\n');
  return section('evidence-compact', id, `<div class="section-layout_component is-responsive">${evidenceHead(data, id, 2)}<ul class="evidence-compact_list" aria-label="${escapeHtml(data.listLabel)}">${cards}</ul></div>`);
}

/* Программа обучения: проектный блок topic-tabs (перенесён из rodbt-record, лейаут программы «Психосоматики»).
   Тёмный контейнер, слева кнопки модулей, справа белая карточка с темами выбранного модуля.
   Одна разметка на все ширины: кнопка модуля и сразу за ней его панель. До 1025px это аккордеон
   (панель раскрывается под кнопкой), от 1025px кнопки стоят колонкой слева, открытая панель справа.
   Открыт всегда один модуль; без скрипта видны все панели. Модуль 4 помечен «Входит в полный курс»,
   итоговое оценивание идёт последней вкладкой без номера. */
function renderProgram(data, id) {
  const schedule = `<ul class="program-schedule_component" aria-label="Расписание занятий">${data.schedule.map(item => `<li class="program-schedule_item"><span>${renderText(item.label)}</span><span class="program-schedule_time">${renderText(item.detail)}</span></li>`).join('')}</ul>`;
  const items = data.modules.map((module, i) => `<h3 class="topic-tabs_heading" style="--topic-index: ${i + 1}"><button class="topic-tabs_tab" type="button" id="${id}-tab-${i + 1}" aria-controls="${id}-panel-${i + 1}" aria-expanded="${i === 0}" data-topic-tab><span class="topic-tabs_tab-label" aria-hidden="true">${module.final ? '—' : number(i)}</span><span class="topic-tabs_tab-title">${renderText(module.heading)}</span></button></h3>
<div class="topic-tabs_panel" role="region" id="${id}-panel-${i + 1}" aria-labelledby="${id}-tab-${i + 1}" data-topic-panel><div class="program-panel_copy">${module.label ? `<span class="program-modules_label">${renderText(module.label)}</span>` : ''}<ul class="program-modules_points">${module.points.map(text => `<li class="body-text_component is-detailed program-modules_point">${renderText(text)}</li>`).join('')}</ul></div></div>`).join('\n');
  return section('program', id, `<div class="topic-tabs_component"><div class="section-header_component is-center is-responsive"><h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(data.heading)}</h2>${schedule}</div><div class="topic-tabs_layout" style="--topic-count: ${data.modules.length}" data-topic-tabs>${items}</div></div>`);
}

/* Проектный блок instructor: «Автор и преподаватель курса», три варианта на выбор (05.10.2026). Во всех заголовок
   секции стоит по центру над блоком, а имя, фото и описание — внутри белой карточки, имя мельче заголовка:
   так они не спорят за внимание. Остаться должен один: лишние убрать из sections и из titles в build-tilda.mjs.
   card   — фото на всю высоту карточки слева, справа имя и описание;
   avatar — компактная карточка по центру: фото кружком рядом с именем, описание ниже;
   quote  — описание крупным текстом, под ним подпись: фото кружком и имя. */
const instructorHead = (data, id, index) => `<div class="section-header_component is-center is-responsive">${variantNote(data.variantLabels[index])}<h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(data.heading)}</h2></div>`;
const instructorName = data => `<h3 class="content-heading_component is-card instructor_name">${renderText(data.name)}</h3>`;
function renderInstructorCard(data, id) {
  return section('instructor-card', id, `<div class="section-layout_component is-responsive">${instructorHead(data, id, 0)}<div class="card_component instructor-card_component"><div class="instructor-card_media">${image(data.photo, 'instructor-card_photo')}</div><div class="instructor-card_copy">${instructorName(data)}${paragraphs(data.paragraphs)}</div></div></div>`);
}
function renderInstructorAvatar(data, id) {
  return section('instructor-avatar', id, `<div class="section-layout_component is-responsive">${instructorHead(data, id, 1)}<div class="card_component instructor-avatar_component"><div class="instructor-avatar_person">${image(data.photo, 'instructor-avatar_photo')}${instructorName(data)}</div>${paragraphs(data.paragraphs)}</div></div>`);
}
function renderInstructorQuote(data, id) {
  return section('instructor-quote', id, `<div class="section-layout_component is-responsive">${instructorHead(data, id, 2)}<figure class="card_component instructor-quote_component"><div class="instructor-quote_text">${(data.paragraphs || []).map(text => `<p class="instructor-quote_lead">${renderText(text)}</p>`).join('')}</div><figcaption class="instructor-quote_person">${image(data.photo, 'instructor-quote_photo')}<span class="content-heading_component is-card instructor_name">${renderText(data.name)}</span></figcaption></figure></div>`);
}

/* Плитка тарифов под первым экраном. Общий компонент benefits умеет только «заголовок + текст», поэтому
   первую плитку сборка заменяет своей разметкой: два тарифа рядом через тонкую линию — название тарифа,
   часы крупно, недели под ними. Заголовок плитки («Длительность обучения») остаётся для скринридера. */
function withTariffCard(markup, card) {
  const tile = `<li class="card_component benefits_card">${'<div class="card_content">'}<h2 class="card_heading">${card.heading.replaceAll(NBSP, '&nbsp;')}</h2></div></li>`;
  if (markup.split(tile).length !== 2) throw new Error('Hero: не найдена плитка тарифов');
  const items = card.tariffs.map(t => `<li class="tariff-tile_item"><span class="tariff-tile_label">${renderText(t.label)}</span><span class="tariff-tile_value"><span class="tariff-tile_hours">${renderText(t.hours)}</span><span class="tariff-tile_weeks">${renderText(t.weeks)}</span></span></li>`).join('');
  return markup.replace(tile, `<li class="card_component benefits_card tariff-tile_component"><h2 class="screen-reader-only">${renderText(card.heading)}</h2><ul class="tariff-tile_list">${items}</ul></li>`).replaceAll(NBSP, '&nbsp;');
}

/* Документы: общий блок «Диплом» Академии (текст, лицензия, изображение удостоверения). */
const renderDocuments = (data, id) => renderDiploma(data, {id}).replace('class="section_diploma ', 'class="section_documents section_diploma ');

/* Промо-блок цены. Запаска строится при сборке из data/course.json (два тарифа, режим plans). Если задан
   CMS_SLUG, сборка сначала спрашивает курс у Public API, а в браузере блок перерисовывает pricing-promo.js. */
async function renderPricing(id) {
  let course = await json('course');
  if (CMS_SLUG) {
    try {
      const response = await fetch(`${API}/api/public/course/${CMS_SLUG}`, {headers: {Accept: 'application/json'}, signal: AbortSignal.timeout(8000)});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const fresh = await response.json();
      if (fresh.error) throw new Error(fresh.error);
      course = fresh;
      await fs.writeFile(new URL('data/course.json', root), JSON.stringify(course, null, 2) + '\n');
    } catch (error) {
      console.warn(`API недоступен (${error.message}), запаска цены из data/course.json`);
    }
  }
  const PricingPromo = await loadPricingPromo();
  const markup = PricingPromo.render(PricingPromo.fromApi(course, {id}));
  const live = CMS_SLUG ? ` data-price-block data-course="${CMS_SLUG}" data-api="${API}" data-block-id="${id}"` : '';
  return {
    // Внешняя карточка pricing-promo_card из pricing-promo.css: колонка формы, поля и скругление контейнера программы.
    html: `<section class="section_pricing section-spacing_component" id="${sectionId(id)}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge column-grid_component"><div class="column-grid_content is-content-wide"><div class="pricing-promo_card"><div class="pricing-promo"${live}>${markup}</div></div></div></div></div>
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
  let heroMarkup = renderHeroSection(JSON.parse(JSON.stringify(hero).replaceAll(NBSP, '&nbsp;')), context);
  heroMarkup = withTariffCard(heroMarkup, hero.benefits.cards[0]);

  const leadForm = typeset(await json('lead-form'));
  leadForm.errorIcon = await dataUrl(consultant, 'assets/icons/form-error.svg');
  leadForm.successIcon = await dataUrl(consultant, 'assets/icons/form-success.svg');
  const form = renderLeadFormSection(leadForm, {id: `${SLUG}-application`, formId: `${SLUG}-form`});

  const pricing = await renderPricing(`${SLUG}-pricing`);
  const useCases = typeset(await json('use-cases'));
  const evidence = typeset(await json('evidence'));
  const instructor = typeset(await json('instructor'));
  // Порядок секций по ТЗ. Пятого экрана в ТЗ нет, нумерация там идёт с четвёртого сразу на шестой.
  const sections = [
    heroMarkup,
    renderAboutSteps(typeset(await json('about')), `${SLUG}-about`),
    renderCardSet('principles', typeset(await json('principles')), `${SLUG}-principles`),
    // Три варианта блока «Где можно применять» (05.10.2026), остаться должен один.
    renderUseCasesCards(useCases, `${SLUG}-use-cases-cards`),
    renderUseCasesTabs(useCases, `${SLUG}-use-cases-tabs`),
    renderUseCasesRows(useCases, `${SLUG}-use-cases-rows`),
    // «Для кого»: общий блок Академии course-audience — вводная фраза внутри абзаца, справа общее фото Академии.
    // Ширина как у образца (trauma-ptsd «После курса вы сможете»): колонка is-content-wide вместо узкой is-content-medium.
    renderCourseAudience(typeset(await json('audience')), {id: `${SLUG}-audience`}).replace('column-grid_content is-content-medium', 'column-grid_content is-content-wide'),
    renderProgram(typeset(await json('program')), `${SLUG}-program`),
    renderCardSet('skills', typeset(await json('skills')), `${SLUG}-skills`),
    renderPractice(typeset(await json('practice')), `${SLUG}-practice`),
    // Три варианта «Доказательной базы» (05.10.2026), остаться должен один.
    renderEvidenceZigzag(evidence, `${SLUG}-evidence-zigzag`),
    renderEvidenceExplorer(evidence, `${SLUG}-evidence-explorer`),
    renderEvidenceCompact(evidence, `${SLUG}-evidence-compact`),
    // Три варианта блока преподавателя (05.10.2026), остаться должен один.
    renderInstructorCard(instructor, `${SLUG}-instructor-card`),
    renderInstructorAvatar(instructor, `${SLUG}-instructor-avatar`),
    renderInstructorQuote(instructor, `${SLUG}-instructor-quote`),
    renderDocuments(typeset(await json('documents')), `${SLUG}-documents`),
    renderCardSet('why-us', typeset(await json('why-us')), `${SLUG}-why-us`),
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
    <meta name="robots" content="noindex,nofollow">
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
    <!-- Сгенерировано: node narrative-therapy/build.mjs. Тексты в data/*.json, тема и проектные блоки в page.css. Руками не править. -->
    <main class="main-wrapper academy-page narrative-therapy-page" id="main-content" tabindex="-1" data-academy-anchor-scroll>
${body}
    </main>
  </body>
</html>
`;
  const ids = [...html.matchAll(/(?<![\w-])id="([^"]+)"/g)].map(m => m[1]);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length) throw new Error(`Повторяющиеся id: ${duplicates.join(', ')}`);
  for (const link of html.matchAll(/href="#([a-z][a-z0-9-]*)"/g)) if (!ids.includes(link[1])) throw new Error(`Якорь без цели: #${link[1]}`);
  if (/\.\.\/web-academy|localhost|127\.0\.0\.1/.test(html)) throw new Error('В index.html остались локальные ссылки');
  // Локальные картинки допустимы только из папки assets лендинга; для Тильды им нужна ссылка на CDN (см. build-tilda.mjs).
  for (const [, file] of html.matchAll(/src="(assets\/[^"]+)"/g)) {
    await fs.access(new URL(file, root)).catch(() => { throw new Error(`Нет локального файла ${file}`); });
    console.warn(`Локальная картинка ${file}: для Тильды нужна ссылка на CDN`);
  }
  return {html, mode: pricing.mode};
}

async function buildCss() {
  const order = ['components.css', 'card-spacing.css', 'hero.css', 'benefits.css', 'section-spacing.css', 'body-text.css', 'button.css', 'toggle-icon.css', 'faq-responsive.css', 'lead-form.css', 'lead-form-responsive.css', 'pricing-promo.css', 'diploma.css', 'course-audience.css', 'section-heading.css', 'anchor-scroll.css'];
  const parts = [];
  for (const name of order) {
    let css = await read(shared, name);
    if (name === 'toggle-icon.css') css = css.replaceAll("url('./assets/disclosure-cross.svg')", `url("${await dataUrl(shared, 'assets/disclosure-cross.svg')}")`);
    assertResponsiveContract(css, name);
    parts.push(`/* === web-academy/shared/academy/${name} === */\n${css.trim()}`);
  }
  const page = await read(root, 'page.css');
  assertResponsiveContract(page, 'page.css');
  const css = `/* Сгенерировано: node narrative-therapy/build.mjs. Общие компоненты Академии, затем тема и проектные блоки из page.css. Руками не править. */\n\n${parts.join('\n\n')}\n\n/* === narrative-therapy/page.css === */\n${page.trim()}\n`;
  assertMotionContract(css, 'style.css');
  if (/url\((['"]?)(\.\/|\.\.\/|assets\/)/.test(css)) throw new Error('В style.css остались локальные url()');
  return css;
}

async function buildJs() {
  // Скрипты цены нужны только при живой привязке к CMS: без неё блок цены статичен.
  const order = ['components.js', 'anchor-scroll.js', ...(CMS_SLUG ? ['pricing.js', 'pricing-promo-render.js', 'pricing-promo.js'] : []), 'lead-form.js'];
  const parts = [];
  for (const name of order) parts.push(`/* === web-academy/shared/academy/${name} === */\n${(await read(shared, name)).trim()}`);
  parts.push(`/* === narrative-therapy/page.js === */\n${(await read(root, 'page.js')).trim()}`);
  const js = `/* Сгенерировано: node narrative-therapy/build.mjs. Общие скрипты Академии в порядке зависимостей. Руками не править. */\n\n${parts.join('\n\n')}\n`;
  assertResponsiveContract(js, 'script.js');
  return js;
}

const {html, mode} = await buildHtml();
await fs.writeFile(new URL('index.html', root), html);
await fs.writeFile(new URL('style.css', root), await buildCss());
await fs.writeFile(new URL('script.js', root), await buildJs());
console.log(`narrative-therapy: index.html ${html.length} символов, блок цены в режиме ${mode}`);
