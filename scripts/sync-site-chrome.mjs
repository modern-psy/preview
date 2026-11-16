// Забирает шапку и подвал сайта в превью (src/site/header, src/site/footer).
// Исходники живут в asp-deploy: apps/tilda/header и apps/tilda/footer — там же собираются пакеты для Тильды.
// Скрипт работает только на компьютере, где рядом лежит asp-deploy; результат коммитится в превью,
// поэтому сборке на сервере исходники не нужны.
//
// Шапка для превью собирается С ПОИСКОМ (nav.json → search.enabled = true) во временной копии,
// пакет для Тильды (apps/tilda/header/tilda) при этом не меняется. Для поиска в превью берутся
// черновые слова, темы и преподаватели из ASP-Prod (как в apps/tilda/header/preview.html).
//
// Запуск из корня превью: node scripts/sync-site-chrome.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const TILDA = path.resolve(ROOT, '../tilda');
const HEADER = path.join(TILDA, 'header');
const FOOTER = path.join(TILDA, 'footer');
for (const dir of [HEADER, FOOTER]) if (!fs.existsSync(dir)) throw new Error(`нет папки ${dir}: скрипт запускается из apps/preview внутри asp-deploy`);

// ---------- Шапка с поиском ----------
const tmp = path.join(TILDA, '.header-preview-search');
fs.rmSync(tmp, { recursive: true, force: true });
fs.cpSync(HEADER, tmp, { recursive: true, filter: (p) => !path.relative(HEADER, p).startsWith('tilda') });
fs.mkdirSync(path.join(tmp, 'tilda'), { recursive: true });
const navFile = path.join(tmp, 'src/nav.json');
const nav = JSON.parse(fs.readFileSync(navFile, 'utf8'));
nav.search = { ...(nav.search || {}), enabled: true };
fs.writeFileSync(navFile, JSON.stringify(nav, null, 2));
try {
  execFileSync(process.execPath, [path.join(tmp, 'build.mjs')], { cwd: path.resolve(TILDA, '../..'), stdio: 'inherit' });
  const outDir = path.join(ROOT, 'src/site/header');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const blocks = fs.readdirSync(path.join(tmp, 'tilda')).filter((f) => f.endsWith('.html')).sort();
  for (const f of blocks) fs.copyFileSync(path.join(tmp, 'tilda', f), path.join(outDir, f));
  // Слова для поиска в превью (до выкатки CMS с поисковыми полями)
  const preview = fs.readFileSync(path.join(tmp, 'preview.html'), 'utf8');
  const extra = (preview.match(/<script>window\.__aspSearchPreview=[\s\S]*?<\/script>/) || [''])[0];
  fs.writeFileSync(path.join(outDir, '00-search-preview.html'), extra);
  console.log(`шапка с поиском: ${blocks.join(', ')}${extra ? ' + слова для поиска' : ''}`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

// ---------- Подвал ----------
const footerBlock = path.join(FOOTER, 'tilda/footer.html');
fs.copyFileSync(footerBlock, path.join(ROOT, 'src/site/footer/footer.html'));
console.log('подвал: tilda/footer.html');
