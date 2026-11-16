// Берёт страницы из экспорта Тильды и кладёт их в tilda-export/<адрес>/index.html — временно,
// пока страница не переверстана на v1. После сборки scripts/copy-legacy.mjs отдаёт их по тем же адресам,
// что и на modern-psy.ru. Как только у адреса появляется своя страница в src/pages, экспорт больше
// не копируется — его можно удалить отсюда.
//
// Что меняем в странице Тильды:
//   • картинки ведут на оригиналы в CDN Тильды (static.tildacdn.com): в git полгигабайта картинок не кладём;
//     когда картинки переедут в Strapi, ссылки поменяются здесь же;
//   • стили и скрипты Тильды копируются в tilda-export/_tilda/ (они общие для страниц);
//   • ссылки https://modern-psy.ru/… становятся относительными, чтобы клики оставались на зеркале;
//   • вырезаем Метрику, Calltouch, пиксели VK и Mail, amoCRM, статистику Тильды и чат Jivo —
//     превью портит статистику, а чат дёргает настоящих операторов;
//   • формы Тильды не отправляют заявки: вместо отправки пишут, что это тестовая копия;
//   • добавляем noindex.
//
// Запуск из корня превью:
//   node scripts/import-tilda-export.mjs <папка распакованного экспорта> <адрес> [<адрес> …]
//   node scripts/import-tilda-export.mjs ~/Downloads/modernpsyacademy rpp womens-care
//   CASE_DIR=<папка со снимком страниц> node scripts/import-tilda-export.mjs …   (если сайт уже поменялся)
import fs from 'node:fs';
import path from 'node:path';

const [exportDir, ...aliases] = process.argv.slice(2);
if (!exportDir || !aliases.length) {
  console.error('Нужно: node scripts/import-tilda-export.mjs <папка экспорта> <адрес> …');
  process.exit(1);
}
const ROOT = process.cwd();
const OUT = path.join(ROOT, 'tilda-export');
const SHARED = path.join(OUT, '_tilda');

// Адрес → файл страницы, из htaccess экспорта
const htaccess = fs.readFileSync(path.join(exportDir, 'htaccess'), 'utf8');
const pageFor = new Map();
for (const m of htaccess.matchAll(/^RewriteRule \^(.+?)\$ (page\d+\.html) \[NC\]/gm)) pageFor.set(m[1], m[2]);
if (fs.readFileSync(path.join(exportDir, 'htaccess'), 'utf8').match(/DirectoryIndex (page\d+\.html)/)) {
  pageFor.set('', htaccess.match(/DirectoryIndex (page\d+\.html)/)[1]);
}

const cdn = (file) => {
  // tild3765-…-333239313735__-__resize__504x__name.webp → оригинал tild3765-…/name.webp
  const m = file.match(/^(til[a-z][0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})__(.+)$/);
  if (!m) return null;
  const name = m[2].includes('__-__') || m[2].startsWith('-__') ? m[2].split('__').pop() : m[2];
  return `https://static.tildacdn.com/${m[1]}/${name}`;
};

const STUB = `<script>
// Зеркало: формы Тильды здесь не отправляют заявки (tilda-export, scripts/import-tilda-export.mjs)
document.addEventListener('submit', function (event) {
  var form = event.target;
  if (!form || !form.closest || !form.closest('.t-form, .js-form-proccess, form')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  var note = form.querySelector('[data-mirror-note]');
  if (!note) {
    note = document.createElement('p');
    note.setAttribute('data-mirror-note', '');
    note.style.cssText = 'margin:12px 0 0;font:inherit;color:inherit;opacity:.8';
    form.appendChild(note);
  }
  note.textContent = 'Это тестовая копия сайта: заявка никуда не отправлена.';
}, true);
</script>`;

