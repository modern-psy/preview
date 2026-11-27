// Снимает страницу modern-psy.ru, собранную блоками T123 прямо в Тильде (исходника в репозитории нет),
// в исходник tilda-source/<адрес>/index.html — дальше её переносит на Astro scripts/legacy-to-astro.mjs.
//
// Что берём: заголовок, описание, canonical и Open Graph страницы и содержимое блоков T123 (HTML-код)
// по порядку, как они стоят на сайте. Что не берём: шапку и подвал сайта (на Astro их ставит шаблон),
// нативные формы и попапы Тильды (на зеркале заявки не отправляются), счётчики.
// Блок цены из CMS (генератор /pricing) и микроразметку курса заменяем метками, чтобы на Astro
// встали компоненты PriceBlock и PriceLd: цена тогда берётся из CMS при сборке.
// Нативные блоки Тильды, которые несут содержание (видео, текст), не переносятся — скрипт их перечислит.
//
// Запуск из корня превью:
//   node scripts/tilda-to-source.mjs rpp
//   node scripts/legacy-to-astro.mjs tilda-source/rpp rpp
import fs from 'node:fs';
import path from 'node:path';

const [alias] = process.argv.slice(2);
if (!alias) { console.error('Нужно: node scripts/tilda-to-source.mjs <адрес>'); process.exit(1); }
const ROOT = process.cwd();

const res = await fetch(`https://modern-psy.ru/${alias}`, { headers: { 'User-Agent': 'Mozilla/5.0 preview-source' }, signal: AbortSignal.timeout(30000) });
if (!res.ok) throw new Error(`/${alias}: сайт ответил ${res.status}`);
const html = await res.text();

// ---------- head ----------
const head = html.slice(0, html.indexOf('</head>'));
const pick = (re) => (head.match(re) || [])[1] || '';
const metas = [
  `<title>${pick(/<title>([\s\S]*?)<\/title>/)}</title>`,
  `<meta name="description" content="${pick(/<meta name="description" content="([^"]*)"/)}">`,
  `<link rel="canonical" href="${pick(/<link rel="canonical" href="([^"]*)"/) || `https://modern-psy.ru/${alias}`}">`,
  `<meta property="og:title" content="${pick(/<meta property="og:title" content="([^"]*)"/)}">`,
  `<meta property="og:description" content="${pick(/<meta property="og:description" content="([^"]*)"/)}">`,
  `<meta property="og:image" content="${pick(/<meta property="og:image" content="([^"]*)"/)}">`,
].filter((m) => !/content=""/.test(m));

// ---------- блоки ----------
// Шапку и подвал сайта вырезаем целиком (внутри них свои блоки)
function cutElement(src, openRe, tag) {
  const m = openRe.exec(src);
  if (!m) return src;
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
  re.lastIndex = m.index;
  let depth = 0, t;
  while ((t = re.exec(src))) {
    depth += t[0] === `</${tag}>` ? -1 : 1;
    if (depth === 0) return src.slice(0, m.index) + src.slice(re.lastIndex);
  }
  return src;
}
let body = html.slice(html.indexOf('<body'));
body = cutElement(body, /<header id="t-header"/, 'header');
body = cutElement(body, /<footer id="t-footer"/, 'footer');

// Блоки страницы по порядку: <div id="recNNN" … data-record-type="131"> … </div>
const blocks = [];
const skipped = {};
const recRe = /<div id="rec(\d+)" class="r t-rec[^"]*"[^>]*?data-record-type="(\d+)"[^>]*>/g;
let m;
while ((m = recRe.exec(body))) {
  const [open, id, type] = m;
  // конец блока — по вложенности div
  const re = /<div\b|<\/div>/g;
  re.lastIndex = m.index;
  let depth = 0, t, end = -1;
  while ((t = re.exec(body))) {
    depth += t[0] === '</div>' ? -1 : 1;
    if (depth === 0) { end = re.lastIndex; break; }
  }
  if (end === -1) break;
  const inner = body.slice(m.index + open.length, end - '</div>'.length);
  recRe.lastIndex = end;
  // Якорь Тильды (t270) — пустая метка <a name>, на неё ведут ссылки меню: переносим как есть
  if (type === '270') { blocks.push(`<div class="t-anchor" data-rec="${id}">${inner.trim()}</div>`); continue; }
  if (type !== '131') { skipped[type] = (skipped[type] || 0) + 1; continue; }
  let code = inner.trim();
  // Блок цены генератора /pricing → метки для компонента PriceBlock
  const price = code.match(/<section class="price-auto_component[^"]*"[^>]*data-course="([^"]+)"[^>]*>/);
  if (price) {
    const attr = (name) => (price[0].match(new RegExp(`${name}="([^"]*)"`)) || [])[1];
    const extra = (code.match(/<script type="application\/json" data-price-auto-extra>([\s\S]*?)<\/script>/) || [])[1];
    const options = {
      system: attr('data-system') || 'figure',
      terms: attr('data-terms') !== 'off',
      layout: attr('data-layout') || undefined,
      anchor: attr('id') || undefined,
      background: ((attr('style') || '').match(/--pa-section-background:\s*([^;"]+)/) || [])[1],
      noDiscount: attr('data-promo') === 'chip' || undefined,
    };
    if (extra) Object.assign(options, JSON.parse(extra));
    code = `<!-- price-auto:${JSON.stringify({ course: price[1], options })} -->`;
  }
  const ld = code.match(/<script type="application\/ld\+json" data-price-auto-ld="([^"]+)">/);
  if (ld && code.replace(/<script[\s\S]*?<\/script>/g, '').trim() === '') code = `<!-- price-auto-ld:${ld[1]} -->`;
  blocks.push(`<!-- блок T123 rec${id} -->\n<div class="t123-block" data-rec="${id}">\n${code}\n</div>`);
}

const out = `<!doctype html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${metas.join('\n')}
</head>
<body>
<!-- Снято с https://modern-psy.ru/${alias} ${new Date().toISOString().slice(0, 10)} скриптом scripts/tilda-to-source.mjs.
     Источник правды для текстов — Тильда; править здесь и переносить на Astro заново. -->
<main class="main-wrapper" id="main-content">
<!-- Замена служебных функций Тильды, которые вызывает код блоков T123 (вне Тильды их нет) -->
<script>
window.t_onReady = window.t_onReady || function (fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); };
window.t_onFuncLoad = window.t_onFuncLoad || function (name, fn) { if (typeof window[name] === 'function') fn(); };
</script>
${blocks.join('\n\n')}
</main>
</body>
</html>
`;
const dir = path.join(ROOT, 'tilda-source', alias);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'index.html'), out);
console.log(`/${alias}: блоков T123 ${blocks.length} → tilda-source/${alias}/index.html`);
const names = { 1040: 'форма', 702: 'попап', 270: 'якорь', 331: 'видео', 367: 'кнопка попапа', 215: 'якорная ссылка', 390: 'попап' };
if (Object.keys(skipped).length) {
  console.log(`  нативные блоки Тильды не перенесены: ${Object.entries(skipped).map(([t, n]) => `${names[t] || 't' + t} ×${n}`).join(', ')}`);
}
