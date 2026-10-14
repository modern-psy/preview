import {escapeHtml, renderText, sectionId} from './html-render.mjs';
import {renderCta} from './cta-render.mjs';

// «Вопросы на небе»: заголовок, подводка, фото неба с репликами и общий CTA под ним.
// Первый потребитель — «Клинический психолог» (Figma 34:399), второй — лендинг тренингов для детей.
// Тексты, фото и положение реплик принадлежат лендингу; разметку не править руками.
export function renderClientQuestions(data, {id = data.id} = {}) {
  sectionId(id);
  const sky = data.sky;
  if (!sky || !/^(https:\/\/|assets\/)/.test(sky.src) || ![sky.width, sky.height].every(n => Number.isInteger(n) && n > 0)) throw new Error('Client questions: нужно фото неба {src, width, height}.');
  if (!Array.isArray(data.questions) || !data.questions.length) throw new Error('Client questions: нужны реплики.');
  const questions = data.questions.map((q, index) => {
    if (!Number.isFinite(q.x) || !Number.isFinite(q.y)) throw new Error('Координаты реплик должны быть числами.');
    return `<li class="client-questions_bubble" style="--bubble-x:${q.x}%;--bubble-y:${q.y}rem;--bubble-order:${index}"><p class="content-heading_component is-card">${renderText(q.text)}</p></li>`;
  }).join('');
  const intro = data.description ? `<div class="client-questions_intro"><p class="section-subtitle_component">${renderText(data.description)}</p></div>` : '';
  const stageHeading = data.stage_heading ? `<h3 class="client-questions_title section-title_component is-center is-responsive">${renderText(data.stage_heading)}</h3>` : '';
  return `<section class="section_client-questions section-spacing_component" id="${id}" aria-labelledby="${id}-heading"><div class="padding-global"><div class="container-xlarge"><div class="client-questions_component section-layout_component is-responsive"><div class="client-questions_header"><div class="section-header_component is-center is-responsive"><h2 class="section-title_component is-center is-responsive" id="${id}-heading">${renderText(data.heading)}</h2>${intro}</div></div><div class="client-questions_body"><div class="client-questions_sky${stageHeading ? '' : ' is-untitled'}" data-js="client-questions"><img class="client-questions_image" src="${escapeHtml(sky.src)}" width="${sky.width}" height="${sky.height}" alt="" aria-hidden="true" draggable="false" loading="lazy"><div class="client-questions_shade" aria-hidden="true"></div>${stageHeading}<ul class="client-questions_list" aria-label="${escapeHtml(data.listLabel || 'Реплики')}">${questions}</ul></div>${data.cta ? renderCta(data.cta, {headingLevel: 3}) : ''}</div></div></div></div></section>`;
}
