// Сборка лендинга курса в записи «Первый уровень РО ДБТ» с Томасом Линчем (префикс rodbt-record) из компонентов Академии.
// Основа: лендинг живого курса rodbt-live; контент со страницы modern-psy.ru/rodbt, формат заменён на записи.
// Запуск из apps/preview: node rodbt-record/build.mjs
// Вход: data/*.json (тексты), page.css (тема и проектные блоки), общие компоненты web-academy/shared/academy (только при сборке).
// Выход: index.html, style.css, script.js — самодостаточные, без runtime-ссылок на web-academy.
import fs from 'node:fs/promises';
import {renderHeroSection} from '../web-academy/shared/academy/hero-render.mjs';
import {courseAudienceImage} from '../web-academy/shared/academy/course-audience-render.mjs';
import {renderLearningTimeline} from '../web-academy/shared/academy/learning-timeline-render.mjs';
import {renderLeadFormSection} from '../web-academy/shared/academy/lead-form-render.mjs';
import {renderDiploma} from '../web-academy/shared/academy/diploma-render.mjs';
import {renderFaq} from '../web-academy/shared/academy/faq-render.mjs';
import {renderAcademyShowcase} from '../web-academy/shared/academy/academy-showcase-render.mjs';
import {renderToggleIcon} from '../web-academy/shared/academy/toggle-icon-render.mjs';
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

const SLUG = 'rodbt-record';
const API = 'https://modern-psy-asp-prod-8ceb.twc1.net';
// Слаг курса в CMS. Пока null: цена берётся из data/course.json и в браузере не перерисовывается.
// Слаг rodbt-lvl1 сейчас отдаёт поток с датами живого курса, поэтому привязка выключена.
const CMS_SLUG = null;
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
const SKIP_KEYS = new Set(['id', 'src', 'url', 'href', 'asset', 'alt', 'datetime', 'gridSource', 'errorIcon', 'successIcon', 'agreementUrl', 'privacyUrl', 'nativeMarker', 'action', 'value', 'listLabel', 'icon', 'expertIcon', 'variant', 'composition', 'position', 'heading_id', 'label', 'tabsLabel', 'destination', 'initials', 'datetime']);
function typeset(node, key) {
  if (typeof node === 'string') return SKIP_KEYS.has(key) ? node : typography(node);
  if (Array.isArray(node)) return node.map(item => typeset(item, key));
  if (node && typeof node === 'object') return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, typeset(v, k)]));
  return node;
}
// Подписи шагов и кнопок видны на странице, а aria-подписи (listLabel, metadata.label, benefits.label) нет.
const typesetVisibleLabels = data => ({...data, steps: data.steps?.map(step => ({...step, label: typography(step.label)})), action: data.action && {...data.action, label: typography(data.action.label)}});

const image = (media, className, {lazy = true, decorative = false} = {}) => {
  if (!/^(https:\/\/|assets\/)/.test(media.src) || ![media.width, media.height].every(n => Number.isInteger(n) && n > 0)) throw new Error(`Изображение без CDN-ссылки (или файла в assets/) или без размеров: ${media.src}`);
  if (!decorative && typeof media.alt !== 'string') throw new Error(`Нужен alt: ${media.src}`);
  return `<img class="${className}" src="${escapeHtml(media.src)}" width="${media.width}" height="${media.height}" alt="${decorative ? '' : escapeHtml(media.alt)}"${decorative ? ' aria-hidden="true"' : ''} draggable="false"${lazy ? ' loading="lazy" decoding="async"' : ''}>`;
};
const checkItem = (text, copy = '') => `<li class="feature-list_item"><img class="feature-list_icon" src="${CHECK_ICON}" width="24" height="24" alt="" draggable="false" loading="lazy">${copy || `<span class="body-text_component feature-list_text">${renderText(text)}</span>`}</li>`;
const header = (id, heading, {align = 'center', subtitle = '', note = ''} = {}) => `<div class="section-header_component is-${align} is-responsive">${note ? variantNote(note) : ''}<h2 class="section-title_component is-${align} is-responsive" id="${id}-heading">${renderText(heading)}</h2>${subtitle ? `<p class="section-subtitle_component">${renderText(subtitle)}</p>` : ''}</div>`;
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

