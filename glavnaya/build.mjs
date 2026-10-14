// Сборка главной: node glavnaya/build.mjs (запускать из apps/preview)
//
// Что делает:
//   1. Берёт каталог из API (/api/public/catalog). Если API не ответил —
//      последний снимок data/catalog-snapshot.json.
//   2. Рендерит флагманы, «Последний шанс» и счётчики теми же функциями,
//      что работают в браузере (page.js), и вшивает их в index.html.
//   3. Вставляет шапку сайта из apps/tilda/header (если папка рядом есть)
//      и иконки Lucide из apps/preview/icons/lucide.
//
// Руками index.html не править: он перезаписывается. Тексты — в template.html.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const API = 'https://modern-psy-asp-prod-8ceb.twc1.net';
const SNAPSHOT = join(here, 'data', 'catalog-snapshot.json');
const HEADER = join(here, '..', '..', 'tilda', 'header', 'tilda', 'header.html');
const HEADER_COPY = join(here, 'data', 'header.html'); // копия на случай, если apps/tilda рядом нет
const ICONS = join(here, '..', 'icons', 'lucide');
// Мероприятия и мини-курсы ведутся вручную в данных каталога (apps/tilda/catalog/data/catalog-extra.json).
// Сборка копирует их сюда, чтобы главная собиралась и без папки apps/tilda.
const EXTRA_SOURCE = join(here, '..', '..', 'tilda', 'catalog', 'data', 'catalog-extra.json');
const EXTRA_COPY = join(here, 'data', 'catalog-extra.json');

// Картинки мероприятий, которых нет в CMS (у вебинаров из CMS картинка берётся из обложки).
// Ключ — адрес страницы мероприятия, position — какую часть картинки показывать.
const EVENT_IMAGES = {
  'https://modern-psy.ru/biznes-igra': { cover: 'https://optim.tildacdn.com/tild3438-3835-4130-b764-646461646562/-/resize/720x/-/format/webp/telegram-cloud-docum.png.webp', position: '50% 18%' },
  'https://modern-psy.ru/student-conference': { cover: 'https://optim.tildacdn.com/tild3134-3039-4139-b835-633135396361/-/format/webp/vystuplenie-eksperta.webp', position: '62% 40%' },
};

// Бегущие ряды курсов в двери для практиков: три ряда, подпись → слаг курса в CMS.
// Подписи — краткие названия наших курсов (полные названия в CMS длинные).
// Курса нет в каталоге — плашка не выводится (в сборке будет предупреждение).
const TICKER_ROWS = [
  [
    ['КПТ: модель Бека', 'kpt'],
    ['КПТ: Оксфордская модель', 'cbt-oxford'],
    ['ACT', 'act'],
    ['CFT', 'cft'],
    ['IFS', 'ifs'],
    ['EMDR', 'obuchenie-emdr-dpdg-terapii'],
    ['FAP', 'fap'],
    ['RFT', 'rft'],
    ['РО ДБТ', 'rodbt-live'],
    ['ОРКТ', 'orkt'],
  ],
  [
    ['Схема-терапия', 'schema-therapy'],
    ['Нарративная терапия', 'narrative-therapy'],
    ['Клиент-центрированная терапия', 'client-centered-therapy'],
    ['Односессионная терапия', 'oct'],
    ['Терапия пар', 'couples-therapy'],
    ['Терапия травмы', 'course-marketing-data'],
    ['Терапия зависимостей', 'addiction-therapy'],
    ['Расстройства личности', 'course-rl'],
    ['Сексология', 'sexology'],
  ],
  [
    ['РПП', 'rpp'],
    ['Детская психология', 'child-psy'],
    ['СДВГ у взрослых', 'adult-adhd-therapy'],
    ['РАС', 'autistic-disorders'],
    ['БАР', 'bar'],
    ['Суицидальный риск', 's-risk'],
    ['Военная травма и ПТСР', 'battle-trauma-ptsd'],
    ['Спортивная психология', 'sportivnaya-psihologiya'],
    ['Клиническая психология', 'clinical_psychology'],
    ['Навыки консультирования', 'navyki-konsultirovaniya-dlya-psihologov'],
  ],
];

