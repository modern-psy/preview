import fs from 'node:fs/promises';
import {escapeHtml, renderText, sectionId} from './html-render.mjs';
const template = await fs.readFile(new URL('practice-path.html', import.meta.url), 'utf8');

export function renderPracticePath(data, {id = 'practice-path'} = {}) {
  sectionId(id);
  const values = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, typeof value === 'string' ? escapeHtml(value) : value]));
  values.id = id;
  values.heading = `${renderText(data.heading[0])}<br><span class="section-title_accent">${renderText(data.heading[1])}</span>`;
  for (const key of ['firstStatement', 'secondStatement']) values[key] = `<span class="body-text_lead">${renderText(data[key].lead)}</span>${renderText(data[key].rest)}`;
  values.formatDescription = data.formatDescription.map(renderText).join('<br>');
  return template.replace(/\{\{([a-zA-Z0-9]+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Missing practice-path field: ${key}`);
    return values[key];
  });
}
