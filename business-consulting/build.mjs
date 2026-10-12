// Сборка лендинга «Корпоративное консультирование для психологов» (адрес и префикс business-consulting)
// на компонентах Академии. Перевёрстка живой modern-psy.ru/business-consulting с правками Дарьи от 12.10.2026:
// новое название и подводка, блок «Несколько компаний — стабильный доход» со схемой работы, таблица
// «Обычный и корпоративный психолог», «Как вы будете учиться» перед программой, результат у каждого модуля.
// Запуск из apps/preview: node business-consulting/build.mjs  (флаг --refresh заново берёт снимок цены из API)
// Вход: data/*.json (тексты), page.css (тема и проектные блоки), page.js (цена из CMS),
// общие компоненты web-academy/shared/academy (только при сборке).
// Выход: index.html, style.css, script.js — самодостаточные, без runtime-ссылок на web-academy.
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {renderAcademyShowcase} from '../web-academy/shared/academy/academy-showcase-render.mjs';
import {renderLeadFormSection} from '../web-academy/shared/academy/lead-form-render.mjs';
import {renderFaq} from '../web-academy/shared/academy/faq-render.mjs';
import {renderBenefits} from '../web-academy/shared/academy/hero-render.mjs';
import {escapeHtml, renderText, sectionId} from '../web-academy/shared/academy/html-render.mjs';
import {assertMotionContract} from '../web-academy/shared/academy/motion-contract.mjs';
import {assertResponsiveContract} from '../web-academy/shared/academy/responsive.mjs';
import {LEARNING_SCENES} from './scenes.mjs';

const root = new URL('./', import.meta.url);
const shared = new URL('../web-academy/shared/academy/', import.meta.url);
const consultant = new URL('../web-academy/projects/psychologist-consultant/', import.meta.url);
const read = (base, name) => fs.readFile(new URL(name, base), 'utf8');
const json = async name => JSON.parse(await read(root, `data/${name}.json`));
const dataUrl = async (base, name) => `data:image/svg+xml;base64,${Buffer.from(await read(base, name), 'utf8').toString('base64')}`;

const SLUG = 'business-consulting';
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
    .replace(/№ /g, `№${NBSP}`)
    // Диапазон чисел («30–60», «18:00–21:00») не разрывается на тире.
    .replace(/(\d)–(?=\d)/g, '$1\u2060–\u2060');
}
// Пробелы связываются только в текстовых узлах: URL, атрибуты, идентификаторы и alt не трогаем.
const SKIP_KEYS = new Set(['id', 'src', 'url', 'href', 'asset', 'alt', 'gridSource', 'errorIcon', 'successIcon', 'agreementUrl', 'privacyUrl', 'nativeMarker', 'action', 'value', 'listLabel', 'icon', 'variant', 'heading_id', 'label', 'tagsLabel', 'platformsLabel', 'api', 'slug', 'cms', 'source']);
function typeset(node, key) {
  if (typeof node === 'string') return SKIP_KEYS.has(key) ? node : typography(node);
  if (Array.isArray(node)) return node.map(item => typeset(item, key));
  if (node && typeof node === 'object') return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, typeset(v, k)]));
  return node;
}
const data = async name => typeset(await json(name));

// Точная замена фрагмента общей разметки: если общий блок изменится и фрагмент не найдётся, сборка остановится.
function patch(markup, from, to, what) {
  if (markup.split(from).length !== 2) throw new Error(`${what}: не найден фрагмент общей разметки`);
  return markup.replace(from, () => to);
}

const image = (media, className, {lazy = true} = {}) => {
  // Локальные картинки допустимы только из папки assets лендинга; для Тильды каждой нужна ссылка на CDN (S3).
  if (!/^(https:\/\/|assets\/)/.test(media.src) || ![media.width, media.height].every(n => Number.isInteger(n) && n > 0)) throw new Error(`Изображение без CDN-ссылки (или файла в assets/) или без размеров: ${media.src}`);
  if (typeof media.alt !== 'string') throw new Error(`Нужен alt: ${media.src}`);
  return `<img class="${className}" src="${escapeHtml(media.src)}" width="${media.width}" height="${media.height}" alt="${escapeHtml(media.alt)}" draggable="false"${lazy ? ' loading="lazy" decoding="async"' : ''}>`;
};

