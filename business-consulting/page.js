/* Блок «Стоимость обучения» лендинга «Корпоративное консультирование для психологов» и данные потока из CMS
   (дата старта и расписание занятий в первом экране, программе и форме).
   Подача «Одна цифра» из витрины /pricing-scenarios (утверждена 12.10.2026): одна горизонтальная карточка,
   слева курс и цена, справа «Что входит». Цена, зачёркнутая цена, жёлтый купон курса месяца, платёж в месяц
   и дата старта приходят из CMS через Public API.

   Одна функция рисует карточку и при сборке (build.mjs берёт отсюда BusinessConsultingPrice и вшивает
   снимок цены в страницу), и в браузере: после загрузки страница один раз спрашивает API и, если цена
   изменилась, перерисовывает карточку, дату старта и цену в микроразметке. API не ответил — остаётся снимок.
   Править здесь можно тексты подписей; правила цен — из docs/tilda-pricing-block.md и правил продаж Дарьи:
   крупно цена продажи, зачёркнутая только при акции, купон «−10 % до 31 октября» без слов «Курс месяца»,
   рассрочка тихой строкой, повышение отдельной серой плашкой, кнопок в блоке нет. */
(function () {
  var NBSP = ' ';
  var MINUS = '−';
  var OPEN = ['Идет набор', 'Идёт набор', 'Последний шанс', 'Старт в любое время'];
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  // Часы из каталога CMS с правильным окончанием: 81 академический час, 72 академических часа, 58 академических часов.
  function hoursPhrase(n) {
    var m10 = n % 10, m100 = n % 100;
    var word = m10 === 1 && m100 !== 11 ? 'академический час' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'академических часа' : 'академических часов';
    return n + NBSP + word;
  }
  // Строка с {hours} (например, «{hours} живых занятий») — в span с шаблоном, чтобы её можно было обновить из CMS.
  function withHours(item, hours) {
    if (item.indexOf('{hours}') === -1) return esc(item);
    return '<span data-cms-hours="' + esc(item) + '">' + esc(item.replace('{hours}', hours ? hoursPhrase(hours) : '')) + '</span>';
  }

  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  var digits = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP); };
  var rub = function (n) { return digits(n) + NBSP + '₽'; };
  // Дата из CMS («2026-11-18» или ISO-время) → «18 ноября» по московскому времени.
  function dayMonth(value) {
    if (!value) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    var d = m ? {day: Number(m[3]), month: Number(m[2]) - 1} : null;
    if (!d) {
      var t = new Date(new Date(value).getTime() + 3 * 3600 * 1000);
      if (isNaN(t)) return '';
      d = {day: t.getUTCDate(), month: t.getUTCMonth()};
    }
    return d.day + NBSP + MONTHS[d.month];
  }

  /* Расписание потока из CMS: «По средам 18:00–21:00» и дни занятий ["Среда"] →
     {days: «По средам», time: «18:00–21:00», short: «Ср, 18:00–21:00»}. Время не рвётся на тире. */
  var SHORT_DAYS = {'Понедельник': 'Пн', 'Вторник': 'Вт', 'Среда': 'Ср', 'Четверг': 'Чт', 'Пятница': 'Пт', 'Суббота': 'Сб', 'Воскресенье': 'Вс'};
  function splitSchedule(schedule, lessonDays) {
    var m = /^(.*?)[,\s]*(\d{1,2}:\d{2}\s*[–—-]\s*\d{1,2}:\d{2})\s*$/.exec(schedule || '');
    if (!m) return null;
    var time = m[2].replace(/\s*[–—-]\s*/, '\u2060–\u2060');
    var days = m[1].trim();
    var short = (lessonDays || []).map(function (d) { return SHORT_DAYS[d] || d; }).join(', ');
    return {days: days, time: time, short: short ? short + ', ' + time : days + ' ' + time};
  }

  /* Ответ /api/public/course/:slug → то, что нужно карточке. Берётся ближайший открытый поток. */
  function fromApi(course) {
    if (!course) return null;
    var open = (course.streams || []).filter(function (s) { return OPEN.indexOf(s.status) !== -1; })
      .sort(function (a, b) { return new Date(a.startDate || 0) - new Date(b.startDate || 0); });
    var stream = open[0] || course.nearestStream;
    var p = stream && stream.pricing;
    if (!p || p.hasTariffs) return null;
    var sale = p.fullPaymentPrice != null ? p.fullPaymentPrice : p.currentPrice;
    if (sale == null) return null;
    var before = p.fullPaymentPrice != null ? p.fullPaymentPriceBeforeDiscount : p.priceBeforeDiscount;
    var promo = course.promo && course.promo.active ? course.promo : null;
    var next = p.nextPriceChange && p.nextPriceChange.at ? p.nextPriceChange : null;
    return {
      sale: sale,
      // Зачёркнутая цена — только при акции.
      was: promo && before != null && before > sale ? before : null,
      promo: promo ? {percent: promo.discountPercent, until: dayMonth(promo.until), label: promo.label || 'Курс месяца'} : null,
      // Платёж в месяц: из CMS, иначе по правилу каталога — цена ÷ 24.
      perMonth: p.installmentPerMonth || (sale > 0 ? Math.round(sale / 24) : null),
      months: p.installmentPerMonth ? p.installmentMonths : 24,
      start: dayMonth(stream.startDate),
      startDate: stream.startDate || null,
      schedule: splitSchedule(stream.schedule, stream.lessonDays),
      next: next ? {label: dayMonth(next.at), price: next.fullPaymentPrice != null ? next.fullPaymentPrice : next.price} : null,
    };
  }

  var ICON_CHECK = '<svg class="price-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_RISE = '<svg class="price-rise_icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M3 17l6-6 4 4 8-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 7h6v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // Подпись снимка: если в API те же цифры, карточку не перерисовываем.
  function signature(m) {
    return [m.sale, m.was, m.perMonth, m.months, m.start, m.promo ? m.promo.percent + '/' + m.promo.until : '', m.next ? m.next.label + '/' + m.next.price : ''].join('|');
  }

  /* Карточка цены. text — тексты из data/pricing.json (уже с неразрывными пробелами), model — fromApi. */
  function render(model, text) {
    var sticker = model.promo
      ? '<span class="price-sticker_component"><span class="price-sticker_coupon"><span class="screen-reader-text">' + esc(model.promo.label) + ': </span><span class="price-sticker_value">' + MINUS + model.promo.percent + NBSP + '%</span><span class="price-sticker_until">до ' + esc(model.promo.until) + '</span></span></span>'
      : '';
    var was = model.was != null
      ? '<span class="price-tag_was"><s class="price-old"><span class="screen-reader-text">вместо </span>' + rub(model.was) + '</s></span>'
      : '';
    var price = model.sale === 0
      ? '<p class="price-tag"><span class="price-tag_number">Бесплатно</span></p>'
      : '<p class="price-tag"><span class="price-tag_number">' + digits(model.sale) + '</span><span class="price-tag_unit">₽</span>' + was + '</p>';
    var lines = [];
    if (model.was != null) lines.push('<b class="price-caption_benefit">выгода ' + rub(model.was - model.sale) + '</b> по акции');
    if (model.perMonth) lines.push('или ' + rub(model.perMonth) + '/мес в рассрочку на ' + model.months + NBSP + 'мес');
    var caption = lines.length ? '<p class="price-caption">' + lines.map(function (l) { return '<span class="price-caption_line">' + l + '</span>'; }).join('') + '</p>' : '';
    var rise = '';
    if (model.next && model.next.price > model.sale) {
      rise = '<div class="price-wide_foot"><p class="price-rise">' + ICON_RISE + '<span class="price-rise_text"><span class="price-rise_title">С ' + esc(model.next.label) + ': ' + rub(model.next.price) + '</span><span class="price-rise_note">подорожает на ' + rub(model.next.price - model.sale) + '</span></span></p></div>';
    }
    var includes = '<ul class="price-check" role="list">' + text.includes.map(function (item) { return '<li class="price-check_item">' + ICON_CHECK + '<span>' + withHours(item, text.hours) + '</span></li>'; }).join('') + '</ul>';
    return '<div class="price-wide_component" data-price-card="' + esc(signature(model)) + '">' + sticker
      + '<div class="price-wide_main"><span class="price-wide_chip">' + esc(text.chip) + '</span>'
      + '<div class="price-wide_title"><p class="price-wide_name">' + esc(text.title) + '</p>' + (model.start ? '<p class="price-wide_sub">старт ' + esc(model.start) + '</p>' : '') + '</div>'
      + '<div class="price-wide_money">' + price + caption + rise + '</div></div>'
      + '<div class="price-wide_side"><p class="price-wide_side-title">' + esc(text.sideTitle) + '</p>' + includes + '</div>'
      + '</div>';
  }

  var api = {fromApi: fromApi, render: render, dayMonth: dayMonth, splitSchedule: splitSchedule, hoursPhrase: hoursPhrase};
  globalThis.BusinessConsultingPrice = api;
  if (typeof document === 'undefined') return;

  /* В браузере: один запрос к API. Карточка перерисовывается, только если разметка изменилась. */
  var root = document.querySelector('[data-price-block]');
  if (!root || !window.fetch) return;
  var text;
  try { text = JSON.parse(root.getAttribute('data-price-text')); } catch (error) { return; }
  var url = root.getAttribute('data-api') + '/api/public/course/' + root.getAttribute('data-course');
  fetch(url, {headers: {Accept: 'application/json'}})
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (course) {
      var model = fromApi(course);
      if (!model) return;
      var card = root.querySelector('[data-price-card]');
      if (card && card.getAttribute('data-price-card') !== signature(model)) card.outerHTML = render(model, text);
      // Дата старта в первом экране и в форме заявки.
      if (model.start) {
        document.querySelectorAll('[data-cms-start]').forEach(function (el) {
          el.textContent = el.getAttribute('data-cms-start').replace('{date}', model.start);
        });
      }
      // Расписание: дни и время в программе, короткая плитка в первом экране.
      if (model.schedule) {
        var put = function (selector, value) { document.querySelectorAll(selector).forEach(function (el) { el.textContent = value; }); };
        put('[data-cms-schedule-days]', model.schedule.days);
        put('[data-cms-schedule-time]', model.schedule.time);
        put('[data-cms-schedule-short]', model.schedule.short);
      }
      // Цена в микроразметке совпадает с ценой на странице.
      document.querySelectorAll('script[type="application/ld+json"][data-course-ld]').forEach(function (el) {
        try {
          var ld = JSON.parse(el.textContent);
          if (ld.offers) {
            ld.offers.price = String(model.sale);
            if (model.promo && course.promo.until) ld.offers.priceValidUntil = course.promo.until; else delete ld.offers.priceValidUntil;
          }
          if (ld.hasCourseInstance && model.startDate) ld.hasCourseInstance.startDate = model.startDate;
          el.textContent = JSON.stringify(ld);
        } catch (error) { /* разметка не тронута */ }
      });
    })
    .catch(function () { /* API недоступен — на странице остаётся снимок цены со сборки */ });

  /* Объём курса в академических часах — из каталога CMS (в ответе курса его нет): «кубик» под первым экраном
     и строка «Что входит» в карточке цены. Каталог не ответил — остаются часы со сборки. */
  fetch(root.getAttribute('data-api') + '/api/public/catalog', {headers: {Accept: 'application/json'}})
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (catalog) {
      var slug = root.getAttribute('data-course');
      var found = null;
      (function walk(o) {
        if (found || !o || typeof o !== 'object') return;
        if (Array.isArray(o)) { o.forEach(walk); return; }
        if (o.slug === slug && o.hours) { found = o; return; }
        Object.keys(o).forEach(function (k) { walk(o[k]); });
      })(catalog);
      var hours = found && Number(found.hours);
      if (!hours) return;
      text.hours = hours;
      document.querySelectorAll('[data-cms-hours]').forEach(function (el) {
        el.textContent = el.getAttribute('data-cms-hours').replace('{hours}', hoursPhrase(hours));
      });
    })
    .catch(function () { /* каталог недоступен — часы со сборки */ });
})();

