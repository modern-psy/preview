// Сборка блоков T123 для Тильды: один T123 = одна секция, стили и скрипты отдельными блоками.
// Запуск из apps/preview: node rodbt/build.mjs && node rodbt/build-tilda.mjs
// Вход: index.html, style.css, script.js (результат build.mjs). Выход: tilda/*.html, tilda/preview.html, tilda/manifest.json.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root = new URL('./', import.meta.url);
const out = new URL('tilda/', root);
const SLUG = 'rodbt-lvl1';
const HOOK = `data-${SLUG}-part`;
const LIMIT = 65000;
const read = name => fs.readFile(new URL(name, root), 'utf8');

const source = await read('index.html');
const css = await read('style.css');
const js = await read('script.js');

// Секции верхнего уровня внутри <main>: разметка переносится дословно.
const main = source.match(/<main[^>]*>([\s\S]*)<\/main>/);
if (!main) throw new Error('index.html: не найден <main>');
const sections = [];
const pattern = /<section\b[\s\S]*?<\/section>/g;
for (const match of main[1].matchAll(pattern)) {
  if ((match[0].match(/<section\b/g) || []).length !== 1) throw new Error('Вложенные <section> не поддерживаются');
  sections.push(match[0]);
}
const titles = {
  hero: 'Первый экран и особенности программы',
  strategy: 'Когда нужна другая стратегия',
  'course-audience': 'Кому подходит этот курс',
  level: 'Это первый уровень РО ДБТ',
  highlights: 'Что делает курс особенным',
  foundation: 'Ваши навыки после курса',
  instructor: 'Ваш инструктор',
  learning: 'Как вы будете учиться',
  program: 'Программа курса',
  documents: 'Документы после окончания обучения',
  'academy-showcase': 'Об Академии',
  pricing: 'Стоимость обучения (CMS)',
  'lead-form': 'Форма заявки',
  faq: 'Ответы на популярные вопросы',
};
if (sections.length !== Object.keys(titles).length) throw new Error(`Ожидалось ${Object.keys(titles).length} секций, найдено ${sections.length}`);

await fs.mkdir(out, {recursive: true});
for (const name of await fs.readdir(out)) if (/^\d\d-.*\.html$|^preview\.html$|^manifest\.json$/.test(name)) await fs.rm(new URL(name, out));
const files = [];
const write = async (name, text, title, placement) => {
  if (text.length >= LIMIT) throw new Error(`${name}: ${text.length} символов, лимит T123 ${LIMIT}`);
  await fs.writeFile(new URL(name, out), text);
  files.push({file: name, title, placement, characters: text.length, sha256: createHash('sha256').update(text).digest('hex')});
  return text;
};

