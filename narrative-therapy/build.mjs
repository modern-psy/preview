// Сборка лендинга курса «Основы нарративной практики» (префикс narrative-therapy) из компонентов Академии.
// Основа: лендинг rodbt-record (тема, сборка, блок цены); контент по ТЗ «нарративная практика» (05.10.2026)
// и со старой страницы modern-psy.ru/narrative-therapy там, где ТЗ говорит «оставляем как есть».
// Запуск из apps/preview: node narrative-therapy/build.mjs
// Вход: data/*.json (тексты), page.css (тема и проектные блоки), общие компоненты web-academy/shared/academy (только при сборке).
// Выход: index.html, style.css, script.js — самодостаточные, без runtime-ссылок на web-academy.
import fs from 'node:fs/promises';
import {renderHeroSection} from '../web-academy/shared/academy/hero-render.mjs';
import {renderLeadFormSection} from '../web-academy/shared/academy/lead-form-render.mjs';
import {renderFaq} from '../web-academy/shared/academy/faq-render.mjs';
import {renderCourseAudience} from '../web-academy/shared/academy/course-audience-render.mjs';
import {escapeHtml, renderText, sectionId} from '../web-academy/shared/academy/html-render.mjs';
import {renderPricing as renderAcademyPricing} from '../web-academy/shared/academy/pricing-render.mjs';
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

/* Проектный блок use-cases: «Где можно применять нарративный подход» (выбран вариант 3 из трёх, 05.10.2026,
   нумерация убрана по просьбе пользователя). Одна белая панель, шесть ситуаций строками через тонкую линию;
   справа от текста анимированная схема ситуации (scenes.mjs). На телефоне схема под текстом. */
function renderUseCases(data, id) {
  const rows = data.cards.map(card => `<li class="use-cases_row"><div class="content-header_component"><h3 class="content-heading_component is-card">${renderText(card.heading)}</h3><p class="body-text_component">${renderText(card.text)}</p></div><div class="use-cases_stage">${renderScene(card.scene)}</div></li>`).join('\n');
  return section('use-cases', id, `<div class="section-layout_component is-responsive"><div class="section-header_component is-center is-responsive"><h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(data.heading)}</h2></div><ul class="use-cases_rows" aria-label="${escapeHtml(data.listLabel)}">${rows}</ul></div>`);
}

/* Проектный блок practice: три карточки форматов практики и фото группы рядом. */
function renderPractice(data, id) {
  const cards = data.cards.map(card => `<li class="card_component practice_card"><div class="content-header_component"><h3 class="content-heading_component is-card">${renderText(card.heading)}</h3><p class="body-text_component">${renderText(card.text)}</p></div></li>`).join('\n');
  return section('practice', id, `<div class="section-layout_component is-responsive">${header(id, data)}<div class="practice_layout"><ul class="practice_list" aria-label="${escapeHtml(data.listLabel)}">${cards}</ul><div class="practice_media">${image(data.image, 'practice_image')}</div></div></div>`);
}

const evidenceSource = card => `<p class="body-text_component is-fine-print evidence_source">${renderText(card.source)}</p>`;

/* «Доказательная база»: лента карточек со стрелками (выбран вариант 4 из четырёх, 05.10.2026), перенесена из «Психосоматики»
   (блок «7 систем организма»). Слева заголовок и описание, справа стрелки; лента уходит за правый край экрана,
   листается пальцем, колесом и стрелками (page.js). Карточка: картинка 3:2, вывод, пояснение, источник. */
