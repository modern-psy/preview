import {escapeHtml, renderText, sectionId} from './html-render.mjs';

export function renderDiploma(data, {id = 'diploma'} = {}) {
  sectionId(id);
  const {src, width, height, alt} = data.image || {};
  if (!data.heading || !data.description || !alt?.trim() || !/^(https?:\/\/|assets\/)/.test(src) || ![width, height].every(n => Number.isInteger(n) && n > 0)) throw new Error('Diploma: heading, description and meaningful image metadata are required');
  const requirements = data.requirements;
  if (requirements && (!requirements.heading || !requirements.items?.length || !/^(https?:\/\/|assets\/)/.test(requirements.icon))) throw new Error('Diploma: invalid requirements');
  return `<section class="section_diploma section-spacing_component" id="${id}" aria-labelledby="${id}-heading"><div class="padding-global"><div class="container-xlarge">
    <div class="diploma_component"><div class="diploma_content"><div class="diploma_body"><div class="diploma_details">
      <div class="section-header_component is-left is-responsive"><h2 class="section-title_component is-left is-responsive diploma_title" id="${id}-heading">${renderText(data.heading)}</h2><p class="body-text_component is-summary">${renderText(data.description)}</p></div>
      ${requirements ? `<div class="diploma_requirements"><h3 class="body-text_component is-emphasis" id="${id}-requirements">${renderText(requirements.heading)}</h3><ul class="diploma_list" aria-labelledby="${id}-requirements">${requirements.items.map(item => `<li class="diploma_item"><img class="diploma_icon" src="${escapeHtml(requirements.icon)}" width="18" height="18" alt="" draggable="false" loading="lazy"><span class="body-text_component diploma_item-text">${renderText(item)}</span></li>`).join('')}</ul></div>` : ''}
    </div>${data.note ? `<p class="body-text_component is-summary is-callout diploma_note">${renderText(data.note)}</p>` : ''}</div>
    ${data.license?.length ? `<p class="body-text_component is-fine-print diploma_license">${data.license.map(renderText).join('<br>')}</p>` : ''}</div>
    <div class="diploma_media"><img class="diploma_image" src="${escapeHtml(src)}" width="${width}" height="${height}" alt="${escapeHtml(alt)}" draggable="false" loading="lazy"></div></div>
  </div></div></section>`;
}
