// Build-time helpers. Content stays text; renderers own semantic markup.
export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
export const renderText = value => escapeHtml(value).replace(/\u00a0/g, '&nbsp;');
export function sectionId(id) {
  if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error('A unique, lowercase section ID is required.');
  return id;
}