const DOOR_START_SLUG = 'psyeducation';     // куда ведёт «Программа курса», откуда дата и цена
const FREE_START_SLUG = 'put-v-professiyu'; // бесплатный мини-курс для тех, кто начинает с нуля

const ICON_FILES = {
  ICON_DOCUMENT: 'file-badge',
  ICON_PRACTICE: 'users-round',
  ICON_TEACHERS: 'user-round-check',
  ICON_SUPERVISION: 'messages-square',
  ICON_PREV: 'chevron-left',
  ICON_NEXT: 'chevron-right',
};

async function loadCatalog() {
  try {
    const res = await fetch(`${API}/api/public/catalog`, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.cards?.length) throw new Error('пустой каталог');
    await mkdir(dirname(SNAPSHOT), { recursive: true });
    await writeFile(SNAPSHOT, JSON.stringify(data, null, 2) + '\n');
    console.log(`каталог из API: ${data.cards.length} карточек`);
    return data;
  } catch (err) {
    console.warn(`API не ответил (${err.message}), беру снимок ${SNAPSHOT}`);
    return JSON.parse(await readFile(SNAPSHOT, 'utf8'));
  }
}

async function loadHeader() {
  if (existsSync(HEADER)) {
    const html = await readFile(HEADER, 'utf8');
    await mkdir(dirname(HEADER_COPY), { recursive: true });
    await writeFile(HEADER_COPY, html);
    return html;
  }
  if (existsSync(HEADER_COPY)) return readFile(HEADER_COPY, 'utf8');
  console.warn('шапки нет — страница соберётся без неё');
  return '';
}

// Типографика — общие текстовые роли Web Academy, как в расписании (timetable-variants/build-type.mjs):
// подписи, текст, заголовки секций и карточек. Править их в web-academy/shared/academy, потом пересобрать.
// Если папки web-academy рядом нет — остаётся прежний type.css.
const WA_SHARED = join(here, '..', 'web-academy', 'shared', 'academy');
async function buildType() {
  const body = join(WA_SHARED, 'body-text.css');
  const headings = join(WA_SHARED, 'section-heading.css');
  if (!existsSync(body) || !existsSync(headings)) { console.warn('web-academy не найдена — type.css не обновлён'); return; }
  const h = await readFile(headings, 'utf8');
  const start = h.indexOf('.section-title_component {');
  const end = h.indexOf('.content-header_component {');
  const css = '/* Сгенерировано glavnaya/build.mjs из Web Academy (body-text.css и section-heading.css). Здесь не править. */\n'
    + await readFile(body, 'utf8') + '\n' + h.slice(start, end);
  await writeFile(join(here, 'type.css'), css);
}

async function loadExtra() {
  if (existsSync(EXTRA_SOURCE)) {
    const text = await readFile(EXTRA_SOURCE, 'utf8');
    await mkdir(dirname(EXTRA_COPY), { recursive: true });
    await writeFile(EXTRA_COPY, text);
    return JSON.parse(text);
  }
  if (existsSync(EXTRA_COPY)) return JSON.parse(await readFile(EXTRA_COPY, 'utf8'));
  console.warn('нет данных мероприятий — блок «Учиться бесплатно» покажет только мини-курсы');
  return { events: [], miniCourses: {} };
}

async function icon(name) {
  const svg = await readFile(join(ICONS, `${name}.svg`), 'utf8');
  return svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\sclass="[^"]*"/, '')
    .replace(/\s(width|height)="24"/g, '')
    .replace(/\s+/g, ' ')
    .replace('<svg ', '<svg aria-hidden="true" focusable="false" ')
    .trim();
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

const NBSP = ' ';

