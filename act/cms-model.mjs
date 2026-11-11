// Привязка к Public API. Менять данные курса нужно в CMS, а не в этом файле.
export const API = 'https://modern-psy-asp-prod-8ceb.twc1.net';
export const SLUG = 'act';
const text = value => typeof value === 'string' ? value.trim() : '';
const statusKey = value => text(value).toLowerCase().replaceAll('ё', 'е');
const visible = new Set(['идет набор', 'последний шанс', 'лист ожидания', 'старт в любое время']);
export function formatStart(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(+date) || date.toISOString().slice(0, 10) !== value) return null;
  return new Intl.DateTimeFormat('ru-RU', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'}).format(date).replace(/\s*г\.$/, '').trim();
}
export function createHeroModel(course, card) {
  if (course?.slug !== SLUG || !text(course.title) || !Array.isArray(course.streams)) throw new Error('Некорректная карточка ACT');
  const streams = course.streams.filter(s => visible.has(statusKey(s.status))).map(s => ({
    label: text(s.label), date: formatStart(s.startDate), startDate: formatStart(s.startDate) ? s.startDate : null,
    status: text(s.status).replace(/^Идет/, 'Идёт'), schedule: text(s.schedule),
    tone: statusKey(s.status) === 'лист ожидания' ? 'neutral' : statusKey(s.status) === 'последний шанс' ? 'warn' : 'open'
  })).sort((a, b) => (a.startDate || '9999').localeCompare(b.startDate || '9999'));
  return {
    title: text(course.title), description: text(course.description), educationLevel: text(course.educationLevel),
    documents: [...new Set((Array.isArray(course.documents) ? course.documents : []).map(text).filter(Boolean))],
    hours: card?.slug === SLUG && Number.isInteger(card.hours) && card.hours > 0 ? card.hours : null,
    streams
  };
}
export const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const copy = value => escapeHtml(value).replace(/(^|[\s>])(в|и|к|о|с|у|во|до|за|из|на|не|но|об|от|по|со|без|для|под|при|про) /giu, '$1$2&nbsp;');
export function renderTitle(title) {
  return copy(title);
}
export function renderStreamsLine(streams) {
  const dates = streams.filter(stream => stream.startDate).map(stream => {
    const date = new Intl.DateTimeFormat('ru-RU', {day: 'numeric', month: 'long', timeZone: 'UTC'}).format(new Date(`${stream.startDate}T00:00:00Z`));
    return `<time datetime="${escapeHtml(stream.startDate)}">${copy(date)}</time>`;
  });
  if (!dates.length) return '';
  return `Старт ${dates.length === 1 ? dates[0] : dates.slice(0, -1).join(', ') + ' и ' + dates.at(-1)}`;
}
export function renderStreams(streams) {
  return streams.map(stream => `<li class="act-streams_card" aria-label="${escapeHtml(stream.label || stream.date || 'Поток курса')}">
    <div class="act-streams_top"><span class="chip is-${stream.tone}">${copy(stream.status)}</span></div>
    <p class="act-streams_date text-size-body text-weight-medium">${stream.date ? `<time datetime="${escapeHtml(stream.startDate)}">${copy(stream.date)}</time>` : copy(stream.label || 'Дата уточняется')}</p>
    ${stream.schedule ? `<p class="act-streams_schedule text-size-note text-color-secondary">${copy(stream.schedule)}</p>` : ''}
  </li>`).join('');
}
// Одни и те же функции используются при сборке и при обновлении страницы в браузере.
export function renderCmsField(field, model) {
  if (field === 'course-title') return renderTitle(model.title);
  if (field === 'course-description') return copy(model.description);
  if (field === 'education-level') return copy(model.educationLevel);
  if (field === 'documents') return model.documents.map(copy).join('<br>');
  if (field === 'course-hours') return model.hours === null ? '' : `${model.hours}&nbsp;академ.&nbsp;ч.`;
  if (field === 'streams') return renderStreams(model.streams);
  if (field === 'streams-line') return renderStreamsLine(model.streams);
  throw new Error(`Неизвестное поле Hero: ${field}`);
}
