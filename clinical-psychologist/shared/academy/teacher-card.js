/* Shared static card renderer for build-time and Tilda data refresh. */
(() => {
  const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
  const text = (value) => escape(value).replace(/\u00a0/g, ' ').replace(/(^|[\s(])([АаВвИиКкОоСсУуЯя]|во|до|за|из|на|не|ни|но|об|от|по|со|без|для|над|под|при|про) /g, '$1$2&nbsp;').replace(/ (—|бы|же|ли)(?=\s|[,.!?]|$)/g, '&nbsp;$1');
  const photoUrl = (value) => {
    if (value == null || value === '') return '';
    if (typeof value !== 'string') throw new Error('photo должна быть ссылкой или null.');
    if (/^teacher:[a-z0-9-]+$/.test(value) || /^assets\/images\/teachers\/[a-z0-9-]+\.webp$/.test(value)) return value;
    let url;
    try { url = new URL(value); } catch { throw new Error('Некорректная ссылка photo.'); }
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Для photo нужна ссылка HTTPS.');
    return url.href;
  };
  function validate(data) {
    if (!Array.isArray(data) || !data.length) throw new Error('Нужен непустой список преподавателей.');
    const ids = new Set();
    return data.map((item) => {
      if (!item || !/^[a-z][a-z0-9-]*$/.test(item.id) || ids.has(item.id)) throw new Error('У каждого преподавателя должен быть уникальный id латиницей.');
      ids.add(item.id);
      for (const key of ['name', 'description']) if (typeof item[key] !== 'string' || !item[key].trim()) throw new Error(`Заполните ${key}: ${item.id}.`);
      if (item.tag != null && typeof item.tag !== 'string') throw new Error(`Тег должен быть текстом: ${item.id}.`);
      const crop = item.crop;
      if (crop && (!Array.isArray(crop) || crop.length !== 4 || !crop.every(Number.isFinite) || crop[0] <= 0 || crop[1] <= 0)) throw new Error(`Некорректная обрезка: ${item.id}.`);
      const width = Number.isInteger(item.width) && item.width > 0 ? item.width : undefined;
      const height = Number.isInteger(item.height) && item.height > 0 ? item.height : undefined;
      return {id: item.id, name: item.name.trim(), tag: (item.tag || '').trim(), description: item.description.trim(), photo: photoUrl(item.photo), crop, width, height};
    });
  }
  function render(record, {headingLevel = 3} = {}) {
    if (![2, 3, 4, 5, 6].includes(headingLevel)) throw new Error('Invalid teacher heading level.');
    const teacher = validate([record])[0];
    const assetKey = teacher.photo.startsWith('teacher:') ? teacher.photo.slice(8) : '';
    const source = assetKey ? 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' : teacher.photo;
    const crop = teacher.crop ? ` style="--teacher-image-width:${teacher.crop[0]}%;--teacher-image-height:${teacher.crop[1]}%;--teacher-image-left:${teacher.crop[2]}%;--teacher-image-top:${teacher.crop[3]}%"` : '';
    const media = source
      ? `<img class="teacher-card_image" src="${escape(source)}"${assetKey ? ` data-teacher-asset="${assetKey}"` : ''}${teacher.width && teacher.height ? ` width="${teacher.width}" height="${teacher.height}"` : ''} alt="${escape(teacher.name)} — преподаватель курса" loading="lazy" decoding="async" draggable="false">`
      : `<span class="teacher-card_initials" aria-hidden="true">${escape(teacher.name.split(/\s+/).map(part => part[0]).slice(0, 2).join(''))}</span>`;
    return `<article class="teacher-card_component"><div class="teacher-card_media"${crop}>${media}${teacher.tag ? `<span class="teacher-card_tag">${text(teacher.tag)}</span>` : ''}</div><div class="content-header_component teacher-card_copy"><h${headingLevel} class="content-heading_component is-profile teacher-card_name">${text(teacher.name)}</h${headingLevel}><p class="body-text_component is-reading is-profile teacher-card_description">${text(teacher.description)}</p></div></article>`;

  }
  globalThis.AcademyTeacherCard = {render, validate, text};
})();
