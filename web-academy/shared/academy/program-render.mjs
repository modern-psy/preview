import {escapeHtml, renderText, sectionId} from './html-render.mjs';

export function renderStageCard(stage, {tag = 'li'} = {}) {
  if (!['li', 'div'].includes(tag)) throw new Error('Stage card requires li or div');
  return `<${tag} class="card_component is-stage"><div class="stage-card_header"><span class="stage-card_badge">${renderText(stage.badge)}</span><h3 class="content-heading_component is-card stage-card_heading">${renderText(stage.heading)}</h3></div><p class="body-text_component is-detailed stage-card_description">${renderText(stage.description).replaceAll("\n", '<br class="stage-card_copy-break"> ')}</p></${tag}>`;
}

export function renderProgram(data, {id = 'program'} = {}) {
  sectionId(id);
  if (!Array.isArray(data.stages) || !data.stages.length) throw new Error('Program stages are required.');
  if (!/^#[a-z][a-z0-9-]*$/.test(data.action.href)) throw new Error('Program action requires a same-page destination.');
  return `<section class="section_program section-spacing_component" id="${id}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge"><div class="column-grid_component"><div class="column-grid_content is-content-wide">
  <div class="program_component section-layout_component is-responsive">
    <div class="section-header_component is-center is-responsive">
      <div class="section-header_title"><span class="program_mark" aria-hidden="true"><img class="program_mark-image" src="${escapeHtml(data.mark.image)}" width="60" height="60" alt="" draggable="false" loading="lazy"><img class="program_mark-small" src="${escapeHtml(data.mark.detail)}" width="22" height="22" alt="" draggable="false" loading="lazy"></span>
      <h2 class="section-title_component is-center" id="${id}-heading"><span class="section-title_accent">${renderText(data.heading.accentStart)}<br class="program_heading-accent-break">${renderText(data.heading.accentEnd)}</span><br class="program_heading-break"> ${renderText(data.heading.text)}</h2></div>
      <div class="section-subtitles_component program_intro">${data.subtitles.map(text => `<p class="section-subtitle_component">${renderText(text)}</p>`).join('\n')}</div>
    </div>
    <div class="program_body"><ol class="program_list" aria-label="${escapeHtml(data.listLabel)}">${data.stages.map(stage => renderStageCard(stage)).join('\n')}</ol>
    <a class="button_component button is-accent program_action" href="${escapeHtml(data.action.href)}">${renderText(data.action.label)}</a></div>
  </div></div></div></div></div>
</section>`;
}
