// Сборка блоков T123 для Тильды: один T123 = одна секция, стили и скрипты отдельными блоками.
// По образцу ro-dbt-path/build-tilda.mjs.
// Запуск из apps/preview: node rodbt-lvl2/build-tilda.mjs
// Вход: index.html, page.css, page.js (их и правим), request-form.css и request-form.js (копии общего компонента).
// Блок цены в пакет НЕ идёт: на странице Тильды он уже стоит (rec5926295701) и остаётся как есть;
// в index.html его копия между метками price-block:start/end только для превью.
// Выход: tilda/*.html, tilda/preview.html, tilda/manifest.json.
// Файлы в tilda/ руками не править: при следующей сборке они перезапишутся.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root = new URL('./', import.meta.url);
const out = new URL('tilda/', root);
const LIMIT = 65000; // у блока T123 потолок около 65 000 символов
const read = name => fs.readFile(new URL(name, root), 'utf8');
// Якоря, цель которых — не наши секции, а блок, уже стоящий на странице: секция блока цены.
const EXTERNAL_TARGETS = ['rec2220051871'];

const source = await read('index.html');
const css = await read('page.css');
const js = await read('page.js');
const requestFormCss = await read('request-form.css');
const requestFormJs = await read('request-form.js');
// В Тильду скрипт формы идёт без комментариев (request-form.md). Убираем только комментарии на отдельных строках;
// результат проверяется ниже разбором через new Function.
const stripComments = code => code
  .replace(/^[ \t]*\/\*(?:(?!\*\/)[\s\S])*\*\/[ \t]*\n/gm, '')
  .replace(/^[ \t]*\/\/.*\n/gm, '');
const requestFormJsTilda = stripComments(requestFormJs).trim();
new Function(requestFormJsTilda);

