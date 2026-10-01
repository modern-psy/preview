import {escapeHtml, renderText, sectionId} from './html-render.mjs';
import {leadFormTemplate} from './lead-form-template.mjs';

export function renderLeadForm(data, {id = 'lead-form'} = {}) {
  sectionId(id);
  if (!data.nativeMarker?.trim()) throw new Error('Lead form: explicit native marker required');
  for (const key of ['agreementUrl', 'privacyUrl']) if (!/^https:\/\//.test(data[key])) throw new Error(`Lead form: invalid ${key}`);
  for (const key of ['errorIcon', 'successIcon']) if (!/^(https?:\/\/|assets\/|data:image\/svg\+xml;base64,)/.test(data[key])) throw new Error(`Lead form: invalid ${key}`);
  const values = {...data, id};
  return leadFormTemplate.replace(/\{\{([a-zA-Z]+)\}\}/g, (_, key) => {
    if (typeof values[key] !== 'string' || !values[key].trim()) throw new Error(`Lead form: missing ${key}`);
    return renderText(values[key]);
  });
}

export function renderLeadFormSection(data, {id = 'application', formId = `${id}-form`} = {}) {
  sectionId(id);
  return `<section class="section_lead-form section-spacing_component" id="${id}" aria-labelledby="${escapeHtml(formId)}-heading"><div class="padding-global"><div class="container-xlarge column-grid_component"><div class="column-grid_content is-content-wide">${renderLeadForm(data, {id: formId})}</div></div></div></section>`;
}