/* Фото человека или заглушка с инициалами, пока фото нет (photo.src: null). */
const portrait = (photo, className) => photo.src
  ? image(photo, `${className} portrait_image`)
  : `<div class="${className} portrait_placeholder" role="img" aria-label="${escapeHtml(photo.alt)}. Фото появится позже"><span class="portrait_initials" aria-hidden="true">${escapeHtml(photo.initials)}</span></div>`;

/* Проектный блок feature-split: копия с группами списков и фото; секция «уровень». */
function renderFeatureSplit(name, data, id) {
  const groups = data.groups.map((group, index) => `<div class="feature-split_group"><h3 class="content-heading_component is-card" id="${id}-group-${index + 1}">${renderText(group.heading)}</h3>${group.intro ? `<p class="body-text_component">${renderText(group.intro)}</p>` : ''}<ul class="feature-list_component" aria-labelledby="${id}-group-${index + 1}">${group.items.map(item => checkItem(item)).join('')}</ul></div>`).join('\n');
  const copy = `<div class="feature-split_copy"><div class="feature-split_intro">${header(id, data.heading, {align: 'left', subtitle: data.subtitle, note: data.variantLabels?.[0]})}<p class="body-text_component is-summary is-emphasis feature-split_lead">${renderText(data.lead)}</p>${data.paragraphs.map(text => `<p class="body-text_component is-summary is-regular">${renderText(text)}</p>`).join('')}</div><div class="feature-split_groups">${groups}</div>${data.note ? `<p class="body-text_component is-fine-print feature-split_note">${renderText(data.note)}</p>` : ''}</div>`;
  const media = `<div class="feature-split_media"${data.image.position ? ` style="--feature-split-image-position: ${escapeHtml(data.image.position)}"` : ''}>${image(data.image, 'feature-split_image')}</div>`;
  return section(name, id, `<div class="feature-split_component">${copy}${media}</div>`);
}

/* «Первый уровень», вариант 2 (level-path): без фото. Слева тёмная карточка: шкала из трёх уровней
   (первый выделен, цифры декоративные), главная мысль и вводные абзацы. Справа две белые карточки
   со списками: что будет на уровне и что дальше. Сноска под блоком. Тексты те же, что в варианте 1. */
function renderLevelPath(data, id) {
  const groups = data.groups.map((group, index) => `<div class="card_component level-path_card"><h3 class="content-heading_component is-card" id="${id}-group-${index + 1}">${renderText(group.heading)}</h3>${group.intro ? `<p class="body-text_component">${renderText(group.intro)}</p>` : ''}<ul class="feature-list_component" aria-labelledby="${id}-group-${index + 1}">${group.items.map(item => checkItem(item)).join('')}</ul></div>`).join('\n');
  const scale = `<div class="level-path_scale" aria-hidden="true">${[1, 2, 3].map(n => `<span class="level-path_step${n === 1 ? ' is-current' : ''}">${n}</span>`).join('<span class="level-path_line"></span>')}</div>`;
  const intro = `<div class="level-path_intro">${scale}<div class="level-path_copy"><p class="level-path_lead">${renderText(data.lead)}</p>${data.paragraphs.map(text => `<p class="body-text_component is-summary is-regular">${renderText(text)}</p>`).join('')}</div></div>`;
  return section('level-path', id, `<div class="section-layout_component is-responsive">${header(id, data.heading, {subtitle: data.subtitle, note: data.variantLabels[1]})}<div class="level-path_body"><div class="level-path_layout">${intro}${groups}</div>${data.note ? `<p class="body-text_component is-fine-print level-path_note">${renderText(data.note)}</p>` : ''}</div></div>`);
}

/* Проектный блок instructor: фото (или заглушка) и вводная, ниже разделы биографии аккордеоном Академии.
   Первый раздел открыт, остальные раскрываются по нажатию: длинная биография не растягивает мобильный экран. */
