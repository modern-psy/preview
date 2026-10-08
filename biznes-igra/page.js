/* ============================================================================
   ПОВЕДЕНИЕ СТРАНИЦЫ «БИЗНЕС-ИГРА ДЛЯ ПСИХОЛОГОВ»
   ============================================================================

   Здесь:
     1) меню в шапке на узких экранах (перенесено с /cft-spiderman);
     6–8) игровое поле: появление клеток, курсоры участников, ходы фишки
          и кошелёк — описание ниже, перед кодом.

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
   6–8. ИГРОВОЕ ПОЛЕ: ПОЯВЛЕНИЕ КЛЕТОК, КУРСОРЫ УЧАСТНИКОВ, ХОДЫ ФИШКИ
   ============================================================================

   6. Появление. Клетки с атрибутом data-reveal поднимаются снизу, когда
      доходят до экрана. Без скрипта всё видно сразу.

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
     6. ПОЯВЛЕНИЕ КЛЕТОК
     -------------------------------------------------------------------------- */

  const revealItems = [...page.querySelectorAll("[data-reveal]")];

  if (revealItems.length > 0 && "IntersectionObserver" in window && prefersMotion()) {
    page.classList.add("has-motion");

    // Соседние клетки встают по очереди, с шагом 90 мс
    revealItems.forEach((item) => {
      const siblings = [...item.parentElement.children].filter((el) => el.hasAttribute("data-reveal"));
      const index = Math.min(siblings.indexOf(item), 4);
      item.style.setProperty("--reveal-delay", `${index * 90}ms`);
    });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else if (prefersMotion()) {
    page.classList.add("has-motion");
    revealItems.forEach((item) => item.classList.add("is-in"));
  }


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
