// Сборка лендинга «Практика создания и проведения тренингов для детей и подростков» (префикс treningi-dlya-detey)
// из общих блоков Академии. Цель первой версии — проверить общие блоки на новом лендинге (ТЗ от 12.10.2026, Figma нет).
// Запуск из apps/preview: node treningi-dlya-detey/build.mjs
// Вход: data/*.json (тексты), page.css (тема и проектные блоки), общие компоненты web-academy/shared/academy (только при сборке).
// Выход: index.html, style.css, script.js — самодостаточные, без runtime-ссылок на web-academy.
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {renderAcademyShowcase} from '../web-academy/shared/academy/academy-showcase-render.mjs';
import {renderRatings} from '../web-academy/shared/academy/ratings-render.mjs';
import {renderLeadFormSection} from '../web-academy/shared/academy/lead-form-render.mjs';
import {renderFaq} from '../web-academy/shared/academy/faq-render.mjs';
import {escapeHtml, renderText, sectionId} from '../web-academy/shared/academy/html-render.mjs';
import {assertMotionContract} from '../web-academy/shared/academy/motion-contract.mjs';
import {assertResponsiveContract} from '../web-academy/shared/academy/responsive.mjs';

const root = new URL('./', import.meta.url);
const shared = new URL('../web-academy/shared/academy/', import.meta.url);
const consultant = new URL('../web-academy/projects/psychologist-consultant/', import.meta.url);
const read = (base, name) => fs.readFile(new URL(name, base), 'utf8');
const json = async name => JSON.parse(await read(root, `data/${name}.json`));
const dataUrl = async (base, name) => `data:image/svg+xml;base64,${Buffer.from(await read(base, name), 'utf8').toString('base64')}`;

const SLUG = 'treningi-dlya-detey';
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
const SKIP_KEYS = new Set(['id', 'src', 'url', 'href', 'asset', 'alt', 'gridSource', 'errorIcon', 'successIcon', 'agreementUrl', 'privacyUrl', 'nativeMarker', 'action', 'value', 'listLabel', 'icon', 'variant', 'composition', 'heading_id', 'destination', 'label', 'tagsLabel', 'platformsLabel']);
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

/* Данные курса из CMS: название, старт, часы и цена (cms.js, атрибуты data-cms-*). При сборке в страницу
   вшивается снимок: значения из data/pricing.json, поверх — data/api-course.json и data/api-catalog-entry.json,
   если курс уже есть в CMS (node treningi-dlya-detey/build.mjs --refresh). В браузере cms.js обновляет их из API. */
let CMS = null;
const cmsStart = template => `<span data-cms-start="${escapeHtml(template)}">${renderText(template.replace('{date}', CMS.start))}</span>`;
const cmsHours = template => `<span data-cms-hours="${escapeHtml(template)}">${renderText(template.replace('{hours}', CMS.hoursText))}</span>`;

