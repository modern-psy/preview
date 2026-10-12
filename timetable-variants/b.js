/*
  ============================================================================
  ВАРИАНТ B · УКАЗАТЕЛЬ КУРСОВ — программа страницы

  1. Потоки одного курса собираются в одну строку с билетиками.
  2. Разделы как в каталоге + «Бесплатно» и «Лист ожидания».
     Число в табе — сколько курсов там найдётся с учётом поиска.
  3. Порядок: по ближайшему старту (с разделителями по месяцам)
     или по алфавиту (с буквами).
  ============================================================================
*/
(function () {
  'use strict';

  var T = window.TT;
  var NB = T.NBSP;
  var $ = function (id) { return document.getElementById(id); };

  var state = { tab: 'all', sort: 'date', query: '' };
  var data = null, entries = null;

  var TABS = [
    { key: 'all', label: 'Все курсы' },
    { key: 'Профессии', label: 'Профессии' },
    { key: 'Методы психотерапии', label: 'Методы психотерапии' },
    { key: 'Специализации', label: 'Специализации' },
    { key: 'free', label: 'Бесплатно' },
    { key: 'waitlist', label: 'Лист ожидания' }
  ];

  function plural(n, f) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return f[2];
    if (b > 1 && b < 5) return f[1];
    if (b === 1) return f[0];
    return f[2];
  }

  /* ---------- Курс = все его потоки ---------- */
  function buildEntries() {
    var paid = [], seen = {};
    data.courses.forEach(function (it) {
      if (seen[it.slug]) return;
      seen[it.slug] = true;
      var next = it.streams.filter(function (s) { return !s.started; })[0] || null;
      paid.push({ head: it, streams: it.streams, group: 'paid', sortDate: next ? next.start : it.start, onlyStarted: !next });
    });
    data.anytime.forEach(function (it) { paid.push({ head: it, streams: [], group: 'paid', sortDate: null, anytime: true }); });

    var free = data.events.map(function (it) { return { head: it, streams: [it], group: 'free', sortDate: it.start }; })
      .concat(data.minis.map(function (it) { return { head: it, streams: [], group: 'free', sortDate: null }; }));

    var wait = data.waitlist.map(function (it) { return { head: it, streams: [], group: 'waitlist', sortDate: null }; });
    return paid.concat(free, wait);
  }

  function inTab(e, key) {
    if (key === 'free') return e.group === 'free';
    if (key === 'waitlist') return e.group === 'waitlist';
    if (key === 'all') return e.group === 'paid';
    return e.group === 'paid' && e.head.section === key;
  }

  function visible(key) {
    return entries.filter(function (e) { return inTab(e, key) && T.matches(e.head, state.query); });
  }

  /* ---------- Билетики ---------- */
  function ticket(it) {
    var p = it.price;
    var cls = 'stream-ticket_component' + (it.started ? ' is-started' : '');
    var date = it.started ? 'идёт с ' + T.dateLong(it.start) : T.dateLong(it.start) + ', ' + T.weekday(it.start);
    var when = it.started ? 'можно присоединиться'
      : it.kind === 'event' ? (it.time ? 'эфир в ' + it.time.label : 'эфир')
      : T.whenLine(it);

    var price = '';
    if (p.value === 0) price = '<span class="text-size-paragraph-sm text-weight-semibold text-color-heading">Бесплатно</span>';
    else if (p.value != null) {
      if (p.before) price += '<span class="text-size-caption-sm text-style-strikethrough text-color-secondary">' + T.money(p.before) + '</span>';
      price += '<span class="text-size-paragraph-sm text-weight-semibold text-color-heading">' + (p.from ? 'от' + NB : '') + T.money(p.value) + '</span>';
    }

    return '<span class="' + cls + '">' +
      '<span class="stream-ticket_top">' +
        '<span class="stream-ticket_date text-size-paragraph-sm text-weight-semibold">' + date + '</span>' +
        '<span class="stream-ticket_price">' + price + '</span>' +
      '</span>' +
      '<span class="text-size-caption-md text-color-secondary">' + T.esc(when) + '</span>' +
      T.promoChip(it) +
    '</span>';
  }

  function plainTicket(left, right, caption) {
    return '<span class="stream-ticket_component">' +
      '<span class="stream-ticket_top">' +
        '<span class="stream-ticket_date text-size-paragraph-sm text-weight-semibold">' + left + '</span>' +
        (right ? '<span class="stream-ticket_price text-size-paragraph-sm text-weight-semibold text-color-heading">' + right + '</span>' : '') +
      '</span>' +
      (caption ? '<span class="text-size-caption-md text-color-secondary">' + caption + '</span>' : '') +
    '</span>';
  }

  function entryHtml(e) {
    var it = e.head;
    var tickets = '';
    if (e.streams.length) {
      tickets = e.streams.map(function (s) { return ticket(s); }).join('');
    } else if (it.kind === 'mini') {
      tickets = plainTicket('В любой момент', 'Бесплатно', 'в своём темпе');
    } else if (it.kind === 'waitlist') {
      tickets = it.price.booking
        ? plainTicket('Дата позже', T.money(it.price.booking), 'бронь места на курсе')
        : plainTicket('Дата позже', '', 'оставьте заявку на странице курса');
    } else if (it.kind === 'anytime') {
      tickets = plainTicket('Старт в любое время', it.price.value ? T.money(it.price.value) : '', it.price.monthly ? 'или ' + T.money(it.price.monthly) + '/мес' : '');
    }

    var meta = [];
    if (state.tab === 'all' && it.section) meta.push(it.section);
    var ml = T.metaLine(it);
    if (ml) meta.push(ml);
    if (it.kind === 'event') meta.push('бесплатный эфир');

    return '<a class="course-entry_component" href="' + T.esc(it.url) + '" target="_blank" rel="noopener">' +
      '<span class="course-entry_main">' +
        '<h3 class="course-entry_title text-size-paragraph-md text-weight-medium text-color-heading text-style-break">' + T.esc(it.title) + '</h3>' +
        (meta.length ? '<span class="text-size-caption-md text-color-secondary">' + T.esc(meta.join(', ')) + '</span>' : '') +
      '</span>' +
      '<span class="course-entry_streams">' + tickets + '</span>' +
    '</a>';
  }

  /* ---------- Группы ---------- */
  function groupsOf(list) {
    var groups = [], map = {};
    function push(key, title, e) {
      var g = map[key];
      if (!g) { g = map[key] = { key: key, title: title, items: [] }; groups.push(g); }
      g.items.push(e);
    }

    if (state.sort === 'az') {
      list.slice().sort(function (a, b) { return a.head.title.localeCompare(b.head.title, 'ru'); })
        .forEach(function (e) { var l = e.head.title.charAt(0).toUpperCase(); push(l, l, e); });
      return groups;
    }

    // По ближайшему старту
    var started = [], dated = [], undated = [];
    list.forEach(function (e) {
      if (e.onlyStarted) started.push(e);
      else if (e.sortDate) dated.push(e);
      else undated.push(e);
    });
    started.forEach(function (e) { push('started', 'Уже идут, ещё можно присоединиться', e); });
    dated.sort(function (a, b) { return a.sortDate - b.sortDate; }).forEach(function (e) {
      var d = e.sortDate;
      var withYear = data.showYear && d.getFullYear() !== data.today.getFullYear();
      var title = e.group === 'free' ? 'Бесплатные эфиры' : 'Ближайший старт — ' + T.monthTitle(d, withYear).toLowerCase();
      push(e.group === 'free' ? 'events' : d.getFullYear() + '-' + d.getMonth(), title, e);
    });
    undated.forEach(function (e) {
      var title = e.group === 'free' ? 'Мини-курсы: начать можно сразу' : e.group === 'waitlist' ? 'Даты старта пока нет' : 'Старт в любое время';
      push('undated-' + e.group, title, e);
    });
    return groups;
  }

  /* ---------- Отрисовка ---------- */
  function renderTabs() {
    $('tabs').innerHTML = TABS.map(function (t) {
      var n = visible(t.key).length;
      var on = state.tab === t.key;
      return '<button type="button" class="tabs_item' + (on ? ' is-active' : '') + '" data-tab="' + t.key + '" aria-pressed="' + on + '">' +
        t.label + ' <span class="index-bar_count">' + n + '</span></button>';
    }).join('');
  }

  function renderList() {
    var list = visible(state.tab);
    var html = '';

    if (!list.length) {
      var elsewhere = TABS.filter(function (t) { return t.key !== state.tab && visible(t.key).length; });
      html += '<div class="card timetable-empty_component margin-top margin-small">' +
        '<h2 class="heading-style-h4">' + (state.query ? 'Здесь не нашлось «' + T.esc(state.query) + '»' : 'Здесь пока пусто') + '</h2>' +
        (elsewhere.length
          ? '<p class="text-size-caption-md text-color-secondary">Есть в других разделах:</p><p class="index-hint_component text-size-caption-md">' +
            elsewhere.map(function (t) { return '<button type="button" class="index-hint_link text-link" data-go="' + t.key + '">' + t.label + ' (' + visible(t.key).length + ')' + '</button>'; }).join('') + '</p>'
          : '<p class="text-size-caption-md text-color-secondary">Попробуйте другое слово: КПТ, ACT, схема, травма.</p>') +
      '</div>';
    }

    groupsOf(list).forEach(function (g) {
      // «Последний шанс» — курсы уже начались, идёт донабор. Приоритет: первым и раскрыт.
      if (g.key === 'started') {
        html += '<section class="index-started_component" aria-labelledby="lastCallTitle">' +
          '<div class="timetable-list_heading">' +
            '<h2 class="heading-style-h4" id="lastCallTitle">Последний шанс</h2>' +
            '<p class="text-size-caption-md text-color-secondary">Курсы уже начались, идёт донабор. Ещё можно присоединиться.</p>' +
          '</div>' +
          '<div class="card month-panel_component">' + g.items.map(entryHtml).join('') + '</div></section>';
        return;
      }
      html += '<h2 class="index-group_heading heading-style-h6 text-color-secondary">' + g.title + '</h2>' +
        '<div class="card month-panel_component">' + g.items.map(entryHtml).join('') + '</div>';
    });

    $('list').innerHTML = html;
  }

  function update() { renderTabs(); renderList(); }

  /* ---------- События ---------- */
  $('tabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tab]');
    if (!b) return;
    state.tab = b.dataset.tab;
    update();
  });

  document.querySelector('.index-bar_sort').addEventListener('click', function (e) {
    var b = e.target.closest('[data-sort]');
    if (!b) return;
    state.sort = b.dataset.sort;
    Array.prototype.forEach.call(document.querySelectorAll('[data-sort]'), function (x) {
      x.setAttribute('aria-pressed', String(x === b));
    });
    if (data) renderList();
  });

  function onGo(e) {
    var b = e.target.closest('[data-go]');
    if (!b) return;
    state.tab = b.dataset.go;
    update();
    $('indexBar').scrollIntoView({ block: 'start' });
  }
  $('list').addEventListener('click', onGo);

  var timer;
  $('search').addEventListener('input', function (e) {
    clearTimeout(timer);
    $('clearSearch').hidden = !e.target.value;
    timer = setTimeout(function () { state.query = e.target.value.trim(); if (data) update(); }, 120);
  });
  $('clearSearch').addEventListener('click', function () {
    $('search').value = '';
    $('clearSearch').hidden = true;
    state.query = '';
    if (data) update();
    $('search').focus();
  });

  /* ---------- Запуск ---------- */
  $('list').innerHTML = '<div class="margin-top margin-small">' + T.skeletonPanel(6) + '</div>';
  $('tabs').innerHTML = TABS.map(function (t) { return '<span class="tabs_item">' + t.label + '</span>'; }).join('');

  T.load().then(function (d) {
    data = d;
    entries = buildEntries();
    update();
    if (!d.live) {
      var note = $('sourceNote');
      note.hidden = false;
      note.textContent = T.snapshotNote(d);
    }
  }).catch(function () {
    $('list').innerHTML = T.failCard();
  });
})();
