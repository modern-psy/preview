/* ============================================================================
   ПОВЕДЕНИЕ СТРАНИЦЫ «БИЗНЕС-ИГРА ДЛЯ ПСИХОЛОГОВ»
   ============================================================================

   Здесь:
     1) меню в шапке на узких экранах (перенесено с /cft-spiderman);
     6–8) игровое поле: курсоры участников, ходы фишки и кошелёк;
     9–11) игровые экраны: смена экранов на десктопе, сборка из гнёзд,
          карта хода.
   Описание каждой части — перед её кодом.

   Запись на игру — в отдельном файле lead-form.js: это стандартная
   лид-форма Академии (копия web-academy/shared/academy/lead-form.js).
   ========================================================================== */

(() => {
  "use strict";

  const page = document.querySelector(".game-page");
  if (!page) return;

  /* --------------------------------------------------------------------------
     1. МЕНЮ В ШАПКЕ
     --------------------------------------------------------------------------
     На узких экранах разделы страницы спрятаны под кнопку с тремя полосками.
     Закрывается по выбору пункта, по клику мимо и по Esc.
     -------------------------------------------------------------------------- */

  const menuToggle = document.querySelector("[data-menu-toggle]");
  const menu = menuToggle && document.getElementById(menuToggle.getAttribute("aria-controls"));

  if (menuToggle && menu) {
    const setMenu = (isOpen) => {
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menu.hidden = !isOpen;
    };

    menuToggle.addEventListener("click", () => {
      setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("click", (event) => {
      if (menu.hidden) return;
      if (event.target.closest(".site-header_component")) return;
      setMenu(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || menu.hidden) return;
      setMenu(false);
      menuToggle.focus();
    });
  }
})();


/* ============================================================================
   6–8. ИГРОВОЕ ПОЛЕ: КУРСОРЫ УЧАСТНИКОВ, ХОДЫ ФИШКИ
   ============================================================================

   6. Движение. Если движение не выключено в настройках системы, странице
      ставится класс has-motion: фишка на первом экране подпрыгивает.
      Появление блоков — сборка из гнёзд, разделы 9–11 ниже.

   7. Курсоры. Пять игроков с ролями и ведущая летают по странице.
      У каждого блока в атрибуте data-cursor записано, где курсорам стоять:
        data-cursor="analyst 0.17 0.13; keeper 0.67 0.14"
      роль, доля ширины и доля высоты блока (0 — левый/верхний край,
      1 — правый/нижний). На телефоне и планшете действует
      data-cursor-compact, если он есть. Атрибут data-cursor-spot ставит
      курсор относительно самого элемента — так «Вы» держит фишку.
      В блоке без мест курсоры гаснут. Когда блок сменился, курсор плавно
      перелетает к новому месту; если лететь далеко — гаснет и появляется
      уже рядом.

   8. Ходы фишки. В блоке «Как пройдёт игра» активный этап — тот, что
      пересекает середину экрана. Фишка прыгает на его клетку, кошелёк
      показывает число из data-wallet-* этапа, а в стопке остаётся столько
      монет, сколько указано в data-wallet-coins: лишние монеты с верха
      стопки улетают на клетку этапа. При прокрутке назад монеты
      возвращаются в стопку.

   При «уменьшить движение» в настройках системы курсоры стоят на местах
   без полёта и покачивания, фишка переставляется без прыжка.
   ========================================================================== */

(() => {
  "use strict";

  const page = document.querySelector(".game-page");
  if (!page || page.dataset.gameMotion === "ready") return;
  page.dataset.gameMotion = "ready";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compactLayout = window.matchMedia("(max-width: 64rem)");
  const prefersMotion = () => !reducedMotion.matches;

  /* --------------------------------------------------------------------------
     6. ДВИЖЕНИЕ
     -------------------------------------------------------------------------- */

  if (prefersMotion()) page.classList.add("has-motion");


  /* --------------------------------------------------------------------------
     7. КУРСОРЫ УЧАСТНИКОВ
     -------------------------------------------------------------------------- */

  const layer = page.querySelector("[data-cursors]");

  const parseSpots = (value) =>
    String(value || "")
      .split(";")
      .map((chunk) => chunk.trim().split(/\s+/))
      .filter((parts) => parts.length === 3)
      .map(([role, fx, fy]) => ({ role, fx: Number(fx), fy: Number(fy) }));

  if (layer) {
    const cursors = [...layer.querySelectorAll("[data-cursor-role]")].map((el, index) => ({
      el,
      role: el.dataset.cursorRole,
      x: -200,
      y: -200,
      visible: false,
      teleportAt: 0,
      seed: index * 1.7,
      nextPress: 0,
    }));

    // Блоки страницы: в каждом свой набор мест для курсоров
    const sections = [...page.querySelectorAll("main > section, footer")];

    const spotsIn = (section) => {
      const compact = compactLayout.matches;
      const result = [];

      section.querySelectorAll("[data-cursor]").forEach((host) => {
        const value = compact && host.hasAttribute("data-cursor-compact")
          ? host.dataset.cursorCompact
          : host.dataset.cursor;
        parseSpots(value).forEach((spot) => result.push({ ...spot, host }));
      });

      section.querySelectorAll("[data-cursor-spot]").forEach((host) => {
        const value = compact && host.hasAttribute("data-cursor-spot-compact")
          ? host.dataset.cursorSpotCompact
          : host.dataset.cursorSpot;
        parseSpots(value).forEach((spot) => result.push({ ...spot, host }));
      });

      return result;
    };

    // Активный блок — тот, что пересекает середину экрана
    const activeSection = () => {
      const middle = window.innerHeight * 0.5;
      return sections.find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= middle && rect.bottom >= middle;
      }) || null;
    };

    let lastScrollY = window.scrollY;
    let frame = 0;
    let lastTime = 0;
    let idleSince = 0;

    const show = (cursor, isVisible) => {
      if (cursor.visible === isVisible) return;
      cursor.visible = isVisible;
      cursor.el.classList.toggle("is-visible", isVisible);
    };

    const press = (cursor) => {
      if (!cursor.visible || !prefersMotion()) return;
      cursor.el.classList.add("is-pressing");
      window.setTimeout(() => cursor.el.classList.remove("is-pressing"), 180);
    };

    const tick = (time) => {
      frame = 0;
      const dt = lastTime ? Math.min(time - lastTime, 64) : 16;
      lastTime = time;

      // Содержимое страницы уехало при прокрутке — курсоры едут вместе с ним
      const scrollDelta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;

      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight;
      const section = activeSection();
      const spots = section ? spotsIn(section) : [];
      const motion = prefersMotion();
      const ease = motion ? 1 - Math.pow(1 - 0.1, dt / 16.7) : 1;
      let anyVisible = false;

      cursors.forEach((cursor) => {
        cursor.y -= scrollDelta;

        const spot = spots.find((item) => item.role === cursor.role);
        const rect = spot?.host.getBoundingClientRect();
        const hostVisible = rect && rect.width > 0 && rect.height > 0;
        const targetX = hostVisible ? rect.left + rect.width * spot.fx : null;
        const targetY = hostVisible ? rect.top + rect.height * spot.fy : null;
        const onScreen = hostVisible && targetY > 8 && targetY < viewportHeight - 28;

        if (!onScreen) {
          show(cursor, false);
          return;
        }

        // Первый выход или далёкий перелёт: гаснем и появляемся рядом с местом
        const distance = Math.hypot(targetX - cursor.x, targetY - cursor.y);
        if (!cursor.visible && !cursor.teleportAt) {
          cursor.x = targetX - 36;
          cursor.y = targetY + 44;
        } else if (cursor.visible && distance > viewportHeight * 0.75) {
          show(cursor, false);
          cursor.teleportAt = time + 320;
        }

        if (cursor.teleportAt) {
          if (time < cursor.teleportAt) {
            anyVisible = true;
            return;
          }
          cursor.teleportAt = 0;
          cursor.x = targetX - 36;
          cursor.y = targetY + 44;
        }

        cursor.x += (targetX - cursor.x) * ease;
        cursor.y += (targetY - cursor.y) * ease;
        show(cursor, true);
        anyVisible = true;

        // Лёгкое покачивание, как у живой руки на мышке
        const wobbleX = motion ? Math.sin(time / 1700 + cursor.seed) * 5 : 0;
        const wobbleY = motion ? Math.cos(time / 2300 + cursor.seed * 1.3) * 4 : 0;
        const width = cursor.el.offsetWidth || 120;
        const x = Math.max(4, Math.min(cursor.x + wobbleX, viewportWidth - width - 6));
        const y = cursor.y + wobbleY;
        cursor.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;

        // Время от времени игрок «кликает»
        if (motion && distance < 4) {
          if (!cursor.nextPress) cursor.nextPress = time + 2500 + Math.random() * 5000;
          if (time > cursor.nextPress) {
            press(cursor);
            cursor.nextPress = time + 4000 + Math.random() * 6000;
          }
        }
      });

      // Если на экране никого нет больше секунды — засыпаем до прокрутки
      if (anyVisible) idleSince = 0;
      else if (!idleSince) idleSince = time;

      if (anyVisible || time - idleSince < 1000) schedule();
    };

    const schedule = () => {
      if (frame || document.hidden) return;
      frame = window.requestAnimationFrame(tick);
    };

    const wake = () => {
      idleSince = 0;
      schedule();
    };

    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    document.addEventListener("visibilitychange", () => {
      lastTime = 0;
      lastScrollY = window.scrollY;
      wake();
    });
    compactLayout.addEventListener?.("change", wake);

    // «Аналитик» нажимает на фишку перед каждым её прыжком на первом экране
    const heroPawn = page.querySelector(".board_pawn");
    const analyst = cursors.find((cursor) => cursor.role === "analyst");
    if (heroPawn && analyst) {
      const syncPress = () => window.setTimeout(() => press(analyst), 5500);
      heroPawn.addEventListener("animationstart", syncPress);
      heroPawn.addEventListener("animationiteration", syncPress);
    }

    wake();
  }


  /* --------------------------------------------------------------------------
     8. ХОДЫ ФИШКИ И КОШЕЛЁК
     -------------------------------------------------------------------------- */

  const route = page.querySelector("[data-route]");

  if (route) {
    const steps = [...route.querySelectorAll("[data-route-step]")];
    const tiles = new Map(
      [...route.querySelectorAll("[data-route-tile]")].map((tile) => [Number(tile.dataset.routeTile), tile])
    );
    const tilesBox = route.querySelector("[data-route-tiles]");
    const pawn = route.querySelector("[data-route-pawn]");
    const walletValue = route.querySelector("[data-wallet-value]");
    const walletLabel = route.querySelector("[data-wallet-label]");
    const walletNote = route.querySelector("[data-wallet-note]");
    const stackCoins = [...route.querySelectorAll(".route_stack-coin")];

    let active = 0;
    let pawnPoint = null;
    let counter = 0;
    let coinsShown = stackCoins.length;

    // Точка на клетке, куда встаёт фишка: правый верхний угол.
    // У SVG нет offsetWidth, поэтому размер фишки берём из getBoundingClientRect
    const pointFor = (number) => {
      const tile = tiles.get(number);
      if (!tile || !pawn) return null;
      const size = pawn.getBoundingClientRect();
      return {
        x: tile.offsetLeft + tile.offsetWidth - size.width * 0.95,
        y: tile.offsetTop - size.height * 0.5,
      };
    };

    const placePawn = (number, animate) => {
      const point = pointFor(number);
      if (!point) return;

      const to = `${point.x.toFixed(1)}px ${point.y.toFixed(1)}px`;

      if (animate && pawnPoint && prefersMotion() && typeof pawn.animate === "function") {
        const from = `${pawnPoint.x.toFixed(1)}px ${pawnPoint.y.toFixed(1)}px`;
        const lift = Math.min(pawnPoint.y, point.y) - pawn.getBoundingClientRect().height * 0.6;
        const middle = `${((pawnPoint.x + point.x) / 2).toFixed(1)}px ${lift.toFixed(1)}px`;
        pawn.animate(
          [{ translate: from }, { translate: middle, offset: 0.45 }, { translate: to }],
          { duration: 560, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
      }

      pawn.style.translate = to;
      pawnPoint = point;
    };

    // Число в кошельке плавно пересчитывается
    const countTo = (from, to) => {
      window.cancelAnimationFrame(counter);
      if (!prefersMotion()) {
        walletValue.textContent = String(to);
        return;
      }
      const start = performance.now();
      const run = (now) => {
        const progress = Math.min((now - start) / 600, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        walletValue.textContent = String(Math.round(from + (to - from) * eased));
        if (progress < 1) counter = window.requestAnimationFrame(run);
      };
      counter = window.requestAnimationFrame(run);
    };

    // Монеты с верха стопки летят дугой на клетку этапа. Летят копии,
    // а сами монеты в стопке в этот же момент прячутся. Копии живут внутри
    // прилипающего поля и уезжают вместе с ним, если страницу быстро
    // проматывают (например, переход по ссылке из меню).
    const board = route.querySelector(".route_board");

    const flyFromStack = (coins, number) => {
      const tile = tiles.get(number);
      if (!tile || !board || !prefersMotion()) return;

      const boardRect = board.getBoundingClientRect();
      const to = tile.getBoundingClientRect();
      // Поле не на экране — лететь некому смотреть
      if (to.width === 0 || to.bottom < 0 || to.top > window.innerHeight) return;

      coins.forEach((source, index) => {
        const from = source.getBoundingClientRect();
        if (from.width === 0 || typeof source.animate !== "function") return;

        const coin = source.cloneNode(true);
        coin.removeAttribute("style");
        coin.setAttribute("class", "route_flying-coin");
        coin.setAttribute("aria-hidden", "true");
        coin.style.width = `${from.width}px`;
        board.appendChild(coin);

        // Координаты считаем от левого верхнего угла поля
        const startX = from.left - boardRect.left;
        const startY = from.top - boardRect.top;
        const endX = to.left - boardRect.left + to.width * (0.3 + (index % 3) * 0.2) - from.width / 2;
        const endY = to.top - boardRect.top + to.height * 0.35;
        const peakX = (startX + endX) / 2;
        const peakY = Math.min(startY, endY) - 70 - index * 14;

        const animation = coin.animate(
          [
            { transform: `translate(${startX}px, ${startY}px) rotate(0deg)`, opacity: 1 },
            { transform: `translate(${peakX}px, ${peakY}px) rotate(-14deg)`, opacity: 1, offset: 0.5 },
            { transform: `translate(${endX}px, ${endY}px) rotate(0deg) scale(0.55)`, opacity: 0 },
          ],
          { duration: 820, delay: index * 120, easing: "cubic-bezier(0.33, 0, 0.2, 1)", fill: "both" }
        );
        animation.addEventListener("finish", () => coin.remove(), { once: true });
        animation.addEventListener("cancel", () => coin.remove(), { once: true });
      });
    };

    // Сколько монет видно в стопке
    const setStack = (count, number, animate) => {
      const target = Math.max(0, Math.min(stackCoins.length, Number.isFinite(count) ? count : coinsShown));
      if (target === coinsShown) return;

      if (target < coinsShown) {
        // Уходят верхние монеты: сначала самая верхняя
        const leaving = stackCoins.slice(target, coinsShown).reverse();
        if (animate) flyFromStack(leaving, number);
        leaving.forEach((coin) => coin.classList.add("is-gone", "is-instant"));
      } else {
        // Монеты возвращаются и мягко падают на стопку снизу вверх
        stackCoins.slice(coinsShown, target).forEach((coin, index) => {
          coin.classList.remove("is-instant");
          coin.style.transitionDelay = `${index * 80}ms`;
          coin.getBoundingClientRect();
          coin.classList.remove("is-gone");
        });
      }

      coinsShown = target;
    };

    const setActive = (number, animate = true) => {
      if (number === active) return;
      const previous = active;
      active = number;

      steps.forEach((step) => {
        const stepNumber = Number(step.dataset.routeStep);
        step.dataset.state = stepNumber < number ? "passed" : stepNumber === number ? "active" : "upcoming";
      });
      tiles.forEach((tile, tileNumber) => {
        tile.dataset.state = tileNumber < number ? "passed" : tileNumber === number ? "active" : "upcoming";
      });

      placePawn(number, animate);

      const step = steps.find((item) => Number(item.dataset.routeStep) === number);
      if (!step || !walletValue) return;

      const oldValue = Number(walletValue.textContent);
      const newRaw = step.dataset.walletValue || "";
      const newValue = Number(newRaw);

      if (Number.isFinite(oldValue) && Number.isFinite(newValue) && newRaw !== "") {
        countTo(oldValue, newValue);
      } else {
        walletValue.textContent = newRaw;
      }

      if (walletLabel) walletLabel.textContent = step.dataset.walletLabel || "";
      if (walletNote) walletNote.textContent = step.dataset.walletNote || "";

      // Монеты улетают, только когда идём вперёд по этапам
      setStack(Number(step.dataset.walletCoins), number, animate && number > previous && previous > 0);
    };

    // Этап, который пересекает середину экрана, становится активным
    if ("IntersectionObserver" in window) {
      const stepObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(Number(entry.target.dataset.routeStep));
        });
      }, { rootMargin: "-50% 0px -50% 0px", threshold: 0 });

      steps.forEach((step) => stepObserver.observe(step));
    }

    // Клетки меняют размер — фишка остаётся на своей клетке
    if ("ResizeObserver" in window && tilesBox) {
      new ResizeObserver(() => {
        if (active) {
          pawnPoint = null;
          placePawn(active, false);
        }
      }).observe(tilesBox);
    }

    setActive(1, false);
  }
})();


