/* One shared layout for server rendering and editable Tilda data. */
(() => {
  const {validate, text} = globalThis.AcademyTeacherCard;
  const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  function render(data, prefix = 'academy-teachers', labels = {}) {
    if (!/^[a-z][a-z0-9-]*$/.test(prefix)) throw new Error('Некорректный id секции.');
    const teachers = validate(data);
    const links = teachers.map((teacher) => `<a class="teachers_tab" href="#${prefix}-${teacher.id}" data-js="teacher-tab" data-teacher-id="${teacher.id}">${text(teacher.name)}</a>`);
    const rowCount = links.length > 8 ? 3 : 1;
    const split = Math.ceil(links.length / rowCount);
    const tabs = Array.from({length: rowCount}, (_, index) => links.slice(index * split, (index + 1) * split)).filter(row => row.length).map(row => `<div class="teachers_tab-row">${row.join('\n')}</div>`).join('\n');
    const slides = teachers.map(teacher => `<li class="teachers_slide splide__slide" id="${prefix}-${teacher.id}" data-teacher-id="${teacher.id}">${globalThis.AcademyTeacherCard.render(teacher)}</li>`).join('\n');
    return `<div class="teachers_layout"><div class="teachers_navigation" data-js="teacher-navigation"><div class="teachers_tabs" data-js="teacher-tabs" aria-label="${escape(labels.tabsLabel || 'Выбрать преподавателя')}">${tabs}</div></div><div class="teachers_slider splide" data-js="teacher-slider" id="${prefix}-slider" aria-label="${escape(labels.sliderLabel || 'Преподаватели курса')}"><div class="teachers_track splide__track"><ul class="teachers_list splide__list">${slides}</ul></div></div></div>`;
  }
  globalThis.AcademyTeacherTemplate = {render, validate};
})();