// Подключения из <head> (шрифты, CDN-стили) один раз на страницу, в первом блоке стилей.
const links = [...source.matchAll(/<link rel="(?:preconnect|stylesheet)"[^>]*>/g)].map(m => m[0]).filter(link => !link.includes('./style.css') && !link.includes('rel="icon"'));
// Стили режем по файлам-источникам, чтобы каждый T123 был меньше лимита.
const cssParts = css.split(/\n(?=\/\* === )/);
const cssChunks = [];
for (const part of cssParts) {
  const last = cssChunks[cssChunks.length - 1];
  if (last && last.length + part.length + 1 < LIMIT - 4000) cssChunks[cssChunks.length - 1] = `${last}\n${part}`;
  else cssChunks.push(part);
}
const blocks = [];
let index = 0;
for (const [i, chunk] of cssChunks.entries()) {
  const head = i === 0 ? `${links.join('\n')}\n` : '';
  const tail = i === cssChunks.length - 1 ? `\n/* Обёртки отдельных секций не должны получать высоту целого экрана. */\n.academy-page[${HOOK}] { min-height: 0; height: auto; }\n` : '';
  const name = `${String(index++).padStart(2, '0')}-styles-${i + 1}.html`;
  blocks.push(await write(name, `<!-- ОБЩИЕ СТИЛИ ${i + 1}/${cssChunks.length}. Один раз на странице, до всех секций. Отступы T123 сверху и снизу: 0. -->\n${head}<style>\n${chunk.trim()}${tail}</style>\n`, `Общие стили ${i + 1}/${cssChunks.length}`, 'STYLE'));
}
for (const [i, markup] of sections.entries()) {
  const slug = markup.match(/class="section_([a-z-]+)/)[1];
  const title = titles[slug];
  if (!title) throw new Error(`Нет названия для секции ${slug}`);
  const anchor = i === 0 ? ' id="main-content" tabindex="-1"' : '';
  const name = `${String(index++).padStart(2, '0')}-${slug}.html`;
  blocks.push(await write(name, `<!-- СЕКЦИЯ ${String(i + 1).padStart(2, '0')}: ${title}. Вставить целиком в отдельный T123 с нулевыми отступами. -->\n<div class="main-wrapper academy-page ${SLUG}-page" ${HOOK}="${slug}"${anchor} data-academy-anchor-scroll>\n${markup}\n</div>\n`, title, 'BODY'));
}
// Скрипты: CDN-библиотеки, затем общий runtime, который ждёт готовности DOM и видит все секции страницы.
const external = [...source.matchAll(/<script src="(https:[^"]+)" defer><\/script>/g)].map(m => `<script src="${m[1]}"></script>`);
const jsParts = js.split(/\n(?=\/\* === )/);
const jsChunks = [];
for (const part of jsParts) {
  const last = jsChunks[jsChunks.length - 1];
  if (last && last.length + part.length + 1 < LIMIT - 1500) jsChunks[jsChunks.length - 1] = `${last}\n${part}`;
  else jsChunks.push(part);
}
for (const [i, chunk] of jsChunks.entries()) {
  const name = `${String(index++).padStart(2, '0')}-scripts-${i + 1}.html`;
  const head = i === 0 ? `${external.join('\n')}\n` : '';
  const runtime = `<script>\n(() => {\nconst initialize = () => {\n${chunk.trim()}\n};\nif (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, {once: true});\nelse initialize();\n})();\n</script>\n`;
  blocks.push(await write(name, `<!-- ОБЩИЕ СКРИПТЫ ${i + 1}/${jsChunks.length}. Последние T123, после всех секций и нативной формы Tilda, по порядку. -->\n${head}${runtime}`, `Общие скрипты ${i + 1}/${jsChunks.length}`, 'FOOTER'));
}

// Проверки: локальные ссылки, сохранность и уникальность id, целостность якорей.
const all = blocks.join('\n');
if (/\.\.\/web-academy|src="assets\/|url\((['"]?)(\.\/|assets\/)|localhost|127\.0\.0\.1/.test(all)) throw new Error('В блоках остались локальные ссылки');
const ids = text => [...text.matchAll(/(?<![\w-])id="([^"]+)"/g)].map(m => m[1]);
const originalIds = ids(source);
const exportIds = ids(blocks.filter(b => b.startsWith('<!-- СЕКЦИЯ')).join(''));
if (originalIds.sort().join() !== exportIds.sort().join()) throw new Error('Набор id в блоках не совпадает с index.html');
if (new Set(exportIds).size !== exportIds.length) throw new Error('Повторяющиеся id в блоках');
for (const link of all.matchAll(/href="#([a-z][a-z0-9-]*)"/g)) if (!exportIds.includes(link[1])) throw new Error(`Якорь без цели: #${link[1]}`);

const preview = `<!doctype html>\n<html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Первый уровень РО ДБТ — проверка блоков T123</title></head><body><div id="allrecords">\n${blocks.map(block => `<div class="t-rec"><div class="t123"><div class="t-container_100"><div class="t-width t-width_100">\n${block}</div></div></div></div>\n`).join('')}</div></body></html>\n`;
await fs.writeFile(new URL('preview.html', out), preview);
await fs.writeFile(new URL('manifest.json', out), JSON.stringify(files, null, 2) + '\n');
console.log(`Готово: ${sections.length} секций, ${cssChunks.length} блока стилей, ${jsChunks.length} блока скриптов; каждый T123 меньше ${LIMIT} символов.`);
for (const file of files) console.log(`  ${file.file}  ${file.characters}`);