/* Иконки Lucide: 20 px, линия 2 из 24, цвет как у текста рядом. */
const ICONS = {
  'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  presentation: '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'graduation-cap': '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  // users — та же иконка, что в строке «Работа в мини-группах» первого экрана

};
const icon = name => {
  if (!ICONS[name]) throw new Error(`Нет иконки ${name}`);
  return `<svg class="hero-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
};

/* Первый экран «Описание в плашке» — стиль эталонов В3 и К4 (выбран Дарьей 12.10.2026 из трёх вариантов): поле #2B2334, справа фото
   в рамке, слева заголовок, чем полезен курс — в чуть более светлой плашке со строками и иконками в кружках,
   старт и время плитками, одна кнопка и тихая подпись. На планшете и телефоне фото уходит вниз, а плитки, кнопка
   и подпись лежат прямо на нём (низ фото растворяется в поле). */
function renderHeroPanel(hero, {headingLevel = 1, headingId = hero.heading_id} = {}) {
  const {panel} = hero;
  const rows = panel.rows.map(row => `<li class="hero-panel_row"><span class="hero-panel_row-icon">${icon(row.icon)}</span><span>${renderText(row.text)}</span></li>`).join('');
  const tiles = panel.tiles.map(tile => `<li class="hero-panel_tile">${icon(tile.icon)}${tile.template ? cmsStart(tile.template) : renderText(tile.text)}</li>`).join('');
  const main = hero.actions[0];
  return `<section class="section_hero" aria-labelledby="${sectionId(headingId)}">
  <div class="padding-global"><div class="container-xlarge">
    <div class="hero-panel_component">
      <div class="hero-panel_text">
        <h${headingLevel} class="hero-panel_heading" id="${headingId}" data-cms-title>${renderText(CMS.title)}</h${headingLevel}>
        <div class="hero-panel_panel">
          <p class="hero-panel_lead">${renderText(hero.lead)}</p>
          <ul class="hero-panel_rows" aria-label="${escapeHtml(panel.rowsLabel)}">${rows}</ul>
        </div>
        <div class="hero-panel_cta">
          <ul class="hero-panel_tiles" aria-label="Старт">${tiles}</ul>
          <div class="hero-panel_actions">
            <a class="button_component hero-panel_button is-light" href="${escapeHtml(main.href)}">${renderText(main.label)}</a>
          </div>
        </div>
      </div>
      <img class="hero-panel_photo" src="${escapeHtml(panel.photo.src)}" width="${panel.photo.width}" height="${panel.photo.height}" alt="" draggable="false" fetchpriority="high">
    </div>
    <ul class="hero-facts_list" aria-label="${escapeHtml(hero.facts.label)}">${hero.facts.items.map(item => `<li class="hero-facts_item"><span class="hero-facts_icon">${icon(item.icon)}</span>${item.template ? cmsHours(item.template) : `<span>${renderText(item.text)}</span>`}</li>`).join('')}</ul>
  </div></div>
</section>`;
}

// Слова через дефис («педагог-психолог») не разрываются переносом строки.
const keepHyphenated = text => renderText(text).replace(/[\p{L}]+(?:-[\p{L}]+)+/gu, word => `<span class="audience-nowrap">${word}</span>`);

/* «Кому подойдёт курс» — «Две двери», вся карточка на фото (выбран Дарьей 12.10.2026 из макетов
   .impeccable/mocks/treningi-audience/comp-e-full-photo.png). Две группы по точке старта: «Уже работаете с детьми»
   (четыре роли) и «Приходите к детям из другой области» (две роли). Каждая карточка — фото во всю площадь, внизу светлая
   матовая плашка с названием группы и ролями тёмным текстом; во второй — плашка «Опыт ведения групп не нужен».
   Заголовок на фото не кладём. Тексты сокращены в инфостиле: data/audience.json, полные из ТЗ там же в tz.
   Фото временные, сгенерированные (assets/audience-*.webp), ждут замену и ссылки на S3. */
function renderAudienceDoors(a, id) {
  const byId = Object.fromEntries(a.roles.map(r => [r.id, r]));
  const role = rid => {
    if (!byId[rid]) throw new Error(`Кому подойдёт: нет роли ${rid}`);
    return `<li class="audience-doors_item"><p class="audience-doors_role">${keepHyphenated(byId[rid].role)}</p><p class="audience-doors_benefit">${renderText(byId[rid].benefit)}</p></li>`;
  };
  const door = (g, extra = '') => `<div class="audience-doors_door"><img class="audience-doors_image" src="${escapeHtml(g.image.src)}" width="${g.image.width}" height="${g.image.height}" alt="" draggable="false" loading="lazy" decoding="async"><div class="audience-doors_panel"><h3 class="audience-doors_title">${renderText(g.title)}</h3><ul class="audience-doors_list">${g.roles.map(role).join('')}</ul>${extra}</div></div>`;
  const note = `<p class="audience-doors_note">${renderText(a.note.title)}</p>`;
  const [first, second] = a.groups;
  return `<section class="section_audience-doors section-spacing_component" id="${sectionId(id)}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge">
    <div class="section-layout_component is-responsive">
      <div class="section-header_component is-center is-responsive"><h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(a.heading)}</h2></div>
      <div class="audience-doors_component">${door(first)}${door(second, note)}</div>
    </div>
  </div></div>
</section>`;
}

/* «Когда упражнения есть, а тренинга не получается» — макет В «Пачка сообщений и один ответ» (выбран Дарьей 12.10.2026
   из трёх макетов-картинок, .impeccable/mocks/treningi-pains/comp-c-answer.png). Слева на белой панели шесть ситуаций из ТЗ —
   серые сообщения лесенкой, как в мессенджере. Справа один тёмный ответ Академии: итоговая фраза из ТЗ, три модуля программы
   плашками и кнопка «Посмотреть программу». На телефоне ответ под сообщениями. Появление по очереди — page.js. */
function renderPainsReply(p, id) {
  const quotes = p.quotes.map(quote => `<li class="pains-reply_message"><p class="pains-reply_bubble">${renderText(quote)}</p></li>`).join('');
  const modules = p.reply.modules.map(m => `<li class="pains-reply_module">${renderText(m)}</li>`).join('');
  return `<section class="section_pains-reply section-spacing_component" id="${sectionId(id)}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge">
    <div class="section-layout_component is-responsive">
      <div class="section-header_component is-left is-responsive"><h2 class="section-title_component is-left is-responsive pains-reply_heading" id="${id}-heading">${renderText(p.heading)}</h2></div>
      <div class="pains-reply_component" data-js="pains-reply">
        <div class="pains-reply_chat"><ul class="pains-reply_list" aria-label="${escapeHtml(p.listLabel)}">${quotes}</ul></div>
        <div class="pains-reply_answer">
          <p class="pains-reply_author">${renderText(p.reply.author)}</p>
          <p class="pains-reply_text">${renderText(p.reply.text)}</p>
          <ul class="pains-reply_modules" aria-label="${escapeHtml(p.reply.modulesLabel)}">${modules}</ul>
          <a class="button_component is-light pains-reply_button" href="${escapeHtml(p.button.href)}">${renderText(p.button.label)}</a>
        </div>
      </div>
    </div>
  </div></div>