/* Вкладки блока «Как вы будете учиться». Выбранная вкладка показывает свой текст и свою схему; схема начинается
   с начала цикла. Клавиатура: стрелки вверх/вниз и влево/вправо, Home, End. Без скрипта видны все тексты и схемы.
   Повторный запуск снимает прошлые обработчики (Тильда может перезапустить скрипты). */
(function () {
  if (typeof document === 'undefined') return;
  if (window.__businessConsultingLearningCleanup) window.__businessConsultingLearningCleanup();
  var controller = new AbortController();
  var signal = controller.signal;
  var blocks = Array.prototype.slice.call(document.querySelectorAll('[data-learning-tabs]'));
  if (!blocks.length) return;

  blocks.forEach(function (block) {
    var tabs = Array.prototype.slice.call(block.querySelectorAll('[data-learning-tab]'));
    var panels = Array.prototype.slice.call(block.querySelectorAll('[data-learning-panel]'));
    var scenes = Array.prototype.slice.call(block.querySelectorAll('[data-learning-scene]'));
    if (!tabs.length || tabs.length !== panels.length || tabs.length !== scenes.length) return;

    var select = function (index, focus) {
      tabs.forEach(function (tab, i) {
        var active = i === index;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        panels[i].hidden = !active;
        scenes[i].hidden = !active;
      });
      if (scenes[index].getAnimations) scenes[index].getAnimations({subtree: true}).forEach(function (animation) { animation.currentTime = 0; });
      if (focus) tabs[index].focus();
    };

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); }, {signal: signal});
      tab.addEventListener('keydown', function (event) {
        var last = tabs.length - 1;
        var next = {ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: last}[event.key];
        if (next === undefined) return;
        event.preventDefault();
        select((next + tabs.length) % tabs.length, true);
      }, {signal: signal});
    });
    var current = tabs.findIndex(function (tab) { return tab.getAttribute('aria-selected') === 'true'; });
    select(Math.max(0, current), false);
  });

  window.__businessConsultingLearningCleanup = function () {
    controller.abort();
    blocks.forEach(function (block) { block.querySelectorAll('[data-learning-panel], [data-learning-scene]').forEach(function (item) { item.hidden = false; }); });
    delete window.__businessConsultingLearningCleanup;
  };
})();
