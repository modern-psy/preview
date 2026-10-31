// Сборка шапки сайта для Тильды.
//
// tilda/header.html — первый блок T123: шрифт, стили, разметка со снимком курсов
// и скрипт. tilda/header-search.html — второй блок T123: поиск по курсам и скрытие
// шапки при прокрутке. Ставится сразу под первым (в один блок всё не помещается
// в лимит 65 000 символов). Вставляется на страницу-шапку Тильды (ту, что подключается ко всем
// страницам в настройках сайта). Курсы в разделах и карточки правой колонки («Выбор Академии»)
// скрипт берёт из CMS (/api/public/catalog) и перерисовывает сам; снимок нужен
// поисковикам и на случай, если API не ответил.
// preview.html — шапка на пробной странице, для проверки двойным кликом.
//
// Что где править:
//   src/nav.json         — ссылки шапки, разделы, кнопки, слаги правой колонки;
//   src/header.css       — вид;
//   src/header-render.js — как рисуются курсы (и при сборке, и в браузере);
//   src/header-client.js — поведение меню и загрузка из CMS;
//   src/search-core.js   — движок поиска (раскладка, опечатки, темы);
//   src/header-search.js, src/header-search.css — поиск в шапке (второй блок);
//   src/header-autohide.js, src/header-autohide.css — скрытие при прокрутке (второй блок).
//
// Запуск из корня asp-deploy:
//   node apps/tilda/header/build.mjs
//
// tilda/header.html и preview.html не править руками: они перезаписываются.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const T123_LIMIT = 65000; // лимит символов в одном блоке T123

const read = (p) => readFileSync(join(here, p), 'utf8');
const nav = JSON.parse(read('src/nav.json'));

