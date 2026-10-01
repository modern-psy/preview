/* Промо-блок цены: одна функция строит разметку и при сборке (Node, запаска), и в браузере (из ответа Public API).
   Режим выбирается по данным курса, ничего не задаётся руками:
     • лист ожидания (нет открытых потоков, есть «Лист ожидания»): заголовок «Запишитесь в лист ожидания»,
       без дат и потоков, одна строка «Забронировать место» с ценой брони;
     • один поток без тарифов: одна цена на подсвеченном фоне;
     • два потока без тарифов: строки потоков без табов;
     • тарифы: строки тарифов, табы потоков при двух и более потоках; рекомендуемый тариф самый дорогой;
     • три и более потока без тарифов: табы и одна цена на поток.
   Цены по docs/tilda-pricing-block.md: крупно цена продажи, рассрочка строкой, зачёркнутая только при акции,
   повышение одной строкой «Цена с {дата} — {цена}». Нет зависимостей: чистые строки, Intl. */
(function (global) {
  'use strict';
  var OPEN = ['Идет набор', 'Последний шанс', 'Старт в любое время'];
  var WAITLIST = 'Лист ожидания';
  var MSK = 'Europe/Moscow';
  var CAPTION = 'body-text_component is-caption is-regular is-statement';

  function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function copy(value) {
    return escape(value)
      .replace(/(^|[^\p{L}\p{N}])(а|в|и|к|о|с|у|я|во|до|за|из|на|не|ни|но|об|от|по|со|без|для|над|под|при|про) /giu, '$1$2&nbsp;')
      .replace(/ (бы|же|ли)(?=[\s?.,!]|$)/giu, '&nbsp;$1')
      .replace(/ (—)/g, '&nbsp;$1')
      .replace(/(\d) (?=\d{3}(?:\D|$)|₽)/g, '$1&nbsp;');
  }
  function rub(v) {
    if (v == null || isNaN(Number(v))) return null;
    if (Number(v) === 0) return 'Бесплатно';
    return new Intl.NumberFormat('ru-RU').format(Number(v)).replace(/\s/g, '&nbsp;') + '&nbsp;₽';
  }
  function day(iso, shiftMs) {
    if (!iso) return null;
    var d = new Date(new Date(iso).getTime() + (shiftMs || 0));
    if (isNaN(d.getTime())) return null;
    var opts = { day: 'numeric', month: 'long', timeZone: MSK };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    return new Intl.DateTimeFormat('ru-RU', opts).format(d).replace(/\s/g, '&nbsp;');
  }
  function salePrice(o) {
    if (!o) return null;
    if (o.fullPaymentPrice != null) return o.fullPaymentPrice;
    if (o.currentPrice != null) return o.currentPrice;
    return o.price != null ? o.price : null;
  }
  function salePriceBefore(o) {
    if (!o) return null;
    if (o.fullPaymentPrice != null) return o.fullPaymentPriceBeforeDiscount != null ? o.fullPaymentPriceBeforeDiscount : null;
    return o.priceBeforeDiscount != null ? o.priceBeforeDiscount : null;
  }
  function nextChange(o) {
    var n = o && o.nextPriceChange;
    if (!n || !n.at) return null;
    return { at: n.at, price: n.fullPaymentPrice != null ? n.fullPaymentPrice : n.price };
  }
  function byStart(a, b) { return new Date(a.startDate || 0) - new Date(b.startDate || 0); }

  /* Ответ /api/public/course/:slug → конфиг блока. Открытые потоки отменяют лист ожидания. */
  function fromApi(course, options) {
    options = options || {};
    var all = course.streams || [];
    var open = all.filter(function (s) { return OPEN.indexOf(s.status) !== -1; }).sort(byStart);
    var waiting = all.filter(function (s) { return s.status === WAITLIST; });
    var streams = open;
    var waitlist = null;
    if (!open.length && waiting.length) waitlist = waiting[0];
    else if (!open.length && course.nearestStream) streams = [course.nearestStream];
    return {
      id: options.id || 'pricing',
      course: { name: course.title || '', description: course.description || '' },
      promo: course.promo || null,
      streams: streams.map(function (s, i) {
        return { id: 's' + (i + 1), label: s.label || day(s.startDate) || 'Поток', startDate: s.startDate || null, pricing: s.pricing || {} };
      }),
      waitlist: waitlist ? { bookingPrice: waitlist.pricing ? waitlist.pricing.bookingPrice : null } : null,
    };
  }

  /* Одна ячейка цены: цена продажи, зачёркнутая при акции, рассрочка, следующее повышение. */
  function cost(money, size) {
    var sale = salePrice(money), before = salePriceBefore(money), next = nextChange(money);
    var out = '<p class="pricing-promo_amount' + (size ? ' ' + size : '') + '">';
    if (sale == null) return out + '<span class="pricing-promo_unconfirmed">Стоимость уточняется</span></p>';
    if (before != null && before > sale) out += '<s class="pricing-promo_old">' + rub(before) + '</s>';
    out += '<span class="pricing-promo_number">' + rub(sale) + '</span></p>';
    if (money.installmentPerMonth != null) {
      out += '<p class="pricing-promo_terms ' + CAPTION + '">или ' + rub(money.installmentPerMonth) + '/мес в&nbsp;рассрочку' + (money.installmentMonths ? ' (' + money.installmentMonths + '&nbsp;мес.)' : '') + '</p>';
    }
    if (next && next.price != null) {
      out += '<p class="pricing-promo_increase-next ' + CAPTION + '">Цена с&nbsp;' + day(next.at) + '&nbsp;— ' + rub(next.price) + '</p>';
    }
    return out;
  }
  function promoLine(promo) {
    if (!promo || !promo.active) return '';
    var until = day(promo.until);
    return '<p class="pricing-promo_discount ' + CAPTION + '">' + copy(promo.label || 'Курс месяца') + '&nbsp;— скидка ' + escape(promo.discountPercent) + '%' + (until ? ' до&nbsp;' + until : '') + '</p>';
  }

  function render(config) {
    var id = config.id;
    var streams = config.streams || [];
    var waitlist = config.waitlist;
    var hasTariffs = streams.some(function (s) { return s.pricing && s.pricing.hasTariffs && (s.pricing.tariffs || []).length; });
    var tabbed = !waitlist && streams.length >= 2 && (hasTariffs || streams.length >= 3);
    var mode = waitlist ? 'waitlist' : hasTariffs ? 'plans' : streams.length >= 3 ? 'tabs-single' : streams.length === 2 ? 'streams' : 'single';
    var heading = mode === 'waitlist' ? 'Запишитесь в лист ожидания' : 'Стоимость обучения';

    var perStream = function (attr) { return tabbed ? ' data-pricing-stream="' + attr + '"' : ''; };
    var pill = function (s) {
      if (!s.startDate) return '';
      return '<span class="meta-pill_component is-responsive pricing-promo_start"' + perStream(s.id) + '><img class="meta-pill_icon" src="' + escape(config.clockIcon || render.clockIcon) + '" width="20" height="20" alt="" aria-hidden="true" draggable="false">Старт&nbsp;<time datetime="' + escape(s.startDate) + '">' + day(s.startDate) + '</time></span>';
    };
    var pills = mode === 'waitlist' || mode === 'streams' ? '' : streams.map(pill).join('');
    var intro = '<div class="pricing-promo_intro">' + (pills ? '<p class="pricing-promo_start-list">' + pills + '</p>' : '')
      + '<div class="pricing-promo_copy"><p class="pricing-promo_course content-heading_component is-profile">' + copy(config.course.name) + '</p>'
      + (config.course.description ? '<p class="pricing-promo_description body-text_component is-regular is-reading">' + copy(config.course.description) + '</p>' : '')
      + promoLine(config.promo) + '</div></div>';

    var tabs = tabbed ? '<div class="pricing-promo_tabs" role="tablist" aria-label="Поток обучения" data-pricing-tabs hidden>' + streams.map(function (s, i) {
      return '<button class="pricing-promo_tab" type="button" role="tab" id="' + id + '-tab-' + s.id + '" aria-controls="' + id + '-panel" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '" data-pricing-tab="' + s.id + '">' + copy(s.label) + '</button>';
    }).join('') + '</div>' : '';

    var offer;
    if (mode === 'waitlist') {
      var booking = waitlist.bookingPrice;
      offer = '<div class="pricing-promo_price"><ul class="pricing-promo_rows" role="list"><li class="pricing-promo_row is-featured"><div class="pricing-promo_row-copy"><h3 class="pricing-promo_row-name content-heading_component is-card">Забронировать место</h3><p class="pricing-promo_row-note ' + CAPTION + '">Место в&nbsp;ближайшем потоке за&nbsp;вами, о&nbsp;дате старта сообщим первыми</p></div><div class="pricing-promo_row-cost"><p class="pricing-promo_amount is-row"><span class="pricing-promo_number">' + (booking != null ? rub(booking) : 'Цена откроется позже') + '</span></p></div></li></ul></div>';
    } else if (mode === 'single' || mode === 'tabs-single') {
      offer = streams.map(function (s) {
        return '<div class="pricing-promo_price is-single"' + perStream(s.id) + '>' + cost(s.pricing) + '</div>';
      }).join('');
    } else if (mode === 'streams') {
      offer = '<div class="pricing-promo_price"><ul class="pricing-promo_rows" role="list">' + streams.map(function (s) {
        return '<li class="pricing-promo_row"><div class="pricing-promo_row-copy"><h3 class="pricing-promo_row-name content-heading_component is-card" id="' + id + '-' + s.id + '">' + copy(s.label) + '</h3>' + (s.startDate ? '<p class="pricing-promo_row-note ' + CAPTION + '">Старт&nbsp;<time datetime="' + escape(s.startDate) + '">' + day(s.startDate) + '</time></p>' : '') + '</div><div class="pricing-promo_row-cost">' + cost(s.pricing, 'is-row') + '</div></li>';
      }).join('') + '</ul></div>';
    } else {
      // Строки тарифов: порядок и состав из первого потока, в остальных потоках тариф ищется по названию.
      var first = streams[0].pricing.tariffs || [];
      var norm = function (v) { return String(v || '').trim().toLowerCase(); };
      var featured = first.reduce(function (best, t) { var p = salePrice(t); return p != null && (best == null || p > salePrice(best)) ? t : best; }, null);
      offer = '<div class="pricing-promo_price"><ul class="pricing-promo_rows" role="list">' + first.map(function (t, i) {
        var costs = streams.map(function (s) {
          var own = (s.pricing.tariffs || []).filter(function (x) { return norm(x.title) === norm(t.title); })[0];
          return '<div class="pricing-promo_row-cost"' + perStream(s.id) + '>' + (tabbed ? '<span class="pricing-promo_stream-label ' + CAPTION + '">' + copy(s.label) + '</span>' : '') + (own ? cost(own, 'is-row') : '<p class="pricing-promo_amount is-row"><span class="pricing-promo_unconfirmed">Стоимость уточняется</span></p>') + '</div>';
        }).join('');
        return '<li class="pricing-promo_row' + (t === featured ? ' is-featured' : '') + '"><div class="pricing-promo_row-copy"><h3 class="pricing-promo_row-name content-heading_component is-card" id="' + id + '-plan-' + (i + 1) + '">' + copy(t.title) + '</h3>' + (t.description ? '<p class="pricing-promo_row-note ' + CAPTION + '">' + copy(t.description) + '</p>' : '') + '</div>' + costs + '</li>';
      }).join('') + '</ul></div>';
    }

    var panel = '<div class="pricing-promo_panel"' + (tabbed ? ' id="' + id + '-panel" role="tabpanel" aria-labelledby="' + id + '-tab-' + streams[0].id + '" tabindex="0" data-pricing-panel' : '') + '>' + intro + offer + '</div>';
    var title = '<h2 class="pricing-promo_heading section-title_component is-responsive" id="' + id + '-heading">' + copy(heading) + '</h2>';
    return tabbed
      ? '<academy-pricing class="pricing-promo_component is-tabbed" data-mode="' + mode + '" selected-stream="' + streams[0].id + '">' + title + tabs + panel + '</academy-pricing>'
      : '<div class="pricing-promo_component" data-mode="' + mode + '">' + title + panel + '</div>';
  }
  render.clockIcon = 'https://static.tildacdn.com/tild3661-3930-4334-a631-643062633834/icon-clock-alert-bla.svg';

  global.PricingPromo = { fromApi: fromApi, render: render, OPEN: OPEN, WAITLIST: WAITLIST };
})(typeof globalThis !== 'undefined' ? globalThis : window);
