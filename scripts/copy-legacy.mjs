// Шаг сборки после `astro build`: кладёт в dist всё, что ещё не переехало на Astro,
// по карте зеркала src/data/mirror.json.
//
// Порядок (кто главнее — тот позже и не перезаписывается):
//   1. Страницы Astro (src/pages) — уже в dist, их ничто не перекрывает.
//   2. Старые папки превью из корня репозитория:
//        • папка из routes («kpt-bek» → /kpt) — отдаётся по боевому адресу;
//        • папка из drafts.list — по адресу /drafts/<имя> (её имя занято другой страницей сайта
//          или она отстаёт от сайта);
//        • остальные — по своему имени, как раньше.
//   3. Список черновиков превью (корневой index.html) — /drafts/.
//   4. Страницы из экспорта Тильды (tilda-export/<адрес>/) — на свободные адреса,
//      а на адреса из preferExport — поверх нашей папки. Главная Тильды (home) — на /.
//
// Переадресации со старых имён папок на боевые адреса собирает scripts/caddy-redirects.mjs.
// Запускается сам из `npm run build`. Руками не нужно.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
if (!fs.existsSync(DIST)) throw new Error('нет папки dist: сначала astro build');

const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const mirror = read('src/data/mirror.json');
const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([k]) => !k.startsWith('_')));
const routes = clean(mirror.routes); // боевой адрес → папка
const sourceToRoute = Object.fromEntries(Object.entries(routes).map(([to, from]) => [from, to]));
const drafts = new Set(mirror.drafts.list);
const prefer = new Set(mirror.preferExport.list);
const tildaLive = new Set(read('src/data/tilda-pages.json').filter((p) => p.live).map((p) => p.alias));

// Служебное, в сайт не попадает
const PROJECT = new Set([
  'src', 'scripts', 'public', 'dist', 'docs', 'node_modules', 'tilda-export', '.astro', '.git', '.github',
  '.gitignore', '.impeccable', 'package.json', 'package-lock.json', 'astro.config.mjs', 'tsconfig.json',
  'AGENTS.md', 'README.md', 'PRODUCT.md', 'DESIGN.md', 'ASTRO.md', 'Dockerfile', 'Caddyfile', 'redirects.caddy',
  'index.html', // список черновиков, его кладём на /drafts/ ниже
]);

// Адреса, которые уже собрал Astro
const astroPages = new Set(
  fs.readdirSync(path.join(ROOT, 'src/pages'))
    .filter((f) => f.endsWith('.astro') && !f.startsWith('404'))
    .map((f) => f.replace(/\.astro$/, '')),
);
// Старые имена папок, с которых стоит переадресация (webinar-trauma → webinar-ptsd)
const redirectedNames = new Set(read('src/data/redirects.json').map((r) => r.from.replace(/^\/|\/$/g, '')));

const copy = (from, to) => fs.cpSync(path.join(ROOT, from), path.join(DIST, to), { recursive: true });
const report = { routes: [], drafts: [], legacy: 0, export: 0, exportOver: [], skipped: [] };

// 2. Старые папки превью
for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
  const name = entry.name;
  if (PROJECT.has(name) || name.startsWith('.')) continue;
  if (sourceToRoute[name]) {
    const to = sourceToRoute[name];
    if (astroPages.has(to)) { report.skipped.push(`${name} (на /${to} страница Astro)`); continue; }
    copy(name, to);
    // Под старым именем папка тоже остаётся: страница могла ссылаться на свои файлы как /kpt-bek/img/…
    // Саму страницу /kpt-bek/ сервер переадресует на /kpt/ (scripts/caddy-redirects.mjs).
    if (!tildaLive.has(name)) copy(name, name); // psikholog-konsultant — своя страница сайта, там экспорт
    report.routes.push(`${name} → /${to}`);
    continue;
  }
  if (drafts.has(name)) { copy(name, path.join('drafts', name)); report.drafts.push(name); continue; }
  if (astroPages.has(name) || redirectedNames.has(name)) { report.skipped.push(name); continue; }
  copy(name, name);
  report.legacy++;
}