/* Иконки Lucide: 20 px, линия 2 из 24, цвет как у текста рядом. */
const ICONS = {
  building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  clipboard: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  presentation: '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
};
const icon = (name, cls = 'hero-icon') => {
  if (!ICONS[name]) throw new Error(`Нет иконки ${name}`);
  return `<svg class="${cls}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
};

const section = (name, id, inner) => `<section class="section_${name} section-spacing_component" id="${sectionId(id)}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge">
    ${inner}
  </div></div>
</section>`;
const header = (id, heading, lead, {align = 'center'} = {}) => `<div class="section-header_component is-${align} is-responsive"><h2 class="section-title_component is-${align} is-responsive" id="${id}-heading">${renderText(heading)}</h2>${lead ? `<p class="section-subtitle_component">${renderText(lead)}</p>` : ''}</div>`;

/* Первый экран «Описание в плашке» — эталон В3/К4 (как на /treningi-dlya-detey): поле #2B2334, справа фото
   в рамке, слева заголовок, в светлой плашке подводка и три строки «чему научитесь» с иконками в кружках,
   плитка старта, одна кнопка и под ней тихая строка «Обучение онлайн» (дни и время занятий здесь сняты
   по просьбе Дарьи 12.10.2026 — они в программе). На планшете и телефоне плитка и кнопка лежат на фото, низ фото
   растворяется в поле. Дата старта обновляется из CMS (data-cms-start). Часы, формат и удостоверение —
   «кубиками» отдельным блоком сразу под первым экраном (renderFacts). */
function renderHeroPanel(hero, stream) {
  const {panel} = hero;
  const cmsTile = tile => tile.cms === 'start' ? ` data-cms-start="Старт {date}"` : tile.cms === 'days-time' ? ' data-cms-schedule-short' : '';
  const tileText = tile => tile.cms === 'start' && stream.start ? `Старт ${stream.start}` : tile.cms === 'days-time' && stream.schedule ? stream.schedule.short : tile.text;
  const rows = panel.rows.map(row => `<li class="hero-panel_row"><span class="hero-panel_row-icon">${icon(row.icon)}</span><span>${renderText(row.text)}</span></li>`).join('');
  const tiles = panel.tiles.map(tile => `<li class="hero-panel_tile">${icon(tile.icon)}<span${cmsTile(tile)}>${renderText(tileText(tile))}</span></li>`).join('');
  const main = hero.actions[0];
  return `<section class="section_hero" aria-labelledby="${sectionId(hero.heading_id)}">
  <div class="padding-global"><div class="container-xlarge">
    <div class="hero-panel_component">
      <div class="hero-panel_text">
        <h1 class="hero-panel_heading" id="${hero.heading_id}">${renderText(hero.heading)}</h1>
        <div class="hero-panel_panel">
          <p class="hero-panel_lead">${renderText(hero.lead)}</p>
          <ul class="hero-panel_rows" aria-label="${escapeHtml(panel.rowsLabel)}">${rows}</ul>
        </div>
        <div class="hero-panel_cta">
          <ul class="hero-panel_tiles" aria-label="Старт и расписание">${tiles}</ul>
          <div class="hero-panel_actions">
            <a class="button_component hero-panel_button is-light" href="${escapeHtml(main.href)}">${renderText(main.label)}</a>
            ${panel.note ? `<p class="hero-panel_note">${renderText(panel.note)}</p>` : ''}
          </div>
        </div>
      </div>
      <img class="hero-panel_photo" src="${escapeHtml(panel.photo.src)}" width="${panel.photo.width}" height="${panel.photo.height}" alt="" draggable="false" fetchpriority="high">
    </div>
  </div></div>
</section>`;
}

/* «Кубики» под первым экраном — три плитки со старой страницы (возвращены 12.10.2026 по просьбе Дарьи):
   часы, форматы обучения, удостоверение. Общий компонент Академии benefits (тот же, что под Hero
   «Психолога-консультанта»), отдельной секцией, чтобы в Тильде это был свой T123. */
function renderFacts(facts) {
  return `<section class="section_facts" aria-label="${escapeHtml(facts.label)}">
  <div class="padding-global"><div class="container-xlarge">
    ${renderBenefits(facts, {}, 2)}
  </div></div>
</section>`;
}

/* «Несколько компаний в практике — стабильный доход» (правка 3 от 12.10.2026, вместо трёх карточек
   «Корпоративный клиент — отдельная компетенция»). Сверху мысль блока, ниже схема работы корпоративного психолога:
   пять этапов на одной серой линии и шестой — тёмная плашка «стабильный доход». В плашке пример: три компании
   идут параллельно, каждая на своём этапе. Телефон и планшет — линия вертикальная, от 1025px — горизонтальная. */
function renderCompanies(c, id) {
  const steps = c.steps.map((step, i) => `<li class="companies_step"><span class="companies_node" aria-hidden="true">${i + 1}</span><div class="companies_copy"><h4 class="companies_step-title">${renderText(step.title)}</h4><p class="companies_step-text">${renderText(step.text)}</p></div></li>`).join('');
  const total = c.steps.length;
  const tracks = c.final.companies.map(company => {
    if (!(company.step >= 1 && company.step <= total)) throw new Error(`Компании: этап ${company.step} вне схемы`);
    const dots = c.steps.map((_, i) => `<span class="companies_dot${i + 1 < company.step ? ' is-done' : i + 1 === company.step ? ' is-current' : ''}"></span>`).join('');
    const stage = c.steps[company.step - 1].short;
    return `<li class="companies_track"><span class="companies_track-name">${renderText(company.name)}</span><span class="companies_track-dots" aria-hidden="true">${dots}</span><span class="companies_track-stage">${renderText(stage)}</span></li>`;
  }).join('');
  const final = `<li class="companies_final"><div class="companies_final-copy"><span class="companies_node is-final" aria-hidden="true">${total + 1}</span><div class="companies_copy"><h4 class="companies_final-title">${renderText(c.final.title)}</h4><p class="companies_final-text">${renderText(c.final.text)}</p></div></div><div class="companies_example"><p class="companies_example-label">${renderText(c.final.companiesLabel)}</p><ul class="companies_tracks">${tracks}</ul></div></li>`;
  return section('companies', id, `<div class="section-layout_component is-responsive">${header(id, c.heading, c.lead)}<div class="companies_component"><h3 class="companies_scheme-title">${renderText(c.schemeHeading)}</h3><ol class="companies_steps" aria-label="${escapeHtml(c.listLabel)}">${steps}${final}</ol></div></div>`);
}

/* «Для кого этот курс» — тексты без изменений (правка 4). Три белые карточки: роль и для чего ей курс. */
function renderAudience(a, id) {
  const cards = a.roles.map(role => `<li class="audience-roles_card"><h3 class="audience-roles_title">${renderText(role.title)}</h3><p class="audience-roles_text">${renderText(role.text)}</p></li>`).join('');
  return section('audience', id, `<div class="section-layout_component is-responsive">${header(id, a.heading)}<ul class="audience-roles_list" aria-label="${escapeHtml(a.listLabel)}">${cards}</ul></div>`);
}

/* «Чем работа корпоративного психолога отличается от частной практики» (правка 5, тексты из файла Дарьи,
   12.10.2026 сокращены и выровнены попарно). Один заголовок, без подзаголовков в ячейках. Настоящая таблица:
   строка — что сравниваем, колонки — психолог в частной практике и корпоративный психолог (тёмная полоса #2B2334).
   До 768px строка — пара «светлая и тёмная половина» под маленькой серой подписью темы; в каждой половине
   короткая плашка, чей это вариант (из data-label). Роли таблицы прописаны явно: на телефоне ячейки становятся
   блоками, и без role скринридер перестаёт читать это как таблицу. */
function renderCompare(c, id) {
  const {columns: col} = c;
  const head = `<thead class="compare_head" role="rowgroup"><tr role="row"><th class="compare_th is-topic" scope="col" role="columnheader">${renderText(col.topic)}</th><th class="compare_th is-regular" scope="col" role="columnheader">${renderText(col.regular)}</th><th class="compare_th is-corporate" scope="col" role="columnheader">${renderText(col.corporate)}</th></tr></thead>`;
  const label = text => escapeHtml(text.replaceAll(NBSP, ' '));
  const rows = c.rows.map(row => `<tr class="compare_row" role="row"><th class="compare_topic" scope="row" role="rowheader">${renderText(row.topic)}</th><td class="compare_cell is-regular" role="cell" data-label="${label(col.regular)}">${renderText(row.regular)}</td><td class="compare_cell is-corporate" role="cell" data-label="${label(col.corporate)}">${renderText(row.corporate)}</td></tr>`).join('');
  return section('compare', id, `<div class="section-layout_component is-responsive">${header(id, c.heading)}<div class="compare_component"><table class="compare_table" role="table">${head}<tbody role="rowgroup">${rows}</tbody></table></div></div>`);
}

/* «Как вы будете учиться» (правка 6: был «Много практики», теперь перед программой). 12.10.2026 по просьбе Дарьи —
   вкладки и анимированные SVG-схемы, как «Когда нужна другая стратегия» на /rodbt-record. Белая панель:
   слева три вкладки-шага столбиком (плашка «когда» и название), текст выбранного шага внизу карточки; справа светлая
   сцена со схемой этого шага (scenes.mjs). На телефоне и планшете вкладки тоже столбиком, ниже схема, текст последним.
   Переключение и клавиатура — page.js; без скрипта видны все тексты и все схемы. */
function renderLearning(l, id) {
  if (l.steps.length !== LEARNING_SCENES.length) throw new Error('Как вы будете учиться: число шагов не совпадает с числом схем');
  const tabs = l.steps.map((step, i) => `<button class="learning-tabs_tab" type="button" role="tab" id="${id}-tab-${i + 1}" aria-selected="${i === 0}" aria-controls="${id}-panel-${i + 1}" tabindex="${i ? -1 : 0}" data-learning-tab><span class="learning-tabs_when">${renderText(step.when)}</span><span class="learning-tabs_title">${renderText(step.title)}</span></button>`).join('');
  const texts = l.steps.map((step, i) => `<div class="learning-tabs_text" role="tabpanel" id="${id}-panel-${i + 1}" aria-labelledby="${id}-tab-${i + 1}" data-learning-panel><p>${renderText(step.text)}</p></div>`).join('');
  const scenes = LEARNING_SCENES.map((scene, i) => `<div class="learning-tabs_scene" data-learning-scene="${i + 1}">${scene}</div>`).join('');
  return section('learning', id, `<div class="section-layout_component is-responsive">${header(id, l.heading, l.lead)}<div class="learning-tabs_layout" data-learning-tabs><div class="learning-tabs_panel"><div class="learning-tabs_list" role="tablist" aria-label="${escapeHtml(l.listLabel)}" aria-orientation="vertical">${tabs}</div><div class="learning-tabs_copy">${texts}</div></div><div class="learning-tabs_stage">${scenes}</div></div></div>`);
}

/* Программа (правка 7): у каждого модуля рядом общий результат. 12.10.2026 по просьбе Дарьи — целиком на тёмном
   поле #2B2334, чтобы светлые и тёмные блоки страницы чередовались. Над модулями плашки «старт», «дни и время»,
   «онлайн»: дата и расписание приходят из CMS (снимок со сборки, в браузере — свежие из API, page.js).
   Карточка модуля чуть светлее поля: слева номер, название и темы через тонкие линии, справа белая плашка
   «Результат модуля» с иконкой мишени. До 1025px плашка встаёт под темы. */
function renderProgram(p, id, stream) {
  const item = row => {
    if (row.cms === 'start') return `<li class="program-schedule_item"><span>${renderText(row.label)}</span><span class="program-schedule_time" data-cms-start="{date}">${renderText(stream.start || row.detail)}</span></li>`;
    if (row.cms === 'schedule') return `<li class="program-schedule_item"><span data-cms-schedule-days>${renderText(stream.schedule?.days || row.label)}</span><span class="program-schedule_time" data-cms-schedule-time>${renderText(stream.schedule?.time || row.detail)}</span></li>`;
    return `<li class="program-schedule_item"><span>${renderText(row.label)}</span><span class="program-schedule_time">${renderText(row.detail)}</span></li>`;
  };
  const schedule = `<ul class="program-schedule_component" aria-label="Старт и расписание занятий">${p.schedule.map(item).join('')}</ul>`;
  const result = m => `<div class="program-results_result"><span class="program-results_result-icon">${icon('target')}</span><p class="program-results_result-label">${renderText(p.resultLabel)}</p><p class="program-results_result-text">${renderText(m.result)}</p></div>`;
  const modules = p.modules.map(m => `<li class="program-results_card"><div class="program-results_main"><span class="program-results_badge">${renderText(m.badge)}</span><h3 class="program-results_heading">${renderText(m.heading)}</h3>${m.topics.length ? `<ul class="program-results_topics">${m.topics.map(t => `<li class="program-results_topic">${renderText(t)}</li>`).join('')}</ul>` : ''}</div>${result(m)}</li>`).join('');
  return section('program', id, `<div class="program-results_component"><div class="section-layout_component is-responsive"><div class="section-header_component is-center is-responsive"><h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(p.heading)}</h2>${schedule}</div><ol class="program-results_list" aria-label="${escapeHtml(p.listLabel)}">${modules}</ol><a class="button_component button is-light program-results_action" href="${escapeHtml(p.action.href)}">${renderText(p.action.label)}</a></div></div>`);
}

/* Преподаватель: широкая карточка из /narrative-therapy (она же из /rft). Фото на светло-серой подложке,
   имя, роль, методы серыми плашками, факты с тёмной галочкой через тонкие линии. Телефон: фото сверху. */
function renderInstructor(t, id) {
  const tags = t.tags.length ? `<ul class="teacher_tags" aria-label="Методы">${t.tags.map(tag => `<li class="teacher_tag">${renderText(tag)}</li>`).join('')}</ul>` : '';
  const facts = `<ul class="teacher_facts">${t.facts.map(fact => `<li class="teacher_fact">${icon('check', 'teacher_check')}<span>${renderText(fact)}</span></li>`).join('')}</ul>`;
  return section('instructor', id, `<div class="section-layout_component is-responsive">${header(id, t.heading)}<article class="teacher_card"><div class="teacher_portrait">${image(t.photo, 'teacher_photo')}</div><div class="teacher_body"><div class="teacher_intro"><h3 class="teacher_name">${renderText(t.name)}</h3><p class="teacher_role">${renderText(t.role)}</p>${tags}</div>${facts}</div></article></div>`);
}

/* Удостоверение: вариант «Документ с фото человека» из библиотеки блоков (/narrative-therapy, он же /rft, /ifs,
   /psihosomatika) вместо старого общего diploma — 12.10.2026 по просьбе Дарьи. Белая карточка: слева заголовок
   с акцентом, условия получения с тёмной галочкой и лицензия, справа удостоверение в абстрактной 3D-сцене
   (12.10.2026 вместо фото выпускницы: та обрезалась на средних ширинах; Generations/44-udost-a5/3d, вариант 1).
   Телефон: фото квадратом под текстом; от 768px две колонки, фото по высоте текста. */
function renderDocuments(d, id) {
  const terms = d.terms.map(term => `<li class="document_term">${icon('check', 'document_check')}<span>${renderText(term)}</span></li>`).join('');
  return section('documents', id, `<div class="document_component"><div class="document_copy"><h2 class="section-title_component is-left is-responsive document_heading" id="${id}-heading">${renderText(d.heading)} <span class="section-title_accent">${renderText(d.headingAccent)}</span></h2><p class="body-text_component is-summary is-regular">${renderText(d.description)}</p><ul class="document_terms">${terms}</ul><p class="body-text_component is-fine-print document_license">${d.license.map(renderText).join('<br>')}</p></div><div class="document_media">${image(d.image, 'document_image')}</div></div>`);
}

/* «Стоимость обучения» — «Одна цифра» из /pricing-scenarios. Карточку рисует page.js (BusinessConsultingPrice):
   здесь из снимка API на момент сборки, в браузере — заново из API. Кнопок в блоке нет: запись в форме ниже. */
function renderPrice(p, model, priceApi, id) {
  if (!model) throw new Error('Цена: в снимке API нет открытого потока без тарифов');
  const text = {chip: p.chip, title: p.title, sideTitle: p.sideTitle, includes: p.includes};
  return section('price', id, `<div class="price-block_component" data-price-block data-course="${escapeHtml(p.slug)}" data-api="${escapeHtml(p.api)}" data-price-text="${escapeHtml(JSON.stringify(text))}"><div class="price-block_head">${header(id, p.heading)}</div>${priceApi.render(model, text)}</div>`);
}

/* «Гибкие условия оплаты»: утверждённый универсальный блок из /pricing-scenarios (12.10.2026). */
function renderPayment(payment, id) {
  const row = (title, body) => `<div class="price-terms_row"><dt class="price-terms_title">${renderText(title)}</dt><dd class="price-terms_body">${body}</dd></div>`;
  const discounts = `<ul class="price-discounts" role="list">${payment.discounts.items.map(d => `<li class="price-discounts_item"><p class="price-discounts_value">${d.prefix ? `<span class="price-discounts_prefix">${renderText(d.prefix)}</span>` : ''}<span class="price-discounts_number">${renderText(d.value)}&nbsp;%</span></p><p class="price-discounts_label">${renderText(d.text)}</p></li>`).join('')}</ul>`;
  return section('payment-terms', id, `<div class="section-layout_component is-responsive price-terms_component">${header(id, payment.heading)}<dl class="price-terms_list">${row(payment.installment.title, `<p class="price-terms_text">${renderText(payment.installment.text)}</p>`)}${row(payment.discounts.title, discounts)}${row(payment.tax.title, `<p class="price-terms_text">${renderText(payment.tax.text)}</p>`)}</dl></div>`);
}

/* SEO по docs/seo.md: canonical, Open Graph и JSON-LD из тех же данных, что и страница.
   Цена в разметке курса — та же, что на странице (снимок API); page.js обновляет её вместе с карточкой. */
function renderSeoHead(seo) {
  return [
    `<link rel="canonical" href="${escapeHtml(seo.canonical)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${escapeHtml(seo.siteName)}">`,
    `<meta property="og:locale" content="ru_RU">`,
    `<meta property="og:title" content="${escapeHtml(seo.ogTitle)}">`,
    `<meta property="og:description" content="${escapeHtml(seo.ogDescription)}">`,
    `<meta property="og:url" content="${escapeHtml(seo.canonical)}">`,
    ...(seo.ogImage ? [`<meta property="og:image" content="${escapeHtml(seo.ogImage.src)}">`, `<meta name="twitter:card" content="summary_large_image">`] : []),
  ].map(tag => `    ${tag}`).join('\n');
}
const ldScript = (value, attrs = '') => `<script type="application/ld+json"${attrs}>\n${JSON.stringify(value, null, 2).replace(/</g, '\\u003c')}\n</script>`;
function renderJsonLd(seo, teacher, model, course) {
  const org = seo.organization;
  const orgId = `${org.url}/#organization`;
  const organization = {'@context': 'https://schema.org', '@type': 'EducationalOrganization', '@id': orgId, name: org.name, url: org.url, logo: org.logo, telephone: org.telephone, email: org.email,
    address: {'@type': 'PostalAddress', addressCountry: 'RU', ...org.address}};
  const offers = {'@type': 'Offer', price: String(model.sale), priceCurrency: 'RUB', availability: 'https://schema.org/InStock', url: seo.canonical};
  if (model.promo && course.promo?.until) offers.priceValidUntil = course.promo.until;
  const courseLd = {'@context': 'https://schema.org', '@type': 'Course', '@id': `${seo.canonical}#course`, name: seo.course.name, description: seo.course.description, url: seo.canonical, inLanguage: 'ru',
    provider: {'@id': orgId}, educationalCredentialAwarded: seo.course.credential, offers,
    hasCourseInstance: {'@type': 'CourseInstance', courseMode: 'online', startDate: model.startDate, instructor: [{'@type': 'Person', name: teacher.name, jobTitle: teacher.role}]}};
  return [ldScript(organization), ldScript(courseLd, ' data-course-ld')].join('\n');
}

