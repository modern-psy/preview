/* ============================================================================
   СКРИПТЫ ЛЕНДИНГА «МЕЖДУ СЕССИЙ»
   ============================================================================

   1. Мобильное меню — бургер в шапке, затемнение фона, закрытие по Esc
      и по клику на ссылку.
   2. Галерея — бесконечная лента, очень медленно едет влево. Лента
      дублируется скриптом, движение через transform, останавливается,
      когда вкладка не видна, и не запускается при prefers-reduced-motion.
   3. FAQ — <details> раскрывается с анимацией высоты (ease-in).
   4. Кто ведёт встречи — тап по карточке показывает биографию.

   Всё инициализируется один раз на DOMContentLoaded. Хуки — атрибуты data-js.
   ============================================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
     2. ГАЛЕРЕЯ — бесконечная лента
     Скорость в пикселях в секунду; «очень медленно» — 18px/с.
     ------------------------------------------------------------------------- */
  function initMarquee() {
    var track = document.querySelector("[data-js='marquee']");
    if (!track) return;

    var set = track.firstElementChild;
    if (!set) return;

    // Копия ленты — чтобы после первой сразу шла вторая
    var clone = set.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("img").forEach(function (img) { img.alt = ""; });
    track.appendChild(clone);

    if (reduceMotion) return;

    var SPEED = 18;              // px в секунду
    var offset = 0;
    var last = null;
    var rafId = null;
    var setWidth = 0;

    function measure() {
      setWidth = set.getBoundingClientRect().width;
    }

    function frame(now) {
      if (last === null) last = now;
      var dt = Math.min(now - last, 100) / 1000;   // защита от долгих пауз
      last = now;

      offset += SPEED * dt;
      if (setWidth > 0 && offset >= setWidth) offset -= setWidth;

      track.style.transform = "translate3d(" + (-offset) + "px, 0, 0)";
      rafId = requestAnimationFrame(frame);
    }

    function start() {
      if (rafId !== null) return;
      last = null;
      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      if (rafId === null) return;
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);

    document.addEventListener("visibilitychange", function () {
      document.hidden ? stop() : start();
    });

    // Не крутим, пока лента далеко за экраном
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { rootMargin: "200px 0px" }).observe(track);
    } else {
      start();
    }
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
     4. КТО ВЕДЁТ ВСТРЕЧИ — тап на карточке открывает и закрывает досье
     (на десктопе то же делает наведение, чисто через CSS)
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
  }

  function init() {
    initMenu();
    initMarquee();
    initFaq();
    initExperts();
  }

  // В Тильде скрипт вставляется после разметки, DOMContentLoaded мог уже пройти
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
