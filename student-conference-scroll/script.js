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
  let recommendedTrack = "A"; // трек, который советует чек-лист; по нему открывается программа

  const renderResult = () => {
    const selected = checks.filter((check) => check.getAttribute("aria-pressed") === "true");
    const count = selected.length;
    const tally = { A: 0, B: 0, C: 0 };
    selected.forEach((check) => { tally[check.dataset.track] += 1; });
    const best = ["A", "B", "C"].reduce((winner, key) => (tally[key] > tally[winner] ? key : winner), "A");
    recommendedTrack = best;

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
     (картинка assets/highlight.webp, нарисована по #sc-hl). Строки закрашиваются по очереди, слева направо — как маркером в тетради.
     --------------------------------------------------------------------- */
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Полоса маркера — готовая картинка (отрисована из #sc-hl один раз, так быстрее в Safari)
  const HL_SVG = '<svg viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true"><image href="assets/highlight.webp" x="-6" y="-6" width="412" height="52" preserveAspectRatio="none"/></svg>';
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
  // Полосы маркера под строками текста target. Кладутся в host — у него position: relative.
  // key помечает полосы, чтобы потом снять только их
  const drawStrips = (host, target, animate, key = "") => {
    const base = host.getBoundingClientRect();
    let delay = 0;
    textLines(target).forEach((line) => {
      const strip = document.createElement("span");
      const height = line.bottom - line.top;
      strip.className = "sc-hl";
      strip.innerHTML = HL_SVG;
      if (key) strip.dataset.hlKey = key;
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
  const fadeStrips = (strips) => {
    strips.forEach((strip) => {
      if (reduceMotion() || !strip.animate) { strip.remove(); return; }
      strip.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: "ease-out" }).onfinish = () => strip.remove();
    });
  };
  const paintHighlight = (check, animate) => {
    const host = $(".sc-check_text", check);
    $$(".sc-hl", host).forEach((node) => node.remove());
    drawStrips(host, $(".sc-check_hl", check), animate);
  };
  const eraseHighlight = (check) => fadeStrips($$(".sc-hl", check));

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
  let dockRefresh = 0;
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
    // Свёрнутая и раскрытая карточка разной высоты — всё, что ниже, сдвигается.
    // Пересчитать точки срабатывания анимаций ниже по странице, иначе они сработают раньше времени
    if (docked !== resultCard.classList.contains("is-docked")) {
      window.clearTimeout(dockRefresh);
      dockRefresh = window.setTimeout(() => window.ScrollTrigger?.refresh(), 250);
    }
    resultCard.classList.toggle("is-docked", docked);
    // Список ещё не доехал до экрана — свёрнутую карточку не показываем
    resultCard.classList.toggle("is-away", docked && list.top > window.innerHeight * 0.75);
  };
  const requestDock = () => { if (!dockFrame) dockFrame = window.requestAnimationFrame(updateDock); };
  on(window, "scroll", requestDock, { passive: true });
  on(window, "resize", requestDock);
  updateDock();
  disposers.push(() => { window.cancelAnimationFrame(dockFrame); window.clearTimeout(dockRefresh); });

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
     Лента со свайпом и точками (отзывы): точки показывают текущую карточку и листают к нужной.
     --------------------------------------------------------------------- */
  const setupDots = (scroller, dots) => {
    if (!scroller || !dots.length) return;
    const items = [...scroller.children];
    const pad = () => parseFloat(getComputedStyle(scroller).scrollPaddingLeft) || 0;
    let frame = 0;
    const sync = () => {
      frame = 0;
      const box = scroller.getBoundingClientRect();
      let current = 0;
      let best = Infinity;
      items.forEach((item, index) => {
        const distance = Math.abs(item.getBoundingClientRect().left - box.left - pad());
        if (distance < best) { best = distance; current = index; }
      });
      if (scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 4) current = items.length - 1;
      dots.forEach((dot, index) => dot.setAttribute("aria-pressed", String(index === current)));
    };
    on(scroller, "scroll", () => { if (!frame) frame = window.requestAnimationFrame(sync); }, { passive: true });
    dots.forEach((dot, index) => on(dot, "click", () => {
      const left = scroller.scrollLeft + items[index].getBoundingClientRect().left - scroller.getBoundingClientRect().left - pad();
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      scroller.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
    }));
    disposers.push(() => window.cancelAnimationFrame(frame));
  };

  // Отзывы с «Отзовика» на телефоне — слайдер с точками
  setupDots($("[data-sc-otz-list]"), $$("[data-sc-otz-dots] button"));

  /* ---------------------------------------------------------------------
     Эксперты: экран на спикера.
     Десктоп: виден один спикер; портрет в ленте показывает своего, вкладка трека
     оставляет в ленте только его спикеров и открывает первого.
     Телефон и планшет: видны все спикеры выбранного трека — они листаются слайдером, под ним точки.
     Работает и без GSAP — тогда экраны просто сменяются.
     --------------------------------------------------------------------- */
  const speakersSection = $("[data-sc-speakers]");
  const speakersScene = $("[data-sc-speakers-scene]");
  const speakerDots = $("[data-sc-speaker-dots]");
  const speakerCards = speakersSection ? $$(".sc-speaker", speakersSection) : [];
  const faceButtons = speakersSection ? $$("[data-sc-face]", speakersSection) : [];
  const trackButtons = speakersSection ? $$("[data-sc-track]", speakersSection) : [];
  const desktopQuery = matchMedia("(min-width: 64.0625rem)");
  const prefersReduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let currentTrack = "hall";
  let currentSpeaker = speakerCards.find((card) => !card.hidden) || speakerCards[0];
  let speakerTimeline = null;
  const trackCards = () => speakerCards.filter((card) => card.dataset.track === currentTrack);

  // Точки слайдера: по одной на спикера трека, текущая подсвечена
  let slideFrame = 0;
  const syncSlideDots = () => {
    slideFrame = 0;
    if (!speakerDots) return;
    const cards = trackCards();
    const box = speakersScene.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(speakersScene).scrollPaddingLeft) || 0;
    let current = 0;
    let best = Infinity;
    cards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - box.left - pad);
      if (distance < best) { best = distance; current = index; }
    });
    if (speakersScene.scrollLeft + speakersScene.clientWidth >= speakersScene.scrollWidth - 4) current = cards.length - 1;
    $$("button", speakerDots).forEach((dot, index) => dot.setAttribute("aria-pressed", String(index === current)));
  };
  const buildSlideDots = () => {
    if (!speakerDots) return;
    const cards = trackCards();
    speakerDots.innerHTML = cards.map((card, index) => {
      const name = $(".sc-speaker_name", card)?.textContent.trim() || "";
      return `<button class="sc-pains_dot" type="button" aria-label="Спикер ${index + 1}: ${name}" aria-pressed="${index === 0}"></button>`;
    }).join("");
    $$("button", speakerDots).forEach((dot, index) => dot.addEventListener("click", () => {
      const card = cards[index];
      const pad = parseFloat(getComputedStyle(speakersScene).scrollPaddingLeft) || 0;
      const left = speakersScene.scrollLeft + card.getBoundingClientRect().left - speakersScene.getBoundingClientRect().left - pad;
      speakersScene.scrollTo({ left, behavior: prefersReduce() ? "auto" : "smooth" });
    }));
  };

  // Раскладка под текущую ширину экрана
  const applySpeakersLayout = () => {
    if (!speakersSection) return;
    faceButtons.forEach((face) => { face.closest("li").hidden = face.closest("li").dataset.track !== currentTrack; });
    if (desktopQuery.matches) {
      speakerCards.forEach((card) => { card.hidden = card !== currentSpeaker; });
    } else {
      speakerCards.forEach((card) => { card.hidden = card.dataset.track !== currentTrack; });
      speakersScene.scrollLeft = 0;
      buildSlideDots();
    }
  };

  const showSpeaker = (id) => {
    const next = $(`#speaker-${id}`, speakersSection);
    faceButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.scFace === id)));
    if (!next || next === currentSpeaker) return;
    const prev = currentSpeaker;
    currentSpeaker = next;
    if (!desktopQuery.matches) return;
    speakerTimeline?.progress(1).kill();
    if (!window.gsap || prefersReduce()) {
      prev.hidden = true;
      next.hidden = false;
      return;
    }
    const parts = (card) => ({
      photo: $(".sc-speaker_photo", card),
      card: $(".sc-speaker_card", card),
      talks: $$(".sc-talk", card),
      tags: $$(".sc-speaker_tags li", card),
    });
    const a = parts(prev);
    const b = parts(next);
    speakerTimeline = gsap.timeline({ defaults: { ease: "power3.out" } })
      .to([a.card, ...a.talks, ...a.tags], { opacity: 0, y: -16, duration: 0.22, ease: "power2.in" }, 0)
      .to(a.photo, { opacity: 0, y: 30, duration: 0.26, ease: "power2.in" }, 0)
      .add(() => {
        prev.hidden = true;
        gsap.set([a.photo, a.card, ...a.talks, ...a.tags], { clearProps: "opacity,transform" });
        next.hidden = false;
      })
      .from(b.photo, { opacity: 0, y: 70, duration: 0.7 })
      .from(b.card, { opacity: 0, x: -50, rotation: -8, duration: 0.6 }, "<0.08")
      .from(b.talks, { opacity: 0, x: 50, duration: 0.55, stagger: 0.08 }, "<0.05")
      .from(b.tags, { opacity: 0, scale: 0.6, duration: 0.45, stagger: 0.06, ease: "back.out(2)" }, "<0.1");
  };

  faceButtons.forEach((button) => on(button, "click", () => showSpeaker(button.dataset.scFace)));
  trackButtons.forEach((button) => on(button, "click", () => {
    currentTrack = button.dataset.scTrack;
    trackButtons.forEach((other) => other.setAttribute("aria-pressed", String(other === button)));
    const first = speakerCards.find((card) => card.dataset.track === currentTrack);
    if (desktopQuery.matches) {
      faceButtons.forEach((face) => { face.closest("li").hidden = face.closest("li").dataset.track !== currentTrack; });
      if (first) showSpeaker(first.id.replace("speaker-", ""));
    } else {
      if (first) {
        currentSpeaker = first;
        faceButtons.forEach((face) => face.setAttribute("aria-pressed", String(`speaker-${face.dataset.scFace}` === first.id)));
      }
      applySpeakersLayout();
    }
  }));
  if (speakersScene) on(speakersScene, "scroll", () => { if (!slideFrame) slideFrame = window.requestAnimationFrame(syncSlideDots); }, { passive: true });
  on(desktopQuery, "change", () => { speakerTimeline?.progress(1).kill(); applySpeakersLayout(); });
  applySpeakersLayout();
  disposers.push(() => { speakerTimeline?.kill(); window.cancelAnimationFrame(slideFrame); });

  // Открыть экран спикера: выбрать его трек и его самого (на телефоне — долистать слайдер до него)
  const openSpeaker = (id) => {
    const card = speakersSection && $(`#speaker-${id}`, speakersSection);
    if (!card) return;
    const trackButton = trackButtons.find((button) => button.dataset.scTrack === card.dataset.track);
    if (trackButton && trackButton.getAttribute("aria-pressed") !== "true") trackButton.click();
    if (desktopQuery.matches) {
      showSpeaker(id);
    } else {
      currentSpeaker = card;
      const pad = parseFloat(getComputedStyle(speakersScene).scrollPaddingLeft) || 0;
      speakersScene.scrollLeft += card.getBoundingClientRect().left - speakersScene.getBoundingClientRect().left - pad;
    }
  };

  /* ---------------------------------------------------------------------
     Программа: вкладки трёх треков. Общие блоки (открытие, хедлайнер, финал) одинаковые на всех.
     Вкладка ставит секции data-view, а что показать — решает CSS.
     Стрелки влево/вправо переключают вкладки, как в обычных табах.
     Работает и без GSAP — тогда строки появляются без анимации.
     --------------------------------------------------------------------- */
  const program = $("[data-sc-program]");
  const programTabs = program ? $$("[data-sc-program-tab]", program) : [];
  const programPanel = program && $("[data-sc-program-panel]", program);
  const visibleRows = () => $$(".sc-slot", program).filter((row) => getComputedStyle(row).display !== "none");
  let programRefresh = 0;

  const setProgramView = (view, { focus = false, animate = true } = {}) => {
    if (!program) return;
    const tab = programTabs.find((item) => item.dataset.scProgramTab === view) || programTabs[0];
    programTabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    programPanel?.setAttribute("aria-labelledby", tab.id);
    program.dataset.view = tab.dataset.scProgramTab;
    if (focus) tab.focus();
    // На телефоне выбранная вкладка доезжает до видимой части ленты вкладок
    tab.scrollIntoView({ block: "nearest", inline: "nearest" });
    if (animate && window.gsap && !prefersReduce()) {
      gsap.fromTo(visibleRows(), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.04, ease: "power3.out", overwrite: true, clearProps: "opacity,transform" });
    }
    // Высота блока изменилась — пересчитать точки прокрутки ниже него
    window.clearTimeout(programRefresh);
    programRefresh = window.setTimeout(() => window.ScrollTrigger?.refresh(), 120);
  };

  programTabs.forEach((tab, index) => {
    on(tab, "click", () => setProgramView(tab.dataset.scProgramTab));
    on(tab, "keydown", (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        setProgramView(programTabs[event.key === "Home" ? 0 : programTabs.length - 1].dataset.scProgramTab, { focus: true });
      } else if (step) {
        event.preventDefault();
        const next = programTabs[(index + step + programTabs.length) % programTabs.length];
        setProgramView(next.dataset.scProgramTab, { focus: true });
      }
    });
  });

  // Спикер в программе ведёт на свой экран в «Экспертах»
  if (program) {
    $$("[data-sc-open-speaker]", program).forEach((link) => on(link, "click", () => openSpeaker(link.dataset.scOpenSpeaker)));
  }

  // Кнопка под чек-листом «Для кого» открывает программу на подходящем треке
  const resultLink = $("[data-sc-result-link]");
  if (resultLink) {
    on(resultLink, "click", () => {
      const picked = checks.some((check) => check.getAttribute("aria-pressed") === "true");
      setProgramView(picked ? recommendedTrack.toLowerCase() : "a", { animate: false });
    });
  }

  disposers.push(() => window.clearTimeout(programRefresh));

  /* ---------------------------------------------------------------------
     «После конференции»: карточки с карандашными рисунками.
     Мышь: карточка активна, пока на неё наведён курсор (или на ней фокус с клавиатуры).
     Телефон и планшет: наведения нет — активна карточка, которая сейчас в середине экрана.
     Активная карточка темнеет, в углу крупно рисуется карандашный рисунок, сверху — доклад.
     --------------------------------------------------------------------- */
  const outSection = $("[data-sc-out]");
  const outCards = outSection ? $$("[data-sc-out-card]", outSection) : [];
  const hoverQuery = matchMedia("(hover: hover) and (pointer: fine)");
  // Дорисовать рисунок карточки (карандаш ведёт линии заново)
  const drawOutArt = (card) => {
    if (!window.gsap || !window.DrawSVGPlugin || prefersReduce()) return;
    gsap.fromTo($$(".sc-out_ill path", card), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.9, stagger: 0.04, ease: "power1.inOut", overwrite: true });
  };
  const setOutActive = (card, active) => {
    if (card.classList.contains("is-active") === active) return;
    card.classList.toggle("is-active", active);
    if (active) drawOutArt(card);
  };
  outCards.forEach((card) => {
    on(card, "mouseenter", () => { if (hoverQuery.matches) setOutActive(card, true); });
    on(card, "mouseleave", () => { if (hoverQuery.matches && !card.contains(document.activeElement)) setOutActive(card, false); });
    on(card, "focusin", () => setOutActive(card, true));
    on(card, "focusout", (event) => { if (!card.contains(event.relatedTarget) && !(hoverQuery.matches && card.matches(":hover"))) setOutActive(card, false); });
  });
  // Без мыши активна одна карточка — та, чей центр ближе всего к середине экрана
  let outFrame = 0;
  const pickOutCard = () => {
    outFrame = 0;
    if (hoverQuery.matches || !outCards.length) return;
    const middle = window.innerHeight / 2;
    let best = null;
    let bestDistance = window.innerHeight * 0.35; // дальше — ни одна не активна (блок ещё не на экране)
    outCards.forEach((card) => {
      const box = card.getBoundingClientRect();
      const distance = Math.abs(box.top + box.height / 2 - middle);
      if (distance < bestDistance) { bestDistance = distance; best = card; }
    });
    outCards.forEach((card) => setOutActive(card, card === best || card.contains(document.activeElement)));
  };
  if (outCards.length) {
    on(window, "scroll", () => { if (!outFrame) outFrame = window.requestAnimationFrame(pickOutCard); }, { passive: true });
    on(window, "resize", pickOutCard);
    disposers.push(() => window.cancelAnimationFrame(outFrame));
  }
  on(hoverQuery, "change", () => outCards.forEach((card) => setOutActive(card, false)));
  /* ---------------------------------------------------------------------
     Регистрация: бейдж подписывается именем из формы, трек на нём — из чек-листа «Для кого».
     Переключатель формата меняет надпись на кнопке. Форма — макет: на Тильде её заменит форма Тильды,
     здесь она только проверяет поля и показывает сообщение об успехе.
     --------------------------------------------------------------------- */
  const reg = $("[data-sc-reg]");
  const regForm = reg && $("[data-sc-form]", reg);
  const badgeName = reg && $("[data-sc-badge-name]", reg);
  const badgeTrack = reg && $("[data-sc-badge-track]", reg);
  const lanyard = reg && $("[data-sc-lanyard]", reg);
  const TRACK_NAMES = { A: "С\u00a0чего начать", B: "Выбор метода", C: "Путь с\u00a0нуля" };
  let swingTween = null;
  const swingBadge = (strength = 3) => {
    if (!window.gsap || !lanyard || prefersReduce()) return;
    swingTween?.kill();
    swingTween = gsap.fromTo(lanyard, { rotation: strength }, { rotation: 0, duration: 1.2, ease: "elastic.out(1, 0.3)" });
  };
  // Длинное имя: уменьшаем шрифт (не больше чем на четверть), пока самое длинное слово не поместится в строку.
  // Не поместилось и так — слово переносится по краю; больше трёх строк скрывает многоточие (CSS)
  const BADGE_NAME_MAX = 50; // символов на бейдже, дальше «…»
  const fitBadgeName = () => {
    if (!badgeName) return;
    badgeName.classList.remove("is-broken");
    badgeName.style.fontSize = "";
    const base = parseFloat(getComputedStyle(badgeName).fontSize);
    let size = base;
    while (badgeName.scrollWidth > badgeName.clientWidth + 1 && size > base * 0.75) {
      size -= 1;
      badgeName.style.fontSize = `${size}px`;
    }
    if (badgeName.scrollWidth > badgeName.clientWidth + 1) badgeName.classList.add("is-broken");
  };
  const syncBadgeTrack = () => {
    if (!badgeTrack) return;
    const picked = checks.some((check) => check.getAttribute("aria-pressed") === "true");
    badgeTrack.textContent = picked ? `трек «${TRACK_NAMES[recommendedTrack]}»` : "Три трека на\u00a0выбор";
  };
  if (regForm) {
    const nameInput = $("[data-sc-form-name]", regForm);
    const submit = $("[data-sc-form-submit]", regForm);
    const done = $("[data-sc-form-done]", regForm);
    const doneText = $("[data-sc-form-done-text]", regForm);
    let lastSwing = 0;
    on(nameInput, "input", () => {
      const value = nameInput.value.trim();
      badgeName.textContent = value.length > BADGE_NAME_MAX ? `${value.slice(0, BADGE_NAME_MAX).trimEnd()}…` : value || "Ваше имя";
      badgeName.classList.toggle("is-empty", !value);
      fitBadgeName();
      // Бейдж покачивается от нового имени, но не чаще раза в полсекунды
      if (Date.now() - lastSwing > 500) { lastSwing = Date.now(); swingBadge(2); }
    });
    $$("[data-sc-tariff]", regForm).forEach((radio) => on(radio, "change", () => {
      submit.textContent = radio.value.startsWith("Бесплатно") ? "Зарегистрироваться бесплатно" : "Перейти к\u00a0оплате 1\u00a0999\u00a0₽";
    }));

    /* Телефон: выбор страны, маска по ходу набора и проверка номера (intl-tel-input, как на других лендингах).
       На Тильде этим займётся маска её формы. */
    const phoneInput = $("[data-sc-phone]", regForm);
    let phoneIntl = null;
    let phoneUtilsReady = false;
    if (phoneInput && typeof window.intlTelInput === "function") {
      phoneIntl = window.intlTelInput(phoneInput, {
        countryNameLocale: "ru",
        countryOrder: ["ru", "kz", "by", "uz"],
        countrySearch: true,
        countrySelectorMode: "AUTO",
        dropdownParent: document.body,
        formatAsYouType: true,
        initialCountry: "ru",
        loadUtils: () => import("https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/js/utils.js"),
        numberDisplayFormat: "INTERNATIONAL",
        placeholderNumberPolicy: "AGGRESSIVE",
        separateDialCode: true,
        strictMode: true,
        uiTranslations: {
          selectedCountryAriaLabel: "Изменить страну номера, выбрана ${countryName} (${dialCode})",
          noCountrySelected: "Выбрать страну номера телефона",
          countryListAriaLabel: "Список стран",
          searchPlaceholder: "Поиск страны или кода",
          clearSearchAriaLabel: "Очистить поиск",
          searchEmptyState: "Страна не найдена",
          searchSummaryAria: (count) => `Найдено стран: ${count}`,
        },
      });
      phoneIntl.promise.then(() => { phoneUtilsReady = true; }).catch(() => { phoneUtilsReady = false; });
      disposers.push(() => phoneIntl?.destroy());
    }

    // Проверки: имя — любое непустое, телефон — по правилам выбранной страны, почта — по шаблону адреса
    const EMAIL_PATTERN = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
    const fieldMessage = (input) => {
      const value = input.value.trim();
      if (input.name === "name") return value ? "" : "Напишите, как к\u00a0вам обращаться";
      if (input.name === "phone") {
        if (!value) return "Введите номер телефона";
        if (phoneIntl && phoneUtilsReady) return phoneIntl.isValidNumber() ? "" : "Проверьте номер: похоже, в\u00a0нём не\u00a0хватает или лишние цифры";
        const digits = value.replace(/\D/g, "");
        return digits.length >= 10 && digits.length <= 15 ? "" : "Проверьте номер телефона";
      }
      if (input.name === "email") {
        if (!value) return "Введите почту";
        return EMAIL_PATTERN.test(value) ? "" : "Проверьте почту: например, name@mail.ru";
      }
      return "";
    };
    const showFieldMessage = (input, message) => {
      const field = input.closest("[data-sc-field]");
      field.classList.toggle("is-invalid", Boolean(message));
      input.setAttribute("aria-invalid", String(Boolean(message)));
      $(".sc-field_error", field).textContent = message;
    };
    const fieldInputs = $$(".sc-field_input", regForm);
    fieldInputs.forEach((input) => {
      // Клик по любому месту поля ставит курсор в него (кроме выбора страны)
      on(input.closest("[data-sc-field]"), "click", (event) => { if (!event.target.closest("button, .iti__country-container")) input.focus(); });
      // Ошибку показываем, когда человек ушёл из поля; пока исправляет — проверяем на лету
      on(input, "blur", () => { if (input.value.trim()) showFieldMessage(input, fieldMessage(input)); });
      on(input, "input", () => { if (input.getAttribute("aria-invalid") === "true") showFieldMessage(input, fieldMessage(input)); });
    });
    if (phoneInput) on(phoneInput, "countrychange", () => { if (phoneInput.value.trim()) showFieldMessage(phoneInput, fieldMessage(phoneInput)); });

    on(regForm, "submit", (event) => {
      event.preventDefault();
      const invalid = fieldInputs.filter((input) => {
        const message = fieldMessage(input);
        showFieldMessage(input, message);
        return Boolean(message);
      });
      if (invalid.length) { invalid[0].focus(); return; }
      // Номер в международном виде (+79991234567) — в таком виде его ждёт форма Тильды
      if (phoneIntl && phoneUtilsReady) regForm.dataset.phoneE164 = phoneIntl.getNumber();
      const messenger = $("input[name='messenger']:checked", regForm)?.value || "Telegram";
      doneText.textContent = `Ссылку на\u00a0эфир пришлём в\u00a0${messenger} утром 21\u00a0ноября.`;
      done.hidden = false;
      swingBadge(6);
    });
  }
  if (badgeName) on(window, "resize", fitBadgeName);
  if (reg && "IntersectionObserver" in window) {
    const regObserver = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) syncBadgeTrack(); });
    regObserver.observe(reg);
    disposers.push(() => regObserver.disconnect());
  }
  disposers.push(() => swingTween?.kill());

  // Год в подвале — текущий
  $$("[data-sc-year]").forEach((node) => { node.textContent = String(new Date().getFullYear()); });

  // Доклад в карточке открывает программу на своём треке
  $$("[data-sc-program-open]").forEach((link) => on(link, "click", () => setProgramView(link.dataset.scProgramOpen, { animate: false })));


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

  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

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
  const benefits = $("[data-sc-benefits]");
  const day = $("[data-sc-day]");
  const anti = $("[data-sc-anti]");
  const antiStage = $("[data-sc-anti-stage]");
  const antiTitle = $("[data-sc-anti-title]");
  const antiSide = $("[data-sc-anti-side]");
  const strikes = $$("[data-sc-strike]");
  // Зачёркнутые слова антипозиции: основная линия и тонкий второй проход у каждого
  const strikeWords = $$(".sc-strike", anti || page).map((word) => ({ main: $("path:not(.is-second)", word), second: $("path.is-second", word) }));
  const ribbon = $("[data-sc-ribbon]");
  const ribbonTarget = $("[data-sc-ribbon-target]");
  const flyer = $("[data-sc-flyer]");
  const proof = $("[data-sc-proof]");
  const proofCloud = $("[data-sc-proof-cloud]");
  const proofTitle = $("[data-sc-proof-title]");
  const proofNum = $("[data-sc-proof-num]");
  const proofCount = $("[data-sc-proof-count]");
  const proofPlus = $("[data-sc-proof-plus]");
  const proofCaption = $("[data-sc-proof-caption]");
  const countTargets = $$("[data-sc-count-to]");

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
      const { desktop, mobile, reduce } = context.conditions;

      // Навигация после первого экрана: появляется, линия заполняется по мере прокрутки
      ScrollTrigger.create({
        trigger: hero,
        // Десктоп: плашка видна всегда (CSS). Телефон и планшет: выезжает, когда ушла шапка первого экрана
        start: () => (desktop ? `top+=${window.innerHeight * 0.25} top` : "top+=96 top"),
        end: "max",
        // Конец страницы считаем последним — после всех закреплённых сцен, иначе он получается раньше реального
        refreshPriority: -1,
        // Видимость считаем по доле прокрутки, а не по «активности» триггера:
        // в самом низу страницы и при прыжке по якорю навигация не должна пропадать
        onUpdate: (self) => {
          page.style.setProperty("--progress", self.progress.toFixed(4));
          floats.forEach((node) => node.classList.toggle("is-visible", self.progress > 0));
        },
        onRefresh: (self) => floats.forEach((node) => node.classList.toggle("is-visible", self.progress > 0)),
      });
      ScrollTrigger.create({
        trigger: audience,
        start: "top 20%",
        end: "max",
        refreshPriority: -1,
        onUpdate: (self) => setPillsRegistration(self.progress > 0),
        onRefresh: (self) => setPillsRegistration(self.progress > 0),
      });
      [
        { id: "audience", el: audience },
        { id: "benefits", el: benefits },
        { id: "experts", el: $("#experts") },
        { id: "program", el: $("#program") },
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
        // Антипозиция: карандаш зачёркивает «мотивационных», потом «речей»
        if (antiTitle && strikeWords.length) {
          gsap.set(strikes, { drawSVG: "0%" });
          const strikeTl = gsap.timeline({ scrollTrigger: { trigger: antiTitle, start: "top 65%", once: true } });
          strikeWords.forEach((word, index) => {
            strikeTl
              .to(word.main, { drawSVG: "100%", duration: index === 0 ? 0.9 : 0.6, ease: "power1.inOut" }, index === 0 ? 0 : ">-0.15")
              .to(word.second, { drawSVG: "100%", duration: 0.3, ease: "power1.out" }, ">-0.1");
          });
        }
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

      // Станции «Что вы получите»: отрезки линии прорисовываются от станции к станции, подписи загораются.
      // Телефон: линия идёт вниз вдоль всего списка. Планшет и десктоп: вправо, пока станции въезжают на экран.
      const stages = $$("[data-sc-station-item]");
      const stageLabels = stages.map((stage) => $(".sc-stage_label", stage));
      gsap.set(stages, { "--line": 0 });
      gsap.set(stageLabels, { opacity: 0.3 });
      const stagesTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: "[data-sc-stations]",
          start: mobile ? "top 70%" : "top 85%",
          end: mobile ? "bottom 80%" : "top 40%",
          scrub: 0.6,
        },
      });
      stages.forEach((stage, index) => {
        stagesTimeline.to(stageLabels[index], { opacity: 1, duration: 0.15 }, index);
        if (index < stages.length - 1) stagesTimeline.to(stage, { "--line": 1, ease: "none", duration: 0.85 }, index + 0.15);
      });
      $$("[data-sc-benefit]").forEach((card, index) => {
        gsap.from(card, { y: 50, opacity: 0, duration: 0.9, delay: index * 0.12, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 88%", once: true } });
      });

      // Эксперты: при появлении слово-фон выезжает, спикер поднимается, карточки слетаются, портреты встают по очереди
      if (speakersSection) {
        const first = currentSpeaker;
        gsap.timeline({ defaults: { ease: "power3.out" }, scrollTrigger: { trigger: speakersSection, start: "top 65%", once: true } })
          .from(".sc-speakers_watermark", { yPercent: 35, opacity: 0, duration: 1 })
          .from($(".sc-speaker_photo", first), { y: 90, opacity: 0, duration: 0.9 }, 0.15)
          .from($(".sc-speaker_card", first), { x: -60, rotation: -9, opacity: 0, duration: 0.7 }, 0.4)
          .from($$(".sc-talk", first), { x: 60, opacity: 0, duration: 0.6, stagger: 0.1 }, 0.45)
          .from($$(".sc-speaker_tags li", first), { scale: 0.6, opacity: 0, duration: 0.45, stagger: 0.07, ease: "back.out(2)" }, 0.7)
          .from(".sc-faces li:not([hidden]) .sc-face", { y: 24, opacity: 0, duration: 0.5, stagger: 0.05 }, 0.5);
      }

      // Программа: заголовок, подводка и вкладки поднимаются, следом строки расписания — по очереди
      if (program) {
        gsap.timeline({ defaults: { ease: "power3.out" }, scrollTrigger: { trigger: program, start: "top 70%", once: true } })
          .from($$("[data-sc-program-reveal]", program), { y: 40, opacity: 0, duration: 0.8, stagger: 0.08, clearProps: "opacity,transform" })
          .from($$(".sc-slot", program), { y: 24, opacity: 0, duration: 0.6, stagger: 0.05, clearProps: "opacity,transform" }, 0.3);
      }

      // Программа при уходе вверх сужается и скругляет нижние углы — под ней открывается светлый блок
      if (program) {
        gsap.fromTo(program, { clipPath: CLIP_FULL }, {
          clipPath: "inset(0% 2.5% 0% 2.5% round 0px 0px 40px 40px)",
          ease: "none",
          scrollTrigger: { trigger: program, start: "bottom bottom", end: "bottom 30%", scrub: true },
        });
      }

      // «После конференции»: карточки поднимаются по очереди
      if (outSection) {
        gsap.from(outCards, {
          y: 40, opacity: 0, duration: 0.7, stagger: 0.06, ease: "power3.out", clearProps: "opacity,transform",
          scrollTrigger: { trigger: $("[data-sc-out-list]", outSection), start: "top 80%", once: true },
        });
      }

      // Регистрация: фиолетовый лист поднимается и расправляется во всю ширину, бейдж падает сверху на шнурке
      if (reg) {
        gsap.fromTo(reg, { clipPath: "inset(0% 2.5% 0% 2.5% round 40px 40px 0px 0px)" }, {
          clipPath: CLIP_FULL,
          ease: "none",
          scrollTrigger: { trigger: reg, start: "top bottom", end: "top 30%", scrub: true },
        });
        if (lanyard) {
          gsap.from(lanyard, {
            y: () => -lanyard.offsetHeight * 0.55, rotation: 9, duration: 1.6, ease: "elastic.out(1, 0.4)",
            scrollTrigger: { trigger: reg, start: "top 60%", once: true },
          });
        }
      }

      // Счётчики «15 вузов» и «9 спикеров» считаются от нуля, когда доезжают до экрана
      countTargets.forEach((el) => {
        const state = { n: 0 };
        el.textContent = "0";
        gsap.to(state, {
          n: Number(el.dataset.scCountTo),
          duration: 1.2,
          ease: "power2.out",
          onUpdate: () => { el.textContent = String(Math.round(state.n)); },
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });
      const resetCounts = () => {
        countTargets.forEach((el) => { el.textContent = el.dataset.scCountTo; });
        proofCount.textContent = "100";
      };

      if (!desktop) {
        // «Прошлый год»: окошки слетаются к числу, число считается от нуля
        const shownTiles = $$(".sc-tile", proofCloud).filter((tile) => getComputedStyle(tile).display !== "none");
        const counter = { n: 0 };
        proofCount.textContent = "0";
        const outward = (tile, axis) => {
          const box = proofCloud.getBoundingClientRect();
          const r = tile.getBoundingClientRect();
          const dx = r.left + r.width / 2 - (box.left + box.width / 2);
          const dy = r.top + r.height / 2 - (box.top + box.height / 2);
          const length = Math.hypot(dx, dy) || 1;
          return ((axis === "x" ? dx : dy) / length) * 110;
        };
        gsap.timeline({ scrollTrigger: { trigger: proofCloud, start: "top 75%", once: true } })
          .from(shownTiles, {
            opacity: 0,
            scale: 0.5,
            x: (i, tile) => outward(tile, "x"),
            y: (i, tile) => outward(tile, "y"),
            duration: 0.8,
            stagger: { each: 0.025, from: "random" },
            ease: "power3.out",
          })
          .to(counter, { n: 100, duration: 1.4, ease: "power2.out", onUpdate: () => { proofCount.textContent = String(Math.round(counter.n)); } }, 0.15)
          .from(proofPlus, { opacity: 0, duration: 0.25 }, ">-0.15");

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

        gsap.fromTo($(".sc-mark", finale), { "--mark": 0 }, { "--mark": 1, duration: 0.6, ease: "power2.out", scrollTrigger: { trigger: finaleText, start: "top 75%", once: true } });

        return () => {
          hidePortal();
          cardObserver.disconnect();
          startCards.kill();
          resetCounts();
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

      /* ---------- 3. Горизонтальная сцена препятствий ----------
         Сцена закреплена одним куском на всё время: сначала лента едет вбок,
         потом сцена собирается в карточку дня (см. «3 → 4» ниже). */
      const distance = () => Math.max(0, painsTrack.scrollWidth - window.innerWidth);
      // Сколько прокрутки отдаём на сборку: карточка дня должна встать целиком на экран (низ — на 95% высоты)
      const collapseDistance = () => {
        const dayBottom = day.getBoundingClientRect().bottom - benefits.getBoundingClientRect().top;
        return Math.max(window.innerHeight * 0.6, dayBottom + window.innerHeight * 0.05);
      };
      // Блок «Что вы получите» подтягиваем вверх на длину сборки — он подъезжает под закреплённую сцену
      const pullBenefits = () => { benefits.style.marginTop = `${-collapseDistance()}px`; };
      pullBenefits();
      ScrollTrigger.addEventListener("refreshInit", pullBenefits);
      // Пауза после появления контента: сцена стоит, чтобы успеть прочитать заголовок и первые карточки
      const holdDistance = () => window.innerHeight * 0.7;
      const pinTrigger = ScrollTrigger.create({
        trigger: pains,
        start: "top top",
        end: () => `+=${holdDistance() + distance() + collapseDistance()}`,
        pin: true,
      });
      const horizontal = gsap.to(painsTrack, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: pains,
          // Лента трогается после паузы: начало фиксации + пауза (числом — у закреплённой сцены сдвиги считаются иначе)
          start: () => pinTrigger.start + holdDistance(),
          end: () => `+=${distance()}`,
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
        .fromTo(painItems, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.09, ease: "power3.out" }, 0.2)
        // Стопка учебников растёт снизу вверх, следом подъезжает пустое кресло
        .from($$('[data-sc-pain="books"] .sc-tome'), { scaleY: 0, opacity: 0, transformOrigin: "50% 100%", duration: 0.45, stagger: 0.08, ease: "back.out(1.6)" }, 0.75)
        .from($('[data-sc-pain="books"] .sc-chair'), { y: 26, opacity: 0, duration: 0.6, ease: "power3.out" }, 1.15);
      ScrollTrigger.create({
        trigger: pains,
        start: "top top",
        onEnter: () => { pains.classList.remove("is-veiled"); painsReveal.play(); },
        onLeaveBack: () => { pains.classList.add("is-veiled"); painsReveal.reverse(); },
      });


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

      // Фраза финала спокойно поднимается, пока сцена доезжает
      gsap.from(finaleText, { y: 40, opacity: 0, ease: "none", scrollTrigger: inTrack(finale, "left 85%", "left 35%") });
      gsap.fromTo($(".sc-mark", finale), { "--mark": 0 }, { "--mark": 1, ease: "none", scrollTrigger: inTrack(finale, "left 20%", "left 2%") });
      gsap.from($(".sc-finale_actions", finale), { y: 30, opacity: 0, ease: "none", scrollTrigger: inTrack(finale, "left 22%", "left 2%") });

      /* ---------- 3 → 4. Тёмная сцена сама собирается в карточку дня конференции ----------
         После горизонтальной ленты сцена остаётся на экране, а блок «Что вы получите» подъезжает под неё.
         Сначала гаснет финал (текст, стрелка, кнопка), потом пустая тёмная сцена сжимается
         ровно в тёмную карточку «21 ноября» и становится ею. По краям открывается следующий блок. */
      const dayItems = $$(".sc-day_item", day);
      const finaleInner = $("[data-sc-finale-inner]", finale);
      const collapse = { e: 0 };
      // Обрезка сцены: от всего экрана к прямоугольнику карточки дня (её положение берём живьём — блок под сценой едет)
      const applyCollapse = () => {
        const e = smooth(collapse.e);
        if (e <= 0) { pains.style.clipPath = ""; return; }
        const r = day.getBoundingClientRect();
        const vw = document.documentElement.clientWidth;
        const vh = window.innerHeight;
        const top = clamp(lerp(0, r.top, e), 0, vh);
        const left = clamp(lerp(0, r.left, e), 0, vw);
        const right = clamp(lerp(0, vw - r.right, e), 0, vw);
        const bottom = clamp(lerp(0, vh - r.bottom, e), 0, vh);
        pains.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px round ${lerp(0, cardRadius(), e)}px)`;
      };
      // Сцена совпала с карточкой — прячем саму сцену (она дальше уехала бы поверх карточки) и показываем карточку
      const showDay = (instant) => {
        gsap.set(pains, { autoAlpha: 0 });
        gsap.set(day, { autoAlpha: 1 });
        gsap.to(dayItems, { opacity: 1, y: 0, duration: instant ? 0 : 0.6, stagger: instant ? 0 : 0.08, ease: "power3.out", overwrite: true });
      };
      const hideDay = () => {
        gsap.set(pains, { autoAlpha: 1 });
        gsap.set(day, { autoAlpha: 0 });
        gsap.set(dayItems, { opacity: 0, y: 16, overwrite: true });
      };
      hideDay();
      const collapseTimeline = gsap.timeline({ paused: true })
        .to(finaleInner, { autoAlpha: 0, y: -48, duration: 0.25, ease: "power1.in" }, 0)
        .to(painsProgress.parentElement, { autoAlpha: 0, duration: 0.12 }, 0)
        .to(collapse, { e: 1, duration: 0.75, ease: "none", onUpdate: applyCollapse }, 0.25);
      const collapseTrigger = ScrollTrigger.create({
        trigger: pains,
        // Начинается ровно там, где закончилась горизонтальная лента
        start: () => horizontal.scrollTrigger.end,
        end: () => `+=${collapseDistance()}`,
        scrub: true,
        animation: collapseTimeline,
        invalidateOnRefresh: true,
        onUpdate: applyCollapse,
        onLeave: () => showDay(false),
        onEnterBack: hideDay,
        onRefresh: (self) => { if (self.progress >= 1) showDay(true); },
      });
      // Ссылки «Что получите» ведут к моменту, когда сцена уже собралась в карточку,
      // иначе прыжок по якорю попадает в середину сборки
      const benefitLinks = $$('a[href="#benefits"]');
      const toBenefits = (event) => {
        event.preventDefault();
        const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: collapseTrigger.end + 2, behavior: reduce ? "auto" : "smooth" });
      };
      benefitLinks.forEach((link) => link.addEventListener("click", toBenefits));

      /* ---------- 4 → 5. Фото из карточки «Видеоурок» растёт на весь экран ----------
         Снимок отрывается от карточки урока и заполняет экран; в момент, когда антипозиция
         встаёт на место, эстафету принимает её собственное фото (тот же снимок, тот же кадр). */
      const lessonMedia = $("[data-sc-lesson-media]");
      const photoPortal = $("[data-sc-photo-portal]");
      const hidePhotoPortal = () => { photoPortal.style.visibility = "hidden"; };
      anti.classList.add("is-veiled");
      ScrollTrigger.create({
        trigger: lessonMedia,
        start: "center 55%",
        endTrigger: anti,
        end: "top top",
        onUpdate: (self) => {
          const p = self.progress;
          lessonMedia.style.visibility = p > 0 ? "hidden" : "";
          if (p <= 0 || p >= 1) { hidePhotoPortal(); return; }
          const e = smooth(p);
          const box = mixRect(lessonMedia.getBoundingClientRect(), viewportRect(), e);
          Object.assign(photoPortal.style, {
            visibility: "visible",
            left: `${box.left}px`,
            top: `${box.top}px`,
            width: `${box.width}px`,
            height: `${box.height}px`,
            borderRadius: `${lerp(14, 0, e)}px`,
          });
        },
        onLeave: hidePhotoPortal,
        onLeaveBack: () => { hidePhotoPortal(); lessonMedia.style.visibility = ""; },
      });
      // Пока фото растёт, сама сцена антипозиции спрятана — иначе она въезжала бы снизу вторым фото
      ScrollTrigger.create({
        trigger: anti,
        start: "top top",
        onEnter: () => anti.classList.remove("is-veiled"),
        onLeaveBack: () => anti.classList.add("is-veiled"),
        onRefresh: (self) => anti.classList.toggle("is-veiled", self.progress <= 0 && self.scroll() < self.start),
      });

      /* ---------- 5. Антипозиция: фото на весь экран → своё место в ленте ---------- */
      const targetImg = ribbonTarget.querySelector("img");
      const flyerImg = flyer.querySelector("img");
      // Неровная форма карточки, куда садится фото: углы в долях размера и скругление.
      // Совпадает с формой #sc-photo-3 в index.html — менять вместе.
      const PHOTO_SHAPES = [
        [[0.03, 0.05], [0.96, 0], [1, 0.94], [0, 1]],
        [[0, 0.01], [0.97, 0.06], [0.99, 1], [0.03, 0.95]],
        [[0.05, 0], [1, 0.03], [0.96, 1], [0, 0.95]],
        [[0, 0.06], [0.96, 0], [1, 0.96], [0.04, 1]],
        [[0.03, 0], [1, 0.05], [0.97, 0.99], [0, 0.94]],
      ];
      const TARGET_CORNERS = PHOTO_SHAPES[2];
      const RECT_CORNERS = [[0, 0], [1, 0], [1, 1], [0, 1]];
      const CORNER_RADIUS = 0.06;
      // Контур по четырём углам со скруглёнными вершинами; t: 0 — прямоугольник, 1 — форма карточки
      const flyerShape = (t, width, height) => roundedShape(
        RECT_CORNERS.map((c, i) => [lerp(c[0], TARGET_CORNERS[i][0], t), lerp(c[1], TARGET_CORNERS[i][1], t)]),
        CORNER_RADIUS * t,
        width,
        height,
      );
      // corners — четыре угла в долях размера (по часовой от левого верхнего), r — скругление в долях стороны
      function roundedShape(corners, r, width, height) {
        const toward = (p, q) => {
          const dx = q[0] - p[0];
          const dy = q[1] - p[1];
          const length = Math.hypot(dx, dy) || 1;
          return [p[0] + (dx / length) * r, p[1] + (dy / length) * r];
        };
        const px = (p) => `${(p[0] * width).toFixed(1)} ${(p[1] * height).toFixed(1)}`;
        const parts = corners.map((p, i) => [toward(p, corners[(i + 3) % 4]), p, toward(p, corners[(i + 1) % 4])]);
        let d = `M${px(parts[0][2])}`;
        for (let i = 1; i <= 4; i += 1) {
          const [start, corner, end] = parts[i % 4];
          d += `L${px(start)}Q${px(corner)} ${px(end)}`;
        }
        return `path("${d}Z")`;
      }
      gsap.set(strikes, { drawSVG: "0%" });
      // Производительность: сцены пересчитываются только когда прогресс изменился,
      // а летящее фото — только пока оно летит. Иначе Safari и Firefox перерисовывают
      // большую картинку на каждом кадре прокрутки, и анимации проседают до 15–20 кадров.
      let lastAnti = -1;
      let lastConverge = -1;
      let flyerParked = false;
      const strikeDone = strikeWords.map(() => [-1, -1]);
      const resetSceneCache = () => { lastAnti = -1; lastConverge = -1; flyerParked = false; };
      ScrollTrigger.addEventListener("refresh", resetSceneCache);
      const renderAnti = (progress) => {
        if (progress === lastAnti) return;
        lastAnti = progress;
        const flight = smooth(clamp(progress / 0.42));

        // Лента всё время медленно едет влево
        ribbon.style.transform = `translate3d(${lerp(6, -26, progress)}vw, 0, 0)`;

        // Фото приземлилось: прячем его один раз и дальше не трогаем
        if (flight >= 1) {
          if (!flyerParked) {
            flyer.style.visibility = "hidden";
            targetImg.style.opacity = "1";
            flyerParked = true;
          }
        } else {
          flyerParked = false;
          const stage = antiStage.getBoundingClientRect();
          // Куда садится фото: центр карточки в ленте, её размер без наклона и сам наклон
          const target = ribbonTarget.getBoundingClientRect();
          const targetW = ribbonTarget.offsetWidth;
          const targetH = ribbonTarget.offsetHeight;
          const targetRotate = parseFloat(getComputedStyle(ribbonTarget).rotate) || 0;
          const to = {
            left: target.left + target.width / 2 - targetW / 2 - stage.left,
            top: target.top + target.height / 2 - targetH / 2 - stage.top,
            width: targetW,
            height: targetH,
          };
          const box = mixRect({ left: 0, top: 0, width: stage.width, height: stage.height }, to, flight);
          flyer.style.left = `${box.left}px`;
          flyer.style.top = `${box.top}px`;
          flyer.style.width = `${box.width}px`;
          flyer.style.height = `${box.height}px`;
          flyer.style.clipPath = flyerShape(flight, box.width, box.height);
          // Кадрирование снимка плавно переходит к кадрированию карточки в ленте — при посадке нет скачка
          flyerImg.style.objectPosition = `50% ${lerp(30, 50, flight)}%`;
          flyer.style.transform = `rotate(${lerp(0, targetRotate, flight)}deg)`;
          flyer.style.visibility = "visible";
          targetImg.style.opacity = "0";
        }

        // Заголовок переворачивается в 3D и встаёт на место, потом слова зачёркиваются по очереди
        const tEase = smooth(clamp((progress - 0.22) / 0.3));
        antiTitle.style.opacity = String(tEase);
        antiTitle.style.transform = `perspective(${lerp(1000, 600, tEase)}px) translate3d(0, ${lerp(140, 0, tEase)}px, 0) rotateX(${lerp(80, 0, tEase)}deg)`;
        // Карандаш зачёркивает слова по очереди: основная линия туда-обратно-туда, следом тонкий второй проход
        strikeWords.forEach((word, index) => {
          const [from, span] = index === 0 ? [0.5, 0.14] : [0.65, 0.1];
          const t = clamp((progress - from) / span);
          const main = clamp(t / 0.8);
          const second = clamp((t - 0.55) / 0.45);
          // Линию перерисовываем, только если она изменилась: у неё карандашный фильтр, он дорогой
          if (main !== strikeDone[index][0]) { gsap.set(word.main, { drawSVG: `${main * 100}%` }); strikeDone[index][0] = main; }
          if (second !== strikeDone[index][1]) { gsap.set(word.second, { drawSVG: `${second * 100}%` }); strikeDone[index][1] = second; }
        });
        antiSide.style.opacity = String(clamp((progress - 0.5) / 0.15));
      };
      /* ---------- 5 → 6. Антипозиция стягивается к «100+» ----------
         Заголовок уходит, пять фото ленты перелетают в окошки эфира, фиолетовая сцена сжимается
         к числу и растворяется, остальные окошки слетаются со всех сторон, число считается до 100. */
      const antiHead = $(".sc-anti_head", anti);
      const ribbonItems = $$(".sc-ribbon_item", ribbon);
      const tiles = $$(".sc-tile", proof);
      const tileStyles = tiles.map((tile) => tile.getAttribute("style"));
      const photoTiles = ribbonItems.map((item, i) => $(`[data-sc-proof-photo="${i + 1}"]`, proof));
      const crowd = tiles.filter((tile) => !tile.matches("[data-sc-proof-photo]")).map((tile, i) => {
        // Окошко прилетает с той стороны, где стоит: от центра облака наружу
        const x = parseFloat(tile.style.getPropertyValue("--x")) - 50;
        const y = (parseFloat(tile.style.getPropertyValue("--y")) - 50) * 0.4;
        const length = Math.hypot(x, y) || 1;
        return { tile, dx: (x / length) * 320, dy: (y / length) * 320 + 60, delay: 0.32 + (((i * 7) % 11) / 11) * 0.33 };
      });
      const flyers = ribbonItems.map((item) => {
        const node = document.createElement("div");
        node.className = "sc-proof-flyer";
        node.setAttribute("aria-hidden", "true");
        const img = item.querySelector("img");
        node.innerHTML = `<img src="${img.currentSrc || img.src}" alt="" draggable="false">`;
        page.appendChild(node);
        return node;
      });
      const renderConverge = (t) => {
        if (t === lastConverge) return;
        lastConverge = t;
        const active = t > 0 && t < 1;

        // Заголовок и текст антипозиции уходят вверх
        const leave = smooth(clamp(t / 0.18));
        antiHead.style.opacity = t > 0 ? String(1 - leave) : "";
        antiHead.style.transform = t > 0 ? `translate3d(0, ${-50 * leave}px, 0)` : "";

        // Фиолетовая сцена сжимается к числу (его положение берём живьём — блок едет снизу) и растворяется
        if (t > 0) {
          const stage = antiStage.getBoundingClientRect();
          const num = proofNum.getBoundingClientRect();
          const k = smooth(clamp((t - 0.05) / 0.7));
          const pad = 32;
          const top = clamp(lerp(0, num.top - pad - stage.top, k), 0, stage.height);
          const bottom = clamp(lerp(0, stage.bottom - num.bottom - pad, k), 0, stage.height);
          const left = clamp(lerp(0, num.left - pad - stage.left, k), 0, stage.width);
          const right = clamp(lerp(0, stage.right - num.right - pad, k), 0, stage.width);
          antiStage.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px round ${lerp(0, 48, k)}px)`;
          antiStage.style.opacity = String(1 - smooth(clamp((t - 0.45) / 0.3)));
          antiStage.style.pointerEvents = t >= 1 ? "none" : "";
        } else {
          antiStage.style.clipPath = "";
          antiStage.style.opacity = "";
          antiStage.style.pointerEvents = "";
        }

        // Фото ленты перелетают в свои окошки: форма из неровной становится прямоугольной
        const f = smooth(clamp((t - 0.04) / 0.8));
        ribbonItems.forEach((item, i) => {
          const node = flyers[i];
          const tile = photoTiles[i];
          if (!tile || !active) {
            // display: none, а не visibility: hidden — иначе Firefox держит пять скрытых фото
            // поверх страницы и перерисовывает их на каждом кадре прокрутки
            node.style.display = "none";
            item.style.visibility = "";
            if (tile) tile.style.opacity = t >= 1 ? "1" : "0";
            return;
          }
          item.style.visibility = "hidden";
          tile.style.opacity = "0";
          const a = item.getBoundingClientRect();
          const b = tile.getBoundingClientRect();
          const w = lerp(item.offsetWidth, tile.offsetWidth, f);
          const h = lerp(item.offsetHeight, tile.offsetHeight, f);
          const cx = lerp(a.left + a.width / 2, b.left + b.width / 2, f);
          const cy = lerp(a.top + a.height / 2, b.top + b.height / 2, f);
          const rotation = parseFloat(getComputedStyle(item).rotate) || 0;
          Object.assign(node.style, {
            display: "block",
            left: `${cx - w / 2}px`,
            top: `${cy - h / 2}px`,
            width: `${w}px`,
            height: `${h}px`,
            transform: `rotate(${lerp(rotation, 0, f)}deg)`,
          });
          const corners = PHOTO_SHAPES[i].map((c, j) => [lerp(c[0], RECT_CORNERS[j][0], f), lerp(c[1], RECT_CORNERS[j][1], f)]);
          node.firstElementChild.style.clipPath = roundedShape(corners, lerp(CORNER_RADIUS, 10 / Math.max(1, h), f), w, h);
        });

        // Остальные окошки слетаются к центру — каждое в своё время
        crowd.forEach(({ tile, dx, dy, delay }) => {
          const p = smooth(clamp((t - delay) / 0.3));
          tile.style.opacity = String(p);
          tile.style.transform = p >= 1 ? "" : `translate3d(${dx * (1 - p)}px, ${dy * (1 - p)}px, 0) scale(${lerp(0.5, 1, p)})`;
        });

        // Число считается до 100, потом появляется «+»; заголовок и подпись проявляются
        proofCount.textContent = String(Math.round(100 * smooth(clamp((t - 0.38) / 0.52))));
        proofPlus.style.opacity = String(clamp((t - 0.88) / 0.1));
        proofCaption.style.opacity = String(clamp((t - 0.55) / 0.3));
        const titleIn = smooth(clamp((t - 0.45) / 0.4));
        proofTitle.style.opacity = String(titleIn);
        proofTitle.style.transform = `translate3d(0, ${lerp(36, 0, titleIn)}px, 0)`;
      };

      const antiTrigger = ScrollTrigger.create({
        trigger: anti,
        start: "top bottom",
        end: "bottom bottom",
        onUpdate: (self) => {
          // Пока сцена не встала на место, фото держится на весь экран.
          // Закреплённый отрезок: 170 частей — сама антипозиция, последние 100 — стягивание к «100+»
          const pinnedStart = window.innerHeight / Math.max(1, self.end - self.start);
          const q = clamp((self.progress - pinnedStart) / (1 - pinnedStart));
          renderAnti(clamp((q * 270) / 170));
          renderConverge(clamp((q * 270 - 170) / 100));
        },
      });
      renderAnti(0);
      renderConverge(0);

      // Пересчитать порядок сцен: закрепления выше по странице сдвигают всё, что ниже
      ScrollTrigger.sort();
      ScrollTrigger.refresh();

      return () => {
        ScrollTrigger.removeEventListener("refresh", resetSceneCache);
        pains.classList.remove("is-veiled");
        pains.style.clipPath = "";
        benefits.style.marginTop = "";
        ScrollTrigger.removeEventListener("refreshInit", pullBenefits);
        benefitLinks.forEach((link) => link.removeEventListener("click", toBenefits));
        hidePortal();
        antiTrigger.kill();
        flyers.forEach((node) => node.remove());
        [antiHead, antiStage, proofTitle, proofPlus, proofCaption, ...tiles, ...ribbonItems].forEach((node) => node.removeAttribute("style"));
        // У окошек в атрибуте style лежат их координаты — вернуть их обратно
        tiles.forEach((tile, i) => tile.setAttribute("style", tileStyles[i]));
        resetCounts();
        anti.classList.remove("is-veiled");
        hidePhotoPortal();
        lessonMedia.style.visibility = "";
        [ribbon, antiTitle, flyer, flyerImg].forEach((node) => node.removeAttribute("style"));
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