/* Скрипт формы Академии рассчитан на обязательную почту. Поля почты на лендингах курсов больше нет
   (как в rodbt-live, narrative-therapy и treningi-dlya-detey), поэтому три места скрипта делаются терпимыми к его отсутствию. */
function withoutEmail(source) {
  const patches = [
    ['      !(emailInput instanceof HTMLInputElement) ||\n', ''],
    ['    setNativeInputValue(emailInput, formData.email);', '    if (emailInput instanceof HTMLInputElement) setNativeInputValue(emailInput, formData.email);'],
    ['        email: form.elements.email.value.trim(),', '        email: form.elements.email?.value.trim() || "",'],
  ];
  for (const [from, to] of patches) {
    if (!source.includes(from)) throw new Error(`lead-form.js: не найден фрагмент для формы без почты: ${from.trim()}`);
    source = source.replace(from, to);
  }
  return source;
}

// Снимок цены: data/api-course.json. С флагом --refresh берётся заново из Public API.
async function courseSnapshot(pricing) {
  const file = new URL('data/api-course.json', root);
  if (process.argv.includes('--refresh')) {
    const response = await fetch(`${pricing.api}/api/public/course/${pricing.slug}`, {headers: {Accept: 'application/json'}});
    if (!response.ok) throw new Error(`API ответил ${response.status}`);
    await fs.writeFile(file, `${JSON.stringify(await response.json(), null, 4)}\n`);
    console.log('Снимок цены обновлён из API');
  }
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function buildHtml() {
  const seo = await json('seo');
  const pricing = await data('pricing');
  const course = await courseSnapshot(pricing);
  const sandbox = {};
  vm.runInNewContext(await read(root, 'page.js'), sandbox);
  const priceApi = sandbox.BusinessConsultingPrice;
  const model = priceApi.fromApi(course);

  // Блок об Академии: тексты и фото общие для лендингов, свечения из assets эталона как data URL.
  // Заголовок — «Почему выбирают нас» без акцентной второй строки, как на /treningi-dlya-detey.
  const academy = await data('academy');
  for (const card of [academy.community, academy.graduates]) for (const key of ['glow', 'compactGlow']) card[key].src = await dataUrl(consultant, card[key].src);
  const showcase = patch(renderAcademyShowcase(academy, {id: `${SLUG}-academy`}), '<br class="academy-showcase_heading-break"><span class="section-title_accent"> </span>', '', 'Почему выбирают нас: заголовок');

  const leadForm = await data('lead-form');
  leadForm.errorIcon = await dataUrl(consultant, 'assets/icons/form-error.svg');
  leadForm.successIcon = await dataUrl(consultant, 'assets/icons/form-success.svg');
  const emailField = /<div class="lead-form_field" data-lead-field data-state="idle"><div class="lead-form_control"><input class="lead-form_input" type="email"[\s\S]*?data-lead-error><\/p><\/div>/;
  const fullForm = renderLeadFormSection({...leadForm, emailLabel: 'Почта'}, {id: `${SLUG}-application`, formId: `${SLUG}-form`});
  if (!emailField.test(fullForm)) throw new Error('Lead form: не найдено поле email в разметке формы');
  // Заголовок формы «Занятия начнутся 18 ноября» обновляется вместе с ценой из CMS.
  const formHeading = `id="${SLUG}-form-heading">`;
  const form = patch(fullForm.replace(emailField, ''), formHeading, `id="${SLUG}-form-heading" data-cms-start="Занятия начнутся {date}">`, 'Форма: заголовок');

  const teacher = await data('teacher');
  // Порядок секций по правкам Дарьи от 12.10.2026.
  const sections = [
    renderHeroPanel(await data('hero'), model),
    renderFacts(await data('facts')),
    renderCompanies(await data('companies'), `${SLUG}-companies`),
    renderAudience(await data('audience'), `${SLUG}-audience`),
    renderCompare(await data('compare'), `${SLUG}-compare`),
    renderLearning(await data('learning'), `${SLUG}-learning`),
    renderProgram(await data('program'), `${SLUG}-program`, model),
    renderInstructor(teacher, `${SLUG}-teacher`),
    renderDocuments(await data('documents'), `${SLUG}-documents`),
    showcase,
    renderPrice(pricing, model, priceApi, `${SLUG}-price`),
    form,
    // «Гибкие условия оплаты» — под формой заявки (просьба Дарьи 12.10.2026).
    renderPayment(await data('payment'), `${SLUG}-payment`),
    renderFaq(await data('faq'), {id: `${SLUG}-faq`}),
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
    <link rel="preconnect" href="https://optim.tildacdn.com" crossorigin>
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Wix+Madefor+Text:wght@400;444;500;600&amp;display=swap">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/css/intlTelInput.css">
    <link rel="stylesheet" href="./style.css">
    <script src="https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/js/intlTelInput.min.js" defer></script>
    <script src="./script.js" defer></script>
  </head>
  <body>
    <!-- Сгенерировано: node business-consulting/build.mjs. Тексты в data/*.json, тема и проектные блоки в page.css, цена — page.js. Руками не править. -->
    <main class="main-wrapper academy-page ${SLUG}-page" id="main-content" tabindex="-1" data-academy-anchor-scroll>
${body}
    </main>
${renderJsonLd(seo, teacher, model, course)}
  </body>
</html>
`;
  const ids = [...html.matchAll(/(?<![\w-])id="([^"]+)"/g)].map(m => m[1]);
  const duplicates = ids.filter((value, i) => ids.indexOf(value) !== i);
  if (duplicates.length) throw new Error(`Повторяющиеся id: ${duplicates.join(', ')}`);
  for (const link of html.matchAll(/href="#([a-z][a-z0-9-]*)"/g)) if (!ids.includes(link[1])) throw new Error(`Якорь без цели: #${link[1]}`);
  if (/\.\.\/web-academy|localhost|127\.0\.0\.1/.test(html)) throw new Error('В index.html остались локальные ссылки');
  for (const [, file] of html.matchAll(/src="(assets\/[^"]+)"/g)) {
    await fs.access(new URL(file, root)).catch(() => { throw new Error(`Нет локального файла ${file}`); });
    console.warn(`⚠️  Локальная картинка ${file}: для Тильды нужна ссылка на S3`);
  }
  if ((html.match(/<h1\b/g) || []).length !== 1) throw new Error('На странице должен быть ровно один h1');
  return html;
}

async function buildCss() {
  const order = ['components.css', 'card-spacing.css', 'section-spacing.css', 'body-text.css', 'button.css', 'benefits.css', 'academy-showcase-responsive.css', 'faq-responsive.css', 'lead-form.css', 'lead-form-responsive.css', 'section-heading.css', 'anchor-scroll.css'];
  const parts = [];
  for (const name of order) {
    const css = await read(shared, name);
    assertResponsiveContract(css, name);
    parts.push(`/* === web-academy/shared/academy/${name} === */\n${css.trim()}`);
  }
  const page = await read(root, 'page.css');
  assertResponsiveContract(page, 'page.css');
  const css = `/* Сгенерировано: node business-consulting/build.mjs. Общие компоненты Академии, затем тема и проектные блоки из page.css. Руками не править. */\n\n${parts.join('\n\n')}\n\n/* === business-consulting/page.css === */\n${page.trim()}\n`;
  assertMotionContract(css, 'style.css');
  if (/url\((['"]?)(\.\/|\.\.\/|assets\/)/.test(css)) throw new Error('В style.css остались локальные url()');
  return css;
}

async function buildJs() {
  const order = ['components.js', 'anchor-scroll.js', 'lead-form.js'];
  const parts = [];
  for (const name of order) {
    let source = (await read(shared, name)).trim();
    if (name === 'lead-form.js') source = withoutEmail(source);
    parts.push(`/* === web-academy/shared/academy/${name} === */\n${source}`);
  }
  parts.push(`/* === business-consulting/page.js === */\n${(await read(root, 'page.js')).trim()}`);
  const js = `/* Сгенерировано: node business-consulting/build.mjs. Общие скрипты Академии в порядке зависимостей, затем цена из CMS. Руками не править. */\n\n${parts.join('\n\n')}\n`;
  assertResponsiveContract(js, 'script.js');
  return js;
}

const html = await buildHtml();
await fs.writeFile(new URL('index.html', root), html);
await fs.writeFile(new URL('style.css', root), await buildCss());
await fs.writeFile(new URL('script.js', root), await buildJs());
console.log(`${SLUG}: index.html ${html.length} символов`);
