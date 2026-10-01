import {escapeHtml} from './html-render.mjs';

// Decorative indicator only; the native control owns state and interaction.
export function renderToggleIcon({className = '', open = false} = {}) {
  return `<span class="toggle-icon_component${className ? ` ${escapeHtml(className)}` : ''}${open ? ' is-open' : ''}" aria-hidden="true"><span class="toggle-icon_glyph"></span></span>`;
}
