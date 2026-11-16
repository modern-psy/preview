/* =====================================================================
   БЛОК ЦЕНЫ ИЗ CMS · сам решает, как показать цену

   Скрипт берёт курс из Public API (адрес и курс заданы у секции
   атрибутами data-api и data-course) и по данным выбирает сценарий.
   Руками ничего переключать не нужно:

   1. Лист ожидания — нет открытых потоков, есть поток со статусом
      «Лист ожидания». Две карточки: бесплатно и бронь места (если в CMS
      есть цена брони).
   2. Тарифы — у потока в CMS два и больше тарифов. Карточки рядом,
      самый дорогой тёмный с ярлыком «Рекомендуем». Выбора тарифа нет.
      Если у блока задан состав тарифов, у каждого общий список пунктов:
      что входит — галочка, чего нет — серым с крестиком.
      • Модули и пакет (у пакета в настройках блока kind: 'bundle',
        как IFS и EMDR): пакет — тёмная карточка посередине, на рамке
        «Выгода N ₽» к модулям по отдельности; у каждой карточки свой
        состав, без общего списка с крестиками.
   3. Одна цена — всё остальное. Одна карточка: курс слева, цена справа.
      Если у блока задан состав курса («Что входит»), карточка как
      в витрине: слева курс и цена, справа пункты с галочками.
      • Если оплата сразу дешевле, чем в рассрочку, под ценой строка
        «выгода N ₽ при оплате сразу». Крупно — цена при оплате сразу.
      • С data-system="compare" такой случай показывается двумя
        карточками рядом: «Оплата сразу» и «В рассрочку».
   Поверх любого сценария:
   • несколько открытых потоков — даты старта переключаются сверху;
   • курс месяца — жёлтый купон «−10 % до 31 октября», рядом с ценой
     зачёркнутая цена до акции; акция у каждого потока своя, у потока
     без неё купона и скидки нет;
   • ближайшее повышение — серая плашка под ценой «С 20 октября: …»
     и «подорожает на N ₽». Нет повышения — плашки нет;
   • допуслуги (супервизии и т. п.; в CMS их нет, цены в настройках
     блока) — карточкой «Можно добавить» под ценой. В листе ожидания
     их нет: курс сейчас не продаётся;
   • внизу «Гибкие условия оплаты» (выключить: data-terms="off").
   Нет ни открытых потоков, ни листа ожидания — блок прячется целиком.

   Правила взяты из витрины /pricing-scenarios (решения Дарьи 12.10.2026):
   кнопок в блоке нет (кнопка живёт в форме ниже), официальная цена —
   в рассрочку, оплата сразу — выгода от неё, платёж в месяц из CMS,
   а если его там нет — цена в рассрочку ÷ 24. У курса с одной ценой
   в «Курсе месяца» платёж — цена со скидкой ÷ 24, как в каталоге.
   Начавшиеся потоки показываем, пока их не перевели в лист ожидания
   или не сняли с публикации (решение Дарьи 21.10.2026).

   Пока ответ CMS не пришёл и если CMS не ответила, на странице
   остаётся снимок цен на дату сборки блока.

   Что можно править: тексты в разделе 1.
   Что нельзя: остальное — по нему работает выбор сценария.
   ===================================================================== */
