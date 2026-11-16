// Сборка главной для Тильды: один T123 = одна секция, стили и скрипт отдельными блоками.
// Запуск из apps/preview (после node glavnaya/build.mjs):
//   node glavnaya/build-tilda.mjs                 — пакет для Тильды, картинки только по ссылкам с S3 / CDN
//   node glavnaya/build-tilda.mjs --allow-local   — проверочная сборка, пока картинок нет на S3:
//                                                   локальные картинки берутся с превью modern-psy-preview-5a99.twc1.net
//   node glavnaya/build-tilda.mjs --without=teachers — пакет без секции (через запятую можно несколько):
//                                                   так главная ушла в Тильду 16.11.2026, пока нет свежих фото преподавателей
// Вход: index.html (собирает build.mjs), type.css, page.css, page.js, data/assets.json (ссылки на S3).
// Выход: glavnaya/tilda/*.html, tilda/preview.html, tilda/manifest.json. Файлы в tilda/ руками не править.
//
// Шапку сайта в пакет не кладём: на Тильде она подключается отдельной страницей-шапкой (apps/tilda/header).
// Штатные шапку и подвал Тильды не отключаем.
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';

const root = new URL('./', import.meta.url);
const out = new URL('tilda/', root);
const LIMIT = 65000; // у блока T123 потолок около 65 000 символов
const PREVIEW_HOST = 'https://modern-psy-preview-5a99.twc1.net/glavnaya/';
const allowLocal = process.argv.includes('--allow-local');
const without = ((process.argv.find(a => a.startsWith('--without=')) || '').split('=')[1] || '').split(',').filter(Boolean);
const read = name => fs.readFile(new URL(name, root), 'utf8');

const source = await read('index.html');
const typeCss = await read('type.css');
const pageCss = await read('page.css');
const js = await read('page.js');

// ---------- Картинки: локальные пути → ссылки на S3 из data/assets.json ----------
// Формат assets.json: { "img/door-start-person.webp": "https://s3.twcstorage.ru/asp-media/…", … }
const assets = existsSync(new URL('data/assets.json', root)) ? JSON.parse(await read('data/assets.json')) : {};
const missing = new Set();
const swap = text => text.replace(/(["'(])((?:\.\/)?img\/[^"')\s,]+)/g, (m, q, path) => {
  const key = path.replace(/^\.\//, '');
  if (assets[key]) return q + assets[key];
  missing.add(key);
  return q + (allowLocal ? PREVIEW_HOST + key : path);
});

// ---------- Секции верхнего уровня внутри <main> (внутри секций бывают вложенные <section>) ----------
const mainOpen = source.match(/<main\b([^>]*)>/);
if (!mainOpen) throw new Error('index.html: не найден <main>');
const mainAttrs = mainOpen[1];
const api = (mainAttrs.match(/data-api="([^"]+)"/) || [])[1];
if (!api) throw new Error('index.html: у <main> нет data-api');
const mainBody = source.slice(source.indexOf(mainOpen[0]) + mainOpen[0].length, source.indexOf('</main>'));
const sections = [];
{
  const re = /<section\b|<\/section>/g;
  let depth = 0, start = -1, m;
  while ((m = re.exec(mainBody))) {
    if (m[0] === '<section') { if (depth === 0) start = m.index; depth++; }
    else { depth--; if (depth === 0) sections.push(mainBody.slice(start, m.index + '</section>'.length)); }
  }
  if (depth !== 0) throw new Error('index.html: незакрытый <section>');
}
const titles = {
  'section_home-hero': ['hero', 'Первый экран: заголовок, факты, две двери, особенности'],
  'section_home-flagships': ['flagships', 'Популярные направления (каталог CMS)'],
  'section_home-last-chance': ['last-chance', 'Последний шанс (каталог CMS)'],
  'section_home-directions': ['directions', 'Все направления'],
  'section_home-free': ['free', 'Учиться бесплатно: события и мини-курсы'],
  'section_home-teachers': ['teachers', 'Кто у нас преподаёт'],
  'section_home-learning': ['learning', 'Как устроено обучение'],
  'section_home-beyond': ['beyond', 'Мы за живое общение'],
  'section_home-trust': ['trust', 'Нам доверяют: оценки, отзывы, партнёры'],
  'section_home-pick': ['pick', 'Поможем подобрать программу (форма)'],
  'section_home-faq': ['faq', 'Частые вопросы (в конце страницы)'],
};
const allParts = sections.map(markup => {
  const cls = (markup.match(/^<section\b[^>]*class="([^"\s]+)/) || [])[1];
  if (!titles[cls]) throw new Error(`Нет названия для секции ${cls}`);
  return {cls, slug: titles[cls][0], title: titles[cls][1], markup};
});
if (allParts.length !== Object.keys(titles).length) throw new Error(`Ожидалось ${Object.keys(titles).length} секций, найдено ${allParts.length}`);
for (const slug of without) if (!allParts.some(p => p.slug === slug)) throw new Error(`--without: нет секции «${slug}»`);
const parts = allParts.filter(p => !without.includes(p.slug));

