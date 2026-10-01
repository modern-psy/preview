import {escapeHtml, renderText, sectionId} from './html-render.mjs';

export function renderAdmission(data, {id = 'admission'} = {}) {
  sectionId(id);
  const heading = Array.isArray(data.heading) ? data.heading.map(renderText).join('<br class="admission_heading-break"> ') : renderText(data.heading);
  const cards = data.documents.map(document => `<li class="card_component admission_card"><h3 class="content-heading_component is-card">${renderText(document.title)}</h3><span class="card_icon is-document" aria-hidden="true"><img src="${escapeHtml(document.icon)}" width="20" height="20" alt="" draggable="false" loading="lazy"></span></li>`).join('\n');
  return `<section class="section_admission section-spacing_component is-after-inset" id="${id}" aria-labelledby="${id}-heading"><div class="padding-global"><div class="container-xlarge"><div class="column-grid_component"><div class="column-grid_content is-content-wide">
<div class="admission_component section-layout_component is-responsive">
  <div class="admission_intro section-header_component is-responsive"><h2 class="section-title_component" id="${id}-heading">${heading}</h2></div>
  <ul class="admission_documents" role="list">
    ${cards}
    <li class="card_component admission_card is-diploma"><h3 class="content-heading_component is-card admission_diploma-heading">${renderText(data.education.title)}</h3><img class="admission_diploma" src="${escapeHtml(data.education.image.src)}" width="${Number(data.education.image.width)}" height="${Number(data.education.image.height)}" alt="" aria-hidden="true" draggable="false" loading="lazy"></li>
  </ul>
</div></div></div></div></div></section>`;
}
