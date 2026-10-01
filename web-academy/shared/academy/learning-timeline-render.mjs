import {escapeHtml, renderText, sectionId} from './html-render.mjs';
import {renderStageCard} from './program-render.mjs';

export function renderLearningTimeline(data, {id = 'learning'} = {}) {
  sectionId(id);
  if (!Array.isArray(data.steps) || !data.steps.length) throw new Error('Learning steps are required.');
  const program = data.variant === 'program';
  const previewAction = data.action.href === null && program;
  if (!previewAction && !/^#[a-z][a-z0-9-]*$/.test(data.action.href)) throw new Error('Learning action requires a same-page destination.');
  if (!program && !/^assets\/[a-z0-9/_-]+\.svg$/i.test(data.expertIcon)) throw new Error('Learning icon requires a project SVG asset.');
  return `<section class="section_learning section-spacing_component" id="${id}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge"><div class="column-grid_component">
  <div class="column-grid_content is-content-wide section-layout_component is-responsive">
    <div class="section-header_component is-center is-responsive"><h2 class="section-title_component is-responsive" id="${id}-heading">${renderText(data.heading.text)}<br><span class="section-title_accent">${renderText(data.heading.accent)}</span></h2>${data.description ? `<p class="section-subtitle_component learning-timeline_intro">${renderText(data.description)}</p>` : ''}</div>
    <div class="learning-timeline_component${program ? ' is-program' : ''}">
      <ol class="learning-timeline_list" aria-label="${escapeHtml(data.listLabel)}" data-learning-timeline>
      ${data.steps.map((step, index) => {
        if (program) return `<li class="learning-timeline_step"><span class="learning-timeline_marker" aria-hidden="true">${index + 1}</span>${renderStageCard({badge: step.label, heading: step.heading, description: step.description}, {tag: 'div'})}</li>`;
        const variant = step.expert ? ' is-expert' : '';
        const marker = step.expert ? `<img class="learning-timeline_icon" src="${escapeHtml(data.expertIcon)}" width="20" height="20" alt="" draggable="false" loading="lazy">` : String(index + 1);
        return `<li class="learning-timeline_step${variant}">
        <p class="content-heading_component learning-timeline_label">${renderText(step.label)}</p>
        <span class="learning-timeline_marker${variant}" aria-hidden="true">${marker}</span>
        <div class="card_component is-learning learning-timeline_card${variant}"><div class="content-header_component"><h3 class="content-heading_component">${renderText(step.heading)}</h3><p class="body-text_component is-reading learning-timeline_description">${renderText(step.description)}</p></div></div>
      </li>`;
      }).join('\n')}
      </ol>
      ${previewAction ? `<button class="button_component button is-accent learning-timeline_action" type="button" aria-disabled="true" data-action="${escapeHtml(data.action.id || 'full-program')}">${renderText(data.action.label)}</button>` : `<a class="button_component button is-accent learning-timeline_action" href="${escapeHtml(data.action.href)}"${data.action.tildaManaged === true ? ' data-tilda-popup-link' : ''}>${renderText(data.action.label)}</a>`}
    </div>
  </div></div></div></div>
</section>`;
}
