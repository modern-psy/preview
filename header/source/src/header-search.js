/* Поиск по курсам в шапке. Второй блок T123 на странице-шапке, ставится сразу
   под первым (в первом не осталось места). Без этого блока шапка работает
   как раньше, только без поиска: поле «Найти курс» в строке шапки не появится.

   Блок сам дорисовывает в шапку поле поиска наверху меню, подсказки, список
   результатов и панель поиска для десктопа. Надписи и быстрые запросы
   приходят из apps/tilda/header/src/nav.json (раздел search) при сборке.

   Где ищем: курсы из того же ответа API, что и меню (/api/public/catalog):
   названия, поисковые слова, преподаватели, темы поиска из CMS. Пока API не
   ответил, ищем по снимку курсов в меню — только по названиям.

   Как открывается:
     телефон и планшет — поле в строке шапки открывает меню, курсор сразу
       в поле поиска наверху меню; пока в поле есть текст, вместо разделов
       показываются найденные курсы;
     десктоп — поле (на узком десктопе кнопка-лупа) открывает панель поиска
       под шапкой.
   Цели Метрики (если в nav.json указан счётчик): site_search — что искали
   и сколько нашли, site_search_empty — ничего не нашли, site_search_click —
   по какому курсу перешли. */
(function () {
  'use strict';
  var DESKTOP = window.matchMedia('(min-width: 64.0625rem)');
  var GOAL_DELAY = 1500; // цель отправляется, когда человек перестал печатать
  var ICON_SEARCH = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="5.75" stroke="currentColor" stroke-width="1.5"/><path d="m13.5 13.5 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  var ICON_CLEAR = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  function initSearch(root) {
    var S = window.AspSearch;
    var H = window.AspHeader;
    var cfg = window.__aspSearchCfg || {};
    if (!S || !H || root.__siteSearchDone) return;
    var trigger = root.querySelector('[data-search-open]');
    var nav = root.querySelector('[data-nav]');
    var head = nav && nav.querySelector('.site-nav_head');
    var closeButton = head && head.querySelector('[data-nav-close]');
    var bar = root.querySelector('.site-header_bar');
    if (!trigger || !head || !closeButton || !bar) return;
    root.__siteSearchDone = true;

    // ---------- Разметка поиска ----------
    function fieldHtml(id) {
      return '<label class="site-sr" for="' + id + '">' + H.esc(cfg.label || 'Найти курс') + '</label>'
        + ICON_SEARCH
        + '<input class="site-search_input" id="' + id + '" type="search" placeholder="' + H.esc(cfg.inputPlaceholder || cfg.label || 'Найти курс') + '" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="search" data-search-input>'
        + '<button class="site-search_clear" type="button" aria-label="Очистить поиск" data-search-clear hidden>' + ICON_CLEAR + '</button>';
    }
    function bodyHtml() {
      var hints = (cfg.hints || []).map(function (h) {
        return '<button class="site-search_hint" type="button" data-search-hint>' + H.esc(h) + '</button>';
      }).join('');
      return (hints ? '<div class="site-search_hints" data-search-hints><p class="site-search_hints-title">Часто ищут</p>' + hints + '</div>' : '')
        + '<div class="site-search_results" data-search-results aria-live="polite" hidden></div>';
    }
    function el(tag, cls, html) {
      var node = document.createElement(tag);
      node.className = cls;
      node.innerHTML = html;
      return node;
    }

    // Меню телефона и планшета: поле вместо слова «Меню», под ним подсказки и результаты
    var navField = el('div', 'site-search_field', fieldHtml('site-search-nav-input'));
    head.insertBefore(navField, closeButton);
    var navBody = el('div', 'site-search_body', bodyHtml());
    head.parentNode.insertBefore(navBody, head.nextSibling);
    nav.setAttribute('data-search-box', '');

    // Десктоп: панель под строкой шапки
    var panel = el('div', 'site-search-panel', '<div class="site-search-panel_inner" data-search-box>'
      + '<div class="site-search_field">' + fieldHtml('site-search-panel-input') + '</div>'
      + '<div class="site-search_body">' + bodyHtml() + '</div></div>');
    panel.id = 'site-search-panel';
    panel.setAttribute('role', 'search');
    bar.appendChild(panel);

    var boxes = [nav, panel.firstChild].map(function (box) {
      return {
        el: box,
        input: box.querySelector('[data-search-input]'),
        clear: box.querySelector('[data-search-clear]'),
        results: box.querySelector('[data-search-results]'),
        hints: box.querySelector('[data-search-hints]'),
      };
    });
    var navBox = boxes[0];
    var panelBox = boxes[1];

    var index = S.build(snapshotEntries(root)); // пока API не ответил — по снимку меню
    var lastQuery = '';
    var goalTimer = null;
    var api = root.getAttribute('data-api');
    if (api && window.AspCatalogData) {
      window.AspCatalogData(api).data.then(function (data) {
        index = S.build(S.fromCatalog(withPreviewExtra(data)));
        boxes.forEach(function (box) { if (box.input.value.trim()) render(box); });
      }).catch(function () { /* остаётся поиск по снимку */ });
    }

    root.classList.add('has-search');
    trigger.hidden = false;
    trigger.setAttribute('aria-controls', panel.id);

    // ---------- Открыть и закрыть ----------
    var scrim = root.querySelector('[data-nav-scrim]');

    function openPanel() {
      if (root.siteHeader) root.siteHeader.closeCatalog();
      if (scrim) scrim.hidden = false; // страница под панелью темнеет, как под каталогом
      root.classList.add('is-search-open');
      trigger.setAttribute('aria-expanded', 'true');
      panelBox.input.focus({ preventScroll: true });
      render(panelBox);
    }

    function closePanel(returnFocus) {
      if (!root.classList.contains('is-search-open')) return;
      root.classList.remove('is-search-open');
      if (scrim && !root.classList.contains('is-catalog-open')) scrim.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      if (returnFocus) trigger.focus({ preventScroll: true });
    }

    trigger.addEventListener('click', function () {
      if (DESKTOP.matches) {
        if (root.classList.contains('is-search-open')) closePanel(true);
        else openPanel();
        return;
      }
      // Телефон и планшет: открываем меню и ставим курсор в поле. focus() — в том же
      // нажатии, иначе iPhone не покажет клавиатуру.
      if (root.siteHeader) root.siteHeader.openNav({ keepFocus: true });
      navBox.input.focus({ preventScroll: true });
      render(navBox);
    });

    // Каталог открылся — панель поиска закрываем: они стоят на одном месте
    root.addEventListener('site-header:catalog-open', function () { closePanel(false); });
    root.addEventListener('site-header:nav-close', function () { setQuery(navBox, ''); });

    document.addEventListener('pointerdown', function (e) {
      if (!DESKTOP.matches || !root.classList.contains('is-search-open')) return;
      if (panel.contains(e.target) || trigger.contains(e.target)) return;
      closePanel(false);
    });

    var onLayout = function () { closePanel(false); };
    if (DESKTOP.addEventListener) DESKTOP.addEventListener('change', onLayout);
    else DESKTOP.addListener(onLayout);

    // ---------- Поле и результаты: клавиатура, подсказки, клики ----------
    boxes.forEach(function (box) {
      box.input.addEventListener('input', function () { render(box); });
      box.input.addEventListener('keydown', function (e) {
        var links = resultLinks(box);
        if (e.key === 'ArrowDown' && links.length) { e.preventDefault(); links[0].focus(); }
        else if (e.key === 'Enter' && links.length) { e.preventDefault(); links[0].click(); }
        else if (e.key === 'Escape') {
          e.stopPropagation();
          if (box.input.value) setQuery(box, '');
          else if (box === panelBox) closePanel(true);
          else if (root.siteHeader) root.siteHeader.closeNav(true);
        }
      });
      if (box.clear) box.clear.addEventListener('click', function () { setQuery(box, ''); box.input.focus(); });
      if (box.hints) box.hints.addEventListener('click', function (e) {
        var hint = e.target.closest('[data-search-hint]');
        if (!hint) return;
        setQuery(box, hint.textContent);
        box.input.focus({ preventScroll: true });
      });
      box.results.addEventListener('keydown', function (e) {
        var links = resultLinks(box);
        var i = links.indexOf(document.activeElement);
        if (i < 0) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); (links[i + 1] || links[i]).focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); (i ? links[i - 1] : box.input).focus(); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); box.input.focus(); }
      });
      box.results.addEventListener('click', function (e) {
        var link = e.target.closest('[data-search-slug]');
        if (!link) return;
        goal('site_search_click', { query: box.input.value.trim(), slug: link.getAttribute('data-search-slug'), position: Number(link.getAttribute('data-search-pos')) });
      });
    });

    function setQuery(box, value) {
      box.input.value = value;
      render(box);
    }

    function resultLinks(box) {
      return Array.prototype.slice.call(box.results.querySelectorAll('a'));
    }

    function render(box) {
      var q = box.input.value.trim();
      var searching = q.length > 0;
      box.clear.hidden = !searching;
      if (box.hints) box.hints.hidden = searching;
      // В меню телефона, пока ищем, разделы и ссылки прячутся
      if (box === navBox) root.classList.toggle('is-searching', searching);
      if (!searching) {
        box.results.innerHTML = '';
        box.results.hidden = true;
        return;
      }
      var found = S.search(index, q); // движок сам отдаёт не больше восьми
      box.results.hidden = false;
      box.results.innerHTML = resultsHtml(q, found);
      scheduleGoal(q, found.length);
    }

    function resultsHtml(q, found) {
      if (!found.length) {
        return '<p class="site-search_empty">По запросу «' + H.esc(q) + '» курсов нет. Попробуйте другое слово или посмотрите '
          + '<a class="site-nav_more" href="' + H.esc(cfg.allUrl || '#') + '">все курсы</a>.</p>';
      }
      var notes = [];
      if (found.layout) notes.push('Исправили раскладку: «' + H.esc(q) + '» → «' + H.esc(found.layout) + '»');
      if (found.partial) {
        notes.push(found.missed.length
          ? 'Точно по «' + H.esc(found.missed.join(', ')) + '» ничего нет, вот похожее'
          : 'Курса, где есть всё сразу, нет, вот близкие');
      }
      var utm = root.getAttribute('data-utm') || '';
      return (notes.length ? '<p class="site-search_note">' + notes.join('. ') + '</p>' : '')
        + '<ul class="site-search_list" role="list">'
        + found.map(function (r, i) {
          var c = r.c.card;
          // «Специализации · старт 24 ноября · по теме „сво“»: точка прилипает к слову слева
          var meta = [c.section, when(c), S.explain(r)].filter(Boolean).join('\u00a0· ');
          return '<li><a class="site-search_item" href="' + H.esc(H.withUtm(c.url, utm)) + '" data-search-slug="' + H.esc(r.c.s) + '" data-search-pos="' + (i + 1) + '">'
            + '<span class="site-search_title">' + H.esc(c.title) + '</span>'
            + '<span class="site-search_meta">' + H.esc(meta) + '</span>'
            + '</a></li>';
        }).join('')
        + '</ul>'
        + (cfg.allUrl ? '<a class="site-nav_more site-search_all" href="' + H.esc(cfg.allUrl) + '">' + H.esc(cfg.allLabel || 'Все курсы') + '</a>' : '');
    }

    // Строка под названием: «старт 26 октября», «лист ожидания», «бесплатно»
    function when(c) {
      if (c.meta != null) return c.meta; // курс из снимка меню
      if (c.price && c.price.free) return 'бесплатно';
      if (c.mode === 'waitlist') return 'лист ожидания';
      if (c.status === 'Последний шанс') return 'последний шанс';
      if (c.startDate) return 'старт ' + H.day(c.startDate);
      return 'набор открыт';
    }

    // ---------- Метрика ----------
    function goal(name, params) {
      try {
        if (cfg.metrika && typeof window.ym === 'function') window.ym(Number(cfg.metrika), 'reachGoal', name, params);
      } catch (e) { /* без Метрики поиск работает */ }
    }

    function scheduleGoal(q, count) {
      clearTimeout(goalTimer);
      goalTimer = setTimeout(function () {
        if (q === lastQuery) return;
        lastQuery = q;
        goal(count ? 'site_search' : 'site_search_empty', { query: q, results: count });
      }, GOAL_DELAY);
    }
  }

  // Курсы из снимка меню: название, ссылка, раздел и строка с датой
  function snapshotEntries(root) {
    var out = [];
    root.querySelectorAll('[data-section-panel]').forEach(function (panel) {
      var section = panel.getAttribute('data-section-panel');
      panel.querySelectorAll('.site-nav_course-link').forEach(function (a) {
        var title = a.querySelector('.site-nav_course-title');
        var meta = a.querySelector('.site-nav_course-meta');
        var t = (title || a).textContent;
        var url = a.getAttribute('href');
        out.push({ s: url, t: t, sec: section, tg: '', tch: '', tp: [], ds: '',
          card: { title: t, url: url, section: section, meta: meta ? meta.textContent : '' } });
      });
    });
    return out;
  }

  // Только для превью до выкладки CMS: дописывает в ответ API черновые поисковые
  // слова, преподавателей и темы. На сайте window.__aspSearchPreview не задан.
  function withPreviewExtra(data) {
    var x = window.__aspSearchPreview;
    if (!x || (data.topics && data.topics.length)) return data;
    var cards = data.cards.map(function (c) {
      return Object.assign({}, c, {
        searchWords: (c.searchWords || []).length ? c.searchWords : String(x.words[c.slug] || '').split(',').map(function (w) { return w.trim(); }).filter(Boolean),
        teachers: (c.teachers || []).length ? c.teachers : (x.teachers[c.slug] || []),
      });
    });
    return Object.assign({}, data, { cards: cards, topics: x.topics });
  }

  function init() {
    document.querySelectorAll('[data-site-header]').forEach(initSearch);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
