/*
  ============================================================================
  ОБЩИЙ СЛОЙ ДАННЫХ ДЛЯ ТРЁХ ВАРИАНТОВ РАСПИСАНИЯ

  Забирает два ответа из Public API и сводит их по слагу курса:
    /api/public/timetable — потоки, даты, дни занятий, цены по потокам;
    /api/public/catalog   — раздел, рассрочка, тарифы «от», бронь листа ожидания.

  Если API недоступен, берёт снимок из папки data/ — прототип не пустеет.
  Править здесь нужно только адрес API. Разметку рисуют файлы вариантов.
  ============================================================================
*/
(function () {
  'use strict';

  // 🔴 Адрес API. На сайте шлюз отдаёт те же ответы со своего домена.
  var API = 'https://modern-psy-asp-prod-8ceb.twc1.net';

  var MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  var MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

  // Порядок дней в неделе: с понедельника. Индексы — как у Date.getDay().
  var WEEK = [1, 2, 3, 4, 5, 6, 0];

  // Корни названий дней в строке «По вторникам и пятницам»
  var DAY_STEMS = [['понедельник', 1], ['вторник', 2], ['сред', 3], ['четверг', 4], ['пятниц', 5], ['суббот', 6], ['воскресень', 0]];

  // 🟢 Бронь места в листе ожидания. Одна для всех курсов (слова Дарьи, 12.10.2026).
  // Берётся из каталога; если курса в каталоге нет (как MBT-I) — это значение.
  var WAITLIST_BOOKING = 5000;

  // Граница «днём / вечером». Утренних занятий в расписании нет,
  // поэтому делим сутки на две части, а не на три.
  var EVENING_FROM = 17;

  // --- Помощники набора ---
  var NBSP = ' ';
  var THIN = ' ';

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Название курса: дефис перед цифрой неразрывный, чтобы «GLP-1»
  // не разваливалось на «GLP-» и «1» по разным строкам
  function title(s) { return esc(s).replace(/-(?=\d)/g, '\u2011'); }

  // 45 000 ₽: разряды узким неразрывным, рубль неразрывным
  function money(n) {
    if (n == null) return '';
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, THIN) + NBSP + '₽';
  }

  function ymd(d) { return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }

  function parseDate(iso) {
    if (!iso) return null;
    var p = iso.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function dateLong(d) { return d.getDate() + NBSP + MONTHS_GEN[d.getMonth()]; }
  function monthTitle(d, withYear) {
    var m = MONTHS[d.getMonth()];
    m = m.charAt(0).toUpperCase() + m.slice(1);
    return withYear ? m + ' ' + d.getFullYear() : m;
  }

  // «пн», «вт и пт», «пн, ср и пт»
  function daysLabel(days) {
    var names = days.map(function (d) { return WEEKDAYS[d]; });
    if (names.length < 2) return names.join('');
    return names.slice(0, -1).join(', ') + ' и ' + names[names.length - 1];
  }

  // Для поиска: регистр, «ё» и одинаковые на вид буквы кириллицы и латиницы
  // не различаются — «АСТ» кириллицей находит «ACT» латиницей и наоборот.
  var LOOKALIKE = { 'а': 'a', 'в': 'b', 'е': 'e', 'к': 'k', 'м': 'm', 'н': 'h', 'о': 'o', 'р': 'p', 'с': 'c', 'т': 't', 'у': 'y', 'х': 'x' };
  function norm(s) {
    return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[авекмнорстух]/g, function (ch) { return LOOKALIKE[ch]; });
  }

  // --- Разбор расписания из CMS ---
  // В поле schedule бывают служебные пометки менеджера, поэтому строку
  // целиком не показываем: достаём из неё только дни и время.
  function parseDays(tag) {
    // Здесь только нижний регистр: корни дней недели — кириллица,
    // замена похожих букв из поиска их бы сломала
    var s = String(tag || '').toLowerCase(), out = [];
    DAY_STEMS.forEach(function (p) { if (s.indexOf(p[0]) >= 0) out.push(p[1]); });
    return out.sort(function (a, b) { return WEEK.indexOf(a) - WEEK.indexOf(b); });
  }

  function parseTime(schedule) {
    var s = String(schedule || '');
    var m = s.match(/(\d{1,2})[:.](\d{2})\s*(?:–|—|-|до)\s*(\d{1,2})[:.](\d{2})/);
    if (m) return { from: +m[1], label: m[1] + ':' + m[2] + '–' + m[3] + ':' + m[4] };
    m = s.match(/(\d{1,2}):(\d{2})/);
    if (m) return { from: +m[1], label: m[1] + ':' + m[2] };
    return null;
  }

  // --- Загрузка ---
  // Если API молчит дольше 6 секунд, не ждём его, а берём снимок:
  // иначе заглушки висели бы на экране бесконечно.
  var TIMEOUT = 6000;

  function getJSON(path, fallback) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT) : null;
    return fetch(API + path, { headers: { Accept: 'application/json' }, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) { return { data: data, live: true }; })
      .catch(function () {
        return fetch(fallback).then(function (r) { return r.json(); })
          .then(function (data) { return { data: data, live: false }; });
      });
  }

  function load() {
    return Promise.all([
      getJSON('/api/public/timetable', '/timetable-variants/data/timetable.json'),
      getJSON('/api/public/catalog', '/timetable-variants/data/catalog.json')
    ]).then(function (res) {
      return build(res[0].data, res[1].data, res[0].live && res[1].live);
    });
  }

  // --- Сборка единой модели ---
  function build(tt, cat, live) {
    var today = new Date();
    var todayKey = ymd(today);

    var bySlug = {};
    (cat.cards || []).forEach(function (c) { bySlug[c.slug] = c; });

    function item(raw, source) {
      var c = bySlug[raw.slug] || null;
      var start = parseDate(raw.startDate);
      var days = parseDays(raw.daysTag);
      var time = parseTime(raw.schedule);
      var sameStream = c && c.startDate && c.startDate === raw.startDate;
      var section = c ? c.section : null;

      // Что это: поток курса, бесплатный эфир, мини-курс, старт в любое время, лист ожидания
      var kind;
      if (source === 'month') {
        kind = (raw.price === 0 || section === 'Вебинары') ? 'event' : 'course';
      } else if (raw.status === 'Лист ожидания') {
        kind = 'waitlist';
      } else if (raw.price === 0 || section === 'Бесплатные мини-курсы') {
        kind = 'mini';
      } else {
        kind = 'anytime';
      }

      // Цена потока. Если у курса несколько тарифов, в расписание приходит
      // старший; тариф «от» знает только каталог и только для ближайшего потока.
      var price = {
        value: raw.price,
        before: null,
        promo: null,
        from: false,
        tariffs: !!raw.hasTariffs,
        monthly: null,
        booking: c && c.booking ? c.booking : (raw.status === 'Лист ожидания' ? WAITLIST_BOOKING : null)
      };
      if (raw.promo && raw.promo.active && raw.priceBeforeDiscount > raw.price) {
        price.before = raw.priceBeforeDiscount;
        var until = parseDate(raw.promo.until);
        price.promo = { percent: raw.promo.discountPercent, until: until, label: raw.promo.label || 'Курс месяца' };
      }
      if (raw.hasTariffs && sameStream && c.price && c.price.from) {
        price.value = c.price.full;
        price.from = true;
      }
      if (sameStream && c.price && c.price.monthly) price.monthly = c.price.monthly;
      else if (raw.installmentPerMonth) price.monthly = raw.installmentPerMonth;

      var intensive = !days.length && (!!time || /подряд|модул/i.test(raw.schedule || ''));

      return {
        id: raw.slug + '@' + (raw.startDate || source),
        slug: raw.slug,
        title: raw.title,
        url: raw.url || '#',
        kind: kind,
        start: start,
        started: !!start && ymd(start) < todayKey,
        monthKey: start ? start.getFullYear() + '-' + (start.getMonth() + 1) : null,
        section: section,
        doc: raw.docShort || null,
        level: raw.educationLevel || null,
        hours: raw.hours || null,
        days: days,
        time: time,
        band: time ? (time.from >= EVENING_FROM ? 'evening' : 'day') : null,
        intensive: intensive,
        msk: /мск/i.test(raw.schedule || ''),
        description: c && c.description ? c.description.trim() : null,
        cover: c && c.cover && c.cover.url ? c.cover.url : null,
        price: price,
        streams: []
      };
    }

    var all = [];
    (tt.months || []).forEach(function (m) {
      (m.items || []).forEach(function (raw) { all.push(item(raw, 'month')); });
    });
    (tt.anytime || []).forEach(function (raw) { all.push(item(raw, 'anytime')); });
    (tt.waitlist || []).forEach(function (raw) { all.push(item(raw, 'waitlist')); });

    // Прошедшие эфиры больше не показываем
    all = all.filter(function (it) { return !(it.kind === 'event' && it.started); });

    var courses = all.filter(function (it) { return it.kind === 'course'; })
      .sort(function (a, b) { return a.start - b.start; });

    // Потоки одного курса знают друг о друге: «ещё поток 15 января»
    var bySlugStreams = {};
    courses.forEach(function (it) { (bySlugStreams[it.slug] = bySlugStreams[it.slug] || []).push(it); });
    courses.forEach(function (it) { it.streams = bySlugStreams[it.slug]; });

    var years = {};
    courses.forEach(function (it) { years[it.start.getFullYear()] = true; });

    return {
      live: live,
      today: today,
      generatedAt: tt.generatedAt ? new Date(tt.generatedAt) : null,
      courses: courses,
      started: courses.filter(function (it) { return it.started; }),
      upcoming: courses.filter(function (it) { return !it.started; }),
      events: all.filter(function (it) { return it.kind === 'event'; }).sort(function (a, b) { return a.start - b.start; }),
      minis: all.filter(function (it) { return it.kind === 'mini'; }),
      anytime: all.filter(function (it) { return it.kind === 'anytime'; }),
      waitlist: all.filter(function (it) { return it.kind === 'waitlist'; }),
      showYear: Object.keys(years).length > 1
    };
  }

  // --- Группировка по месяцам ---
  function byMonth(list) {
    var groups = [], map = {};
    list.forEach(function (it) {
      var g = map[it.monthKey];
      if (!g) { g = map[it.monthKey] = { key: it.monthKey, date: it.start, items: [] }; groups.push(g); }
      g.items.push(it);
    });
    return groups;
  }

  // --- Поиск: название, раздел, документ; «е» и «ё» не различаются ---
  function matches(it, query) {
    if (!query) return true;
    var hay = norm([it.title, it.section, it.doc, it.level].join(' '));
    return norm(query).split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
  }

  // --- Общие кусочки разметки ---

  // «Диплом, 750 академ. ч.»
  function metaLine(it) {
    var parts = [];
    if (it.doc) parts.push(it.doc);
    if (it.hours) parts.push(it.hours + NBSP + 'академ.' + NBSP + 'ч.');
    return parts.join(', ');
  }

  // «вт и пт, 18:00–20:00», «интенсив, 9:30–18:30»
  function whenLine(it) {
    if (it.days.length) return daysLabel(it.days) + (it.time ? ', ' + it.time.label : ', время уточняется');
    if (it.intensive) return 'интенсив' + (it.time ? ', ' + it.time.label : '');
    return 'расписание уточняется';
  }

  // Семь точек «пн…вс»: закрашены дни занятий
  function weekDots(it) {
    if (!it.days.length) return '';
    var html = WEEK.map(function (d) {
      return '<span class="week-dots_dot' + (it.days.indexOf(d) >= 0 ? ' is-on' : '') + '"></span>';
    }).join('');
    return '<span class="week-dots_component" aria-hidden="true">' + html + '</span>';
  }

  // Цена столбиком: зачёркнутая, итоговая, рассрочка или подпись
  function priceHtml(it) {
    var p = it.price;
    if (it.kind === 'waitlist') {
      return p.booking
        ? '<span class="timetable-row_amount text-size-paragraph-md text-weight-semibold text-color-heading">' + money(p.booking) + '</span>' +
          '<span class="text-size-caption-sm text-color-secondary">бронь места</span>'
        : '<span class="text-size-caption-md text-color-secondary">дата появится позже</span>';
    }
    if (p.value === 0) return '<span class="timetable-row_amount text-size-paragraph-md text-weight-semibold text-color-heading">Бесплатно</span>';
    if (p.value == null) return '';
    var html = '<span class="timetable-row_amount text-size-paragraph-xl text-weight-semibold text-color-heading">' + (p.from ? 'от' + NBSP : '') + money(p.value) + '</span>';
    // Скидка относится к цене: старая цена и плашка-ценник стоят под суммой
    if (p.before) {
      html += '<span class="timetable-row_discount">' +
        '<span class="text-size-caption-md text-style-strikethrough text-color-secondary">' + money(p.before) + '</span>' +
        promoChip(it) +
      '</span>';
    }
    if (p.monthly) html += '<span class="text-size-caption-sm text-color-secondary">или ' + money(p.monthly) + '/мес</span>';
    else if (p.tariffs && !p.from) html += '<span class="text-size-caption-sm text-color-secondary">есть тарифы</span>';
    return html;
  }

  // Жёлтая плашка «−10 % до 31 октября». Вариант B показывает её в билетике,
  // строки расписания — рядом с названием курса.
  function promoChip(it) {
    var pr = it.price.promo;
    if (!pr) return '';
    var until = pr.until ? ' до ' + dateLong(pr.until) : '';
    return '<span class="promo-badge_component text-size-caption-md">' +
      '<span class="promo-badge_value text-weight-semibold">−' + pr.percent + NBSP + '%</span>' +
      (until ? '<span class="promo-badge_until">' + until.trim() + '</span>' : '') +
    '</span>';
  }

  // Другие потоки того же курса
  function otherStreams(it) {
    var other = it.streams.filter(function (s) { return s !== it && !s.started; });
    if (!other.length) return '';
    return (other.length > 1 ? 'Следующие потоки ' : 'Следующий поток ') + other.map(function (s) { return dateLong(s.start); }).join(', ');
  }

  // --- Дни занятий: «пн вт ср чт пт сб вс», дни занятий — фиолетовым ---
  // Время занятий в строке не пишем: оно есть не у всех курсов и может меняться.
  function weekDays(it) {
    // У листа ожидания нет даты — «дни уточняются» там ничего не добавляет
    if (!it.days.length && it.kind === 'waitlist') return '';
    if (!it.days.length) {
      var text = it.intensive ? 'интенсив' : 'дни уточняются';
      return '<span class="week-days_note text-size-caption-md text-color-secondary">' + text + '</span>';
    }
    var html = WEEK.map(function (d) {
      return '<span class="week-days_day' + (it.days.indexOf(d) >= 0 ? ' is-on' : '') + '">' + WEEKDAYS[d] + '</span>';
    }).join('');
    // Для глаза — семь сокращений, экранный диктор читает одну фразу
    return '<span class="week-days_component text-size-caption-md" role="img" aria-label="Занятия: ' + daysLabel(it.days) + '">' + html + '</span>';
  }

  // --- Строка потока: вся строка — ссылка на страницу курса ---
  // opts.started — курс уже идёт (блок «Последний шанс»): вместо колонки
  //                с датой фраза «Идёт с 18 сентября» под названием.
  // В обычной строке месяц не пишем: он уже стоит в заголовке панели.
  // Следующие потоки того же курса не упоминаем: собираем на ближайший.
  function row(it, opts) {
    opts = opts || {};
    var d = opts.started ? null : it.start;
    var date = '';
    if (d) {
      // Число крупно, день недели под ним — как листок календаря
      date = '<span class="timetable-row_date">' +
        '<span class="timetable-row_day text-size-display-sm text-weight-medium text-color-heading">' + d.getDate() + '</span>' +
        // пробел нужен, чтобы дата читалась вслух «19 пн»
        ' <span class="timetable-row_weekday text-size-caption-sm text-color-secondary">' + WEEKDAYS[d.getDay()] + '</span>' +
      '</span>';
    }
    var meta = metaLine(it);

    return '<a class="timetable-row_component' + (d ? '' : ' is-nodate') + '" href="' + esc(it.url) + '" target="_blank" rel="noopener">' +
      date +
      '<span class="timetable-row_main">' +
        '<h3 class="timetable-row_title text-size-paragraph-md text-weight-medium text-color-heading text-style-break">' + title(it.title) + '</h3>' +
        (opts.started ? '<span class="text-size-caption-md text-weight-semibold text-color-primary">Идёт с ' + dateLong(it.start) + '</span>' : '') +
        (meta ? '<span class="text-size-caption-md text-color-secondary">' + esc(meta) + '</span>' : '') +
        weekDays(it) +
      '</span>' +
      '<span class="timetable-row_price">' + priceHtml(it) + '</span>' +
      // Стрелка вместо кнопки «Записаться»: нажимается вся строка, а стрелка
      // показывает, куда. Внутри ссылки — span, ссылку в ссылку класть нельзя.
      '<span class="timetable-row_arrow" aria-hidden="true">' +
        '<span class="icon is-sm" style="--icon-url:url(\'/timetable-variants/icons/arrow-right.svg\')"></span>' +
      '</span>' +
    '</a>';
  }

  // Подпись, если показан сохранённый снимок, а не свежие данные
  function snapshotNote(d) {
    return 'Расписание показано на ' + (d.generatedAt ? dateLong(d.generatedAt) : 'последнюю сохранённую дату') +
      '. Точные даты и цены — на странице курса.';
  }

  // Карточка, если не загрузилось вообще ничего — ни API, ни снимок
  function failCard() {
    return '<div class="card timetable-empty_component timetable-list_group">' +
      '<h2 class="heading-style-h4">Расписание не загрузилось</h2>' +
      '<p class="text-size-caption-md text-color-secondary">Обновите страницу через минуту. Все курсы с датами есть в каталоге.</p>' +
      '<a class="button is-sm is-secondary" href="https://modern-psy.ru/courses" target="_blank" rel="noopener">Открыть каталог</a>' +
    '</div>';
  }

  // «Последний шанс»: курсы уже начались, идёт донабор. Приоритетный блок,
  // всегда перед месяцами и всегда раскрыт. Тёмно-фиолетовая подложка
  // (тёмные блоки на сайте — фиолетовые), курсы на ней — белые плашки.
  function lastCall(list) {
    if (!list.length) return '';
    return '<section class="timetable-list_group last-call_component" aria-labelledby="lastCallTitle">' +
      '<div class="last-call_head">' +
        '<h2 class="heading-style-h3 text-color-inverse" id="lastCallTitle">Последний шанс</h2>' +
        '<p class="text-size-paragraph-sm text-color-on-inverse">Курсы уже начались, идёт донабор. Ещё можно присоединиться.</p>' +
      '</div>' +
      '<div class="last-call_list">' + list.map(function (it) { return row(it, { started: true }); }).join('') + '</div>' +
    '</section>';
  }

  // Заготовки строк на время загрузки — той же высоты, что настоящие
  function skeletonPanel(n) {
    var widths = ['72%', '58%', '80%', '64%', '50%', '70%'];
    var rows = '';
    for (var i = 0; i < n; i++) {
      rows += '<div class="timetable-skeleton_row">' +
        '<span class="skeleton text-size-paragraph-md" style="width:' + widths[i % widths.length] + '">&nbsp;</span>' +
        '<span class="skeleton text-size-caption-md" style="width:12rem">&nbsp;</span>' +
      '</div>';
    }
    return '<div class="card month-panel_component" aria-hidden="true">' + rows + '</div>';
  }

  window.TT = {
    load: load,
    row: row,
    skeletonPanel: skeletonPanel,
    snapshotNote: snapshotNote,
    failCard: failCard,
    lastCall: lastCall,
    byMonth: byMonth,
    matches: matches,
    esc: esc,
    title: title,
    money: money,
    dateLong: dateLong,
    monthTitle: monthTitle,
    weekday: function (d) { return WEEKDAYS[d.getDay()]; },
    monthShort: function (d) { return MONTHS_GEN[d.getMonth()]; },
    daysLabel: daysLabel,
    metaLine: metaLine,
    whenLine: whenLine,
    weekDots: weekDots,
    weekDays: weekDays,
    parseDate: parseDate,
    priceHtml: priceHtml,
    promoChip: promoChip,
    otherStreams: otherStreams,
    WEEK: WEEK,
    WEEKDAYS: WEEKDAYS,
    NBSP: NBSP
  };
})();
