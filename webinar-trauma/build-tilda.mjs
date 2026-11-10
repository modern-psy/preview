// Сборка блоков T123 для Тильды: один T123 = одна секция, стили и скрипты отдельными блоками.
// По образцу webinar-rodbt/build-tilda.mjs (вебинары на общих стилях v1).
// Запуск из apps/preview: node webinar-trauma/build-tilda.mjs
// Вход: index.html, page.css, page.js (их и правим). Выход: tilda/*.html, tilda/preview.html, tilda/manifest.json.
// Файлы в tilda/ руками не править: при следующей сборке они перезапишутся.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root = new URL('./', import.meta.url);
const out = new URL('tilda/', root);
const LIMIT = 65000; // у блока T123 потолок около 65 000 символов
const read = name => fs.readFile(new URL(name, root), 'utf8');
const BOTHELP_LOADER = 'https://main.bothelp.io/w/widget-button.js';
const FORM_NAME = 'webinar-trauma'; // 🟡 условное имя формы Тильды, ждём подтверждения Дарьи

const source = await read('index.html');
const css = await read('page.css');
const js = await read('page.js');

// Картинки должны быть с CDN: локальные файлы в Тильду не переносятся (правило no-inline-local-webp).
// Ловим и относительные пути (./, img/), и пути от корня превью (/webinar-trauma/…, /academy-base/… в разметке секций).
const local = [
  ...source.matchAll(/(?:src|href)="(\.\/(?!page\.(?:css|js))[^"]+|img\/[^"]+)"/g),
  ...css.matchAll(/url\((['"]?)(\.\/|img\/|\/)[^)]*\)/g),
];
if (local.length) throw new Error(`Локальные файлы: ${local.map(m => m[1] || m[0]).join(', ')}. Нужны ссылки на CDN (S3).`);

// Имя формы Тильды, через которую уходят заявки, должно совпадать с разметкой.
const formName = source.match(/data-tilda-form-name="([^"]+)"/)?.[1];
if (formName !== FORM_NAME) throw new Error(`data-tilda-form-name="${formName}", ожидалось ${FORM_NAME}`);

// Виджет BotHelp: пока номера нет, загрузчик в пакет не ставим, и на странице сразу видна запасная форма.
const widgetId = source.match(/data-bh-widget-id="([^"]*)"/)?.[1] ?? '';

// Содержимое обёртки .wa внутри <main class="tr-page">: секции идут подряд.
const main = source.match(/<main class="tr-page"[^>]*>\s*<div class="wa" lang="ru" data-academy="1">([\s\S]*)<\/div>\s*<\/main>/);
if (!main) throw new Error('index.html: не найден <main class="tr-page"> с обёрткой .wa data-academy="1"');
const body = main[1];
const sections = [...body.matchAll(/<section\b[\s\S]*?<\/section>/g)].map(m => m[0]);
const titles = {
  hero: 'Первый экран',
  pain: 'Клиент пришёл с последствиями тяжёлого события (мысли психолога)',
  cases: 'Разбор трёх случаев (тёмная плашка)',
  results: 'Что вы получите (схемы с анимацией)',
  audience: 'Кому подойдёт вебинар',
  program: 'Что будет на вебинаре (тёмная плашка)',
  speaker: 'Ведущий вебинара',
  academy: 'Витрина Академии',
  ratings: '98 % студентов рекомендуют, оценки на агрегаторах',
  signup: 'Запись на вебинар: кнопки BotHelp и запасная форма',
  faq: 'Ответы на вопросы',
};
if (sections.length !== Object.keys(titles).length) throw new Error(`Ожидалось ${Object.keys(titles).length} секций, найдено ${sections.length}`);
for (const markup of sections) if ((markup.match(/<section\b/g) || []).length !== 1) throw new Error('Вложенные <section> не поддерживаются');
for (const markup of sections) if (/(?:src|href)="\/(?!\/)/.test(markup)) throw new Error('В секции путь от корня превью: в Тильде он не откроется');

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
//    на сайте они уже в custom.css Тильды.
//    Стили около 63 000 символов, это у самого потолка T123, поэтому делим их на два блока
//    по границе раздела, ближайшей к середине. Порядок блоков важен: сначала часть 1, потом часть 2.
const cssText = css.trim();
const cuts = [...cssText.matchAll(/\n(?=\/\* =====)/g)].map(m => m.index);
const cut = cuts.sort((a, b) => Math.abs(a - cssText.length / 2) - Math.abs(b - cssText.length / 2))[0];
if (!cut) throw new Error('page.css: не нашлась граница раздела для деления стилей');
await write('styles-1', `<!-- СТИЛИ СТРАНИЦЫ, ЧАСТЬ 1. Первый T123 страницы, до всех секций. Отступы T123 сверху и снизу: 0. -->\n<style>\n${cssText.slice(0, cut).trim()}\n</style>\n`, 'Стили страницы, часть 1', 'STYLE');
await write('styles-2', `<!-- СТИЛИ СТРАНИЦЫ, ЧАСТЬ 2. Сразу после части 1, до всех секций. Отступы T123 сверху и снизу: 0. -->\n<style>\n${cssText.slice(cut).trim()}\n</style>\n`, 'Стили страницы, часть 2', 'STYLE');

// 2. Секции: каждая в своей обёртке .tr-page > .wa с меткой v1, как на превью.
const wrap = (id, inner) => `<div class="tr-page" data-tr-part="${id}">${inner}</div>\n`;
for (const markup of sections) {
  const id = markup.match(/<section id="([a-z-]+)"/)[1];
  const title = titles[id];
  if (!title) throw new Error(`Нет названия для секции ${id}`);
  await write(id, `<!-- СЕКЦИЯ ${id}: ${title}. Вставить целиком в отдельный T123 с нулевыми отступами. -->\n${wrap(id, `<div class="wa" lang="ru" data-academy="1">\n${markup}\n</div>`)}`, title, 'BODY');
}

// 3. Скрипт страницы: появление схем, FAQ, запись через BotHelp с запасной формой.
//    Загрузчик BotHelp идёт сразу за ним, только когда известен номер виджета.
const loader = widgetId
  ? `<script src="${BOTHELP_LOADER}" defer></script>\n`
  : `<!-- Загрузчика BotHelp нет: номер виджета ещё не пришёл, поэтому на странице сразу видна запасная форма.\n     Когда номер придёт: вписать его в data-bh-widget-id в index.html и пересобрать пакет. -->\n`;
await write('scripts', `<!-- СКРИПТ СТРАНИЦЫ${widgetId ? ' И ЗАГРУЗЧИК BOTHELP' : ''}. После всех секций и после блока с формой Тильды «${FORM_NAME}». -->\n<script>\n(() => {\nconst init = () => {\n${js.trim()}\n};\nif (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once: true});\nelse init();\n})();\n</script>\n${loader}`, widgetId ? 'Скрипт страницы и загрузчик BotHelp' : 'Скрипт страницы', 'FOOTER');

// 4. Микроразметка: организация, событие (вебинар) и FAQ.
const ld = [...source.matchAll(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g)].map(m => m[0]);
for (const type of ['"EducationalOrganization"', '"EducationEvent"', '"FAQPage"']) if (!ld.some(block => block.includes(type))) throw new Error(`В index.html нет микроразметки ${type}`);
for (const block of ld) JSON.parse(block.replace(/^<script[^>]*>|<\/script>$/g, ''));
await write('seo', `<!-- МИКРОРАЗМЕТКА: организация, вебинар (EducationEvent) и FAQ. Отдельный T123 в конце страницы.\n     Дата и время вебинара здесь те же, что в первом экране и в карточке записи: меняются вместе. -->\n${ld.join('\n')}\n`, 'Микроразметка', 'FOOTER');

// Проверки: локальные ссылки, сохранность и уникальность id, целостность якорей.
const all = blocks.join('\n');
if (/(?:src|href)="\.\/|url\((['"]?)\.\/|localhost|127\.0\.0\.1|twc1\.net/.test(all)) throw new Error('В блоках остались локальные ссылки или адрес превью');
if (/fonts\.googleapis/.test(all)) throw new Error('В блоках осталась ссылка на Google Fonts');
const ids = text => [...text.matchAll(/(?<![\w-])id="([^"]+)"/g)].map(m => m[1]);
const sourceIds = ids(body).sort().join();
const exportIds = ids(blocks.filter(b => b.startsWith('<!-- СЕКЦИЯ')).join(''));
if (sourceIds !== [...exportIds].sort().join()) throw new Error('Набор id в блоках не совпадает с index.html');
if (new Set(exportIds).size !== exportIds.length) throw new Error('Повторяющиеся id в блоках');
for (const link of all.matchAll(/href="#([a-z][a-z0-9-]*)"/g)) if (!exportIds.includes(link[1])) throw new Error(`Якорь без цели: #${link[1]}`);

// preview.html: блоки в обёртках, как их рисует Тильда, плюс правило ссылок из custom.css сайта.
// Формы Тильды на превью нет: запасная форма покажет «Отправка сейчас недоступна».
const preview = `<!doctype html>\n<html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Клиент пришёл с последствиями травмы: проверка блоков T123</title>\n<link rel="stylesheet" href="../../academy-base/v1.css"><!-- на сайте v1 лежит в custom.css Тильды -->
<style>/* как в custom.css на modern-psy.ru */ a { color: inherit !important; } body { margin: 0; background: #f5f5f5; }</style></head><body><div id="allrecords">\n${blocks.map(block => `<div class="t-rec"><div class="t123"><div class="t-container_100"><div class="t-width t-width_100">\n${block}</div></div></div></div>\n`).join('')}</div></body></html>\n`;
await fs.writeFile(new URL('preview.html', out), preview);
await fs.writeFile(new URL('manifest.json', out), JSON.stringify(files, null, 2) + '\n');
console.log(`Готово: ${sections.length} секций, ${files.length} блоков T123, каждый меньше ${LIMIT} символов.`);
console.log(widgetId ? `Виджет BotHelp: ${widgetId}` : 'Виджета BotHelp нет: загрузчик не добавлен, на странице сразу запасная форма.');
for (const file of files) console.log(`  ${file.file}  ${file.characters}`);
