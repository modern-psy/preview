// Сборка лендинга «КПТ: Когнитивно-поведенческая терапия. Модель Бека» (префикс kpt-bek).
// Это пересборка живой страницы modern-psy.ru/kpt: композиция, состав блоков и картинки (Tilda CDN) как там,
// шрифт, отступы, адаптив и анимации из web-academy. Первый экран обновлён, программа стала табами.
// Запуск из apps/preview: node kpt-bek/build.mjs
// Вход: data/content.json (все тексты), page.css (тема и блоки страницы), page.js (поведение блоков страницы),
//   общие компоненты web-academy/shared/academy (форма, FAQ, диплом) и блок цены из CMS pricing/src (только при сборке).
// Выход: index.html, style.css, script.js — самодостаточные, без ссылок на web-academy и pricing во время работы страницы.
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {renderLeadFormSection} from '../web-academy/shared/academy/lead-form-render.mjs';
import {renderDiploma} from '../web-academy/shared/academy/diploma-render.mjs';
import {renderFaq} from '../web-academy/shared/academy/faq-render.mjs';
import {renderToggleIcon} from '../web-academy/shared/academy/toggle-icon-render.mjs';
import {escapeHtml, renderText} from '../web-academy/shared/academy/html-render.mjs';
import {assertMotionContract} from '../web-academy/shared/academy/motion-contract.mjs';
import {assertResponsiveContract} from '../web-academy/shared/academy/responsive.mjs';

const root = new URL('./', import.meta.url);
const shared = new URL('../web-academy/shared/academy/', import.meta.url);
const pricing = new URL('../pricing/src/', import.meta.url);
const consultant = new URL('../web-academy/projects/psychologist-consultant/', import.meta.url);
const read = (base, name) => fs.readFile(new URL(name, base), 'utf8');
const dataUrl = async (base, name) => `data:image/svg+xml;base64,${Buffer.from(await read(base, name), 'utf8').toString('base64')}`;

const SLUG = 'kpt-bek';
const API = 'https://modern-psy-asp-prod-8ceb.twc1.net';
const NBSP = ' ';

// Типографика (web-academy rules/product/typography.md): предлоги, частицы, тире, числа с единицами не остаются на строке одни.
const SHORT_WORDS = 'а|в|и|к|о|с|у|я|во|до|за|из|на|не|ни|но|об|от|по|со|без|для|над|под|при|про|им\\.';
function typography(text) {
  return text
    .replace(new RegExp(`(?<=^|[\\s(«„"])(${SHORT_WORDS}) `, 'giu'), `$1${NBSP}`)
    .replace(/ (бы|же|ли)(?=[\s?.,!;:)»]|$)/giu, `${NBSP}$1`)
    .replace(/ —/g, `${NBSP}—`)
    .replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NBSP}`)
    .replace(/(\d) (?=[\p{L}₽%№])/gu, `$1${NBSP}`)
    .replace(/№ /g, `№${NBSP}`)
    .replace(/([А-ЯЁA-Z]\.) ([А-ЯЁA-Z]\.)/g, `$1${NBSP}$2`)
    .replace(/(академ\.) (ч|час)/g, `$1${NBSP}$2`);
}
// Пробелы связываются только в текстах: адреса, атрибуты и идентификаторы не трогаем.
const SKIP_KEYS = new Set(['src', 'url', 'image', 'video', 'popup', 'course', 'agreementUrl', 'privacyUrl', 'licenseUrl', 'nativeMarker', 'errorIcon', 'successIcon']);
function typeset(node, key) {
  if (typeof node === 'string') return SKIP_KEYS.has(key) ? node : typography(node);
  if (Array.isArray(node)) return node.map(item => typeset(item, key));
  if (node && typeof node === 'object') return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, typeset(v, k)]));
  return node;
}

const t = renderText;
const pad = i => String(i + 1).padStart(2, '0');
const CHECK = '<svg class="kpt-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5"/></svg>';
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z" fill="currentColor"/></svg>';
const ARROW = dir => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${dir === 'prev' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'}"/></svg>`;

