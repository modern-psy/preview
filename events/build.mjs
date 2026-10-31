// Сборка страницы мероприятий: node events/build.mjs (запускать из apps/preview)
//
// Что делает:
//   1. Берёт мероприятия из data/events.json и рисует карточки, оглавление
//      и микроразметку. Неразрывные пробелы расставляет сама.
//   2. Вставляет шапку сайта из apps/tilda/header (если папка рядом есть,
//      иначе — последнюю копию data/header.html).
//   3. Обновляет type.css из Web Academy (если папка рядом есть).
//
// Руками index.html не править: он перезаписывается. Тексты — в template.html
// и data/events.json.

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const HEADER_DIR = join(here, '..', '..', 'tilda', 'header', 'tilda');
const HEADER_PARTS = ['01-css.html', '02-html.html', '03-js.html']; // порядок как на Тильде: стили, разметка, скрипты
const HEADER_COPY = join(here, 'data', 'header.html'); // копия на случай, если apps/tilda рядом нет
const WA_SHARED = join(here, '..', 'web-academy', 'shared', 'academy');

// ---------- Типографика ----------
// Короткие слова, после которых пробел становится неразрывным (предлоги, союзы, частицы)
const SHORT_WORDS = 'а|в|во|и|к|ко|о|об|от|с|со|у|до|за|из|на|не|ни|но|по|про|для|без|как|или|при|под|над|что|его|их|её';
const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function typo(text) {
  let s = String(text);
  s = s.replace(/(\d) (\d{3})(?!\d)/g, '$1 $2');                  // разряды: 1 999 → узкий неразрывный
  s = s.replace(new RegExp(`(^|[\\s«(])(${SHORT_WORDS}) `, 'gi'), '$1$2 '); // после коротких слов
  s = s.replace(new RegExp(`(^|[\\s«(])(${SHORT_WORDS}) `, 'gi'), '$1$2 '); // второй проход: «и в работе»
  s = s.replace(/(\d\+?) (?=[^\s\d])/g, '$1 ');                       // число и следующее слово
  s = s.replace(/ (\d{1,2}(?:\.\d)?)(?=$|[.,:)])/g, ' $1');            // номер в конце не отрывается: Episode 4, 2.0
  s = s.replace(/ — /g, ' — ');                                        // тире не уходит в начало строки
  s = s.replace(/ ₽/g, ' ₽');
  return escapeHtml(s).replace(/ /g, '&nbsp;').replace(/ /g, '&#8239;');
}

// ---------- Карточки ----------
const PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="7 4 20 12 7 20"/></svg>';

// Иллюстрация онлайн-конференции вместо фото: окно созвона с параллельными залами,
// слайдом, спикером, ведущим и слушателями. Рисуется кодом, декоративная (скрыта от скринридера).
// В data/events.json: illustration.rooms — подписи залов (первый активный), illustration.slide — тема на слайде
function callIllustration(il) {
  const rooms = (il.rooms || []).map((r, i) => `<span class="call-ui_room${i === 0 ? ' is-active' : ''}">${typo(r)}</span>`).join('');
  const listeners = Array.from({ length: 6 }, () => '<span class="call-ui_tile is-small"><span class="call-ui_face"></span></span>').join('');
  return `
              <div class="event-media_component is-call" aria-hidden="true">
                <div class="call-ui_component">
                  <div class="call-ui_bar"><span class="call-ui_rooms">${rooms}</span><span class="call-ui_live">Эфир</span></div>
                  <div class="call-ui_main">
                    <div class="call-ui_slide"><span class="call-ui_slide-title">${typo(il.slide)}</span><span class="call-ui_line"></span><span class="call-ui_line is-short"></span><span class="call-ui_line"></span></div>
                    <div class="call-ui_side">
                      <span class="call-ui_tile is-speaking"><span class="call-ui_face"></span><span class="call-ui_name">Спикер</span></span>
                      <span class="call-ui_tile"><span class="call-ui_face"></span><span class="call-ui_name">Ведущий</span></span>
                    </div>
                  </div>
                  <div class="call-ui_audience">${listeners}</div>
                </div>
              </div>`;
}