</section>`;
}

const wrap = (name, id, inner, {width = 'wide'} = {}) => `<section class="section_${name} section-spacing_component" id="${sectionId(id)}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge"><div class="column-grid_component"><div class="column-grid_content is-content-${width}">
    ${inner}
  </div></div></div></div>
</section>`;
const header = (id, heading, description) => `<div class="section-header_component is-center is-responsive"><h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(heading)}</h2>${description ? `<p class="section-subtitle_component">${renderText(description)}</p>` : ''}</div>`;

/* «Тренинг о тренинге» — макет Г «Фото на фоне, путь стеклянными карточками» (выбран Дарьей 12.10.2026, основа —
   библиотечный блок «Фото-фон со стеклянными карточками»). Фото на всю карточку приглушено затемнением в тон поля #2B2334,
   слева и снизу плотнее — там текст. Сверху заголовок и подводка, внизу путь: три шага стеклянными карточками и белая
   карточка финала «В финале — ваш тренинг». На телефоне фото сверху, текст и шаги под ним на сплошном тёмном поле. */
function renderFormatPath(f, id) {
  const steps = f.steps.map(step => `<li class="format-path_step${step.final ? ' is-final' : ''}"><p class="format-path_title">${renderText(step.title)}</p><p class="format-path_text">${renderText(step.text)}</p></li>`).join('');
  return `<section class="section_format-path section-spacing_component" id="${sectionId(id)}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge">
    <div class="format-path_component">
      <div class="format-path_media"><img class="format-path_image" src="${escapeHtml(f.image.src)}" width="${f.image.width}" height="${f.image.height}" alt="${escapeHtml(f.image.alt)}" draggable="false" loading="lazy" decoding="async"></div>
      <div class="format-path_content">
        <div class="format-path_header"><h2 class="section-title_component is-left is-responsive format-path_heading" id="${id}-heading">${renderText(f.heading)}</h2><p class="format-path_lead">${renderText(f.description)}</p></div>
        <ol class="format-path_steps" aria-label="${escapeHtml(f.listLabel)}">${steps}</ol>
      </div>
    </div>
  </div></div>
</section>`;
}

/* «После курса вы сможете» — макет В «Ваш готовый тренинг» (выбран Дарьей 12.10.2026, .impeccable/mocks/treningi-outcomes/
   comp-c-document.png, доработан). В центре — лист «Мой тренинг» (рисуется HTML и CSS, декоративный, скрыт от скринридера),
   по три навыка слева и справа: глагол крупно, расшифровка из ТЗ серым. Под листом — тёмная плашка с итоговой фразой из ТЗ.
   На планшете лист сверху и навыки в две колонки, на телефоне всё столбиком. */
function renderOutcomesDoc(o, id) {
  const skill = s => `<li class="outcomes-doc_skill"><p class="outcomes-doc_skill-title">${renderText(s.title)}</p><p class="outcomes-doc_skill-text">${renderText(s.text)}</p></li>`;
  const left = o.skills.slice(0, 3).map(skill).join('');
  const right = o.skills.slice(3).map(skill).join('');
  const plan = '<li><span class="outcomes-doc_dot"></span><span class="outcomes-doc_bar"></span></li>'.repeat(6);
  // Печать «готов к работе»: кольцо, надпись по кругу дважды, в центре залитый круг с белой галочкой. Цвет берётся из CSS (currentColor).
  // Размер надписи (font-size="10.5") — в единицах рисунка 120×120, печать масштабируется целиком.
  // textLength растягивает надпись ровно на окружность радиуса 43, поэтому её можно менять в data/outcomes.json без пересчёта.
  const ring = `${renderText(o.document.stamp)} · ${renderText(o.document.stamp)} · `;
  const stamp = `<svg class="outcomes-doc_stamp" viewBox="0 0 120 120" focusable="false">
              <defs><path id="${id}-stamp-ring" d="M17 60a43 43 0 1 1 86 0a43 43 0 1 1 -86 0"/></defs>
              <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" stroke-width="3"/>
              <circle cx="60" cy="60" r="31" fill="currentColor"/>
              <text class="outcomes-doc_stamp-text" font-size="11.5" fill="currentColor"><textPath href="#${id}-stamp-ring" textLength="264" lengthAdjust="spacing">${ring}</textPath></text>
              <path d="M46.5 61l9 9L74 51.5" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
  return `<section class="section_outcomes-doc section-spacing_component" id="${sectionId(id)}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge">
    <div class="section-layout_component is-responsive">
      <div class="section-header_component is-center is-responsive"><h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(o.heading)}</h2></div>
      <div class="outcomes-doc_component">
        <ul class="outcomes-doc_list is-left" aria-label="${escapeHtml(o.listLabel)}">${left}</ul>
        <div class="outcomes-doc_visual" aria-hidden="true">
          <div class="outcomes-doc_sheet is-back"></div>
          <div class="outcomes-doc_sheet">
            <p class="outcomes-doc_title">${renderText(o.document.title)}</p>
            <span class="outcomes-doc_line is-long"></span><span class="outcomes-doc_line"></span>
            <ul class="outcomes-doc_plan">${plan}</ul>
            ${stamp}
          </div>
        </div>
        <ul class="outcomes-doc_list is-right" aria-label="${escapeHtml(o.listLabel)}, продолжение">${right}</ul>
      </div>
      <p class="outcomes-doc_closing">${renderText(o.closing)}</p>
    </div>
  </div></div>
</section>`;
}

