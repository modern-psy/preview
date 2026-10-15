// Сборка лендинга «Схема-терапия: 10 краткосрочных протоколов для повседневных запросов» (бывшая «Схема-терапия для неклинических
// запросов», адрес modern-psy.ru/schema-terapiya-neklinicheskie-zaprosy) из блоков библиотеки Академии. 15.10.2026.
// Запуск из apps/preview: node schema-terapiya-neklinicheskie-zaprosy/build.mjs [--refresh]
// Вход: data/*.json (тексты), page.css (тема и проектные блоки), общие компоненты web-academy/shared/academy (только при сборке).
// Выход: index.html, style.css, script.js — самодостаточные, без runtime-ссылок на web-academy.
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {renderAcademyShowcase} from '../web-academy/shared/academy/academy-showcase-render.mjs';
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

const SLUG = 'schema-terapiya-neklinicheskie-zaprosy';
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
    // Диапазон «7–10» не рвётся на строки: после короткого тире между цифрами — невидимая сцепка (word joiner).
    .replace(/(\d)–(?=\d)/g, '$1–\u2060');
}
// Пробелы связываются только в текстовых узлах: URL, атрибуты, идентификаторы и alt не трогаем.
const SKIP_KEYS = new Set(['id', 'src', 'url', 'href', 'asset', 'alt', 'gridSource', 'errorIcon', 'successIcon', 'agreementUrl', 'privacyUrl', 'nativeMarker', 'action', 'value', 'listLabel', 'icon', 'variant', 'composition', 'heading_id', 'destination', 'label', 'tagsLabel', 'platformsLabel', 'comment']);
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

/* Данные курса из CMS: старт, часы и цена (cms.js, атрибуты data-cms-*). При сборке в страницу вшивается снимок:
   значения из data/pricing.json, поверх — data/api-course.json и data/api-catalog-entry.json (node … build.mjs --refresh).
   В браузере cms.js обновляет их из API. Название берётся из data/pricing.json: в CMS курс пока под старым именем. */
let CMS = null;
const cmsStart = template => `<span data-cms-start="${escapeHtml(template)}">${renderText(template.replace('{date}', CMS.start))}</span>`;
const cmsHours = template => `<span data-cms-hours="${escapeHtml(template)}">${renderText(template.replace('{hours}', CMS.hoursText))}</span>`;

