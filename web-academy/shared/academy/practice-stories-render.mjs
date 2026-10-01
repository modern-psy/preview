import {renderReviewCard} from './reviews-render.mjs';
import {renderText, sectionId} from './html-render.mjs';

/** Course-owned short stories, composed from shared review cards and section rhythm. */
export function renderPracticeStories(data, {id = 'practice-stories'} = {}) {
  sectionId(id);
  if (!data.heading?.trim() || !data.description?.trim() || !data.items?.length) throw new Error('Practice stories: heading, description and items required');
  const ids = new Set();
  const cards = data.items.map(item => {
    sectionId(item.id);
    if (ids.has(item.id)) throw new Error('Practice stories: duplicate item ID');
    ids.add(item.id);
    if (!item.name?.trim() || !item.quote?.trim() || !item.lead?.trim() || typeof item.caption !== 'string') throw new Error('Practice stories: name, quote and result required');
    if (!/^https:\/\//.test(item.image) || ![item.width, item.height].every(n => Number.isInteger(n) && n > 0) || typeof item.alt !== 'string') throw new Error('Practice stories: image URL and metadata required');
    return `<li class="practice-stories_item">${renderReviewCard({...item, type: 'quote'}, id, {responsive: true})}</li>`;
  }).join('\n');
  return `<section class="section_practice-stories" id="${id}" aria-labelledby="${id}-heading">
  <academy-practice-stories class="practice-stories_component">
    <div class="practice-stories_sticky section-spacing_component is-inset section-layout_component is-responsive" data-stories-sticky>
      <div class="padding-global"><div class="container-xlarge"><div class="section-header_component is-responsive is-center">
        <h2 class="section-title_component" id="${id}-heading">${renderText(data.heading)}</h2>
        <p class="section-subtitle_component practice-stories_description">${renderText(data.description)}</p>
      </div></div></div>
      <div class="practice-stories_viewport review-list_component is-responsive" data-stories-viewport role="region" aria-label="Истории студентов" tabindex="0">
        <ul class="practice-stories_track" data-stories-track role="list">${cards}</ul>
      </div>
    </div>
  </academy-practice-stories>
</section>`;
}
