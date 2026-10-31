/* Шапка уезжает вверх, пока страницу листают вниз, и возвращается при прокрутке
   вверх. Живёт во втором блоке T123 вместе с поиском: в первом не осталось места.
   Без второго блока шапка просто всегда видна наверху.
   Классы на <html>: site-header-hidden — шапка спрятана, site-header-floating —
   страница прокручена и под шапкой тень. Анимация — в header-autohide.css. */
(function () {
  'use strict';
  var DESKTOP = window.matchMedia('(min-width: 64.0625rem)');

  // Шапка уезжает вверх, пока страницу листают вниз, и возвращается при прокрутке вверх.
  // Пороги — сколько пикселей пролистать в одну сторону, чтобы шапка спряталась или
  // вернулась: на телефоне хватает движения пальца, на десктопе нужно больше, чтобы
  // шапка не скакала от каждого щелчка колеса и дрожания тачпада.
  // Наверху страницы, при открытом меню, каталоге, поиске или списке «Проекты» /
  // «Академия» и когда в шапку зашли с клавиатуры — шапка всегда видна.
  var PHONE_STEP = 8;
  var DESKTOP_HIDE = 80;
  var DESKTOP_SHOW = 160;

  function initAutoHide(root) {
    var html = document.documentElement;
    var fromY = window.pageYOffset || 0; // где началось движение против текущего состояния
    var queued = false;

    function update() {
      queued = false;
      var y = window.pageYOffset || 0;
      var hidden = html.classList.contains('site-header-hidden');
      // Шапка висит над страницей — под ней тень
      html.classList.toggle('site-header-floating', y > root.offsetHeight);
      if (y <= root.offsetHeight || html.classList.contains('site-header-lock') || root.classList.contains('is-catalog-open')
        || root.classList.contains('is-search-open') || root.querySelector('[data-submenu-toggle][aria-expanded="true"]') || keyboardFocusIn(root)) {
        html.classList.remove('site-header-hidden');
        fromY = y;
        return;
      }
      var d = y - fromY;
      // Листают в ту же сторону, что уже сделала шапка, — отсчёт начинается заново
      if (hidden ? d > 0 : d < 0) { fromY = y; return; }
      var limit = DESKTOP.matches ? (hidden ? DESKTOP_SHOW : DESKTOP_HIDE) : PHONE_STEP;
      if (Math.abs(d) < limit) return;
      html.classList.toggle('site-header-hidden', !hidden);
      fromY = y;
    }

    window.addEventListener('scroll', function () {
      if (!queued) { queued = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    root.addEventListener('focusin', function () {
      if (keyboardFocusIn(root)) html.classList.remove('site-header-hidden');
    });
    update(); // страницу могли открыть уже прокрученной
  }

  // Фокус с клавиатуры (а не после нажатия пальцем) где-то внутри шапки
  function keyboardFocusIn(root) {
    try { return !!root.querySelector(':focus-visible'); } catch (e) { return false; }
  }

  function init() {
    document.querySelectorAll('[data-site-header]').forEach(function (root) {
      if (root.__siteAutoHideDone) return;
      root.__siteAutoHideDone = true;
      initAutoHide(root);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
