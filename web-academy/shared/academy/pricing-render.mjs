// Build-time semantic markup. This module is never required by the delivered page.
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const copy = value => escape(value)
  .replace(/(?<![\p{L}\p{N}])(а|в|и|к|о|с|у|я|во|до|за|из|на|не|ни|но|об|от|по|со|без|для|над|под|при|про) /giu, '$1&nbsp;')
  .replace(/ (бы|же|ли)(?=[\s?.,!]|$)/giu, '&nbsp;$1')
  .replace(/ (—)/g, '&nbsp;$1')
  .replace(/(\d) (?=\d{3}(?:\D|$)|₽|месяц|сентября|декабря|встреч)/g, '$1&nbsp;');
const money = value => new Intl.NumberFormat('ru-RU').format(value).replaceAll('\u00a0', '&nbsp;') + '&nbsp;₽';
const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
// The day before the increase date, in Russian genitive; the date itself stays data, never a timer.
const dayBefore = iso => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return `${date.getUTCDate()}&nbsp;${months[date.getUTCMonth()]}`;
};
const label = value => { const text = escape(value.trim()).replace(/\s+/g, '&nbsp;'); return text.charAt(0).toUpperCase() + text.slice(1); };
const increase = value => `<div class="pricing_increase"><p class="pricing_increase-until body-text_component is-caption is-regular is-statement">Цена действует до&nbsp;${dayBefore(value.from)}</p><p class="pricing_increase-next body-text_component is-caption is-regular is-statement">${label(value.fromLabel)}&nbsp;— ${money(value.total)} (от&nbsp;${money(value.monthly)}/мес)</p></div>`;
const image = (src, className) => `<img class="${className}" src="${escape(src)}" width="18" height="18" alt="" aria-hidden="true" draggable="false" loading="lazy">`;

export function renderPricing(config) {
  const { id, title, streams, plans, icons } = config;
  if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error('Pricing needs a unique HTML-safe id.');
  if (plans.length < 1 || plans.length > 3 || streams.length < 1 || streams.length > 2) throw new Error('Pricing supports 1–3 plans and 1–2 streams.');
  if (new Set(streams.map(s => s.id)).size !== streams.length || streams.some(s => !/^[a-z][a-z0-9-]*$/.test(s.id))) throw new Error('Invalid pricing streams.');
  if (new Set(plans.map(p => p.id)).size !== plans.length || plans.some(p => !/^[a-z][a-z0-9-]*$/.test(p.id))) throw new Error('Invalid pricing plans.');
  for (const plan of plans) {
    for (const stream of streams) {
      const price = plan.prices[stream.id];
      if (price !== null && (!price || !Number.isFinite(price.monthly) || !Number.isFinite(price.total) || price.monthly <= 0 || price.total <= 0 || !Number.isInteger(price.months) || price.months < 1)) throw new Error('Invalid pricing amount.');
      const next = price?.increase;
      if (next !== undefined && (!next || !/^\d{4}-\d{2}-\d{2}$/.test(next.from) || Number.isNaN(Date.parse(next.from)) || typeof next.fromLabel !== 'string' || !next.fromLabel.trim() || !Number.isFinite(next.monthly) || !Number.isFinite(next.total) || next.monthly <= 0 || next.total <= 0)) throw new Error('Invalid pricing increase.');
    }
  }
  const streamValues = render => streams.map(stream => `<span data-pricing-stream="${stream.id}" class="pricing_start">${render(stream)}</span>`).join('');
  const tabs = `<div class="pricing_tabs" role="tablist" aria-label="Поток обучения" data-pricing-tabs hidden>${streams.map((stream, i) => `<button class="pricing_tab" type="button" role="tab" id="${id}-tab-${stream.id}" aria-controls="${id}-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-pricing-tab="${stream.id}">${copy(stream.label)}</button>`).join('')}</div>`;
  const cards = plans.map((plan, order) => ({plan, order})).sort((a, b) => Number(b.plan.featured) - Number(a.plan.featured)).map(({plan, order}) => {
    const costs = streams.map(stream => {
      const price = plan.prices[stream.id];
      return `<div class="pricing_cost" data-pricing-stream="${stream.id}"><span class="pricing_stream-label pricing_terms body-text_component is-caption is-regular is-statement">${copy(stream.label)}</span>${price ? `<p class="pricing_amount"><span class="pricing_number">${price.monthlyPrefix ? `${copy(price.monthlyPrefix)}&nbsp;` : ''}${money(price.monthly)}</span><span>/ мес</span></p><p class="pricing_terms body-text_component is-caption is-regular is-statement">На&nbsp;${price.months}&nbsp;месяца или ${money(price.total)} одним платежом</p>${price.increase ? increase(price.increase) : ''}` : '<p class="pricing_unconfirmed">Стоимость уточняется</p>'}</div>`;
    }).join('');
    const card = `<div class="pricing_card${plan.featured ? ' is-featured' : ''}"><div class="content-header_component"><h3 class="content-heading_component is-prominent" id="${id}-${escape(plan.id)}">${copy(plan.name)}</h3><p class="pricing_description body-text_component is-summary is-regular is-statement">${copy(plan.description)}</p></div><div class="pricing_costs">${costs}</div></div>`;
    const surface = plan.featured ? `<div class="pricing_highlight"><p class="pricing_badge">${image(icons.flame, 'pricing_badge-icon')}${copy(plan.badge || 'Популярный тариф')}</p>${card}</div>` : card;
    const features = plan.features.map(feature => `<li class="pricing_feature body-text_component is-regular is-statement${feature.included ? '' : ' is-excluded'}">${image(feature.included ? (feature.highlighted ? icons.highlight : icons.check) : icons.cross, 'pricing_feature-icon')}<span>${feature.included ? '' : '<span class="pricing_sr-only">Не входит: </span>'}${copy(feature.text)}</span></li>`).join('');
    const action = plan.href ? `<a class="button button_component ${plan.featured ? 'is-accent' : 'is-light'} is-full-width" href="${escape(plan.href)}"${plan.tildaManaged === true ? ' data-tilda-popup-link' : ''}>${copy(plan.actionLabel)}</a>` : `<button class="button button_component ${plan.featured ? 'is-accent' : 'is-light'} is-full-width" type="button" aria-disabled="true" data-action="${escape(plan.action)}">${copy(plan.actionLabel)}</button>`;
    return `<article class="pricing_plan${plan.featured ? ' is-featured' : ''}" data-pricing-order="${order}"${plan.featured ? ' data-pricing-featured' : ''} aria-labelledby="${id}-${escape(plan.id)}"><div class="pricing_offer">${surface}${action}</div><ul class="pricing_features" role="list">${features}</ul></article>`;
  }).join('\n');
  return `<academy-pricing class="pricing_component" selected-stream="${streams[0].id}">
${tabs}
<div class="pricing_panel section-layout_component is-responsive" id="${id}-panel" role="tabpanel" aria-labelledby="${id}-tab-${streams[0].id}" tabindex="0" data-pricing-panel>
<div class="section-header_component is-center is-responsive"><h2 class="section-title_component is-center" id="${id}-heading">${copy(title).replace(/\r?\n/g, '<br>')}</h2><p class="section-subtitle_component">${streamValues(stream => copy(stream.start))}</p></div>
<div class="pricing_grid${plans.length === 3 ? ' is-three' : plans.length === 1 ? ' is-single' : ''}" style="--pricing-columns:${plans.length}">${cards}</div>
</div></academy-pricing>`;
}