// 3. Список черновиков превью → /drafts/. Ссылки на папки, уехавшие в /drafts/<имя>, поправляем.
let draftsIndex = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const name of drafts) draftsIndex = draftsIndex.replaceAll(`href="/${name}/"`, `href="/drafts/${name}/"`);
fs.mkdirSync(path.join(DIST, 'drafts'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'drafts', 'index.html'), draftsIndex);

// 4. Страницы из экспорта Тильды
const EXPORT = path.join(ROOT, 'tilda-export');
if (fs.existsSync(EXPORT)) {
  for (const entry of fs.readdirSync(EXPORT, { withFileTypes: true })) {
    const name = entry.name;
    if (name.startsWith('.') || name === 'README.md') continue;
    if (name === '_tilda') { copy(path.join('tilda-export', name), name); continue; }
    if (name === mirror.home) {
      // Своя главная на Astro (src/pages/index.astro) главнее копии из экспорта
      if (astroPages.has('index')) { report.skipped.push('экспорт главной (есть своя главная)'); continue; }
      fs.copyFileSync(path.join(EXPORT, name, 'index.html'), path.join(DIST, 'index.html'));
      report.export++;
      continue;
    }
    const target = path.join(DIST, name);
    if (astroPages.has(name)) { report.skipped.push(`экспорт ${name} (страница Astro)`); continue; }
    if (fs.existsSync(target) && !prefer.has(name)) { report.skipped.push(`экспорт ${name} (есть наша версия)`); continue; }
    if (fs.existsSync(target)) { fs.rmSync(target, { recursive: true }); report.exportOver.push(name); }
    copy(path.join('tilda-export', name), name);
    report.export++;
  }
}

// 5. Шапка и подвал сайта (src/site, кладёт scripts/sync-site-chrome.mjs).
//    • Страницы из экспорта Тильды: их шапку меняем на нашу (в превью — с поиском), подвал там уже новый.
//    • Наши папки превью на боевых адресах: своих шапки и подвала у них нет (на Тильде их добавляет
//      сайт), ставим по образцу живой страницы — флаги header и footer в src/data/tilda-pages.json.
//    • Страницы Astro шапку и подвал уже получили из шаблона страницы.
const siteDir = path.join(ROOT, 'src/site');
const headerHtml = fs.readdirSync(path.join(siteDir, 'header')).filter((f) => f.endsWith('.html')).sort()
  .map((f) => fs.readFileSync(path.join(siteDir, 'header', f), 'utf8')).join('\n');
