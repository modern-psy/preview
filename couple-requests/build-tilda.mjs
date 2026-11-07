// Сборка блоков T123 для Тильды: один T123 = одна секция, стили и скрипты отдельными блоками.
// По образцу child-psy/build-tilda.mjs.
// Запуск из apps/preview: node couple-requests/build-tilda.mjs
// Перед сборкой обновить цены: node couple-requests/price-sync.mjs (снимок цен вшивается в блок цены).
// Вход: index.html, page.css, page.js (их и правим), academy.css, diploma.css, request-form.css и request-form.js
// (копии общих компонентов).
// Выход: tilda/*.html, tilda/preview.html, tilda/manifest.json.
// Файлы в tilda/ руками не править: при следующей сборке они перезапишутся.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root = new URL('./', import.meta.url);
const out = new URL('tilda/', root);
const LIMIT = 65000; // у блока T123 потолок около 65 000 символов
const read = name => fs.readFile(new URL(name, root), 'utf8');
// Якоря, которые ведут не в секцию, а в попап Тильды на странице. На этой странице кнопки ведут только в секции.
const POPUPS = [];

const source = await read('index.html');
const css = await read('page.css');
// Стили общих компонентов Web Academy («Почему выбирают нас», «98 % студентов»): идут внутри блока секции academy.
const academyCss = await read('academy.css');
// Стили общего блока «Диплом» (копия web-academy/shared/academy/diploma.css): идут внутри блока секции certificate.
const diplomaCss = await read('diploma.css');
const js = await read('page.js');
// Форма заявки: копия общего компонента Академии (её кладёт request-form-sync.mjs). Стили идут внутри блока секции signup,
// скрипт отдельным T123 после блока с формой Тильды.
const requestFormCss = await read('request-form.css');
const requestFormJs = await read('request-form.js');
// В Тильду скрипт формы идёт без комментариев (request-form.md). Убираем только комментарии на отдельных строках,
// код и строки не трогаем; результат проверяется ниже разбором через new Function.
const stripComments = code => code
  .replace(/^[ \t]*\/\*(?:(?!\*\/)[\s\S])*\*\/[ \t]*\n/gm, '')
  .replace(/^[ \t]*\/\/.*\n/gm, '');
const requestFormJsTilda = stripComments(requestFormJs).trim();
new Function(requestFormJsTilda);

