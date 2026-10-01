import {escapeHtml, renderText} from './html-render.mjs';

export function renderIconCard(card) {
  const heading = card.description ? 'h3' : 'p';
  return `<li class="card_component is-icon-statement${card.description ? ' is-described' : ''}"><span class="card_icon is-statement" aria-hidden="true"><img src="${escapeHtml(card.icon)}" width="20" height="20" alt="" draggable="false" loading="lazy"></span><div class="card_content content-header_component"><${heading} class="content-heading_component is-card">${renderText(card.heading ?? card.text)}</${heading}>${card.description ? `<p class="body-text_component">${renderText(card.description)}</p>` : ''}</div></li>`;
}