function renderInstructor(data, id) {
  const groups = data.groups.map(group => `<details class="instructor_item accordion_item" data-accordion-item${group.open ? ' open' : ''}>
          <summary class="instructor_summary accordion_summary" data-accordion-trigger><h3 class="content-heading_component is-card">${renderText(group.heading)}</h3>${renderToggleIcon({className: 'accordion_icon'})}</summary>
          <div class="accordion_panel" data-accordion-panel><div class="instructor_panel accordion_panel-inner">${(group.paragraphs || []).map(text => `<p class="body-text_component is-detailed">${renderText(text)}</p>`).join('')}${group.items ? `<ul class="feature-list_component">${group.items.map(item => checkItem(item)).join('')}</ul>` : ''}</div></div>
        </details>`).join('\n');
  const intro = `<div class="instructor_intro">${header(id, data.heading, {align: 'left'})}<p class="body-text_component is-summary is-emphasis feature-split_lead">${renderText(data.lead)}</p>${data.paragraphs.map(text => `<p class="body-text_component is-summary is-regular">${renderText(text)}</p>`).join('')}</div>`;
  const copy = `<div class="instructor_copy">${intro}<div class="instructor_list accordion_component" data-accordion aria-label="${escapeHtml(data.groupsLabel)}">${groups}</div><p class="body-text_component is-summary is-regular instructor_closing">${renderText(data.closing)}</p></div>`;
  return section('instructor', id, `<div class="instructor_component"><div class="instructor_media">${portrait(data.photo, 'instructor_photo')}</div>${copy}</div>`);
}

/* «Кому подходит» (audience-bento, выбран пользователем 02.10.2026 вместо общего course-audience):
   у каждой карточки отдельный заголовок и отдельный абзац, без нумерации.
   На desktop фото стоит в центре на высоту двух рядов, карточки по две слева и справа; на планшете
   карточки 2×2 и фото под ними; на телефоне всё в одну колонку. */
function renderAudienceBento(data, id) {
  const media = data.image ?? courseAudienceImage;
  const cards = data.cards.map(card => `<li class="card_component audience-bento_card"><div class="content-header_component"><h3 class="content-heading_component is-card">${renderText(card.lead.replace(/\.$/, ''))}</h3><p class="body-text_component">${renderText(card.text)}</p></div></li>`).join('\n');
  return section('audience-bento', id, `<div class="section-layout_component is-responsive"><div class="section-header_component is-center is-responsive"><h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(data.heading)}</h2></div><ul class="audience-bento_list" aria-label="${escapeHtml(data.listLabel)}">${cards}<li class="audience-bento_media" aria-hidden="true">${image(media, 'audience-bento_image', {decorative: true})}</li></ul></div>`);
}

/* Проектный блок highlights: особенности курса слева, тёмная карточка практики со списком справа. */
function renderHighlights(data, id) {
  const cards = data.cards.map(card => `<li class="card_component highlights_card"><div class="content-header_component"><h3 class="content-heading_component is-card">${renderText(card.heading)}</h3><p class="body-text_component">${renderText(card.text)}</p></div></li>`).join('\n');
  const items = data.practice.items.map(item => checkItem(null, `<div class="feature-list_copy"><h4 class="body-text_component is-emphasis feature-list_text">${renderText(item.heading)}</h4><p class="body-text_component">${renderText(item.text)}</p></div>`)).join('');
  const practice = `<div class="card_component highlights_practice"><h3 class="content-heading_component is-card" id="${id}-practice">${renderText(data.practice.heading)}</h3><ul class="feature-list_component" aria-labelledby="${id}-practice">${items}</ul></div>`;
  return section('highlights', id, `<div class="section-layout_component is-responsive">${header(id, data.heading)}<div class="highlights_layout"><ul class="highlights_list" aria-label="${escapeHtml(data.listLabel)}">${cards}</ul>${practice}</div></div>`);
}

/* Проектный блок topic-tabs. Одна разметка на все ширины: кнопка раздела и сразу за ней его панель.
   До 1025px это аккордеон (панель раскрывается под кнопкой), от 1025px кнопки стоят колонкой слева,
   а открытая панель справа. Открыт всегда один раздел; без скрипта видны все панели.
   Используется дважды: навыки (тёмный контейнер) и второй вариант программы (светлый, is-light). */
function renderTopicTabs(name, id, {heading, variantLabel, after = '', below = '', light = false, groups}) {
  const items = groups.map((group, i) => `<h3 class="topic-tabs_heading" style="--topic-index: ${i + 1}"><button class="topic-tabs_tab" type="button" id="${id}-tab-${i + 1}" aria-controls="${id}-panel-${i + 1}" aria-expanded="${i === 0}" data-topic-tab><span class="topic-tabs_tab-label" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span class="topic-tabs_tab-title">${renderText(group.heading)}</span></button></h3>
<div class="topic-tabs_panel" role="region" id="${id}-panel-${i + 1}" aria-labelledby="${id}-tab-${i + 1}" data-topic-panel>${group.body}</div>`).join('\n');
  return section(name, id, `<div class="topic-tabs_component${light ? ' is-light' : ''}"><div class="section-header_component is-center is-responsive">${variantLabel ? variantNote(variantLabel) : ''}<h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(heading)}</h2>${after}</div><div class="topic-tabs_layout" style="--topic-count: ${groups.length}" data-topic-tabs>${items}</div>${below}</div>`);
}
const renderSkills = (data, id) => renderTopicTabs('skills', id, {heading: data.heading, groups: data.groups.map(group => ({heading: group.heading, body: `<ul class="feature-list_component">${group.items.map(item => checkItem(item)).join('')}</ul>`}))});

