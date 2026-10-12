/*
  ============================================================================
  ВАРИАНТ A · ПОД МОЙ ГРАФИК · версия 2 — программа страницы

  1. Рисует ивент первым блоком — тот, что задан в FEATURED ниже.
  2. Навигатор по дням: курс остаётся в списке, если ВСЕ его дни
     занятий попадают в отмеченные. Курсы без постоянных дней
     (интенсивы, дни уточняются) не пропадают молча — уходят в свою группу.
  3. «Последний шанс» — уже начавшиеся курсы, донабор. Всегда первым и раскрыт.
  4. Потоки по месяцам.
  ============================================================================
*/
(function () {
  'use strict';

  /* ==========================================================================
     🟢 ИВЕНТ ПЕРВЫМ БЛОКОМ — выбирается вручную, автоматики нет.

     Ивент есть в CMS (вебинар с датой): достаточно слага и подписи типа,
     дата, время, ссылка, описание и обложка подтянутся сами:
       { slug: 'hudet-snova-modno', kind: 'Бесплатный вебинар' }
     Обложку из каталога можно заменить картинкой с лендинга — поле cover.

     Ивента нет в CMS (например, конференция): заполнить поля руками:
       { kind: 'Конференция', title: 'Студенческая конференция 2.0',
         date: '2026-11-21', time: '11:00', url: 'https://modern-psy.ru/student-conference',
         description: 'Короткое описание в одно-два предложения.',
         cover: 'https://…/cover.webp' }

     null — блока нет. Когда дата ивента прошла, блок прячется сам.
     ========================================================================== */
  var FEATURED = {
    slug: 'hudet-snova-modno',
    kind: 'Бесплатный вебинар',
    // картинка первого экрана лендинга, 1920×960
    cover: 'https://s3.twcstorage.ru/asp-media/hero_5b9e6710c8.webp'
  };

  var T = window.TT;
  var NB = T.NBSP;
  var $ = function (id) { return document.getElementById(id); };
  var DAY_NAMES = { 1: 'понедельник', 2: 'вторник', 3: 'среда', 4: 'четверг', 5: 'пятница', 6: 'суббота', 0: 'воскресенье' };

  var state = { days: {} };
  var data = null;

  function hasDays() { return Object.keys(state.days).length > 0; }
  function chosenDays() { return T.WEEK.filter(function (d) { return state.days[d]; }); }

  // Курс подходит, если все его дни занятий — среди отмеченных
  function fits(it) {
    if (!hasDays()) return true;
    return it.days.length > 0 && it.days.every(function (d) { return state.days[d]; });
  }

  // Платные потоки: идут сейчас, стартуют позже, старт в любое время
  function pool() {
    return data.started.concat(data.upcoming, data.anytime);
  }

  /* ---------- 1. ИВЕНТ ---------- */
  function renderFeatured() {
    var box = $('featured');
    if (!FEATURED) { box.innerHTML = ''; return; }

    var ev;
    if (FEATURED.slug) {
      var found = data.events.filter(function (it) { return it.slug === FEATURED.slug; })[0];
      if (!found) { box.innerHTML = ''; return; }   // прошёл или снят с публикации
      ev = {
        title: found.title, url: found.url, start: found.start,
        time: found.time ? found.time.label + (found.msk ? NB + 'мск' : '') : '',
        description: found.description, cover: FEATURED.cover || found.cover
      };
    } else {
      var start = T.parseDate(FEATURED.date);
      if (!start || start < new Date(data.today.getFullYear(), data.today.getMonth(), data.today.getDate())) { box.innerHTML = ''; return; }
      ev = { title: FEATURED.title, url: FEATURED.url, start: start, time: FEATURED.time || '', description: FEATURED.description, cover: FEATURED.cover };
    }

    // Подпись типа не повторяем, если описание из CMS и так с неё начинается
    var showKind = FEATURED.kind && !(ev.description && ev.description.toLowerCase().indexOf(FEATURED.kind.toLowerCase()) === 0);

    box.innerHTML = '<section class="card featured-event_component" aria-labelledby="featuredTitle">' +
      (ev.cover ? '<img class="featured-event_cover" src="' + T.esc(ev.cover) + '" alt="" width="1920" height="960" />' : '') +
      '<div class="featured-event_body">' +
        '<p class="featured-event_date">' +
          '<span class="featured-event_day text-size-display-md text-weight-medium">' + ev.start.getDate() + '</span>' +
          ' <span class="text-size-paragraph-sm text-weight-medium">' + T.monthShort(ev.start) + ', ' + T.weekday(ev.start) + '</span>' +
          (ev.time ? ' <span class="text-size-paragraph-sm text-weight-medium">' + T.esc(ev.time) + '</span>' : '') +
        '</p>' +
        '<div class="featured-event_text">' +
          '<h2 class="featured-event_title heading-style-h3" id="featuredTitle">' + T.title(ev.title) + '</h2>' +
          (showKind ? '<p class="text-size-paragraph-sm text-weight-medium text-color-accent">' + T.esc(FEATURED.kind) + '</p>' : '') +
          (ev.description ? '<p class="featured-event_desc text-size-paragraph-sm text-color-secondary">' + T.esc(ev.description) + '</p>' : '') +
          '<a class="button is-md" href="' + T.esc(ev.url) + '" target="_blank" rel="noopener">Записаться</a>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  /* ---------- 2. НАВИГАТОР ---------- */
  function renderPicker() {
    $('dayPicker').innerHTML = T.WEEK.map(function (d) {
      return '<button type="button" class="day-picker_day text-size-paragraph-sm text-weight-medium" data-day="' + d + '"' +
        ' aria-pressed="' + !!state.days[d] + '" aria-label="' + DAY_NAMES[d] + '">' + T.WEEKDAYS[d] + '</button>';
    }).join('');
  }

  function syncPicker() {
    Array.prototype.forEach.call($('dayPicker').querySelectorAll('[data-day]'), function (b) {
      b.setAttribute('aria-pressed', String(!!state.days[b.dataset.day]));
    });
    $('resetDays').hidden = !hasDays();
  }

  /* ---------- 3. СПИСОК ---------- */
  function section(title, inner, id) {
    return '<section class="timetable-list_group"' + (id ? ' id="' + id + '"' : '') + '>' +
      '<div class="month-panel_heading"><h2 class="heading-style-h3">' + title + '</h2></div>' +
      '<div class="card month-panel_component is-underlay">' + inner + '</div>' +
    '</section>';
  }

  // Секция с подписью под заголовком: «Лист ожидания», «Без постоянных дней»
  function captioned(title, caption, inner, id) {
    return '<section class="timetable-list_group"' + (id ? ' id="' + id + '"' : '') + '>' +
      '<div class="timetable-list_heading"><h2 class="heading-style-h3">' + title + '</h2>' +
        '<p class="text-size-paragraph-sm text-color-secondary">' + caption + '</p></div>' +
      '<div class="card month-panel_component is-underlay">' + inner + '</div>' +
    '</section>';
  }

  function rows(list, opts) { return list.map(function (it) { return T.row(it, opts); }).join(''); }

  function renderList() {
    var items = pool();
    var shown = items.filter(function (it) { return !hasDays() || (it.days.length && fits(it)); });
    var unscheduled = hasDays() ? items.filter(function (it) { return !it.days.length; }) : [];
    var html = '';

    var started = shown.filter(function (it) { return it.started; });
    var upcoming = shown.filter(function (it) { return !it.started && it.kind === 'course'; });
    var anytime = shown.filter(function (it) { return it.kind === 'anytime'; });

    if (!shown.length) {
      html += '<div class="card timetable-empty_component timetable-list_group">' +
        '<h2 class="heading-style-h4">Курсов только в эти дни нет</h2>' +
        '<p class="text-size-caption-md text-color-secondary">Добавьте ещё один свободный день — у многих курсов занятия дважды в неделю.</p>' +
        '<button class="button is-sm is-secondary" type="button" data-reset>Сбросить дни</button>' +
      '</div>';
    }

    html += T.lastCall(started);

    T.byMonth(upcoming).forEach(function (g) {
      var withYear = data.showYear && g.date.getFullYear() !== data.today.getFullYear();
      html += section(T.monthTitle(g.date, withYear), rows(g.items), 'month-' + g.key);
    });

    if (anytime.length) html += section('Старт в любое время', rows(anytime));

    if (unscheduled.length) {
      html += captioned('Без постоянных дней', 'Интенсивы и курсы, у которых дни занятий ещё уточняются.', rows(unscheduled), 'unscheduled');
    }

    var wait = data.waitlist;
    if (wait.length) {
      html += captioned('Лист ожидания', 'Даты старта пока нет. Оставьте заявку — место можно забронировать.', rows(wait), 'waitlist');
    }

    $('list').innerHTML = html;
    $('stickyText').textContent = hasDays() ? 'Свободные дни: ' + T.daysLabel(chosenDays()) : 'Все дни';
  }

  /* ---------- ЛИПКАЯ СТРОКА ---------- */
  function watchSticky() {
    if (!window.IntersectionObserver) return;
    var io = new IntersectionObserver(function (entries) {
      var e = entries[0];
      var gone = !e.isIntersecting && e.boundingClientRect.top < 0;
      $('stickyBar').hidden = !(gone && hasDays());
    });
    io.observe($('picker'));
  }

  function update() { syncPicker(); renderList(); }

  /* ---------- СОБЫТИЯ ---------- */
  $('dayPicker').addEventListener('click', function (e) {
    var b = e.target.closest('[data-day]');
    if (!b) return;
    var d = b.dataset.day;
    if (state.days[d]) delete state.days[d]; else state.days[d] = true;
    if (data) update();
  });
  $('resetDays').addEventListener('click', function () { state.days = {}; if (data) update(); });
  $('stickyEdit').addEventListener('click', function () {
    $('picker').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });

  $('list').addEventListener('click', function (e) {
    if (e.target.closest('[data-reset]')) {
      state.days = {};
      update();
    }
  });

  /* ---------- ЗАПУСК ---------- */
  renderPicker();
  $('list').innerHTML = '<div class="timetable-list_group">' + T.skeletonPanel(5) + '</div>';

  T.load().then(function (d) {
    data = d;
    renderFeatured();
    update();
    watchSticky();
    if (!d.live) {
      var note = $('sourceNote');
      note.hidden = false;
      note.textContent = T.snapshotNote(d);
    }
  }).catch(function () {
    $('list').innerHTML = T.failCard();
  });
})();