const img = (media, className, {alt = '', lazy = true, extra = ''} = {}) => {
  if (!/^https:\/\//.test(media.src) || ![media.width, media.height].every(n => Number.isInteger(n) && n > 0)) throw new Error(`Картинка без CDN-ссылки или без размеров: ${media.src}`);
  return `<img class="${className}" src="${escapeHtml(media.src)}" width="${media.width}" height="${media.height}" alt="${escapeHtml(alt)}"${lazy ? ' loading="lazy" decoding="async"' : ''}${extra} draggable="false">`;
};
const header = (id, heading, {align = 'left', subtitle = '', tag = 'h2'} = {}) => `<div class="section-header_component is-${align} is-responsive"><${tag} class="section-title_component is-${align} is-responsive" id="${id}-heading">${t(heading)}</${tag}>${subtitle ? `<p class="section-subtitle_component">${t(subtitle)}</p>` : ''}</div>`;
const section = (name, id, inner) => `<section class="section_${name} section-spacing_component" id="${id}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge">
    ${inner}
  </div></div>
</section>`;
const ids = {hero: `${SLUG}-hero`, fit: `${SLUG}-fit`, why: `${SLUG}-why`, skills: `${SLUG}-skills`, program: `${SLUG}-program`, free: `${SLUG}-free`, teachers: `${SLUG}-teachers`, reasons: `${SLUG}-reasons`, diploma: `${SLUG}-diploma`, reviews: `${SLUG}-reviews`, pricing: `${SLUG}-pricing`, form: `${SLUG}-application`, faq: `${SLUG}-faq`};
// Ближайший старт: дата из снимка CMS при сборке; в браузере page.js ставит свежую (data-kpt-start).
const startSpan = date => `<span data-kpt-start>${t(date)}</span>`;

/* 1. Первый экран: светлая карточка, текст слева, фото справа. На телефоне и планшете — горизонтальная версия
   того же фото под текстом (art direction через <picture>, текст один). */
function renderHero(d) {
  const photo = `<picture class="kpt-hero_media"><source media="(min-width: 64.0625rem)" srcset="${escapeHtml(d.photo.desktop.src)}" width="${d.photo.desktop.width}" height="${d.photo.desktop.height}">${img(d.photo.mobile, 'kpt-hero_image', {alt: d.photo.alt, lazy: false, extra: ' fetchpriority="high"'})}</picture>`;
  return `<section class="section_kpt-hero" id="${ids.hero}" aria-labelledby="${ids.hero}-heading">
  <div class="padding-global"><div class="container-xlarge">
    <div class="kpt-hero_component">
      <div class="kpt-hero_copy">
        <ul class="kpt-pill_list" aria-label="О курсе">${d.pills.map(p => `<li class="kpt-pill">${t(p)}</li>`).join('')}</ul>
        <h1 class="kpt-hero_heading" id="${ids.hero}-heading">${t(d.heading)}<span class="kpt-hero_accent">${t(d.accent)}</span></h1>
        <div class="kpt-hero_text"><p class="body-text_component is-summary kpt-hero_lead">${t(d.lead)}</p><p class="body-text_component is-detailed">${t(d.text)}</p></div>
        <div class="kpt-hero_actions"><a class="button_component is-accent kpt-button" href="#${ids.form}">${t(d.primary)}</a><a class="button_component kpt-button is-soft" href="#${ids.program}">${t(d.secondary)}</a></div>
      </div>
      ${photo}
    </div>
  </div></div>
</section>`;
}

/* 2. Кому подойдёт: пять модулей карточками слева, сиреневая плашка с фактами справа (как на живой странице). */
function renderFit(d) {
  const cards = d.modules.map((m, i) => `<li class="card_component kpt-fit_card"><span class="kpt-fit_number" aria-hidden="true">${pad(i)}</span><div class="content-header_component"><h3 class="content-heading_component is-card">${t(m.heading)}</h3><p class="body-text_component">${t(m.text)}</p></div></li>`).join('');
  const facts = d.facts.map(f => `<div class="kpt-facts_item"><dt class="kpt-facts_label">${t(f.label)}</dt>${f.lines ? f.lines.map(l => `<dd class="kpt-facts_value">${t(l)}</dd>`).join('') : `<dd class="kpt-facts_value">${f.start ? startSpan(f.value) : t(f.value)}</dd>`}</div>`).join('');
  return section('kpt-fit', ids.fit, `<div class="section-layout_component is-responsive">${header(ids.fit, d.heading, {subtitle: d.subtitle})}<div class="kpt-fit_layout"><ol class="kpt-fit_list" aria-label="Модули курса">${cards}</ol><aside class="kpt-facts_component" aria-label="Коротко о курсе"><dl class="kpt-facts_list">${facts}</dl><a class="button_component is-light kpt-button" href="#${ids.program}">${t(d.button)}</a></aside></div></div>`);
}

/* 3. Почему КПТ: тёмная плашка, слева заголовок и фото, справа четыре карточки. */
function renderWhy(d) {
  const cards = d.cards.map(c => `<li class="card_component kpt-why_card"><div class="content-header_component"><h3 class="content-heading_component is-card">${t(c.heading)}</h3><p class="body-text_component">${t(c.text)}</p></div></li>`).join('');
  return section('kpt-why', ids.why, `<div class="kpt-why_component"><div class="kpt-why_intro">${header(ids.why, d.heading, {subtitle: d.subtitle})}</div><div class="kpt-why_media">${img(d.photo, 'kpt-why_image')}</div><ul class="kpt-why_list">${cards}</ul></div>`);
}

/* 4. Чему научитесь: четыре карточки 2×2, в каждой два пункта с галочкой. */
function renderSkills(d) {
  const cards = d.cards.map(c => `<li class="card_component kpt-skills_card"><h3 class="content-heading_component is-card">${t(c.heading)}</h3><ul class="kpt-checklist">${c.items.map(item => `<li class="kpt-checklist_item">${CHECK}<span class="body-text_component">${t(item)}</span></li>`).join('')}</ul></li>`).join('');
  return section('kpt-skills', ids.skills, `<div class="section-layout_component is-responsive">${header(ids.skills, d.heading, {align: 'center'})}<ul class="kpt-skills_list">${cards}</ul></div>`);
}

/* 5. Программа: сиреневая плашка, табы модулей слева и содержание справа.
   Одна разметка на все ширины: кнопка модуля и сразу за ней его панель. До 1025 px это аккордеон,
   от 1025 px кнопки встают колонкой слева, открытая панель справа. Без скрипта видны все панели. */
function renderProgram(d) {
  const items = d.modules.map((m, i) => {
    const tab = `${ids.program}-tab-${i + 1}`, panel = `${ids.program}-panel-${i + 1}`;
    return `<h3 class="kpt-program_heading"><button class="kpt-program_tab" type="button" id="${tab}" aria-controls="${panel}" aria-expanded="${i === 0}" data-program-tab><span class="kpt-program_number" aria-hidden="true">${pad(i)}</span><span class="kpt-program_tab-copy"><span class="kpt-program_tab-title">${t(m.heading)}</span><span class="kpt-program_tab-hours">${t(m.hours)}</span></span>${renderToggleIcon({className: 'kpt-program_icon'})}</button></h3>
<div class="kpt-program_panel" id="${panel}" role="region" aria-labelledby="${tab}" data-program-panel><div class="kpt-program_panel-head" aria-hidden="true"><p class="kpt-program_panel-title">${t(m.heading)}</p><p class="kpt-pill">${t(m.hours)}</p></div><p class="body-text_component is-detailed kpt-program_text">${t(m.text)}</p>${m.note ? `<p class="kpt-program_note">${t(m.note)}</p>` : ''}<p class="kpt-program_topics-label">${t(d.topicsLabel)}</p><ul class="kpt-program_topics${m.topics.length > 7 ? ' is-columns' : ''}">${m.topics.map(topic => `<li class="kpt-program_topic">${t(topic)}</li>`).join('')}</ul></div>`;
  }).join('\n');
  const schedule = `<div class="kpt-program_schedule">${d.schedule.map(line => `<p class="section-subtitle_component">${t(line)}</p>`).join('')}</div>`;
  return section('kpt-program', ids.program, `<div class="kpt-program_component"><div class="section-header_component is-left is-responsive"><h2 class="section-title_component is-left is-responsive" id="${ids.program}-heading">${t(d.heading)}</h2>${schedule}</div><div class="kpt-program_layout" style="--program-count: ${d.modules.length}" data-program-tabs>${items}</div><div class="kpt-program_cta"><a class="button_component is-accent kpt-button" href="#${ids.form}">${t(d.button)}</a></div></div>`);
}

/* 6. Бесплатные лекции: карточка с условиями и кнопкой, рядом список двух лекций.
   Кнопка открывает нативный поп-ап Тильды (#free-bek); на превью поп-апа нет, кнопка ничего не делает. */
function renderFree(d) {
  const items = d.items.map(item => `<li class="kpt-checklist_item">${CHECK}<span class="body-text_component">${t(item)}</span></li>`).join('');
  const lectures = d.lectures.map(l => `<li class="kpt-free_lecture"><span class="kpt-free_play" aria-hidden="true">${PLAY}</span><div class="kpt-free_lecture-copy"><p class="kpt-free_module">${t(l.module)}</p><h4 class="content-heading_component is-card">${t(l.title)}</h4><p class="body-text_component is-detailed">${t(l.text)}</p></div></li>`).join('');
  return section('kpt-free', ids.free, `<div class="section-layout_component is-responsive">${header(ids.free, d.heading)}<div class="kpt-free_layout"><div class="card_component kpt-free_card"><div class="kpt-free_copy"><h3 class="content-heading_component is-prominent">${t(d.title)}</h3><p class="body-text_component is-detailed">${t(d.text)}</p><ul class="kpt-checklist">${items}</ul><p class="kpt-free_note body-text_component is-detailed">${t(d.note)} <b>${t(d.noteStrong)}</b></p></div><a class="button_component is-accent kpt-button kpt-free_button" href="${escapeHtml(d.popup)}" data-tilda-popup-link data-anchor-scroll-ignore>${t(d.button)}</a></div><div class="card_component kpt-free_list-card"><p class="kpt-free_list-heading">${t(d.listHeading)}</p><ol class="kpt-free_lectures">${lectures}</ol></div></div></div>`);
}

/* 7. Преподаватели: имена кнопками-вкладками, рядом карточка выбранного. На телефоне имена в одну
   прокручиваемую строку над карточкой. Без скрипта видна только первая карточка (у неё is-active). */
function renderTeachers(d) {
  const tabs = d.people.map((p, i) => `<button class="kpt-teachers_tab" type="button" role="tab" id="${ids.teachers}-tab-${i + 1}" aria-controls="${ids.teachers}-panel-${i + 1}" aria-selected="${i === 0}" tabindex="${i ? -1 : 0}" data-teacher-tab>${t(p.name)}</button>`).join('');
  const panels = d.people.map((p, i) => `<article class="kpt-teachers_card${i === 0 ? ' is-active' : ''}" role="tabpanel" id="${ids.teachers}-panel-${i + 1}" aria-labelledby="${ids.teachers}-tab-${i + 1}" tabindex="0" data-teacher-panel>${img(p.photo, 'kpt-teachers_photo', {alt: p.name})}<div class="kpt-teachers_copy"><h3 class="content-heading_component is-profile">${t(p.name)}</h3>${p.bio.map(line => `<p class="body-text_component is-detailed">${t(line)}</p>`).join('')}</div></article>`).join('');
  return section('kpt-teachers', ids.teachers, `<div class="section-layout_component is-responsive">${header(ids.teachers, d.heading, {subtitle: d.subtitle})}<div class="kpt-teachers_component" data-teachers><div class="kpt-teachers_tabs" role="tablist" aria-label="${escapeHtml(d.listLabel)}">${tabs}</div><div class="kpt-teachers_panels">${panels}</div></div></div>`);
}

/* 8. Почему выбирают нас: пять карточек, на десктопе три сверху и две снизу. */
function renderReasons(d) {
  const cards = d.cards.map(c => `<li class="card_component kpt-reasons_card"><div class="content-header_component"><h3 class="content-heading_component is-card">${t(c.heading)}</h3><p class="body-text_component">${t(c.text)}</p></div></li>`).join('');
  return section('kpt-reasons', ids.reasons, `<div class="section-layout_component is-responsive">${header(ids.reasons, d.heading, {align: 'center'})}<ul class="kpt-reasons_list">${cards}</ul></div>`);
}

/* 9. Диплом: общий блок Академии. Номер лицензии ведёт в реестр Рособрнадзора, как на живой странице. */
function renderDiplomaSection(d) {
  const html = renderDiploma(d, {id: ids.diploma});
  const number = t(d.license[1].split(',')[0]);
  if (!html.includes(number)) throw new Error('Диплом: не найден номер лицензии для ссылки');
  return html.replace(number, `<a class="kpt-link" href="${escapeHtml(d.licenseUrl)}" target="_blank" rel="noopener noreferrer">${number}</a>`);
}

/* 10. Отзывы: лента видеокарточек. Видео Kinescope включается прямо в карточке, без поп-апа (page.js). */
function renderReviews(d) {
  const cards = d.items.map(r => `<li class="kpt-review_card"><button class="kpt-review_media" type="button" aria-label="${escapeHtml(`${d.button}: ${r.name}`)}" data-review-video="${escapeHtml(r.video)}">${img(r.photo, 'kpt-review_image')}<span class="kpt-review_play" aria-hidden="true">${PLAY}</span></button><div class="kpt-review_copy"><h3 class="content-heading_component is-card">${t(r.name)}</h3><p class="body-text_component is-detailed">${t(r.quote)}</p></div></li>`).join('');
  const nav = `<div class="kpt-reviews_nav"><button class="kpt-reviews_arrow" type="button" aria-label="Предыдущие отзывы" data-reviews-prev>${ARROW('prev')}</button><button class="kpt-reviews_arrow" type="button" aria-label="Следующие отзывы" data-reviews-next>${ARROW('next')}</button></div>`;
  return section('kpt-reviews', ids.reviews, `<div class="section-layout_component is-responsive" data-reviews><div class="kpt-reviews_head">${header(ids.reviews, d.heading)}${nav}</div><ul class="kpt-reviews_track" aria-label="${escapeHtml(d.listLabel)}" data-reviews-track>${cards}</ul></div>`);
}

/* 11. Цена: утверждённый блок цены из CMS (apps/preview/pricing). Сценарий, потоки, повышения и рассрочку
   скрипт блока выбирает сам по ответу CMS. При сборке в блок вшивается снимок цен на сегодня. */
async function renderPricing(d) {
  const [css, js, tilda] = await Promise.all(['price-auto.css', 'price-auto.js', 'tilda-block.js'].map(name => read(pricing, name)));
  const sandbox = {console, Intl, Date, Math, JSON, String, Number, Array, Object, isNaN};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(js, sandbox);
  vm.runInNewContext(tilda, sandbox);
  const P = sandbox.PriceAuto, T = sandbox.PriceAutoTilda;
  const response = await fetch(`${API}/api/public/course/${d.course}`, {headers: {Accept: 'application/json'}, signal: AbortSignal.timeout(10000)});
  if (!response.ok) throw new Error(`CMS ответила ${response.status} для ${d.course}`);
  const course = await response.json();
  const now = Date.now();
  const snap = T.trim(course, now);
  const opts = {system: 'figure', terms: true, includes: d.includes, tariffs: {}, uid: `price-auto-${d.course}-1`};
  const model = P.model(snap, now);
  const scenario = P.scenarioOf(model, opts);
  const fallback = P.render(model, {}, opts);
  const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
  // Ближайший открытый поток для «Ближайшего старта» и заголовка формы.
  const open = (course.streams || []).filter(s => ['Идет набор', 'Идёт набор', 'Последний шанс'].includes(s.status) && s.startDate && Date.parse(s.startDate) >= now - 864e5).sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate))[0];
  const start = open ? new Intl.DateTimeFormat('ru-RU', {day: 'numeric', month: 'long', timeZone: 'Europe/Moscow'}).format(new Date(open.startDate)) : null;
  const html = `<!-- Блок цены из CMS: стили и скрипт в style.css и script.js (разделы price-auto), источник apps/preview/pricing/src. -->
<section class="price-auto_component" id="${ids.pricing}" data-price-auto data-course="${d.course}" data-api="${API}" data-system="figure" data-terms="on" data-scenario="${scenario}" data-layout="academy" style="--pa-space-top: 0; --pa-space-bottom: var(--section-space)"${fallback ? '' : ' hidden'}>
  <div class="price-auto_padding">
    <div class="price-auto_container" data-price-auto-body>
      ${fallback}
    </div>
  </div>
  <script type="application/json" data-price-auto-snapshot>${json(snap)}</script>
  <script type="application/json" data-price-auto-extra>${json({includes: d.includes})}</script>
</section>`;
  return {html, css, js, scenario, start};
}