// ---------- Вывод ----------
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

// 1. Стили: шрифт, типографика Web Academy и page.css. Длинный page.css делим на два блока по началу раздела 6.
const fontLinks = [...source.matchAll(/<link rel="(?:preconnect|stylesheet)"[^>]*>/g)].map(m => m[0])
  .filter(link => /fonts\.googleapis|fonts\.gstatic|s3\.twcstorage/.test(link));
const cut = pageCss.indexOf('/* ---------- 6. Преподаватели');
if (cut < 0) throw new Error('page.css: не найден раздел «6. Преподаватели» для деления стилей');
// Общий custom.css сайта красит все ссылки «a { color: inherit !important }». Ссылкам со своим цветом
// (кнопки, ссылки в карточках, бегущая строка курсов) возвращаем цвет тоже с !important.
const tildaFix = `
/* ===== Поправки под Тильду: цвета ссылок поверх custom.css сайта ===== */
.home-page a.home-button_component { color: var(--home-white) !important; }
.home-page a.home-button_component.is-light { color: var(--home-dark) !important; }
.home-page a.home-button_component.is-ghost { color: var(--home-white) !important; }
.home-page a.beyond-card_link { color: var(--home-accent) !important; }
.home-page .is-alumni a.beyond-card_link { color: var(--home-white) !important; }
.home-page a.door-ticker_link, .home-page a.teachers-panel_link { color: var(--home-text) !important; }
.home-page a.faq-home_support-link { color: var(--home-accent) !important; }
@media (hover: hover) and (pointer: fine) {
  .home-page a.beyond-card_link:hover { color: var(--home-accent-hover) !important; }
  .home-page .is-alumni a.beyond-card_link:hover { color: var(--home-on-dark-muted) !important; }
  .home-page a.door-ticker_link:hover { color: var(--home-soft-text) !important; }
  .home-page a.faq-home_support-link:hover { color: var(--home-accent-hover) !important; }
  .home-page .faq_answer a:hover { color: var(--home-accent) !important; }
}
/* Обёртка секции в T123: высоту не наследует */
.home-page[data-home-part] { min-height: 0; height: auto; }
`;
await write('styles-1', `<!-- ОБЩИЕ СТИЛИ, часть 1. Первый T123 страницы, до всех секций. Отступы T123 сверху и снизу: 0. -->\n${fontLinks.join('\n')}\n<style>\n${typeCss.trim()}\n${swap(pageCss.slice(0, cut)).trim()}\n</style>\n`, 'Общие стили, часть 1: шрифт, типографика, разделы 0–5', 'STYLE');
await write('styles-2', `<!-- ОБЩИЕ СТИЛИ, часть 2. Второй T123 страницы, сразу за первым. Отступы 0. -->\n<style>\n${swap(pageCss.slice(cut)).trim()}\n${tildaFix}</style>\n`, 'Общие стили, часть 2: разделы 6–10, наведение, поправки под Тильду', 'STYLE');

