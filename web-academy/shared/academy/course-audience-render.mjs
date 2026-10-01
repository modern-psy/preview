import {escapeHtml, renderText, sectionId} from './html-render.mjs';

export const courseAudienceImage = Object.freeze({
  src: 'https://optim.tildacdn.com/tild3963-3537-4335-b033-303232623063/-/format/webp/img-asp-for-whom.webp',
  width: 1280, height: 853,
  alt: 'Участники обучения обсуждают материал на занятии',
});

/** Static section: content-sized list of 1–6 cards and a shared, replaceable photograph. */
export function renderCourseAudience(data, {id = 'course-audience'} = {}) {
  sectionId(id);
  const media = data.image ?? courseAudienceImage;
  if (typeof data.heading !== 'string' || !data.heading.trim()) throw new Error('Course audience: heading required');
  if (!Array.isArray(data.cards) || data.cards.length < 1 || data.cards.length > 6) throw new Error('Course audience: provide 1–6 cards');
  if (!/^https:\/\//.test(media.src) && !/^assets\//.test(media.src)) throw new Error('Course audience: invalid image URL');
  if (![media.width, media.height].every(n => Number.isInteger(n) && n > 0) || typeof media.alt !== 'string') throw new Error('Course audience: image metadata required');
  const cards = data.cards.map(card => {
    if (typeof card.lead !== 'string' || !card.lead.trim() || typeof card.text !== 'string') throw new Error('Course audience: invalid card copy');
    return `<li class="card_component course-audience_card"><p class="body-text_component is-statement"><span class="body-text_lead">${renderText(card.lead)}</span>${card.text ? ` ${renderText(card.text)}` : ''}</p></li>`;
  }).join('\n');
  return `<section class="section_course-audience section-spacing_component" id="${id}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge column-grid_component"><div class="column-grid_content is-content-medium">
    <div class="section-layout_component is-responsive course-audience_component">
      <h2 class="section-title_component is-center" id="${id}-heading">${renderText(data.heading)}</h2>
      <div class="course-audience_layout">
        <ul class="course-audience_list">${cards}</ul>
        <div class="course-audience_media"><img class="course-audience_image" src="${escapeHtml(media.src)}" width="${media.width}" height="${media.height}" alt="${escapeHtml(media.alt)}" draggable="false" loading="lazy" decoding="async"></div>
      </div>
    </div>
  </div></div></div>
</section>`;
}