function renderForm(d, start) {
  const html = renderLeadFormSection(d, {id: ids.form, formId: `${SLUG}-form`});
  // Дата в заголовке формы та же, что «Ближайший старт»: page.js обновит её из CMS.
  const date = start || d.heading.replace(/^.*?начнутся\s+/u, '');
  const heading = t(d.heading);
  if (!html.includes(heading)) throw new Error('Форма: не найден заголовок для даты старта');
  return html.replace(heading, `${t(d.heading.replace(/(начнутся)\s.+$/u, '$1'))}${NBSP}${startSpan(date)}`);
}

function renderFaqSection(d, licenseUrl) {
  const html = renderFaq(d, {id: ids.faq});
  const number = 'Л035–01271–78/00176689';
  if (!html.includes(number)) throw new Error('FAQ: не найден номер лицензии для ссылки');
  return html.replace(number, `<a class="kpt-link" href="${escapeHtml(licenseUrl)}" target="_blank" rel="noopener noreferrer">${number}</a>`);
}

async function build() {
  const raw = JSON.parse(await read(root, 'data/content.json'));
  const c = typeset(raw);
  const form = {...c.form, errorIcon: await dataUrl(consultant, 'assets/icons/form-error.svg'), successIcon: await dataUrl(consultant, 'assets/icons/form-success.svg')};
  const price = await renderPricing(raw.pricing);
  if (price.start) {
    c.fit.facts.find(f => f.start).value = typography(price.start);
    form.heading = typography(`Занятия начнутся ${price.start}`);
  }
  const sections = [
    renderHero(c.hero),
    renderFit(c.fit),
    renderWhy(c.why),
    renderSkills(c.skills),
    renderProgram(c.program),
    renderFree(c.free),
    renderTeachers(c.teachers),
    renderReasons(c.reasons),
    renderDiplomaSection(c.diploma),
    renderReviews(c.reviews),
    price.html,
    renderForm(form, price.start && typography(price.start)),
    renderFaqSection(c.faq, raw.diploma.licenseUrl),
  ];
  const body = sections.join('\n').replaceAll(NBSP, '&nbsp;');
  const seo = raw.seo;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {'@type': 'EducationalOrganization', '@id': 'https://modern-psy.ru/#organization', name: 'Академия современной психологии', url: 'https://modern-psy.ru'},
      {'@type': 'Course', '@id': `${seo.url}#course`, name: seo.title, description: seo.description, url: seo.url, inLanguage: 'ru', provider: {'@id': 'https://modern-psy.ru/#organization'}, educationalCredentialAwarded: 'Диплом о профессиональной переподготовке'},
    ],
  };
  const html = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <title>${escapeHtml(seo.title)}</title>
    <meta name="description" content="${escapeHtml(seo.description)}">
    <link rel="canonical" href="${escapeHtml(seo.url)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${escapeHtml(seo.url)}">
    <meta property="og:title" content="${escapeHtml(seo.title)}">
    <meta property="og:description" content="${escapeHtml(seo.description)}">
    <meta property="og:image" content="${escapeHtml(seo.image)}">
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
    <!-- Сгенерировано: node kpt-bek/build.mjs. Тексты в data/content.json, стили блоков в page.css. Руками не править. -->
    <main class="main-wrapper academy-page kpt-bek-page" id="main-content" tabindex="-1" data-academy-anchor-scroll>