// Картинки должны быть с CDN: локальные файлы в Тильду не переносятся.
const local = [...source.matchAll(/(?:src|href)="(\.\/(?!(?:page|academy|diploma|request-form)\.(?:css|js))[^"]+|img\/[^"]+)"/g), ...(css + academyCss + diplomaCss + requestFormCss).matchAll(/url\((['"]?)(\.\/|img\/)[^)]*\)/g)];
if (local.length) throw new Error(`Локальные файлы: ${local.map(m => m[1] || m[0]).join(', ')}. Нужны ссылки на CDN (S3).`);

// Содержимое <main>. Блок цены (между метками price) — готовый блок генератора, идёт отдельным T123 как есть.
const main = source.match(/<main class="main-wrapper academy-page couple-requests-page"[^>]*>([\s\S]*)<\/main>/);
if (!main) throw new Error('index.html: не найден <main class="main-wrapper academy-page couple-requests-page">');
const priceMatch = main[1].match(/<!-- price:start[^>]*-->([\s\S]*?)<!-- price:end -->/);
if (!priceMatch || !priceMatch[1].includes('data-price-auto')) throw new Error('index.html: нет блока цены, сначала запустить price-sync.mjs');
const priceBlock = priceMatch[1].trim();
const body = main[1].replace(priceMatch[0], '');
const sections = [...body.matchAll(/<section\b[\s\S]*?<\/section>/g)].map(m => m[0]);
const titles = {
  hero: 'Первый экран (старт, часы и время занятий из CMS)',
  context: 'Один клиент — иногда уже пара',
  audience: 'Для кого этот курс',
  skills: 'Чему вы научитесь на курсе',
  cases: 'Разберём кейсы из реальной практики',
  teachers: 'Авторы и преподаватель',
  format: 'Как устроено обучение',
  program: 'Программа обучения (время занятий из CMS)',
  certificate: 'Удостоверение о повышении квалификации, со стилями общего блока',
  academy: 'Почему выбирают нас, со стилями компонента',
  ratings: '98 % студентов рекомендуют обучение',
  signup: 'Форма заявки (общий компонент request-form), со стилями компонента',
  faq: 'Ответы на популярные вопросы',
};
if (sections.length !== Object.keys(titles).length) throw new Error(`Ожидалось ${Object.keys(titles).length} секций, найдено ${sections.length}`);
for (const markup of sections) if ((markup.match(/<section\b/g) || []).length !== 1) throw new Error('Вложенные <section> не поддерживаются');

await fs.mkdir(out, {recursive: true});
for (const name of await fs.readdir(out)) if (/^\d\d-.*\.html$|^preview\.html$|^manifest\.json$/.test(name)) await fs.rm(new URL(name, out));
const files = [];
const blocks = [];
let index = 0;
const write = async (slug, text, title, placement) => {
  const name = `${String(index++).padStart(2, '0')}-${slug}.html`;
  if (text.length >= LIMIT) throw new Error(`${name}: ${text.length} символов, лимит T123 ${LIMIT}`);
  await fs.writeFile(new URL(name, out), text);
  files.push({file: name, title, placement, characters: text.length, sha256: createHash('sha256').update(text).digest('hex')});
  blocks.push(text);
};

// 1. Стили страницы. Общие стили лендингов v1 (/academy-base/v1.css) и их шрифт в пакет НЕ идут:
//    на сайте они уже в custom.css Тильды. Цвет текста кнопок-ссылок v1 сам ставит с !important.
const links = [...source.matchAll(/<link rel="(?:preconnect|stylesheet)"[^>]*>/g)].map(m => m[0]).filter(link => !link.includes('href="./') && !link.includes('/academy-base/'));
await write('styles', `<!-- ОБЩИЕ СТИЛИ. Первый T123 страницы, до всех секций. Отступы T123 сверху и снизу: 0. -->\n${links.join('\n')}\n<style>\n${css.trim()}\n</style>\n`, 'Общие стили', 'STYLE');

// 2. Секции: каждая в своей обёртке main-wrapper academy-page couple-requests-page с data-academy="1", как <main> на превью
//    (каркас v1 и токены страницы держатся на этой обёртке). Перед формой — блок цены.
const wrap = (id, inner) => `<div class="main-wrapper academy-page couple-requests-page" data-academy="1" data-couple-part="${id}">${inner}</div>\n`;
for (const markup of sections) {
  const id = markup.match(/<section\b[^>]*\bid="([a-z-]+)"/)[1];
  const title = titles[id];
  if (!title) throw new Error(`Нет названия для секции ${id}`);
  if (id === 'signup') {
    // Блок цены из генератора: свои стили и скрипт внутри, цены из CMS. Обёртка .couple-requests-page переключает его на шрифт v1.
    await write('price', `<!-- БЛОК ЦЕНЫ ИЗ CMS (генератор apps/preview/pricing, курс couple-requests). Отдельный T123 перед формой.\n     Собирает price-sync.mjs, руками не править. Скрипт сам берёт свежие цены и обновляет микроразметку курса. -->\n${wrap('price', `\n${priceBlock}\n`)}`, 'Стоимость обучения (блок цены из CMS)', 'BODY');
  }
  const style = id === 'academy' ? `<style>\n${academyCss.trim()}\n</style>\n` : id === 'certificate' ? `<style>\n${diplomaCss.trim()}\n</style>\n` : id === 'signup' ? `<style>\n${requestFormCss.trim()}\n</style>\n` : '';
  await write(id, `<!-- СЕКЦИЯ ${id}: ${title}. Вставить целиком в отдельный T123 с нулевыми отступами. -->\n${style}${wrap(id, `\n${markup}\n`)}`, title, 'BODY');
}

// 3. Скрипт страницы: дата старта или лист ожидания, время занятий и часы из CMS, FAQ, номер Метрики для формы.
//    Ждёт, пока все секции появятся в документе.
await write('scripts', `<!-- СКРИПТ СТРАНИЦЫ. После всех секций и после блока с формой Тильды. -->\n<script>\n(() => {\nconst init = () => {\n${js.trim()}\n};\nif (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once: true});\nelse init();\n})();\n</script>\n`, 'Скрипт страницы', 'FOOTER');

// 4. Скрипт формы заявки: после блока с формой Тильды и после скрипта страницы, без комментариев.
await write('request-form', `<!-- СКРИПТ ФОРМЫ ЗАЯВКИ (общий компонент request-form). После блока с формой Тильды, сразу за скриптом страницы. -->\n<script>\n${requestFormJsTilda}\n</script>\n`, 'Скрипт формы заявки', 'FOOTER');

// 5. Микроразметка: курс (из генератора цен, блок цены переписывает в ней потоки и цены) и FAQ.
//    Организация размечена внутри курса (provider), отдельный блок организации в пакет не идёт.
const courseLd = source.match(/<!-- price-ld:start[^>]*-->([\s\S]*?)<!-- price-ld:end -->/);
if (!courseLd || !courseLd[1].includes('data-price-auto-ld="couple-requests"')) throw new Error('index.html: нет микроразметки курса, сначала запустить price-sync.mjs');
const faqLd = [...source.matchAll(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g)].map(m => m[0]).filter(block => block.includes('"FAQPage"'));
if (faqLd.length !== 1) throw new Error('В index.html не найдена микроразметка FAQPage');
await write('seo', `<!-- МИКРОРАЗМЕТКА: курс и FAQ. Отдельный T123 в конце страницы. Потоки и цены курса блок цены обновляет сам;\n     тексты FAQ совпадают с секцией faq. Если на странице уже есть разметка курса (Course), её убрать. -->\n${courseLd[1].trim()}\n${faqLd[0]}\n`, 'Микроразметка курса и FAQ', 'FOOTER');

// Проверки: локальные ссылки, сохранность и уникальность id, целостность якорей.
const all = blocks.join('\n');
if (/(?:src|href)="\.\/|url\((['"]?)\.\/|localhost|127\.0\.0\.1/.test(all)) throw new Error('В блоках остались локальные ссылки');
if (/fonts\.googleapis/.test(all)) throw new Error('В блоках осталась ссылка на Google Fonts');
const ids = text => [...text.matchAll(/(?<![\w-])id="([^"]+)"/g)].map(m => m[1]);
const sourceIds = [...ids(body), ...ids(priceBlock)].sort().join();
const exportIds = ids(blocks.filter(b => b.startsWith('<!-- СЕКЦИЯ') || b.startsWith('<!-- БЛОК ЦЕНЫ')).join(''));
if (sourceIds !== [...exportIds].sort().join()) throw new Error('Набор id в блоках не совпадает с index.html');
if (new Set(exportIds).size !== exportIds.length) throw new Error('Повторяющиеся id в блоках');
for (const link of all.matchAll(/href="#([a-z][a-z0-9-]*)"/g)) if (!exportIds.includes(link[1]) && !POPUPS.includes(link[1])) throw new Error(`Якорь без цели: #${link[1]}`);

// preview.html: блоки в обёртках, как их рисует Тильда, плюс правило ссылок из custom.css сайта.
const preview = `<!doctype html>\n<html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Работа с темой отношений: проверка блоков T123</title>\n<link rel="stylesheet" href="../../academy-base/v1.css"><!-- на сайте v1 лежит в custom.css Тильды -->
<style>/* как в custom.css на modern-psy.ru */ a { color: inherit !important; } body { margin: 0; background: #f5f5f5; }</style></head><body><div id="allrecords">\n${blocks.map(block => `<div class="t-rec"><div class="t123"><div class="t-container_100"><div class="t-width t-width_100">\n${block}</div></div></div></div>\n`).join('')}</div></body></html>\n`;
await fs.writeFile(new URL('preview.html', out), preview);
await fs.writeFile(new URL('manifest.json', out), JSON.stringify(files, null, 2) + '\n');
console.log(`Готово: ${sections.length} секций и блок цены, ${files.length} блоков T123, каждый меньше ${LIMIT} символов.`);
for (const file of files) console.log(`  ${file.file}  ${file.characters}`);
