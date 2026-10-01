import {escapeHtml, renderText, sectionId} from './html-render.mjs';

export function renderGraduation(data, {id = 'graduation'} = {}) {
  sectionId(id);
  const {src, width, height, alt} = data.image || {};
  if (!data.heading || !data.items?.length || typeof alt !== 'string' || !/^(https?:\/\/|assets\/)/.test(src) || ![width, height].every(n => Number.isInteger(n) && n > 0)) throw new Error('Graduation: heading, cards and image metadata required');
  if (data.mark && ![data.mark.base, data.mark.detail].every(url => /^(https?:\/\/|assets\/)/.test(url))) throw new Error('Graduation: invalid mark');
  return `<section class="section_graduation section-spacing_component" id="${id}" aria-labelledby="${id}-heading"><div class="padding-global"><div class="container-xlarge"><div class="graduation_component is-responsive section-layout_component">
    <div class="section-header_component is-center is-responsive"><div class="section-header_title">${data.mark ? `<div class="graduation_mark" aria-hidden="true"><img class="graduation_mark-base" src="${escapeHtml(data.mark.base)}" width="60" height="60" alt="" draggable="false" loading="lazy"><img class="graduation_mark-detail" src="${escapeHtml(data.mark.detail)}" width="22" height="22" alt="" draggable="false" loading="lazy"></div>` : ''}<h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(data.heading)}</h2></div></div>
    <div class="graduation_media"><div class="graduation_image-frame"><img class="graduation_image" src="${escapeHtml(src)}" width="${width}" height="${height}" alt="${escapeHtml(alt)}" loading="lazy" draggable="false"></div><ul class="graduation_cards">${data.items.map(item => `<li class="card_component is-on-media graduation_card"><h3 class="content-heading_component is-card">${renderText(item)}</h3></li>`).join('')}</ul></div>
  </div></div></div></section>`;
}