${body}
    </main>
    <script type="application/ld+json">${JSON.stringify(ld)}</script>
  </body>
</html>
`;
  const all = [...html.matchAll(/(?<![\w-])id="([^"]+)"/g)].map(m => m[1]);
  const duplicates = all.filter((id, i) => all.indexOf(id) !== i);
  if (duplicates.length) throw new Error(`Повторяющиеся id: ${duplicates.join(', ')}`);
  for (const link of html.matchAll(/href="#([a-z][a-z0-9-]*)"/g)) if (!all.includes(link[1]) && `#${link[1]}` !== raw.free.popup) throw new Error(`Якорь без цели: #${link[1]}`);
  if (/\.\.\/(web-academy|pricing)|localhost|127\.0\.0\.1/.test(html)) throw new Error('В index.html остались локальные ссылки');
  if (/thb\.tildacdn|\/resizeb?\//.test(html)) throw new Error('Миниатюры Тильды вместо полноразмерных картинок');
  return {html, price};
}

async function buildCss(price) {
  const order = ['components.css', 'card-spacing.css', 'section-spacing.css', 'body-text.css', 'button.css', 'toggle-icon.css', 'faq-responsive.css', 'lead-form.css', 'lead-form-responsive.css', 'diploma.css', 'section-heading.css', 'anchor-scroll.css'];
  const parts = [];
  for (const name of order) {
    let css = await read(shared, name);
    if (name === 'toggle-icon.css') css = css.replaceAll("url('./assets/disclosure-cross.svg')", `url("${await dataUrl(shared, 'assets/disclosure-cross.svg')}")`);
    assertResponsiveContract(css, name);
    parts.push(`/* === web-academy/shared/academy/${name} === */\n${css.trim()}`);
  }
  // Блок цены переносится один в один, как утверждён; у него свои переломы (в том числе 62rem), поэтому без проверки контракта.
  parts.push(`/* === pricing/src/price-auto.css (утверждённый блок цены, не править здесь) === */\n${price.css.trim()}`);
  const page = await read(root, 'page.css');
  assertResponsiveContract(page, 'page.css');
  const css = `/* Сгенерировано: node kpt-bek/build.mjs. Общие компоненты Академии, блок цены, затем тема и блоки страницы из page.css. Руками не править. */\n\n${parts.join('\n\n')}\n\n/* === kpt-bek/page.css === */\n${page.trim()}\n`;
  assertMotionContract(css, 'style.css');
  if (/url\((['"]?)(\.\/|\.\.\/|assets\/)/.test(css)) throw new Error('В style.css остались локальные url()');
  return css;
}

async function buildJs(price) {
  const parts = [];
  for (const name of ['components.js', 'anchor-scroll.js', 'lead-form.js']) parts.push(`/* === web-academy/shared/academy/${name} === */\n${(await read(shared, name)).trim()}`);
  parts.push(`/* === pricing/src/price-auto.js (утверждённый блок цены, не править здесь) === */\n${price.js.trim()}`);
  const page = await read(root, 'page.js');
  assertResponsiveContract(page, 'page.js');
  parts.push(`/* === kpt-bek/page.js === */\n${page.trim()}`);
  const js = `/* Сгенерировано: node kpt-bek/build.mjs. Общие скрипты Академии, блок цены и поведение страницы. Руками не править. */\n\n${parts.join('\n\n')}\n`;
  if (/<\/script/i.test(js)) throw new Error('В script.js есть </script');
  return js;
}

const {html, price} = await build();
await fs.writeFile(new URL('index.html', root), html);
await fs.writeFile(new URL('style.css', root), await buildCss(price));
await fs.writeFile(new URL('script.js', root), await buildJs(price));
console.log(`kpt-bek: index.html ${html.length} символов, блок цены «${price.scenario}», ближайший старт ${price.start || 'не найден'}`);