// В блок T123 стили и скрипт попадают без комментариев и отступов: иначе шапка
// не помещается в лимит одного блока. Пояснения читайте в файлах src/.
function compact(source, kind) {
  let out = source.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//'))
    // пояснение в конце строки кода (« // …») тоже убираем, если в нём нет кавычек
    .map((l) => (kind === 'js' ? l.replace(/\s+\/\/\s[^'"`]*$/, '') : l)).join('\n');
  // Пробелы убираем только вокруг скобок, точек с запятой и запятых: пробел
  // перед двоеточием значим (`.site-header :where(a)` — не то же, что `.site-header:where(a)`)
  if (kind === 'css') out = out.replace(/\n(?=[^{}]*[{;}]$)/gm, ' ').replace(/\s*\n\s*/g, '\n').replace(/ ?([{};,]) ?/g, '$1').replace(/;}/g, '}');
  return out;
}
const css = compact(read('src/header.css'), 'css');
const renderJs = compact(read('src/header-render.js'), 'js');
const clientJs = compact(read('src/header-client.js'), 'js');
// Общий загрузчик каталога: один запрос к API на страницу для шапки, табов, баннера и каталога
const dataJs = compact(readFileSync(join(here, '../catalog-live/src/catalog-data.js'), 'utf8'), 'js');
vm.runInThisContext(renderJs);
const { AspHeader: H } = globalThis;
const esc = H.esc;

const res = await fetch(nav.api + '/api/public/catalog');
if (!res.ok) throw new Error('API ответил ' + res.status);
const data = await res.json();
const cards = data.cards || [];
if (!cards.length) throw new Error('API вернул пустой каталог: в CMS не выбраны разделы.');
const now = new Date();
const date = new Date(data.generatedAt || now).toLocaleDateString('ru-RU');

// Логотип АСП (из прежней шапки), красится цветом ссылки
const LOGO = '<svg viewBox="0 0 95 32" aria-hidden="true" focusable="false"><path d="M49.3529 32C44.7678 32 40.9968 30.4982 38.0397 27.4945C35.0495 24.457 33.5599 20.6265 33.5599 16.0028C33.5599 11.3792 35.055 7.5486 38.0397 4.51116C41.0023 1.50185 44.7678 0 49.3529 0C53.938 0 57.8088 1.51872 60.799 4.55054C61.3196 5.07928 61.8567 5.73176 62.4105 6.49675L58.4511 9.41044C57.9306 8.64546 57.4931 8.09984 57.1443 7.7736C55.1729 5.77114 52.6035 4.76991 49.4415 4.76991C46.2796 4.76991 43.7434 5.78801 41.7388 7.8186C39.6512 9.93918 38.6046 12.6673 38.6046 15.9972C38.6046 19.3271 39.6512 22.0552 41.7388 24.1758C43.7379 26.2064 46.3073 27.2245 49.4415 27.2245C52.5758 27.2245 55.4885 26.0601 57.842 23.7314L58.7114 22.7583L62.5434 25.4976C62.0505 26.1445 61.5411 26.752 61.0205 27.3088C57.9472 30.4307 54.0598 31.9944 49.3585 31.9944L49.3529 32Z" fill="currentColor"/><path d="M70.9333 0.761905H94.5778V32H89.7544V5.58305H75.7567V32H70.9333V0.761905Z" fill="currentColor"/><path d="M18.0133 0.761905H11.7329L0 32H5.11591L8.14572 23.7444H17.6435L15.8886 18.9728H9.90069L11.1038 15.692L11.1203 15.6977L14.829 5.6238L21.159 22.632L24.691 32H29.7462L18.0133 0.761905Z" fill="currentColor"/></svg>';
const CHEVRON_DOWN = '<svg class="site-nav_link-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 7.5 5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CLOSE = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const SEARCH_ICON = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="5.75" stroke="currentColor" stroke-width="1.5"/><path d="m13.5 13.5 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const search = nav.search || {};

// Рейка разделов со счётчиками
const tabsHtml = nav.sections.map((s, i) => {
  const n = H.select(cards, s.section).length;
  return `          <button class="site-nav_tab${i === 0 ? ' is-active' : ''}" type="button" role="tab" id="site-nav-tab-${s.key}" aria-controls="site-nav-panel-${s.key}" aria-selected="${i === 0 ? 'true' : 'false'}" tabindex="${i === 0 ? 0 : -1}" data-section-tab="${esc(s.section)}">
            <span class="site-nav_tab-label">${esc(s.label || s.section)}</span>
            <span class="site-nav_tab-count" data-count>${n || ''}</span>
          </button>`;
}).join('\n');

const actionsHtml = nav.catalogActions.map((a) =>
  `            <a class="site-button${a.kind === 'secondary' ? ' is-secondary' : ''}" href="${esc(a.url)}">${esc(a.label)}</a>`).join('\n');

// Экраны разделов со снимком курсов
const panelsHtml = nav.sections.map((s, i) => {
  const body = H.panelHtml(s, H.select(cards, s.section), nav.utm, now);
  return `          <section class="site-nav_panel${i === 0 ? ' is-active' : ''}" role="tabpanel" id="site-nav-panel-${s.key}" aria-labelledby="site-nav-tab-${s.key}" data-section-panel="${esc(s.section)}" data-label="${esc(s.label || '')}" data-url="${esc(s.url)}" data-noun="${esc((s.noun || []).join('|'))}">
            <button class="site-nav_back" type="button" data-panel-back>Все разделы</button>
            <div class="site-nav_panel-body" data-panel-body data-sig="${H.signature(body)}">${body}</div>
          </section>`;
}).join('\n');

// Правая колонка («Выбор Академии»): слаги из CMS и ручные карточки
const soonSlugs = nav.soon.map((s) => (s.slug != null ? s.slug : null));
const picked = H.pickSoon(cards, soonSlugs.map((s) => s || ''));
const soonHtml = nav.soon.map((s, i) => {
  if (s.slug == null) {
    return `            <li class="site-nav_soon-item" data-soon-manual>
              <a class="site-nav_soon-card" href="${esc(s.url)}">
                ${s.image ? `<img class="site-nav_soon-image" src="${esc(s.image)}" alt="" width="640" height="400" loading="lazy" decoding="async">` : '<span class="site-nav_soon-image"></span>'}
                <span class="site-nav_soon-name">${esc(s.title)}</span>
                ${s.meta ? `<span class="site-nav_soon-meta">${esc(s.meta)}</span>` : ''}
              </a>
            </li>`;
  }
  const card = picked[i];
  const html = card ? H.soonCardHtml(card, nav.utm, now) : '';
  return `            <li class="site-nav_soon-item" data-soon-slug="${esc(s.slug)}" data-sig="${H.signature(html)}"${card ? '' : ' hidden'}>${html}</li>`;
}).join('\n');

// Ссылки шапки. На телефоне первой стоит «Календарь обучения»: кнопки в строке шапки там нет
const calendarHtml = `        <li class="site-nav_item is-mobile-only"><a class="site-nav_link" href="${esc(nav.cta.url)}"><span class="site-nav_link-text">${esc(nav.cta.label)}</span></a></li>\n`;
const linksHtml = calendarHtml + nav.links.map((l) => {
  if (l.items) {
    const id = 'site-nav-sub-' + l.label.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-');
    return `        <li class="site-nav_item has-menu">
          <button class="site-nav_link" type="button" aria-expanded="false" aria-controls="${id}" data-submenu-toggle><span class="site-nav_link-text">${esc(l.label)}</span>${CHEVRON_DOWN}</button>
          <ul class="site-nav_submenu" id="${id}">
${l.items.map((it) => `            <li><a class="site-nav_sublink" href="${esc(it.url)}">${esc(it.label)}</a></li>`).join('\n')}
          </ul>
        </li>`;
  }
  return `        <li class="site-nav_item"><a class="site-nav_link${l.kind === 'event' ? ' is-event' : ''}" href="${esc(l.url)}"><span class="site-nav_link-text">${esc(l.label)}</span></a></li>`;
}).join('\n');

const block = `<!-- ============================================================
     ШАПКА САЙТА · первый из двух блоков T123 страницы-шапки, второй
     (поиск) стоит сразу под ним. Курсы в меню приходят из CMS; здесь
     снимок на ${date} для поисковиков и на случай, если API не ответил.
     Правки прямо в блоке затрутся при следующей сборке: ссылки, кнопки
     и карточки «Выбор Академии» меняйте в apps/tilda/header/src/nav.json
       node apps/tilda/header/build.mjs
     ============================================================ -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Wix+Madefor+Text:wght@400;500;600&amp;display=swap" rel="stylesheet">
<style>
${css}</style>
<header class="site-header" data-site-header data-api="${esc(nav.api)}" data-utm="${esc(nav.utm || '')}">
  <div class="site-header_bar">
    <div class="site-header_inner">
      <a class="site-header_brand" href="${esc(nav.home)}" aria-label="Академия современной психологии — на главную">${LOGO}</a>

      <button class="site-header_toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-nav-toggle>
        <span class="site-header_toggle-icon" aria-hidden="true"><span></span><span></span></span>
        <span class="site-header_toggle-label">Все курсы</span>
      </button>

      <button class="site-search-trigger" type="button" aria-label="${esc(search.label)}" aria-expanded="false" data-search-open hidden>${SEARCH_ICON}<span class="is-long">${esc(search.placeholder)}</span><span class="is-short">${esc(search.placeholderShort || search.placeholder)}</span></button>

      <a class="site-button site-header_cta" href="${esc(nav.cta.url)}">${nav.cta.short ? `<span class="is-wide">${esc(nav.cta.label)}</span><span class="is-narrow">${esc(nav.cta.short)}</span>` : esc(nav.cta.label)}</a>

      <nav class="site-nav" id="site-nav" aria-label="Меню сайта" data-nav>
        <div class="site-nav_head">
          <p class="site-nav_head-title">Меню</p>
          <button class="site-nav_close" type="button" aria-label="Закрыть меню" data-nav-close>${CLOSE}</button>
        </div>

        <div class="site-nav_catalog" id="site-nav-catalog" data-catalog-menu>
          <div class="site-nav_catalog-inner">
            <div class="site-nav_rail">
              <p class="site-nav_rail-title">Все курсы</p>
              <div class="site-nav_tabs" role="tablist" aria-orientation="vertical" aria-label="Разделы каталога">
${tabsHtml}
              </div>
              <div class="site-nav_rail-actions">
${actionsHtml}
              </div>
            </div>

            <div class="site-nav_panels">
${panelsHtml}
            </div>

            <aside class="site-nav_soon" aria-labelledby="site-nav-soon-title">
              <p class="site-nav_soon-title" id="site-nav-soon-title">${esc(nav.soonTitle || 'Выбор Академии')}</p>
              <ul class="site-nav_soon-list" data-soon-list>
${soonHtml}
              </ul>
            </aside>
          </div>
        </div>

        <ul class="site-nav_links">
${linksHtml}
        </ul>
      </nav>
    </div>
  </div>
  <div class="site-header_scrim" data-nav-scrim hidden></div>
</header>
<script>
${dataJs}
${renderJs}
${clientJs}</script>
`;

if (block.length >= T123_LIMIT) throw new Error(`tilda/header.html: ${block.length} символов — больше лимита T123 (${T123_LIMIT})`);
writeFileSync(join(here, 'tilda/header.html'), block);

// Второй блок: поиск по курсам. Ставится на страницу-шапку сразу под первым.
// Сам дорисовывает поле в меню, подсказки, результаты и панель для десктопа.
const searchCfg = {
  label: search.label, inputPlaceholder: search.inputPlaceholder, hints: search.hints || [],
  allLabel: search.allLabel, allUrl: search.allUrl, metrika: search.metrika || '',
};
const searchBlock = `<!-- ============================================================
     ШАПКА: ПОИСК ПО КУРСАМ И СКРЫТИЕ ПРИ ПРОКРУТКЕ · второй блок T123
     на странице-шапке, сразу под блоком шапки. Без него шапка работает,
     но без поиска и всегда видна наверху.
     Поиск — по курсам из CMS (/api/public/catalog): названия, поисковые
     слова, преподаватели, темы поиска. Руками не править: собирается
       node apps/tilda/header/build.mjs
     Надписи и быстрые запросы — apps/tilda/header/src/nav.json (search).
     ============================================================ -->
<style>
${compact(read('src/header-search.css'), 'css')}
${compact(read('src/header-autohide.css'), 'css')}</style>
<script>
window.__aspSearchCfg=${JSON.stringify(searchCfg).replace(/</g, '\\u003c')};
${compact(read('src/search-core.js'), 'js')}
${compact(read('src/header-search.js'), 'js')}
${compact(read('src/header-autohide.js'), 'js')}</script>
`;
if (searchBlock.length >= T123_LIMIT) throw new Error(`tilda/header-search.html: ${searchBlock.length} символов — больше лимита T123 (${T123_LIMIT})`);
writeFileSync(join(here, 'tilda/header-search.html'), searchBlock);

// Только для превью, пока CMS не выкатили с поисковыми полями: черновые слова,
// преподаватели и темы из seed-файлов ASP-Prod. В блоки Тильды не попадает.
let previewExtra = '';
const seedDir = join(here, '../../../../ASP-Prod/apps/cms/src/seed');
if (existsSync(join(seedDir, 'search-words.json'))) {
  const seed = (f) => JSON.parse(readFileSync(join(seedDir, f), 'utf8'));
  const teachers = {};
  for (const [name, slugs] of Object.entries(seed('teacher-links.json').teachers)) {
    for (const s of slugs) (teachers[s] = teachers[s] || []).push(name);
  }
  const topics = seed('search-topics.json').topics.map((t) => ({
    title: t.title, terms: t.terms.split(',').map((w) => w.trim()).filter(Boolean), courses: t.courses,
  }));
  previewExtra = `<script>window.__aspSearchPreview=${JSON.stringify({ words: seed('search-words.json').words, teachers, topics }).replace(/</g, '\\u003c')};</script>\n`;
}

// Превью: шапка на пробной странице с прокруткой, чтобы проверить липкость и меню
writeFileSync(join(here, 'preview.html'), `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Шапка сайта · превью</title>
<style>
  html, body { margin: 0; background: #f5f5f5; font-family: "Wix Madefor Text", Arial, sans-serif; color: #1d1d33; }
  .t-records { position: relative; }
  .preview-page { max-width: calc(95rem + 2 * clamp(1rem, 4.7619vw, 5rem)); margin: 0 auto; padding: 3rem clamp(1rem, 4.7619vw, 5rem) 6rem; box-sizing: border-box; }
  .preview-page h1 { margin: 0 0 1rem; font-size: clamp(2rem, 4vw, 3rem); font-weight: 500; letter-spacing: -0.02em; line-height: 1.1; }
  .preview-page p { max-width: 42rem; font-size: 1.125rem; line-height: 1.5; color: #585873; }
  .preview-block { height: 18rem; margin-top: 2rem; border-radius: 1rem; background: #fff; border: 1px solid #e8e7ee; }
  /* Эмуляция стилей Тильды: она красит и подчёркивает все ссылки правилом #allrecords a.
     Если в шапке что-то стало оранжевым или подчёркнутым — в header.css не хватает !important. */
  #allrecords a { color: #ff8562; text-decoration: underline; }
  #allrecords a:hover { color: #ff8562; }
</style>
</head>
<body>
${previewExtra}<div id="allrecords" class="t-records">
<div id="t-header">
${block}${searchBlock}</div>
<main class="preview-page">
  <h1>Пробная страница под шапкой</h1>
  <p>Здесь нет ничего, кроме прокрутки: проверяем, что шапка прилипает к верху (на телефоне и планшете уезжает при прокрутке вниз и возвращается при прокрутке вверх), мега-меню и поиск открываются и закрываются, а на телефоне меню занимает весь экран.</p>
  <p>Поиск в превью знает черновые поисковые слова, преподавателей и темы из CMS, которые ещё не выкатили. Попробуйте: «шизофрения», «сво», «Гусаченко», «rgn».</p>
  <div class="preview-block"></div>
  <div class="preview-block"></div>
  <div class="preview-block"></div>
  <div class="preview-block"></div>
</main>
</div>
</body>
</html>
`);

// Та же пробная страница кладётся в превью (apps/preview/header → modern-psy-preview-5a99.twc1.net/header/),
// чтобы шапку можно было показать по ссылке. Файл перезаписывается при каждой сборке.
const previewDir = join(here, '../../preview/header');
if (existsSync(join(here, '../../preview'))) {
  if (!existsSync(previewDir)) (await import('node:fs')).mkdirSync(previewDir);
  writeFileSync(join(previewDir, 'index.html'), readFileSync(join(here, 'preview.html'), 'utf8'));
}

const counts = nav.sections.map((s) => `${s.section}: ${H.select(cards, s.section).length}`).join(', ');
console.log(`tilda/header.html: ${block.length} символов (лимит ${T123_LIMIT}). Курсов из CMS: ${cards.length} (${counts}). «${nav.soonTitle}»: ${picked.map((c, i) => (nav.soon[i].slug == null ? 'ручная карточка' : c ? c.slug : 'нет')).join(', ')}.`);
