import {escapeHtml, renderText, sectionId} from './html-render.mjs';
import {renderTeamCard} from './team-card-render.mjs';

export function renderSupportTeam(data, {id = 'support-team'} = {}) {
  sectionId(id);
  if (!data.specialists?.length || !data.community?.length) throw new Error('Support team: both card groups are required');
  return `<section class="section_support section-spacing_component" id="${id}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge column-grid_component"><div class="column-grid_content is-content-wide">
    <div class="section-layout_component is-responsive">
      <div class="section-header_component is-responsive is-center">
        <div class="support-team_title"><h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(data.heading)} <span class="section-title_accent">${renderText(data.headingAccent)}</span></h2></div>
        <p class="section-subtitle_component support-team_intro">${renderText(data.description)}</p>
      </div>
      <div class="support-team_component">
        <ul class="support-team_grid" aria-label="${escapeHtml(data.specialistsLabel)}">${data.specialists.map(card => renderTeamCard(card, {tag: 'li'})).join('\n')}</ul>
        <ul class="support-team_grid is-community" aria-label="${escapeHtml(data.communityLabel)}">${data.community.map(card => renderTeamCard(card, {tag: 'li'})).join('\n')}</ul>
      </div>
    </div>
  </div></div></div>
</section>`;
}