// Узор карточки RO DBT — «Выход из круга», как на обложке курса в каталоге:
// ряды разомкнутых колец, у каждого точка вышла через разрыв; одна точка залита целиком.
// Здесь только геометрия, цвет и прозрачность задаёт page.css (раздел 8, RO DBT)
function rodbtPattern() {
  const F = (n) => String(+n.toFixed(2));
  const pol = (R, a) => [R * Math.cos((a * Math.PI) / 180), R * Math.sin((a * Math.PI) / 180)];
  const arc = (R, a0, a1, dx, dy) => {
    const s = pol(R, a0);
    const e = pol(R, a1);
    return `M${F(s[0] + dx)},${F(s[1] + dy)} A${R},${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${F(e[0] + dx)},${F(e[1] + dy)}`;
  };
  // ряды через один сдвинуты, чтобы кольца шли в шахматном порядке
  const rows = [[36, -20], [112, 34], [188, -20], [264, 34], [340, -20], [416, 34]];
  const exit = pol(42, -45); // куда вышла точка: через разрыв кольца, вправо вверх
  let rings = '';
  const dots = [];
  for (const [y, off] of rows) {
    for (let x = off; x < 380; x += 108) {
      rings += `<path d="${arc(30, -20, 290, x, y)}"/>`;
      dots.push([x + exit[0], y + exit[1]]);
    }
  }
  // залитая точка — ближайшая к правому верхнему углу, между бейджем и белой плашкой
  const near = (p) => Math.hypot(p[0] - 230, p[1] - 70);
  const accent = dots.reduce((a, b) => (near(b) < near(a) ? b : a));
  return `<svg class="rodbt-card_pattern" viewBox="0 0 320 400" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">`
    + `<g class="rodbt-card_tone"><g class="rodbt-card_rings">${rings}</g>`
    + dots.map(([cx, cy]) => `<circle cx="${F(cx)}" cy="${F(cy)}" r="5"/>`).join('')
    + `</g><circle cx="${F(accent[0])}" cy="${F(accent[1])}" r="8"/></svg>`;
}