const programHeading = p => `${p.heading.accentStart} ${p.heading.text}`.trim();
// Две кнопки из ТЗ. Файла программы пока нет: «Скачать» в состоянии превью (aria-disabled), пока не появится download.href.
const programButtons = p => {
  const main = `<a class="button_component button is-accent program-tabs_button" href="${escapeHtml(p.action.href)}">${renderText(p.action.label)}</a>`;
  const second = p.download.href
    ? `<a class="button_component button is-light program-tabs_button" href="${escapeHtml(p.download.href)}" download>${renderText(p.download.label)}</a>`
    : `<button class="button_component button is-light program-tabs_button" type="button" aria-disabled="true" data-action="download-program">${renderText(p.download.label)}</button>`;
  return `<div class="program-tabs_actions">${main}${second}</div>`;
};
const programSection = (id, inner) => `<section class="section_program-tabs section-spacing_component" id="${sectionId(id)}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge">
    ${inner}
  </div></div>
</section>`;
/* Программа курса — «Табы модулей на тёмной плашке» (выбран Дарьей 13.10.2026 из трёх готовых блоков библиотеки;
   тот же блок на «Психосоматике», IFS, RFT и /rodbt, разметка и скрипт перенесены оттуда). Тёмное поле #2B2334,
   слева модули-кнопки, справа белая панель выбранного модуля: темы из ТЗ и сиреневая плашка «Результат».
   Под табами две кнопки из ТЗ. Без скрипта все модули видны друг под другом, кнопки-табы скрыты. */
function renderProgramTabs(p, id) {
  const tabs = p.stages.map((s, i) => `<button class="program-tabs_tab" type="button" role="tab" id="${id}-tab-${i + 1}" aria-controls="${id}-panel-${i + 1}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-program-tab><span class="program-tabs_tab-label">${renderText(s.badge)}</span><span class="program-tabs_tab-title">${renderText(s.heading)}</span></button>`).join('\n');
  const panels = p.stages.map((s, i) => `<div class="program-tabs_panel" role="tabpanel" id="${id}-panel-${i + 1}" aria-labelledby="${id}-tab-${i + 1}" data-program-panel${i === 0 ? '' : ' hidden'}>
      <h3 class="program-tabs_title">${renderText(s.heading)}</h3>
      <div class="program-tabs_panel-copy"><p class="program-tabs_list-title">${renderText(p.topicsLabel)}</p><ul class="program-tabs_topics">${s.topics.map(t => `<li class="program-tabs_topic">${renderText(t)}</li>`).join('')}</ul></div>
      <div class="program-tabs_result"><p class="program-tabs_result-label">${renderText(p.resultLabel)}</p><p class="program-tabs_result-text">${renderText(s.result)}</p></div>
    </div>`).join('\n');
  return programSection(id, `<div class="program-tabs_component">
      <div class="section-header_component is-center is-responsive"><h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(programHeading(p))}</h2><p class="section-subtitle_component">${renderText(p.subtitles[0])}</p></div>
      <div class="program-tabs_layout" data-program-tabs><div class="program-tabs_nav" role="tablist" aria-label="${escapeHtml(p.listLabel)}" aria-orientation="vertical">${tabs}</div><div class="program-tabs_panels">${panels}</div></div>
      ${programButtons(p)}
    </div>`);
}

/* Преподаватели — «Карточка преподавателя» (выбран Дарьей 13.10.2026, основа — широкая карточка с «Нарративной практики»,
   RFT и IFS, но внутри вертикальная): сверху фото, под ним имя, роль, сиреневые плашки регалий и факты
   с галочками через тонкие линии. Две карточки рядом с 768px, на телефоне друг под другом.
   Фото пока нет: на его месте инициалы на сиреневой подложке того же размера. Данные — data/teachers.json. */
// Место под фото: пока фото нет, инициалы; появится photo.src (с width и height) — встанет картинка того же размера.
const teacherPortrait = (t, className) => t.photo?.src
  ? `<img class="${className}" src="${escapeHtml(t.photo.src)}" width="${t.photo.width}" height="${t.photo.height}" alt="${escapeHtml(t.name)}" loading="lazy" decoding="async">`
  : `<div class="${className} is-placeholder" role="img" aria-label="${escapeHtml(t.name)}. Фото появится позже"><span aria-hidden="true">${escapeHtml(t.initials)}</span></div>`;
