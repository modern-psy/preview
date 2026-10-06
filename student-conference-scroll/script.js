/* =========================================================================
   Студенческая конференция 2.0 — ЧЕРНОВИК СЦЕНАРИЯ СКРОЛЛА
   Здесь логика чек-листа, меню и все анимации по прокрутке (GSAP 3.15).
   Повторный запуск безопасен: перед стартом снимается всё, что было раньше.
   ========================================================================= */
(() => {
  const page = document.querySelector(".sc-page");
  if (!page) return;

  if (typeof window.__scCleanup === "function") window.__scCleanup();
  const disposers = [];
  const on = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    disposers.push(() => target.removeEventListener(type, handler, options));
  };

  const $ = (selector, root = page) => root.querySelector(selector);
  const $$ = (selector, root = page) => [...root.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);

  /* Брейкпоинты те же, что в styles.css: телефон до 768, планшет до 1024, дальше десктоп */
  const MQ_DESKTOP = "(min-width: 64.0625rem)";
  const MQ_TABLET = "(min-width: 48.0625rem) and (max-width: 64rem)";
  const MQ_MOBILE = "(max-width: 48rem)";
  const MQ_REDUCE = "(prefers-reduced-motion: reduce)";
  const layoutMode = () => (matchMedia(MQ_DESKTOP).matches ? "desktop" : matchMedia(MQ_TABLET).matches ? "tablet" : "mobile");

  /* ---------------------------------------------------------------------
     Чек-лист «Для кого». Работает и без анимаций.
     Каждый пункт привязан к треку (A, B или C), чаще отмеченный и есть подсказка.
     --------------------------------------------------------------------- */
  const TRACKS = {
    A: "трек A — «С чего начать»",
    B: "трек B — «Выбор метода»",
    C: "трек C — «Путь с нуля»",
  };
  const checks = $$("[data-sc-check]");
  const countEl = $("[data-sc-count]");
  const countLive = $("[data-sc-count-live]");
  const resultTitle = $("[data-sc-result-title]");
  const resultTrack = $("[data-sc-result-track]");
  let lastCount = 0;

  const renderResult = () => {
    const selected = checks.filter((check) => check.getAttribute("aria-pressed") === "true");
    const count = selected.length;
    const tally = { A: 0, B: 0, C: 0 };
    selected.forEach((check) => { tally[check.dataset.track] += 1; });
    const best = ["A", "B", "C"].reduce((winner, key) => (tally[key] > tally[winner] ? key : winner), "A");

    countEl.textContent = String(count);
    countLive.textContent = `Отмечено ${count} из ${checks.length}`;
    if (window.gsap && count !== lastCount) {
      gsap.fromTo(countEl, { yPercent: count > lastCount ? 45 : -45, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: "power3.out" });
    }
    lastCount = count;

    if (count === 0) {
      resultTitle.textContent = "Отметьте всё, что про вас";
      resultTrack.textContent = "Подскажем, с какого трека начать";
    } else if (count < 3) {
      resultTitle.textContent = "Узнаёте себя? Отметьте всё, что откликается";
      resultTrack.textContent = `Пока вам ближе ${TRACKS[best]}`;
    } else {
      resultTitle.textContent = "Это то, чему не учат в университете";
      resultTrack.textContent = `Вам подойдёт ${TRACKS[best]}`;
    }
  };

  /* ---------------------------------------------------------------------
     Хайлайтер: под каждой строкой отмеченного пункта рисуется полоса с рваными краями
     (рисунок #sc-hl). Строки закрашиваются по очереди, слева направо — как маркером в тетради.
     --------------------------------------------------------------------- */
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const HL_SVG = '<svg viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true"><use href="#sc-hl"/></svg>';
  // Строки текста: прямоугольники, которые браузер отдаёт для каждой строки, склеенные по высоте
  const textLines = (node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    const lines = [];
    [...range.getClientRects()].filter((rect) => rect.width > 1).forEach((rect) => {
      const line = lines.find((item) => Math.abs(item.top - rect.top) < 4);
      if (line) {
        line.left = Math.min(line.left, rect.left);
        line.right = Math.max(line.right, rect.right);
        line.bottom = Math.max(line.bottom, rect.bottom);
      } else {
        lines.push({ top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right });
      }
    });
    return lines.sort((a, b) => a.top - b.top);
  };
  const paintHighlight = (check, animate) => {
    const host = $(".sc-check_text", check);
    const text = $(".sc-check_hl", check);
    $$(".sc-hl", host).forEach((node) => node.remove());
    const base = host.getBoundingClientRect();
    let delay = 0;
    textLines(text).forEach((line) => {
      const strip = document.createElement("span");
      const height = line.bottom - line.top;
      strip.className = "sc-hl";
      strip.innerHTML = HL_SVG;
      strip.style.left = `${line.left - base.left - 5}px`;
      strip.style.top = `${line.top - base.top - height * 0.06}px`;
      strip.style.width = `${line.right - line.left + 10}px`;
      strip.style.height = `${height * 1.08}px`;
      host.appendChild(strip);
      if (animate && !reduceMotion() && strip.animate) {
        // Длинная строка закрашивается дольше; следующая начинается, когда предыдущая почти готова
        const duration = 160 + (line.right - line.left) * 0.6;
        strip.animate(
          [{ clipPath: "inset(-20% 100% -20% 0)" }, { clipPath: "inset(-20% 0% -20% 0)" }],
          { duration, delay, easing: "cubic-bezier(0.4, 0, 0.3, 1)", fill: "backwards" },
        );
        delay += duration * 0.9;
      }
    });
  };
  const eraseHighlight = (check) => {
    $$(".sc-hl", check).forEach((strip) => {
      if (reduceMotion() || !strip.animate) { strip.remove(); return; }
      strip.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: "ease-out" }).onfinish = () => strip.remove();
    });
  };

  checks.forEach((check) => on(check, "click", () => {
    const pressed = check.getAttribute("aria-pressed") === "true";
    check.setAttribute("aria-pressed", String(!pressed));
    if (pressed) eraseHighlight(check); else paintHighlight(check, true);
    renderResult();
  }));
  // При изменении ширины строки переносятся иначе — перерисовать полосы без анимации
  let highlightTimer = 0;
  on(window, "resize", () => {
    window.clearTimeout(highlightTimer);
    highlightTimer = window.setTimeout(() => {
      checks.filter((check) => check.getAttribute("aria-pressed") === "true").forEach((check) => paintHighlight(check, false));
    }, 150);
  });
  disposers.push(() => window.clearTimeout(highlightTimer));

  /* ---------------------------------------------------------------------
     Телефон: пока листаете список, карточка-вывод свёрнута до счётчика и едет внизу экрана.
     Когда конец списка поднялся над нижним краем, карточка раскрывается целиком.
     --------------------------------------------------------------------- */
  const resultCard = $("[data-sc-result]");
  const checklist = $(".sc-checklist");
  const phoneQuery = matchMedia("(max-width: 48rem)");
  let dockFrame = 0;
  const updateDock = () => {
    dockFrame = 0;
    if (!resultCard || !checklist) return;
    if (!phoneQuery.matches) {
      resultCard.classList.remove("is-docked", "is-away");
      return;
    }
    const list = checklist.getBoundingClientRect();
    // Раскрываем, когда место сразу под списком показалось на экране — карточка встаёт туда, где был счётчик
    const docked = list.bottom > window.innerHeight - 96;
    resultCard.classList.toggle("is-docked", docked);
    // Список ещё не доехал до экрана — свёрнутую карточку не показываем
    resultCard.classList.toggle("is-away", docked && list.top > window.innerHeight * 0.75);
  };
  const requestDock = () => { if (!dockFrame) dockFrame = window.requestAnimationFrame(updateDock); };
  on(window, "scroll", requestDock, { passive: true });
  on(window, "resize", requestDock);
  updateDock();
  disposers.push(() => window.cancelAnimationFrame(dockFrame));

  /* Переключатель «только доказательные» в карточке методов */
  const chips = $("[data-sc-chips]");
  const toggle = $("[data-sc-toggle]");
  const setEvidence = (state) => {
    toggle?.setAttribute("aria-checked", String(state));
    chips?.classList.toggle("is-evidence-mode", state);
  };
  if (toggle) on(toggle, "click", () => setEvidence(toggle.getAttribute("aria-checked") !== "true"));

  /* ---------------------------------------------------------------------
     Лента «Почему сложно» на телефоне и планшете: точки показывают текущую карточку
     и по нажатию прокручивают к нужной.
     --------------------------------------------------------------------- */
  const painCards = $("[data-sc-pains-cards]");
  const painDots = $$("[data-sc-pains-dots] button");
  const painItems = painCards ? $$(".sc-pain", painCards) : [];
  const painsPad = () => parseFloat(getComputedStyle(painCards).scrollPaddingLeft) || 0;
  let painsFrame = 0;
  const syncPainDots = () => {
    painsFrame = 0;
    const box = painCards.getBoundingClientRect();
    // Текущая — та карточка, чей левый край ближе всего к началу ленты
    let current = 0;
    let best = Infinity;
    painItems.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - box.left - painsPad());
      if (distance < best) { best = distance; current = index; }
    });
    // Долистали до конца — подсвечиваем последнюю точку
    if (painCards.scrollLeft + painCards.clientWidth >= painCards.scrollWidth - 4) current = painItems.length - 1;
    painDots.forEach((dot, index) => dot.setAttribute("aria-pressed", String(index === current)));
  };
  if (painCards && painDots.length) {
    on(painCards, "scroll", () => { if (!painsFrame) painsFrame = window.requestAnimationFrame(syncPainDots); }, { passive: true });
    painDots.forEach((dot, index) => on(dot, "click", () => {
      const card = painItems[index];
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      painCards.scrollTo({ left: card.offsetLeft - painsPad(), behavior: reduce ? "auto" : "smooth" });
    }));
    disposers.push(() => window.cancelAnimationFrame(painsFrame));
  }

  /* ---------------------------------------------------------------------
     Меню телефона. Нативный <dialog>: фокус внутри, Esc закрывает.
     --------------------------------------------------------------------- */
  const menu = $("[data-sc-menu]");
  let menuOpener = null;
  const closeMenu = () => {
    if (!menu?.open) return;
    menu.close();
  };
  if (menu && typeof menu.showModal === "function") {
    $$("[data-sc-menu-open]").forEach((button) => on(button, "click", () => {
      menuOpener = button;
      menu.showModal();
      document.documentElement.style.overflow = "hidden";
      button.setAttribute("aria-expanded", "true");
    }));
    on(menu, "close", () => {
      document.documentElement.style.overflow = "";
      $$("[data-sc-menu-open]").forEach((button) => button.setAttribute("aria-expanded", "false"));
      menuOpener?.focus({ preventScroll: true });
    });
    $$("[data-sc-menu-close], .sc-menu_link, .sc-menu_bottom a", menu).forEach((node) => on(node, "click", closeMenu));
    // Нажатие на затемнение вокруг меню тоже закрывает его
    on(menu, "click", (event) => { if (event.target === menu) closeMenu(); });
  }

  /* ---------------------------------------------------------------------
     Колода на телефоне: видны две карты, пары сменяют друг друга.
     Точки под колодой переключают пару вручную, после этого смена останавливается.
     --------------------------------------------------------------------- */
  const deck = $("[data-sc-deck]");
  const pairDots = $$("[data-sc-pair]");
  const pairs = (() => {
    let pair = "a";
    let timer = 0;
    let auto = true;
    let visible = false;
    const set = (next) => {
      pair = next;
      deck.classList.toggle("is-pair-b", pair === "b");
      pairDots.forEach((dot) => dot.setAttribute("aria-pressed", String(dot.dataset.scPair === pair)));
    };
    const stop = () => { window.clearInterval(timer); timer = 0; };
    const sync = () => {
      stop();
      if (auto && visible && matchMedia(MQ_MOBILE).matches && !matchMedia(MQ_REDUCE).matches) {
        timer = window.setInterval(() => set(pair === "a" ? "b" : "a"), 3400);
      }
    };
    pairDots.forEach((dot) => on(dot, "click", () => { auto = false; set(dot.dataset.scPair); sync(); }));
    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0.4 })
      : null;
    observer?.observe(deck);
    const mobileQuery = matchMedia(MQ_MOBILE);
    const onChange = () => { if (!mobileQuery.matches) set("a"); sync(); };
    mobileQuery.addEventListener("change", onChange);
    disposers.push(() => { stop(); observer?.disconnect(); mobileQuery.removeEventListener("change", onChange); });
    return { set };
  })();

  /* Без GSAP страница остаётся статичной и полностью читаемой */
  if (!window.gsap || !window.ScrollTrigger) {
    window.__scCleanup = () => disposers.forEach((dispose) => dispose());
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MorphSVGPlugin);

  const hero = $("[data-sc-hero]");
  const heroFrame = $("[data-sc-hero-frame]");
  const heroHeader = $("[data-sc-header]");
  const heroBody = $("[data-sc-hero-body]");
  const heroLoop = $("[data-sc-loop]", hero);
  const heroLoopPaths = $$("path", heroLoop);
  const painsLoopPaths = $$("[data-sc-pains] [data-sc-loop] path");
  const painsIntro = $(".sc-pains_intro");
  const marks = $$("[data-sc-mark]", hero);
  const deckCard = $("[data-sc-deck-card]");
  const student = $("[data-sc-student]");
  const accents = $$("[data-sc-accent] path");
  const deckArrow = $$("[data-sc-deck-arrow] path");
  const approaches = $$("[data-sc-approach]");
  const floats = $$("[data-sc-float]");
  const pills = $("[data-sc-pills]");
  const pillsRegistration = $("[data-sc-pills-registration]");
  const audience = $("[data-sc-audience]");
  const result = $("[data-sc-result]");
  const portal = $("[data-sc-portal]");
  const portalText = $("[data-sc-portal-text]");
  const pains = $("[data-sc-pains]");
  const painsTrack = $("[data-sc-pains-track]");
  const painsProgress = $("[data-sc-pains-progress]");
  const finale = $("[data-sc-finale]");
  const finaleText = $("[data-sc-finale-text]");
  const knot = $("[data-sc-knot]");
  const KNOT_STRAIGHT = "M40 80C300 80 560 80 840 80";
  const knotHead = $(".sc-knot_head");
  const benefits = $("[data-sc-benefits]");
  const day = $("[data-sc-day]");
  const anti = $("[data-sc-anti]");
  const antiStage = $("[data-sc-anti-stage]");
  const antiTitle = $("[data-sc-anti-title]");
  const antiSide = $("[data-sc-anti-side]");
  const strike = $("[data-sc-strike]");
  const ribbon = $("[data-sc-ribbon]");
  const ribbonTarget = $("[data-sc-ribbon-target]");
  const flyer = $("[data-sc-flyer]");

  /* Положение элемента внутри колоды без учёта анимаций (для раскладки карт веером) */
  const layoutRect = (el) => ({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });

  /* ---------------------------------------------------------------------
     Портал: тёмная плашка, которая перетекает из одного элемента в другой.
     --------------------------------------------------------------------- */
  const setPortal = (rect, radius, opacity = 1) => {
    portal.style.visibility = "visible";
    portal.style.left = `${rect.left}px`;
    portal.style.top = `${rect.top}px`;
    portal.style.width = `${rect.width}px`;
    portal.style.height = `${rect.height}px`;
    portal.style.borderRadius = `${radius}px`;
    portal.style.opacity = String(opacity);
  };
  const hidePortal = () => { portal.style.visibility = "hidden"; };
  const viewportRect = () => ({ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight });
  const mixRect = (a, b, t) => ({
    left: lerp(a.left, b.left, t),
    top: lerp(a.top, b.top, t),
    width: lerp(a.width, b.width, t),
    height: lerp(a.height, b.height, t),
  });
  const cardRadius = () => 24;
  // Обрезка экрана «во весь размер» — в том же формате, что и конечные значения, иначе GSAP не сможет плавно их смешать
  const CLIP_FULL = "inset(0% 0% 0% 0% round 0px 0px 0px 0px)";

  /* Подсветка текущего раздела в навигации и в меню */
  const stationLinks = [...$$("[data-sc-station]"), ...$$("[data-sc-menu-station]", menu || page)];
  const setStation = (id) => {
    stationLinks.forEach((link) => {
      const key = link.dataset.scStation || link.dataset.scMenuStation;
      link.classList.toggle("is-current", key === id);
    });
  };
  /* Вариант 1: «Регистрация» в плашке видна и доступна с клавиатуры только после начала «Для кого» */
  const setPillsRegistration = (visible) => {
    pills?.classList.toggle("is-registration-visible", visible);
    pillsRegistration?.setAttribute("aria-hidden", String(!visible));
    if (pillsRegistration) pillsRegistration.tabIndex = visible ? 0 : -1;
  };

  const mm = gsap.matchMedia();

  mm.add(
    {
      desktop: MQ_DESKTOP,
      tablet: MQ_TABLET,
      mobile: MQ_MOBILE,
      reduce: MQ_REDUCE,
    },
    (context) => {
      const { desktop, reduce } = context.conditions;

      // Навигация после первого экрана: появляется, линия заполняется по мере прокрутки
      ScrollTrigger.create({
        trigger: hero,
        // Десктоп: плашка видна всегда (CSS). Телефон и планшет: выезжает, когда ушла шапка первого экрана
        start: () => (desktop ? `top+=${window.innerHeight * 0.25} top` : "top+=96 top"),
        endTrigger: page,
        end: "bottom bottom",
        onUpdate: (self) => page.style.setProperty("--progress", self.progress.toFixed(4)),
        onToggle: (self) => floats.forEach((node) => node.classList.toggle("is-visible", self.isActive)),
      });
      ScrollTrigger.create({
        trigger: audience,
        start: "top 20%",
        endTrigger: page,
        end: "bottom bottom",
        onToggle: (self) => setPillsRegistration(self.isActive),
      });
      [
        { id: "audience", el: audience },
        { id: "benefits", el: benefits },
        { id: "next", el: $("#next") },
      ].forEach(({ id, el }) => {
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => { if (self.isActive) setStation(id); },
        });
      });

      if (reduce) {
        // Спокойный режим: всё видно сразу, сцены не закрепляются
        return () => hidePortal();
      }

      /* ---------- 1. Загрузка первого экрана ---------- */
      gsap.set([...heroLoopPaths, ...painsLoopPaths, ...accents, ...deckArrow], { drawSVG: "0%" });
      // Телефон и планшет: обводка «сложно» рисуется, когда заголовок доехал до середины экрана
      // (на десктопе — вместе с появлением контента сцены, см. ниже)
      if (!desktop) {
        gsap.to(painsLoopPaths, { drawSVG: "100%", duration: 0.8, stagger: 0.3, ease: "power2.inOut", scrollTrigger: { trigger: pains, start: "top 45%", once: true } });
      }
      gsap.set(marks, { "--mark": 0 });

      // Карты стартуют стопкой под студенткой и раскладываются веером на свои места
      const deckBox = layoutRect(deck);
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .from("[data-sc-hero-line]", { yPercent: 45, opacity: 0, duration: 0.9, stagger: 0.08 })
        .from("[data-sc-hero-fade]", { y: 24, opacity: 0, duration: 0.7, stagger: 0.08 }, "-=0.45")
        .from(deckCard, { scale: 0.92, opacity: 0, duration: 0.8 }, 0.25)
        .from(student, { y: 60, opacity: 0, duration: 1 }, 0.35)
        .from(approaches, {
          x: (i, el) => deckBox.width / 2 - (el.offsetLeft + el.offsetWidth / 2),
          y: (i, el) => deckBox.height * 0.62 - (el.offsetTop + el.offsetHeight / 2),
          rotation: (i, el) => -parseFloat(getComputedStyle(el).rotate) || 0,
          scale: 0.8,
          opacity: 0,
          duration: 1.1,
          stagger: 0.07,
          ease: "power4.out",
          clearProps: "transform,opacity",
        }, 0.6)
        .to(heroLoopPaths, { drawSVG: "100%", duration: 0.8, stagger: 0.35, ease: "power2.inOut" }, 0.7)
        .to(marks, { "--mark": 1, duration: 0.55, stagger: 0.18, ease: "power2.out" }, 0.95)
        .to(deckArrow, { drawSVG: "100%", duration: 0.6, stagger: 0.25, ease: "power2.out" }, 1.35)
        .to(accents, { drawSVG: "100%", duration: 0.35, stagger: 0.06, ease: "power2.out" }, 1.5);

      // Чек-лист: пункты выезжают лесенкой
      gsap.set(checks, { x: desktop ? 70 : 0, y: desktop ? 0 : 24, opacity: 0 });
      ScrollTrigger.batch(checks, {
        start: "top 92%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { x: 0, y: 0, opacity: 1, duration: 0.75, stagger: 0.09, ease: "power3.out" }),
      });

      // Станции «Что вы получите»: линия прорисовывается, станции загораются
      const stationPath = $("[data-sc-stations-path]");
      const stationItems = $$("[data-sc-station-item]");
      gsap.set(stationPath, { drawSVG: "0%" });
      gsap.set(stationItems, { opacity: 0.25 });
      gsap.timeline({ scrollTrigger: { trigger: "[data-sc-stations]", start: "top 85%", end: "top 35%", scrub: 0.6 } })
        .to(stationPath, { drawSVG: "100%", ease: "none", duration: 1 }, 0)
        .to(stationItems[0], { opacity: 1, duration: 0.15 }, 0)
        .to(stationItems[1], { opacity: 1, duration: 0.15 }, 0.45)
        .to(stationItems[2], { opacity: 1, duration: 0.15 }, 0.85);
      $$("[data-sc-benefit]").forEach((card, index) => {
        gsap.from(card, { y: 50, opacity: 0, duration: 0.9, delay: index * 0.12, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 88%", once: true } });
      });

      if (!desktop) {
        // Планшет и телефон: экран не закрепляется, а при уходе вверх скругляет нижние углы
        gsap.fromTo(heroFrame, { clipPath: CLIP_FULL }, {
          clipPath: "inset(0% 2.5% 0% 2.5% round 0px 0px 32px 32px)",
          ease: "none",
          scrollTrigger: { trigger: hero, start: "bottom bottom", end: "bottom 30%", scrub: true },
        });
        // «Почему сложно»: заголовок и лента мягко появляются
        gsap.from([".sc-pains_intro", painCards], {
          y: 40, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.1,
          scrollTrigger: { trigger: pains, start: "top 75%", once: true },
        });
        gsap.from(".sc-day", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".sc-day", start: "top 85%", once: true } });

        // Каждая карточка оживает, когда её пролистали в ленту: книги растут, график поднимается…
        const cardIntro = {
          books: (card) => gsap.timeline()
            .from($$(".sc-tome", card), { scaleY: 0, opacity: 0, transformOrigin: "50% 100%", duration: 0.5, stagger: 0.07, ease: "back.out(1.6)" })
            .from($(".sc-chair", card), { y: 24, opacity: 0, duration: 0.6, ease: "power3.out" }, 0.3),
          methods: () => gsap.timeline().add(() => setEvidence(true), 0.4),
          market: (card) => gsap.timeline()
            .from($$(".sc-chart_bars rect", card), { scaleY: 0, transformOrigin: "50% 100%", duration: 0.6, stagger: 0.08, ease: "power2.out" })
            .from($(".sc-chart_line", card), { drawSVG: "0%", duration: 0.7, ease: "power1.inOut" }, 0.25)
            .from($(".sc-chart_head", card), { opacity: 0, duration: 0.2 }, ">-0.05"),
          road: (card) => gsap.timeline()
            .from($(".sc-road_path", card), { drawSVG: "0%", duration: 1.4, ease: "power1.inOut" })
            .from($(".sc-road_flag", card), { scale: 0, transformOrigin: "0% 100%", duration: 0.4, ease: "back.out(2)" }, ">-0.1"),
        };
        const played = new Set();
        const cardTimelines = painItems.map((card) => {
          const timeline = cardIntro[card.dataset.scPain]?.(card);
          timeline?.pause(0);
          return timeline;
        });
        const cardObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const index = painItems.indexOf(entry.target);
            if (!entry.isIntersecting || played.has(index)) return;
            played.add(index);
            cardTimelines[index]?.play();
          });
        }, { root: painCards, threshold: 0.6 });
        // Пока лента не показалась на экране, карточки не запускаем
        const startCards = ScrollTrigger.create({
          trigger: painCards,
          start: "top 70%",
          once: true,
          onEnter: () => painItems.forEach((card) => cardObserver.observe(card)),
        });

        // Финал: клубок рисуется и распрямляется в стрелку по мере прокрутки
        gsap.set(knot, { drawSVG: "0%" });
        gsap.set(knotHead, { opacity: 0 });
        gsap.timeline({ scrollTrigger: { trigger: finale, start: "top 85%", end: "top 25%", scrub: 0.6 } })
          .to(knot, { drawSVG: "100%", ease: "none", duration: 0.5 })
          .to(knot, { morphSVG: KNOT_STRAIGHT, ease: "power1.inOut", duration: 0.5 })
          .to(knotHead, { opacity: 1, duration: 0.1 }, "-=0.1");
        gsap.fromTo($(".sc-mark", finale), { "--mark": 0 }, { "--mark": 1, duration: 0.6, ease: "power2.out", scrollTrigger: { trigger: finaleText, start: "top 75%", once: true } });

        return () => {
          hidePortal();
          cardObserver.disconnect();
          startCards.kill();
        };
      }

      /* ---------- 1 → 2. Фиолетовый экран собирается в карточку и уходит ---------- */
      gsap.timeline({
        scrollTrigger: { trigger: hero, start: "top top", end: "+=70%", pin: true, scrub: 0.5 },
      })
        .fromTo(heroFrame, { clipPath: CLIP_FULL }, { clipPath: "inset(4% 3% 5% 3% round 40px 40px 40px 40px)", ease: "none" }, 0)
        .to(heroBody, { scale: 0.93, yPercent: -2, ease: "none" }, 0)
        .to(heroHeader, { opacity: 0, yPercent: -40, ease: "none", duration: 0.35 }, 0);

      /* ---------- 2 → 3. Карточка-вывод разрастается в тёмную сцену ---------- */
      ScrollTrigger.create({
        trigger: pains,
        // Начинаем, пока карточка-вывод ещё целиком на экране (до того, как она уедет вверх вместе с колонкой)
        start: "top 78%",
        end: "top top",
        onUpdate: (self) => {
          const p = self.progress;
          if (p <= 0 || p >= 1) { hidePortal(); return; }
          const eased = smooth(p);
          const from = result.getBoundingClientRect();
          setPortal(mixRect(from, viewportRect(), eased), lerp(cardRadius(), 0, eased));
          portalText.textContent = resultTitle.textContent;
          portalText.style.opacity = String(clamp(1 - p * 3));
        },
        onLeave: hidePortal,
        onLeaveBack: hidePortal,
      });

      /* ---------- 3. Горизонтальная сцена препятствий ---------- */
      const distance = () => Math.max(0, painsTrack.scrollWidth - window.innerWidth);
      const horizontal = gsap.to(painsTrack, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: pains,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => gsap.set(painsProgress, { scaleX: self.progress }),
        },
      });
      const inTrack = (trigger, start, end) => ({ trigger, containerAnimation: horizontal, start, end, scrub: true });

      // Сначала тёмная плашка закрывает экран, и только потом на ней появляется контент:
      // заголовок, обводка «сложно», затем лесенкой карточки. При прокрутке назад всё прячется.
      gsap.set([painsIntro, ...painItems], { autoAlpha: 0 });
      // Пока плашка растёт, у самой сцены нет тёмного фона — блок появляется только из плашки
      pains.classList.add("is-veiled");
      const painsReveal = gsap.timeline({ paused: true })
        .fromTo(painsIntro, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" })
        .to(painsLoopPaths, { drawSVG: "100%", duration: 0.8, stagger: 0.3, ease: "power2.inOut" }, 0.35)
        .fromTo(painItems, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.09, ease: "power3.out" }, 0.2);
      ScrollTrigger.create({
        trigger: pains,
        start: "top top",
        onEnter: () => { pains.classList.remove("is-veiled"); painsReveal.play(); },
        onLeaveBack: () => { pains.classList.add("is-veiled"); painsReveal.reverse(); },
      });

      // Стопка книг растёт, кресло прорисовывается
      const booksCard = $('[data-sc-pain="books"]');
      gsap.from($$(".sc-tome", booksCard), {
        scaleY: 0, opacity: 0, transformOrigin: "50% 100%", stagger: 0.12, ease: "back.out(1.6)",
        scrollTrigger: inTrack(booksCard, "left 95%", "center 55%"),
      });
      gsap.from($(".sc-chair", booksCard), { y: 30, opacity: 0, ease: "power2.out", scrollTrigger: inTrack(booksCard, "left 70%", "center 45%") });

      // Методы: доказательные подсвечиваются, остальные гаснут
      const methodsCard = $('[data-sc-pain="methods"]');
      ScrollTrigger.create({
        trigger: methodsCard,
        containerAnimation: horizontal,
        start: "center 62%",
        onEnter: () => setEvidence(true),
        onLeaveBack: () => setEvidence(false),
      });

      // Рынок: столбики растут, линия поднимается
      const marketCard = $('[data-sc-pain="market"]');
      gsap.from($$(".sc-chart_bars rect", marketCard), { scaleY: 0, transformOrigin: "50% 100%", stagger: 0.1, ease: "power2.out", scrollTrigger: inTrack(marketCard, "left 90%", "center 50%") });
      gsap.timeline({ scrollTrigger: inTrack(marketCard, "left 70%", "center 40%") })
        .from($(".sc-chart_line", marketCard), { drawSVG: "0%", ease: "none", duration: 0.9 })
        .from($(".sc-chart_head", marketCard), { opacity: 0, duration: 0.1 });

      // Дорога на годы прорисовывается медленно
      const roadCard = $('[data-sc-pain="road"]');
      gsap.timeline({ scrollTrigger: inTrack(roadCard, "left 95%", "right 40%") })
        .from($(".sc-road_path", roadCard), { drawSVG: "0%", ease: "none", duration: 0.9 })
        .from($(".sc-road_flag", roadCard), { scale: 0, transformOrigin: "0% 100%", ease: "back.out(2)", duration: 0.1 });

      // Финал: клубок рисуется, потом распрямляется в стрелку
      const straight = KNOT_STRAIGHT;
      gsap.set(knot, { drawSVG: "0%" });
      gsap.set(knotHead, { opacity: 0 });
      gsap.timeline({ scrollTrigger: inTrack(finale, "left 85%", "left 8%") })
        .to(knot, { drawSVG: "100%", ease: "none", duration: 0.45 })
        .to(knot, { morphSVG: straight, ease: "power1.inOut", duration: 0.55 })
        .to(knotHead, { opacity: 1, duration: 0.1 }, "-=0.1");

      // Буквы фразы прилетают и собираются, как в примере GreenSock
      const split = SplitText.create(finaleText, { type: "words,chars" });
      gsap.from(split.chars, {
        yPercent: () => gsap.utils.random(-320, 320),
        rotation: () => gsap.utils.random(-75, 75),
        opacity: 0,
        ease: "power3.out",
        stagger: { each: 0.012, from: "random" },
        scrollTrigger: inTrack(finale, "left 98%", "left 18%"),
      });
      gsap.fromTo($(".sc-mark", finale), { "--mark": 0 }, { "--mark": 1, ease: "none", scrollTrigger: inTrack(finale, "left 20%", "left 2%") });
      gsap.from($(".sc-finale_actions", finale), { y: 30, opacity: 0, ease: "none", scrollTrigger: inTrack(finale, "left 22%", "left 2%") });

      /* ---------- 3 → 4. Тёмная сцена сжимается в карточку дня конференции ---------- */
      const dayItems = $$(".sc-day_item", day);
      gsap.set(dayItems, { opacity: 0, y: 16 });
      let dayShown = false;
      ScrollTrigger.create({
        trigger: benefits,
        start: "top 72%",
        endTrigger: day,
        end: "center 58%",
        onUpdate: (self) => {
          const p = self.progress;
          if (p <= 0 || p >= 1) { hidePortal(); return; }
          const eased = smooth(clamp((p - 0.12) / 0.88));
          portalText.textContent = "";
          setPortal(mixRect(viewportRect(), day.getBoundingClientRect(), eased), lerp(0, cardRadius(), eased), clamp(p / 0.12));
        },
        onLeave: () => {
          hidePortal();
          if (!dayShown) {
            dayShown = true;
            gsap.to(dayItems, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" });
          }
        },
        onLeaveBack: hidePortal,
      });

      /* ---------- 5. Антипозиция: фото на весь экран → карточка ленты ---------- */
      flyer.style.display = "block";
      const targetImg = ribbonTarget.querySelector("img");
      const ribbonImgs = $$(".sc-ribbon_item img", ribbon);
      gsap.set(strike, { drawSVG: "0%" });
      const renderAnti = (progress) => {
        const stage = antiStage.getBoundingClientRect();
        const flight = smooth(clamp(progress / 0.42));

        // Лента всё время медленно едет влево, картинки внутри — чуть медленнее (параллакс)
        const shift = lerp(10, -32, progress);
        ribbon.style.transform = `translate3d(${shift}vw, 0, 0)`;
        ribbonImgs.forEach((img, index) => {
          img.style.transform = `translate3d(${lerp(-4, 4, progress) * (index % 2 ? 1 : -1)}%, 0, 0) scale(1.08)`;
        });

        const target = ribbonTarget.getBoundingClientRect();
        const from = { left: 0, top: 0, width: stage.width, height: stage.height };
        const to = { left: target.left - stage.left, top: target.top - stage.top, width: target.width, height: target.height };
        const box = mixRect(from, to, flight);
        flyer.style.left = `${box.left}px`;
        flyer.style.top = `${box.top}px`;
        flyer.style.width = `${box.width}px`;
        flyer.style.height = `${box.height}px`;
        flyer.style.borderRadius = `${lerp(0, 20, flight)}px`;
        flyer.style.visibility = flight >= 1 ? "hidden" : "visible";
        targetImg.style.opacity = flight >= 1 ? "1" : "0";

        // Заголовок переворачивается в 3D и встаёт на место
        const titleProgress = clamp((progress - 0.22) / 0.3);
        const tEase = smooth(titleProgress);
        antiTitle.style.opacity = String(tEase);
        antiTitle.style.transform = `perspective(${lerp(1000, 600, tEase)}px) translate3d(0, ${lerp(140, 0, tEase)}px, 0) rotateX(${lerp(80, 0, tEase)}deg)`;
        gsap.set(strike, { drawSVG: `${clamp((progress - 0.52) / 0.14) * 100}%` });
        antiSide.style.opacity = String(clamp((progress - 0.5) / 0.15));
      };
      const antiTrigger = ScrollTrigger.create({
        trigger: anti,
        start: "top bottom",
        end: "bottom bottom",
        onUpdate: (self) => {
          // До прилипания сцены фото просто въезжает снизу во весь экран
          const pinnedStart = window.innerHeight / Math.max(1, self.end - self.start);
          renderAnti(clamp((self.progress - pinnedStart) / (1 - pinnedStart)));
        },
      });
      renderAnti(0);

      // Пересчитать порядок сцен: закрепления выше по странице сдвигают всё, что ниже
      ScrollTrigger.sort();
      ScrollTrigger.refresh();

      return () => {
        pains.classList.remove("is-veiled");
        split.revert();
        hidePortal();
        antiTrigger.kill();
        flyer.style.display = "";
        [ribbon, antiTitle, ...ribbonImgs].forEach((node) => node.removeAttribute("style"));
        targetImg.style.opacity = "";
        antiSide.style.opacity = "";
      };
    },
  );

  // Пересчитать маршрут и сцены, когда догрузились шрифты и картинки
  const refresh = () => ScrollTrigger.refresh();
  document.fonts?.ready.then(refresh);
  on(window, "load", refresh);

  window.__scCleanup = () => {
    mm.revert();
    disposers.forEach((dispose) => dispose());
    pairs.set("a");
  };
})();
