/* ==========================================================================
   АСП Практикум · UI-кит · поведение
   Три вещи: табы, раскрытие «Подробнее» и аккордеон, появление при прокрутке.
   Работает только внутри .practicum-page. Подключать с defer.
   Можно вызывать повторно: PracticumKit.init() не навешивает обработчики дважды.
   ========================================================================== */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* --- Табы: role="tablist" > role="tab", панели role="tabpanel".
         Стрелки влево/вправо, Home и End переключают вкладки --- */
  function initTabs(root) {
    root.querySelectorAll('[data-js="tabs"]').forEach(function (tabsRoot) {
      if (tabsRoot.dataset.ready) return;
      tabsRoot.dataset.ready = 'true';

      var tabs = Array.prototype.slice.call(tabsRoot.querySelectorAll('[role="tab"]'));

      function select(tab, moveFocus) {
        tabs.forEach(function (item) {
          var isActive = item === tab;
          item.setAttribute('aria-selected', String(isActive));
          item.tabIndex = isActive ? 0 : -1;
          var panel = document.getElementById(item.getAttribute('aria-controls'));
          if (panel) panel.hidden = !isActive;
        });
        if (moveFocus) tab.focus();
        tabsRoot.dispatchEvent(new CustomEvent('practicum-tabs:change', { detail: { tab: tab } }));
      }

      tabs.forEach(function (tab, index) {
        tab.addEventListener('click', function () { select(tab, false); });
        tab.addEventListener('keydown', function (event) {
          var next = null;
          if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
          if (event.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
          if (event.key === 'Home') next = tabs[0];
          if (event.key === 'End') next = tabs[tabs.length - 1];
          if (next) {
            event.preventDefault();
            select(next, true);
          }
        });
      });
    });
  }

  /* --- Раскрытие: кнопка с aria-expanded и aria-controls.
         Панель .disclosure_panel получает класс is-open.
         data-label-open / data-label-closed меняют подпись кнопки --- */
  function initDisclosures(root) {
    root.querySelectorAll('[data-js="disclosure-trigger"]').forEach(function (trigger) {
      if (trigger.dataset.ready) return;
      trigger.dataset.ready = 'true';

      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!panel) return;
      var label = trigger.querySelector('[data-js="disclosure-label"]');

      trigger.addEventListener('click', function () {
        var isOpen = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!isOpen));
        panel.classList.toggle('is-open', !isOpen);
        if (label && trigger.dataset.labelOpen && trigger.dataset.labelClosed) {
          label.textContent = isOpen ? trigger.dataset.labelClosed : trigger.dataset.labelOpen;
        }
      });
    });
  }

  /* --- Появление при прокрутке: [data-reveal].
         Без поддержки IntersectionObserver и при «уменьшить движение»
         ничего не прячем --- */
  function initReveal(root) {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
    var items = root.querySelectorAll('[data-reveal]:not(.is-revealed)');
    if (!items.length) return;

    root.classList.add('is-reveal-ready');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -5% 0px' });

    items.forEach(function (item) {
      // То, что уже на экране при загрузке, показываем сразу, без анимации
      var rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        item.classList.add('is-revealed');
      } else {
        observer.observe(item);
      }
    });
  }

  function init() {
    document.querySelectorAll('.practicum-page').forEach(function (root) {
      initTabs(root);
      initDisclosures(root);
      initReveal(root);
    });
  }

  window.PracticumKit = { init: init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
