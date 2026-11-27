// Сверяет тексты собранной страницы превью (dist/<адрес>/index.html) с живой страницей modern-psy.ru.
// Правило проекта: если текст правили руками в Тильде, источник правды — Тильда, и превью приводим к ней.
//
// Что не сравнивается: шапка и подвал сайта, служебные тексты форм (согласия, подписи полей),
// скрипты и стили. Строки сравниваются без учёта пробелов, переносов и знаков препинания.
//
// Запуск из корня превью после npm run build:
//   node scripts/compare-with-site.mjs sportivnaya-psihologiya couples-therapy
//   node scripts/compare-with-site.mjs --all      (все страницы, у которых в зеркале наша версия)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
let aliases = process.argv.slice(2);

// Форма и служебные строки Тильды и наших форм — не содержание страницы
const NOISE = /Нажимая на кнопку|соглашаетесь с|политик\S* (конфиденциальности|обработки)|обработку моих персональных|^(Отправить|Ваш телефон|Ваше имя|Телефон\*?|Имя|Электронная почта|Как к вам обращаться\?|Где вам удобнее общаться\?|Оставить заявку|Отправить резюме|Стать преподавателем|Telegram|MAX|Max|Phone|согласие)$|Оставьте свои данные в форме|Черная пятница не суммируется/;

// Вырезает элемент целиком с учётом вложенных элементов того же тега
function cut(html, openRe, tag) {
  let out = html, m;
  while ((m = openRe.exec(out))) {
    const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
    re.lastIndex = m.index;
    let depth = 0, t, end = -1;
    while ((t = re.exec(out))) {
      depth += t[0] === `</${tag}>` ? -1 : 1;
      if (depth === 0) { end = re.lastIndex; break; }
    }
    if (end === -1) break;
    out = out.slice(0, m.index) + out.slice(end);
    openRe.lastIndex = 0;
  }
  return out;
}

function lines(html) {
  let h = html;
  h = cut(h, /<header id="t-header"/g, 'header');
  h = cut(h, /<footer id="t-footer"/g, 'footer');
  // Нативные формы и попапы Тильды (их прячет и через них отправляет наша форма) — не содержание страницы
  h = cut(h, /<div id="rec\d+"[^>]*data-record-type="(?:1040|702|390|1093|868)"/g, 'div');
  h = cut(h, /<header class="site-header"/g, 'header');
  h = cut(h, /<footer class="site-footer_component"/g, 'footer');
  h = h.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript|svg|template|title)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(p|div|li|h[1-6]|section|td|th|tr|ul|ol|button|a|summary|details|figcaption|article|dt|dd|label|span)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&#160;/g, ' ').replace(/&laquo;/g, '«').replace(/&raquo;/g, '»').replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/[  ⁠]/g, ' ');
  return h.split('\n').map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.replace(/[^\p{L}\p{N}]/gu, '').length >= 3 && !NOISE.test(l));
}
const key = (l) => l.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

if (aliases[0] === '--all') {
  const pages = fs.readdirSync(path.join(ROOT, 'src/pages')).filter((f) => f.endsWith('.astro') && !/^(404|index)\.astro$/.test(f));
  aliases = pages.map((f) => f.replace(/\.astro$/, ''));
}

let problems = 0;
for (const alias of aliases) {
  const file = path.join(ROOT, 'dist', alias, 'index.html');
  if (!fs.existsSync(file)) { console.log(`/${alias}: нет в dist (сначала npm run build)`); continue; }
  const res = await fetch(`https://modern-psy.ru/${alias}`, { headers: { 'User-Agent': 'Mozilla/5.0 preview-compare' }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) { console.log(`/${alias}: на сайте ${res.status}`); continue; }
  const site = lines(await res.text());
  const ours = lines(fs.readFileSync(file, 'utf8'));
  // Строку считаем совпавшей, если она целиком есть в тексте другой стороны (переносы строк бывают разными)
  const oursAll = key(ours.join(' ')), siteAll = key(site.join(' '));
  const onlySite = [...new Set(site.filter((l) => !oursAll.includes(key(l))))];
  const onlyOurs = [...new Set(ours.filter((l) => !siteAll.includes(key(l))))];
  const ok = !onlySite.length && !onlyOurs.length;
  if (!ok) problems++;
  console.log(`/${alias}: ${ok ? 'тексты совпадают' : `на сайте нет у нас — ${onlySite.length}, у нас нет на сайте — ${onlyOurs.length}`}`);
  for (const l of onlySite.slice(0, 15)) console.log(`   сайт:  ${l.slice(0, 160)}`);
  for (const l of onlyOurs.slice(0, 15)) console.log(`   превью: ${l.slice(0, 160)}`);
}
if (problems) process.exitCode = 1;