const footerHtml = fs.readFileSync(path.join(siteDir, 'footer/footer.html'), 'utf8');
const v1Link = '<link rel="stylesheet" href="/academy-base/v1.css">';
// Блок Тильды <header id="t-header"> или <footer id="t-footer"> целиком: внутри бывают свои
// <header>/<footer>, поэтому считаем вложенность
const tildaRange = (html, tag, id) => {
  const start = html.indexOf(`<${tag} id="${id}"`);
  if (start === -1) return null;
  const re = new RegExp(`<${tag}\\b|<\\/${tag}>`, 'g');
  re.lastIndex = start;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    depth += m[0] === `</${tag}>` ? -1 : 1;
    if (depth === 0) return [start, re.lastIndex];
  }
  return null;
};
const chrome = { swapped: 0, injected: 0 };
const pagesInfo = Object.fromEntries(read('src/data/tilda-pages.json').filter((p) => p.live).map((p) => [p.alias, p]));
for (const [alias, info] of Object.entries(pagesInfo)) {
  if (astroPages.has(alias) || (alias === mirror.home && astroPages.has('index'))) continue;
  const file = alias === mirror.home ? path.join(DIST, 'index.html') : path.join(DIST, alias, 'index.html');
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  const head = tildaRange(html, 'header', 't-header');
  const foot = tildaRange(html, 'footer', 't-footer');
  if (head || foot) {
    // Страница из экспорта: шапку и подвал Тильды меняем на наши (подвал — с конца, чтобы не сбить позиции)
    if (foot) html = html.slice(0, foot[0]) + `<footer id="t-footer" class="t-records">\n${footerHtml}\n</footer>` + html.slice(foot[1]);
    const h = tildaRange(html, 'header', 't-header');
    if (h) html = html.slice(0, h[0]) + `<header id="t-header" class="t-records">\n${headerHtml}\n</header>` + html.slice(h[1]);
    chrome.swapped++;
  } else if (html.includes('data-site-header')) {
    continue; // наша шапка уже стоит
  } else if (info.header || info.footer) {
    if (!html.includes('/academy-base/v1.css')) html = html.replace(/<\/head>/i, `${v1Link}\n</head>`);
    if (info.header) html = html.replace(/<body\b[^>]*>/i, (tag) => `${tag}\n${headerHtml}\n`);
    if (info.footer && !html.includes('site-footer_component') && !html.includes('id="t-footer"')) {
      html = html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${footerHtml}\n</body>`);
    }
    chrome.injected++;
  } else continue;
  fs.writeFileSync(file, html);
}

// 5б. Наши папки не на боевых адресах (черновики вроде catalog-v1) просят шапку и подвал сами:
//     <meta name="site-chrome" content="header footer"> в <head>. Своей копии шапки в папке держать не нужно.
const chromeAsked = [];
const askChrome = (file) => {
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');
  const m = html.match(/<meta\s+name="site-chrome"\s+content="([^"]*)"/i);
  if (!m || html.includes('data-site-header')) return;
  const want = m[1].split(/\s+/);
  if (!html.includes('/academy-base/v1.css')) html = html.replace(/<\/head>/i, `${v1Link}\n</head>`);
  if (want.includes('header')) html = html.replace(/<body\b[^>]*>/i, (tag) => `${tag}\n${headerHtml}\n`);
  if (want.includes('footer') && !html.includes('site-footer_component')) {
    html = html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${footerHtml}\n</body>`);
  }
  fs.writeFileSync(file, html);
  chromeAsked.push(path.relative(DIST, path.dirname(file)) || '/');
};
for (const e of fs.readdirSync(DIST, { withFileTypes: true })) {
  if (!e.isDirectory() || e.name.startsWith('_')) continue;
  askChrome(path.join(DIST, e.name, 'index.html'));
  if (e.name === 'drafts') for (const d of fs.readdirSync(path.join(DIST, 'drafts'), { withFileTypes: true })) {
    if (d.isDirectory()) askChrome(path.join(DIST, 'drafts', d.name, 'index.html'));
  }
}

// 6. Ссылки на боевой сайт внутри страниц → внутренние: на зеркале клики должны оставаться на зеркале.
//    Меняем только ссылки <a href>, canonical и og:url остаются боевыми.
let relinked = 0;
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '_astro' && e.name !== '_tilda') walk(p); continue; }
    if (!e.name.endsWith('.html')) continue;
    const html = fs.readFileSync(p, 'utf8');
    const next = html.replace(/(<a\b[^>]*?\bhref=")https?:\/\/(?:www\.)?modern-psy\.ru(\/[^"]*)?"/gi, (_, a, rest) => `${a}${rest || '/'}"`);
    if (next !== html) { fs.writeFileSync(p, next); relinked++; }
  }
};
walk(DIST);

console.log(`copy-legacy: папок превью ${report.legacy}, под боевыми адресами ${report.routes.length}, в /drafts ${report.drafts.length}, страниц из экспорта Тильды ${report.export}`);
if (report.exportOver.length) console.log(`  экспорт поверх отстающих наших версий: ${report.exportOver.join(', ')}`);
if (report.skipped.length) console.log(`  пропущено: ${report.skipped.join(', ')}`);
console.log(`  ссылки на modern-psy.ru стали внутренними в ${relinked} файлах`);
console.log(`  шапка и подвал заменены на страницах из экспорта: ${chrome.swapped}, шапка и подвал добавлены нашим папкам: ${chrome.injected}`);
if (chromeAsked.length) console.log(`  шапка и подвал по метке site-chrome: ${chromeAsked.join(', ')}`);