/* Временная подпись варианта программы: на странице три варианта одного блока, остаться должен один. */
const variantNote = text => `<p class="variant-note_component">${renderText(text)}</p>`;
const moduleLead = module => module.lead.map(text => `<p class="body-text_component is-detailed program-module_lead">${renderText(text)}</p>`).join('');
const scheduleNote = schedule => `<p class="program-topics_schedule"><span>${renderText(schedule.label)}</span><span class="program-topics_time">${renderText(schedule.detail)}</span></p>`;
const moduleDuration = module => `<p class="program-module_label">${renderText(module.duration)}</p>`;
/* Рекомендуемая литература и переводчики материалов: карточка под программой, повторяется в каждом варианте. */
const literature = (data, id) => `<div class="card_component program-literature_component"><h3 class="content-heading_component is-card" id="${id}-literature">${renderText(data.literature.heading)}</h3><ul class="program-module_points" aria-labelledby="${id}-literature">${data.literature.items.map(text => `<li class="body-text_component is-detailed program-module_point">${renderText(text)}</li>`).join('')}</ul><p class="body-text_component program-literature_note">${renderText(data.literature.note)}</p></div>`;

/* Программа, вариант 1: плашка формата и нумерованные карточки модулей с длительностью. */
function renderProgram(data, id) {
  const topics = data.modules.map((module, i) => `<li class="card_component program-topics_card"><span class="program-topics_number" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><h3 class="content-heading_component is-card">${renderText(module.heading)}</h3><p class="body-text_component program-topics_duration">${renderText(module.duration)}</p></li>`).join('\n');
  return section('program', id, `<div class="section-layout_component is-responsive"><div class="section-header_component is-center is-responsive">${variantNote(data.variantLabels[0])}<h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(data.heading)}</h2>${scheduleNote(data.schedule)}</div><ol class="card-grid_component is-triple program-topics_list" aria-label="${escapeHtml(data.listLabel)}">${topics}</ol>${literature(data, id)}</div>`);
}

/* Программа, вариант 2: те же разделы, что в навыках, но в светлом виде и с описанием каждой темы. */
const renderProgramTabs = (data, id) => renderTopicTabs('program-tabs', id, {heading: data.heading, variantLabel: data.variantLabels[1], after: scheduleNote(data.schedule), light: true, below: literature(data, id), groups: data.modules.map(module => ({heading: module.heading, body: `<div class="program-module_copy">${moduleDuration(module)}${moduleLead(module)}</div><div class="program-module_copy"><p class="program-module_label">${renderText(data.topicsLabel)}</p><ul class="program-module_points">${module.points.map(text => `<li class="body-text_component is-detailed program-module_point">${renderText(text)}</li>`).join('')}</ul></div>`}))});

/* Схемы третьего варианта программы. Рисуются в единицах viewBox 520×340 из короткого описания в
   data/program.json (scene). Три раскладки: flow (слева → центр → справа), radial (центр и окружение),
   chain (ступени). Каждый элемент получает «слот» sk-in-N / sk-draw-N: по нему CSS показывает элементы
   по очереди и зацикливает сцену (приём лендинга «Психосоматика»). */
