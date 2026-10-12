// Общую типографику правим в Web Academy, затем запускаем этот сборщик.
// Сборка переносит только текстовые роли, без геометрии секций.
import fs from 'node:fs/promises';
const shared = new URL('../web-academy/shared/academy/', import.meta.url);
const read = name => fs.readFile(new URL(name, shared), 'utf8');
const headings = await read('section-heading.css');
const start = headings.indexOf('.section-title_component {');
const end = headings.indexOf('.content-header_component {');
const css = '/* Сгенерировано build-type.mjs из Web Academy. Здесь не править. */\n'
  + await read('body-text.css') + '\n' + headings.slice(start, end);
await fs.writeFile(new URL('a-status-type.css', import.meta.url), css);
