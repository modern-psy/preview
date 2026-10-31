/* Шапка сайта: одна и та же функция рисует курсы в мега-меню и при сборке
   (снимок, который вшивается в блок Тильды), и в браузере (из ответа API
   /api/public/catalog). Что писать о курсе, решает API; здесь только вид:
   группы по статусу потока, «20 октября», «146 000 ₽». Зависимостей нет. */
(function (global) {
  'use strict';
  var NBSP = ' ';
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // 146000 → «146 000 ₽»
  function rub(value) {
    return new Intl.NumberFormat('ru-RU').format(Number(value)).replace(/\s/g, NBSP) + NBSP + '₽';
  }

  // «2026-10-20» → «20 октября»; если год не текущий — «19 февраля 2027»
  function day(iso, now) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return null;
    var text = Number(p[2]) + NBSP + MONTHS[Number(p[1]) - 1];
    var year = (now || new Date()).getFullYear();
    if (Number(p[0]) !== year) text += NBSP + p[0];
    return text;
  }

  // 1 курс, 2 курса, 5 курсов
  function plural(n, forms) {
    n = Math.abs(n) % 100;
    var n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
  }

  // К ссылке на курс добавляем хвост для аналитики, если его там ещё нет
  function withUtm(url, utm) {
    if (!url || !utm || /[?&]utm_/.test(url)) return url || '#';
    return url + (url.indexOf('?') === -1 ? '?' : '&') + utm;
  }

  // Карточки одного раздела в том порядке, что прислал API
  function select(cards, section) {
    return (cards || []).filter(function (c) { return c.section === section; });
  }

  // Группы раздела: датированные старты → «старт в любое время» → лист ожидания.
  // Пустые группы не показываются; если группа одна, её заголовок не нужен.
  function group(cards) {
    var dated = [], anytime = [], waitlist = [];
    cards.forEach(function (c) {
      if (c.mode === 'waitlist') waitlist.push(c);
      else if (c.startDate) dated.push(c);
      else anytime.push(c);
    });
    return [
      { key: 'dated', title: 'Ближайшие старты', items: dated },
      { key: 'anytime', title: 'Старт в любое время', items: anytime },
      { key: 'waitlist', title: 'Лист ожидания', items: waitlist },
    ].filter(function (g) { return g.items.length; });
  }

  function courseHtml(card, utm, now) {
    var meta = '';
    if (card.mode !== 'waitlist' && card.startDate) {
      meta = day(card.startDate, now);
      if (card.status === 'Последний шанс') meta = 'последний шанс · ' + meta;
    }
    return '<li class="site-nav_course">'
      + '<a class="site-nav_course-link" href="' + esc(withUtm(card.url, utm)) + '">'
      + '<span class="site-nav_course-title">' + esc(card.title) + '</span>'
      + (meta ? '<span class="site-nav_course-meta">' + esc(meta) + '</span>' : '')
      + '</a></li>';
  }

  // Содержимое экрана раздела: заголовок со счётчиком, ссылка на страницу раздела, группы курсов.
  // cfg.section — раздел как в CMS, cfg.label — как он подписан в шапке (если отличается)
  function panelHtml(cfg, cards, utm, now) {
    var noun = cfg.noun && cfg.noun.length >= 3 ? cfg.noun : ['курс', 'курса', 'курсов', 'курсы'];
    var out = '<div class="site-nav_panel-head">'
      + '<p class="site-nav_panel-title">' + esc(cfg.label || cfg.section)
      + ' <span class="site-nav_panel-count">' + cards.length + NBSP + plural(cards.length, noun) + '</span></p>'
      + '<a class="site-nav_more" href="' + esc(cfg.url) + '">Перейти в' + NBSP + 'раздел</a>'
      + '</div>';
    if (!cards.length) {
      return out + '<p class="site-nav_empty">В' + NBSP + 'этом разделе пока нет ' + esc(noun[2]) + '. Посмотрите <a class="site-nav_more" href="' + esc(cfg.url) + '">страницу раздела</a>.</p>';
    }
    var groups = group(cards);
    groups.forEach(function (g) {
      out += '<section class="site-nav_group">'
        + (groups.length > 1 ? '<h3 class="site-nav_group-title">' + g.title + '</h3>' : '')
        + '<ul class="site-nav_courses" role="list">'
        + g.items.map(function (c) { return courseHtml(c, utm, now); }).join('')
        + '</ul></section>';
    });
    return out;
  }

  // Строка под названием в карточке правой колонки: «20 октября · 146 000 ₽»
  function soonMeta(card, now) {
    var parts = [];
    if (card.mode === 'waitlist') return 'лист ожидания';
    if (card.startDate) parts.push(day(card.startDate, now));
    var p = card.price;
    if (p) {
      if (p.free) parts.push('бесплатно');
      else {
        var sum = p.discounted != null ? p.discounted : p.full;
        if (sum) parts.push((p.from ? 'от' + NBSP : '') + rub(sum));
      }
    }
    return parts.join(' · ');
  }

  function soonCardHtml(card, utm, now) {
    var cover = card.cover && card.cover.url
      ? '<img class="site-nav_soon-image" src="' + esc(card.cover.url) + '" alt="" width="640" height="400" loading="lazy" decoding="async">'
      : '<span class="site-nav_soon-image"></span>';
    var meta = soonMeta(card, now);
    return '<a class="site-nav_soon-card" href="' + esc(withUtm(card.url, utm)) + '">'
      + cover
      + '<span class="site-nav_soon-name">' + esc(card.title) + '</span>'
      + (meta ? '<span class="site-nav_soon-meta">' + esc(meta) + '</span>' : '')
      + '</a>';
  }

  // Какие курсы показать в правой колонке: slots — список слагов (пустая строка =
  // «подставь сам»). Пропавший или пустой слаг заменяется ближайшим по дате
  // стартом, который ещё не показан. Возвращает карточки в порядке слотов
  // (null, если подставить нечего).
  function pickSoon(cards, slots) {
    var used = {};
    var picked = slots.map(function (slug) {
      if (!slug) return null;
      var card = (cards || []).filter(function (c) { return c.slug === slug; })[0] || null;
      if (card) used[card.slug] = true;
      return card;
    });
    var queue = (cards || []).filter(function (c) {
      return c.mode !== 'waitlist' && c.startDate && !used[c.slug];
    }).sort(function (a, b) { return String(a.startDate).localeCompare(String(b.startDate)); });
    return picked.map(function (card) {
      if (card) return card;
      var next = queue.shift() || null;
      if (next) used[next.slug] = true;
      return next;
    });
  }

  // Короткая подпись разметки: снимок и живые данные сравниваются по ней,
  // чтобы меню не перерисовывалось (и не мигало), когда ничего не изменилось.
  function signature(html) {
    var h = 5381;
    for (var i = 0; i < html.length; i++) h = ((h * 33) ^ html.charCodeAt(i)) >>> 0;
    return h.toString(36) + '-' + html.length;
  }

  global.AspHeader = {
    select: select, group: group, panelHtml: panelHtml, soonCardHtml: soonCardHtml,
    pickSoon: pickSoon, signature: signature, plural: plural, day: day, rub: rub, withUtm: withUtm, esc: esc,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
