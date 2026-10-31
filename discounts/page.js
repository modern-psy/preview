/* Страница «Акции» · modern-psy.ru/discounts · 31.10.2026
   1. Курсы месяца из CMS: перерисовывает строки в тёмном баннере.
   2. Табы «Какие скидки ваши?». */
(function () {
  'use strict';

  /* ---------- 1. Курсы месяца ----------
     Берём курсы каталога с действующей акцией «Курс месяца» (card.promo), как баннер над каталогом
     (apps/tilda/course-month). До ответа и при ошибке остаётся снимок из разметки.
     Если акции сейчас нет, прячем блок курсов: баннер остаётся с заголовком и кнопкой. */

  // ЗАГОЛОВОК И СРОК. Скидка месяца действует с 1-го по последнее число, поэтому дата одна.
  // Можно править: {inMonth} — «октябре», {until} — «31 октября».
  var HEADING = 'Выгоднее в {inMonth}';
  var UNTIL = 'Скидки действуют до {until}';

  var NBSP = ' ';
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var MONTHS_IN = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'];

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function rub(v) { return new Intl.NumberFormat('ru-RU').format(Number(v)).replace(/\s/g, NBSP) + NBSP + '₽'; }
  function day(iso) {
    var p = String(iso || '').split('-');
    return p.length === 3 ? Number(p[2]) + NBSP + MONTHS[Number(p[1]) - 1] : null;
  }
  // Короткие предлоги не отрываются от следующего слова
  function nbsp(text) { return esc(text).replace(/(^|\s)([а-яё]{1,2}|ПТСР)\s/gi, '$1$2' + NBSP); }

  function priceOf(c) { return c.promo && c.promo.price ? c.promo.price : c.price; }
  function startOf(c) { return c.promo && c.promo.startDate !== undefined ? c.promo.startDate : c.startDate; }
  function percentOf(c, p) {
    if (c.promo && c.promo.discountPercent) return c.promo.discountPercent;
    return p.full ? Math.round((1 - p.discounted / p.full) * 100) : null;
  }
  // Подпись «при единовременной оплате»: скидка только на оплату сразу (флаг из API)
  function onePayment(p) {
    if (typeof p.onePayment === 'boolean') return p.onePayment;
    return !!p.monthly && Math.abs(p.monthly * 24 - p.discounted) > 24;
  }

  function select(cards) {
    return (cards || []).filter(function (c) {
      var p = priceOf(c);
      return c.promo && c.promo.active !== false && c.mode === 'open' && p && p.discounted != null;
    }).sort(function (a, b) {
      return String(startOf(a) || '9999').localeCompare(String(startOf(b) || '9999'));
    });
  }

  function row(c) {
    var p = priceOf(c);
    var start = startOf(c);
    var pct = percentOf(c, p);
    var from = p.from ? 'от' + NBSP : '';
    return '<li class="month-offer_item"><a class="month-offer_link" href="' + esc(c.url || 'https://modern-psy.ru/courses') + '">'
      + '<span class="month-offer_main"><span class="month-offer_title">' + nbsp(c.title) + '</span>'
      + '<span class="month-offer_meta">'
      + (start ? '<span>Старт <time datetime="' + esc(start) + '">' + day(start) + '</time></span>' : '') + '</span></span>'
      // Плашка с процентом стоит в блоке цены, рядом с новой ценой
      + '<span class="month-offer_price">' + (onePayment(p) ? '<span class="month-offer_terms">при единовременной оплате</span>' : '')
      + (pct ? '<span class="month-offer_pill">−' + pct + NBSP + '%</span>' : '')
      + '<strong class="month-offer_new">' + from + rub(p.discounted) + '</strong>'
      + (p.full && p.full !== p.discounted ? '<s class="month-offer_old">' + from + rub(p.full) + '</s>' : '')
      + '</span></a></li>';
  }

  function initMonth() {
    var root = document.querySelector('[data-month][data-api]');
    if (!root || !window.fetch) return;
    var list = root.querySelector('[data-month-list]');
    var heading = root.querySelector('[data-month-heading]');
    var until = root.querySelector('[data-month-until]');
    // Снимок в разметке устарел (акция из него закончилась) — прячем, пока не придут свежие данные
    var snapshotEnd = root.getAttribute('data-month-snapshot-until');
    var today = new Date();
    var todayIso = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);
    var snapshotExpired = snapshotEnd && todayIso > snapshotEnd;
    if (snapshotExpired) root.hidden = true;
    root.setAttribute('data-cms-state', 'loading');

    fetch(root.getAttribute('data-api').replace(/\/$/, '') + '/api/public/catalog')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        var cards = select(data.cards);
        if (!cards.length) { root.hidden = true; root.setAttribute('data-cms-state', 'empty'); return; }
        list.innerHTML = cards.map(row).join('');
        // Срок: самая ранняя дата окончания, чтобы обещание было верно для каждого курса
        var end = cards.map(function (c) { return c.promo.until; }).filter(Boolean).sort()[0];
        if (end && day(end)) {
          var m = Number(end.split('-')[1]) - 1;
          heading.textContent = HEADING.replace('{inMonth}', MONTHS_IN[m]).replace('в ', 'в' + NBSP);
          until.textContent = UNTIL.replace('{until}', day(end)).replace('до ', 'до' + NBSP);
          until.hidden = false;
        } else {
          heading.textContent = 'Курсы со' + NBSP + 'скидкой';
          until.hidden = true;
        }
        root.hidden = false;
        root.setAttribute('data-cms-state', 'ready');
      })
      .catch(function (err) {
        console.warn('[discounts] курсы месяца из CMS не загружены, остаётся снимок.', err);
        root.setAttribute('data-cms-state', 'error');
      });
  }


  /* ---------- 2. Табы «Какие скидки ваши?» ----------
     Без скрипта видны все панели подряд. Скрипт показывает строку табов
     и одну панель. Стрелки, Home и End переключают табы с клавиатуры. */
  function initPicker() {
    var root = document.querySelector('[data-picker]');
    if (!root) return;
    var tablist = root.querySelector('[data-picker-tabs]');
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    if (!tablist || !tabs.length) return;

    function panelOf(tab) { return document.getElementById(tab.getAttribute('aria-controls')); }

    function select(tab, focus, animate) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = panelOf(t);
        panel.hidden = !on;
        panel.classList.remove('is-entering');
        if (on && animate) { void panel.offsetWidth; panel.classList.add('is-entering'); }
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false, true); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true, true); }
      });
    });

    // Ссылка вида /discounts#panel-alumni сразу открывает нужную ситуацию
    function fromHash() {
      return tabs.filter(function (t) { return '#' + t.getAttribute('aria-controls') === location.hash; })[0];
    }
    window.addEventListener('hashchange', function () {
      var tab = fromHash();
      if (tab) select(tab, false, true);
    });
    tablist.hidden = false;
    select(fromHash() || tabs[0], false, false);
    root.classList.add('is-ready');
  }

  /* ---------- 3. Стена подарочных карт ----------
     Карты кладутся сплошным полем под наклоном и выходят за края баннера: на телефоне
     и планшете за бока и верх, на компьютере за верх, низ и правый край. Со стороны текста
     (снизу на телефоне и планшете, слева на компьютере) карты не обрезаются: те, что задели бы
     край, скрываются. Карт столько, сколько нужно, чтобы закрыть область: скрипт размножает
     образцы из разметки. Пересчитывается при любом изменении размера области. */
  var GIFT = {
    angle: 12,       // наклон стены, градусов (как в макете)
    ratio: 2 / 3,    // высота карты к ширине (aspect-ratio 3 / 2)
    gap: 0.1,        // зазор между картами в долях ширины карты
    inset: 14,       // зазор между картами и текстом, px
    // Ширина карты в долях ширины области и её пределы, px.
    // band — полоса над текстом (телефон, планшет), column — колонка справа (компьютер)
    band: { share: 0.38, min: 128, max: 210 },
    column: { share: 0.42, min: 170, max: 250 }
  };

  function initGiftWall() {
    var grid = document.querySelector('[data-gift-wall]');
    var area = grid && grid.parentElement;
    if (!grid || !area || !window.ResizeObserver) return;
    // Образцы карт из разметки: по ним делаются копии, фиолетовую выбирает скрипт
    var samples = Array.prototype.map.call(grid.children, function (card) {
      return { html: card.innerHTML, soft: card.classList.contains('is-soft') };
    });
    var pool = [];
    var lastKey = '';

    function apply() {
      var W = area.clientWidth, H = area.clientHeight;
      if (!W || !H) return;
      // колонка справа, если область выше, чем шире пополам (компьютер); иначе полоса над текстом
      var column = H > W * 0.9;
      var key = W + 'x' + H;
      if (key === lastKey) return;
      lastKey = key;

      var o = column ? GIFT.column : GIFT.band;
      var w = Math.round(Math.min(o.max, Math.max(o.min, W * o.share)));
      var h = w * GIFT.ratio, g = w * GIFT.gap;
      var a = -GIFT.angle * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
      var stepX = w + g, stepY = h + g;

      // Раскладывает поле с началом сетки в точке (cx, cy) и считает, сколько площади области
      // закрыли карты. Чтобы понять, какие ряды и столбцы нужны, углы области (с запасом
      // в карту) переводятся в координаты повёрнутой сетки.
      function place(cx, cy) {
        var pad = w;
        var uMin = Infinity, uMax = -Infinity, vMin = Infinity, vMax = -Infinity;
        [[-pad, -pad], [W + pad, -pad], [-pad, H + pad], [W + pad, H + pad]].forEach(function (p) {
          var dx = p[0] - cx, dy = p[1] - cy;
          var u = dx * cos + dy * sin, v = -dx * sin + dy * cos; // обратный поворот
          uMin = Math.min(uMin, u); uMax = Math.max(uMax, u);
          vMin = Math.min(vMin, v); vMax = Math.max(vMax, v);
        });
        var r0 = Math.floor(vMin / stepY), r1 = Math.ceil(vMax / stepY);
        var c0 = Math.floor(uMin / stepX), c1 = Math.ceil(uMax / stepX) + 1;
        var list = [], cover = 0;
        for (var r = r0; r <= r1; r++) {
          for (var c = c0; c <= c1; c++) {
            var x = c * stepX - (r % 2 ? w / 2 : 0), y = r * stepY;
            // габарит карты на экране после поворота
            var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(function (p) {
              var px = cx + p[0] * cos - p[1] * sin, py = cy + p[0] * sin + p[1] * cos;
              minX = Math.min(minX, px); maxX = Math.max(maxX, px);
              minY = Math.min(minY, py); maxY = Math.max(maxY, py);
            });
            // совсем за краем — не нужна
            if (maxX < 0 || minX > W || maxY < 0 || minY > H) continue;
            // со стороны текста карта целиком внутри, с зазором
            if (column ? minX < GIFT.inset : maxY > H - GIFT.inset) continue;
            var inside = minX >= 0 && maxX <= W && minY >= 0 && maxY <= H;
            cover += Math.max(0, Math.min(maxX, W) - Math.max(minX, 0)) * Math.max(0, Math.min(maxY, H) - Math.max(minY, 0));
            list.push({ x: x, y: y, mx: (minX + maxX) / 2, my: (minY + maxY) / 2, inside: inside, r: r, c: c });
          }
        }
        return { list: list, cover: cover, cx: cx, cy: cy };
      }

      // Перебираем сдвиги поля в пределах одной карты и берём тот, где карты закрывают
      // область плотнее всего (меньше пустых углов у края со стороны текста)
      var layout = null;
      for (var i = 0; i < 6; i++) {
        for (var j = 0; j < 4; j++) {
          var l = place(W / 2 + stepX * j / 4, H / 2 + stepY * i / 6);
          var hasWhole = l.list.some(function (p) { return p.inside; });
          if (hasWhole && (!layout || l.cover > layout.cover)) layout = l;
        }
      }
      if (!layout) return;
      var placed = layout.list, cx = layout.cx, cy = layout.cy;

      // Фиолетовая — целая карта ближе всего к центру видимой части стены
      var tx = W / 2, ty = column ? H / 2 : (H - GIFT.inset) / 2;
      var accent = -1, best = Infinity;
      placed.forEach(function (p, i) {
        var d = (p.mx - tx) * (p.mx - tx) + (p.my - ty) * (p.my - ty);
        if (p.inside && d < best) { best = d; accent = i; }
      });

      var frag = document.createDocumentFragment();
      placed.forEach(function (p, i) {
        // образец по ряду и столбцу, чтобы у соседних карт были разные цифры
        var n = samples.length, s = samples[((p.r * 3 + p.c) % n + n) % n];
        var el = pool[i] || (pool[i] = document.createElement('div'));
        el.className = 'gift-card_component' + (s.soft ? ' is-soft' : '') + (i === accent ? ' is-accent' : '');
        el.innerHTML = s.html;
        el.style.left = p.x.toFixed(1) + 'px';
        el.style.top = p.y.toFixed(1) + 'px';
        frag.appendChild(el);
      });
      grid.textContent = '';
      grid.appendChild(frag);
      grid.style.setProperty('--gift-w', w + 'px');
      grid.style.setProperty('--gift-x', cx + 'px');
      grid.style.setProperty('--gift-y', cy + 'px');
      grid.style.setProperty('--gift-angle', -GIFT.angle + 'deg');
      grid.setAttribute('data-layout', column ? 'column' : 'band');
    }

    // Считаем сразу, потом при изменении размера области (ResizeObserver) и окна (запасной путь:
    // в фоновой вкладке браузер может не присылать ResizeObserver, пока её не покажут)
    apply();
    // карты появляются один раз; при пересчёте раскладки анимацию не повторяем
    setTimeout(function () { grid.classList.add('is-settled'); }, 1500);
    new ResizeObserver(apply).observe(area);
    window.addEventListener('resize', apply);
  }

  function init() { initMonth(); initPicker(); initGiftWall(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