const SCENE = {width: 520, height: 340};
const sceneCardHeight = item => (item.chip ? 30 : 14) + item.title.length * 14 + 10;
function sceneCard(item, {x, y, w, slot, accent = false, right = false, pop = false, pulse = false}) {
  const h = sceneCardHeight(item);
  const lines = item.title.map((line, i) => i ? `<tspan x="12" dy="14">${escapeHtml(line)}</tspan>` : escapeHtml(line)).join('');
  const chip = item.chip ? `<rect class="scene_chip" x="12" y="9" width="${Math.round(item.chip.length * 5.4 + 16)}" height="16" rx="8"/><text class="scene_chip-text" x="20" y="20.5">${escapeHtml(item.chip)}</text>` : '';
  const dot = pulse ? `<g class="sk-pulse"><circle class="scene_dot is-light" cx="${w - 16}" cy="${h / 2}" r="5"/></g>` : '';
  return `<g transform="translate(${x} ${y})"><g class="sk-in-${slot}${right ? ' is-from-right' : ''}${pop ? ' is-pop' : ''}"><rect class="scene_card${accent ? ' is-accent' : ''}" width="${w}" height="${h}" rx="8"/>${chip}<text class="scene_title${accent ? ' is-on-accent' : ''}" x="12" y="${item.chip ? 42 : 26}">${lines}</text>${dot}</g></g>`;
}
const sceneLine = (d, slot, extra = '') => `<path class="scene_line${extra} sk-draw-${slot}" pathLength="1" d="${d}"/>`;
const column = (items, gap) => {
  const heights = items.map(sceneCardHeight);
  let y = (SCENE.height - heights.reduce((a, b) => a + b, 0) - gap * (items.length - 1)) / 2;
  return items.map((item, i) => { const top = y; y += heights[i] + gap; return {item, y: Math.round(top), h: heights[i]}; });
};
const SCENE_LAYOUTS = {
  flow(scene) {
    const side = 150, hubW = 120, left = column(scene.left, 18), right = column(scene.right, 14);
    const hub = {title: scene.hub}, hubH = sceneCardHeight(hub), hubX = (SCENE.width - hubW) / 2, hubY = (SCENE.height - hubH) / 2, mid = SCENE.height / 2;
    const n = left.length, rightX = SCENE.width - 20 - side;
    return [
      ...left.map(({y, h}) => sceneLine(`M${20 + side} ${y + h / 2} C ${hubX - 14} ${y + h / 2}, ${20 + side + 14} ${mid}, ${hubX} ${mid}`, n + 1)),
      ...right.map(({y, h}) => sceneLine(`M${hubX + hubW} ${mid} C ${rightX - 14} ${mid}, ${hubX + hubW + 14} ${y + h / 2}, ${rightX} ${y + h / 2}`, n + 3)),
      ...left.map(({item, y}, i) => sceneCard(item, {x: 20, y, w: side, slot: i + 1})),
      sceneCard(hub, {x: hubX, y: hubY, w: hubW, slot: n + 2, accent: true, pop: true, pulse: true}),
      ...right.map(({item, y}, i) => sceneCard(item, {x: rightX, y, w: side, slot: n + 4 + i, right: true})),
    ];
  },
  radial(scene) {
    const w = 156, centerW = 150, center = {title: scene.center}, ch = sceneCardHeight(center), cx = SCENE.width / 2, cy = SCENE.height / 2, n = scene.around.length;
    const spots = n === 3 ? [[24, 36], [SCENE.width - 24 - w, 36], [(SCENE.width - w) / 2, SCENE.height - 36]] : [[24, 36], [SCENE.width - 24 - w, 36], [24, SCENE.height - 36], [SCENE.width - 24 - w, SCENE.height - 36]];
    const placed = scene.around.map((item, i) => { const h = sceneCardHeight(item), [x, y] = spots[i]; return {item, x, y: y > cy ? y - h : y, h}; });
    return [
      ...placed.map(({x, y, h}) => sceneLine(`M${x + w / 2} ${y + h / 2} L ${cx} ${cy}`, n + 1, ' is-dashed')),
      ...placed.map(({item, x, y}, i) => sceneCard(item, {x, y, w, slot: i + 1, right: x > cx - w / 2 && x + w / 2 > cx, pop: x + w / 2 === cx})),
      sceneCard(center, {x: cx - centerW / 2, y: cy - ch / 2, w: centerW, slot: n + 2, accent: true, pop: true, pulse: true}),
    ];
  },
  chain(scene) {
    const n = scene.steps.length, w = n > 3 ? 168 : 190, heights = scene.steps.map(sceneCardHeight);
    const dx = (SCENE.width - 48 - w) / (n - 1), dy = (SCENE.height - 56 - heights[n - 1]) / (n - 1);
    const placed = scene.steps.map((item, i) => ({item, x: Math.round(24 + dx * i), y: Math.round(28 + dy * i), h: heights[i]}));
    return [
      ...placed.slice(0, -1).map(({x, y, h}, i) => { const next = placed[i + 1]; return sceneLine(`M${x + 28} ${y + h} Q ${x + 28} ${next.y + next.h / 2}, ${next.x} ${next.y + next.h / 2}`, 2 * i + 2); }),
      ...placed.map(({item, x, y}, i) => sceneCard(item, {x, y, w, slot: 2 * i + 1, accent: i === n - 1, pulse: i === n - 1})),
    ];
  },
};
const renderScene = scene => `<svg class="scene" viewBox="0 0 ${SCENE.width} ${SCENE.height}" aria-hidden="true" focusable="false">${SCENE_LAYOUTS[scene.layout](scene).join('')}</svg>`;