// Экспорт Тильды переводит имена картинок в нижний регистр (vector.svg), а в CDN они лежат
// с исходным регистром (Vector.svg) — по нижнему регистру CDN отвечает 404. Поэтому берём
// живую страницу modern-psy.ru и сверяем имена по ней.
// Дополнительно можно передать папку со снимком страниц сайта (CASE_DIR=…): если живая страница
// уже поменялась после экспорта, имена берутся из снимка.
const globalCases = new Map();
if (process.env.CASE_DIR) {
  for (const f of fs.readdirSync(process.env.CASE_DIR)) {
    if (!f.endsWith('.html')) continue;
    const html = fs.readFileSync(path.join(process.env.CASE_DIR, f), 'utf8');
    for (const m of html.matchAll(/https:\/\/static\.tildacdn\.com\/(til[a-z][0-9a-f-]{32})\/([^"'\s)<>?]+)/g)) {
      globalCases.set(`${m[1]}/${m[2].toLowerCase()}`, `${m[1]}/${m[2]}`);
    }
  }
}

async function caseMap(alias) {
  const url = `https://modern-psy.ru/${/^page\d+$/.test(alias) ? alias + '.html' : alias === 'mainpage' ? '' : alias}`;
  const map = new Map(globalCases);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 mirror-import' }, signal: AbortSignal.timeout(30000) });
    const html = await res.text();
    for (const m of html.matchAll(/https:\/\/static\.tildacdn\.com\/(til[a-z][0-9a-f-]{32})\/([^"'\s)<>?]+)/g)) {
      map.set(`${m[1]}/${m[2].toLowerCase()}`, `${m[1]}/${m[2]}`);
    }
  } catch (error) {
    console.warn(`⚠️  /${alias}: не открылась живая страница (${error.message}), имена картинок оставляю как в экспорте`);
  }
  return map;
}

let missing = 0;
for (const alias of aliases) {
  // Страница без своего адреса в Тильде открывается как /page123456.html — файл называется так же
  const file = pageFor.get(alias) || (/^page\d+$/.test(alias) && fs.existsSync(path.join(exportDir, `${alias}.html`)) ? `${alias}.html` : null);
  if (!file) { console.error(`/${alias}: такого адреса нет в экспорте`); process.exitCode = 1; continue; }
  let html = fs.readFileSync(path.join(exportDir, file), 'utf8');
  const cases = await caseMap(alias);
  await new Promise((r) => setTimeout(r, 300));

  // Картинки → CDN Тильды
  html = html.replace(/(["'(])images\/([^"')\s]+)/g, (all, q, f) => {
    let url = cdn(f);
    if (!url) { missing++; return all; }
    const key = url.slice('https://static.tildacdn.com/'.length);
    if (cases.has(key.toLowerCase())) url = 'https://static.tildacdn.com/' + cases.get(key.toLowerCase());
    return q + url;
  });
  // Прямые ссылки на CDN в коде страницы — тоже по живой странице
  html = html.replace(/https:\/\/static\.tildacdn\.com\/(til[a-z][0-9a-f-]{32})\/([^"'\s)<>?]+)/g, (all, id, name) => {
    const fixed = cases.get(`${id}/${name.toLowerCase()}`);
    return fixed ? `https://static.tildacdn.com/${fixed}` : all;
  });
  // Стили и скрипты Тильды → общая папка /_tilda/
  html = html.replace(/(["'])(css|js)\/([^"']+)/g, (all, q, kind, f) => {
    const clean = f.split('?')[0];
    const src = path.join(exportDir, kind, clean);
    if (!fs.existsSync(src)) return all;
    fs.mkdirSync(path.join(SHARED, kind), { recursive: true });
    fs.copyFileSync(src, path.join(SHARED, kind, clean));
    return `${q}/_tilda/${kind}/${f}`;
  });
  // Ссылки на боевой сайт → относительные
  html = html.replace(/https?:\/\/(www\.)?modern-psy\.ru(?=[/"'?#])/g, '');
  // Счётчики и трекеры
  html = html
    .replace(/<!-- Yandex\.Metrika[\s\S]*?<!-- \/Yandex\.Metrika[^>]*-->/gi, '')
    .replace(/<script[^>]*>(?:(?!<\/script>)[\s\S])*?(mc\.yandex\.ru|ym\(\d+|calltouch|top-fwz1\.mail\.ru|vk\.com\/js\/api\/openapi|VK\.Retargeting|gso\.amocrm\.ru|amo_social_button|tildastat|tilda-stat)(?:(?!<\/script>)[\s\S])*?<\/script>/gi, '')
    .replace(/<script[^>]+src="[^"]*(tilda-stat|calltouch|amocrm|mc\.yandex|code\.jivo\.ru)[^"]*"[^>]*><\/script>/gi, '')
    .replace(/<noscript>(?:(?!<\/noscript>)[\s\S])*?(mc\.yandex\.ru|top-fwz1\.mail\.ru|vk\.com\/rtrg)(?:(?!<\/noscript>)[\s\S])*?<\/noscript>/gi, '');
  // noindex и заглушка форм
  html = html.replace(/<meta name="robots"[^>]*>/gi, '');
  html = html.replace(/<head>/i, '<head>\n<meta name="robots" content="noindex,nofollow" />\n<!-- Временная страница из экспорта Тильды (scripts/import-tilda-export.mjs). Переверстать на v1 и удалить. -->');
  html = html.replace(/<\/body>/i, `${STUB}\n</body>`);

  const dir = path.join(OUT, alias || 'index');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`/${alias}: ${file} → tilda-export/${alias}/index.html`);
}
if (missing) console.warn(`⚠️  картинок без адреса в CDN: ${missing}`);
