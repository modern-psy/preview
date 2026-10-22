/* ============================================================================
   СКРИПТЫ ЛЕНДИНГА «МЕЖДУ СЕССИЙ»
   ============================================================================

   0. Шапка — при прокрутке сжимается в компактную таблетку (.is-scrolled).
   1. Мобильное меню — бургер в шапке, затемнение фона, закрытие по Esc
      и по клику на ссылку.
   2. Галерея убрана 22.10.2026: её место занял блок «Что вас ждёт внутри клуба».
   3. FAQ — <details> раскрывается с анимацией высоты (ease-in).
   4. Ведущие клуба — тап по карточке показывает биографию, стрелки листают
      ленту на ширину видимых карточек.
   5. Мостик после трудностей — строки проявляются по очереди, когда блок
      наполовину в экране. При prefers-reduced-motion текст виден сразу.
   6. Кому будет полезно — кнопки «кто вы» переключают сцену и текст.
   7. Пример расписания — вкладки «Неделя 1–4» переключают неделю.

   Всё инициализируется один раз на DOMContentLoaded. Хуки — атрибуты data-js.
   ============================================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -------------------------------------------------------------------------
     0. ШАПКА
     Как только страницу прокрутили больше чем на 24px, шапка получает
     .is-scrolled и сжимается в белую таблетку (page.css, раздел 4).
     Класс меняется только при переходе через порог, остальное — проверка
     одного числа, прокрутку это не нагружает.
     ------------------------------------------------------------------------- */
  function initHeader() {
    var header = document.querySelector("[data-js='header']");
    if (!header) return;

    var scrolled = null;
    function update() {
      var next = window.scrollY > 24;
      if (next === scrolled) return;
      scrolled = next;
      header.classList.toggle("is-scrolled", next);
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* -------------------------------------------------------------------------
     1. МОБИЛЬНОЕ МЕНЮ
     ------------------------------------------------------------------------- */
  function initMenu() {
    var toggle = document.querySelector("[data-js='menu-toggle']");
    var nav = document.getElementById("site-nav");
    var backdrop = document.querySelector("[data-js='menu-backdrop']");
    if (!toggle || !nav || !backdrop) return;

    var desktop = window.matchMedia("(min-width: 62rem)");

    function open() {
      backdrop.hidden = false;
      // Кадр спустя — чтобы сработал transition opacity
      requestAnimationFrame(function () {
        nav.classList.add("is-open");
        backdrop.classList.add("is-open");
      });
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Закрыть меню");
      document.body.classList.add("is-menu-open");
    }

    function close() {
      nav.classList.remove("is-open");
      backdrop.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Открыть меню");
      document.body.classList.remove("is-menu-open");
      window.setTimeout(function () {
        if (!nav.classList.contains("is-open")) backdrop.hidden = true;
      }, 240);
    }

    function isOpen() {
      return toggle.getAttribute("aria-expanded") === "true";
    }

    toggle.addEventListener("click", function () {
      isOpen() ? close() : open();
    });

    backdrop.addEventListener("click", close);

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a") && !desktop.matches) close();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) {
        close();
        toggle.focus();
      }
    });

    // Перешли на десктоп с открытым меню — просто закрываем
    desktop.addEventListener("change", function (event) {
      if (event.matches && isOpen()) close();
    });
  }

  /* -------------------------------------------------------------------------
     3. FAQ — анимация раскрытия
     <details> открывается мгновенно, поэтому высоту анимируем вручную:
     на открытии ставим open и растим высоту от вопроса до полной,
     на закрытии сначала сжимаем, потом снимаем open.
     ------------------------------------------------------------------------- */
  function initFaq() {
    var list = document.querySelector("[data-js='faq']");
    if (!list) return;

    var DURATION = 260;
    var EASING = "ease-in";

    list.querySelectorAll("details").forEach(function (item) {
      var summary = item.querySelector("summary");
      if (!summary) return;

      var animation = null;

      function animate(from, to, opening) {
        if (animation) animation.cancel();
        item.style.overflow = "hidden";
        animation = item.animate(
          { height: [from + "px", to + "px"] },
          { duration: DURATION, easing: EASING }
        );
        animation.onfinish = function () {
          item.open = opening;
          item.style.height = "";
          item.style.overflow = "";
          item.classList.remove("is-opening", "is-closing");
          animation = null;
        };
        animation.oncancel = function () {
          item.style.height = "";
          item.style.overflow = "";
          item.classList.remove("is-opening", "is-closing");
          animation = null;
        };
      }

      summary.addEventListener("click", function (event) {
        event.preventDefault();

        if (reduceMotion) {
          item.open = !item.open;
          return;
        }

        var startHeight = item.getBoundingClientRect().height;

        if (item.open && !item.classList.contains("is-opening")) {
          // Закрываем: до высоты одного вопроса
          item.classList.add("is-closing");
          animate(startHeight, summary.getBoundingClientRect().height, false);
        } else {
          // Открываем: сначала показываем содержимое, потом анимируем высоту
          item.classList.add("is-opening");
          item.style.height = startHeight + "px";
          item.open = true;
          var endHeight = summary.getBoundingClientRect().height +
            item.querySelector(".faq_answer").getBoundingClientRect().height;
          animate(startHeight, endHeight, true);
        }
      });
    });
  }

  /* ---------------------------------------------------------------------------
     4. ВЕДУЩИЕ КЛУБА
     Тап на карточке открывает и закрывает био (на десктопе то же делает
     наведение, чисто через CSS).
     Стрелки листают ленту на столько карточек, сколько видно целиком.
     Ленте некуда листать (широкий экран) — стрелки остаются скрытыми.
     Крайнее положение — соответствующая стрелка неактивна.
     --------------------------------------------------------------------------- */
  function initExperts() {
    var wrap = document.querySelector("[data-js='experts-cards']");
    if (!wrap) return;

    wrap.addEventListener("click", function (event) {
      var card = event.target.closest(".experts_card");
      if (!card) return;
      var open = card.classList.contains("is-open");
      wrap.querySelectorAll(".experts_card.is-open").forEach(function (c) {
        c.classList.remove("is-open");
      });
      if (!open) card.classList.add("is-open");
    });

    wrap.addEventListener("keydown", function (event) {
      var card = event.target.closest(".experts_card");
      if (!card) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.classList.toggle("is-open");
      }
      if (event.key === "Escape") card.classList.remove("is-open");
    });

    var prev = document.querySelector("[data-js='experts-prev']");
    var next = document.querySelector("[data-js='experts-next']");
    var card = wrap.querySelector(".experts_card");
    if (!prev || !next || !card) return;
    var nav = prev.parentElement;

    // Шаг — столько карточек (с промежутками), сколько помещается между полями
    function step() {
      var style = getComputedStyle(wrap);
      var gap = parseFloat(style.columnGap) || 0;
      var one = card.getBoundingClientRect().width + gap;
      var visible = wrap.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) + gap;
      return Math.max(1, Math.floor(visible / one)) * one;
    }

    function update() {
      var max = wrap.scrollWidth - wrap.clientWidth;
      nav.hidden = max < 2;
      prev.disabled = wrap.scrollLeft < 2;
      next.disabled = wrap.scrollLeft > max - 2;
    }

    function go(direction) {
      wrap.scrollBy({ left: direction * step(), behavior: reduceMotion ? "auto" : "smooth" });
    }

    prev.addEventListener("click", function () { go(-1); });
    next.addEventListener("click", function () { go(1); });
    wrap.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* -------------------------------------------------------------------------
     5. МОСТИК
     Сначала прячем строки (.is-armed), потом показываем (.is-visible), когда
     блок наполовину в экране. Задержки между строками — в page.css, раздел 5a.
     Нет IntersectionObserver или включено «уменьшить движение» — ничего не
     прячем, текст просто виден.
     ------------------------------------------------------------------------- */
  function initBridge() {
    var block = document.querySelector("[data-js='bridge']");
    if (!block || reduceMotion || !("IntersectionObserver" in window)) return;

    block.classList.add("is-armed");
    var observer = new IntersectionObserver(function (entries) {
      var seen = entries.some(function (entry) { return entry.isIntersecting; });
      if (!seen) return;
      block.classList.add("is-visible");
      observer.disconnect();
    }, { threshold: 0.5, rootMargin: "0px 0px -10% 0px" });
    observer.observe(block);
  }

  /* -------------------------------------------------------------------------
     6. КОМУ БУДЕТ ПОЛЕЗНО
     Кнопки, сцены и панели идут в одном порядке: n-я кнопка показывает
     n-ю картинку и n-ю панель. Класс .is-enhanced прячет остальные панели
     и показывает кнопки (page.css, раздел 9).
     ------------------------------------------------------------------------- */
  function initAudience() {
    var root = document.querySelector("[data-js='audience']");
    if (!root) return;

    var buttons = root.querySelectorAll("[data-js='audience-pick']");
    var images = root.querySelectorAll(".audience_pic img");
    var panels = root.querySelectorAll(".audience_panel");
    if (!buttons.length || buttons.length !== panels.length) return;

    function select(index) {
      buttons.forEach(function (button, i) {
        button.classList.toggle("is-active", i === index);
        button.setAttribute("aria-pressed", i === index ? "true" : "false");
      });
      images.forEach(function (image, i) { image.classList.toggle("is-active", i === index); });
      panels.forEach(function (panel, i) { panel.classList.toggle("is-active", i === index); });
    }

    buttons.forEach(function (button, i) {
      button.addEventListener("click", function () { select(i); });
    });

    root.classList.add("is-enhanced");
    select(0);
  }

  /* -------------------------------------------------------------------------
     7. ПРИМЕР РАСПИСАНИЯ
     Вкладки и недели идут в одном порядке: n-я вкладка показывает n-ю неделю.
     Сначала открыта вкладка, у которой в разметке aria-selected="true".
     Стрелки влево/вправо, Home и End переходят между вкладками.
     На телефоне вкладки — лента: выбранную подкручиваем, чтобы была видна
     целиком. Класс .is-enhanced прячет заголовки недель (page.css, раздел 10).
     ------------------------------------------------------------------------- */
  function initWeek() {
    var root = document.querySelector("[data-js='week']");
    if (!root) return;

    var list = root.querySelector("[role='tablist']");
    var tabs = root.querySelectorAll("[role='tab']");
    var panels = root.querySelectorAll("[role='tabpanel']");
    if (!list || !tabs.length || tabs.length !== panels.length) return;

    // Прокрутить ленту вкладок так, чтобы выбранная была видна целиком
    function reveal(tab, smooth) {
      if (list.scrollWidth <= list.clientWidth) return;
      var box = list.getBoundingClientRect();
      var rect = tab.getBoundingClientRect();
      var pad = parseFloat(getComputedStyle(list).paddingLeft) || 0;
      var shift = 0;
      if (rect.left < box.left + pad) shift = rect.left - box.left - pad;
      if (rect.right > box.right - pad) shift = rect.right - box.right + pad;
      if (shift) list.scrollBy({ left: shift, behavior: smooth && !reduceMotion ? "smooth" : "auto" });
    }

    function select(index, focus, smooth) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
      if (focus) tabs[index].focus({ preventScroll: true });
      reveal(tabs[index], smooth);
    }

    var current = 0;
    tabs.forEach(function (tab, i) {
      if (tab.getAttribute("aria-selected") === "true") current = i;
      tab.addEventListener("click", function () { current = i; select(i, false, true); });
    });

    list.addEventListener("keydown", function (event) {
      var next = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      current = (next + tabs.length) % tabs.length;
      select(current, true, true);
    });

    root.classList.add("is-enhanced");
    list.hidden = false;
    select(current, false, false);
  }

  function init() {
    initHeader();
    initMenu();
    initFaq();
    initExperts();
    initBridge();
    initAudience();
    initWeek();
  }

  // В Тильде скрипт вставляется после разметки, DOMContentLoaded мог уже пройти
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
