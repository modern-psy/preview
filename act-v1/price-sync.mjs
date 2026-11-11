// Блок цены на /act-v1 — тот же, что сейчас стоит на modern-psy.ru/act (T123 rec4766225501).
// Источник: apps/tilda/pricing-auto/act.html и act-ld.html (микроразметка курса). Свои цены, сценарий
// и пункты блок не меняет: потоки и цены он сам подтягивает из CMS при загрузке.
// Скрипт переносит их в index.html между метками price:start / price:end и price-ld:start / price-ld:end.
// Что меняется при переносе (только обвязка, не содержимое):
//   • убирается шапка-комментарий генератора и ссылки на Google Fonts — шрифт уже есть из стилей v1;
//   • у секции появляется якорь id="price";
//   • фон секции #f5f5ff → #f5f5f5, как у всей страницы; отступы задаёт page.css, раздел «14. Стоимость».
// Запуск из apps/preview: node act-v1/price-sync.mjs
import fs from 'node:fs/promises';

const here = new URL('./', import.meta.url);
const source = new URL('../../tilda/pricing-auto/', import.meta.url);
const [block, ld] = await Promise.all(['act.html', 'act-ld.html'].map(name => fs.readFile(new URL(name, source), 'utf8')));

const code = block
  .replace(/^<!--[\s\S]*?-->\s*/, '')
  .replace(/<link rel="preconnect" href="https:\/\/fonts\.(googleapis|gstatic)\.com"[^>]*>\s*/g, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, '')
  .replace(/<section class="price-auto_component pa-r" ([^>]*?)style="[^"]*"/, '<section class="price-auto_component pa-r" id="price" $1style="--pa-section-background: #f5f5f5"')
  .trim();
if (/fonts\.googleapis/.test(code)) throw new Error('в блоке цены осталась ссылка на Google Fonts');
if (!code.includes('id="price"')) throw new Error('не нашёлся открывающий тег секции цены');
const ldCode = ld.replace(/^<!--[\s\S]*?-->\s*/, '').trim();

const indexUrl = new URL('index.html', here);
let index = await fs.readFile(indexUrl, 'utf8');
const put = (name, body) => {
  const pattern = new RegExp(`(<!-- ${name}:start[^>]*-->)[\\s\\S]*?(<!-- ${name}:end -->)`);
  if (!pattern.test(index)) throw new Error(`index.html: нет меток ${name}:start и ${name}:end`);
  index = index.replace(pattern, (_, start, end) => `${start}\n${body}\n${end}`);
};
put('price', code);
put('price-ld', ldCode);
await fs.writeFile(indexUrl, index);
console.log(`блок цены перенесён: ${code.length} символов, микроразметка ${ldCode.length}`);