// Блок «Нам доверяют» (секция 9): оценки площадок, лента отзывов и бегущие ленты партнёров.
// Данные — data/trust.json; здесь только разметка. Поведение (листание, видео, окно с отзывом) — в page.js
const TRUST_ICONS = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><polygon points="7 4 20 12 7 20"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18M6 6l12 12"/></svg>',
};
function trustModel(data, H) {
  const t = (s) => H.esc(H.typo(s)).replace(/ /g, '&nbsp;');
  const nums = data.platforms.map((p) => parseInt(p.count, 10) || 0);
  const total = nums.reduce((a, b) => a + b, 0);
  const howMany = ['', 'одной', 'двух', 'трёх', 'четырёх', 'пяти', 'шести'][data.platforms.length] || String(data.platforms.length);
  const word = H.plural(total, 'отзыв', 'отзыва', 'отзывов').replace(/^\d+ /, '');

  const scores = '<li><div class="trust-score_tile is-summary">'
    + `<span class="trust-score_value">${total}</span>`
    + `<span class="trust-score_count body-text_component is-caption">${word} студентов на&nbsp;${howMany} независимых площадках</span></div></li>`
    + data.platforms.map((p) => '<li><a class="trust-score_tile" href="' + H.esc(p.url) + '" target="_blank" rel="noopener">'
      + `<span class="trust-score_value">${t(p.score)}</span>`
      + `<span class="trust-score_count body-text_component is-caption">${t(p.count)}${p.extra ? ' · ' + t(p.extra) : ''}</span>`
      + `<img class="trust-score_logo" src="${H.esc(p.logo)}" alt="${H.esc(p.name)}" width="${p.width}" height="${p.height}" loading="lazy" decoding="async">`
      + '<span class="visually-hidden">: читать отзывы на площадке</span></a></li>').join('');

  const person = (r) => '<div class="trust-person_component">'
    + `<img class="trust-person_photo" src="${H.esc(r.image)}" alt="" width="96" height="96" style="object-position:${r.face || r.position || '50% 25%'}" loading="lazy" decoding="async">`
    + `<div><p class="trust-person_name">${t(r.name)}</p><p class="trust-person_course">${t(r.course)}</p></div></div>`;
  const video = (r) => '<li class="trust-reviews_item is-video">'
    + `<div class="trust-video_component"${r.video ? ` data-trust-video="${H.esc(r.video)}"` : ''}${r.kinescope ? ` data-trust-kin="${H.esc(r.kinescope)}"` : ''} data-trust-title="Видеоотзыв: ${H.esc(r.name)}">`
    + `<img class="trust-video_poster" src="${H.esc(r.image)}" alt="" width="480" height="600" style="object-position:${r.position || '50% 25%'}" loading="lazy" decoding="async">`
    + `<button class="trust-video_play" type="button" aria-label="Смотреть видеоотзыв: ${H.esc(r.name)}"><span class="trust-video_play-icon">${TRUST_ICONS.play}</span></button></div>`
    + `<p class="trust-video_caption">«${t(r.quote)}»<span>${t(r.name)} · ${t(r.course)}</span></p></li>`;
  const quote = (r) => '<article class="trust-quote_card">'
    + `<p class="trust-quote_text">«${t(r.quote)}»</p>`
    + (r.text ? `<p class="trust-quote_more body-text_component is-fine-print">${t(r.text)}</p>` : '')
    + person(r)
    + (r.paragraphs ? `<button class="trust-quote_open body-text_component is-caption" type="button" data-trust-open="trust-full-${r.id}">Читать отзыв целиком</button>` : '')
    + '</article>';
  // Видео — отдельная колонка; текстовые отзывы, идущие подряд, складываются по два в колонку
  let reviews = '';
  const rs = data.reviews;
  for (let i = 0; i < rs.length; i++) {
    if (rs[i].type === 'video') { reviews += video(rs[i]); continue; }
    const pair = [rs[i]];
    if (rs[i + 1] && rs[i + 1].type === 'text') pair.push(rs[++i]);
    reviews += '<li class="trust-reviews_item is-quotes">' + pair.map(quote).join('') + '</li>';
  }
  const dialogs = rs.filter((r) => r.paragraphs).map((r) => `<dialog class="trust-dialog_component" id="trust-full-${r.id}" aria-labelledby="trust-full-${r.id}-name">`
    + `<button class="trust-dialog_close" type="button" aria-label="Закрыть" data-trust-close>${TRUST_ICONS.close}</button>`
    + '<div class="trust-dialog_head">'
    + `<img class="trust-person_photo is-large" src="${H.esc(r.image)}" alt="" width="128" height="128" style="object-position:${r.face || '50% 25%'}" loading="lazy" decoding="async">`
    + `<div><p class="trust-dialog_name content-heading_component is-card" id="trust-full-${r.id}-name">${t(r.name)}</p><p class="trust-person_course">Курс «${t(r.course)}»</p></div></div>`
    + '<div class="trust-dialog_text body-text_component">' + r.paragraphs.map((x) => `<p>${t(x)}</p>`).join('') + '</div></dialog>').join('');

  // Логотипы одинаковой «площади»: длинные ниже, квадратные выше. boost — поправка для логотипов с мелкой надписью
  const logo = (p, hidden) => {
    if (!p.logo) return `<span class="trust-partner_name">${t(p.name)}</span>`;
    const h = (2.6 * (p.boost || 1)) / Math.sqrt(p.width / p.height);
    return `<img class="trust-partner_logo" src="${H.esc(p.logo)}" alt="${hidden ? '' : H.esc(p.name)}" width="${p.width}" height="${p.height}" style="--logo-h:${h.toFixed(2)}rem" loading="lazy" decoding="async">`;
  };
  const half = Math.ceil(data.partners.length / 2);
  const rows = [data.partners.slice(0, half), data.partners.slice(half)];
  // Каждая лента — список партнёров и три копии для бесконечной прокрутки (копии скрыты от скринридера)
  const partners = rows.map((row, k) => {
    const items = row.map((p) => `<li class="trust-marquee_item">${logo(p)}</li>`).join('');
    const copy = row.map((p) => `<li class="trust-marquee_item" aria-hidden="true">${logo(p, true)}</li>`).join('');
    return `<div class="trust-marquee_row${k ? ' is-reverse' : ''}"><ul class="trust-marquee_list" role="list">${items}${copy}${copy}${copy}</ul></div>`;
  }).join('');

  return { scores, reviews, dialogs, partners };
}