function media(e, { eager = false } = {}) {
  if (!e.image && e.illustration) return callIllustration(e.illustration);
  if (!e.image) return '';
  const img = e.image;
  const video = e.video || {};
  const videoAttrs = video.kinescope
    ? ` data-event-video data-kinescope="${escapeHtml(video.kinescope)}"`
    : video.youtube ? ` data-event-video data-youtube="${escapeHtml(video.youtube)}"` : '';
  const play = videoAttrs
    ? `\n              <button class="event-media_play" type="button" data-event-play aria-label="Смотреть видеоотчёт: ${escapeHtml(e.title)}"><span class="event-media_play-icon">${PLAY_ICON}</span>Смотреть, как это было</button>`
    : '';
  const loading = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  return `
            <div class="event-media_component"${videoAttrs} data-event-title="${escapeHtml(e.title)}">
              <img class="event-media_image" src="${escapeHtml(img.src)}" alt="Фото с мероприятия «${escapeHtml(e.title)}»" width="${img.w}" height="${img.h}" ${loading} decoding="async" style="--event-position: ${escapeHtml(img.position || '50% 50%')}">${play}
            </div>`;
}

// Цифры одной строкой серых плашек: «30+ выступлений», «2 дня»
function facts(list = []) {
  if (!list.length) return '';
  const items = list.map((f) => `<li class="event-facts_item">${typo(f)}</li>`).join('');
  return `\n                <ul class="event-facts_list" role="list" aria-label="Цифры">${items}</ul>`;
}

// «Выступали»: несколько имён и хвост из поля more («и ещё 15 спикеров», «и другие»)
function speakers(s) {
  if (!s || !s.names || !s.names.length) return '';
  const more = s.more ? ` ${typo(s.more)}` : '';
  const label = typo(s.label || 'Выступали');
  return `\n                <p class="event-card_people body-text_component is-fine-print"><span class="event-card_people-label">${label}:</span> ${s.names.map(typo).join(', ')}${more}</p>`;
}

// Слова участника: текст дословно из отзыва и подпись
function quote(q) {
  if (!q || !q.text) return '';
  return `\n                <figure class="event-card_quote"><blockquote class="body-text_component is-reading">«${typo(q.text)}»</blockquote><figcaption class="body-text_component is-fine-print">${typo(q.author)}</figcaption></figure>`;
}

// История: один-два абзаца из data/events.json (поле story — массив абзацев)
function story(list = []) {
  return list.map((p) => `\n                <p class="event-card_story body-text_component is-fine-print">${typo(p)}</p>`).join('');
}

function pastCard(e) {
  const meta = e.meta ? `\n                <p class="event-card_meta body-text_component is-fine-print">${typo(e.meta)}</p>` : '';
  const note = e.note ? `\n                <p class="event-card_note body-text_component is-fine-print">${typo(e.note)}</p>` : '';
  const link = e.link ? `\n                <a class="events-button_component" href="${escapeHtml(e.link.url)}">${typo(e.link.label)}</a>` : '';
  const variant = e.image || e.illustration ? '' : ' is-text';
  return `
              <!-- ${escapeHtml(e.title)} -->
              <article class="event-card_component${variant}" id="${escapeHtml(e.id)}" aria-labelledby="${escapeHtml(e.id)}-title">${media(e)}
              <div class="event-card_content">${meta}
                <h4 class="event-card_title content-heading_component is-prominent" id="${escapeHtml(e.id)}-title">${typo(e.title)}</h4>${story(e.story)}${quote(e.quote)}${note}${speakers(e.speakers)}${facts(e.facts)}${link}
              </div>
              </article>`;
}

// Склонение: 1 мероприятие, 2 мероприятия, 5 мероприятий
function eventsWord(n) {
  const d10 = n % 10, d100 = n % 100;
  if (d10 === 1 && d100 !== 11) return 'мероприятие';
  if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return 'мероприятия';
  return 'мероприятий';
}

// Год летописи: слева год (на компьютере прилипает при прокрутке), справа его мероприятия
function yearGroup(y) {
  const id = `year-${y.year}`;
  return `
          <section class="events-year_component" id="${id}" aria-labelledby="${id}-title">
            <div class="events-year_label">
              <h3 class="events-year_title" id="${id}-title">${y.year}</h3>
              <p class="events-year_count body-text_component is-fine-print">${y.events.length}&nbsp;${eventsWord(y.events.length)}</p>
            </div>
            <div class="events-year_list">${y.events.map(pastCard).join('')}
            </div>
          </section>`;
}

