import {escapeHtml, renderText} from './html-render.mjs';

// Semantic metadata, never a control. The caller owns the label and icon URL.
export function renderMetaPill(pill, {tag = 'span', responsive = true} = {}) {
  if (!['span', 'li', 'p'].includes(tag)) throw new Error('Meta pill: invalid tag');
  if (typeof pill.text !== 'string' || !pill.text.trim()) throw new Error('Meta pill: missing text');
  let icon = '';
  if (pill.icon) {
    const {src, width, height} = pill.icon;
    if (typeof src !== 'string' || !/^(https?:\/\/|assets\/)/.test(src)) throw new Error('Meta pill: invalid icon URL');
    if (![width, height].every(n => Number.isInteger(n) && n > 0)) throw new Error('Meta pill: invalid icon dimensions');
    icon = `<img class="meta-pill_icon" src="${escapeHtml(src)}" width="${width}" height="${height}" alt="" draggable="false">`;
  }
  const label = renderText(pill.text).replaceAll('&amp;nbsp;', '&nbsp;');
  return `<${tag} class="meta-pill_component${pill.accent ? ' is-accent' : ''}${responsive ? ' is-responsive' : ''}">${icon}<span>${label}</span></${tag}>`;
}
