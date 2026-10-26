// Сборка блоков T123 для Тильды: один T123 = одна секция, стили и скрипты отдельными блоками.
// Запуск из apps/preview: node psihiatriya-dlya-psihologov/build-tilda.mjs
// Вход: index.html, page.css, page.js (их и правим). Выход: tilda/*.html, tilda/preview.html, tilda/manifest.json.
// Файлы в tilda/ руками не править: при следующей сборке они перезапишутся.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root = new URL('./', import.meta.url);
const out = new URL('tilda/', root);
const SLUG = 'psihiatriya-dlya-psihologov';
const LIMIT = 65000; // у блока T123 потолок около 65 000 символов
const read = name => fs.readFile(new URL(name, root), 'utf8');

const source = await read('index.html');
const css = await read('page.css');
// Стили общих компонентов Web Academy («Почему выбирают нас», «98 % студентов»): идут внутри блока секции academy,
// иначе блок общих стилей не влезает в лимит T123.
const academyCss = await read('academy.css');
const js = await read('page.js');

// Картинки должны быть с CDN: локальные файлы в Тильду не переносятся.
const local = [...source.matchAll(/(?:src|href)="(\.\/(?!(?:page|academy)\.(?:css|js))[^"]+|img\/[^"]+)"/g), ...(css + academyCss).matchAll(/url\((['"]?)(\.\/|img\/)[^)]*\)/g)];
if (local.length) throw new Error(`Локальные файлы: ${local.map(m => m[1] || m[0]).join(', ')}. Нужны ссылки на CDN (S3).`);

// Секции верхнего уровня внутри обёртки .wa: разметка переносится дословно.
const wa = source.match(/<div class="wa" lang="ru">([\s\S]*)<\/div>\s*<\/main>/);
if (!wa) throw new Error('index.html: не найдена обёртка <div class="wa">');
const sections = [...wa[1].matchAll(/<section\b[\s\S]*?<\/section>/g)].map(m => m[0]);
const titles = {
  hero: 'Первый экран и факты о курсе',
  situations: 'Когда привычного понимания запроса уже недостаточно',
  idea: 'Зачем психологу знания психиатрии, лист умений заполняется при прокрутке',
  audience: 'Кому подойдёт программа',
  format: 'Шесть шагов от наблюдения к плану действий',
  program: 'Программа курса',
  teacher: 'Преподаватель курса',
  documents: 'Удостоверение о повышении квалификации',
  academy: 'Почему выбирают нас, со стилями компонента',
  ratings: '98 % студентов рекомендуют обучение',
  price: 'Стоимость обучения и гибкие условия оплаты',
  signup: 'Форма заявки',
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

// 1. Стили: шрифты и page.css целиком, плюс поправки под сайт.
const links = [...source.matchAll(/<link rel="(?:preconnect|stylesheet)"[^>]*>/g)].map(m => m[0]).filter(link => !link.includes('href="./') && !link.includes('/academy-base/'));
// Общие стили лендингов v1 (/academy-base/v1.css) и их шрифт в пакет НЕ идут: на сайте они уже в custom.css Тильды.
const tildaFix = `
/* ===== Поправки под Тильду =====
   Общий custom.css сайта красит все ссылки «a { color: inherit !important }», и у ссылок-кнопок пропадает текст.
   Возвращаем их цвета с !important. */
.psy-page a.hb.is-main { color: var(--hr-main-ink) !important; }
.psy-page a.hb.is-glass { color: var(--hr-glass-ink) !important; }
.psy-page a.wa-btn.is-accent, .psy-page a.wa-btn.is-glass { color: #fff !important; }
.psy-page a.wa-btn.is-light, .psy-page a.wa-btn.is-grey { color: var(--wa-ink) !important; }
`;
await write('styles', `<!-- ОБЩИЕ СТИЛИ. Первый T123 страницы, до всех секций. Отступы T123 сверху и снизу: 0. -->\n${links.join('\n')}\n<style>\n${css.trim()}\n${tildaFix}</style>\n`, 'Общие стили', 'STYLE');

// 2. Секции: каждая в своей обёртке .psy-page > .wa, как на превью.
for (const markup of sections) {
  const id = markup.match(/<section id="([a-z-]+)"/)[1];
  const title = titles[id];
  if (!title) throw new Error(`Нет названия для секции ${id}`);
  const style = id === 'academy' ? `<style>\n${academyCss.trim()}\n</style>\n` : '';
  await write(id, `<!-- СЕКЦИЯ ${id}: ${title}. Вставить целиком в отдельный T123 с нулевыми отступами. -->\n${style}<div class="psy-page" data-academy="1" data-psy-part="${id}"><div class="wa" lang="ru">\n${markup}\n</div></div>\n`, title, 'BODY');
}

// 3. Скрипт страницы: ждёт, пока все секции появятся в документе.
await write('scripts', `<!-- СКРИПТ СТРАНИЦЫ. После всех секций и после блока с формой Тильды. -->\n<script>\n(() => {\nconst init = () => {\n${js.trim()}\n};\nif (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once: true});\nelse init();\n})();\n</script>\n`, 'Скрипт страницы', 'FOOTER');

// 4. Микроразметка FAQ. Курс и организацию на сайте размечает блок микроразметки из генератора цен
//    (apps/preview/pricing, курс psychiatry-for-psy, цены из CMS), поэтому в пакет идёт только FAQPage:
//    иначе курс оказался бы размечен дважды. В index.html для превью остаются все три разметки.
const jsonLd = [...source.matchAll(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g)].map(m => m[0]);
if (jsonLd.length !== 3) throw new Error(`Ожидалось 3 блока JSON-LD, найдено ${jsonLd.length}`);
const faqLd = jsonLd.filter(block => block.includes('"FAQPage"'));
if (faqLd.length !== 1) throw new Error('В index.html не найдена микроразметка FAQPage');
await write('seo-faq', `<!-- МИКРОРАЗМЕТКА FAQ. Отдельный T123 в конце страницы. Курс и организацию размечает блок микроразметки из генератора цен, его не трогать. Тексты совпадают с блоком 11-faq. -->\n${faqLd[0]}\n`, 'Микроразметка FAQ', 'FOOTER');

// Проверки: локальные ссылки, сохранность и уникальность id, целостность якорей.
const all = blocks.join('\n');
if (/(?:src|href)="\.\/|url\((['"]?)\.\/|localhost|127\.0\.0\.1/.test(all)) throw new Error('В блоках остались локальные ссылки');
const ids = text => [...text.matchAll(/(?<![\w-])id="([^"]+)"/g)].map(m => m[1]);
const sourceIds = ids(wa[1]).sort().join();
const exportIds = ids(blocks.filter(b => b.startsWith('<!-- СЕКЦИЯ')).join(''));
if (sourceIds !== [...exportIds].sort().join()) throw new Error('Набор id в блоках не совпадает с index.html');
if (new Set(exportIds).size !== exportIds.length) throw new Error('Повторяющиеся id в блоках');
for (const link of all.matchAll(/href="#([a-z][a-z0-9-]*)"/g)) if (!exportIds.includes(link[1])) throw new Error(`Якорь без цели: #${link[1]}`);

// preview.html: блоки в обёртках, как их рисует Тильда, плюс правило ссылок из custom.css сайта.
const preview = `<!doctype html>\n<html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Психиатрия для психологов: проверка блоков T123</title>\n<link rel="stylesheet" href="../../academy-base/v1.css"><!-- на сайте v1 лежит в custom.css Тильды -->
<style>/* как в custom.css на modern-psy.ru */ a { color: inherit !important; }</style></head><body><div id="allrecords">\n${blocks.map(block => `<div class="t-rec"><div class="t123"><div class="t-container_100"><div class="t-width t-width_100">\n${block}</div></div></div></div>\n`).join('')}</div></body></html>\n`;
await fs.writeFile(new URL('preview.html', out), preview);
await fs.writeFile(new URL('manifest.json', out), JSON.stringify(files, null, 2) + '\n');
console.log(`Готово: ${sections.length} секций, ${files.length} блоков T123, каждый меньше ${LIMIT} символов.`);
for (const file of files) console.log(`  ${file.file}  ${file.characters}`);