function renderTeachers(t, id) {
  const cards = t.records.map((r, i) => `<li class="teachers-bio_item"><article class="teachers-bio_card" aria-labelledby="${id}-name-${i + 1}">
      ${teacherPortrait(r, 'teachers-bio_photo')}
      <div class="teachers-bio_intro"><h3 class="teachers-bio_name" id="${id}-name-${i + 1}">${renderText(r.name)}</h3><p class="teachers-bio_role">${renderText(r.role)}</p><ul class="teachers-bio_tags">${r.tags.map(tag => `<li class="teachers-bio_tag">${renderText(tag)}</li>`).join('')}</ul></div>
      <ul class="teachers-bio_facts">${r.facts.map(f => `<li class="teachers-bio_fact">${icon('check')}<span>${renderText(f)}</span></li>`).join('')}</ul>
    </article></li>`).join('\n');
  return wrap('teachers', id, `<div class="section-layout_component is-responsive">${header(id, t.heading)}<ul class="teachers-bio_list" aria-label="${escapeHtml(t.listLabel)}">${cards}</ul></div>`);
}

/* Страница сравнения вариантов блока: те же стили и скрипты лендинга плюс свой css. Закрыта от индекса, в Тильду не идёт.
   Сейчас не вызывается — понадобится для следующих блоков, которые выбираем из трёх вариантов. */
