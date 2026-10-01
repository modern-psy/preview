import {escapeHtml, renderText, sectionId} from './html-render.mjs';
import './teacher-card.js';
import './teachers-template.js';

export function renderTeachersSection(copy, records, {id = 'teachers', instanceId = 'academy-teachers', configId, assetsId} = {}) {
  [id, instanceId, configId, assetsId].filter(Boolean).forEach(sectionId);
  return `<section class="section_teachers section-spacing_component" id="${id}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge">
    <academy-teachers class="teachers_component section-layout_component is-responsive" id="${instanceId}"${configId ? ` data-config="${configId}"` : ''}${assetsId ? ` data-assets="${assetsId}"` : ''} data-tabs-label="${escapeHtml(copy.tabsLabel)}" data-slider-label="${escapeHtml(copy.sliderLabel)}">
      <div class="teachers_header">
        <div class="section-header_component is-left is-responsive teachers_intro">
          <h2 class="section-title_component is-left is-responsive" id="${id}-heading">${renderText(copy.heading)}<br><span class="section-title_accent">${renderText(copy.headingAccent)}</span></h2>
          <p class="section-subtitle_component">${renderText(copy.description)}</p>
        </div>
        <div class="teachers_controls" data-js="teacher-controls" hidden>
          <button class="review-control_component is-previous" data-js="teacher-previous" type="button" aria-label="${escapeHtml(copy.previousLabel)}" aria-controls="${instanceId}-slider"><span class="review-control_icon" aria-hidden="true"></span></button>
          <button class="review-control_component" data-js="teacher-next" type="button" aria-label="${escapeHtml(copy.nextLabel)}" aria-controls="${instanceId}-slider"><span class="review-control_icon" aria-hidden="true"></span></button>
        </div>
      </div>
      ${globalThis.AcademyTeacherTemplate.render(records, instanceId, copy)}
    </academy-teachers>
  </div></div>
</section>`;
}
