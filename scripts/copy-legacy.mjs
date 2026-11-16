// Шаг сборки после `astro build`: кладёт в dist всё, что ещё не переехало на Astro.
//
//   1. Старые папки превью из корня репозитория (act/, academy-base/, web-academy/ …) — как есть,
//      как их раньше отдавало превью.
//   2. Страницы из экспорта Тильды (tilda-export/<адрес>/) — временно, пока страница не переверстана.
//
// Если у адреса уже есть страница в src/pages, старая папка с тем же именем пропускается:
// новая страница главнее. Папки, которые переехали под другим адресом (webinar-trauma → webinar-ptsd),
// перечислены в src/data/redirects.json — их тоже не копируем, со старого адреса стоит переадресация.
//
// Запускается сам из `npm run build`. Руками не нужно.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
if (!fs.existsSync(DIST)) throw new Error('нет папки dist: сначала astro build');

// Служебное, в сайт не попадает
const PROJECT = new Set([
  'src', 'scripts', 'public', 'dist', 'docs', 'node_modules', 'tilda-export', '.astro', '.git', '.github',
  '.gitignore', '.impeccable', 'package.json', 'package-lock.json', 'astro.config.mjs', 'tsconfig.json',
  'AGENTS.md', 'README.md', 'PRODUCT.md', 'DESIGN.md', 'ASTRO.md', 'Dockerfile', 'Caddyfile', 'redirects.caddy',
]);

// Адреса, которые уже собирает Astro
const pages = new Set(
  fs.readdirSync(path.join(ROOT, 'src/pages'))
    .filter((f) => f.endsWith('.astro') || fs.statSync(path.join(ROOT, 'src/pages', f)).isDirectory())
    .map((f) => f.replace(/\.astro$/, '')),
);
// Старые имена папок, с которых стоит переадресация на новые адреса
const redirects = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/redirects.json'), 'utf8'));
const moved = new Set(redirects.map((r) => r.from.replace(/^\/|\/$/g, '')));

let copied = 0, skipped = [];
for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
  const name = entry.name;
  if (PROJECT.has(name) || name.startsWith('.')) continue;
  if (pages.has(name) || moved.has(name)) { skipped.push(name); continue; }
  if (name === 'index.html' && pages.has('index')) { skipped.push(name); continue; }
  fs.cpSync(path.join(ROOT, name), path.join(DIST, name), { recursive: true });
  copied++;
}

// Страницы из экспорта Тильды
const EXPORT = path.join(ROOT, 'tilda-export');
let fromTilda = 0;
if (fs.existsSync(EXPORT)) {
  for (const entry of fs.readdirSync(EXPORT, { withFileTypes: true })) {
    const name = entry.name;
    if (name.startsWith('.') || name === 'README.md') continue;
    if (pages.has(name) || moved.has(name)) { skipped.push(`tilda-export/${name}`); continue; }
    const target = path.join(DIST, name);
    if (fs.existsSync(target) && name !== '_tilda') { skipped.push(`tilda-export/${name} (есть папка превью)`); continue; }
    fs.cpSync(path.join(EXPORT, name), target, { recursive: true });
    fromTilda++;
  }
}

console.log(`copy-legacy: старых папок ${copied}, страниц из экспорта Тильды ${fromTilda}`);
if (skipped.length) console.log(`  пропущено (есть новая страница или переадресация): ${skipped.join(', ')}`);