function upcomingCard(e) {
  return `
        <article class="event-next_component" id="${escapeHtml(e.id)}" aria-labelledby="${escapeHtml(e.id)}-title" data-until="${escapeHtml(e.until)}">
          <div class="event-next_content">
            <p class="event-next_meta body-text_component is-caption">${typo(e.meta)}</p>
            <h3 class="event-next_title content-heading_component is-prominent" id="${escapeHtml(e.id)}-title">${typo(e.title)}</h3>
            <p class="event-next_subtitle body-text_component is-summary">${typo(e.subtitle)}</p>
            <p class="event-next_text body-text_component is-fine-print">${typo(e.text)}</p>
            <a class="events-button_component is-light" href="${escapeHtml(e.link.url)}">${typo(e.link.label)}</a>
            <p class="event-next_note body-text_component is-fine-print">${typo(e.note)}</p>
          </div>${media(e, { eager: true }).replace('event-media_component', 'event-media_component is-next')}
        </article>`;
}

// Оглавление: ближайшее мероприятие и годы летописи
function indexItems(upcoming, years) {
  const next = upcoming.map((e) => `<li><a class="events-index_link is-next" href="#${escapeHtml(e.id)}">${typo(e.short || e.title)}</a></li>`);
  const ys = years.map((y) => `<li><a class="events-index_link" href="#year-${y.year}">${y.year}</a></li>`);
  return [...next, ...ys].join('');
}

// Ближайшее мероприятие в микроразметке: только то, что есть на странице
function jsonLd(upcoming) {
  const graph = upcoming.map((e) => ({
    '@type': 'Event',
    name: e.title,
    description: `${e.subtitle}. ${e.text}`,
    startDate: e.date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: { '@type': 'VirtualLocation', url: e.link.url },
    image: e.image ? [e.image.src] : undefined,
    url: e.link.url,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB', availability: 'https://schema.org/InStock', url: e.link.url },
    organizer: { '@type': 'EducationalOrganization', name: 'Академия Современной Психологии', url: 'https://modern-psy.ru/' },
  }));
  if (!graph.length) return '';
  return `<script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)}\n</script>`;
}

// ---------- Шапка и типографика Web Academy ----------
async function loadHeader() {
  if (HEADER_PARTS.every((f) => existsSync(join(HEADER_DIR, f)))) {
    const parts = await Promise.all(HEADER_PARTS.map((f) => readFile(join(HEADER_DIR, f), 'utf8')));
    const html = parts.join('\n');
    await writeFile(HEADER_COPY, html);
    return html;
  }
  if (existsSync(HEADER_COPY)) return readFile(HEADER_COPY, 'utf8');
  console.warn('шапки нет — страница соберётся без неё');
  return '';
}

// Те же текстовые роли, что на главной (glavnaya/build.mjs, buildType)
async function buildType() {
  const body = join(WA_SHARED, 'body-text.css');
  const headings = join(WA_SHARED, 'section-heading.css');
  if (!existsSync(body) || !existsSync(headings)) { console.warn('web-academy не найдена — type.css не обновлён'); return; }
  const h = await readFile(headings, 'utf8');
  const start = h.indexOf('.section-title_component {');
  const end = h.indexOf('.content-header_component {');
  const css = '/* Сгенерировано events/build.mjs из Web Academy (body-text.css и section-heading.css). Здесь не править. */\n'
    + await readFile(body, 'utf8') + '\n' + h.slice(start, end);
  await writeFile(join(here, 'type.css'), css);
}

// ---------- Сборка ----------
const data = JSON.parse(await readFile(join(here, 'data', 'events.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const upcoming = data.upcoming.filter((e) => !e.until || e.until > today);
const years = data.years.filter((y) => y.events.length);
const pastCount = years.reduce((n, y) => n + y.events.length, 0);

await buildType();
const template = await readFile(join(here, 'template.html'), 'utf8');
const values = {
  HEADER: await loadHeader(),
  INDEX: indexItems(upcoming, years),
  UPCOMING: upcoming.map(upcomingCard).join(''),
  UPCOMING_HIDDEN: upcoming.length ? '' : ' hidden',
  PAST: years.map(yearGroup).join(''),
  JSON_LD: jsonLd(upcoming),
};
const html = template.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in values ? values[key] : m));
await writeFile(join(here, 'index.html'), html);
console.log(`events/index.html собран: ближайших ${upcoming.length}, прошедших ${pastCount} за ${years.length} лет`);