async function buildVariantsPage({title, css, variants}) {
  const label = (letter, name, source) => `<div class="padding-global"><div class="container-xlarge"><div class="variant-label_component"><p class="variant-label_name">Вариант ${letter} · ${name}</p><p class="variant-label_source">${source}</p></div></div></div>`;
  const body = variants.map(([letter, name, source, markup]) => `${label(letter, name, source)}\n${markup}`).join('\n').replaceAll(NBSP, '&nbsp;');
  const html = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <title>${escapeHtml(title)}</title>
    <link rel="icon" href="data:,">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Wix+Madefor+Text:wght@400;444;500;600&amp;display=swap">
    <link rel="stylesheet" href="../style.css">
    <link rel="stylesheet" href="../${css}">
    <script src="../script.js" defer></script>
  </head>
  <body>
    <!-- Сгенерировано: node treningi-dlya-detey/build.mjs. Варианты блока на выбор. Руками не править. -->
    <main class="main-wrapper academy-page ${SLUG}-page" id="main-content" tabindex="-1">
${body}
    </main>
  </body>
</html>
`;
  const ids = [...html.matchAll(/(?<![\w-])id="([^"]+)"/g)].map(m => m[1]);
  const duplicates = ids.filter((value, i) => ids.indexOf(value) !== i);
  if (duplicates.length) throw new Error(`${title}: повторяющиеся id: ${duplicates.join(', ')}`);
  const source = await read(root, css);
  assertResponsiveContract(source, css);
  assertMotionContract(source, css);
  return html;
}

/* Удостоверение — блок «Документ с фото человека» из библиотеки (13.10.2026, разметка и стили с «Нарративной практики»,
   тот же блок на RFT, IFS и «Психосоматике»). Белая карточка: слева заголовок с сиреневым акцентом, описание, условия
   получения с галочкой (если есть в data/documents.json → terms) и лицензия; справа фото выпускницы с удостоверением.
   Телефон: фото квадратом под текстом; с 768px две колонки, фото по высоте текста. */
function renderDocuments(d, id) {
  const terms = d.terms?.length ? `<ul class="document_terms">${d.terms.map(t => `<li class="document_term">${icon('check')}<span>${renderText(t)}</span></li>`).join('')}</ul>` : '';
  const img = d.image;
  return `<section class="section_documents section-spacing_component" id="${sectionId(id)}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge">
    <div class="document_component">
      <div class="document_copy"><h2 class="section-title_component is-left is-responsive document_heading" id="${id}-heading">${renderText(d.heading)} <span class="section-title_accent">${renderText(d.headingAccent)}</span></h2><p class="body-text_component is-summary is-regular">${renderText(d.description)}</p>${terms}<p class="body-text_component is-fine-print document_license">${d.license.map(renderText).join('<br>')}</p></div>
      <div class="document_media"><img class="document_image" src="${escapeHtml(img.src)}" width="${img.width}" height="${img.height}" alt="${escapeHtml(img.alt)}" draggable="false" loading="lazy" decoding="async"></div>
    </div>
  </div></div>
</section>`;
}

/* Стоимость — утверждённый блок «Одна цифра» из витрины /pricing-scenarios (сценарий «одна цена», 12.10.2026),
   под ним «Гибкие условия оплаты» оттуда же — одной секцией, как на витрине. Кнопок в блоке нет: запись в форме ниже.
   Горизонтальная карточка: слева уровень, название, старт и цена при оплате сразу (крупно), под ней серым
   «выгода N ₽ при оплате сразу» и платёж в рассрочку; справа «Что входит» галочками.
   Официальная цена — в рассрочку (price.list), оплата сразу (price.once) — выгода от неё; платёж = list ÷ months.
   Цена, старт, название и часы — из CMS (cms.js); пока курса в CMS нет, цены ПРИМЕРНЫЕ (data/pricing.json → note). */
function renderPricing(pricing, payment, id) {
  const price = CMS.price;
  const benefit = CMS.api.benefitHtml(price);
  const installment = CMS.api.installmentHtml(price);
  const caption = `<span class="price-caption_line" data-cms-benefit${benefit ? '' : ' hidden'}>${benefit}</span><span class="price-caption_line" data-cms-installment${installment ? '' : ' hidden'}>${installment}</span>`;
  const includes = pricing.includes.map(item => `<li class="price-check_item">${icon('check')}${item.template ? cmsHours(item.template) : `<span>${renderText(item)}</span>`}</li>`).join('');
  const card = `<div class="price-wide_component">
      <div class="price-wide_main"><span class="price-wide_chip">${renderText(pricing.level)}</span><div class="price-wide_title"><p class="price-wide_name" data-cms-title>${renderText(CMS.title)}</p><p class="price-wide_sub">${cmsStart('старт {date}')}</p></div>
        <div class="price-wide_money"><p class="price-tag"><span class="price-tag_number" data-cms-price>${CMS.api.digits(price.sale)}</span><span class="price-tag_unit">₽</span></p><p class="price-caption">${caption}</p></div>
      </div>
      <div class="price-wide_side"><p class="price-wide_side-title">${renderText(pricing.includesTitle)}</p><ul class="price-check" role="list">${includes}</ul></div>
    </div>`;
  const row = (title, body) => `<div class="price-terms_row"><dt class="price-terms_title">${renderText(title)}</dt><dd class="price-terms_body">${body}</dd></div>`;
  const discounts = `<ul class="price-discounts" role="list">${payment.discounts.items.map(d => `<li class="price-discounts_item"><p class="price-discounts_value">${d.prefix ? `<span class="price-discounts_prefix">${renderText(d.prefix)}</span>` : ''}<span class="price-discounts_number">${renderText(d.value)}&nbsp;%</span></p><p class="price-discounts_label">${renderText(d.text)}${d.note ? `<span class="price-discounts_note">${renderText(d.note)}</span>` : ''}</p></li>`).join('')}</ul>`;
  const terms = `<div class="price-terms_component"><h3 class="price-terms_heading" id="${id}-terms">${renderText(payment.heading)}</h3><dl class="price-terms_list" aria-labelledby="${id}-terms">${row(payment.installment.title, `<p class="price-terms_text">${renderText(payment.installment.text)}</p>`)}${row(payment.discounts.title, discounts)}${row(payment.tax.title, `<p class="price-terms_text">${renderText(payment.tax.text)}</p>`)}</dl></div>`;
  return wrap('pricing', id, `<div class="section-layout_component is-responsive price-block_component" data-cms-api="${escapeHtml(pricing.api)}" data-cms-course="${escapeHtml(pricing.slug)}">${header(id, pricing.heading)}${card}${terms}</div>`);
}

/* SEO по docs/seo.md: canonical, Open Graph и JSON-LD из тех же данных, что и страница.
   Цена на странице пока примерная (data/pricing.json), поэтому в разметке курса нет предложений (offers):
   их добавить вместе с реальной ценой — цена в разметке обязана совпадать с ценой на странице. */
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
const ldScript = value => `<script type="application/ld+json">\n${JSON.stringify(value, null, 2).replace(/</g, '\\u003c')}\n</script>`;
function renderJsonLd(seo, teachers, faq) {
  const org = seo.organization;
  const orgId = `${org.url}/#organization`;
  const organization = {'@context': 'https://schema.org', '@type': 'EducationalOrganization', '@id': orgId, name: org.name, url: org.url, logo: org.logo, telephone: org.telephone, email: org.email,
    address: {'@type': 'PostalAddress', addressCountry: 'RU', ...org.address}};
  const plain = text => String(text).replace(/\u00a0/g, ' ');
  // Название, старт и цена — из снимка CMS, если он есть. Примерная цена в разметку не попадает: offers появятся
  // вместе с ценой из CMS (при сборке со снимком или в браузере через cms.js).
  const course = {'@context': 'https://schema.org', '@type': 'Course', '@id': `${seo.canonical}#course`, name: CMS.fromCms ? plain(CMS.title) : seo.course.name, description: seo.course.description, url: seo.canonical, inLanguage: 'ru',
    provider: {'@id': orgId}, educationalCredentialAwarded: seo.course.credential,
    hasCourseInstance: {'@type': 'CourseInstance', startDate: CMS.startDate, instructor: teachers.records.map(t => ({'@type': 'Person', name: t.name, jobTitle: t.tag}))},
    ...(CMS.fromCms && CMS.price ? {offers: {'@type': 'Offer', price: String(CMS.price.sale), priceCurrency: 'RUB', availability: 'https://schema.org/InStock', url: seo.canonical}} : {})};
  const faqPage = {'@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.items.map(item => ({'@type': 'Question', name: plain(item.question), acceptedAnswer: {'@type': 'Answer', text: item.answer.map(plain).join(' ')}}))};
  return [organization, course, faqPage].map(ldScript).join('\n');
}

/* Скрипт формы Академии рассчитан на обязательную почту. Поля почты на лендингах курсов больше нет
   (как в rodbt-live и narrative-therapy), поэтому три места скрипта делаются терпимыми к его отсутствию. */
/* Поля телефона для MAX на этом лендинге нет: контакт для MAX — основной номер телефона. */
function withoutMaxContact(source) {
  const from = '            : maxContactController.getNumber(),';
  if (!source.includes(from)) throw new Error('lead-form.js: не найден фрагмент контакта MAX');
  return source.replace(from, '            : (maxContactController || phoneController).getNumber(),');
}

function withoutEmail(source) {
  // Новая версия общего скрипта сама умеет форму без почты (email: null) — тогда заплатки не нужны.
  if (source.includes('const needsEmail')) return source;
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

// Снимки CMS: data/api-course.json (ответ /api/public/course/:slug) и data/api-catalog-entry.json (часы из каталога).
// С флагом --refresh берутся заново; если курса в CMS ещё нет (404 или нет в каталоге), снимка нет и сборка
// оставляет значения из data/pricing.json.
async function cmsSnapshot(pricing) {
  const courseFile = new URL('data/api-course.json', root);
  const catalogFile = new URL('data/api-catalog-entry.json', root);
  if (process.argv.includes('--refresh')) {
    const response = await fetch(`${pricing.api}/api/public/course/${pricing.slug}`, {headers: {Accept: 'application/json'}});
    if (response.ok) { await fs.writeFile(courseFile, `${JSON.stringify(await response.json(), null, 2)}\n`); console.log('Снимок курса обновлён из API'); }
    else { await fs.rm(courseFile, {force: true}); console.warn(`Курса ${pricing.slug} в CMS нет (API ${response.status}): на странице значения из data/pricing.json`); }
    const catalog = await fetch(`${pricing.api}/api/public/catalog`, {headers: {Accept: 'application/json'}}).then(r => r.ok ? r.json() : null);
    let entry = null;
    const walk = o => { if (entry || !o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(walk); if (o.slug === pricing.slug) { entry = o; return; } Object.values(o).forEach(walk); };
    walk(catalog);
    if (entry) { await fs.writeFile(catalogFile, `${JSON.stringify(entry, null, 2)}\n`); console.log('Снимок каталога обновлён из API'); }
    else { await fs.rm(catalogFile, {force: true}); console.warn(`В каталоге CMS нет курса ${pricing.slug}: часы из data/pricing.json`); }
  }
  const load = file => fs.readFile(file, 'utf8').then(JSON.parse, () => null);
  return {course: await load(courseFile), catalog: await load(catalogFile)};
}

async function buildHtml() {
  const seo = await json('seo');
  // Данные курса: значения по умолчанию из data/pricing.json, поверх — снимок CMS, если он есть.
  const pricingData = await data('pricing');
  const sandbox = {};
  vm.runInNewContext(await read(root, 'cms.js'), sandbox);
  const cmsApi = sandbox.TreningiCms;
  const snapshot = await cmsSnapshot(pricingData);
  const fromCms = cmsApi.fromApi(snapshot.course);
  const {list, once, months} = pricingData.price;
  const hours = Number(snapshot.catalog?.hours) || pricingData.hours;
  CMS = {
    api: cmsApi,
    title: fromCms?.title ? typography(fromCms.title) : pricingData.title,
    start: fromCms?.start || pricingData.start,
    startDate: fromCms?.startDate || seo.course.startDate,
    hoursText: cmsApi.hoursPhrase(hours),
    price: fromCms?.price || {sale: once ?? list, list, perMonth: Math.round(list / months), months},
    fromCms: Boolean(fromCms),
  };
  // Блок об Академии: тексты и фото общие для лендингов, свечения из assets эталона как data URL.
  // Заголовок по ТЗ — «Почему выбирают нас» без акцентной второй строки.
  const academy = await data('academy');
  for (const card of [academy.community, academy.graduates]) for (const key of ['glow', 'compactGlow']) card[key].src = await dataUrl(consultant, card[key].src);
  const showcase = patch(renderAcademyShowcase(academy, {id: `${SLUG}-academy`}), '<br class="academy-showcase_heading-break"><span class="section-title_accent"> </span>', '', 'Почему выбирают нас: заголовок');


  const leadForm = await data('lead-form');
  leadForm.errorIcon = await dataUrl(consultant, 'assets/icons/form-error.svg');
  leadForm.successIcon = await dataUrl(consultant, 'assets/icons/form-success.svg');
  const emailField = /<div class="lead-form_field" data-lead-field data-state="idle"><div class="lead-form_control"><input class="lead-form_input" type="email"[\s\S]*?data-lead-error><\/p><\/div>/;
  const fullForm = renderLeadFormSection({...leadForm, emailLabel: 'Почта'}, {id: `${SLUG}-application`, formId: `${SLUG}-form`});
  if (!emailField.test(fullForm)) throw new Error('Lead form: не найдено поле email в разметке формы');
  // MAX (15.10.2026, Дарья): отдельного поля телефона для MAX нет — ищем человека в MAX по основному номеру.
  // Для Telegram остаётся поле ника, начиная с @. Скрипт формы при этом берёт основной номер (см. buildJs).
  const maxField = /<div class="lead-form_field is-phone" data-lead-field data-state="idle"><div class="lead-form_control"><input class="lead-form_input" type="tel" id="[^"]*-max-contact"[\s\S]*?-max-contact-error" aria-live="polite" data-lead-error><\/p><\/div>/;
  if (!maxField.test(fullForm)) throw new Error('Lead form: не найдено поле телефона для MAX');

  const teachers = await json('teachers');
  // Порядок секций по ТЗ.
  const sections = [
    renderHeroPanel(await data('hero')),
    renderAudienceDoors(await data('audience'), `${SLUG}-audience`),
    renderPainsReply(await data('questions'), `${SLUG}-questions`),
    renderFormatPath(await data('format'), `${SLUG}-format`),
    renderOutcomesDoc(await data('outcomes'), `${SLUG}-outcomes`),
    renderProgramTabs(await data('program'), `${SLUG}-program`),
    renderTeachers(await data('teachers'), `${SLUG}-teachers`),
    renderDocuments(await data('documents'), `${SLUG}-documents`),
    showcase,
    renderRatings(await data('ratings'), {id: `${SLUG}-ratings`}),
    renderPricing(pricingData, await data('payment'), `${SLUG}-pricing`),
    patch(fullForm.replace(emailField, '').replace(maxField, ''), renderText(leadForm.heading), cmsStart(leadForm.headingTemplate), 'Форма: заголовок с датой старта'),
    // Вопросы и ответы — общий блок Академии (аккордеон, как на /narrative-therapy), после формы.
    patch(renderFaq(await data('faq'), {id: `${SLUG}-faq`}), renderText(typography('13 недель, 60 академических часов. Старт 4 марта,')), `${renderText(typography('13 недель, '))}${cmsHours('{hours}')}. ${cmsStart('Старт {date}')},`, 'FAQ: часы и старт'),
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
    <!-- Сгенерировано: node treningi-dlya-detey/build.mjs. Тексты в data/*.json, тема и проектные блоки в page.css. Руками не править. -->
    <main class="main-wrapper academy-page ${SLUG}-page" id="main-content" tabindex="-1" data-academy-anchor-scroll>
${body}
    </main>
${renderJsonLd(seo, teachers, await json('faq'))}
  </body>
</html>
`;
  const ids = [...html.matchAll(/(?<![\w-])id="([^"]+)"/g)].map(m => m[1]);
  const duplicates = ids.filter((value, i) => ids.indexOf(value) !== i);
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
  const order = ['components.css', 'card-spacing.css', 'section-spacing.css', 'body-text.css', 'button.css', 'toggle-icon.css', 'faq-responsive.css', 'academy-showcase-responsive.css', 'ratings.css', 'lead-form.css', 'lead-form-responsive.css', 'section-heading.css', 'anchor-scroll.css'];
  const parts = [];
  for (const name of order) {
    let css = await read(shared, name);
    // Иконка плюса-крестика в FAQ лежит рядом с общим css: в сборке она встраивается data URL, как на /narrative-therapy.
    if (name === 'toggle-icon.css') css = css.replaceAll("url('./assets/disclosure-cross.svg')", `url("${await dataUrl(shared, 'assets/disclosure-cross.svg')}")`);
    assertResponsiveContract(css, name);
    parts.push(`/* === web-academy/shared/academy/${name} === */\n${css.trim()}`);
  }
  const page = await read(root, 'page.css');
  assertResponsiveContract(page, 'page.css');
  const css = `/* Сгенерировано: node treningi-dlya-detey/build.mjs. Общие компоненты Академии, затем тема и проектные блоки из page.css. Руками не править. */\n\n${parts.join('\n\n')}\n\n/* === treningi-dlya-detey/page.css === */\n${page.trim()}\n`;
  assertMotionContract(css, 'style.css');
  if (/url\((['"]?)(\.\/|\.\.\/|assets\/)/.test(css)) throw new Error('В style.css остались локальные url()');
  return css;
}

async function buildJs() {
  const order = ['components.js', 'anchor-scroll.js', 'lead-form.js'];
  const parts = [];
  for (const name of order) {
    let source = (await read(shared, name)).trim();
    if (name === 'lead-form.js') source = withoutMaxContact(withoutEmail(source));
    parts.push(`/* === web-academy/shared/academy/${name} === */\n${source}`);
  }
  parts.push(`/* === treningi-dlya-detey/cms.js === */\n${(await read(root, 'cms.js')).trim()}`);
  parts.push(`/* === treningi-dlya-detey/page.js === */\n${(await read(root, 'page.js')).trim()}`);
  const js = `/* Сгенерировано: node treningi-dlya-detey/build.mjs. Общие скрипты Академии в порядке зависимостей. Руками не править. */\n\n${parts.join('\n\n')}\n`;
  assertResponsiveContract(js, 'script.js');
  return js;
}

const html = await buildHtml();
await fs.writeFile(new URL('index.html', root), html);
await fs.writeFile(new URL('style.css', root), await buildCss());
await fs.writeFile(new URL('script.js', root), await buildJs());
console.log(`${SLUG}: index.html ${html.length} символов`);
