// Блок цены из CMS: утверждённый блок генератора /pricing (apps/preview/pricing/src, есть только локально),
// сценарий «модули и пакет» (как на /ifs): «Один вебинар» и тёмная карточка «Полный цикл» с ярлыком «Выгода N ₽».
// Сценарий берёт свежие цены курса adult-adhd-therapy из CMS и вставляет в index.html:
//   • сам блок (стили, запасная разметка со снимком цен, скрипт) между метками price:start и price:end;
//   • микроразметку курса между метками price-ld:start и price-ld:end. Блок цены сам переписывает в ней
//     потоки и цены при каждой загрузке свежих цен.
// Раскладка wa-narrow (колонка 64rem, как на /child-psy), фон #f5f5f5, якорь #price.
//
// Запуск из apps/preview:
//   node adult-adhd-therapy/price-sync.mjs           — цены из CMS (так собирать для Тильды);
//   node adult-adhd-therapy/price-sync.mjs --draft   — предпросмотр по cms-course.json, пока курс в CMS не заведён:
//     блок не ходит в CMS (data-api пустой) и помечен data-price-draft, build-tilda.mjs такой не соберёт.
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

const SLUG = 'adult-adhd-therapy';
const draft = process.argv.includes('--draft');
let course;
if (draft) {
  course = JSON.parse(await fs.readFile(new URL('cms-course.json', root), 'utf8'));
  delete course._comment;
} else {
  const response = await fetch(`${T.API}/api/public/course/${SLUG}`, {headers: {Accept: 'application/json'}, signal: AbortSignal.timeout(15000)});
  if (!response.ok) throw new Error(`CMS ответила ${response.status} для ${SLUG}`);
  course = await response.json();
}

// Тарифы: в CMS у потока два тарифа, «Один вебинар» и «Полный цикл». Блок находит настройки тарифа по словам
// в его названии: «Один вебинар» и «цикл» (подойдёт и «Полный цикл», и «Весь цикл»). Если тариф не нашёлся,
// блок не узнает пакет: покажет «Рекомендуем» вместо выгоды и крестики (так было 07.11.2026, пока ключ был «Весь цикл»).
// Что тариф с «циклом» — пакет из трёх вебинаров, блок узнаёт отсюда: kind 'bundle', у вебинара count: 3.
// Выгода на ярлыке = 3 × цена вебинара − цена цикла (7 000 × 3 − 19 000 = 2 000 ₽), считается от цен CMS.
// Пункты — только факты страницы: даты, время, формат встреч из программы.
const tariffs = {
  'Один вебинар': {
    kind: 'module',
    count: 3,
    description: 'Любая встреча цикла на выбор',
    includes: [
      'Одна встреча: 31 января, 28 февраля или 28 марта',
      '4 часа онлайн, с 15:00 до 19:00',
      'Теория и разбор клиентских кейсов',
      'Практика в группе и малых подгруппах',
    ],
  },
  'цикл': {
    kind: 'bundle',
    description: 'Три встречи, с 31 января по 28 марта',
    includes: [
      'Три встречи: 31 января, 28 февраля и 28 марта',
      '12 часов онлайн, каждая встреча с 15:00 до 19:00',
      'Исполнительная дисфункция, женщины с СДВГ, идентичность и Селф',
      'Теория, разбор кейсов и практика в группе',
    ],
  },
};
const block = T.assemble({
  css, js, course, slug: SLUG,
  system: 'figure',
  // «Гибкие условия оплаты» (рассрочка до 24 месяцев, персональные скидки) — до решения Дарьи не показываем:
  // неизвестно, действуют ли они на вебинары. Строки «N ₽/мес в рассрочку» под ценой тоже нет (installment: false).
  terms: false, installment: false,
  tariffs,
  layout: 'wa-narrow', background: '#f5f5f5', anchor: 'price', top: 'section', bottom: 'section',
});
// В CMS у курса нет преподавателей, поэтому для разметки берём ведущую со страницы
const ld = T.assembleLd({
  course, slug: SLUG,
  instructors: [{name: 'Евгения Дашкова', jobTitle: 'Психолог, АСТ-терапевт, преподаватель'}],
});
for (const problem of [...block.problems, ...ld.problems]) console.warn('⚠️ ', problem);

// Шапку-комментарий генератора и Google Fonts убираем
let code = block.code
  .replace(/^<!--[\s\S]*?-->\s*/, '')
  .replace(/<link rel="preconnect" href="https:\/\/fonts\.(googleapis|gstatic)\.com"[^>]*>\s*/g, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, '')
  .trim();
const ldCode = ld.code.replace(/^<!--[\s\S]*?-->\s*/, '').trim();
if (/fonts\.googleapis/.test(code)) throw new Error('в блоке цены осталась ссылка на Google Fonts');
if (draft) {
  // Предпросмотр: блок не обращается к CMS (там пока лист ожидания) и остаётся на снимке из cms-course.json
  const before = code;
  code = code.replace(/ data-api="[^"]*"/, ' data-api="" data-price-draft');
  if (code === before) throw new Error('не нашёлся data-api у блока цены');
}

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
console.log(`блок цены обновлён${draft ? ' (ПРЕДПРОСМОТР по cms-course.json, не для Тильды)' : ''}: ${block.scenarioName}, снимок на ${block.snapshotAt}, ${block.length} символов`);
