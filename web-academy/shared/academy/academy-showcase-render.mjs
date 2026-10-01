import {escapeHtml, renderText, sectionId} from './html-render.mjs';

const image = (asset, className) => `<img class="${className}" src="${escapeHtml(asset.src)}" width="${Number(asset.width)}" height="${Number(asset.height)}" alt="${escapeHtml(asset.alt || '')}" draggable="false" loading="lazy" decoding="async">`;
const glow = (card, className) => card.glow ? image(card.glow, `${className} is-wide`) + image(card.compactGlow || card.glow, `${className} is-compact`) : '';
const title = value => Array.isArray(value) ? value.map(renderText).join('<br>') : renderText(value);
const copy = (card, variant = '') => `<div class="academy-showcase_card-copy content-header_component${variant ? ` is-${variant}` : ''}"><h3 class="content-heading_component is-prominent">${title(card.title)}</h3><p class="body-text_component is-showcase${variant === 'graduates' ? ' is-statement' : ''}">${renderText(card.description)}</p></div>`;

// Complete composition: only copy and media come from a landing; no runtime needed.
export function renderAcademyShowcase(data, {id = 'academy'} = {}) {
  sectionId(id);
  const portraits = data.graduates.portraits;
  return `<section class="section_academy-showcase section-spacing_component" id="${id}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge">
    <div class="academy-showcase_component section-layout_component is-responsive">
      <div class="academy-showcase_intro section-header_component is-center is-responsive">
        <h2 class="section-title_component is-center" id="${id}-heading">${renderText(data.heading)}<br class="academy-showcase_heading-break"><span class="section-title_accent"> ${renderText(data.headingAccent)}</span></h2>
      </div>
      <div class="academy-showcase_layout">
        <div class="academy-showcase_grid">
          <article class="academy-showcase_card is-practice">
            <div class="academy-showcase_practice-frame">${image(data.practice.image, 'academy-showcase_practice-image')}</div>
            ${copy(data.practice)}
          </article>
          <div class="academy-showcase_side-grid">
            <article class="academy-showcase_card is-community">
              ${copy(data.community)}
              <div class="academy-showcase_community-media">${glow(data.community, 'academy-showcase_community-glow')}${image(data.community.image, 'academy-showcase_community-image')}</div>
            </article>
            <article class="academy-showcase_card is-graduates">
              ${copy(data.graduates, 'graduates')}
              <div class="academy-showcase_graduates-media" aria-hidden="true">
                ${glow(data.graduates, 'academy-showcase_graduates-glow')}<div class="academy-showcase_graduates-primary">${image(portraits.primary, 'academy-showcase_graduate-image')}</div>
                ${image(portraits.small, 'academy-showcase_graduate-avatar is-small')}
                ${image(portraits.medium, 'academy-showcase_graduate-avatar is-medium')}
              </div>
            </article>
          </div>
        </div>
        ${data.teachers ? `<article class="academy-showcase_card is-teachers">
          ${copy(data.teachers, 'teachers')}
          <div class="academy-showcase_teachers-media">
            ${image(data.teachers.image, 'academy-showcase_teachers-image')}
            <div class="academy-showcase_teachers-controls" aria-hidden="true"><span class="academy-showcase_teachers-control"></span><span class="academy-showcase_teachers-status"><span></span><span></span><span></span></span></div>
          </div>
        </article>` : ''}
      </div>
    </div>
  </div></div>
</section>`;
}