/* Программа, вариант 3: слева вкладки тем и короткое описание, справа тёмная сцена с анимированной схемой
   темы (лейаут «Карты компетенций» лендинга «Психосоматика»). На телефоне вкладки идут лентой с
   горизонтальной прокруткой, схема встаёт под текстом. Схемы декоративные, смысл передаёт текст. */
function renderProgramScenes(data, scenes, id) {
  const tabs = data.modules.map((module, i) => `<button class="program-scenes_tab" type="button" role="tab" id="${id}-tab-${i + 1}" aria-selected="${i === 0}" aria-controls="${id}-text-${i + 1}" tabindex="${i === 0 ? 0 : -1}" data-scene-tab>${renderText(module.tab)}</button>`).join('');
  const texts = data.modules.map((module, i) => `<div class="program-scenes_text" role="tabpanel" id="${id}-text-${i + 1}" aria-labelledby="${id}-tab-${i + 1}" data-scene-text${i ? ' hidden' : ''}><h3 class="content-heading_component is-profile">${renderText(module.heading)}</h3>${moduleDuration(module)}${moduleLead(module)}</div>`).join('');
  const panels = scenes.map((scene, i) => `<div class="scene_panel" data-scene-panel${i ? ' hidden' : ''}>${renderScene(scene)}</div>`).join('');
  return section('program-scenes', id, `<div class="section-layout_component is-responsive"><div class="section-header_component is-center is-responsive">${variantNote(data.variantLabels[2])}<h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(data.heading)}</h2>${scheduleNote(data.schedule)}</div><div class="program-scenes_layout" data-scene-tabs><div class="program-scenes_panel"><div class="program-scenes_tabs" role="tablist" aria-label="${escapeHtml(data.tabsLabel)}">${tabs}</div><div class="program-scenes_copy">${texts}</div></div><div class="program-scenes_stage">${panels}</div></div>${literature(data, id)}</div>`);
}

/* Документы: общий блок «Диплом» Академии (текст, условия, заметка, лицензия, одно изображение),
   как на курсах с удостоверением. На изображении оба документа курса: удостоверение и сертификат. */
const renderDocuments = (data, id) => renderDiploma(data, {id}).replace('class="section_diploma ', 'class="section_documents section_diploma ');

