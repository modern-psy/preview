// Блок цены из CMS: утверждённый блок генератора /pricing (apps/preview/pricing/src, есть только локально).
// Сценарий берёт свежие цены курса adhd-adult из CMS и вставляет в index.html:
//   • сам блок (стили, запасная разметка со снимком цен, скрипт) между метками price:start и price:end;
//   • микроразметку курса между метками price-ld:start и price-ld:end. Блок цены сам переписывает в ней
//     потоки и цены при каждой загрузке свежих цен.
// На странице блок каждый раз сам берёт свежие цены из CMS: сценарий (цена, лист ожидания, акция), цену,
// рассрочку, повышения и дату старта. Снимок внутри — только запасной вариант, если API не ответил.
// Раскладка wa-narrow (колонка 64rem, как на /child-psy), фон #f5f5f5, якорь #price.
// Ссылку на Google Fonts из блока убираем: шрифт Wix Madefor на странице уже есть из общих стилей v1,
// а page.css переключает блок на него.
// Запуск из apps/preview: node adhd-adult/price-sync.mjs
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

const SLUG = 'adhd-adult';
const response = await fetch(`${T.API}/api/public/course/${SLUG}`, {headers: {Accept: 'application/json'}, signal: AbortSignal.timeout(15000)});
if (!response.ok) throw new Error(`CMS ответила ${response.status} для ${SLUG}`);
const course = await response.json();

// Пункты «Что входит»: только факты этой страницы (программа, «Как вы будете учиться», удостоверение).
// Часы сюда не пишем: они в CMS и могут поменяться, а пункты — снимок.
const includes = [
  'Два семинара онлайн, в живом общении с преподавателем',
  'Разбор кейсов и практика на занятиях',
  'Домашние задания и чат с коллегами и преподавателем',
  'Удостоверение о повышении квалификации',
];
const block = T.assemble({
  css, js, course, slug: SLUG,
  system: 'figure', terms: true, includes,
  layout: 'wa-narrow', background: '#f5f5f5', anchor: 'price', top: 'section', bottom: 'section',
});
// Преподавательница для разметки — со страницы (в CMS у неё нет должности)
const ld = T.assembleLd({
  course, slug: SLUG,
  instructors: [{name: 'Евгения Дашкова', jobTitle: 'Психолог, АСТ-терапевт, преподаватель'}],
});
for (const problem of [...block.problems, ...ld.problems]) console.warn('⚠️ ', problem);

// Шапку-комментарий генератора (в ней старые блоки живой страницы) и Google Fonts убираем
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