async function main() {
  const data = await loadCatalog();
  const cards = data.cards;
  const bySlug = Object.fromEntries(cards.map((c) => [c.slug, c]));

  // Те же функции рендера, что в браузере
  const sandbox = { Intl, console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(await readFile(join(here, 'page.js'), 'utf8'), sandbox);
  const H = sandbox.HomePage;
  const today = H.todayMoscow();
  const n = H.counts(cards);

  // Каждый ряд — два одинаковых набора подряд: лента сдвигается на половину и бесшовно повторяется.
  // Второй набор скрыт от скринридера и клавиатуры.
  const ticker = TICKER_ROWS.map((row) => {
    const items = row.filter(([label, slug]) => {
      if (!bySlug[slug]) console.warn(`бегущая строка: «${label}» (${slug}) нет в каталоге — не выводим`);
      return Boolean(bySlug[slug]);
    });
    const li = (hidden) => items.map(([label, slug]) =>
      `<li class="door-ticker_item"${hidden ? ' aria-hidden="true"' : ''}><a class="door-ticker_link" href="${esc(bySlug[slug].url)}"${hidden ? ' tabindex="-1"' : ''}>${esc(label)}</a></li>`
    ).join('');
    return `<div class="door-ticker_row"><ul class="door-ticker_track">${li(false)}${li(true)}</ul></div>`;
  }).join('\n                  ');

  const start = bySlug[DOOR_START_SLUG];
  const startDate = start?.startDate
    ? (() => {
        const [, m, d] = start.startDate.split('-').map(Number);
        const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        return `${d}${NBSP}${months[m - 1]}`;
      })()
    : 'скоро';

  // Под ценой: рассрочка, дата старта и диплом. Нет цены в месяц — остаются дата и диплом
  const startTerms = `${start?.price?.monthly ? `в${NBSP}рассрочку на${NBSP}24${NBSP}мес${NBSP}· ` : ''}старт${NBSP}${startDate}${NBSP}· диплом`;
  const startPrice = start?.price?.monthly
    ? `${start.price.from ? 'от' + NBSP : ''}${new Intl.NumberFormat('ru-RU').format(start.price.monthly).replace(/\s/g, ' ')}${NBSP}₽/мес <span class="home-door_price-terms body-text_component is-fine-print">${startTerms}</span>`
    : `<span class="home-door_price-terms body-text_component is-fine-print">${startTerms}</span>`;

  const lastChance = H.renderLastChance(cards);

  // Учиться бесплатно
  const extraSource = await loadExtra();
  const homeExtra = {
    events: (extraSource.events || []).map((e) => {
      const img = EVENT_IMAGES[e.url];
      return { date: e.date, time: e.time, title: e.title, kind: e.kind, url: e.url, note: e.note,
        cover: e.cover || img?.cover || '', position: img?.position || '' };
    }),
    miniCourses: Object.fromEntries(Object.entries(extraSource.miniCourses || {}).map(([k, v]) => [k, { lessons: v.lessons, grant: v.grant }])),
    // Вебинары из снимка каталога: чтобы браузер мог убрать прошедшие, не дожидаясь API
    snapshotCards: cards.filter((c) => c.price?.free && c.startDate)
      .map((c) => ({ slug: c.slug, title: c.title, url: c.url, startDate: c.startDate, cover: c.cover, price: { free: true } })),
  };
  const events = H.upcomingEvents(cards, homeExtra, today, 4);
  for (const e of events) if (!e.cover) console.warn(`у мероприятия «${e.title}» нет картинки`);

  // Преподаватели: data/teachers.json → модель для блока (подходы с номерами людей и адресом курса)
  const teachersSource = JSON.parse(await readFile(join(here, 'data', 'teachers.json'), 'utf8'));
  const trust = trustModel(JSON.parse(await readFile(join(here, 'data', 'trust.json'), 'utf8')), H);
  const teachersModel = {
    teachers: teachersSource.teachers.map(({ name, role, bio, photo }) => ({ name, role, bio, photo })),
    approaches: teachersSource.approaches.map((a) => {
      const course = a.course ? bySlug[a.course] : null;
      if (a.course && !course) console.warn(`преподаватели: курса ${a.course} для подхода «${a.name}» нет в каталоге — без ссылки`);
      const people = teachersSource.teachers.map((t, i) => (t.approaches.includes(a.name) ? i : -1)).filter((i) => i >= 0);
      return { name: a.name, url: course?.url || '', courseTitle: course?.title || '', people };
    }).filter((a) => a.people.length),
  };
  for (const t of teachersSource.teachers) for (const a of t.approaches)
    if (!teachersSource.approaches.some((x) => x.name === a)) console.warn(`преподаватели: у «${t.name}» подход «${a}», которого нет в списке approaches — не покажется`);
  // Открыт подход, у которого больше всего преподавателей
  const teachersActive = teachersModel.approaches.reduce((best, a, i, all) => (a.people.length > all[best].people.length ? i : best), 0);

  // Грант для двери «с нуля»: сумма из catalog-extra.json (бесплатный мини-курс «Путь в профессию»)
  const freeInfo = homeExtra.miniCourses[FREE_START_SLUG] || {};
  const freeGrant = freeInfo.grant || 0;
  const rubTight = (sum) => new Intl.NumberFormat('ru-RU').format(sum).replace(/\s/g, '\u202f') + NBSP + '₽';

  const values = {
    API,
    HEADER: await loadHeader(),
    TICKER: ticker,
    START_URL: start?.url || 'https://modern-psy.ru/psyeducation',
    START_DATE: startDate,
    START_PRICE: startPrice,
    FREE_URL: bySlug[FREE_START_SLUG]?.url?.split('?')[0] || 'https://modern-psy.ru/put-v-professiyu',
    // Стикер гранта рядом с ценой: сумма из данных каталога. Гранта нет — стикера нет
    // Дверь «с нуля»: грант на обучение прямо в тексте (решение Дарьи 12.10.2026)
    START_OFFER: freeGrant
      ? 'Дарим <b class="home-door_grant">грант ' + rubTight(freeGrant) + '</b> на' + NBSP + 'обучение профессии психолога-консультанта с' + NBSP + 'нуля'
      : 'Профессия психолога-консультанта с' + NBSP + 'нуля',
    TEACHERS_TABS: H.teacherTabs(teachersModel, teachersActive),
    TEACHERS_PANEL: H.teacherPanel(teachersModel, teachersActive),
    TEACHERS_ACTIVE: String(teachersActive),
    TEACHERS_DATA: JSON.stringify(teachersModel).replace(/<\//g, '<\\/'),
    FLAGSHIPS: H.renderFlagships(cards, today),
    LAST_CHANCE: lastChance,
    LAST_CHANCE_HIDDEN: lastChance ? '' : ' hidden',
    COUNT_METHODS: n.methods,
    COUNT_SPECIALIZATIONS: n.specializations,
    COUNT_PROFESSIONS: n.professions,
    COUNT_FREE: n.free,
    COUNT_TOTAL: String(n.total),
    EVENT_PANEL: events.length ? H.eventPanel(events[0], today) : '',
    EVENT_TABS: H.eventTabs(events, today, 0),
    EVENTS_HIDDEN: events.length ? '' : ' hidden',
    MINI_COURSES: H.miniCourses(cards, homeExtra),
    RODBT_PATTERN: rodbtPattern(),
    // Форма подбора: ответ на «Стать психологом с нуля» говорит про грант, если он есть в данных каталога
    PICK_ZERO_REPLY: freeGrant
      ? 'Расскажем о профессии психолога-консультанта и гранте ' + rubTight(freeGrant) + ' на обучение'
      : 'Расскажем о профессии психолога-консультанта и о том, как начать с нуля',
    TRUST_SCORES: trust.scores,
    TRUST_REVIEWS: trust.reviews,
    TRUST_DIALOGS: trust.dialogs,
    TRUST_PARTNERS: trust.partners,
    // JSON внутри <script>: «</» экранируем, чтобы строка не закрыла тег раньше времени
    HOME_EXTRA: JSON.stringify(homeExtra).replace(/<\//g, '<\\/'),
  };
  for (const [key, file] of Object.entries(ICON_FILES)) values[key] = await icon(file);

  await buildType();
  let html = await readFile(join(here, 'template.html'), 'utf8');
  html = html.replace(/\{\{([A-Z_]+)\}\}/g, (m, key) => {
    if (!(key in values)) throw new Error(`в шаблоне неизвестное место ${m}`);
    return values[key];
  });
  await writeFile(join(here, 'index.html'), html);
  console.log(`index.html собран: ${Math.round(html.length / 1024)} КБ, флагманов ${H.renderFlagships(cards, today).split('flagships_item').length - 1}, последний шанс ${lastChance.split('last-chance_item').length - 1}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