/* ============================================================================
   9–11. ИГРОВЫЕ ЭКРАНЫ
   ============================================================================
   Стили — page.css, раздел 16.

   Десктоп (от 1025px, мышь или тачпад):
   1. Страница не прокручивается. Каждый блок — экран во всё окно.
      Колесо, тачпад, стрелки, PageUp/PageDown, пробел, Home/End и ссылки
      на блоки сменяют экраны. Один жест — один экран.
   2. Смена экрана: клетки уходящего экрана опускаются и гаснут, новый
      экран проявляется, на нём проступают гнёзда — углубления на месте
      будущих клеток, — и клетки по очереди поднимаются из них с лёгким
      перелётом. Заголовок и текст выезжают по направлению хода.
   3. «Как пройдёт игра» — шесть ходов внутри одного экрана: колесо
      меняет карточку этапа, фишка переходит на следующую клетку, монеты
      улетают (это делает раздел 8 выше: он видит, что посередине окна
      теперь другая карточка). Седьмой ход — клетка с кнопкой, восьмой
      открывает следующий экран.
   4. Если блок не помещается в окно, сначала он слегка уменьшается
      (не меньше чем до 85%), а если и так не влез — колесо прокручивает
      его внутри и только у края переключает экран.
   5. Карта хода справа: клетка на экран, фишка прыгает по ним,
      рядом на секунду появляется название экрана. Клетки — ссылки.
   6. Адрес страницы запоминает экран (#zapros, #format…), после
      перезагрузки откроется он же.

   Телефон и планшет: страница прокручивается как обычно, а блоки
   собираются из гнёзд, когда выходят на экран (один раз).

   Что собирать на каждом экране — в списке SCREENS ниже.
   При «уменьшить движение» в настройках системы экраны меняются
   без анимации, всё видно сразу. Без скрипта страница обычная.
   ========================================================================== */

