import {escapeHtml, renderText, sectionId} from './html-render.mjs';
import {renderToggleIcon} from './toggle-icon-render.mjs';

export function renderFaq(data, {id = 'faq'} = {}) {
  sectionId(id);
  if (!Array.isArray(data.items) || !data.items.length) throw new Error('FAQ items are required.');
  return `<section class="section_faq section-spacing_component" id="${id}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge"><div class="column-grid_component"><div class="column-grid_content is-content-wide">
    <div class="faq_component section-layout_component is-responsive">
      <div class="faq_header section-header_component is-center is-responsive">
        <h2 class="section-title_component is-center" id="${id}-heading">${renderText(data.heading)}</h2>
        ${data.supportText ? `<p class="section-subtitle_component">${renderText(data.supportText)}${data.supportButton ? ` <button class="faq_support-action" type="button" aria-disabled="true" data-action="${escapeHtml(data.supportAction)}">${renderText(data.supportButton)}</button>` : ''}</p>` : ''}
      </div>
      <div class="faq_list accordion_component" data-accordion data-accordion-single>
        ${data.items.map(item => `<details class="faq_item accordion_item" data-accordion-item>
          <summary class="faq_question accordion_summary" data-accordion-trigger><h3 class="content-heading_component is-card">${renderText(item.question)}</h3>${renderToggleIcon({className: 'accordion_icon'})}</summary>
          <div class="faq_answer accordion_panel" data-accordion-panel><div class="faq_answer-inner accordion_panel-inner body-text_component">${item.answer.map(text => `<p>${renderText(text)}</p>`).join('\n')}</div></div>
        </details>`).join('\n        ')}
      </div>
    </div>
  </div></div></div></div>
</section>`;
}