// Картинки должны быть с CDN: локальные файлы в Тильду не переносятся.
const local = [...source.matchAll(/(?:src|href)="(\.\/(?!(?:page|request-form)\.(?:css|js))[^"]+|img\/[^"]+)"/g), ...(css + requestFormCss).matchAll(/url\((['"]?)(\.\/|img\/)[^)]*\)/g)];
if (local.length) throw new Error(`Локальные файлы: ${local.map(m => m[1] || m[0]).join(', ')}. Нужны ссылки на CDN (S3).`);

const main = source.match(/<main class="main-wrapper academy-page rodbt-lvl2-page"[^>]*>([\s\S]*)<\/main>/);
if (!main) throw new Error('index.html: не найден <main class="main-wrapper academy-page rodbt-lvl2-page">');
// Копию блока цены вырезаем: в пакет она не идёт.
const body = main[1].replace(/<!-- price-block:start -->[\s\S]*?<!-- price-block:end -->/, '');
const sections = [...body.matchAll(/<section\b[\s\S]*?<\/section>/g)].map(m => m[0]);
const titles = {
  hero: 'Первый экран',
  etapy: 'Дорожная карта, четыре этапа (якорь #etapy)',
  programma: 'Программа: четыре части по три блока (якорь #programma)',
  position: 'Почему по литературе учиться недостаточно',
  included: 'Что входит в обучение в АСП',
  partner: 'Radically Open Ltd — Институт Линча',
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
  blocks.push({slug, text});
};

// 1. Стили страницы. Общие стили лендингов v1 и их шрифт в пакет НЕ идут: на сайте они уже в custom.css Тильды.
await write('styles', `<!-- ОБЩИЕ СТИЛИ. Первый T123 страницы, до всех секций. Отступы T123 сверху и снизу: 0. -->\n<style>\n${css.trim()}\n</style>\n`, 'Общие стили', 'STYLE');

// 2. Секции: каждая в своей обёртке main-wrapper academy-page rodbt-lvl2-page с data-academy="1", как <main> на превью.
const wrap = (id, inner) => `<div class="main-wrapper academy-page rodbt-lvl2-page" data-academy="1" data-lvl2-part="${id}">${inner}</div>\n`;
for (const markup of sections) {
  const id = markup.match(/<section\b[^>]*\bid="([a-z-]+)"/)[1];
  const title = titles[id];
  if (!title) throw new Error(`Нет названия для секции ${id}`);
  const style = id === 'signup' ? `<style>\n${requestFormCss.trim()}\n</style>\n` : '';
  const where = id === 'signup' ? ' Ставится ПОСЛЕ блока цены rec5926295701.' : id === 'faq' ? ' Ставится ДО нативной формы rec2220076591.' : '';
  await write(id, `<!-- СЕКЦИЯ ${id}: ${title}. Вставить целиком в отдельный T123 с нулевыми отступами.${where} -->\n${style}${wrap(id, `\n${markup}\n`)}`, title, 'BODY');
}

// 3. Скрипт страницы: вопросы и ответы, номер Метрики для формы. Ждёт, пока все секции появятся в документе.
await write('scripts', `<!-- СКРИПТ СТРАНИЦЫ. После всех секций и после блока с формой Тильды. -->\n<script>\n(() => {\nconst init = () => {\n${js.trim()}\n};\nif (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once: true});\nelse init();\n})();\n</script>\n`, 'Скрипт страницы', 'FOOTER');

// 4. Скрипт формы заявки: после блока с формой Тильды и после скрипта страницы, без комментариев.
await write('request-form', `<!-- СКРИПТ ФОРМЫ ЗАЯВКИ (общий компонент request-form). После блока с формой Тильды, сразу за скриптом страницы. -->\n<script>\n${requestFormJsTilda}\n</script>\n`, 'Скрипт формы заявки', 'FOOTER');

// 5. Микроразметка FAQ (на старой странице вопросов и разметки не было).
const faqLd = [...source.matchAll(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g)].map(m => m[0]).filter(block => block.includes('"FAQPage"'));
if (faqLd.length !== 1) throw new Error('В index.html не найдена микроразметка FAQPage');
await write('seo', `<!-- МИКРОРАЗМЕТКА FAQ. Отдельный T123 в конце страницы. Тексты совпадают с секцией faq. -->\n${faqLd[0]}\n`, 'Микроразметка FAQ', 'FOOTER');

// Проверки: локальные ссылки, сохранность и уникальность id, целостность якорей, имя нативной формы.
const all = blocks.map(b => b.text).join('\n');
if (/(?:src|href)="\.\/|url\((['"]?)\.\/|localhost|127\.0\.0\.1/.test(all)) throw new Error('В блоках остались локальные ссылки');
const ids = text => [...text.matchAll(/(?<![\w-])id="([^"]+)"/g)].map(m => m[1]);
const sectionBlocks = blocks.filter(b => b.text.startsWith('<!-- СЕКЦИЯ')).map(b => b.text).join('');
const exportIds = ids(sectionBlocks);
if (ids(body).sort().join() !== [...exportIds].sort().join()) throw new Error('Набор id в блоках не совпадает с index.html');
if (new Set(exportIds).size !== exportIds.length) throw new Error('Повторяющиеся id в блоках');
for (const link of all.matchAll(/href="#([a-z][a-z0-9-]*)"/g)) if (!exportIds.includes(link[1]) && !EXTERNAL_TARGETS.includes(link[1])) throw new Error(`Якорь без цели: #${link[1]}`);
if (!all.includes('data-tilda-form-name="rodbt-lvl2"')) throw new Error('Форма заявки должна вести в нативную форму rodbt-lvl2');
if (/·/.test(sectionBlocks.replace(/<!--[\s\S]*?-->/g, ''))) throw new Error('В видимом тексте осталась средняя точка «·»');

// preview.html: блоки в обёртках, как их рисует Тильда, плюс правило ссылок из custom.css сайта.
// Блок цены вставлен на своё место (между партнёрством и формой), как он стоит на странице.
const priceBlock = source.match(/<!-- price-block:start -->([\s\S]*?)<!-- price-block:end -->/)[1].trim();
const tildaRec = text => `<div class="t-rec"><div class="t123"><div class="t-container_100"><div class="t-width t-width_100">\n${text}</div></div></div></div>\n`;
const previewBlocks = blocks.flatMap(b => b.slug === 'signup' ? [`<!-- уже на странице: блок цены rec5926295701 -->\n${priceBlock}\n`, b.text] : [b.text]);
const preview = `<!doctype html>\n<html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Второй уровень РО ДБТ: проверка блоков T123</title>\n<link rel="stylesheet" href="../../academy-base/v1.css"><!-- на сайте v1 лежит в custom.css Тильды -->
<style>/* как в custom.css на modern-psy.ru */ a { color: inherit !important; } body { margin: 0; background: #f5f5f5; }</style></head><body><div id="allrecords">\n${previewBlocks.map(tildaRec).join('')}</div></body></html>\n`;
await fs.writeFile(new URL('preview.html', out), preview);
await fs.writeFile(new URL('manifest.json', out), JSON.stringify(files, null, 2) + '\n');
console.log(`Готово: ${sections.length} секций, ${files.length} блоков T123, каждый меньше ${LIMIT} символов.`);
for (const file of files) console.log(`  ${file.file}  ${file.characters}`);
