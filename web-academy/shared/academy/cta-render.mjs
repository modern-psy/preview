import fs from 'node:fs/promises';
import {escapeHtml, renderText, sectionId} from './html-render.mjs';
const grid = await fs.readFile(new URL('cta-grid.html', import.meta.url), 'utf8');

export function renderCta(data, {headingLevel = 3, headingId} = {}) {
  if (![2, 3].includes(headingLevel)) throw new Error('CTA heading must be h2 or h3.');
  if (headingId) sectionId(headingId);
  if (data.href != null && !/^#[a-z][a-z0-9-]*$/.test(data.href)) throw new Error('CTA requires a same-page destination.');
  const tag = `h${headingLevel}`;
  const lines = value => (Array.isArray(value) ? value : [value]).map(renderText).join('<br class="cta_copy-break"> ');
  const action = data.href
    ? `<a class="cta_button button_component is-light" href="${escapeHtml(data.href)}" data-action="${escapeHtml(data.action)}">${renderText(data.button)}</a>`
    : `<button class="cta_button button_component is-light" type="button" aria-disabled="true" data-action="${escapeHtml(data.action)}">${renderText(data.button)}</button>`;
  return `<div class="cta_component is-responsive${data.description ? ' is-described' : ''}" data-cta-grid>
  ${grid.replace('{{gridSource}}', escapeHtml(data.gridSource))}
  <div class="cta_content"><div class="cta_copy section-header_component is-center is-responsive">
    <${tag} class="section-title_component is-center"${headingId ? ` id="${headingId}"` : ''}>${lines(data.heading)}</${tag}>
${data.description ? `    <p class="section-subtitle_component">${lines(data.description)}</p>` : ''}
  </div>${action}</div>
</div>`;
}
