import {escapeHtml, renderText, sectionId} from './html-render.mjs';

const icon = (asset, className) => `<img class="${className}" src="${escapeHtml(asset.src)}" width="${Number(asset.width)}" height="${Number(asset.height)}" alt="" draggable="false" loading="lazy">`;

// Independently reusable static lecture illustration; no runtime or IDs needed.
export function renderLecturePreview(data) {
  return `<div class="lecture-preview_component">
          <ul class="lecture-preview_list" aria-label="${escapeHtml(data.lecturesLabel)}">
            ${data.lectures.map(lecture => `<li class="lecture-preview_card">
              ${icon(data.playIcon, `lecture-preview_icon${data.mobilePlayIcon ? ' is-desktop' : ''}`)}
              ${data.mobilePlayIcon ? icon(data.mobilePlayIcon, 'lecture-preview_icon is-mobile') : ''}
              <div class="lecture-preview_copy"><p class="content-heading_component is-prominent lecture-preview_title">${renderText(lecture.title)}</p><p class="body-text_component is-summary lecture-preview_description">${renderText(lecture.description)}</p></div>
            </li>`).join('\n            ')}
          </ul>
        </div>`;
}

// Build-time composition: page-owned copy, assets and actions; no runtime required.
export function renderTrialLectures(data, {id = 'trial-lectures'} = {}) {
  sectionId(id);
  if (data.href != null && !/^#[a-z][a-z0-9-]*$/.test(data.href)) throw new Error('Trial lectures require a same-page destination.');
  const action = data.href
    ? `<a class="button_component button is-accent trial-lectures_action" href="${escapeHtml(data.href)}" data-action="${escapeHtml(data.action)}"${data.tildaManaged === true ? ' data-tilda-popup-link' : ''}>${renderText(data.button)}</a>`
    : `<button class="button_component button is-accent trial-lectures_action" type="button" aria-disabled="true" data-action="${escapeHtml(data.action)}">${renderText(data.button)}</button>`;

  return `<section class="section_trial section-spacing_component" id="${id}" aria-labelledby="${id}-heading">
  <div class="padding-global"><div class="container-xlarge column-grid_component">
    <div class="column-grid_content is-content-wide section-layout_component is-responsive trial-lectures_section">
      <h2 class="section-title_component is-center" id="${id}-heading"><span class="section-title_accent">${renderText(data.headingAccent)}</span><br class="trial-lectures_heading-break"> ${renderText(data.heading)}</h2>
      <div class="trial-lectures_component">
        <div class="trial-lectures_card">
          <div class="trial-lectures_body">
            <div class="content-header_component">
              <h3 class="content-heading_component is-prominent">${renderText(data.title)}</h3>
              <p class="body-text_component is-summary">${renderText(data.description)}</p>
            </div>
            <ul class="trial-lectures_list" aria-label="${escapeHtml(data.benefitsLabel)}">
              ${data.benefits.map(text => `<li class="trial-lectures_item">${icon(data.benefitIcon, 'trial-lectures_icon')}<span class="body-text_component trial-lectures_benefit">${renderText(text)}</span></li>`).join('\n              ')}
            </ul>
          </div>
          ${action}
        </div>
        ${renderLecturePreview(data)}
      </div>
    </div>
  </div></div>
</section>`;
}
