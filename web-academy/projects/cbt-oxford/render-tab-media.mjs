import {renderText} from '../../shared/academy/html-render.mjs';
const icon = name => {
  if (!/^[a-z-]+$/.test(name)) throw new Error('Invalid demo icon');
  return `<img class="oxford-demo_icon" src="assets/tabs/${name}.svg" width="12" height="12" alt="" draggable="false">`;
};
const arrow = () => `<span class="oxford-demo_arrow" aria-hidden="true">${icon('arrow-right')}</span>`;
const image = (name, size = 24) => {
  if (!/^[a-z-]+$/.test(name)) throw new Error('Invalid demo image');
  return `<img class="oxford-demo_avatar" src="assets/tabs/${name}.webp" width="${size}" height="${size}" alt="" draggable="false" loading="lazy">`;
};
const typed = text => `<span class="typewriter_step-copy"><span class="typewriter_text" data-typewriter-text>${renderText(text)}</span><span class="typewriter_visual" data-typewriter-visual aria-hidden="true"></span></span>`;
export function renderTabMedia(item) {
  const demo = item.demo;
  if (demo.type === 'cases') return `<academy-demo-sequence class="oxford-demo_canvas" data-sequence-order="1,0,2"><ul class="oxford-demo_cases" aria-label="Примеры клинических случаев">${demo.cases.map(entry => `<li class="oxford-demo_case demo-sequence_item" data-sequence-item>${image(entry.image, 40)}<div class="oxford-demo_case-copy"><p class="oxford-demo_title">${renderText(entry.title)}</p><p class="oxford-demo_text">${renderText(entry.text)}</p></div>${arrow()}</li>`).join('')}</ul></academy-demo-sequence>`;
  if (demo.options) return `<div class="oxford-demo_canvas" data-typewriter-viewport><div class="oxford-demo_note" data-typewriter-card><div class="oxford-demo_rail" aria-hidden="true">${image('avatar')}</div><div class="oxford-demo_content"><div class="oxford-demo_body">
    <p class="oxford-demo_eyebrow">${icon(demo.icon)}${renderText(demo.eyebrow)}</p>
    <p class="oxford-demo_title">${renderText(demo.title)}</p>
    <academy-typewriter class="typewriter_component is-sequence oxford-demo_text" data-typewriter-speed="25" data-typewriter-loop data-typewriter-staged>
      <p class="oxford-demo_text" data-typewriter-step>${typed(demo.text)}</p>
      <ul class="oxford-demo_options">${demo.options.map(option=>`<li class="oxford-demo_option${option.selected ? ' is-selected' : ''}" data-typewriter-step${option.selected ? ' data-typewriter-choice' : ''}><span class="oxford-demo_radio" aria-hidden="true">${icon('radio-empty').replace('oxford-demo_icon','oxford-demo_icon oxford-demo_radio-empty')}${icon('radio-selected').replace('oxford-demo_icon','oxford-demo_icon oxford-demo_radio-selected')}</span>${typed(option.text)}</li>`).join('')}</ul>
    </academy-typewriter>
    </div><p class="oxford-demo_action" data-typewriter-reveal>${arrow()}<span>${renderText(demo.action)}</span></p>
  </div></div></div>`;
  if (demo.steps) return `<academy-demo-sequence class="oxford-demo_canvas"><div class="oxford-demo_note" data-sequence-card><div class="oxford-demo_rail" aria-hidden="true">${image('avatar')}</div><div class="oxford-demo_content"><div class="oxford-demo_body">
    <p class="oxford-demo_eyebrow">${icon(demo.icon)}${renderText(demo.eyebrow)}</p><p class="oxford-demo_title">${renderText(demo.title)}</p>
    <ul class="oxford-demo_steps">${demo.steps.map(step=>`<li class="oxford-demo_tag demo-sequence_item" data-sequence-item>${icon(step.icon)}${renderText(step.text)}</li>`).join('')}</ul>
    </div><p class="oxford-demo_action" data-sequence-reveal>${arrow()}<span>${renderText(demo.action)}</span></p>
  </div></div></academy-demo-sequence>`;
  const copy = demo.text ? demo.typing ? `<academy-typewriter class="typewriter_component oxford-demo_text" data-typewriter-speed="25" data-typewriter-loop><span class="typewriter_text" data-typewriter-text>${renderText(demo.text)}</span><span class="typewriter_visual" data-typewriter-visual aria-hidden="true"></span></academy-typewriter>` : `<p class="oxford-demo_text">${renderText(demo.text)}</p>` : '';
  return `<div class="oxford-demo_canvas"${demo.typing ? ' data-typewriter-viewport' : ''}><div class="oxford-demo_note"${demo.typing ? ' data-typewriter-card' : ''}><div class="oxford-demo_rail" aria-hidden="true">${image('avatar')}</div><div class="oxford-demo_content"><div class="oxford-demo_body">
    ${demo.eyebrow ? `<p class="oxford-demo_eyebrow">${icon(demo.icon)}${renderText(demo.eyebrow)}</p>` : ''}
    <p class="oxford-demo_title">${renderText(demo.title)}</p>
    ${demo.tag ? `<p class="oxford-demo_tag">${renderText(demo.tag)}</p>` : ''}${copy}
    </div><p class="oxford-demo_action"${demo.typing ? ' data-typewriter-reveal' : ''}>${arrow()}<span>${renderText(demo.action)}</span></p>
  </div></div></div>`.replace(/^[ \t]+$/gm, '');
}
