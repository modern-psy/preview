/* Главная modern-psy.ru — данные из каталога CMS.
   Флагманы, «Последний шанс» и счётчики разделов приходят из /api/public/catalog.
   В index.html уже вшит снимок на дату сборки: его видят поисковики и посетители,
   если API не ответил. После ответа API этот скрипт перерисовывает блоки.
   Запрос к API один на страницу: шапка сайта читает то же обещание
   (window.__aspCatalogLoad), поэтому каталог не скачивается дважды.

   Править здесь можно тексты подписей. Порядок и состав флагманов задаёт CMS
   (галочка «флагман»), «Последний шанс» — статус курса в CMS. */
(function (root) {
  'use strict';

  var NBSP = ' ';
  var NNBSP = ' '; // узкий неразрывный пробел между разрядами: 45 000
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var LAST_CHANCE_LIMIT = 4; // сколько карточек «Последнего шанса» показывать
  var TIMEOUT_MS = 8000;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // 45000 → «45 000 ₽»
  function rub(value) {
    return new Intl.NumberFormat('ru-RU').format(Number(value)).replace(/\s/g, NNBSP) + NBSP + '₽';
  }

  // «2026-10-20» → «20 октября»; год дописываем, только если он не текущий
  function day(iso, today) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    var y = Number(p[0]), m = Number(p[1]) - 1, d = Number(p[2]);
    return d + NBSP + MONTHS[m] + (today && y !== today.y ? NBSP + y : '');
  }

  // Сегодняшняя дата по Москве
  function todayMoscow(now) {
    var t = new Date((now || new Date()).getTime() + 3 * 3600 * 1000);
    return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() };
  }

  // 1 курс, 2 курса, 5 курсов
  function plural(n, one, few, many) {
    var m = n % 10, mm = n % 100;
    var word = (mm >= 11 && mm <= 14) ? many : m === 1 ? one : (m >= 2 && m <= 4) ? few : many;
    return n + NBSP + word;
  }

  function upperFirst(s) {
    s = String(s || '');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // Неразрывный пробел после коротких слов в названиях из CMS
  // Короткие слова привязываем к следующему слову. Если в названии из CMS предлог привязан
  // с обеих сторон («отношений в практике» одним куском), отвязываем его от предыдущего слова,
  // иначе длинный кусок не переносится и вылезает из узкой карточки.
  function typo(s) {
    return String(s || '')
      .replace(/\u00a0(в|во|и|к|с|со|у|о|об|а|на|по|за|из|от|до|не|для|без|при)(?=\u00a0)/gi, ' $1')
      .replace(/(^|[\s(«])(в|во|и|к|с|со|у|о|об|а|на|по|за|из|от|до|не|для|без|при)\s/gi, '$1$2' + NBSP);
  }

  function isFree(card) { return !!(card.price && card.price.free); }
  function isLastChance(card) { return card.status === 'Последний шанс'; }
  function isOpenPaid(card) { return !isFree(card) && card.mode !== 'waitlist'; }

  // Подпись под ценой «в рассрочку…» нужна, иначе платёж в месяц читается как подписка
  function priceHtml(card, cls) {
    var p = card.price;
    if (!p) return '';
    var from = p.from ? 'от' + NBSP : '';
    var out = '<span class="' + cls + '_price">';
    // Зачёркнутая цена — только во время акции
    if (p.discounted != null) out += '<s class="' + cls + '_price-old body-text_component is-fine-print">' + from + rub(p.full) + '</s>';
    if (p.monthly) {
      out += '<b class="' + cls + '_price-main">' + from + rub(p.monthly) + '/мес</b>'
        + '<span class="' + cls + '_price-terms body-text_component is-fine-print">в' + NBSP + 'рассрочку от' + NBSP + 'банка на' + NBSP + '24' + NBSP + 'мес</span>';
    } else {
      out += '<b class="' + cls + '_price-main">' + from + rub(p.discounted != null ? p.discounted : p.full) + '</b>';
    }
    return out + '</span>';
  }

  function promoHtml(card, today) {
    if (!card.promo || !card.promo.discountPercent) return '';
    var until = card.promo.until ? ' до' + NBSP + day(card.promo.until, today) : '';
    return '<span class="flagship-card_promo">−' + esc(card.promo.discountPercent) + NBSP + '%' + until + '</span>';
  }

  function coverHtml(card, cls, eager) {
    var url = card.cover && card.cover.url;
    if (!url) return '<span class="' + cls + '_cover" aria-hidden="true"></span>';
    return '<img class="' + cls + '_image" src="' + esc(url) + '" alt="" width="800" height="800"'
      + (eager ? '' : ' loading="lazy"') + ' decoding="async">';
  }

  // ---------- Популярные направления: флагманы из CMS, по дате старта ----------
  function flagships(cards) {
    return cards
      .filter(function (c) { return c.flagship && isOpenPaid(c); })
      .sort(function (a, b) { return String(a.startDate || '9999').localeCompare(String(b.startDate || '9999')); });
  }

  function flagshipCard(card, today) {
    var meta = [];
    if (card.hours) meta.push(esc(card.hours) + NBSP + 'академ.' + NBSP + 'ч.');
    if (card.startDate && !isLastChance(card)) meta.push(day(card.startDate, today));
    return '<li class="flagships_item">'
      + '<a class="flagship-card_component" href="' + esc(card.url) + '">'
      + '<span class="flagship-card_media">' + coverHtml(card, 'flagship-card', false) + promoHtml(card, today) + '</span>'
      + '<span class="flagship-card_body">'
      + '<span class="flagship-card_type body-text_component is-fine-print">' + esc(upperFirst(card.subtitle)) + '</span>'
      + '<h3 class="flagship-card_title content-heading_component is-card">' + typo(esc(card.title)) + '</h3>'
      + (meta.length ? '<span class="flagship-card_meta body-text_component is-caption">' + meta.join('<i aria-hidden="true">·</i>') + '</span>' : '')
      + priceHtml(card, 'flagship-card')
      + '</span></a></li>';
  }

  function renderFlagships(cards, today) {
    return flagships(cards).map(function (c) { return flagshipCard(c, today); }).join('');
  }

  // ---------- Последний шанс: поток уже идёт, но присоединиться можно ----------
  function lastChance(cards) {
    return cards
      .filter(function (c) { return isLastChance(c) && isOpenPaid(c); })
      // Сначала потоки, которые стартовали позже всех: догнать их проще
      .sort(function (a, b) { return String(b.startDate || '').localeCompare(String(a.startDate || '')); })
      .slice(0, LAST_CHANCE_LIMIT);
  }

  function lastChanceCard(card) {
    var kind = /диплом/i.test(card.subtitle || '') ? 'Диплом' : 'Удостоверение';
    return '<li class="last-chance_item">'
      + '<a class="last-chance_card" href="' + esc(card.url) + '">'
      + '<span class="last-chance_thumb">' + coverHtml(card, 'last-chance', false) + '</span>'
      + '<span class="last-chance_body">'
      + '<span class="last-chance_status">Последний шанс</span>'
      + '<h3 class="last-chance_title body-text_component is-callout">' + typo(esc(card.title)) + '</h3>'
      + '<span class="last-chance_kind body-text_component is-fine-print">' + kind + '</span>'
      + priceHtml(card, 'last-chance')
      + '</span></a></li>';
  }

  function renderLastChance(cards) {
    return lastChance(cards).map(lastChanceCard).join('');
  }

  // ---------- Все направления: счётчики разделов каталога ----------
  function counts(cards) {
    var by = {};
    cards.forEach(function (c) {
      if (c.section === 'Вебинары') return;
      by[c.section] = (by[c.section] || 0) + 1;
    });
    return {
      professions: plural(by['Профессии'] || 0, 'программа', 'программы', 'программ'),
      methods: plural(by['Методы психотерапии'] || 0, 'курс', 'курса', 'курсов'),
      specializations: plural(by['Специализации'] || 0, 'курс', 'курса', 'курсов'),
      free: plural(by['Бесплатные мини-курсы'] || 0, 'курс', 'курса', 'курсов'),
      total: cards.filter(function (c) { return !(c.section === 'Вебинары' && c.startDate); }).length
    };
  }

  // ---------- Учиться бесплатно: мероприятия с датой и мини-курсы ----------
  // Мероприятия = бесплатные карточки CMS с датой (вебинары) + список из data/home-extra.json
  // (там игры, конференции, время начала и картинки). Совпадение — по дате и началу названия.
  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-zа-яё0-9]+/g, ' ').trim(); }

  function isoToday(today) {
    return today.y + '-' + String(today.m + 1).padStart(2, '0') + '-' + String(today.d).padStart(2, '0');
  }

  function upcomingEvents(cards, extra, today, limit) {
    var list = ((extra && extra.events) || []).map(function (e) {
      var copy = {};
      for (var k in e) copy[k] = e[k];
      return copy;
    });
    cards.forEach(function (c) {
      if (!isFree(c) || !c.startDate) return;
      var match = list.filter(function (e) {
        return e.date === c.startDate && norm(e.title).indexOf(norm(c.title)) === 0;
      })[0];
      var cover = c.cover && c.cover.url;
      if (match) {
        match.url = c.url || match.url; // адрес из CMS главнее: он живой
        match.cover = match.cover || cover;
      } else {
        list.push({ date: c.startDate, time: '', title: c.title, kind: 'вебинар', url: c.url, cover: cover, note: '' });
      }
    });
    var from = isoToday(today);
    return list
      .filter(function (e) { return e.date && e.date >= from && e.url; })
      .sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); })
      .slice(0, limit || 4);
  }

  function eventMeta(e, today) {
    var when = day(e.date, today) + (e.time ? ', ' + e.time : '');
    return [when, e.kind || 'мероприятие', e.note || 'бесплатно'].map(esc).join(' · ');
  }

  // Большая карточка выбранного мероприятия
  function eventPanel(e, today) {
    return '<div class="free-event_media">'
      + (e.cover ? '<img class="free-event_image" src="' + esc(e.cover) + '" alt="" width="800" height="800" loading="lazy" decoding="async"'
        + (e.position ? ' style="object-position:' + esc(e.position) + '"' : '') + '>' : '')
      + '</div>'
      + '<div class="free-event_content">'
      + '<p class="free-event_meta body-text_component is-caption">' + eventMeta(e, today) + '</p>'
      + '<h3 class="free-event_title content-heading_component is-prominent">' + typo(esc(e.title)) + '</h3>'
      + '<a class="home-button_component free-event_button" href="' + esc(e.url) + '">Записаться</a>'
      + '</div>';
  }

  // Строки ближайших мероприятий — это табы: клик показывает мероприятие в большой карточке
  function eventTabs(list, today, active) {
    return list.map(function (e, i) {
      var on = i === (active || 0);
      return '<li class="free-tabs_item" role="presentation">'
        + '<button class="free-tabs_tab' + (on ? ' is-active' : '') + '" type="button" role="tab"'
        + ' id="home-event-tab-' + i + '" aria-controls="home-event-panel" aria-selected="' + on + '"'
        + (on ? '' : ' tabindex="-1"') + ' data-home-event="' + i + '">'
        + '<span class="free-tabs_date">' + day(e.date, today) + '</span>'
        + '<span class="free-tabs_title body-text_component">' + typo(esc(e.title)) + '</span>'
        + '</button></li>';
    }).join('');
  }

  // Мини-курсы: бесплатные карточки CMS без даты + уроки и грант из data/home-extra.json
  function miniCourses(cards, extra) {
    var info = (extra && extra.miniCourses) || {};
    return cards.filter(function (c) { return isFree(c) && !c.startDate; }).map(function (c) {
      var m = info[c.slug] || {};
      var meta = [];
      if (m.lessons) meta.push(esc(m.lessons));
      if (m.grant) meta.push('грант ' + rub(m.grant));
      return '<li class="free-mini_item">'
        + '<a class="free-mini_link" href="' + esc(String(c.url || '').split('?')[0]) + '">'
        + '<span class="free-mini_thumb">' + coverHtml(c, 'free-mini', false) + '</span>'
        + '<span class="free-mini_body">'
        + '<span class="free-mini_title body-text_component is-callout">' + typo(esc(c.title)) + '</span>'
        + (meta.length ? '<span class="free-mini_meta body-text_component is-fine-print">' + meta.join(' · ') + '</span>' : '')
        + '</span></a></li>';
    }).join('');
  }

  // ---------- Преподаватели: подходы слева (табы), преподаватели подхода справа ----------
  // model собирает build.mjs из data/teachers.json: approaches [{name, url, courseTitle, people: [номера]}], teachers [...]
  function teacherTabs(model, active) {
    return model.approaches.map(function (a, i) {
      var on = i === active;
      return '<li class="teachers-nav_item" role="presentation">'
        + '<button class="teachers-nav_tab' + (on ? ' is-active' : '') + '" type="button" role="tab"'
        + ' id="home-teachers-tab-' + i + '" aria-controls="home-teachers-panel" aria-selected="' + on + '"'
        + (on ? '' : ' tabindex="-1"') + ' data-home-teachers="' + i + '">'
        + '<span>' + esc(a.name) + '</span><span class="teachers-nav_count">' + a.people.length + '</span>'
        + '</button></li>';
    }).join('');
  }

  function teacherPanel(model, i) {
    var a = model.approaches[i];
    if (!a) return '';
    return '<div class="teachers-panel_head">'
      + '<h3 class="teachers-panel_title content-heading_component is-prominent">' + esc(a.name) + '</h3>'
      + (a.url ? '<a class="teachers-panel_link body-text_component is-caption" href="' + esc(a.url) + '"'
        + (a.courseTitle ? ' aria-label="Перейти к курсу «' + esc(a.courseTitle) + '»"' : '') + '>Перейти к&nbsp;курсу</a>' : '')
      + '</div>'
      + '<ul class="teachers-panel_list">' + a.people.map(function (k) {
        var t = model.teachers[k];
        return '<li class="teacher-card_component">'
          + '<div class="teacher-card_photo"><img class="teacher-card_image" src="' + esc(t.photo) + '" alt="' + esc(t.name) + '" width="700" height="933" loading="lazy" decoding="async"></div>'
          + '<p class="teacher-card_name body-text_component is-callout">' + esc(t.name) + '</p>'
          + '<p class="teacher-card_role body-text_component is-fine-print">' + esc(t.role) + '</p>'
          + '<p class="teacher-card_bio body-text_component is-fine-print">' + typo(esc(t.bio)) + '</p>'
          + '</li>';
      }).join('') + '</ul>';
  }

  var api = {
    renderFlagships: renderFlagships,
    renderLastChance: renderLastChance,
    counts: counts,
    plural: plural,
    todayMoscow: todayMoscow,
    upcomingEvents: upcomingEvents,
    eventPanel: eventPanel,
    eventTabs: eventTabs,
    miniCourses: miniCourses,
    teacherTabs: teacherTabs,
    teacherPanel: teacherPanel,
    typo: typo,
    esc: esc
  };
  root.HomePage = api;

  // ---------- В браузере: обновляем снимок живыми данными ----------
  if (typeof document === 'undefined') return;

  function loadCatalog(base) {
    root.__aspCatalogLoad = root.__aspCatalogLoad || {};
    if (!root.__aspCatalogLoad[base]) {
      root.__aspCatalogLoad[base] = fetch(base + '/api/public/catalog', { headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        });
    }
    return root.__aspCatalogLoad[base];
  }

  function withTimeout(promise) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error('timeout')); }, TIMEOUT_MS);
      promise.then(function (v) { clearTimeout(timer); resolve(v); }, function (e) { clearTimeout(timer); reject(e); });
    });
  }

  // Карусель «Популярные направления»: стрелки листают на одну карточку,
  // на краях ленты гаснут. Пальцем и тачпадом лента листается сама (прокрутка браузера).
  function initSlider(slider) {
    var track = slider.querySelector('[data-home-slider-track]');
    var prev = slider.querySelector('[data-home-slider-prev]');
    var next = slider.querySelector('[data-home-slider-next]');
    if (!track || !prev || !next) return function () {};

    function step() {
      var item = track.firstElementChild;
      if (!item) return track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return item.getBoundingClientRect().width + gap;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      // Safari без события scrollend: цель достигнута — забываем её
      if (target !== null && Math.abs(track.scrollLeft - target) < 2) target = null;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
    }
    // Листаем к соседней карточке по номеру, а не «на ширину от текущего места»:
    // так быстрые клики во время плавной прокрутки не теряются и не сбиваются
    var target = null;
    function go(dir) {
      var s = step();
      var max = track.scrollWidth - track.clientWidth;
      var from = target !== null ? target : track.scrollLeft;
      target = Math.max(0, Math.min(max, (Math.round(from / s) + dir) * s));
      track.scrollTo({ left: target, behavior: 'smooth' });
    }
    track.addEventListener('scrollend', function () { target = null; update(); });
    track.addEventListener('pointerdown', function () { target = null; });
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    track.addEventListener('scroll', update, { passive: true });
    root.addEventListener('resize', update);
    update();
    return update;
  }

  // «Учиться бесплатно»: строки мероприятий — табы, большая карточка — их панель.
  // Возвращает функцию, которая перерисовывает блок по свежему каталогу.
  function initFree(block) {
    var extraNode = block.querySelector('[data-home-extra]');
    var extra = {};
    try { extra = JSON.parse(extraNode ? extraNode.textContent : '{}'); } catch (e) { extra = {}; }
    var events = block.querySelector('[data-home-free-events]');
    var panel = block.querySelector('[data-home-event-panel]');
    var tablist = block.querySelector('[data-home-event-tabs]');
    var mini = block.querySelector('[data-home-mini-list]');
    var list = [];
    var today = todayMoscow();

    function select(i, focus) {
      var tabs = tablist.querySelectorAll('[role="tab"]');
      if (!tabs[i] || !list[i]) return;
      Array.prototype.forEach.call(tabs, function (t, j) {
        var on = j === i;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        if (on) t.removeAttribute('tabindex'); else t.setAttribute('tabindex', '-1');
      });
      panel.setAttribute('aria-labelledby', tabs[i].id);
      panel.innerHTML = eventPanel(list[i], today);
      if (focus) tabs[i].focus();
    }

    function render(cards) {
      list = upcomingEvents(cards, extra, today, 4);
      if (!list.length) { events.hidden = true; return; } // мероприятий нет — остаются мини-курсы
      events.hidden = false;
      tablist.innerHTML = eventTabs(list, today, 0);
      select(0, false);
    }

    tablist.addEventListener('click', function (e) {
      var tab = e.target.closest('[role="tab"]');
      if (tab) select(Number(tab.getAttribute('data-home-event')), false);
    });
    tablist.addEventListener('keydown', function (e) {
      var tab = e.target.closest('[role="tab"]');
      if (!tab) return;
      var i = Number(tab.getAttribute('data-home-event'));
      var last = list.length - 1;
      var to = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: last }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      select(to < 0 ? last : to > last ? 0 : to, true);
    });

    // Снимок из index.html: список мероприятий восстанавливаем из снимка каталога
    var snapshot = extra.snapshotCards || [];
    list = upcomingEvents(snapshot, extra, today, 4);
    if (!list.length) events.hidden = true;
    // Если со дня сборки часть мероприятий прошла — перерисовываем сразу, не дожидаясь API
    else if (tablist.querySelectorAll('[role="tab"]').length !== list.length) render(snapshot);

    return function (cards) {
      render(cards);
      var html = miniCourses(cards, extra);
      if (mini && html) mini.innerHTML = html;
    };
  }

  // «Преподаватели»: подход в списке слева — таб, справа — его преподаватели.
  // Длинный список подходов прокручивается внутри; у края прокрутки гаснет растворение.
  function initTeachers(block) {
    var dataNode = block.querySelector('[data-home-teachers-data]');
    var model;
    try { model = JSON.parse(dataNode ? dataNode.textContent : 'null'); } catch (e) { model = null; }
    var tablist = block.querySelector('[data-home-teachers-tabs]');
    var panel = block.querySelector('[data-home-teachers-panel]');
    if (!model || !tablist || !panel) return;
    var last = model.approaches.length - 1;

    function select(i, focus) {
      var tabs = tablist.querySelectorAll('[role="tab"]');
      if (!tabs[i]) return;
      Array.prototype.forEach.call(tabs, function (t, j) {
        var on = j === i;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        if (on) t.removeAttribute('tabindex'); else t.setAttribute('tabindex', '-1');
      });
      panel.setAttribute('aria-labelledby', tabs[i].id);
      panel.innerHTML = teacherPanel(model, i);
      if (focus) tabs[i].focus();
    }
    function edges() {
      var vertical = tablist.scrollHeight > tablist.clientHeight + 1;
      var start = vertical ? tablist.scrollTop : tablist.scrollLeft;
      var max = vertical ? tablist.scrollHeight - tablist.clientHeight : tablist.scrollWidth - tablist.clientWidth;
      tablist.classList.toggle('is-scroll-end', start >= max - 2);
    }

    tablist.addEventListener('click', function (e) {
      var tab = e.target.closest('[role="tab"]');
      if (tab) select(Number(tab.getAttribute('data-home-teachers')), false);
    });
    tablist.addEventListener('keydown', function (e) {
      var tab = e.target.closest('[role="tab"]');
      if (!tab) return;
      var i = Number(tab.getAttribute('data-home-teachers'));
      var to = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: last }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      select(to < 0 ? last : to > last ? 0 : to, true);
    });
    tablist.addEventListener('scroll', edges, { passive: true });
    root.addEventListener('resize', edges);
    edges();
  }

  // «Как устроено обучение»: плитка практики (пара / тройка / группа, роли меняются)
  // и маленькие живые интерфейсы в остальных плитках. Всё крутится, только пока секция на экране.
  var PRACTICE = {
    pair: { title: 'Пара', text: 'Потом меняетесь: каждый пробует технику сам и\u00a0чувствует, как она работает с\u00a0другой стороны.',
      roles: ['терапевт', 'клиент'], pos: [[30, 56], [70, 56]],
      legend: [['Терапевт', 'ведёт сессию и\u00a0пробует технику'], ['Клиент', 'приносит запрос и\u00a0говорит, что почувствовал']] },
    triad: { title: 'Тройка', text: 'К\u00a0паре добавляется наблюдатель. За\u00a0три раунда каждый побывает в\u00a0каждой роли.',
      roles: ['терапевт', 'клиент', 'наблюдатель'], pos: [[26, 68], [74, 68], [50, 30]],
      legend: [['Терапевт', 'ведёт сессию и\u00a0пробует технику'], ['Клиент', 'приносит запрос и\u00a0говорит, что почувствовал'], ['Наблюдатель', 'замечает, что сработало, и\u00a0даёт обратную связь']] },
    group: { title: 'Группа', text: 'Разбор случая всей группой вместе с\u00a0преподавателем.',
      roles: ['терапевт', 'клиент', 'группа', 'группа', 'группа'], pos: [[36, 42], [64, 42], [17, 74], [50, 76], [83, 74]], teacher: true,
      legend: [['Пара в\u00a0центре', 'показывает сессию'], ['Группа', 'наблюдает и\u00a0предлагает, как действовать'], ['Преподаватель', 'ведёт разбор и\u00a0отвечает на\u00a0вопросы']] }
  };
  var LESSON_ICONS = {
    done: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="7 4 20 12 7 20"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
  };

  function initLearning(section) {
    var reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var stage = section.querySelector('[data-practice-stage]');
    var links = section.querySelector('[data-practice-links]');
    var switcher = section.querySelector('[data-practice-switch]');
    var nextBtn = section.querySelector('[data-practice-next]');
    var mode = 'triad', round = 0, people = [];

    function buildPeople() {
      people.forEach(function (p) { p.remove(); });
      people = PRACTICE[mode].roles.map(function (r, i) {
        var el = document.createElement('div');
        el.className = 'practice-person_component';
        el.innerHTML = '<span class="practice-person_face">' + 'АБВГД'.charAt(i) + '</span><span class="practice-person_role"></span>';
        stage.appendChild(el);
        return el;
      });
      round = 0;
      section.querySelector('[data-practice-title]').textContent = PRACTICE[mode].title;
      section.querySelector('[data-practice-text]').textContent = PRACTICE[mode].text;
      var legend = section.querySelector('[data-practice-legend]');
      if (legend) legend.innerHTML = PRACTICE[mode].legend.map(function (l) { return '<li class="practice-legend_item"><b>' + l[0] + ':</b> ' + l[1] + '</li>'; }).join('');
      section.querySelector('[data-practice-teacher]').classList.toggle('is-on', !!PRACTICE[mode].teacher);
      nextBtn.hidden = mode === 'group';
      placePeople();
    }
    function placePeople() {
      var m = PRACTICE[mode], n = m.roles.length, rot = mode === 'group' ? 0 : round % n;
      people.forEach(function (el, i) {
        var slot = (i + rot) % n, role = m.roles[slot];
        el.style.left = m.pos[slot][0] + '%';
        el.style.top = m.pos[slot][1] + '%';
        el.className = 'practice-person_component' + (role === 'терапевт' ? ' is-therapist' : role === 'наблюдатель' ? ' is-observer' : '');
        el.querySelector('.practice-person_role').textContent = role;
      });
      var x = function (p) { return p[0] * 1.6; }, html = '';
      if (mode === 'group') {
        for (var k = 2; k < n; k++) html += '<line class="practice-stage_link" x1="' + x(m.pos[k]) + '" y1="' + m.pos[k][1] + '" x2="80" y2="52"/>';
        html += '<line class="practice-stage_link" x1="80" y1="14" x2="80" y2="34"/>';
      } else {
        for (var a = 0; a < n; a++) for (var b = a + 1; b < n; b++)
          html += '<line class="practice-stage_link" x1="' + x(m.pos[a]) + '" y1="' + m.pos[a][1] + '" x2="' + x(m.pos[b]) + '" y2="' + m.pos[b][1] + '"/>';
      }
      links.innerHTML = html;
      section.querySelector('[data-practice-round]').textContent = mode === 'group' ? '' : 'Раунд ' + (rot + 1) + ' из ' + n;
    }

    // Мини-интерфейсы
    var lessons = section.querySelectorAll('[data-learning-lessons] .learning-lesson_item');
    var tasks = section.querySelectorAll('[data-learning-tasks] .learning-task_item');
    var stamp = section.querySelector('[data-learning-stamp]');
    var note = section.querySelector('[data-learning-note]');
    var lessonAt = 2, taskAt = 0, tick = 0, timer = null;
    function drawLessons() {
      Array.prototype.forEach.call(lessons, function (el, i) {
        var st = i < lessonAt ? 'done' : i === lessonAt ? 'play' : 'lock';
        el.className = 'learning-lesson_item' + (st === 'play' ? ' is-playing' : st === 'lock' ? ' is-locked' : '');
        el.querySelector('.learning-lesson_icon').innerHTML = LESSON_ICONS[st];
        var tail = el.querySelector('.learning-lesson_bar, .learning-lesson_note');
        if (tail) tail.remove();
        if (st === 'play') el.insertAdjacentHTML('beforeend', '<span class="learning-lesson_bar"><i></i></span>');
        if (st === 'lock') el.insertAdjacentHTML('beforeend', '<span class="learning-lesson_note">через неделю</span>');
      });
    }
    function drawTasks() {
      Array.prototype.forEach.call(tasks, function (el, i) { el.classList.toggle('is-done', i < taskAt); });
      if (stamp) stamp.classList.toggle('is-on', taskAt >= tasks.length);
    }
    function step() {
      tick++;
      taskAt = (taskAt + 1) % (tasks.length + 2); drawTasks();
      if (tick % 2 === 0 && note) note.classList.toggle('is-on');
      if (tick % 3 === 0 && mode !== 'group') { round++; placePeople(); }
      if (tick % 5 === 0) { lessonAt = lessonAt >= lessons.length - 1 ? 1 : lessonAt + 1; drawLessons(); }
    }
    function play() { section.classList.add('is-run'); if (!reduced && !timer) timer = setInterval(step, 1100); }
    function stop() { section.classList.remove('is-run'); clearInterval(timer); timer = null; }

    switcher.addEventListener('click', function (e) {
      var b = e.target.closest('[data-mode]');
      if (!b) return;
      mode = b.getAttribute('data-mode');
      Array.prototype.forEach.call(switcher.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      buildPeople();
    });
    nextBtn.addEventListener('click', function () { round++; placePeople(); });

    buildPeople();
    if (reduced) { taskAt = tasks.length; drawTasks(); if (note) note.classList.add('is-on'); return; }
    if (!('IntersectionObserver' in root)) { play(); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) play(); else stop(); });
    }, { threshold: 0.2 }).observe(section);
  }

  // «Не только курсы»: список конференций — табы; видео Kinescope грузится только по кнопке
  function initBeyond(section) {
    var box = section.querySelector('[data-conf-video]');
    var tablist = section.querySelector('[data-conf-tabs]');
    if (!box || !tablist) return;
    var tabs = tablist.querySelectorAll('[role="tab"]');
    var cur = 0;
    function select(i, focus) {
      if (!tabs[i]) return;
      cur = i;
      Array.prototype.forEach.call(tabs, function (t, j) {
        var on = j === i;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        if (on) t.removeAttribute('tabindex'); else t.setAttribute('tabindex', '-1');
      });
      var old = box.querySelector('iframe');
      if (old) old.remove();
      box.querySelector('[data-conf-poster-img]').src = tabs[i].getAttribute('data-conf-poster');
      box.querySelector('[data-conf-caption]').textContent = tabs[i].getAttribute('data-conf-name') + ' · ' + tabs[i].getAttribute('data-conf-year');
      box.setAttribute('aria-labelledby', tabs[i].id);
      if (focus) tabs[i].focus();
    }
    tablist.addEventListener('click', function (e) {
      var t = e.target.closest('[role="tab"]');
      if (t) select(Array.prototype.indexOf.call(tabs, t), false);
    });
    tablist.addEventListener('keydown', function (e) {
      var t = e.target.closest('[role="tab"]');
      if (!t) return;
      var i = Array.prototype.indexOf.call(tabs, t), last = tabs.length - 1;
      var to = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: last }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      select(to < 0 ? last : to > last ? 0 : to, true);
    });
    box.querySelector('[data-conf-play]').addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://kinescope.io/embed/' + tabs[cur].getAttribute('data-conf-kin') + '?autoplay=1';
      f.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      f.title = 'Видеоотчёт: ' + tabs[cur].getAttribute('data-conf-name');
      box.appendChild(f);
    });
  }

  // «Нам доверяют»: лента отзывов листается стрелками к соседней колонке (колонки разной ширины),
  // видео грузится только по кнопке, полный текст отзыва — в окне
  function initTrust(section) {
    var track = section.querySelector('[data-trust-track]');
    var prev = section.querySelector('[data-trust-prev]');
    var next = section.querySelector('[data-trust-next]');
    if (track && prev && next) {
      var pad = function () { return parseFloat(getComputedStyle(track).paddingLeft) || 0; };
      var update = function () {
        prev.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
      };
      var go = function (dir) {
        var x = track.scrollLeft, items = track.children, to = null;
        for (var i = 0; i < items.length; i++) {
          var left = items[i].offsetLeft - pad();
          if (dir > 0 && left > x + 4) { to = left; break; }
          if (dir < 0 && left < x - 4) to = left;
        }
        if (to === null) to = dir > 0 ? track.scrollWidth : 0;
        track.scrollTo({ left: to });
      };
      prev.addEventListener('click', function () { go(-1); });
      next.addEventListener('click', function () { go(1); });
      track.addEventListener('scroll', update, { passive: true });
      root.addEventListener('resize', update);
      update();
    }

    section.addEventListener('click', function (e) {
      var play = e.target.closest('.trust-video_play');
      if (play) {
        var box = play.parentNode, media;
        // Играет только одно видео: остальные ставим на паузу или убираем
        Array.prototype.forEach.call(section.querySelectorAll('.trust-video_component video'), function (v) { v.pause(); });
        if (box.getAttribute('data-trust-kin')) {
          media = document.createElement('iframe');
          media.src = 'https://kinescope.io/embed/' + box.getAttribute('data-trust-kin') + '?autoplay=1';
          media.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
          media.title = box.getAttribute('data-trust-title');
        } else {
          media = document.createElement('video');
          media.src = box.getAttribute('data-trust-video');
          media.controls = true;
          media.playsInline = true;
          media.autoplay = true;
          media.setAttribute('aria-label', box.getAttribute('data-trust-title'));
        }
        box.appendChild(media);
        play.remove();
        media.focus();
        return;
      }
      var open = e.target.closest('[data-trust-open]');
      if (open) {
        var dialog = document.getElementById(open.getAttribute('data-trust-open'));
        if (dialog && dialog.showModal) dialog.showModal();
        return;
      }
      var dlg = e.target.closest('.trust-dialog_component');
      // Окно закрывается крестиком и кликом мимо него (по затемнению); Esc — штатно
      if (!dlg) return;
      var r = dlg.getBoundingClientRect();
      var outside = e.target === dlg && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom);
      if (outside || e.target.closest('[data-trust-close]')) dlg.close();
    });
  }

  // «Поможем подобрать программу»: вопрос с вариантами и короткая форма.
  // Заявка уходит в скрытую форму Тильды на странице (имя — data-tilda-form-name), как запасная форма
  // на вебинарах: поля Name, Phone, messenger, messenger_contact, form_source, ym_client_id и utm-метки.
  // Полей, которых нет в форме Тильды, скрипт добавляет сам скрытыми.
  var PICK_IS_PRODUCTION = /(^|\.)modern-psy\.ru$/.test(root.location ? root.location.hostname : '');
  var PICK_SOURCE = 'главная: подбор программы';

  function pickSetValue(input, value) {
    var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (setter && setter.set) setter.set.call(input, value); else input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function pickTildaForm(name) {
    var forms = Array.prototype.slice.call(document.querySelectorAll('form.t-form'));
    var found = forms.filter(function (f) {
      var n = f.querySelector('input[name="tildaspec-formname"]');
      return n && n.value === name;
    })[0];
    return found || (forms.length === 1 ? forms[0] : null);
  }
  function pickTildaField(form, name, value) {
    var input = form.querySelector('input[name="' + name + '"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      form.appendChild(input);
    }
    pickSetValue(input, value);
  }
  // Ответ Тильды приходит событием: ждём его, но не дольше 10 секунд
  function pickWaitTilda(form) {
    return new Promise(function (resolve) {
      var done = false;
      function finish(result) {
        if (done) return;
        done = true;
        document.removeEventListener('tildaform:aftersuccess', ok);
        document.removeEventListener('tildaform:aftererror', fail);
        if (root.jQuery) root.jQuery(document).off('.homepick');
        resolve(result);
      }
      function ok() { finish('success'); }
      function fail() { finish('error'); }
      document.addEventListener('tildaform:aftersuccess', ok);
      document.addEventListener('tildaform:aftererror', fail);
      if (root.jQuery) {
        root.jQuery(document).on('tildaform:aftersuccess.homepick', ok);
        root.jQuery(document).on('tildaform:aftererror.homepick', fail);
      }
      setTimeout(function () { finish('timeout'); }, 10000);
    });
  }
  function pickSend(formName, values) {
    var form = pickTildaForm(formName);
    if (!form) {
      if (PICK_IS_PRODUCTION) {
        console.error('[подбор программы] Формы Тильды «' + formName + '» на странице нет, заявка не отправлена.');
        return Promise.resolve('error');
      }
      console.info('[подбор программы] Это превью: формы Тильды нет, заявка не отправлена.', values);
      return Promise.resolve('success');
    }
    var record = form.closest('.t-rec');
    if (record) record.setAttribute('aria-hidden', 'true');
    var utm = new URLSearchParams(root.location.search);
    Object.keys(values).forEach(function (k) {
      if (k === 'Phone' && root.t_form_phonemask__setValue) {
        var group = form.querySelector('.t-input-group_ph');
        if (group) { try { root.t_form_phonemask__setValue(group, values[k], undefined, { noFocus: true }); } catch (e) {} }
      }
      pickTildaField(form, k, values[k]);
    });
    pickTildaField(form, 'ym_client_id', (document.cookie.match(/(?:^|;\s*)_ym_uid=([^;]+)/) || [])[1] || '');
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) { pickTildaField(form, k, utm.get(k) || ''); });
    // Обязательные поля Тильды, которых нет на странице, иначе её проверка не пустит заявку
    Array.prototype.forEach.call(form.querySelectorAll('[required], [data-tilda-req]'), function (f) {
      if (!String(f.value || '').trim()) { f.removeAttribute('required'); f.removeAttribute('data-tilda-req'); f.removeAttribute('data-tilda-rule'); }
    });
    var answer = pickWaitTilda(form);
    var submit = form.querySelector('button[type="submit"]:not(:disabled), input[type="submit"]:not(:disabled)');
    if (submit) form.requestSubmit(submit); else form.requestSubmit();
    return answer;
  }

  function initPick(section) {
    var form = section.querySelector('[data-pick-form]');
    if (!form) return;
    var chosen = '';

    // Вариант ответа: подсвечиваем кнопку и показываем ответ на неё
    Array.prototype.forEach.call(section.querySelectorAll('[data-pick-option]'), function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-pick-option');
        chosen = btn.textContent.replace(/\s+/g, ' ').trim();
        Array.prototype.forEach.call(section.querySelectorAll('[data-pick-option]'), function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        Array.prototype.forEach.call(section.querySelectorAll('[data-pick-reply]'), function (r) { r.hidden = r.getAttribute('data-pick-reply') !== key; });
      });
    });

    var name = form.querySelector('[name="name"]');
    var phone = form.querySelector('[name="phone"]');
    var nickBox = form.querySelector('[data-pick-nick]');
    var nick = form.querySelector('[name="telegram"]');
    var submit = form.querySelector('[data-pick-submit]');
    var status = form.querySelector('[data-pick-status]');
    var messenger = function () { var r = form.querySelector('[name="messenger"]:checked'); return r ? r.value : 'max'; };
    var nickValue = function () { var v = nick.value.trim().replace(/^@?/, '@'); return /^@[A-Za-z0-9_]{3,32}$/.test(v) ? v : ''; };
    function valid() {
      var digits = phone.value.replace(/\D/g, '').length;
      return name.value.trim().length > 1 && digits >= 10 && digits <= 15 && (messenger() !== 'telegram' || !!nickValue());
    }
    function check() { submit.disabled = !valid(); }
    form.addEventListener('input', check);
    form.addEventListener('change', function (e) {
      if (e.target.name === 'messenger') {
        var tg = e.target.value === 'telegram';
        nickBox.hidden = !tg;
        nick.disabled = !tg;
        if (tg) nick.focus();
      }
      check();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valid() || submit.getAttribute('aria-busy') === 'true') return;
      var tg = messenger() === 'telegram';
      submit.setAttribute('aria-busy', 'true');
      submit.disabled = true;
      status.textContent = '';
      pickSend(form.getAttribute('data-tilda-form-name') || '', {
        Name: name.value.trim(),
        Phone: phone.value.trim(),
        messenger: tg ? 'Telegram' : 'MAX',
        messenger_contact: tg ? nickValue() : phone.value.trim(),
        form_source: PICK_SOURCE + ' · ' + (chosen || 'без ответа на вопрос')
      }).then(function (result) {
        submit.removeAttribute('aria-busy');
        if (result === 'error') {
          status.textContent = 'Не получилось отправить заявку. Попробуйте ещё раз чуть позже';
          check();
          return;
        }
        // success или timeout: Тильда приняла форму, но не ответила вовремя — заявку обычно всё равно получаем
        var done = section.querySelector('[data-pick-success]');
        form.hidden = true;
        done.hidden = false;
        done.focus();
      });
    });
    check();
  }

  function init(page) {
    if (page.__homeDone) return; // Тильда может запустить скрипт повторно
    page.__homeDone = true;

    var sliderUpdates = Array.prototype.map.call(page.querySelectorAll('[data-home-slider]'), initSlider);
    var freeUpdates = Array.prototype.map.call(page.querySelectorAll('[data-home-free]'), initFree);
    Array.prototype.forEach.call(page.querySelectorAll('[data-home-teachers-block]'), initTeachers);
    Array.prototype.forEach.call(page.querySelectorAll('[data-home-learning]'), initLearning);
    Array.prototype.forEach.call(page.querySelectorAll('[data-home-beyond]'), initBeyond);
    Array.prototype.forEach.call(page.querySelectorAll('[data-home-trust]'), initTrust);
    Array.prototype.forEach.call(page.querySelectorAll('[data-home-pick]'), initPick);

    var base = page.getAttribute('data-api');
    if (!base || !root.fetch) return;

    withTimeout(loadCatalog(base)).then(function (data) {
      var cards = (data && data.cards) || [];
      if (!cards.length) return; // пустой ответ — оставляем снимок
      var today = todayMoscow();

      var flagList = page.querySelector('[data-home-flagships]');
      var flagHtml = renderFlagships(cards, today);
      if (flagList && flagHtml) {
        flagList.innerHTML = flagHtml;
        sliderUpdates.forEach(function (fn) { fn(); });
      }

      var lastSection = page.querySelector('[data-home-last-chance]');
      if (lastSection) {
        var lastHtml = renderLastChance(cards);
        var list = lastSection.querySelector('[data-home-last-chance-list]');
        if (list) list.innerHTML = lastHtml;
        lastSection.hidden = !lastHtml; // нет идущих потоков — блок скрываем целиком
      }

      freeUpdates.forEach(function (fn) { fn(cards); });

      var n = counts(cards);
      Array.prototype.forEach.call(page.querySelectorAll('[data-home-count]'), function (el) {
        var key = el.getAttribute('data-home-count');
        if (n[key] != null) el.textContent = key === 'total' ? String(n.total) : n[key];
      });
      page.setAttribute('data-cms-state', 'live');
    }).catch(function () {
      page.setAttribute('data-cms-state', 'snapshot');
    });
  }

  function start() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-home]'), init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(typeof window !== 'undefined' ? window : globalThis);