(() => {
  "use strict";

  const root = document.documentElement;
  const page = document.querySelector(".game-page");
  if (!page || page.dataset.gameScreens === "ready") return;
  page.dataset.gameScreens = "ready";

  root.classList.add("is-game-screens");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const motion =
    !reducedMotion.matches &&
    "IntersectionObserver" in window &&
    typeof Element.prototype.animate === "function";

  if (motion) root.classList.add("is-game-motion");

  // Режим экранов: десктоп с мышью или тачпадом
  const screenQuery = window.matchMedia("(min-width: 64.0625rem) and (hover: hover) and (pointer: fine)");
  const header = page.querySelector(".site-header_component");
  const mainWrapper = page.querySelector(".main-wrapper");


  /* --------------------------------------------------------------------------
     9. СПИСОК ЭКРАНОВ
     --------------------------------------------------------------------------
     text        — заголовок и абзацы: выезжают по направлению хода
     tiles       — клетки, которые поднимаются из гнёзд
     screenTiles — то же на десктопе, если там другая раскладка
     inner       — содержимое большой клетки, появляется после неё
     order: "dom" — клетки встают в порядке разметки, а не по рядам
     extra       — игровые предметы: фишка, монеты
     -------------------------------------------------------------------------- */

  const SCREENS = [
    { id: "top", label: "Старт", tiles: ".board_stage", socketHost: ".board_component", order: "dom", step: 90, extra: "hero" },
    { id: "zapros", label: "Зачем играть", text: ".problem_intro .section_heading, .problem_text > p", tiles: ".problem_card, .problem_finale" },
    { id: "format", label: "Формат", tiles: ".rules_intro, .rules_coins, .rules_fact" },
    { id: "dlya-kogo", label: "Для кого", text: ".audience_intro > *", tiles: ".audience_card, .audience_note" },
    {
      id: "etapy",
      label: "Этапы игры",
      text: ".route_heading",
      tiles: ".route_board, #etap-1, #etap-2",
      screenTiles: ".route_tile, .route_wallet, .route_list > .is-sub-current",
      screenOrder: "dom",
      step: 70,
      extra: "route",
    },
    { id: "navyki", label: "Навыки", text: ".skills_intro > *", tiles: ".skills_sheet", inner: ".skills_item" },
    { id: "vedushchaya", label: "Ведущая", text: ".host_heading", tiles: ".host_media, .host_copy" },
    { id: "registraciya", label: "Регистрация", tiles: ".lead-form_component", inner: "[data-lead-content]" },
    // Подвал — последний экран, на карте хода своей клетки у него нет
    { element: ".site-footer_component", label: "Контакты", inHud: false, text: ".site-footer_heading, .site-footer_grid > *" },
  ];

  // Длительности и шаги, мс
  const TEXT_DURATION = 520;
  const TEXT_STEP = 70;
  const RISE_DURATION = 560;
  const TILE_STEP = 80;
  const SOCKET_FADE = 200;
  const SCREEN_LOCK = 650;
  const STEP_LOCK = 420;
  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

  // Текст выезжает по направлению хода: вперёд — снизу, назад — сверху
  const textFrames = (direction) => [
    { opacity: 0, transform: `translateY(${direction < 0 ? "-1rem" : "1rem"})` },
    { opacity: 1, transform: "none" },
  ];

  // Клетка поднимается из гнезда: чуть ниже и меньше, лёгкий перелёт вверх
  const RISE_FRAMES = [
    { opacity: 0, transform: "translateY(0.875rem) scale(0.94)" },
    { opacity: 1, transform: "translateY(-0.25rem) scale(1.01)", offset: 0.62 },
    { opacity: 1, transform: "none" },
  ];

  // Клетка уходящего экрана опускается и гаснет
  const sinkFrames = (direction) => [
    { opacity: 1, transform: "none" },
    { opacity: 0, transform: `translateY(${direction < 0 ? "0.75rem" : "-0.75rem"}) scale(0.97)` },
  ];

  // Маленькая клетка «выщёлкивается» (телефон, поле маршрута)
  const POP_FRAMES = [
    { opacity: 0, transform: "scale(0.6)" },
    { opacity: 1, transform: "scale(1.06)", offset: 0.6 },
    { opacity: 1, transform: "none" },
  ];

  // Фишка падает в клетку и пару раз подпрыгивает
  const DROP_FRAMES = [
    { opacity: 0, transform: "translateY(-2.5rem)" },
    { opacity: 1, transform: "translateY(0)", offset: 0.5 },
    { transform: "translateY(-0.5rem)", offset: 0.72 },
    { transform: "translateY(0)", offset: 0.88 },
    { transform: "translateY(-0.125rem)", offset: 0.94 },
    { transform: "none" },
  ];

  // Монета падает на стопку
  const COIN_FRAMES = [
    { opacity: 0, transform: "translateY(-2.5rem)" },
    { opacity: 1, transform: "translateY(0.125rem)", offset: 0.8 },
    { opacity: 1, transform: "none" },
  ];

  const all = (scope, selector) => (selector ? [...scope.querySelectorAll(selector)] : []);
  const isShown = (element) => element.getClientRects().length > 0;
  const markBuilt = (elements) => elements.forEach((element) => element.classList.add("is-built"));

  const screens = SCREENS.map((config) => {
    const el = config.element ? page.querySelector(config.element) : document.getElementById(config.id);
    if (!el) return null;

    const screen = {
      ...config,
      el,
      inHud: config.inHud !== false,
      withHeader: config.id === "top" && Boolean(header),
      route: config.extra === "route",
      dark: config.id === "top" || el.classList.contains("section-dark") || el.matches(".site-footer_component"),
      anims: new Set(),
      built: false,
    };

    // Пока экран ни разу не собирался, его клетки не видны (page.css, раздел 16.4)
    const extras = config.extra === "hero"
      ? ".board_pawn, .board_coins"
      : config.extra === "route" ? ".route_tile, .route_pawn, .route_stack-coin" : "";
    screen.marked = [config.text, config.tiles, config.inner, extras]
      .flatMap((selector) => all(el, selector));
    screen.marked.forEach((element) => element.setAttribute("data-game-piece", ""));

    return screen;
  }).filter(Boolean);

  const hudScreens = screens.filter((screen) => screen.inHud);
  const routeScreen = screens.find((screen) => screen.route);
  const routeItems = routeScreen ? all(routeScreen.el, ".route_list > li") : [];

  let screenMode = false;

  // Анимация, которую можно досрочно закончить или отменить при смене экрана.
  // Закончившиеся анимации тоже хранятся до ухода с экрана: затухание
  // держит экран прозрачным (fill: forwards), и при возврате на экран
  // его нужно снять — clearScreen отменяет всё разом
  const play = (screen, element, frames, options) => {
    const animation = element.animate(frames, options);
    screen.anims.add(animation);
    animation.addEventListener("cancel", () => screen.anims.delete(animation), { once: true });
    return animation;
  };


  /* --------------------------------------------------------------------------
     9.1. СБОРКА ЭКРАНА
     -------------------------------------------------------------------------- */

  // Слой с гнёздами — первым в своём контейнере, поэтому лежит под клетками.
  // На первом экране — внутри поля (над доской). На десктопе — в самом
  // экране, на телефоне — в начале main.
  const socketLayerFor = (screen) => {
    let host = screenMode ? screen.el : mainWrapper;
    if (screen.socketHost) host = screen.el.querySelector(screen.socketHost) || host;
    if (!host) return null;
    let layer = host.querySelector(":scope > .game-sockets");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "game-sockets";
      layer.setAttribute("aria-hidden", "true");
      host.prepend(layer);
    }
    return layer;
  };

  // Клетки встают в порядке чтения: по рядам сверху вниз, в ряду слева направо
  const inReadingOrder = (elements) =>
    elements
      .map((element) => ({ element, rect: element.getBoundingClientRect() }))
      .sort((a, b) =>
        Math.abs(a.rect.top - b.rect.top) > 24 ? a.rect.top - b.rect.top : a.rect.left - b.rect.left
      )
      .map((item) => item.element);

  const tilesOf = (screen) => {
    const selector = screenMode && screen.screenTiles ? screen.screenTiles : screen.tiles;
    const order = screenMode && screen.screenOrder ? screen.screenOrder : screen.order;
    const tiles = all(screen.el, selector).filter(isShown);
    return order === "dom" ? tiles : inReadingOrder(tiles);
  };

  // Подгонка под окно на десктопе: если экран чуть выше окна, его
  // содержимое уменьшается целиком, но не меньше чем до FIT_MIN.
  // Если и этого мало — экран можно докрутить внутри.
  const FIT_MIN = 0.85;
  const contentBox = (screen) => screen.el.querySelector(":scope > .padding-global");
  const zoomOf = (screen) => Number(contentBox(screen)?.style.zoom) || 1;

  const fit = (screen) => {
    const box = contentBox(screen);
    if (!box) return;
    box.style.zoom = "";
    if (!screenMode) return;
    const style = getComputedStyle(screen.el);
    const available = screen.el.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const needed = box.offsetHeight;
    if (needed > available + 1) box.style.zoom = Math.max(FIT_MIN, available / needed).toFixed(3);
  };

  const build = (screen, { direction = 1, start = 0 } = {}) => {
    markBuilt(screen.marked);
    if (!motion) return;

    const tiles = tilesOf(screen);
    const texts = all(screen.el, screen.text).filter(isShown);
    const inner = all(screen.el, screen.inner).filter(isShown);

    // Сначала меряем, где лежат клетки, — до того как они сдвинутся.
    // Если экран уменьшен, а слой гнёзд лежит внутри уменьшенной части
    // (первый экран), размеры пересчитываем обратно
    const layer = socketLayerFor(screen);
    const origin = layer?.getBoundingClientRect();
    const zoom = zoomOf(screen);
    const layerZoom = layer && contentBox(screen)?.contains(layer) ? zoom : 1;
    const sockets = tiles.map((tile) => {
      if (!layer) return null;
      const rect = tile.getBoundingClientRect();
      const radius = parseFloat(getComputedStyle(tile).borderTopLeftRadius) || 0;
      const socket = document.createElement("span");
      socket.className = screen.dark ? "game-socket is-dark" : "game-socket";
      socket.style.left = `${((rect.left - origin.left) / layerZoom).toFixed(1)}px`;
      socket.style.top = `${((rect.top - origin.top) / layerZoom).toFixed(1)}px`;
      socket.style.width = `${(rect.width / layerZoom).toFixed(1)}px`;
      socket.style.height = `${(rect.height / layerZoom).toFixed(1)}px`;
      socket.style.borderRadius = `${((radius * zoom) / layerZoom).toFixed(1)}px`;
      layer.appendChild(socket);
      return socket;
    });

    // 1. Гнёзда проступают все вместе — «пустое поле»
    sockets.forEach((socket) => {
      if (!socket) return;
      play(screen, socket, [{ opacity: 0 }, { opacity: 1 }], { duration: SOCKET_FADE, delay: start, easing: "ease-out", fill: "backwards" });
    });

    // 2. Заголовок и текст выезжают по направлению хода
    texts.forEach((element, index) => {
      play(screen, element, textFrames(direction), { duration: TEXT_DURATION, delay: start + index * TEXT_STEP, easing: EASE, fill: "backwards" });
    });

    // 3. Клетки по очереди поднимаются из гнёзд, гнёзда потом гаснут
    const tilesStart = start + 160;
    const step = screen.step || TILE_STEP;

    tiles.forEach((tile, index) => {
      const rise = play(screen, tile, RISE_FRAMES, { duration: RISE_DURATION, delay: tilesStart + index * step, easing: EASE, fill: "backwards" });
      const socket = sockets[index];
      if (!socket) return;
      rise.addEventListener("finish", () => {
        const fade = socket.animate([{ opacity: 1 }, { opacity: 0 }], { duration: SOCKET_FADE, fill: "forwards" });
        fade.addEventListener("finish", () => socket.remove(), { once: true });
      }, { once: true });
      rise.addEventListener("cancel", () => socket.remove(), { once: true });
    });

    // 4. Содержимое большой клетки появляется, когда она почти встала
    const innerStart = tilesStart + RISE_DURATION * 0.4;
    inner.forEach((element, index) => {
      play(screen, element, textFrames(1), { duration: TEXT_DURATION, delay: innerStart + index * 60, easing: EASE, fill: "backwards" });
    });

    // 5. Игровые предметы
    if (screen.extra === "hero") {
      const itemsStart = tilesStart + step * 2;
      const pawn = screen.el.querySelector(".board_pawn");
      const coins = screen.el.querySelector(".board_coins");
      if (pawn) play(screen, pawn, DROP_FRAMES, { duration: 720, delay: itemsStart, easing: "ease-out", fill: "backwards" });
      if (coins) play(screen, coins, COIN_FRAMES, { duration: 520, delay: itemsStart + 160, easing: EASE, fill: "backwards" });
    }

    if (screen.route) {
      const pawn = screen.el.querySelector(".route_pawn");
      const coins = all(screen.el, ".route_stack-coin:not(.is-gone)");

      if (screenMode) {
        // Десктоп: клетки маршрута уже поднялись из гнёзд по порядку 1–6.
        // Фишка падает на свою клетку, монеты — на стопку в кошельке
        const wallet = screen.el.querySelector(".route_wallet");
        const walletLanded = tilesStart + Math.max(0, tiles.indexOf(wallet)) * step + RISE_DURATION * 0.5;
        coins.forEach((coin, index) => {
          play(screen, coin, COIN_FRAMES, { duration: 420, delay: walletLanded + index * 60, easing: EASE, fill: "backwards" });
        });
        if (pawn) play(screen, pawn, DROP_FRAMES, { duration: 720, delay: tilesStart + RISE_DURATION * 0.8, easing: "ease-out", fill: "backwards" });
      } else {
        // Телефон: поле встаёт целиком, клетки маршрута выщёлкиваются на нём
        const board = screen.el.querySelector(".route_board");
        const boardLanded = tilesStart + Math.max(0, tiles.indexOf(board)) * step + RISE_DURATION * 0.5;
        all(screen.el, ".route_tile").forEach((tile, index) => {
          play(screen, tile, POP_FRAMES, { duration: 380, delay: boardLanded + index * 60, easing: EASE, fill: "backwards" });
        });
        coins.forEach((coin, index) => {
          play(screen, coin, COIN_FRAMES, { duration: 420, delay: boardLanded + 120 + index * 70, easing: EASE, fill: "backwards" });
        });
        if (pawn) play(screen, pawn, DROP_FRAMES, { duration: 720, delay: boardLanded + 6 * 60 + 80, easing: "ease-out", fill: "backwards" });
      }
    }
  };

  // Клетки уходящего экрана опускаются и гаснут
  const sink = (screen, direction) => {
    const items = [...all(screen.el, screen.text), ...tilesOf(screen)].filter(isShown);
    items.forEach((element, index) => {
      play(screen, element, sinkFrames(direction), { duration: 220, delay: Math.min(index, 6) * 20, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" });
    });
  };

  // Шрифты загрузились (или прошло 0,7 с) — можно мерить клетки для гнёзд
  const fontsSettled = Promise.race([
    document.fonts?.ready || Promise.resolve(),
    new Promise((resolve) => window.setTimeout(resolve, 700)),
  ]);


  /* --------------------------------------------------------------------------
     10. КАРТА ХОДА
     -------------------------------------------------------------------------- */

  const hud = document.createElement("nav");
  hud.className = "game-hud";
  hud.setAttribute("aria-label", "Карта страницы");
  hud.innerHTML = `
    <ol class="game-hud_track">
      ${hudScreens.map((screen, index) => `
        <li class="game-hud_item">
          <a class="game-hud_cell" href="#${screen.id}">
            <span class="game-hud_label">${index + 1}&nbsp;· ${screen.label}</span>
          </a>
        </li>`).join("")}
    </ol>
    <svg class="game-hud_pawn" viewBox="0 0 64 96" aria-hidden="true" focusable="false"><use href="#g-pawn-white" /></svg>`;
  page.appendChild(hud);

  const hudItems = [...hud.querySelectorAll(".game-hud_item")];
  const hudCells = [...hud.querySelectorAll(".game-hud_cell")];
  const hudPawn = hud.querySelector(".game-hud_pawn");

  let hudCurrent = -1;
  let hudPawnPoint = null;
  let announceTimer = 0;

  // Фишка стоит на клетке: основание чуть выше нижнего края клетки.
  // Координаты считаем от левого верхнего угла карты
  const hudPawnPointFor = (index) => {
    const cell = hudCells[index]?.getBoundingClientRect();
    const size = hudPawn.getBoundingClientRect();
    const frame = hud.getBoundingClientRect();
    if (!cell || !size.width) return null;
    return {
      x: cell.left - frame.left + (cell.width - size.width) / 2,
      y: cell.top - frame.top + cell.height - size.height - 2,
    };
  };

  const placeHudPawn = (index, animate) => {
    const point = hudPawnPointFor(index);
    if (!point) return;
    const to = `${point.x.toFixed(1)}px ${point.y.toFixed(1)}px`;

    if (animate && hudPawnPoint && motion) {
      const from = `${hudPawnPoint.x.toFixed(1)}px ${hudPawnPoint.y.toFixed(1)}px`;
      // Прыжок дугой влево от дорожки
      const middle = `${(point.x - 12).toFixed(1)}px ${((hudPawnPoint.y + point.y) / 2).toFixed(1)}px`;
      hudPawn.animate(
        [{ translate: from }, { translate: middle, offset: 0.5 }, { translate: to }],
        { duration: 460, easing: EASE }
      );
    }

    hudPawn.style.translate = to;
    hudPawnPoint = point;
  };

  // index — номер экрана в общем списке; подвал показывается как последняя клетка
  const setHud = (screenIndex) => {
    const index = Math.min(screenIndex, hudScreens.length - 1);
    if (index === hudCurrent || index < 0) return;
    const previous = hudCurrent;
    hudCurrent = index;

    hudCells.forEach((cell, cellIndex) => {
      cell.classList.toggle("is-passed", cellIndex < index);
      cell.classList.toggle("is-active", cellIndex === index);
      if (cellIndex === index) cell.setAttribute("aria-current", "location");
      else cell.removeAttribute("aria-current");
    });

    // Карта видна, когда первый экран ушёл
    hud.classList.toggle("is-shown", index > 0);
    placeHudPawn(index, previous >= 0);

    // Название нового экрана видно секунду с небольшим
    hudItems.forEach((item) => item.classList.remove("is-announced"));
    window.clearTimeout(announceTimer);
    if (previous >= 0 && index > 0) {
      hudItems[index].classList.add("is-announced");
      announceTimer = window.setTimeout(() => hudItems[index].classList.remove("is-announced"), 1600);
    }
  };

  window.addEventListener("resize", () => {
    hudPawnPoint = null;
    placeHudPawn(hudCurrent, false);
  });


  /* --------------------------------------------------------------------------
     11. ДЕСКТОП: ЭКРАНЫ СМЕНЯЮТ ДРУГ ДРУГА
     -------------------------------------------------------------------------- */

  let current = -1;
  let leaving = null;
  let lockedUntil = 0;
  let routeSub = 0;

  // Курсоры участников (раздел 7) просыпаются от прокрутки; прокрутки нет —
  // будим их сами, чтобы они перелетели на новый экран
  const wakeCursors = () => window.dispatchEvent(new Event("scroll"));

  const setVisible = (screen, state) => {
    [screen.el, screen.withHeader ? header : null].filter(Boolean).forEach((element) => {
      element.classList.toggle("is-screen-current", state === "current");
      element.classList.toggle("is-screen-leaving", state === "leaving");
    });
  };

  const clearScreen = (screen) => {
    [...screen.anims].forEach((animation) => animation.cancel());
    screen.anims.clear();
    screen.el.querySelectorAll(".game-socket").forEach((socket) => socket.remove());
  };

  const hideLeaving = () => {
    if (!leaving) return;
    const screen = leaving;
    leaving = null;
    clearScreen(screen);
    setVisible(screen, null);
  };

  const updateHash = (screen) => {
    if (!screen.id) return;
    const hash = screen.id === "top" ? "" : `#${screen.id}`;
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}${hash}`);
  };

  // Ход внутри «Как пройдёт игра»: одна карточка этапа уходит, другая встаёт.
  // Фишку и монеты двигает раздел 8 — он видит, что посередине окна
  // теперь другая карточка
  const setRouteSub = (index, animate, direction = 1) => {
    const next = routeItems[index];
    if (!next) return;
    const previous = routeItems.find((item) => item.classList.contains("is-sub-current"));
    routeSub = index;
    if (previous === next) return;

    const swap = () => {
      routeItems.forEach((item) => item.classList.toggle("is-sub-current", item === next));
      wakeCursors();
    };

    if (!animate || !motion || !previous || !routeScreen) {
      swap();
      return;
    }

    lockedUntil = performance.now() + STEP_LOCK;
    const out = play(routeScreen, previous, sinkFrames(direction), { duration: 180, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" });
    out.addEventListener("finish", () => {
      out.cancel();
      swap();
      play(routeScreen, next, [
        { opacity: 0, transform: `translateY(${direction < 0 ? "-1rem" : "1rem"}) scale(0.97)` },
        { opacity: 1, transform: "translateY(-0.125rem) scale(1.005)", offset: 0.6 },
        { opacity: 1, transform: "none" },
      ], { duration: 460, easing: EASE });
    }, { once: true });
  };

  const showScreen = (index, { direction = 1, sub = null, focus = false, waitFonts = false } = {}) => {
    const to = screens[index];
    if (!to) return;
    const from = screens[current];

    if (from === to) {
      if (to.route && sub !== null && sub !== routeSub) setRouteSub(sub, true, sub > routeSub ? 1 : -1);
      return;
    }

    // Предыдущая смена ещё не закончилась — доводим её мгновенно
    hideLeaving();
    if (from) {
      [...from.anims].forEach((animation) => animation.finish());
      setVisible(from, "leaving");
      leaving = from;
    }

    current = index;
    if (to.route) setRouteSub(sub ?? (direction < 0 ? routeItems.length - 1 : 0), false);
    setVisible(to, "current");
    to.el.scrollTop = 0;
    fit(to);
    setHud(index);
    updateHash(to);
    wakeCursors();
    if (focus) to.el.focus({ preventScroll: true });

    if (!motion) {
      hideLeaving();
      markBuilt(to.marked);
      return;
    }

    lockedUntil = performance.now() + SCREEN_LOCK;

    if (from) {
      sink(from, direction);
      const fadeOut = { duration: 240, delay: 120, easing: "ease-in", fill: "forwards" };
      const fade = play(from, from.el, [{ opacity: 1 }, { opacity: 0 }], fadeOut);
      if (from.withHeader) play(from, header, [{ opacity: 1 }, { opacity: 0 }], fadeOut);
      fade.addEventListener("finish", () => {
        if (leaving === from) hideLeaving();
      }, { once: true });
    }

    const fadeIn = { duration: 280, delay: from ? 100 : 0, easing: "ease-out", fill: "backwards" };
    play(to, to.el, [{ opacity: 0 }, { opacity: 1 }], fadeIn);
    if (to.withHeader) play(to, header, [{ opacity: 0 }, { opacity: 1 }], fadeIn);

    const start = () => {
      fit(to);
      build(to, { direction, start: from ? 180 : 0 });
    };
    if (waitFonts) fontsSettled.then(start);
    else start();

    window.setTimeout(wakeCursors, 520);
  };

  // Где на странице лежит элемент: номер экрана и, для этапов, номер хода
  const placeOf = (target) => {
    if (!target) return null;
    const index = screens.findIndex((screen) => screen.el === target || screen.el.contains(target));
    if (index < 0) {
      // Шапка или main целиком — это первый экран
      if (target === header || header?.contains(target) || target.contains(screens[0].el)) return { index: 0, sub: null };
      return null;
    }
    const item = target.closest(".route_list > li");
    return { index, sub: item ? routeItems.indexOf(item) : null };
  };

  const goTo = (place, options = {}) => {
    if (!place) return;
    showScreen(place.index, {
      direction: place.index >= current ? 1 : -1,
      sub: place.sub,
      ...options,
    });
  };

  // Один шаг вперёд или назад: внутри этапов — ход, иначе — экран
  const step = (direction, options = {}) => {
    const screen = screens[current];
    if (screen?.route) {
      const next = routeSub + direction;
      if (next >= 0 && next < routeItems.length) {
        setRouteSub(next, true, direction);
        return;
      }
    }
    if (screens[current + direction]) showScreen(current + direction, { direction, ...options });
  };

  // Можно ли ещё прокрутить что-то внутри экрана в эту сторону
  const roomInside = (target, boundary, dy) => {
    for (let el = target instanceof Element ? target : null; el; el = el.parentElement) {
      if (el.scrollHeight > el.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) {
        const room = dy > 0 ? el.scrollHeight - el.clientHeight - el.scrollTop : el.scrollTop;
        if (room > 1) return true;
      }
      if (el === boundary) break;
    }
    return false;
  };

  // Колесо и тачпад. Тачпад после жеста ещё долго присылает затухающую
  // инерцию — её пропускаем. Новый жест — это либо пауза, либо разгон.
  const wheelLog = [];
  let lastInsideScroll = 0;

  const isNewGesture = (time, size) => {
    const previous = wheelLog[wheelLog.length - 1];
    wheelLog.push({ time, size });
    if (wheelLog.length > 12) wheelLog.shift();
    if (!previous || time - previous.time > 180) return true;
    if (wheelLog.length < 6) return false;
    const average = (items) => items.reduce((sum, item) => sum + item.size, 0) / items.length;
    return average(wheelLog.slice(-3)) > average(wheelLog.slice(0, -3)) * 1.25;
  };

  const onWheel = (event) => {
    if (!screenMode || event.ctrlKey) return;
    const dy = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    if (!dy || Math.abs(dy) < Math.abs(event.deltaX)) return;

    const now = performance.now();
    const screen = screens[current];
    if (screen && roomInside(event.target, screen.el, dy)) {
      lastInsideScroll = now;
      wheelLog.length = 0;
      return;
    }

    event.preventDefault();
    const fresh = isNewGesture(now, Math.abs(dy));
    if (!fresh || now < lockedUntil || now - lastInsideScroll < 350) return;
    step(dy > 0 ? 1 : -1);
  };

  // Клавиши. В полях формы ничего не перехватываем
  const onKey = (event) => {
    if (!screenMode || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target instanceof Element ? event.target : document.body;
    if (target.closest("input, textarea, select, [contenteditable], .iti__dropdown-content")) return;

    let direction = 0;
    switch (event.key) {
      case "ArrowDown":
      case "PageDown":
        direction = 1;
        break;
      case "ArrowUp":
      case "PageUp":
        direction = -1;
        break;
      case " ":
        if (target.closest("button, summary, [role='button']")) return;
        direction = event.shiftKey ? -1 : 1;
        break;
      case "Home":
        event.preventDefault();
        if (current !== 0) showScreen(0, { direction: -1, focus: true });
        return;
      case "End":
        event.preventDefault();
        if (current !== screens.length - 1) showScreen(screens.length - 1, { direction: 1, focus: true });
        return;
      default:
        return;
    }

    event.preventDefault();
    const screen = screens[current];
    if (!screen) return;

    // Длинный экран: сначала прокручиваем его внутри
    const el = screen.el;
    const room = direction > 0 ? el.scrollHeight - el.clientHeight - el.scrollTop : el.scrollTop;
    if (room > 2) {
      el.scrollBy({ top: direction * Math.min(room, el.clientHeight * 0.8), behavior: motion ? "smooth" : "auto" });
      return;
    }
    if (performance.now() < lockedUntil) return;
    step(direction, { focus: true });
  };

  // Ссылки на блоки (меню, кнопки, клетки поля и карты хода) открывают экран
  const onClick = (event) => {
    if (!screenMode || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest("a[href^='#']") : null;
    if (!link) return;
    const id = decodeURIComponent(link.getAttribute("href").slice(1));
    const place = id ? placeOf(document.getElementById(id)) : null;
    if (!place) return;
    event.preventDefault();
    // Нажатие Enter на ссылке переносит фокус на новый экран
    goTo(place, { focus: event.detail === 0 });
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  document.addEventListener("keydown", onKey);
  document.addEventListener("click", onClick);

  // Блок, который сейчас посередине окна (до включения режима экранов)
  const indexAtMiddle = () => {
    const middle = window.innerHeight / 2;
    const index = screens.findIndex((screen) => {
      const rect = screen.el.getBoundingClientRect();
      return rect.top <= middle && rect.bottom >= middle;
    });
    return Math.max(0, index);
  };

  const enterScreens = (firstTime) => {
    if (screenMode) return;

    // Откуда начать: экран из адреса (#format) или блок посередине окна
    const hashTarget = window.location.hash
      ? document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
      : null;
    const place = placeOf(hashTarget) || { index: indexAtMiddle(), sub: null };
    if (header) root.style.setProperty("--screen-header", `${header.offsetHeight}px`);

    screenMode = true;
    root.classList.add("is-screen-mode");
    screens.forEach((screen) => screen.el.setAttribute("tabindex", "-1"));
    window.scrollTo(0, 0);

    current = -1;
    showScreen(place.index, { sub: place.sub, waitFonts: firstTime });
  };

  const exitScreens = () => {
    if (!screenMode) return;
    const screen = screens[current];
    screenMode = false;

    hideLeaving();
    screens.forEach((item) => {
      clearScreen(item);
      fit(item);
      setVisible(item, null);
      markBuilt(item.marked);
      // На телефоне всё уже собрано — второй раз не собираем
      item.built = true;
    });
    root.classList.remove("is-screen-mode");
    current = -1;

    if (screen) window.scrollTo(0, screen.el.getBoundingClientRect().top + window.scrollY);
  };

  // Окно поменяло размер — шапка и подгонка текущего экрана пересчитываются
  window.addEventListener("resize", () => {
    if (!screenMode || !screens[current]) return;
    if (header?.offsetHeight) root.style.setProperty("--screen-header", `${header.offsetHeight}px`);
    fit(screens[current]);
  });

  screenQuery.addEventListener?.("change", () => {
    if (screenQuery.matches) enterScreens(false);
    else exitScreens();
  });


  /* --------------------------------------------------------------------------
     11.1. ТЕЛЕФОН И ПЛАНШЕТ: ПРОКРУТКА, БЛОКИ СОБИРАЮТСЯ ОДИН РАЗ
     -------------------------------------------------------------------------- */

  const buildOnce = (screen) => {
    if (screenMode || screen.built) return;
    screen.built = true;
    build(screen);
  };

  if (motion) {
    const buildObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const screen = screens.find((item) => item.el === entry.target);
        if (screen && screen.id !== "top") buildOnce(screen);
      });
    }, { rootMargin: "0px 0px -25% 0px", threshold: 0 });

    screens.forEach((screen) => {
      if (screen.id !== "top") buildObserver.observe(screen.el);
    });
  }

  // Карта хода при прокрутке: текущий блок — тот, что пересекает середину окна
  if ("IntersectionObserver" in window) {
    const middleObserver = new IntersectionObserver((entries) => {
      if (screenMode) return;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        setHud(screens.findIndex((screen) => screen.el === entry.target));
      });
    }, { rootMargin: "-50% 0px -50% 0px", threshold: 0 });
    screens.forEach((screen) => middleObserver.observe(screen.el));
  }


  /* --------------------------------------------------------------------------
     11.2. СТАРТ
     -------------------------------------------------------------------------- */

  if (routeItems.length) setRouteSub(0, false);

  if (screenQuery.matches) {
    enterScreens(true);
  } else {
    setHud(0);
    const hero = screens.find((screen) => screen.id === "top");
    if (hero) {
      if (motion) fontsSettled.then(() => buildOnce(hero));
      else screens.forEach((screen) => markBuilt(screen.marked));
    }
  }
})();
