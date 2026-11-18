// Блок цены из CMS: утверждённый блок генератора /pricing (apps/preview/pricing/src, есть только локально).
// Сценарий берёт свежие цены курса couples-therapy из CMS и вставляет в index.html:
//   • сам блок (стили, запасная разметка со снимком цен, скрипт) между метками price:start и price:end;
//   • микроразметку курса между метками price-ld:start и price-ld:end. Блок цены сам переписывает в ней
//     потоки и цены при каждой загрузке свежих цен.
// Раскладка wa-narrow (колонка 64rem, как на /orkt и /couple-requests), фон #f5f5f5, якорь #price.
// Как на живой странице с 03.11.2026: без скидки «Курса месяца», только чип (noDiscount → data-promo="chip").
// Ссылку на Google Fonts из блока убираем: шрифт Wix Madefor на странице уже есть из общих стилей v1,
// а page.css переключает блок на него.
// Запуск из apps/preview: node couples-therapy/price-sync.mjs
import fs from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('./', import.meta.url);
const pricing = new URL('../pricing/src/', import.meta.url);
const read = name => fs.readFile(new URL(name, pricing), 'utf8');
const [css, js, tilda] = await Promise.all(['price-auto.css', 'price-auto.js', 'tilda-block.js'].map(read));

const sandbox = {console, Intl, Date, Math, JSON, String, Number, Array, Object, isNaN};
sandbox.globalThis = sandbox;
vm.runInNewContext(js, sandbox);
vm.runInNewContext(tilda, sandbox);
const T = sandbox.PriceAutoTilda;

const SLUG = 'couples-therapy';
const response = await fetch(`${T.API}/api/public/course/${SLUG}`, {headers: {Accept: 'application/json'}, signal: AbortSignal.timeout(15000)});
if (!response.ok) throw new Error(`CMS ответила ${response.status} для ${SLUG}`);
const course = await response.json();

// Пункты «Что входит» и преподаватели для микроразметки — из настроек генератора (PAGES['couples-therapy'] в tilda-block.js):
// их собирали со старой страницы («Программа опирается на научные подходы», «Чему вы научитесь», программа, удостоверение).
const settings = T.PAGES && T.PAGES[SLUG];
if (!settings || !settings.includes || !settings.instructors) throw new Error('в генераторе нет настроек страницы couples-therapy');
const block = T.assemble({
  css, js, course, slug: SLUG,
  system: 'figure', terms: true, noDiscount: true, includes: [...settings.includes],
  layout: 'wa-narrow', background: '#f5f5f5', anchor: 'price', top: 'section', bottom: 'section',
});
const ld = T.assembleLd({course, slug: SLUG, instructors: settings.instructors.map(item => ({...item}))});
for (const problem of [...block.problems, ...ld.problems]) console.warn('⚠️ ', problem);

// Шапку-комментарий генератора (в ней старые Zero-блоки живой страницы) и Google Fonts убираем
const code = block.code
  .replace(/^<!--[\s\S]*?-->\s*/, '')
  .replace(/<link rel="preconnect" href="https:\/\/fonts\.(googleapis|gstatic)\.com"[^>]*>\s*/g, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, '')
  .trim();
const ldCode = ld.code.replace(/^<!--[\s\S]*?-->\s*/, '').trim();
if (/fonts\.googleapis/.test(code)) throw new Error('в блоке цены осталась ссылка на Google Fonts');

const indexUrl = new URL('index.html', root);
let index = await fs.readFile(indexUrl, 'utf8');
const put = (name, body) => {
  const pattern = new RegExp(`(<!-- ${name}:start[^>]*-->)[\\s\\S]*?(<!-- ${name}:end -->)`);
  if (!pattern.test(index)) throw new Error(`index.html: нет меток ${name}:start и ${name}:end`);
  index = index.replace(pattern, (_, start, end) => `${start}\n${body}\n${end}`);
};
put('price', code);
put('price-ld', ldCode);
await fs.writeFile(indexUrl, index);
console.log(`блок цены обновлён: ${block.scenarioName}, снимок на ${block.snapshotAt}, ${block.length} символов`);
