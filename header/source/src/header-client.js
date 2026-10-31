/* Шапка в браузере: открывает и закрывает меню, переключает разделы,
   а курсы и карточки правой колонки («Выбор Академии») берёт из API /api/public/catalog
   и перерисовывает сам. До ответа и при ошибке остаётся снимок, вшитый
   в блок при сборке. Запрос к API один на страницу: каталог, табы и баннер
   «Курсы месяца» берут тот же ответ, сколько ждать — решает общий загрузчик
   (apps/tilda/catalog-live/src/catalog-data.js). */
(function () {
  'use strict';
  var DESKTOP = window.matchMedia('(min-width: 64.0625rem)');
  var TABLET_UP = window.matchMedia('(min-width: 48rem)');
  var FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)');
  var HOVER_OPEN_MS = 80;
  var HOVER_CLOSE_MS = 220;

  // Страница под открытым меню не прокручивается (на телефоне и планшете)
  var lockedAt = null;
  function lockPage(lock) {
    var html = document.documentElement;
    if (lock && lockedAt === null) {
      lockedAt = window.scrollY || window.pageYOffset || 0;
      html.classList.add('site-header-lock');
    } else if (!lock && lockedAt !== null) {
      html.classList.remove('site-header-lock');
      window.scrollTo(0, lockedAt);
      lockedAt = null;
    }
  }

  function initHeader(root) {
    if (root.__siteHeaderDone) return; // Тильда может запустить скрипт повторно
    root.__siteHeaderDone = true;

    var toggle = root.querySelector('[data-nav-toggle]');
    var nav = root.querySelector('[data-nav]');
    var catalog = root.querySelector('[data-catalog-menu]');
    var scrim = root.querySelector('[data-nav-scrim]');
    var closeButton = root.querySelector('[data-nav-close]');
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-section-tab]'));
    var panels = Array.prototype.slice.call(root.querySelectorAll('[data-section-panel]'));
    var submenus = Array.prototype.slice.call(root.querySelectorAll('[data-submenu-toggle]'));
    if (!toggle || !nav || !catalog) return;

    var hoverTimer = null;

    function panelFor(tab) {
      var id = tab.getAttribute('aria-controls');
      return id ? document.getElementById(id) : null;
    }

    function activeTab() {
      return tabs.filter(function (t) { return t.classList.contains('is-active'); })[0] || tabs[0];
    }

    // Активный раздел: подсвечен в рейке, его экран виден справа (планшет и десктоп)
    function selectTab(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p) { p.classList.toggle('is-active', p === panelFor(tab)); });
    }

    // Телефон: экран раздела открывается поверх меню
    function openPanel(tab) {
      selectTab(tab);
      var panel = panelFor(tab);
      if (!panel) return;
      panels.forEach(function (p) { p.classList.toggle('is-open', p === panel); });
      panel.scrollTop = 0;
      var back = panel.querySelector('[data-panel-back]');
      if (back) back.focus({ preventScroll: true });
    }

    function closePanels(returnFocus) {
      var open = panels.filter(function (p) { return p.classList.contains('is-open'); })[0];
      panels.forEach(function (p) { p.classList.remove('is-open'); });
      if (open && returnFocus) activeTab().focus({ preventScroll: true });
    }

    function closeSubmenus(except) {
      submenus.forEach(function (b) {
        if (b !== except) b.setAttribute('aria-expanded', 'false');
      });
    }

    // Десктоп: мега-меню под шапкой
    function openCatalog() {
      if (root.classList.contains('is-catalog-open')) return;
      closeSubmenus();
      root.dispatchEvent(new CustomEvent('site-header:catalog-open'));
      root.classList.add('is-catalog-open');
      toggle.setAttribute('aria-expanded', 'true');
      if (scrim) scrim.hidden = false;
      if (!tabs.some(function (t) { return t.classList.contains('is-active'); })) selectTab(tabs[0]);
    }

    function closeCatalog() {
      if (!root.classList.contains('is-catalog-open')) return;
      root.classList.remove('is-catalog-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (scrim) scrim.hidden = true;
    }

    // Телефон и планшет: выдвижное меню на весь экран.
    // keepFocus — фокус ставит тот, кто открыл (поиск ставит курсор в своё поле)
    function openNav(opts) {
      if (root.classList.contains('is-nav-open')) return;
      root.classList.add('is-nav-open');
      document.documentElement.classList.remove('site-header-hidden');
      toggle.setAttribute('aria-expanded', 'true');
      nav.scrollTop = 0;
      lockPage(true);
      if (TABLET_UP.matches && !tabs.some(function (t) { return t.classList.contains('is-active'); })) selectTab(tabs[0]);
      if (closeButton && !(opts && opts.keepFocus)) closeButton.focus({ preventScroll: true });
    }

    function closeNav(returnFocus) {
      if (!root.classList.contains('is-nav-open')) return;
      root.classList.remove('is-nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      closePanels(false);
      closeSubmenus();
      lockPage(false);
      root.dispatchEvent(new CustomEvent('site-header:nav-close'));
      if (returnFocus) toggle.focus({ preventScroll: true });
    }

    function closeAll(returnFocus) {
      closeCatalog();
      closeNav(returnFocus);
      closeSubmenus();
    }

    function isOpen() {
      return root.classList.contains('is-catalog-open') || root.classList.contains('is-nav-open');
    }

    // Кнопка в шапке: на десктопе открывает каталог, на остальных — всё меню
    function applyLayout() {
      toggle.setAttribute('aria-controls', DESKTOP.matches ? catalog.id : nav.id);
      toggle.setAttribute('aria-haspopup', DESKTOP.matches ? 'true' : 'dialog');
      closeAll(false);
      selectTab(activeTab());
    }

    toggle.addEventListener('click', function () {
      if (DESKTOP.matches) {
        if (root.classList.contains('is-catalog-open')) closeCatalog();
        else {
          openCatalog();
          activeTab().focus({ preventScroll: true });
        }
      } else if (root.classList.contains('is-nav-open')) closeNav(true);
      else openNav();
    });

    if (closeButton) closeButton.addEventListener('click', function () { closeNav(true); });
    if (scrim) scrim.addEventListener('click', function () { closeCatalog(); });

    // Наведение мышью на «Все курсы» тоже открывает меню, уход с панели закрывает
    function scheduleClose() {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(function () {
        if (!DESKTOP.matches || !FINE_POINTER.matches) return;
        if (toggle.matches(':hover') || catalog.matches(':hover')) return;
        if (catalog.contains(document.activeElement)) return;
        closeCatalog();
      }, HOVER_CLOSE_MS);
    }

    toggle.addEventListener('mouseenter', function () {
      if (!DESKTOP.matches || !FINE_POINTER.matches) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(openCatalog, HOVER_OPEN_MS);
    });
    toggle.addEventListener('mouseleave', function () {
      if (!DESKTOP.matches || !FINE_POINTER.matches) return;
      scheduleClose();
    });
    catalog.addEventListener('mouseenter', function () { clearTimeout(hoverTimer); });
    catalog.addEventListener('mouseleave', function () {
      if (!DESKTOP.matches || !FINE_POINTER.matches) return;
      scheduleClose();
    });

    // Разделы: наведение (десктоп), клик, стрелки на клавиатуре
    tabs.forEach(function (tab, index) {
      tab.addEventListener('mouseenter', function () {
        if (DESKTOP.matches && FINE_POINTER.matches) selectTab(tab);
      });
      tab.addEventListener('click', function () {
        if (TABLET_UP.matches) selectTab(tab);
        else openPanel(tab);
      });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (!next) return;
        e.preventDefault();
        selectTab(next);
        next.focus({ preventScroll: true });
      });
    });

    panels.forEach(function (panel) {
      var back = panel.querySelector('[data-panel-back]');
      if (back) back.addEventListener('click', function () { closePanels(true); });
    });

    // «Проекты»: по клику; на десктопе ещё и по наведению
    submenus.forEach(function (button) {
      var item = button.parentNode;
      var timer = null;
      button.addEventListener('click', function () {
        var open = button.getAttribute('aria-expanded') === 'true';
        closeSubmenus(button);
        if (DESKTOP.matches) closeCatalog();
        button.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
      item.addEventListener('mouseenter', function () {
        if (!DESKTOP.matches || !FINE_POINTER.matches) return;
        clearTimeout(timer);
        closeSubmenus(button);
        button.setAttribute('aria-expanded', 'true');
      });
      item.addEventListener('mouseleave', function () {
        if (!DESKTOP.matches || !FINE_POINTER.matches) return;
        timer = setTimeout(function () {
          if (!item.contains(document.activeElement)) button.setAttribute('aria-expanded', 'false');
        }, HOVER_CLOSE_MS);
      });
      item.addEventListener('focusout', function (e) {
        if (!DESKTOP.matches) return;
        if (!item.contains(e.relatedTarget)) button.setAttribute('aria-expanded', 'false');
      });
    });

    // Escape закрывает всё; клик мимо — закрывает каталог и «Проекты» на десктопе
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!DESKTOP.matches && panels.some(function (p) { return p.classList.contains('is-open'); })) {
        closePanels(true);
        return;
      }
      if (isOpen() || submenus.some(function (b) { return b.getAttribute('aria-expanded') === 'true'; })) closeAll(true);
    });

    document.addEventListener('pointerdown', function (e) {
      if (!DESKTOP.matches) return;
      if (root.contains(e.target)) return;
      closeCatalog();
      closeSubmenus();
    });

    root.addEventListener('focusout', function (e) {
      if (!DESKTOP.matches) return;
      if (e.relatedTarget && !root.contains(e.relatedTarget)) closeCatalog();
    });

    // При смене ширины экрана меню закрывается и раскладка переключается
    var onLayoutChange = function () { applyLayout(); };
    if (DESKTOP.addEventListener) DESKTOP.addEventListener('change', onLayoutChange);
    else DESKTOP.addListener(onLayoutChange);
    if (TABLET_UP.addEventListener) TABLET_UP.addEventListener('change', onLayoutChange);
    else TABLET_UP.addListener(onLayoutChange);
    applyLayout();

    // Для второго блока (поиск): открыть меню, закрыть меню и каталог
    root.siteHeader = { openNav: openNav, closeNav: closeNav, closeCatalog: closeCatalog };

    loadLiveData(root, tabs, panels);
  }


  // Курсы из CMS: перерисовываем экраны разделов, счётчики и правую колонку
  function loadLiveData(root, tabs, panels) {
    var api = root.getAttribute('data-api');
    var utm = root.getAttribute('data-utm') || '';
    if (!api || !window.fetch || !window.AspHeader || !window.AspCatalogData) return;
    var H = window.AspHeader;
    root.setAttribute('data-cms-state', 'loading');

    window.AspCatalogData(api).data.then(function (data) {
      var cards = data.cards;
      var now = new Date();

      panels.forEach(function (panel) {
        var cfg = {
          section: panel.getAttribute('data-section-panel'),
          label: panel.getAttribute('data-label') || '',
          url: panel.getAttribute('data-url'),
          noun: (panel.getAttribute('data-noun') || '').split('|').filter(Boolean),
        };
        var body = panel.querySelector('[data-panel-body]');
        if (!body) return;
        var html = H.panelHtml(cfg, H.select(cards, cfg.section), utm, now);
        var sig = H.signature(html);
        if (body.getAttribute('data-sig') !== sig) {
          body.innerHTML = html;
          body.setAttribute('data-sig', sig);
        }
      });

      tabs.forEach(function (tab) {
        var count = tab.querySelector('[data-count]');
        if (count) count.textContent = String(H.select(cards, tab.getAttribute('data-section-tab')).length || '');
      });

      // Правая колонка: ручные карточки остаются, слаги подставляются из CMS
      var slots = Array.prototype.slice.call(root.querySelectorAll('[data-soon-slug]'));
      var picked = H.pickSoon(cards, slots.map(function (li) { return li.getAttribute('data-soon-slug') || ''; }));
      slots.forEach(function (li, i) {
        var card = picked[i];
        if (!card) { li.hidden = true; return; }
        var html = H.soonCardHtml(card, utm, now);
        var sig = H.signature(html);
        li.hidden = false;
        if (li.getAttribute('data-sig') !== sig) {
          li.innerHTML = html;
          li.setAttribute('data-sig', sig);
        }
      });

      root.setAttribute('data-cms-state', 'ready');
    }).catch(function (err) {
      console.warn('[site-header] меню из CMS не обновлено, остаётся снимок.', err);
      root.setAttribute('data-cms-state', 'error');
    });
  }

  function init() {
    document.querySelectorAll('[data-site-header]').forEach(initHeader);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
