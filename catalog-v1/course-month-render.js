/* КОПИЯ apps/tilda/course-month/src/course-month-render.js (баннер «Курсы месяца»).
   Править там, сюда копировать без изменений. */
/* Баннер скидок месяца («Курсы месяца» в CMS): одна функция рисует карточки и при сборке (снимок,
   вшитый в блок), и в браузере (из ответа API /api/public/catalog).
   В баннер попадают курсы каталога, у которых в CMS действует акция
   «Курс месяца», в порядке даты старта. Зависимостей нет. */
(function (global) {
  'use strict';
  var NBSP = ' ';
  var MINUS = '\u2212';
  var ARROW = '<svg viewBox="0 0 16 16" fill="none"><path d="M3 8h9.5M8.5 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ЗАГОЛОВОК БАННЕРА. Выбран Дарьей 31.10.2026 («Выгоднее в октябре»), править можно здесь.
  // Скидка действует с 1-го по последнее число месяца, поэтому дата одна на весь баннер.
  // Вместо меток подставляется дата окончания акции:
  //   {until} — «31 октября»   {month} — «октября» («до конца октября»)
  //   {inMonth} — «октябре» («в октябре»)
  var HEADING = 'Выгоднее в {inMonth}';
  var HEADING_NO_DATE = 'Курсы со скидкой'; // если в акции нет даты окончания

  var MONTHS_IN = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне',
    'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'];
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function rub(value) {
    return new Intl.NumberFormat('ru-RU').format(Number(value)).replace(/\s/g, NBSP) + NBSP + '₽';
  }

  function day(iso) {
    var p = String(iso || '').split('-');
    return p.length === 3 ? Number(p[2]) + NBSP + MONTHS[Number(p[1]) - 1] : null;
  }

  // Есть ли у курса отдельная цена при оплате сразу (тогда скидка только на неё).
  // Пока API не отдаёт признак, угадываем: платёж в месяц × 24 не равен цене со скидкой.
  function onePayment(p) {
    if (typeof p.onePayment === 'boolean') return p.onePayment;
    return !!p.monthly && Math.abs(p.monthly * 24 - p.discounted) > 24;
  }

  // В акции не курс целиком, а отдельные потоки (с 27.10.2026): дата и цена
  // баннера — от потока в акции (card.promo). Старый ответ API без них — от карточки.
  function promoPrice(c) {
    return c.promo && c.promo.price !== undefined ? c.promo.price : c.price;
  }
  function promoStart(c) {
    return c.promo && c.promo.startDate !== undefined ? c.promo.startDate : c.startDate;
  }

  // Курсы месяца из карточек каталога: открытый набор и цена со скидкой
  function select(cards) {
    return (cards || []).filter(function (c) {
      var p = promoPrice(c);
      return c.promo && c.mode === 'open' && p && p.discounted != null;
    }).sort(function (a, b) {
      return String(promoStart(a) || '9999').localeCompare(String(promoStart(b) || '9999'));
    });
  }

  // Процент скидки потока: из акции, а если API его не прислал, считаем по ценам
  function percent(card, p) {
    if (card.promo && card.promo.discountPercent) return card.promo.discountPercent;
    return p.full ? Math.round((1 - p.discounted / p.full) * 100) : null;
  }

  function cardHtml(card) {
    var p = promoPrice(card);
    var startDate = promoStart(card);
    var from = p.from ? 'от' + NBSP : '';
    var pct = percent(card, p);
    var start = startDate
      ? '<span class="course-month_start">Старт <time datetime="' + esc(startDate) + '">' + day(startDate) + '</time></span>'
      : '<span class="course-month_start"></span>';
    return '<li class="course-month_item">'
      + '<a class="course-month_card" href="' + esc(card.url || '#') + '">'
      + '<span class="course-month_top">' + start
      + (pct ? '<span class="course-month_percent">' + MINUS + pct + NBSP + '%</span>' : '') + '</span>'
      + '<h3 class="course-month_title">' + esc(card.title) + '</h3>'
      // Подпись про оплату стоит НАД ценой: так цена во всех карточках прижата к низу
      + (onePayment(p) ? '<span class="course-month_terms">при единовременной оплате</span>' : '')
      + '<span class="course-month_price">'
      + '<strong class="course-month_new-price">' + from + rub(p.discounted) + '</strong>'
      + '<s class="course-month_old-price">' + from + rub(p.full) + '</s>'
      + '<span class="course-month_arrow" aria-hidden="true">' + ARROW + '</span></span>'
      + '</a></li>';
  }

  // Заголовок с датой окончания. Если у акций разные даты, берём самую раннюю:
  // так обещание верно для каждого курса в баннере.
  function heading(cards) {
    var until = cards.map(function (c) { return c.promo && c.promo.until; })
      .filter(Boolean).sort()[0];
    if (!until || !day(until)) return HEADING_NO_DATE;
    var m = Number(until.split('-')[1]) - 1;
    return HEADING.replace('{until}', day(until))
      .replace('{month}', MONTHS[m]).replace('{inMonth}', MONTHS_IN[m]);
  }

  function render(cards) {
    return cards.map(cardHtml).join('');
  }

  // Подпись разметки: снимок и живые данные сравниваются по ней, а не по innerHTML
  function signature(html) {
    var h = 5381;
    for (var i = 0; i < html.length; i++) h = ((h * 33) ^ html.charCodeAt(i)) >>> 0;
    return h.toString(36) + '-' + html.length;
  }

  global.AspCourseMonth = { select: select, render: render, heading: heading, signature: signature };
})(typeof globalThis !== 'undefined' ? globalThis : window);