(function (global) {
  'use strict';

  /* ---------- 1. Тексты ---------- */
  var TEXT = {
    heading: 'Стоимость обучения',
    waitlistHeading: 'Запишитесь в лист ожидания',
    termsHeading: 'Гибкие условия оплаты',
    recommended: 'Рекомендуем',
    lastChance: 'поток уже идёт, ещё можно присоединиться',
    anytime: 'старт в любое время',
    includes: 'Что входит',
    addon: 'Можно добавить',
    monthChip: 'Курс месяца',
  };
  // Что даёт бронь — со слов Дарьи 12.10.2026, формулировки уточнить у отдела продаж.
  var BOOKING_BENEFITS = [
    'Свяжемся первыми, когда откроется набор',
    'Купите курс по самой низкой цене, до первого повышения',
    'Место за вами, даже если группа наберётся раньше старта',
  ];
  var WAITLIST_FREE = ['Напишем, когда откроется набор', 'Цену и даты узнаете вместе со всеми'];
  // Персональные скидки Академии. Что они не суммируются, не пишем (решение Дарьи 12.10.2026).
  // note — условие мелким серым под строкой. За коллегу: пригласивший может учиться у нас не впервые,
  // а приглашённый должен быть совсем новым, скидка обоим (формулировка Дарьи 20.10.2026).
  var DISCOUNTS = [
    { value: '−10', label: 'новым студентам' },
    { value: '−20', label: 'вам и коллеге, которого вы пригласили', note: 'если он ещё не учился у нас' },
    { prefix: 'до', value: '−20', label: 'нашим выпускникам за отзыв' },
  ];
  var TERMS = {
    installmentTitle: 'Рассрочка до 24 месяцев',
    installment: 'От банков-партнёров. Платёж делится на равные части, платите со второго месяца обучения.',
    discountsTitle: 'Персональные скидки',
    taxTitle: 'Налоговый вычет 13 %',
    tax: 'Подробно расскажем, как оформить документы, чтобы вернуть 13 % от стоимости обучения.',
  };

  /* ---------- 2. Статусы потоков в CMS ---------- */
  var OPEN = ['Идет набор', 'Идёт набор', 'Последний шанс', 'Старт в любое время'];
  var WAITLIST = 'Лист ожидания';
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var DAY_MS = 864e5;

  /* ---------- 3. Числа и текст ---------- */
  var NBSP = ' ';
  var MINUS = '−';
  var JOIN = '⁠'; // «₽/мес» не разрывается переносом строки
  function norm(v) { return String(v || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, ''); }
  function num(v) { return v == null || v === '' || isNaN(Number(v)) ? null : Number(v); }
  function digits(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP); }
  function rub(n) { return digits(n) + NBSP + '₽'; }
  function perMonth(n) { return rub(n) + JOIN + '/' + JOIN + 'мес'; }
  // Неразрывный пробел после коротких слов и чисел: «в рассрочку», «на 24 мес».
  function nb(text) { return String(text == null ? '' : text).replace(/(^|[\s(«])([а-яёА-ЯЁ]{1,2}|\d+) /g, '$1$2' + NBSP).replace(/(^|[\s(«])([а-яёА-ЯЁ]{1,2}|\d+) /g, '$1$2' + NBSP); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function t(v) { return esc(nb(v)); }
  // «1 платёж», «24 платежа», «5 платежей».
  function plural(n, one, few, many) { var a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many; }

  /* ---------- 4. Даты по московскому времени ---------- */
  // Даты в CMS приходят как «полночь по Москве» в UTC, поэтому день считаем в Москве.
  function moscow(ms) {
    var d = new Date(ms + 3 * 36e5); // Москва — UTC+3 круглый год
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
  }
  function partsOf(iso) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) { var a = iso.split('-').map(Number); return { y: a[0], m: a[1], d: a[2] }; }
    var ms = Date.parse(iso);
    return isNaN(ms) ? null : moscow(ms);
  }
  // «20 октября», год — только если он не текущий: «18 февраля 2027».
  function dayLabel(iso, now) {
    var p = iso && partsOf(iso);
    if (!p) return null;
    return p.d + ' ' + MONTHS[p.m - 1] + (p.y !== moscow(now).y ? ' ' + p.y : '');
  }
  function todayIso(now) { var p = moscow(now); return p.y + '-' + String(p.m).padStart(2, '0') + '-' + String(p.d).padStart(2, '0'); }

  /* ---------- 5. Модель: что пришло из CMS ---------- */
  // Цена потока или тарифа. reg — цены без «Курса месяца», sale — с ним (их считает API).
  // Снимок в вёрстке может устареть: если дата повышения уже прошла, двигаемся по графику цен сами.
  function priceOf(src, promo, now) {
    var regList = num(src.priceBeforeDiscount != null ? src.priceBeforeDiscount : (src.currentPrice != null ? src.currentPrice : src.price));
    var regOnce = num(src.fullPaymentPriceBeforeDiscount != null ? src.fullPaymentPriceBeforeDiscount : src.fullPaymentPrice);
    var saleList = num(src.currentPrice != null ? src.currentPrice : src.price);
    var saleOnce = num(src.fullPaymentPrice);
    var cmsMonth = num(src.installmentPerMonth);
    var next = src.nextPriceChange || null;
    var moved = false;
    var steps = (src.priceSchedule || []).filter(function (s) { return s && s.at && num(s.price) != null; })
      .sort(function (a, b) { return Date.parse(a.at) - Date.parse(b.at); });
    while (next && next.at && Date.parse(next.at) <= now) {
      regList = num(next.price);
      regOnce = num(next.fullPaymentPrice);
      moved = true;
      var after = Date.parse(next.at);
      next = steps.filter(function (s) { return Date.parse(s.at) > after; })[0] || null;
    }
    if (!promo) { saleList = regList; saleOnce = regOnce; }
    else if (moved) {
      // Акция действует, а цена сдвинулась по графику: скидку считаем сами, как API — на цену «сразу», если она есть.
      if (regOnce != null) saleOnce = Math.round(regOnce * (1 - promo.percent / 100));
      else saleList = Math.round(regList * (1 - promo.percent / 100));
    }
    if (regList == null && saleOnce == null) return null;
    if (moved) cmsMonth = null; // платёж из CMS считан под старую цену

    var twoPrices = regOnce != null && regList != null && regOnce < regList;
    var sale = saleOnce != null ? saleOnce : saleList;
    var was = saleOnce != null ? regOnce : regList;
    // Рассрочка — по правилу каталога (решение Дарьи 09.10.2026, подтверждено 21.10.2026): у курса с двумя
    // ценами — от цены в рассрочку, скидка «Курса месяца» её не меняет; у курса с одной ценой — от неё же,
    // со скидкой, если курс в акции. Тогда платёж из CMS не берём: он посчитан от цены без скидки.
    var discountedInstallment = !twoPrices && Boolean(promo) && was != null && was > sale;
    var p = {
      sale: sale,
      was: promo && was != null && was > sale ? was : null,
      official: regList,
      twoPrices: twoPrices,
      benefit: twoPrices ? regList - sale : 0,
      free: sale === 0,
      perMonth: discountedInstallment ? Math.round(sale / 24) : (cmsMonth || (regList ? Math.round(regList / 24) : null)),
      months: cmsMonth && !discountedInstallment ? (num(src.installmentMonths) || 24) : 24,
      next: null,
    };
    if (next) {
      var nextOnce = num(next.fullPaymentPrice), nextList = num(next.price);
      var nextSale = nextOnce != null && (nextList == null || nextOnce < nextList) ? nextOnce : nextList;
      // Повышение и «Курс месяца» — разные вещи (решение Дарьи 01.11.2026): строка о повышении сравнивает
      // цены без акции. 200 000 со скидкой 180 000, с 12 ноября 220 000 → «подорожает на 20 000».
      var nowRegular = was != null ? was : sale;
      if (nextSale != null && nextSale > nowRegular) p.next = { at: next.at, day: dayLabel(next.at, now), price: nextSale, diff: nextSale - nowRegular };
    }
    return p;
  }

  // «Курс месяца» → { percent, until } или null; закончившаяся акция снимается сама.
  function promoOf(raw, now) {
    raw = raw || {};
    var on = raw.active && num(raw.discountPercent) && (!raw.until || String(raw.until).slice(0, 10) >= todayIso(now));
    return on ? { percent: num(raw.discountPercent), until: dayLabel(raw.until, now) } : null;
  }

  // noDiscount — у секции data-promo="chip" (Дарья 03.11.2026, временно на трёх лендингах): скидку
  // «Курса месяца» из CMS не берём, цены полные, у потока в акции остаётся только чип «Курс месяца».
  function model(course, now, noDiscount) {
    now = now || Date.now();
    // С 27.10.2026 акция у каждого потока своя (streams[].promo): у КПТ Оксфорд скидка
    // может быть на осенний поток, а на зимний нет. Старый снимок без неё — акция курса на все потоки.
    var coursePromo = promoOf(course.promo, now);
    var all = course.streams || [];
    var open = all.filter(function (s) { return OPEN.indexOf(s.status) !== -1 && s.pricing; })
      .sort(function (a, b) { return String(a.startDate || '9999').localeCompare(String(b.startDate || '9999')); });
    var streams = [];
    open.forEach(function (s, index) {
      var pr = s.pricing;
      var inPromo = s.promo ? promoOf(s.promo, now) : coursePromo;
      var promo = noDiscount ? null : inPromo;
      var items = [];
      if (pr.hasTariffs) {
        (pr.tariffs || []).forEach(function (tariff) {
          var price = priceOf(tariff, promo, now);
          if (price) items.push({ name: tariff.title, description: tariff.description || null, price: price });
        });
        // От дешёвого к дорогому; рекомендуемый — самый дорогой.
        items.sort(function (a, b) { return a.price.sale - b.price.sale; });
        // Один тариф не называем тарифом: это просто цена курса.
        if (items.length === 1) items = [{ name: course.title, description: null, price: items[0].price }];
      } else {
        var price = priceOf(pr, promo, now);
        if (price) items.push({ name: course.title, description: null, price: price });
      }
      var anytime = s.status === 'Старт в любое время' || !s.startDate;
      if (items.length) {
        streams.push({
          id: s.startDate || 'stream-' + index,
          startDate: s.startDate || null,
          start: anytime ? null : dayLabel(s.startDate, now),
          anytime: anytime,
          lastChance: s.status === 'Последний шанс',
          promo: promo,
          chip: Boolean(noDiscount && inPromo),
          items: items,
        });
      }
    });
    var waiting = !streams.length ? all.filter(function (s) { return s.status === WAITLIST; })[0] : null;
    return {
      title: course.title || '',
      level: course.educationLevel || null,
      streams: streams,
      waitlist: waiting ? { booking: num(waiting.pricing && waiting.pricing.bookingPrice) } : null,
    };
  }

  /* ---------- 6. Какой сценарий показать ---------- */
  function scenarioOf(m, opts) {
    if (!m.streams.length) return m.waitlist ? 'waitlist' : 'none';
    var tariffs = m.streams.some(function (s) { return s.items.length > 1; });
    if (tariffs) return 'tariffs';
    var p = m.streams[0].items[0].price;
    if (m.streams.length === 1 && p.twoPrices && !p.free && opts.system === 'compare') return 'compare';
    return 'single';
  }

  /* ---------- 7. Разметка ---------- */
  // Галочка и крестик рисуются в CSS (маской), а не svg в каждом пункте: так код блока короче.
  var ICON_CHECK = '<span class="price-icon is-check" aria-hidden="true"></span>';
  var ICON_CROSS = '<span class="price-icon is-cross" aria-hidden="true"></span>';
  // Значок повышения: линия графика вверх со стрелкой.
  var ICON_RISE = '<svg class="price-rise_icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 17l6-6 4 4 8-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 7h6v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // Цена: число крупно, «₽» и «/мес» мелко. При акции рядом зачёркнутая цена до неё.
  // small — цена допуслуги, мельче цены курса; её не озвучиваем при смене потока.
  function priceTag(value, o) {
    o = o || {};
    var isNumber = typeof value === 'number';
    var unit = isNumber ? '<span class="price-tag_unit">₽' + (o.month ? JOIN + '/' + JOIN + 'мес' : '') + '</span>' : '';
    var was = o.was != null ? '<span class="price-tag_was"><s class="price-old"><span class="price-auto_sr">вместо </span>' + rub(o.was) + '</s></span>' : '';
    return '<p class="price-tag' + (o.small ? ' is-small"' : '" data-price-auto-total') + '><span class="price-tag_number">' + (isNumber ? digits(value) : t(value)) + '</span>' + unit + was + '</p>';
  }
  function priceMain(p) {
    if (p.free) return priceTag('Бесплатно');
    return priceTag(p.sale, { was: p.was });
  }

  // Строка под ценой, серым, выгода акцентом: «выгода N ₽ при оплате сразу», «или N ₽/мес в рассрочку на 24 мес».
  function caption(p) {
    if (p.free) return '';
    var lines = [];
    if (p.twoPrices) lines.push(p.benefit > 0 ? '<b class="price-caption_benefit">' + t('выгода ' + rub(p.benefit)) + '</b> ' + t('при оплате сразу') : t('при оплате сразу'));
    if (p.perMonth) lines.push(t('или ' + perMonth(p.perMonth) + ' в рассрочку на ' + p.months + ' мес'));
    return lines.length ? '<p class="price-caption">' + lines.map(function (l) { return '<span class="price-caption_line">' + l + '</span>'; }).join('') + '</p>' : '';
  }

  // Ближайшее повышение: «С 20 октября: 170 000 ₽», ниже «подорожает на 26 000 ₽».
  function rise(p) {
    if (!p.next || !p.next.day) return '';
    return '<p class="price-rise">' + ICON_RISE + '<span class="price-rise_text"><span class="price-rise_title">' + t('С ' + p.next.day + ': ' + rub(p.next.price)) + '</span>'
      + '<span class="price-rise_note">' + t('подорожает на ' + rub(p.next.diff)) + '</span></span></p>';
  }

  // Курс месяца — жёлтый купон «−10 % | до 31 октября», наклеен на карточку с ценой.
  // Купон у выбранного потока: на поток без акции его нет. Клеится на каждую карточку со скидкой (01.11.2026).
  // Без скидки (data-promo="chip") вместо купона жёлтый чип «Курс месяца» на том же месте.
  function sticker(stream) {
    if (!stream.promo) return stream.chip ? '<span class="price-sticker_component is-chip"><span class="price-sticker_chip">' + t(TEXT.monthChip) + '</span></span>' : '';
    return '<span class="price-sticker_component"><span class="price-sticker_coupon"><span class="price-auto_sr">Курс месяца: </span>'
      + '<span class="price-sticker_value">' + MINUS + stream.promo.percent + NBSP + '%</span>'
      + (stream.promo.until ? '<span class="price-sticker_until">' + t('до ' + stream.promo.until) + '</span>' : '') + '</span></span>';
  }

  // Список «что входит»: строка или { text, has }. Чего нет в тарифе — серым с крестиком.
  // Пояснение мелким серым под пунктом пишется после « | »: «Лекции в записи | Смотрите без привязки к расписанию».
  function checklist(list) {
    return '<ul class="price-check" role="list">' + list.map(function (row) {
      var r = typeof row === 'string' ? { text: row, has: true } : row;
      var parts = String(r.text).split(' | ');
      var note = r.note || parts[1] || '';
      return '<li class="price-check_item' + (r.has ? '' : ' is-off') + '">' + (r.has ? ICON_CHECK : ICON_CROSS)
        + '<span>' + t(parts[0]) + (note ? '<span class="price-check_note">' + t(note) + '</span>' : '')
        + (r.has ? '' : '<span class="price-auto_sr">, не входит</span>') + '</span></li>';
    }).join('') + '</ul>';
  }

  // Описание и состав тарифа из настроек блока: «Пакет стандарт» в CMS находит «Стандарт».
  function tariffInfo(name, tariffs) {
    var key = norm(name), best = null;
    Object.keys(tariffs || {}).forEach(function (k) {
      if (key.indexOf(norm(k)) !== -1 && (!best || k.length > best.length)) best = k;
    });
    return best ? tariffs[best] : {};
  }
  // Общий список пунктов по всем тарифам: у младшего тарифа видно, что теряешь, если экономишь.
  // Порядок пунктов — как у самого полного тарифа, иначе пропущенное у младшего («Модуль 4») встало бы в конец.
  function featureRows(items, tariffs) {
    var infos = items.map(function (item) { return tariffInfo(item.name, tariffs); });
    var rows = [];
    infos.slice().sort(function (a, b) { return (b.includes || []).length - (a.includes || []).length; })
      .forEach(function (info) { (info.includes || []).forEach(function (text) { if (rows.indexOf(text) === -1) rows.push(text); }); });
    return items.map(function (item, i) {
      var own = infos[i].includes || [];
      return { description: item.description || infos[i].description || null, list: rows.map(function (text) { return { text: text, has: own.indexOf(text) !== -1 }; }) };
    });
  }

  // «Гибкие условия оплаты» — одинаковые во всех сценариях: рассрочка, скидки, вычет.
  function terms(uid) {
    var row = function (title, body) { return '<div class="price-terms_row"><dt class="price-terms_title">' + t(title) + '</dt><dd class="price-terms_body">' + body + '</dd></div>'; };
    var discounts = '<ul class="price-discounts" role="list">' + DISCOUNTS.map(function (d) {
      return '<li class="price-discounts_item"><p class="price-discounts_value">' + (d.prefix ? '<span class="price-discounts_prefix">' + t(d.prefix) + '</span>' : '')
        + '<span>' + t(d.value) + NBSP + '%</span></p><p class="price-discounts_label">' + t(d.label) + (d.note ? '<span class="price-discounts_note">' + t(d.note) + '</span>' : '') + '</p></li>';
    }).join('') + '</ul>';
    return '<section class="price-terms_component" aria-labelledby="' + uid + '-terms"><h3 class="price-terms_heading" id="' + uid + '-terms">' + t(TEXT.termsHeading) + '</h3><dl class="price-terms_list">'
      + row(TERMS.installmentTitle, '<p class="price-terms_text">' + t(TERMS.installment) + '</p>')
      + row(TERMS.discountsTitle, discounts)
      + row(TERMS.taxTitle, '<p class="price-terms_text">' + t(TERMS.tax) + '</p>')
      + '</dl></section>';
  }

  // Даты старта переключаются сверху. Настоящие радиокнопки: работают стрелками с клавиатуры.
  function streamSwitch(m, stream, uid) {
    if (m.streams.length < 2) return '';
    var name = uid + '-stream';
    return '<fieldset class="price-switch"><legend class="price-switch_legend">Старт</legend><div class="segmented_component">'
      + m.streams.map(function (s, i) {
        return '<label class="segmented_item"><input class="segmented_input" type="radio" id="' + name + '-' + i + '" name="' + name + '" value="' + esc(s.id) + '" data-price-auto-stream'
          + (s.id === stream.id ? ' checked' : '') + '><span class="segmented_label">' + t(s.start || 'в любое время') + '</span></label>';
      }).join('') + '</div></fieldset>';
  }

  function startLine(stream) {
    if (stream.lastChance) return TEXT.lastChance;
    return stream.start ? 'старт ' + stream.start : TEXT.anytime;
  }

  // Вертикальная карточка: тариф, способ оплаты, вариант листа ожидания.
  function card(o) {
    return '<li class="price-card_component' + (o.featured ? ' is-featured' : '') + '">'
      + (o.tag ? '<span class="price-card_badge">' + t(o.tag) + '</span>' : '') + (o.sticker || '')
      + '<div class="price-card_head"><h3 class="price-card_name">' + t(o.title) + '</h3>' + (o.sub ? '<p class="price-card_sub">' + t(o.sub) + '</p>' : '') + '</div>'
      + '<div class="price-card_money">' + o.price + (o.caption || '') + '</div>'
      + '<div class="price-card_list">' + (o.list && o.list.length ? checklist(o.list) : '') + '</div>'
      + (o.foot ? '<div class="price-card_foot">' + o.foot + '</div>' : '')
      + '</li>';
  }
  function cardGrid(list) { return '<ul class="price-cards is-count-' + Math.min(list.length, 3) + '" role="list">' + list.join('') + '</ul>'; }

  // Метки @bundle и @addons не трогать: по ним код для Тильды выбрасывает пакет и допуслуги
  // у страниц, где их нет (место в T123 дорогое, см. dropJs в tilda-block.js).
  // @bundle
  // Модули и пакет, как в витрине (сценарий 6, решение Дарьи 12.10.2026): пакет посередине и выше соседей,
  // на рамке «Выгода N ₽» — от суммы цен модулей, по которым их можно купить сейчас (в «Курсе месяца»
  // модули тоже со скидкой, иначе выгода вышла бы больше настоящей). Состав у каждой карточки свой;
  // у пакета вместо своего списка можно назвать модули (parts) — тогда в нём пункты всех модулей.
  // count у модуля — сколько таких модулей в пакете: цикл из трёх вебинаров по одной цене заведён в CMS
  // одним тарифом «Один вебинар» (count: 3), выгода = 3 × цена вебинара − цена цикла (/adult-adhd-therapy, 07.11.2026).
  function bundleCards(stream, infos, at, tariffs) {
    var items = stream.items;
    var bundle = items[at];
    var modules = items.filter(function (item, i) { return i !== at; });
    var gain = modules.reduce(function (sum, item) { return sum + item.price.sale * (infos[items.indexOf(item)].count || 1); }, 0) - bundle.price.sale;
    var order = modules.length === 2 ? [modules[0], bundle, modules[1]] : modules.concat(bundle);
    return order.map(function (item) {
      var info = infos[items.indexOf(item)];
      var featured = item === bundle;
      var p = item.price;
      var list = info.includes || [].concat.apply([], (info.parts || []).map(function (name) { return tariffInfo(name, tariffs).includes || []; }));
      return card({
        featured: featured, tag: featured ? (gain > 0 ? 'Выгода ' + rub(gain) : TEXT.recommended) : '', sticker: p.was || stream.chip ? sticker(stream) : '',
        title: item.name, sub: item.description || info.description || null, price: priceMain(p), caption: caption(p), list: list, foot: rise(p),
      });
    });
  }
  // @end-bundle

  // @addons
  // Даты встреч одной строкой: «8, 22, 29 апреля и 13 мая 2027» (год — если не текущий).
  function daysLine(list) {
    var groups = [];
    (list || []).map(partsOf).filter(Boolean).forEach(function (p) {
      var last = groups[groups.length - 1];
      if (last && last.y === p.y && last.m === p.m) last.days.push(p.d);
      else groups.push({ y: p.y, m: p.m, days: [p.d] });
    });
    if (!groups.length) return '';
    var parts = groups.map(function (g) { return g.days.join(', ') + ' ' + MONTHS[g.m - 1]; });
    if (groups.length === 1 && groups[0].days.length > 1) {
      var d = groups[0].days;
      parts = [d.slice(0, -1).join(', ') + ' и ' + d[d.length - 1] + ' ' + MONTHS[groups[0].m - 1]];
    }
    var text = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' и ' + parts[parts.length - 1] : parts[0];
    var year = groups[groups.length - 1].y;
    return year !== moscow(Date.now()).y ? text + ' ' + year : text;
  }

  // Допуслуга, как в витрине (сценарий 6): слева что это и цена, справа что входит.
  // Переключателя «Добавить к заявке» нет: кнопок в блоке цены нет, о допуслуге говорят менеджеру.
  // Настройки: { name, dates — дни встреч «ГГГГ-ММ-ДД», time — «с 17:00 до 18:30», description,
  // price — с курсом, priceNote, separate — отдельно от курса, separateNote, includes }.
  function addonCards(list) {
    return (list || []).map(function (a) {
      var main = a.price != null ? a.price : a.separate;
      var lines = [];
      if (a.priceNote) lines.push(a.priceNote);
      if (a.price != null && a.separate != null) lines.push((a.separateNote || 'отдельно') + ' ' + rub(a.separate));
      var side = a.includes && a.includes.length ? '<div class="price-addon_side">' + checklist(a.includes) + '</div>' : '';
      var when = [daysLine(a.dates), a.time && a.time.replace(/ /g, NBSP)].filter(Boolean).join(', '); // время не разрываем
      return '<div class="price-addon_component' + (side ? '' : ' is-plain') + '"><div class="price-addon_main"><span class="price-wide_chip">' + t(TEXT.addon) + '</span>'
        + '<h3 class="price-addon_name">' + t(a.name) + '</h3>' + (when ? '<p class="price-addon_when">' + t(when) + '</p>' : '')
        + (a.description ? '<p class="price-addon_text">' + t(a.description) + '</p>' : '')
        + '<div class="price-addon_money">' + priceTag(main, { small: true })
        + (lines.length ? '<p class="price-caption">' + lines.map(function (l) { return '<span class="price-caption_line">' + t(l) + '</span>'; }).join('') + '</p>' : '')
        + '</div></div>' + side + '</div>';
    }).join('');
  }
  // @end-addons

  // Горизонтальная карточка «Одной цифры», как в витрине. С составом: слева курс и цена,
  // справа «Что входит» с галочками. Без состава (is-plain): слева курс, справа цена.
  // Плашка повышения всегда прямо под ценой: она относится только к цене.
  function wideCard(m, stream, p, includes) {
    var money = '<div class="price-wide_money">' + priceMain(p) + caption(p) + (p.next ? '<div class="price-wide_foot">' + rise(p) + '</div>' : '') + '</div>';
    var side = includes && includes.length ? '<p class="price-wide_side-title">' + t(TEXT.includes) + '</p>' + checklist(includes) : '';
    return '<div class="price-wide_component' + (side ? '' : ' is-plain') + '">' + sticker(stream)
      + '<div class="price-wide_main">' + (m.level ? '<span class="price-wide_chip">' + t(m.level) + '</span>' : '')
      + '<div class="price-wide_title"><h3 class="price-wide_name">' + t(m.title) + '</h3><p class="price-wide_sub">' + t(startLine(stream)) + '</p></div>'
      + (side ? money : '') + '</div>'
      + '<div class="price-wide_side">' + (side || money) + '</div>'
      + '</div>';
  }

  function frame(o) {
    return '<div class="price-block_component">'
      + '<div class="price-block_head"><div class="price-block_title"><h2 class="price-block_heading">' + t(o.heading) + '</h2>' + (o.lead ? '<p class="price-block_lead">' + o.lead + '</p>' : '') + '</div>'
      + (o.controls ? '<div class="price-block_controls">' + o.controls + '</div>' : '') + '</div>'
      + o.body + (o.terms ? terms(o.uid) : '') + '</div>';
  }
  function lead(m, stream) {
    var parts = [m.title];
    if (stream && m.streams.length === 1) parts.push(startLine(stream));
    if (m.level) parts.push(m.level.toLowerCase());
    return parts.map(t).join(', ');
  }

  // Главная функция: модель и выбранный поток → разметка блока. Пустая строка — показывать нечего.
  function render(m, state, opts) {
    state = state || {};
    opts = opts || {};
    var uid = opts.uid || 'price-auto';
    var scenario = scenarioOf(m, opts);
    if (scenario === 'none') return '';
    if (scenario === 'waitlist') {
      var cards = [card({ title: 'Лист ожидания', sub: 'Без оплаты', price: priceTag('Бесплатно'), list: WAITLIST_FREE })];
      if (m.waitlist.booking) cards.push(card({ featured: true, tag: 'Место за вами', title: 'Бронь места', sub: 'Место в следующем потоке', price: priceTag(m.waitlist.booking), list: BOOKING_BENEFITS }));
      return frame({ heading: TEXT.waitlistHeading, lead: lead(m, null), body: cardGrid(cards), terms: opts.terms, uid: uid });
    }
    var stream = m.streams.filter(function (s) { return s.id === state.stream; })[0] || m.streams[0];
    // installment: false — без строки «или N ₽/мес в рассрочку»: у недорогих вебинаров платёж ÷24 выходит
    // смешным (7 000 ₽ → 292 ₽/мес), а банк такие суммы в рассрочку не делит (/adult-adhd-therapy, 07.11.2026).
    if (opts.installment === false) stream.items.forEach(function (item) { item.price.perMonth = null; });
    var controls = streamSwitch(m, stream, uid);
    var first = stream.items[0].price;
    var showTerms = opts.terms && !first.free;
    var addons = addonCards(opts.addons);
    var body;
    if (stream.items.length > 1) {
      var infos = stream.items.map(function (item) { return tariffInfo(item.name, opts.tariffs); });
      var bundleAt = -1;
      infos.forEach(function (info, i) { if (bundleAt === -1 && info.kind === 'bundle') bundleAt = i; });
      var top = stream.items.length - 1; // самый дорогой — последний
      var rows = featureRows(stream.items, opts.tariffs);
      body = cardGrid(bundleAt !== -1 ? bundleCards(stream, infos, bundleAt, opts.tariffs) : stream.items.map(function (item, i) {
        var p = item.price;
        return card({
          featured: i === top, tag: i === top ? TEXT.recommended : '', sticker: p.was || stream.chip ? sticker(stream) : '',
          title: item.name, sub: rows[i].description, price: priceMain(p), caption: caption(p), list: rows[i].list, foot: rise(p),
        });
      }));
      return frame({ heading: TEXT.heading, lead: lead(m, stream), controls: controls, body: body + addons, terms: showTerms, uid: uid });
    }
    if (scenario === 'compare') {
      body = cardGrid([
        card({ featured: true, tag: first.benefit > 0 ? 'Выгода ' + rub(first.benefit) : '', sticker: sticker(stream), title: 'Оплата сразу', sub: 'Один платёж', price: priceTag(first.sale, { was: first.was }), foot: rise(first) }),
        card({ title: 'В рассрочку', sub: 'Официальная цена, ' + first.months + ' ' + plural(first.months, 'ежемесячный платёж', 'ежемесячных платежа', 'ежемесячных платежей'), price: priceTag(first.perMonth, { month: true }) }),
      ]);
      return frame({ heading: TEXT.heading, lead: lead(m, stream), controls: controls, body: body + addons, terms: showTerms, uid: uid });
    }
    // Карточка сама называет курс и дату старта, поэтому подзаголовка над ней нет.
    return frame({ heading: TEXT.heading, controls: controls, body: wideCard(m, stream, first, opts.includes) + addons, terms: showTerms, uid: uid });
  }

  /* ---------- 8. Микроразметка курса (schema.org) ---------- */
  // Потоки и цены для блока микроразметки (второй блок из генератора /pricing), по шаблону docs/seo.md:
  // один открытый поток — один CourseInstance, в нём цена, которую человек видит на странице.
  // Ближайшее повышение — срок действия цены (priceValidUntil, день до повышения).
  function dayBefore(iso) {
    var d = moscow(Date.parse(iso) - DAY_MS);
    return d.y + '-' + String(d.m).padStart(2, '0') + '-' + String(d.d).padStart(2, '0');
  }
  function offerLd(p, url, name) {
    var o = { '@type': 'Offer', price: String(p.sale), priceCurrency: 'RUB', availability: 'https://schema.org/InStock', url: url };
    if (name) o.name = name;
    if (p.next && p.next.at) o.priceValidUntil = dayBefore(p.next.at);
    return o;
  }
  function instancesLd(m, url, instructor) {
    return m.streams.map(function (s) {
      var i = { '@type': 'CourseInstance', courseMode: 'online', location: { '@type': 'VirtualLocation', url: url } };
      if (s.start) i.name = 'Поток ' + s.start;
      if (s.startDate) i.startDate = s.startDate;
      if (instructor) i.instructor = instructor;
      i.offers = s.items.length > 1
        ? s.items.map(function (item) { return offerLd(item.price, url, item.name); })
        : offerLd(s.items[0].price, url);
      return i;
    });
  }
  // Свежие цены пришли — переписываем потоки в блоке микроразметки этого курса, остальное не трогаем.
  function updateLd(slug, m) {
    if (typeof document === 'undefined' || !slug) return;
    Array.prototype.forEach.call(document.querySelectorAll('script[type="application/ld+json"][data-price-auto-ld]'), function (el) {
      if (el.getAttribute('data-price-auto-ld') !== slug) return;
      try {
        var data = JSON.parse(el.textContent);
        var old = Array.isArray(data.hasCourseInstance) ? data.hasCourseInstance[0] : data.hasCourseInstance;
        var list = instancesLd(m, data.url, old && old.instructor);
        if (list.length) data.hasCourseInstance = list; else delete data.hasCourseInstance;
        el.textContent = JSON.stringify(data, null, 2);
      } catch (e) { /* разметку не трогаем, если её не прочитать */ }
    });
  }

  var api = { model: model, render: render, scenarioOf: scenarioOf, instancesLd: instancesLd };

  /* ---------- 8. Живой блок на странице ---------- */
  if (typeof document === 'undefined') { global.PriceAuto = api; return; }

  // Плавная смена (решение Дарьи 12.10.2026): новая разметка сверяется со старой, заменяются только
  // изменившиеся куски — цифра, строка выгоды, дата повышения. Они мягко проявляются, карточки стоят на месте.
  function plain(el) { return el.outerHTML.replace(/ checked(="[^"]*")?/g, '').replace(/ is-fading/g, ''); }
  function sig(el) { return el.tagName + '.' + (el.classList[0] || ''); }
  function ownText(el) { return Array.prototype.filter.call(el.childNodes, function (n) { return n.nodeType === 3; }).map(function (n) { return n.nodeValue; }).join('|'); }
  function fadeIn(el) { el.classList.add('is-fading'); }
  function syncAttributes(oldEl, newEl) {
    var fading = oldEl.classList.contains('is-fading');
    Array.prototype.slice.call(oldEl.attributes).forEach(function (a) { if (a.name !== 'checked' && !newEl.hasAttribute(a.name)) oldEl.removeAttribute(a.name); });
    Array.prototype.slice.call(newEl.attributes).forEach(function (a) { if (a.name !== 'checked' && oldEl.getAttribute(a.name) !== a.value) oldEl.setAttribute(a.name, a.value); });
    if (fading) oldEl.classList.add('is-fading');
  }
  function morph(oldEl, newEl) {
    if (plain(oldEl) === plain(newEl)) return;
    if (sig(oldEl) !== sig(newEl) || ownText(oldEl) !== ownText(newEl)) { oldEl.replaceWith(newEl); fadeIn(newEl); return; }
    syncAttributes(oldEl, newEl);
    var oldKids = Array.prototype.slice.call(oldEl.children);
    var next = 0;
    Array.prototype.slice.call(newEl.children).forEach(function (newKid) {
      var match = -1;
      for (var i = next; i < oldKids.length; i++) { if (sig(oldKids[i]) === sig(newKid)) { match = i; break; } }
      if (match === -1) { oldEl.insertBefore(newKid, oldKids[next] || null); fadeIn(newKid); return; }
      oldKids.slice(next, match).forEach(function (k) { k.remove(); });
      morph(oldKids[match], newKid);
      next = match + 1;
    });
    oldKids.slice(next).forEach(function (k) { k.remove(); });
  }

  var counter = 0;
  function setup(root) {
    if (root.__priceAuto) return root.__priceAuto; // Тильда может запустить скрипт повторно
    var body = root.querySelector('[data-price-auto-body]');
    if (!body) return null;
    var snapshotEl = root.querySelector('script[data-price-auto-snapshot]');
    var snapshot = null;
    try { snapshot = snapshotEl ? JSON.parse(snapshotEl.textContent) : null; } catch (e) { snapshot = null; }
    // Чего нет в CMS (состав курса для галочек) — лежит в самом блоке отдельным JSON.
    var extraEl = root.querySelector('script[data-price-auto-extra]');
    var extra = {};
    try { extra = extraEl ? JSON.parse(extraEl.textContent) || {} : {}; } catch (e) { extra = {}; }
    var slug = (root.getAttribute('data-course') || '').trim();
    counter += 1;
    var opts = {
      system: root.getAttribute('data-system') === 'compare' ? 'compare' : 'figure',
      terms: root.getAttribute('data-terms') !== 'off',
      includes: Array.isArray(extra.includes) ? extra.includes : [],
      tariffs: extra.tariffs && typeof extra.tariffs === 'object' ? extra.tariffs : {},
      addons: Array.isArray(extra.addons) ? extra.addons : [],
      installment: extra.installment !== false,
      uid: 'price-auto-' + (slug.replace(/[^a-z0-9-]/gi, '') || 'course') + '-' + counter,
      noDiscount: root.getAttribute('data-promo') === 'chip',
    };
    var state = { stream: null };
    var current = null;
    var live = document.createElement('p');
    live.className = 'price-auto_sr';
    live.setAttribute('aria-live', 'polite');
    root.appendChild(live);

    function paint(fade) {
      var html = render(current, state, opts);
      root.hidden = !html; // показывать нечего — блок прячется целиком
      root.setAttribute('data-scenario', scenarioOf(current, opts));
      var oldRoot = body.firstElementChild;
      if (!html) { body.innerHTML = ''; return; }
      if (!fade || !oldRoot) { body.innerHTML = html; return; }
      var tpl = document.createElement('template');
      tpl.innerHTML = html;
      morph(oldRoot, tpl.content.firstElementChild);
    }
    function show(course, fade) {
      current = model(course, Date.now(), opts.noDiscount);
      paint(fade);
      updateLd(slug, current);
    }

    body.addEventListener('change', function (event) {
      var el = event.target;
      if (!el.hasAttribute || !el.hasAttribute('data-price-auto-stream') || !current) return;
      state.stream = el.value;
      paint(true);
      var again = document.getElementById(el.id);
      if (again) again.focus({ preventScroll: true });
      var total = body.querySelector('[data-price-auto-total]');
      if (total) live.textContent = Array.prototype.map.call(total.childNodes, function (n) { return n.textContent; }).join(' ');
    });
    body.addEventListener('animationend', function (event) { event.target.classList.remove('is-fading'); });

    var ctl = { show: show, options: opts, snapshot: snapshot, repaint: function () { if (current) paint(true); } };
    root.__priceAuto = ctl;
    if (snapshot) current = model(snapshot, Date.now(), opts.noDiscount);
    return ctl;
  }

  function load(root) {
    if (root.__priceAutoLoaded) return; // Тильда может запустить скрипт повторно
    root.__priceAutoLoaded = true;
    var ctl = setup(root);
    if (!ctl) return;
    var base = (root.getAttribute('data-api') || '').replace(/\/+$/, '');
    var slug = (root.getAttribute('data-course') || '').trim();
    var fallback = function (err) {
      if (err) console.error('[price-auto] цены из CMS не загрузились, остаётся снимок из вёрстки.', err);
      root.setAttribute('data-cms-state', 'error');
      if (ctl.snapshot) ctl.show(ctl.snapshot, true); // снимок пересчитывается на сегодня: прошедшие повышения учтены
    };
    if (!base || !slug || !window.fetch) { fallback(); return; }
    var abort = window.AbortController ? new AbortController() : null;
    var timer = abort && setTimeout(function () { abort.abort(); }, 8000);
    root.setAttribute('data-cms-state', 'loading');
    fetch(base + '/api/public/course/' + encodeURIComponent(slug), { headers: { Accept: 'application/json' }, signal: abort ? abort.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (course) {
        if (!course || course.error || !Array.isArray(course.streams)) throw new Error((course && course.error) || 'нет потоков в ответе');
        ctl.show(course, true);
        root.setAttribute('data-cms-state', 'ready');
      })
      .catch(fallback)
      .then(function () { if (timer) clearTimeout(timer); });
  }

  api.load = load;
  global.PriceAuto = api;
  function init() { Array.prototype.forEach.call(document.querySelectorAll('[data-price-auto]'), load); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : globalThis);
