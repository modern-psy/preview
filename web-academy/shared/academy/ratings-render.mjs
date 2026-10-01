// Build-time HTML renderer. No client runtime, framework or repository URL required.
const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const text = value => escape(value).replace(/\u00a0/g, '&nbsp;');
const image = (source, className, width, height, alt = '', extra = '') => {
  if (new URL(source).protocol !== 'https:') throw new Error('Ratings images must use permanent HTTPS URLs.');
  return `<img class="${className}" src="${escape(source)}" width="${width}" height="${height}" alt="${escape(alt)}" draggable="false" loading="lazy" decoding="async"${extra}>`;
};

export function renderRatings(data, {id = 'ratings'} = {}) {
  if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error('Ratings need a unique semantic section ID.');
  const tags = data.tags.map(tag => `<li class="ratings_tag">${image(data.icons.tag, 'ratings_tag-icon', 14, 14)}${text(tag)}</li>`).join('\n');
  const platforms = data.platforms.map(platform => `<li class="ratings_card${platform.wide ? ' is-wide' : ''}"><p class="ratings_score">${image(data.icons.star, 'ratings_star', 24, 24)}<data value="${escape(platform.score)}">${text(platform.score)}</data></p>${image(platform.logo, 'ratings_logo', platform.width, platform.height, platform.name, ` style="--ratings-logo-width:${platform.width / 16}rem"`)}</li>`).join('\n');
  return `<section class="section_ratings section-spacing_component" id="${id}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge"><div class="column-grid_component"><div class="column-grid_content is-content-medium">
    <div class="ratings_component">
      <div class="ratings_layout">
        <div class="ratings_summary">
          <div class="ratings_copy section-header_component is-left">
            <h2 class="section-title_component is-left" id="${id}-heading">${text(data.heading)}</h2>
            <p class="section-subtitle_component">${data.description.map(text).join('<br>')}</p>
          </div>
          <div class="ratings_footer"><ul class="ratings_tags" aria-label="${escape(data.tagsLabel)}">${tags}</ul>${image(data.icons.illustration, 'ratings_illustration', 80, 80, '', ' aria-hidden="true"')}</div>
        </div>
        <ul class="ratings_platforms" aria-label="${escape(data.platformsLabel)}">${platforms}</ul>
      </div>
      <p class="ratings_note">${text(data.note)}</p>
    </div>
  </div></div></div></div>
</section>`;
}
