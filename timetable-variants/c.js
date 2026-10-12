/*
  ============================================================================
  ВАРИАНТ C · ФИЛЬТРЫ И ШКАЛА — программа страницы

  Пять групп фильтров. Внутри группы варианты складываются («октябрь
  ИЛИ ноябрь»), между группами — пересекаются («октябрь И диплом»).
  Число рядом с вариантом — сколько потоков будет, если его включить;
  варианты, после которых ничего не останется, выключены.
  ============================================================================
*/
(function () {
  'use strict';

  var T = window.TT;
  var NB = T.NBSP;
  var $ = function (id) { return document.getElementById(id); };

  var data = null;
  var state = { query: '', f: { month: {}, when: {}, doc: {}, section: {}, price: {} } };

  function plural(n, f) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return f[2];
    if (b > 1 && b < 5) return f[1];
    if (b === 1) return f[0];
    return f[2];
  }
  var STREAMS = ['поток', 'потока', 'потоков'];

  /* ---------- ГРУППЫ ФИЛЬТРОВ ---------- */
  // test(it, value) — подходит ли поток под вариант
  var GROUPS = [
    {
      key: 'month', title: 'Месяц старта',
      options: function () {
        var seen = {}, out = [];
        pool().forEach(function (it) {
          if (!it.start || seen[it.monthKey]) return;
          seen[it.monthKey] = true;
          var withYear = data.showYear && it.start.getFullYear() !== data.today.getFullYear();
          out.push({ value: it.monthKey, label: T.monthTitle(it.start, withYear) });
        });
        return out;
      },
      test: function (it, v) { return it.monthKey === v; }
    },
    {
      key: 'when', title: 'Когда удобно',
      options: function () {
        return [
          { value: 'wd-evening', label: 'Будни вечером' },
          { value: 'wd-day', label: 'Будни днём' },
          { value: 'weekend', label: 'Выходные' },
          { value: 'intensive', label: 'Интенсив или без дней' }
        ];
      },
      test: function (it, v) {
        var wd = it.days.filter(function (d) { return d >= 1 && d <= 5; });
        if (v === 'wd-evening') return wd.length > 0 && it.band !== 'day';
        if (v === 'wd-day') return wd.length > 0 && it.band !== 'evening';
        if (v === 'weekend') return it.days.indexOf(6) >= 0 || it.days.indexOf(0) >= 0;
        return !it.days.length;
      }
    },
    {
      key: 'doc', title: 'Документ',
      options: function () {
        return [
          { value: 'Диплом', label: 'Диплом' },
          { value: 'Удостоверение', label: 'Удостоверение' }
        ];
      },
      test: function (it, v) { return it.doc === v; }
    },
    {
      key: 'section', title: 'Направление',
      options: function () {
        return [
          { value: 'Профессии', label: 'Профессии' },
          { value: 'Методы психотерапии', label: 'Методы психотерапии' },
          { value: 'Специализации', label: 'Специализации' }
        ];
      },
      test: function (it, v) { return it.section === v; }
    },
    {
      key: 'price', title: 'Стоимость',
      options: function () {
        return [
          { value: 'low', label: 'до 40' + NB + '000' + NB + '₽' },
          { value: 'mid', label: '40–100' + NB + 'тыс.' + NB + '₽' },
          { value: 'high', label: 'больше 100' + NB + 'тыс.' + NB + '₽' }
        ];
      },
      test: function (it, v) {
        var p = it.price.value;
        if (p == null) return false;
        if (v === 'low') return p <= 40000;
        if (v === 'mid') return p > 40000 && p <= 100000;
        return p > 100000;
      }
    }
  ];

  function pool() {
    return data.started.concat(data.upcoming, data.anytime);
  }

  function chosen(groupKey) { return Object.keys(state.f[groupKey]); }
  function activeCount() {
    return GROUPS.reduce(function (n, g) { return n + chosen(g.key).length; }, 0);
  }

  // Проходит ли поток все группы, кроме skip (для подсчёта чисел у вариантов)
  function passes(it, skip) {
    if (!T.matches(it, state.query)) return false;
    return GROUPS.every(function (g) {
      if (g.key === skip) return true;
      var vals = chosen(g.key);
      return !vals.length || vals.some(function (v) { return g.test(it, v); });
    });
  }

  /* ---------- ПАНЕЛЬ ---------- */
  function renderFacets() {
    var items = pool();
    var html = '';

    GROUPS.forEach(function (g) {
      var base = items.filter(function (it) { return passes(it, g.key); });
      var opts = g.options().map(function (o) {
        var n = base.filter(function (it) { return g.test(it, o.value); }).length;
        return { value: o.value, label: o.label, n: n, on: !!state.f[g.key][o.value] };
      });

      html += '<fieldset class="filter-group_component">' +
        '<legend class="filter-group_legend text-size-caption-md text-weight-semibold text-color-heading">' + g.title + '</legend>';

      if (g.key === 'month') {
        // Полоски считаем от самого насыщенного месяца БЕЗ фильтров:
        // иначе при одном потоке в месяце полоска рисовалась бы на всю ширину
        var full = {};
        items.forEach(function (it) { if (it.monthKey) full[it.monthKey] = (full[it.monthKey] || 0) + 1; });
        var max = Math.max.apply(null, Object.keys(full).map(function (k) { return full[k]; }).concat([1]));
        html += '<div class="month-ruler_component">' + opts.map(function (o) {
          return '<button type="button" class="month-ruler_option text-size-caption-md" data-group="month" data-value="' + o.value + '"' +
            ' aria-pressed="' + o.on + '"' + (o.n || o.on ? '' : ' disabled') +
            ' aria-label="' + o.label + ': ' + o.n + ' ' + plural(o.n, STREAMS) + '" style="--share:' + Math.round(o.n / max * 100) + '%">' +
            '<span>' + o.label + '</span>' +
            '<span class="month-ruler_track" aria-hidden="true"><span class="month-ruler_bar"></span></span>' +
            '<span class="month-ruler_count text-weight-medium">' + o.n + '</span>' +
          '</button>';
        }).join('') + '</div>';
      } else {
        html += opts.map(function (o) {
          return '<button type="button" class="filter-option_component text-size-caption-md" data-group="' + g.key + '" data-value="' + o.value + '"' +
            ' aria-pressed="' + o.on + '"' + (o.n || o.on ? '' : ' disabled') + '>' +
            '<span class="filter-option_box" aria-hidden="true"><span class="icon is-xs" style="--icon-url:url(\'/timetable-variants/icons/check.svg\')"></span></span>' +
            '<span>' + o.label + '</span>' +
            '<span class="filter-option_count">' + o.n + '</span>' +
          '</button>';
        }).join('');
      }
      html += '</fieldset>';
    });

    if (activeCount()) {
      html += '<button class="button is-sm is-link" type="button" data-reset-all>Сбросить все фильтры</button>';
    }
    $('facets').innerHTML = html;
  }

  /* ---------- ПРАВАЯ ЧАСТЬ ---------- */
  function renderChips(shownCount) {
    var all = pool().length;
    $('resultCount').textContent = (activeCount() || state.query)
      ? 'Подходит ' + shownCount + ' ' + plural(shownCount, STREAMS) + ' из ' + all
      : all + ' ' + plural(all, STREAMS);

    var chips = '';
    GROUPS.forEach(function (g) {
      var opts = g.options();
      chosen(g.key).forEach(function (v) {
        var o = opts.filter(function (x) { return x.value === v; })[0];
        if (!o) return;
        chips += '<button type="button" class="results_chip text-size-caption-md" data-group="' + g.key + '" data-value="' + v + '" aria-label="Убрать фильтр: ' + o.label + '">' +
          o.label + '<span class="icon is-xs" style="--icon-url:url(\'/timetable-variants/icons/x.svg\')" aria-hidden="true"></span></button>';
      });
    });
    if (chips) chips += '<button type="button" class="results_chip is-reset text-size-caption-md" data-reset-all>Сбросить</button>';
    $('activeChips').innerHTML = chips;

    var n = activeCount();
    $('openFiltersText').textContent = n ? 'Фильтры (' + n + ')' : 'Фильтры';
    $('applyFilters').textContent = 'Показать ' + shownCount + ' ' + plural(shownCount, STREAMS);
  }

  function renderFree() {
    var show = !activeCount() && !state.query && data.events.length;
    if (!show) { $('freeBand').innerHTML = ''; return; }
    var rows = data.events.map(function (it) {
      return '<a class="free-band_item" href="' + T.esc(it.url) + '" target="_blank" rel="noopener">' +
        '<span class="text-size-caption-md text-weight-medium text-color-accent">' + T.dateLong(it.start) + ', ' + T.weekday(it.start) + (it.time ? ', ' + it.time.label : '') + '</span>' +
        '<span class="free-band_title text-size-caption-md text-color-heading">' + T.esc(it.title) + '</span>' +
      '</a>';
    }).join('');
    $('freeBand').innerHTML = '<section class="card free-band_component" aria-labelledby="freeTitle">' +
      '<h2 class="free-band_label text-size-caption-md text-weight-semibold text-color-heading" id="freeTitle">Бесплатно</h2>' +
      '<div class="free-band_list">' + rows + '</div></section>';
  }

  function section(title, inner, id) {
    return '<section class="timetable-list_group"' + (id ? ' id="' + id + '"' : '') + '>' +
      '<div class="month-panel_heading"><h2 class="heading-style-h3">' + title + '</h2></div>' +
      '<div class="card month-panel_component is-underlay">' + inner + '</div></section>';
  }

  function details(id, title, caption, rows) {
    return '<details class="card more-group_component timetable-list_group" id="' + id + '">' +
      '<summary class="more-group_summary"><span class="more-group_text">' +
        '<span class="text-size-paragraph-md text-weight-medium text-color-heading">' + title + '</span>' +
        '<span class="text-size-caption-md text-color-secondary">' + caption + '</span></span>' +
        '<span class="more-group_icon icon is-md" style="--icon-url:url(\'/timetable-variants/icons/chevron-down.svg\')" aria-hidden="true"></span>' +
      '</summary><div class="more-group_list">' + rows + '</div></details>';
  }

  function renderList() {
    var shown = pool().filter(function (it) { return passes(it, null); });
    var html = '';

    if (!shown.length) {
      html += '<div class="card timetable-empty_component timetable-list_group">' +
        '<h2 class="heading-style-h4">Под эти условия потоков нет</h2>' +
        '<p class="text-size-caption-md text-color-secondary">Уберите один из фильтров — числа в панели подскажут, сколько потоков вернётся.</p>' +
        '<button class="button is-sm is-secondary" type="button" data-reset-all>Сбросить все фильтры</button></div>';
    }

    var started = shown.filter(function (it) { return it.started; });
    var upcoming = shown.filter(function (it) { return !it.started && it.kind === 'course'; });
    var anytime = shown.filter(function (it) { return it.kind === 'anytime'; });

    html += T.lastCall(started);
    T.byMonth(upcoming).forEach(function (g) {
      var withYear = data.showYear && g.date.getFullYear() !== data.today.getFullYear();
      html += section(T.monthTitle(g.date, withYear), g.items.map(function (it) { return T.row(it); }).join(''), 'month-' + g.key);
    });
    if (anytime.length) html += section('Старт в любое время', anytime.map(function (it) { return T.row(it); }).join(''));

    // Лист ожидания — свёрнут в конце, фильтры его не касаются
    if (!activeCount()) {
      var wait = data.waitlist.filter(function (it) { return T.matches(it, state.query); });
      if (wait.length) html += '<section class="timetable-list_group" id="waitlist"><div class="timetable-list_heading"><h2 class="heading-style-h3">Лист ожидания</h2>' +
        '<p class="text-size-paragraph-sm text-color-secondary">Даты старта пока нет. Оставьте заявку — место можно забронировать.</p></div>' +
        '<div class="card month-panel_component is-underlay">' + wait.map(function (it) { return T.row(it); }).join('') + '</div></section>';
    }

    $('list').innerHTML = html;
    return shown.length;
  }

  function update() {
    renderFacets();
    var n = renderList();
    renderChips(n);
    renderFree();
  }

  /* ---------- ТЕЛЕФОН: панель поверх страницы ---------- */
  var lastFocus = null;
  function outside() { return [document.querySelector('.prototype-bar_component'), document.querySelector('.timetable-head_component'), document.querySelector('.results_component')]; }

  function openPanel() {
    lastFocus = document.activeElement;
    $('filters').classList.add('is-open');
    $('filters').setAttribute('role', 'dialog');
    $('filters').setAttribute('aria-modal', 'true');
    outside().forEach(function (el) { if (el) el.inert = true; });
    document.documentElement.style.overflow = 'hidden';
    $('closeFilters').focus();
  }
  function closePanel() {
    if (!$('filters').classList.contains('is-open')) return;
    $('filters').classList.remove('is-open');
    $('filters').removeAttribute('role');
    $('filters').removeAttribute('aria-modal');
    outside().forEach(function (el) { if (el) el.inert = false; });
    document.documentElement.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  /* ---------- СОБЫТИЯ ---------- */
  function toggle(group, value) {
    if (state.f[group][value]) delete state.f[group][value];
    else state.f[group][value] = true;
  }
  function resetAll() { GROUPS.forEach(function (g) { state.f[g.key] = {}; }); }

  $('facets').addEventListener('click', function (e) {
    var b = e.target.closest('[data-group]');
    if (b && !b.disabled) {
      var sel = '[data-group="' + b.dataset.group + '"][data-value="' + b.dataset.value + '"]';
      toggle(b.dataset.group, b.dataset.value);
      update();
      var again = $('facets').querySelector(sel);
      if (again) again.focus();
      return;
    }
    if (e.target.closest('[data-reset-all]')) { resetAll(); update(); }
  });

  document.querySelector('.results_component').addEventListener('click', function (e) {
    var chip = e.target.closest('.results_chip[data-group]');
    if (chip) { toggle(chip.dataset.group, chip.dataset.value); update(); return; }
    if (e.target.closest('[data-reset-all]')) { resetAll(); update(); return; }
  });

  $('openFilters').addEventListener('click', openPanel);
  $('closeFilters').addEventListener('click', closePanel);
  $('applyFilters').addEventListener('click', function () { closePanel(); $('list').scrollIntoView({ block: 'start' }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(); });
  window.matchMedia('(min-width: 64.0625rem)').addEventListener('change', function (m) { if (m.matches) closePanel(); });

  var timer;
  $('search').addEventListener('input', function (e) {
    clearTimeout(timer);
    timer = setTimeout(function () { state.query = e.target.value.trim(); if (data) update(); }, 120);
  });

  /* ---------- ЗАПУСК ---------- */
  $('list').innerHTML = '<div class="timetable-list_group">' + T.skeletonPanel(6) + '</div>';

  T.load().then(function (d) {
    data = d;
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
