import {escapeHtml, renderText, sectionId} from './html-render.mjs';
import {renderIconCard} from './icon-card-render.mjs';
import {renderCta} from './cta-render.mjs';

export function renderFoundation(data, {id = 'foundation'} = {}) {
  sectionId(id);
  return `<section class="section_foundation section-spacing_component" id="${id}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge"><div class="section-layout_component is-responsive">
    <div class="section-header_component is-center is-responsive"><h2 class="section-title_component is-center" id="${id}-heading">${renderText(data.heading)}<br><span class="section-title_accent">${renderText(data.accent)}</span></h2></div>
    <div class="card-grid_body"><ul class="card-grid_component is-triple" aria-label="${escapeHtml(data.listLabel)}">${data.cards.map(renderIconCard).join('\n')}</ul>
    ${renderCta(data.cta)}</div>
  </div></div></div>
</section>`;
}
