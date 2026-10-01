import {renderMetaPill} from './meta-pill-render.mjs';
// Build-time HTML components. No browser runtime, project copy or asset URLs.
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const text = value => escape(value).replaceAll('&amp;nbsp;', '&nbsp;');
const required = (value, name) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Hero: missing ${name}`);
  return value;
};
const list = (value, name) => {
  if (!Array.isArray(value) || !value.length) throw new Error(`Hero: empty ${name}`);
  return value;
};
const id = value => {
  if (!/^[a-z][a-z0-9-]*$/.test(value || '')) throw new Error('Hero: invalid ID');
  return value;
};
const url = (value, local = false) => {
  if (typeof value !== 'string' || !(/^(https?:\/\/|#[a-z])/i.test(value) || (local && /^assets\/[a-z0-9/_\.\-]+$/i.test(value)))) throw new Error('Hero: invalid URL');
  return escape(value);
};

export function renderHeroImage(media, context, {className = 'hero_image', primary = false, hidden = false, lazy = false} = {}) {
  const asset = context.assets.find(item => item.id === media?.asset);
  if (!asset) throw new Error(`Hero: unknown asset ${media?.asset}`);
  if (![asset.width, asset.height].every(value => Number.isInteger(value) && value > 0)) throw new Error(`Hero: invalid image dimensions ${asset.id}`);
  if (typeof media.alt !== 'string' || (hidden && media.alt)) throw new Error(`Hero: invalid alt ${asset.id}`);
  return `<img${className ? ` class="${escape(className)}"` : ''} src="${url(asset.url || asset.canonical_path, true)}" width="${asset.width}" height="${asset.height}" alt="${escape(media.alt)}"${hidden ? ' aria-hidden="true"' : ''} draggable="false"${primary ? ' fetchpriority="high"' : lazy ? ' loading="lazy"' : ''}>`;
}

export function renderHeroPill(pill, context) {
  let icon;
  if (pill.icon) {
    const asset = context.assets.find(item => item.id === pill.icon.asset);
    if (!asset) throw new Error(`Hero: unknown asset ${pill.icon.asset}`);
    icon = {src: asset.url || asset.canonical_path, width: asset.width, height: asset.height};
  }
  return renderMetaPill({...pill, icon}, {tag: 'li'});
}

export function renderHeroMetadata(metadata, context) {
  return `<ul class="meta-pill_list" aria-label="${escape(required(metadata.label, 'metadata label'))}">${list(metadata.items, 'metadata').map(item => renderHeroPill(item, context)).join('')}</ul>`;
}

export function renderHeroTitle(copy, headingId, headingLevel = 1) {
  if (![1, 2, 3, 4, 5].includes(headingLevel)) throw new Error('Hero: invalid heading level');
  return `<div class="hero_title"><h${headingLevel} class="hero_heading" id="${id(headingId)}">${text(required(copy.heading, 'heading'))}</h${headingLevel}>${copy.subtitle ? `<p class="hero_subtitle">${text(copy.subtitle)}</p>` : ''}</div>`;
}

export function renderHeroCopy(copy, headingId, headingLevel = 1) {
  return `<div class="hero_copy">${renderHeroTitle(copy, headingId, headingLevel)}${copy.description ? `<p class="hero_description">${text(copy.description)}</p>` : ''}</div>`;
}

export function renderHeroButton(action, context, {link = false} = {}) {
  const record = context.actions.find(item => item.id === action.id);
  if (!record) throw new Error(`Hero: unknown action ${action.id}`);
  const variant = action.variant || 'light';
  if (!['light', 'outline'].includes(variant)) throw new Error(`Hero: invalid button variant ${variant}`);
  const className = link ? 'benefits_link' : `button button_component is-${variant}`;
  const label = text(required(action.label || record.label, 'action label'));
  const hook = `data-action="${id(action.id)}"`;
  if (record.destination === null) return `<button class="${className}" type="button" aria-disabled="true" ${hook}>${label}</button>`;
  const tildaHook = record.tilda_managed === true ? ' data-tilda-popup-link' : '';
  return `<a class="${className}" href="${url(record.destination)}" ${hook}${tildaHook}>${label}</a>`;
}

export function renderHeroNote(parts = [], context) {
  if (!Array.isArray(parts)) {
    return `<p class="hero_start-note is-with-icon">${parts.icon ? renderHeroImage(parts.icon, context, {className: 'hero_note-icon', hidden: true}) : ''}<span>${text(required(parts.text, 'note'))}</span></p>`;
  }
  return parts.length ? `<p class="hero_start-note">${parts.map(part => `<span>${text(required(part, 'note'))}</span>`).join('<span class="hero_separator" aria-hidden="true"></span>')}</p>` : '';
}

export function renderHeroActions(actions, note, context) {
  if (list(actions, 'actions').length > 2) throw new Error('Hero: dual-action supports one or two actions');
  return `<div class="hero_actions"><div class="hero_buttons">${actions.map(action => renderHeroButton(action, context)).join('')}</div>${renderHeroNote(note, context)}</div>`;
}

export function renderHeroContent(data, context) {
  return `<div class="hero_content">${renderHeroCopy(data.copy, data.heading_id, data.heading_level)}${renderHeroActions(data.actions, data.note, context)}</div>`;
}

export function renderHeroMedia(data, context) {
  if (data.image.composition && data.image.composition !== 'subject-right') throw new Error('Hero: invalid image composition');
  const className = `hero_image${data.image.composition === 'subject-right' ? ' is-subject-right' : ''}`;
  return `<div class="hero_media">${renderHeroImage(data.image, context, {className, primary: true, hidden: data.image.alt === ''})}${data.metadata ? renderHeroMetadata(data.metadata, context) : ''}${renderHeroContent(data, context)}</div>`;
}

export function renderHeroStatistic(stat) {
  return `<div class="stat-card_component"><data class="stat-card_value" value="${escape(required(stat.value, 'stat value'))}">${text(required(stat.display, 'stat display'))}</data><p class="stat-card_label">${text(required(stat.label, 'stat label'))}</p></div>`;
}

export function renderHeroVisual(data, context) {
  return `<div class="hero_visual">${renderHeroMedia(data, context)}${data.stat ? renderHeroStatistic(data.stat) : ''}</div>`;
}

export function renderAvatarGroup(group, context) {
  return `<ul class="avatar-group_list" aria-label="${escape(required(group.label, 'avatars label'))}">${list(group.items, 'avatars').map(media => {
    required(media.alt, 'avatar alt');
    return `<li class="avatar-group_item">${renderHeroImage(media, context, {className: 'avatar-group_avatar', lazy: true})}</li>`;
  }).join('')}</ul>`;
}

export function renderProgramTags(group, context) {
  return `<ul class="program-tags_list" aria-label="${escape(required(group.label, 'tags label'))}">${list(group.items, 'tags').map(tag => {
    if (tag.image) required(tag.image.alt, 'tag image alt');
    return `<li class="program-tags_tag">${tag.image ? renderHeroImage(tag.image, context, {className: 'program-tags_more', lazy: true}) : text(required(tag.text, 'tag text'))}</li>`;
  }).join('')}</ul>`;
}

export function renderBenefitContent(card, headingLevel = 2) {
  if (![2, 3, 4, 5, 6].includes(headingLevel)) throw new Error('Hero: invalid benefit heading level');
  return `<div class="card_content"><h${headingLevel} class="card_heading${card.variant === 'practice' ? ' benefits_practice' : ''}">${text(required(card.heading, 'benefit heading'))}</h${headingLevel}>${card.description ? `<p class="card_description">${text(card.description)}</p>` : ''}</div>`;
}

export function renderBenefitCard(card, context, headingLevel = 2) {
  const variants = {default: 'card_component benefits_card', diploma: 'card_component benefits_card is-diploma', practice: 'card_component is-spacious benefits_card is-wide', programs: 'card_component benefits_card is-wide is-dark'};
  const className = variants[card.variant || 'default'];
  if (!Object.hasOwn(variants, card.variant || 'default')) throw new Error(`Hero: invalid benefit variant ${card.variant}`);
  return `<li class="${className}">${renderBenefitContent(card, headingLevel)}${card.image ? renderHeroImage(card.image, context, {className: 'benefits_diploma', hidden: true, lazy: true}) : ''}${card.action ? renderHeroButton(card.action, context, {link: true}) : ''}${card.avatars ? renderAvatarGroup(card.avatars, context) : ''}${card.icon ? `<span class="card_icon benefits_icon" aria-hidden="true">${renderHeroImage(card.icon, context, {className: '', lazy: true})}</span>` : ''}${card.tags ? renderProgramTags(card.tags, context) : ''}</li>`;
}

export function renderBenefits(benefits, context, headingLevel = 2) {
  return `<ul class="card-grid_component benefits_component" aria-label="${escape(required(benefits.label, 'benefits label'))}">${list(benefits.cards, 'benefits').map(card => renderBenefitCard(card, context, headingLevel)).join('')}</ul>`;
}

export function renderHero(data, context) {
  return `<div class="hero_component is-dual-action">${renderHeroVisual(data, context)}${data.benefits ? renderBenefits(data.benefits, context, (data.heading_level || 1) + 1) : ''}</div>`;
}

export function renderHeroSection(data, context) {
  return `<section class="section_hero" aria-labelledby="${id(data.heading_id)}"><div class="padding-global"><div class="container-xlarge">${renderHero(data, context)}</div></div></section>`;
}

export function replaceHeroRegion(html, markup) {
  const start = '<!-- hero:start -->';
  const end = '<!-- hero:end -->';
  if (html.split(start).length !== 2 || html.split(end).length !== 2 || html.indexOf(end) < html.indexOf(start)) throw new Error('Hero: expected exactly one ordered hero:start/end region');
  return html.replace(/<!-- hero:start -->[\s\S]*?<!-- hero:end -->/, () => `${start}\n${markup}\n${end}`);
}
