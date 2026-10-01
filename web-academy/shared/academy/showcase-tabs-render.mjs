import {renderText, escapeHtml, sectionId} from './html-render.mjs';

/** renderMedia is a trusted build-time adapter; course HTML never enters runtime eval. */
export function renderShowcaseTabs(data, {id = 'showcase-tabs', renderMedia} = {}) {
  sectionId(id);
  if (!data.heading || !data.items?.length || typeof renderMedia !== 'function') throw new Error('Showcase tabs require heading, items and media renderer');
  const seen = new Set();
  const items = data.items.map(item => {
    sectionId(item.id);
    if (seen.has(item.id) || !item.title || !item.description) throw new Error('Showcase tabs require unique IDs and complete copy');
    seen.add(item.id);
    return item;
  });
  return `<section class="section_showcase-tabs section-spacing_component is-after-inset" id="${id}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge"><div class="section-layout_component is-responsive">
    <header class="section-header_component is-responsive is-center showcase-tabs_header">
      <div class="section-header_title">${data.mark ? `<span class="showcase-tabs_mark" aria-hidden="true"><img src="${escapeHtml(data.mark.main)}" width="60" height="60" alt="" draggable="false"><img class="showcase-tabs_mark-small" src="${escapeHtml(data.mark.small)}" width="22" height="22" alt="" draggable="false"></span>` : ''}
        <h2 class="section-title_component" id="${id}-heading">${renderText(data.heading)}${data.accent ? `<br><span class="section-title_accent">${renderText(data.accent)}</span>` : ''}</h2>
      </div>
      <div class="section-subtitles_component">${(data.descriptions || []).map(copy => `<p class="section-subtitle_component">${renderText(copy)}</p>`).join('')}</div>
    </header>
    <academy-showcase-tabs class="showcase-tabs_component">
      <div class="showcase-tabs_navigation" data-tabs-list aria-label="${escapeHtml(data.label || data.heading)}" hidden>${items.map(item => `<button class="tab_component showcase-tabs_tab" type="button" id="${id}-tab-${item.id}" data-tabs-trigger="${item.id}">${renderText(item.title)}</button>`).join('')}</div>
      ${items.map(item => `<article class="showcase-tabs_panel" id="${id}-panel-${item.id}" data-tabs-panel="${item.id}" aria-labelledby="${id}-title-${item.id}">
        <div class="showcase-tabs_copy"><div class="content-header_component showcase-tabs_description"><h3 class="content-heading_component is-prominent" id="${id}-title-${item.id}">${renderText(item.title)}</h3><p class="body-text_component is-summary">${renderText(item.description)}</p></div></div>
        <div class="showcase-tabs_media">${renderMedia(item)}</div>
      </article>`).join('\n')}
    </academy-showcase-tabs>
  </div></div></div>
</section>`;
}
