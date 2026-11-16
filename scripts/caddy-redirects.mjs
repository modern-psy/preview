// Правила переадресации 301 для сервера Caddy. Запускается при сборке образа (Dockerfile), руками не нужно.
//
// Откуда берутся:
//   • src/data/redirects.json — старые адреса Тильды (блоки T305) и старые имена папок превью;
//   • src/data/mirror.json → routes — папка превью отдаётся по боевому адресу, со старого имени
//     папки (kpt-bek) ведём на боевой (kpt). Если старое имя само занято страницей сайта
//     (psikholog-konsultant), переадресацию не ставим: там стоит та страница;
//   • адрес главной Тильды (mainpage) ведёт на /.
// Каждый адрес ловится и без слеша на конце, и со слешем: /pbt и /pbt/.
import fs from 'node:fs';
const read = (p) => JSON.parse(fs.readFileSync(new URL(`../src/data/${p}`, import.meta.url), 'utf8'));
const redirects = read('redirects.json');
const mirror = read('mirror.json');
const tildaLive = new Set(read('tilda-pages.json').filter((p) => p.live).map((p) => p.alias));

const all = [...redirects];
for (const [to, from] of Object.entries(mirror.routes)) {
  if (to.startsWith('_') || tildaLive.has(from)) continue;
  all.push({ from: `/${from}`, to: `/${to}/` });
}
if (mirror.home) all.push({ from: `/${mirror.home}`, to: '/' });

const quote = (s) => `"${String(s).replace(/"/g, '\\"')}"`;
const lines = ['# Собрано scripts/caddy-redirects.mjs. Руками не править.'];
const seen = new Set();
all.forEach((r, i) => {
  const from = '/' + r.from.replace(/^\/+|\/+$/g, '');
  if (seen.has(from)) return;
  seen.add(from);
  lines.push(`@r${i} path ${quote(from)} ${quote(from + '/')}`);
  lines.push(`redir @r${i} ${quote(r.to)} 301`);
});
process.stdout.write(lines.join('\n') + '\n');
