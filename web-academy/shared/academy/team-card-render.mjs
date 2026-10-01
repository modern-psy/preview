import {escapeHtml, renderText} from './html-render.mjs';
import {renderMetaPill} from './meta-pill-render.mjs';

export function renderTeamCard(card, {tag = 'article', headingLevel = 3} = {}) {
  if (!['article', 'li'].includes(tag) || ![2, 3, 4, 5, 6].includes(headingLevel)) throw new Error('Team card: invalid semantics');
  if (!card.title || !card.description) throw new Error('Team card: missing copy');
  const {src, width, height, alt} = card.image || {};
  if (typeof src !== 'string' || !/^(https?:\/\/|assets\/)/.test(src)) throw new Error('Team card: invalid image URL');
  if (![width, height].every(n => Number.isInteger(n) && n > 0) || typeof alt !== 'string' || !alt.trim()) throw new Error('Team card: image dimensions and contextual alt are required');
  return `<${tag} class="team-card_component${card.featured ? ' is-featured' : ''}${card.spacing === 'spaced-portrait' ? ' is-spaced-portrait' : ''}">
    <div class="team-card_copy">${card.tag ? renderMetaPill(card.tag) : ''}<div class="content-header_component">
      <h${headingLevel} class="content-heading_component is-card team-card_title">${renderText(card.title)}</h${headingLevel}>
      <p class="body-text_component">${renderText(card.description)}</p>
    </div></div>
    <img class="team-card_image" src="${escapeHtml(src)}" width="${width}" height="${height}" alt="${escapeHtml(alt)}" draggable="false" loading="lazy">
  </${tag}>`;
}
