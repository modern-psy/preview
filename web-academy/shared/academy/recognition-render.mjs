import {renderCta} from './cta-render.mjs';
import {renderIconCard} from './icon-card-render.mjs';
const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const text = value => escape(value).replace(/\u00a0/g, '&nbsp;');

export function renderRecognition(data, {id = 'audience', columns = 2, width = 'wide'} = {}) {
  if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error('Recognition needs a unique section ID.');
  if (![2, 3].includes(columns) || !['wide', 'full'].includes(width)) throw new Error('Recognition: invalid layout variant.');
  const cards = data.cards.map(renderIconCard).join('\n');
  return `<section class="section_audience section-spacing_component" id="${id}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge">
    <div class="section-layout_component is-responsive recognition_component">
      <div class="section-header_component is-center">
        <img class="recognition_mark" src="${escape(data.mark)}" width="60" height="60" alt="" aria-hidden="true" draggable="false" loading="lazy">
        <h2 class="section-title_component is-center" id="${id}-heading">${text(data.heading)}</h2>
      </div>
      <div class="column-grid_component"><div class="column-grid_content ${width === 'full' ? 'is-content-full' : 'is-content-wide'} recognition_body">
        <ul class="card-grid_component ${columns === 3 ? 'is-triple' : 'is-paired'}" aria-label="${escape(data.listLabel)}">${cards}</ul>
        ${renderCta(data.cta)}
      </div></div>
    </div>
  </div></div>
</section>`;
}
