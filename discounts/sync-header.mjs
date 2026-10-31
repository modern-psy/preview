// Шапка сайта для превью страницы «Акции»: node discounts/sync-header.mjs (запускать из apps/preview)
//
// Вставляет в index.html между метками «ШАПКА САЙТА · начало / конец» актуальные блоки
// apps/tilda/header (стили, разметка, скрипты — в порядке, как на Тильде).
// Если папки apps/tilda рядом нет, берёт последнюю копию data/header.html.
//
// На Тильде шапка подключается отдельной страницей-шапкой, поэтому в пакет
// apps/tilda/discounts она не попадает: сборщик берёт только <main>.
// Саму шапку править в apps/tilda/header, здесь только копия.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const HEADER_DIR = join(here, '..', '..', 'tilda', 'header', 'tilda');
const HEADER_PARTS = ['01-css.html', '02-html.html', '03-js.html'];
const HEADER_COPY = join(here, 'data', 'header.html');
const START = '<!-- ШАПКА САЙТА · начало';
const END = '<!-- ШАПКА САЙТА · конец -->';

let header;
if (HEADER_PARTS.every((f) => existsSync(join(HEADER_DIR, f)))) {
  const parts = await Promise.all(HEADER_PARTS.map((f) => readFile(join(HEADER_DIR, f), 'utf8')));
  header = parts.join('\n');
  await mkdir(dirname(HEADER_COPY), { recursive: true });
  await writeFile(HEADER_COPY, header);
} else if (existsSync(HEADER_COPY)) {
  header = await readFile(HEADER_COPY, 'utf8');
} else {
  throw new Error('шапки нет: ни apps/tilda/header/tilda, ни discounts/data/header.html');
}

const file = join(here, 'index.html');
const html = await readFile(file, 'utf8');
const a = html.indexOf(START);
const b = html.indexOf(END);
if (a < 0 || b < a) throw new Error('в index.html нет меток «ШАПКА САЙТА · начало / конец»');
const startLineEnd = html.indexOf('-->', a) + 3;
await writeFile(file, html.slice(0, startLineEnd) + '\n' + header.trim() + '\n    ' + html.slice(b));
console.log(`Шапка вставлена: ${header.length} символов`);