/* Иконки Lucide: 20 px, линия 2 из 24, цвет как у текста рядом. */
const ICONS = {
  'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'list-checks': '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  video: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  'graduation-cap': '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
};
const icon = name => {
  if (!ICONS[name]) throw new Error(`Нет иконки ${name}`);
  return `<svg class="hero-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
};

const wrap = (name, id, inner, {width = 'wide'} = {}) => `<section class="section_${name} section-spacing_component" id="${sectionId(id)}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge"><div class="column-grid_component"><div class="column-grid_content is-content-${width}">
    ${inner}
  </div></div></div></div>
</section>`;
const header = (id, heading, description, align = 'center') => `<div class="section-header_component is-${align} is-responsive"><h2 class="section-title_component is-${align} is-responsive" id="${id}-heading">${renderText(heading)}</h2>${description ? `<p class="section-subtitle_component">${renderText(description)}</p>` : ''}</div>`;

/* Первый экран — «Описание в плашке» из библиотеки (эталоны В3 и К4, как на /treningi-dlya-detey и /business-consulting):
   поле #2B2334, справа фото в рамке, слева заголовок, польза курса в чуть более светлой плашке строками с иконками,
   плитка старта, одна кнопка. На планшете и телефоне фото уходит вниз, плитка и кнопка лежат на нём.
   Под карточкой — факты иконками в белых кружках (часы из CMS, формат, документ). */
function renderHeroPanel(hero, {headingLevel = 1, headingId = hero.heading_id} = {}) {
  const {panel} = hero;
  const rows = panel.rows.map(row => `<li class="hero-panel_row"><span class="hero-panel_row-icon">${icon(row.icon)}</span><span>${renderText(row.text)}</span></li>`).join('');
  const tiles = panel.tiles.map(tile => `<li class="hero-panel_tile">${icon(tile.icon)}${tile.template ? cmsStart(tile.template) : renderText(tile.text)}</li>`).join('');
  const main = hero.actions[0];
  return `<section class="section_hero" aria-labelledby="${sectionId(headingId)}">
  <div class="padding-global"><div class="container-xlarge">
    <div class="hero-panel_component">
      <div class="hero-panel_text">
        <h${headingLevel} class="hero-panel_heading" id="${headingId}">${renderText(CMS.title)}</h${headingLevel}>
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

/* «В реальной практике клиенты приходят не с „клиникой“» — «Три ситуации и тёмная заметка» из библиотеки
   (как на /cft-intro, /seksologiya-dlya-psihologov, /sport-psy-start). Три белые карточки: фото 16:10, заголовок, текст,
   серая подпись-следствие; под карточками тёмная заметка-вывод. Телефон — столбиком, 768–1024 — по две, с 1025 — в ряд. */
function renderPains(p, id) {
  const cards = p.cards.map(c => `<li class="situations_card">
        <div class="situations_media"><img class="situations_image" src="${escapeHtml(c.image.src)}" width="${c.image.width}" height="${c.image.height}" alt="${escapeHtml(c.image.alt)}" loading="lazy" decoding="async"></div>
        <div class="situations_body"><h3 class="situations_title">${renderText(c.title)}</h3><p class="situations_text">${renderText(c.text)}</p>${c.note ? `<p class="situations_note">${renderText(c.note)}</p>` : ''}</div>
      </li>`).join('\n');
  return wrap('situations', id, `<div class="section-layout_component is-responsive">
      ${header(id, p.heading, null, 'left')}
      <ul class="situations_list" aria-label="${escapeHtml(p.listLabel)}">${cards}</ul>
      <p class="situations_summary">${renderText(p.summary)}</p>
    </div>`);
}

/* «Что вы получаете на курсе» — «Фото-фон со стеклянными карточками» из библиотеки (вариант с /treningi-dlya-detey,
   «Тренинг о тренинге»). Фото приглушено затемнением в тон поля #2B2334, слева и снизу плотнее. Сверху заголовок,
   внизу четыре стеклянные карточки; карточка «10 протоколов» белая — главное в названии курса.
   Телефон: фото сверху, карточки столбиком на тёмном поле; 768–1024 — 2 × 2 поверх фото; с 1025 — в ряд. */
function renderGains(g, id) {
  const items = g.items.map(item => `<li class="gains-glass_item${item.accent ? ' is-accent' : ''}"><p class="gains-glass_title">${renderText(item.title)}</p><p class="gains-glass_text">${renderText(item.text)}</p></li>`).join('');
  return `<section class="section_gains-glass section-spacing_component" id="${sectionId(id)}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge">
    <div class="gains-glass_component">
      <div class="gains-glass_media"><img class="gains-glass_image" src="${escapeHtml(g.image.src)}" width="${g.image.width}" height="${g.image.height}" alt="${escapeHtml(g.image.alt)}" draggable="false" loading="lazy" decoding="async"></div>
      <div class="gains-glass_content">
        <h2 class="section-title_component is-left is-responsive gains-glass_heading" id="${id}-heading">${renderText(g.heading)}</h2>
        <ul class="gains-glass_list" aria-label="${escapeHtml(g.listLabel)}">${items}</ul>
      </div>
    </div>
  </div></div>
</section>`;
}

/* «Для кого этот курс» — «Светлая и тёмная карточки» из библиотеки (как на /rft и /sport-psy-start): две группы рядом,
   у каждой ярлык, заголовок и текст. С 768px карточки рядом одной высоты, на телефоне друг под другом. */
function renderAudience(a, id) {
  const cards = a.groups.map(g => `<li class="audience-pair_card${g.dark ? ' is-dark' : ''}"><p class="audience-pair_label">${renderText(g.label)}</p><h3 class="audience-pair_title">${renderText(g.title)}</h3><p class="audience-pair_text">${renderText(g.text)}</p></li>`).join('');
  return wrap('audience-pair', id, `<div class="section-layout_component is-responsive">${header(id, a.heading)}<ul class="audience-pair_list">${cards}</ul></div>`);
}

/* «Чему вы научитесь на курсе» — «Светлые карточки без иконок» из библиотеки (как на /narrative-therapy, /cft-intro):
   шесть белых карточек, заголовок «глагол + что» и пояснение серым. Телефон — столбиком, с 768 — по две, с 1025 — 3 × 2. */
function renderSkills(s, id) {
  const cards = s.items.map(item => `<li class="skills-plain_card"><h3 class="skills-plain_title">${renderText(item.title)}</h3><p class="skills-plain_text">${renderText(item.text)}</p></li>`).join('');
  return wrap('skills-plain', id, `<div class="section-layout_component is-responsive">${header(id, s.heading, s.description)}<ul class="skills-plain_list" aria-label="${escapeHtml(s.listLabel)}">${cards}</ul></div>`);
}

/* Программа курса — «Витрина 10 протоколов» (выбрана Дарьей 15.10.2026: макет А .impeccable/mocks/schema-program/comp-a-grid.png
   с карточкой «Из чего состоит каждый протокол» из макета В). Сверху узкая белая карточка модуля 1, ниже подпись модуля 2
   и десять протоколов карточками с бледным номером, под ними строка состава протокола, внизу тёмная плашка итоговой
   аттестации с двумя белыми карточками и кнопкой заявки. Протоколы: телефон — строками, с 521px — по два,
   с 1025px — 5 × 2. Номера декоративные (порядок передаёт сам нумерованный список). */
function renderProgramProtocols(p, id) {
  const pad = i => String(i + 1).padStart(2, '0');
  const protocols = p.protocols.items.map((name, i) => `<li class="program-protocols_item"><span class="program-protocols_number" aria-hidden="true">${pad(i)}</span><span class="program-protocols_name">${renderText(name)}</span></li>`).join('');
  const anatomy = p.anatomy.items.map(item => `<li class="program-protocols_part">${renderText(item)}</li>`).join('');
  const checks = p.attestation.items.map(item => `<li class="program-protocols_check"><h4 class="program-protocols_check-title">${renderText(item.title)}</h4><p class="program-protocols_check-text">${renderText(item.text)}</p></li>`).join('');
  return wrap('program-protocols', id, `<div class="section-layout_component is-responsive">
      ${header(id, p.heading, p.schedule)}
      <div class="program-protocols_component">
        <div class="program-protocols_intro"><h3 class="program-protocols_label">${renderText(p.intro.badge)} · ${renderText(p.intro.title)}</h3><p class="program-protocols_intro-text">${renderText(p.intro.topics[0])}</p></div>
        <div class="program-protocols_module">
          <div class="program-protocols_module-head"><h3 class="program-protocols_label">${renderText(p.protocols.badge)} · ${renderText(p.protocols.listLabel)}</h3><p class="program-protocols_module-text">${renderText(p.protocols.title)}</p></div>
          <ol class="program-protocols_grid" aria-label="${escapeHtml(p.protocols.listLabel)}">${protocols}</ol>
          <div class="program-protocols_anatomy"><h4 class="program-protocols_anatomy-title">${renderText(p.anatomy.title)}</h4><ul class="program-protocols_parts" aria-label="${escapeHtml(p.anatomy.listLabel)}">${anatomy}</ul></div>
        </div>
        <div class="program-protocols_attestation">
          <h3 class="program-protocols_attestation-title">${renderText(p.attestation.title)}</h3>
          <ul class="program-protocols_checks">${checks}</ul>
          <a class="button_component button is-accent program-protocols_button" href="${escapeHtml(p.button.href)}">${renderText(p.button.label)}</a>
        </div>
      </div>
    </div>`);
}

/* Преподаватели — вертикальная карточка (как на /treningi-dlya-detey): фото, имя, роль, сиреневые плашки регалий, факты
   с галочками. Фото со старой страницы — круглые портреты 300–400 px, поэтому здесь они круглые и небольшие (is-round),
   а не 4:3 на всю ширину. Две карточки рядом с 768px. */
const teacherPortrait = (t, className) => t.photo?.src
  ? `<img class="${className} is-round" src="${escapeHtml(t.photo.src)}" width="${t.photo.width}" height="${t.photo.height}" alt="${escapeHtml(t.name)}" loading="lazy" decoding="async">`
  : `<div class="${className} is-placeholder" role="img" aria-label="${escapeHtml(t.name)}. Фото появится позже"><span aria-hidden="true">${escapeHtml(t.initials)}</span></div>`;
function renderTeachers(t, id) {
  const cards = t.records.map((r, i) => `<li class="teachers-bio_item"><article class="teachers-bio_card" aria-labelledby="${id}-name-${i + 1}">
      ${teacherPortrait(r, 'teachers-bio_photo')}
      <div class="teachers-bio_intro"><h3 class="teachers-bio_name" id="${id}-name-${i + 1}">${renderText(r.name)}</h3><p class="teachers-bio_role">${renderText(r.role)}</p><ul class="teachers-bio_tags">${r.tags.map(tag => `<li class="teachers-bio_tag">${renderText(tag)}</li>`).join('')}</ul></div>
      <ul class="teachers-bio_facts">${r.facts.map(f => `<li class="teachers-bio_fact">${icon('check')}<span>${renderText(f)}</span></li>`).join('')}</ul>
    </article></li>`).join('\n');
  return wrap('teachers', id, `<div class="section-layout_component is-responsive">${header(id, t.heading)}<ul class="teachers-bio_list" aria-label="${escapeHtml(t.listLabel)}">${cards}</ul></div>`);
}

/* Стоимость — утверждённый блок «Одна цифра» из витрины /pricing-scenarios (сценарий «одна цена»),
   под ним «Гибкие условия оплаты» оттуда же — одной секцией. Кнопок в блоке нет: запись в форме ниже.
   Официальная цена — в рассрочку (price.list), оплата сразу (price.once) — выгода от неё; платёж = list ÷ months.
   Цена, старт и часы — из CMS (cms.js). */
function renderPricing(pricing, payment, id) {
  const price = CMS.price;
  const benefit = CMS.api.benefitHtml(price);
  const installment = CMS.api.installmentHtml(price);
  const caption = `<span class="price-caption_line" data-cms-benefit${benefit ? '' : ' hidden'}>${benefit}</span><span class="price-caption_line" data-cms-installment${installment ? '' : ' hidden'}>${installment}</span>`;
  const includes = pricing.includes.map(item => `<li class="price-check_item">${icon('check')}${item.template ? cmsHours(item.template) : `<span>${renderText(item)}</span>`}</li>`).join('');
  const card = `<div class="price-wide_component">
      <div class="price-wide_main"><span class="price-wide_chip">${renderText(pricing.level)}</span><div class="price-wide_title"><p class="price-wide_name">${renderText(CMS.title)}</p><p class="price-wide_sub">${cmsStart('старт {date}')}</p></div>
        <div class="price-wide_money"><p class="price-tag"><span class="price-tag_number" data-cms-price>${CMS.api.digits(price.sale)}</span><span class="price-tag_unit">₽</span></p><p class="price-caption">${caption}</p></div>
      </div>
      <div class="price-wide_side"><p class="price-wide_side-title">${renderText(pricing.includesTitle)}</p><ul class="price-check" role="list">${includes}</ul></div>
    </div>`;
  const row = (title, body) => `<div class="price-terms_row"><dt class="price-terms_title">${renderText(title)}</dt><dd class="price-terms_body">${body}</dd></div>`;
  const discounts = `<ul class="price-discounts" role="list">${payment.discounts.items.map(d => `<li class="price-discounts_item"><p class="price-discounts_value">${d.prefix ? `<span class="price-discounts_prefix">${renderText(d.prefix)}</span>` : ''}<span class="price-discounts_number">${renderText(d.value)}&nbsp;%</span></p><p class="price-discounts_label">${renderText(d.text)}</p></li>`).join('')}</ul>`;
  const terms = `<div class="price-terms_component"><h3 class="price-terms_heading" id="${id}-terms">${renderText(payment.heading)}</h3><dl class="price-terms_list" aria-labelledby="${id}-terms">${row(payment.installment.title, `<p class="price-terms_text">${renderText(payment.installment.text)}</p>`)}${row(payment.discounts.title, discounts)}${row(payment.tax.title, `<p class="price-terms_text">${renderText(payment.tax.text)}</p>`)}</dl></div>`;
  return wrap('pricing', id, `<div class="section-layout_component is-responsive price-block_component" data-cms-api="${escapeHtml(pricing.api)}" data-cms-course="${escapeHtml(pricing.slug)}">${header(id, pricing.heading)}${card}${terms}</div>`);
}

/* SEO по docs/seo.md: canonical, Open Graph и JSON-LD из тех же данных, что и страница. Цена в разметке — из снимка CMS
   (совпадает с ценой на странице); в браузере cms.js обновляет её вместе с карточкой. */
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
  const plain = text => String(text).replace(/\u00a0/g, ' ').replace(/\u2060/g, '');
  const course = {'@context': 'https://schema.org', '@type': 'Course', '@id': `${seo.canonical}#course`, name: seo.course.name, description: seo.course.description, url: seo.canonical, inLanguage: 'ru',
    provider: {'@id': orgId}, educationalCredentialAwarded: seo.course.credential,
    hasCourseInstance: {'@type': 'CourseInstance', courseMode: 'online', startDate: CMS.startDate, instructor: teachers.records.map(t => ({'@type': 'Person', name: t.name, jobTitle: t.tag}))},
    ...(CMS.fromCms && CMS.price ? {offers: {'@type': 'Offer', price: String(CMS.price.sale), priceCurrency: 'RUB', availability: 'https://schema.org/InStock', url: seo.canonical}} : {})};
  const faqPage = {'@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.items.map(item => ({'@type': 'Question', name: plain(item.question), acceptedAnswer: {'@type': 'Answer', text: item.answer.map(plain).join(' ')}}))};
  return [organization, course, faqPage].map(ldScript).join('\n');
}

/* Поля почты на лендингах курсов нет; контакт для MAX — основной номер телефона (как на /treningi-dlya-detey). */
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
// С флагом --refresh берутся заново; если API не ответил, остаются значения из data/pricing.json.
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
  const pricingData = await data('pricing');
  const sandbox = {};
  vm.runInNewContext(await read(root, 'cms.js'), sandbox);
  const cmsApi = sandbox.SchemaCms;
  const snapshot = await cmsSnapshot(pricingData);
  const fromCms = cmsApi.fromApi(snapshot.course);
  const {list, once, months} = pricingData.price;
  const hours = Number(snapshot.catalog?.hours) || pricingData.hours;
  CMS = {
    api: cmsApi,
    title: pricingData.title,
    start: fromCms?.start || pricingData.start,
    startDate: fromCms?.startDate || seo.course.startDate,
    hoursText: cmsApi.hoursPhrase(hours),
    price: fromCms?.price || {sale: once ?? list, list, perMonth: Math.round(list / months), months},
    fromCms: Boolean(fromCms),
  };
  // Блок об Академии: тексты и фото общие для лендингов, свечения из assets эталона как data URL.
  const academy = await data('academy');
  for (const card of [academy.community, academy.graduates]) for (const key of ['glow', 'compactGlow']) card[key].src = await dataUrl(consultant, card[key].src);
  const showcase = patch(renderAcademyShowcase(academy, {id: `${SLUG}-academy`}), '<br class="academy-showcase_heading-break"><span class="section-title_accent"> </span>', '', 'Почему выбирают нас: заголовок');

  const leadForm = await data('lead-form');
  leadForm.errorIcon = await dataUrl(consultant, 'assets/icons/form-error.svg');
  leadForm.successIcon = await dataUrl(consultant, 'assets/icons/form-success.svg');
  const emailField = /<div class="lead-form_field" data-lead-field data-state="idle"><div class="lead-form_control"><input class="lead-form_input" type="email"[\s\S]*?data-lead-error><\/p><\/div>/;
  const fullForm = renderLeadFormSection({...leadForm, emailLabel: 'Почта'}, {id: `${SLUG}-application`, formId: `${SLUG}-form`});
  if (!emailField.test(fullForm)) throw new Error('Lead form: не найдено поле email в разметке формы');
  const maxField = /<div class="lead-form_field is-phone" data-lead-field data-state="idle"><div class="lead-form_control"><input class="lead-form_input" type="tel" id="[^"]*-max-contact"[\s\S]*?-max-contact-error" aria-live="polite" data-lead-error><\/p><\/div>/;
  if (!maxField.test(fullForm)) throw new Error('Lead form: не найдено поле телефона для MAX');

  const teachers = await json('teachers');
  // Порядок секций — как на старой странице; цена добавлена перед формой (решение Дарьи 15.10.2026).
  const sections = [
    renderHeroPanel(await data('hero')),
    renderPains(await data('pains'), `${SLUG}-situations`),
    renderGains(await data('gains'), `${SLUG}-gains`),
    renderAudience(await data('audience'), `${SLUG}-audience`),
    renderSkills(await data('skills'), `${SLUG}-skills`),
    renderTeachers(await data('teachers'), `${SLUG}-teachers`),
    renderProgramProtocols(await data('program'), `${SLUG}-program`),
    showcase,
    renderPricing(pricingData, await data('payment'), `${SLUG}-pricing`),
    patch(fullForm.replace(emailField, '').replace(maxField, ''), renderText(leadForm.heading), cmsStart(leadForm.headingTemplate), 'Форма: заголовок с датой старта'),
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
    <link rel="preconnect" href="https://static.tildacdn.com" crossorigin>
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Wix+Madefor+Text:wght@400;444;500;600&amp;display=swap">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/css/intlTelInput.css">
    <link rel="stylesheet" href="./style.css">
    <script src="https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/js/intlTelInput.min.js" defer></script>
    <script src="./script.js" defer></script>
  </head>
  <body>
    <!-- Сгенерировано: node ${SLUG}/build.mjs. Тексты в data/*.json, тема и проектные блоки в page.css. Руками не править. -->
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
  if (/—/.test(body)) console.warn('В текстах есть длинное тире: Дарья просит его не ставить');
  for (const [, file] of html.matchAll(/src="(assets\/[^"]+)"/g)) {
    await fs.access(new URL(file, root)).catch(() => { throw new Error(`Нет локального файла ${file}`); });
    console.warn(`Локальная картинка ${file}: для Тильды нужна ссылка на CDN`);
  }
  return html;
}

async function buildCss() {
  const order = ['components.css', 'card-spacing.css', 'section-spacing.css', 'body-text.css', 'button.css', 'toggle-icon.css', 'faq-responsive.css', 'academy-showcase-responsive.css', 'lead-form.css', 'lead-form-responsive.css', 'section-heading.css', 'anchor-scroll.css'];
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
  const css = `/* Сгенерировано: node ${SLUG}/build.mjs. Общие компоненты Академии, затем тема и проектные блоки из page.css. Руками не править. */\n\n${parts.join('\n\n')}\n\n/* === ${SLUG}/page.css === */\n${page.trim()}\n`;
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
  parts.push(`/* === ${SLUG}/cms.js === */\n${(await read(root, 'cms.js')).trim()}`);
  const js = `/* Сгенерировано: node ${SLUG}/build.mjs. Общие скрипты Академии в порядке зависимостей. Руками не править. */\n\n${parts.join('\n\n')}\n`;
  assertResponsiveContract(js, 'script.js');
  return js;
}

const html = await buildHtml();
await fs.writeFile(new URL('index.html', root), html);
await fs.writeFile(new URL('style.css', root), await buildCss());
await fs.writeFile(new URL('script.js', root), await buildJs());
console.log(`${SLUG}: index.html ${html.length} символов`);