function renderEvidenceCarousel(data, id) {
  const cards = data.cards.map(card => `<li class="evidence-carousel_card"><div class="evidence-carousel_media">${image(card.image, 'evidence-carousel_image', {decorative: true})}</div><div class="evidence-carousel_copy"><h3 class="content-heading_component is-card">${renderText(card.heading)}</h3><p class="body-text_component">${renderText(card.text)}</p>${evidenceSource(card)}</div></li>`).join('\n');
  const controls = `<div class="slider_controls" data-slider-controls="${id}"><button class="slider_arrow" type="button" data-slider-prev aria-label="Назад"><span class="slider_arrow-icon is-prev" aria-hidden="true"></span></button><button class="slider_arrow is-accent" type="button" data-slider-next aria-label="Вперёд"><span class="slider_arrow-icon" aria-hidden="true"></span></button></div>`;
  return section('evidence-carousel', id, `<div class="evidence-carousel_component"><div class="evidence-carousel_intro"><div class="section-header_component is-left is-responsive"><h2 class="section-title_component is-left is-responsive" id="${id}-heading">${renderText(data.heading)}</h2>${paragraphs(data.paragraphs)}</div>${controls}</div><ul class="evidence-carousel_track" data-slider-track="${id}" tabindex="0" aria-label="${escapeHtml(data.listLabel)}: лента карточек">${cards}</ul></div>`);
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

/* Преподаватель: широкая карточка из RFT (/rft, раздел «Преподаватель», 05.10.2026 по просьбе пользователя).
   Заголовок секции над карточкой; в карточке фото на сиреневой подложке, имя, роль, регалии плашками
   и факты биографии с галочкой через тонкие линии. Телефон: фото сверху; от 768px фото слева. */
function renderInstructor(data, id) {
  const tags = data.tags?.length ? `<ul class="teacher_tags">${data.tags.map(tag => `<li class="teacher_tag">${renderText(tag)}</li>`).join('')}</ul>` : '';
  const facts = data.facts?.length ? `<ul class="teacher_facts">${data.facts.map(fact => `<li class="body-text_component teacher_fact">${renderText(fact)}</li>`).join('')}</ul>` : '';
  return section('instructor', id, `<div class="section-layout_component is-responsive"><div class="section-header_component is-center is-responsive"><h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(data.heading)}</h2></div><article class="teacher_card"><div class="teacher_portrait">${image(data.photo, 'teacher_photo')}</div><div class="teacher_body"><div class="teacher_intro"><h3 class="teacher_name">${renderText(data.name)}</h3><p class="body-text_component is-summary is-regular teacher_role">${renderText(data.role)}</p>${tags}</div>${facts}</div></article></div>`);
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

/* Документы: блок удостоверения из RFT (/rft, раздел «Документы», 05.10.2026 по просьбе пользователя).
   Белая карточка: слева заголовок с акцентом, условие получения с галочкой и лицензия, справа фото выпускницы
   с сертификатом. Телефон: фото квадратом под текстом; от 768px две колонки, фото по высоте текста. */
function renderDocuments(data, id) {
  const terms = data.terms.map(term => `<li class="document_term"><img src="${CHECK_ICON}" alt="" width="20" height="20" draggable="false" loading="lazy">${renderText(term)}</li>`).join('');
  return section('documents', id, `<div class="document_component"><div class="document_copy"><h2 class="section-title_component is-left is-responsive document_heading" id="${id}-heading">${renderText(data.heading)} <span class="section-title_accent">${renderText(data.headingAccent)}</span></h2><p class="body-text_component is-summary is-regular">${renderText(data.description)}</p><ul class="document_terms">${terms}</ul><p class="body-text_component is-fine-print document_license">${data.license.map(renderText).join('<br>')}</p></div><div class="document_media">${image(data.image, 'document_image')}</div></div>`);
}

const rub = value => `${new Intl.NumberFormat('ru-RU').format(value).replace(/\s/g, NBSP)}${NBSP}₽`;

/* Цена (выбран вариант 2 из трёх, 05.10.2026): общий блок тарифов Академии (pricing-render, «Психолог-консультант»): карточки тарифов,
   у полного курса фиолетовая подсветка и плашка «Популярный тариф» с огоньком, список «входит / не входит».
   Общий блок показывает цену в месяц в рассрочку, а у нас подтверждены только полные цены, поэтому строка цены
   после сборки заменяется на полную цену. Строка «Можно оплатить в рассрочку» (из ответа FAQ) пока закомментирована
   в HTML по просьбе пользователя: чтобы вернуть, поставить SHOW_INSTALLMENT = true. */
const SHOW_INSTALLMENT = false;
function renderPricingPlans(data, id) {
  const config = {id, title: data.title, streams: [{id: 'january', label: 'Поток 26 января', start: data.start}], icons: {...data.icons, highlight: data.icons.check},
    plans: data.plans.map(plan => ({id: plan.id, name: plan.name, description: plan.description, featured: plan.featured, prices: {january: {monthly: plan.total, total: plan.total, months: 1}}, action: 'enroll', actionLabel: data.actionLabel, href: data.href, features: plan.features.map(([text, included]) => ({text, included}))}))};
  let markup = renderAcademyPricing(config);
  // Та же запись суммы, что в pricing-render.mjs: строки меняются точной подстановкой, без регулярных выражений.
  const money = value => new Intl.NumberFormat('ru-RU').format(value).replaceAll('\u00a0', '&nbsp;') + '&nbsp;₽';
  const installment = `<p class="pricing_terms body-text_component is-caption is-regular is-statement">${renderText(typography(data.installmentNote))}</p>`;
  for (const plan of data.plans) {
    const from = `<p class="pricing_amount"><span class="pricing_number">${money(plan.total)}</span><span>/ мес</span></p><p class="pricing_terms body-text_component is-caption is-regular is-statement">На&nbsp;1&nbsp;месяца или ${money(plan.total)} одним платежом</p>`;
    if (markup.split(from).length !== 2) throw new Error(`Pricing plans: не найдена строка цены ${plan.id}`);
    markup = markup.replace(from, `<p class="pricing_amount"><span class="pricing_number">${money(plan.total)}</span></p>${SHOW_INSTALLMENT ? installment : `<!-- ${installment} -->`}`);
  }
  return `<section class="section_pricing-plans section-spacing_component" id="${sectionId(id)}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge column-grid_component"><div class="column-grid_content is-content-wide"><div class="pricing-promo_card pricing-plans_card">${markup}</div></div></div></div>
</section>`;
}

/* SEO по docs/seo.md: canonical, Open Graph и микроразметка JSON-LD. Всё берётся из тех же данных, что и страница:
   цены и тарифы — data/pricing.json, старт — data/seo.json (дата потока из CMS), вопросы — data/faq.json,
   преподаватель — data/instructor.json. Поэтому цена в разметке всегда совпадает с ценой на странице.
   og:image не задан: картинки 1200×630 для соцсетей пока нет (поле ogImage в seo.json). */
function renderSeoHead(seo) {
  const tags = [
    `<link rel="canonical" href="${escapeHtml(seo.canonical)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${escapeHtml(seo.siteName)}">`,
    `<meta property="og:locale" content="ru_RU">`,
    `<meta property="og:title" content="${escapeHtml(seo.ogTitle)}">`,
    `<meta property="og:description" content="${escapeHtml(seo.ogDescription)}">`,
    `<meta property="og:url" content="${escapeHtml(seo.canonical)}">`,
    ...(seo.ogImage ? [`<meta property="og:image" content="${escapeHtml(seo.ogImage.src)}">`, `<meta property="og:image:width" content="${seo.ogImage.width}">`, `<meta property="og:image:height" content="${seo.ogImage.height}">`, `<meta name="twitter:card" content="summary_large_image">`] : []),
  ];
  return tags.map(tag => `    ${tag}`).join('\n');
}
// Текст для разметки: без HTML и с обычными пробелами (на странице те же слова, только с неразрывными пробелами).
const plain = text => String(text).replace(/<[^>]+>/g, '').replaceAll(NBSP, ' ').replace(/\s+/g, ' ').trim();
const ldScript = data => `<script type="application/ld+json">\n${JSON.stringify(data, null, 2).replace(/</g, '\\u003c')}\n</script>`;
function renderJsonLd({seo, pricing, faq, instructor}) {
  const org = seo.organization;
  const orgId = `${org.url}/#organization`;
  const organization = {'@context': 'https://schema.org', '@type': 'EducationalOrganization', '@id': orgId, name: org.name, url: org.url, logo: org.logo, telephone: org.telephone, email: org.email,
    address: {'@type': 'PostalAddress', addressCountry: 'RU', postalCode: org.address.postalCode, addressLocality: org.address.addressLocality, streetAddress: org.address.streetAddress}};
  const course = {'@context': 'https://schema.org', '@type': 'Course', '@id': `${seo.canonical}#course`, name: pricing.courseName, description: seo.course.description, url: seo.canonical, inLanguage: 'ru',
    provider: {'@id': orgId}, educationalCredentialAwarded: seo.course.credential,
    hasCourseInstance: {'@type': 'CourseInstance', name: `Поток ${plain(pricing.start).replace(/^Старт /, '')}`, courseMode: seo.course.courseMode, startDate: seo.course.startDate,
      instructor: {'@type': 'Person', name: instructor.name, jobTitle: plain(instructor.role)},
      offers: pricing.plans.map(plan => ({'@type': 'Offer', name: plan.name, description: plan.description, price: String(plan.total), priceCurrency: 'RUB', availability: 'https://schema.org/InStock', url: seo.canonical}))}};
  const faqPage = {'@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.items.map(item => ({'@type': 'Question', name: plain(item.question), acceptedAnswer: {'@type': 'Answer', text: item.answer.map(plain).join(' ')}}))};
  return [organization, course, faqPage].map(ldScript).join('\n');
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

  const pricingVariants = await json('pricing');
  // Порядок секций по ТЗ. Пятого экрана в ТЗ нет, нумерация там идёт с четвёртого сразу на шестой.
  const sections = [
    heroMarkup,
    renderAboutSteps(typeset(await json('about')), `${SLUG}-about`),
    renderCardSet('principles', typeset(await json('principles')), `${SLUG}-principles`),
    renderUseCases(typeset(await json('use-cases')), `${SLUG}-use-cases`),
    // «Для кого»: общий блок Академии course-audience — вводная фраза внутри абзаца, справа общее фото Академии.
    // Ширина как у образца (trauma-ptsd «После курса вы сможете»): колонка is-content-wide вместо узкой is-content-medium.
    renderCourseAudience(typeset(await json('audience')), {id: `${SLUG}-audience`}).replace('column-grid_content is-content-medium', 'column-grid_content is-content-wide'),
    renderProgram(typeset(await json('program')), `${SLUG}-program`),
    renderCardSet('skills', typeset(await json('skills')), `${SLUG}-skills`),
    renderPractice(typeset(await json('practice')), `${SLUG}-practice`),
    renderEvidenceCarousel(typeset(await json('evidence')), `${SLUG}-evidence`),
    renderInstructor(typeset(await json('instructor')), `${SLUG}-instructor`),
    renderDocuments(typeset(await json('documents')), `${SLUG}-documents`),
    renderCardSet('why-us', typeset(await json('why-us')), `${SLUG}-why-us`),
    renderPricingPlans(pricingVariants, `${SLUG}-pricing`),
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
${renderSeoHead(seo)}
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
${renderJsonLd({seo, pricing: pricingVariants, faq: await json('faq'), instructor: await json('instructor')})}
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
  return html;
}

async function buildCss() {
  const order = ['components.css', 'card-spacing.css', 'hero.css', 'benefits.css', 'section-spacing.css', 'body-text.css', 'button.css', 'toggle-icon.css', 'faq-responsive.css', 'lead-form.css', 'lead-form-responsive.css', 'pricing-promo.css', 'pricing.css', 'course-audience.css', 'section-heading.css', 'anchor-scroll.css'];
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
  // pricing.js — поведение общего блока тарифов (порядок карточек на телефоне).
  const order = ['components.js', 'anchor-scroll.js', 'pricing.js', 'lead-form.js'];
  const parts = [];
  for (const name of order) parts.push(`/* === web-academy/shared/academy/${name} === */\n${(await read(shared, name)).trim()}`);
  parts.push(`/* === narrative-therapy/page.js === */\n${(await read(root, 'page.js')).trim()}`);
  const js = `/* Сгенерировано: node narrative-therapy/build.mjs. Общие скрипты Академии в порядке зависимостей. Руками не править. */\n\n${parts.join('\n\n')}\n`;
  assertResponsiveContract(js, 'script.js');
  return js;
}

const html = await buildHtml();
await fs.writeFile(new URL('index.html', root), html);
await fs.writeFile(new URL('style.css', root), await buildCss());
await fs.writeFile(new URL('script.js', root), await buildJs());
console.log(`narrative-therapy: index.html ${html.length} символов`);