// 2. Секции: каждая в своей обёртке с data-home и адресом API. Скрипт страницы запускается на каждой обёртке
//    отдельно, а каталог из API скачивается один раз на всю страницу (общий window.__aspCatalogLoad).
const wrapAttrs = `class="main-wrapper academy-page home-page" data-home data-api="${api}"`;
for (const part of parts) {
  const note = part.slug === 'pick'
    ? ' Сразу ПОСЛЕ этого блока поставить нативную форму Тильды (см. README): заявка уходит в неё.'
    : '';
  await write(part.slug, `<!-- СЕКЦИЯ ${part.slug}: ${part.title}. Отдельный T123, отступы 0.${note} -->\n<div ${wrapAttrs} data-home-part="${part.slug}">\n${swap(part.markup)}\n</div>\n`, part.title, 'BODY');
}

// 3. Скрипт страницы: после всех секций и после формы Тильды. Сам ждёт DOMContentLoaded.
await write('scripts', `<!-- СКРИПТ СТРАНИЦЫ. После всех секций и после блока с формой Тильды. -->\n<script>\n${js.trim()}\n</script>\n`, 'Скрипт страницы', 'FOOTER');

// 4. Микроразметка: организация и сайт (JSON-LD из index.html).
const jsonLd = [...source.matchAll(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g)].map(m => m[0]);
if (!jsonLd.length) throw new Error('В index.html нет JSON-LD');
await write('seo', `<!-- МИКРОРАЗМЕТКА: организация и сайт. Отдельный T123 в конце страницы. -->\n${jsonLd.join('\n')}\n`, 'Микроразметка: организация и сайт', 'FOOTER');

// ---------- Проверки ----------
const all = blocks.join('\n');
if (!allowLocal && missing.size) throw new Error(`Нет ссылок на S3 для ${missing.size} картинок: ${[...missing].join(', ')}. Впишите их в data/assets.json или соберите с --allow-local для проверки.`);
if (/(?:src|href)="(?:\.\/|img\/)|url\((['"]?)(?:\.\/|img\/)|localhost|127\.0\.0\.1/.test(all)) throw new Error('В блоках остались локальные ссылки');
const ids = text => [...text.matchAll(/(?<![\w-])id="([^"]+)"/g)].map(m => m[1]);
const sourceIds = ids(parts.map(p => p.markup).join('')).sort().join();
const exportIds = ids(blocks.filter(b => b.startsWith('<!-- СЕКЦИЯ')).join(''));
if (sourceIds !== [...exportIds].sort().join()) throw new Error('Набор id в блоках не совпадает с index.html');
if (new Set(exportIds).size !== exportIds.length) throw new Error('Повторяющиеся id в блоках');
for (const link of all.matchAll(/href="#([a-z][a-z0-9-]*)"/g)) if (!exportIds.includes(link[1])) throw new Error(`Якорь без цели: #${link[1]}`);
const formName = (all.match(/data-tilda-form-name="([^"]*)"/) || [])[1];

// preview.html: блоки в обёртках, как их рисует Тильда, плюс правило ссылок из custom.css сайта.
const preview = `<!doctype html>\n<html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Главная: проверка блоков T123</title>
<style>/* как в custom.css на modern-psy.ru */ body { margin: 0; background: #f5f5f5; } a { color: inherit !important; }</style></head><body><div id="allrecords">\n${blocks.map(block => `<div class="t-rec"><div class="t123"><div class="t-container_100"><div class="t-width t-width_100">\n${block}</div></div></div></div>\n`).join('')}</div></body></html>\n`;
await fs.writeFile(new URL('preview.html', out), preview);
await fs.writeFile(new URL('manifest.json', out), JSON.stringify(files, null, 2) + '\n');

console.log(`Готово: ${parts.length} секций, ${files.length} блоков T123, каждый меньше ${LIMIT} символов.`);
if (without.length) console.warn(`Без секций: ${without.join(', ')}. Полный пакет — сборка без --without.`);
for (const file of files) console.log(`  ${file.file.padEnd(22)} ${String(file.characters).padStart(6)}  ${file.placement}`);
if (missing.size) console.warn(`${allowLocal ? 'Проверочная сборка: ' : ''}без ссылок на S3 ${missing.size} картинок (${[...missing].join(', ')})${allowLocal ? ' — взяты с превью' : ''}.`);
if (!formName) console.warn('Имя формы Тильды не задано: data-tilda-form-name пустой. На сайте заявка не уйдёт, пока его нет.');