/* Промо-блок цены. Запаска строится при сборке из data/course.json. Если задан CMS_SLUG, сборка сначала
   спрашивает курс у Public API, а в браузере блок перерисовывает pricing-promo.js. */
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
  const heroMarkup = renderHeroSection(JSON.parse(JSON.stringify(hero).replaceAll(NBSP, '&nbsp;')), context);

  const learningData = typesetVisibleLabels(typeset(await json('learning')));
  // Заголовки с акцентом одной строкой (решение пользователя 17.09.2026): убираем принудительный <br> перед акцентом.
  let learning = renderLearningTimeline(learningData, {id: `${SLUG}-learning`}).replace('<br><span class="section-title_accent">', ' <span class="section-title_accent">');
  // Заметка про учебники под шагами (как в rodbt/): вставляется перед закрытием компонента.
  const note = `<div class="learning-note_component" role="note"><span class="learning-note_icon" aria-hidden="true">⚠️</span><p class="body-text_component is-callout learning-note_text">${renderText(learningData.note)}</p></div>`;
  const learningTail = '\n    </div>\n  </div></div></div></div>\n</section>';
  if (learning.split(learningTail).length !== 2) throw new Error('Learning: не найден хвост компонента для заметки');
  learning = learning.replace(learningTail, `\n      ${note}${learningTail}`);


  const leadForm = typeset(await json('lead-form'));
  leadForm.errorIcon = await dataUrl(consultant, 'assets/icons/form-error.svg');
  leadForm.successIcon = await dataUrl(consultant, 'assets/icons/form-success.svg');
  const form = renderLeadFormSection(leadForm, {id: `${SLUG}-application`, formId: `${SLUG}-form`});

  // Блок об Академии: тексты и фото общие для лендингов Академии, свечения из assets эталона как data URL.
  const academy = typeset(await json('academy'));
  for (const card of [academy.community, academy.graduates]) for (const key of ['glow', 'compactGlow']) card[key].src = await dataUrl(consultant, card[key].src);

  const program = typeset(await json('program'));
  const audience = typeset(await json('audience'));
  const level = typeset(await json('level'));
  const pricing = await renderPricing(`${SLUG}-pricing`);
  const sections = [
    heroMarkup,
    renderStrategy(typeset(await json('strategy')), `${SLUG}-strategy`),
    renderAudienceBento(audience, `${SLUG}-audience`),
    renderFeatureSplit('level', level, `${SLUG}-level`),
    renderLevelPath(level, `${SLUG}-level-path`),
    renderHighlights(typeset(await json('highlights')), `${SLUG}-highlights`),
    renderSkills(typeset(await json('skills')), `${SLUG}-skills`),
    renderInstructor(typeset(await json('instructor')), `${SLUG}-instructor`),
    learning,
    renderProgram(program, `${SLUG}-program`),
    renderProgramTabs(program, `${SLUG}-program-tabs`),
    renderProgramScenes(program, (await json('program')).modules.map(module => module.scene), `${SLUG}-program-scenes`),
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
    <!-- Сгенерировано: node rodbt-record/build.mjs. Тексты в data/*.json, тема и проектные блоки в page.css. Руками не править. -->
    <main class="main-wrapper academy-page rodbt-record-page" id="main-content" tabindex="-1" data-academy-anchor-scroll>
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
  const order = ['components.css', 'card-spacing.css', 'hero.css', 'benefits.css', 'section-spacing.css', 'body-text.css', 'button.css', 'learning-timeline.css', 'academy-showcase-responsive.css', 'toggle-icon.css', 'faq-responsive.css', 'lead-form.css', 'lead-form-responsive.css', 'pricing-promo.css', 'diploma.css', 'section-heading.css', 'anchor-scroll.css'];
  const parts = [];
  for (const name of order) {
    let css = await read(shared, name);
    if (name === 'toggle-icon.css') css = css.replaceAll("url('./assets/disclosure-cross.svg')", `url("${await dataUrl(shared, 'assets/disclosure-cross.svg')}")`);
    assertResponsiveContract(css, name);
    parts.push(`/* === web-academy/shared/academy/${name} === */\n${css.trim()}`);
  }
  const page = await read(root, 'page.css');
  assertResponsiveContract(page, 'page.css');
  const css = `/* Сгенерировано: node rodbt-record/build.mjs. Общие компоненты Академии, затем тема и проектные блоки из page.css. Руками не править. */\n\n${parts.join('\n\n')}\n\n/* === rodbt-record/page.css === */\n${page.trim()}\n`;
  assertMotionContract(css, 'style.css');
  if (/url\((['"]?)(\.\/|\.\.\/|assets\/)/.test(css)) throw new Error('В style.css остались локальные url()');
  return css;
}

async function buildJs() {
  // Скрипты цены нужны только при живой привязке к CMS: без неё блок цены статичен.
  const order = ['components.js', 'anchor-scroll.js', ...(CMS_SLUG ? ['pricing.js', 'pricing-promo-render.js', 'pricing-promo.js'] : []), 'lead-form.js', 'learning-timeline.js'];
  const parts = [];
  for (const name of order) parts.push(`/* === web-academy/shared/academy/${name} === */\n${(await read(shared, name)).trim()}`);
  parts.push(`/* === rodbt-record/page.js === */\n${(await read(root, 'page.js')).trim()}`);
  const js = `/* Сгенерировано: node rodbt-record/build.mjs. Общие скрипты Академии в порядке зависимостей. Руками не править. */\n\n${parts.join('\n\n')}\n`;
  assertResponsiveContract(js, 'script.js');
  return js;
}

const {html, mode} = await buildHtml();
await fs.writeFile(new URL('index.html', root), html);
await fs.writeFile(new URL('style.css', root), await buildCss());
await fs.writeFile(new URL('script.js', root), await buildJs());
console.log(`rodbt-record: index.html ${html.length} символов, блок цены в режиме ${mode}`);
