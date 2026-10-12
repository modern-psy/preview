/* ============================================================================
   ПОВЕДЕНИЕ СТРАНИЦЫ «БИЗНЕС-ИГРА ДЛЯ ПСИХОЛОГОВ» — ВАРИАНТ «КОЛОДА»
   ============================================================================

   ⚠️ Этот файл одинаковый в двух папках:
        apps/preview/biznes-igra-v3  — карты тянут кнопкой (data-deck-mode="click")
        apps/preview/biznes-igra-v2  — карты меняются при прокрутке (data-deck-mode="scroll")
      Правите в одной папке — скопируйте файл во вторую.

   Скрипт делает две вещи:
     1) ведёт игровой стол: колода карт, фишка в шапке, монеты команды,
        места участников, реплики ведущей и заказчика, лента открытых карт,
        биография ведущей. В варианте «кнопкой» карты тянут кнопкой, свайпом или
        стрелками на клавиатуре; в варианте «прокруткой» карта меняется,
        пока страница прокручивается (стол в это время стоит на месте);
     2) записывает на игру: через виджет BotHelp, а если он не поднялся
        (или его ещё нет) — через запасную лид-форму. Этот блок — копия
        с вебинаров, см. «ЗАПИСЬ НА ВЕБИНАР: BOTHELP + ЗАПАСНАЯ ФОРМА».

   ЧТО ПРОИСХОДИТ НА СТОЛЕ — задают атрибуты у карт в разметке (index.html,
   раздел «Игровой стол»): data-step, data-wallet, data-team, data-speaker,
   data-line, data-short.
   Скрипт ничего не придумывает сам: цифры монет — только по правилам игры
   (100 на старте, 4 монеты за вопрос), дальше — «?».

   Без скрипта карты просто идут списком: весь текст остаётся на странице.

   ПОРЯДОК РАЗДЕЛОВ
     1. Общее: элементы и данные карт
     2. Смена карт (анимация)
     3. Монеты команды
     4. Стол: шаги, говорящие, команда, счётчики
     5. Лента открытых карт
     6. Биография ведущей
     7. Вариант «кнопкой»: кнопки, свайп, клавиатура
     8. Вариант «прокруткой»: один жест — один экран
     9. Переходы со всей страницы: «Узнать», «Зарегистрироваться», шаги
    10. Запуск
   ========================================================================== */

(() => {
  "use strict";

  /* --------------------------------------------------------------------------
     1. ОБЩЕЕ: ЭЛЕМЕНТЫ И ДАННЫЕ КАРТ
     -------------------------------------------------------------------------- */

  const page = document.querySelector(".game-page[data-deck-mode]");
  if (!page) return;

  const MODE = page.dataset.deckMode === "scroll" ? "scroll" : "click";

  const table = page.querySelector("[data-table]");
  const track = page.querySelector("[data-table-track]");
  const stage = page.querySelector("[data-table-stage]");
  const deck = page.querySelector("[data-deck]");
  const items = [...page.querySelectorAll("[data-card]")];
  if (!table || !track || !stage || !deck || items.length === 0) return;

  const header = page.querySelector(".site-header_component");
  const speakers = {
    host: page.querySelector('.speaker_component[data-speaker="host"]'),
    client: page.querySelector('.speaker_component[data-speaker="client"]'),
  };
  const clientFigure = page.querySelector(".client_figure");

  const wallet = page.querySelector(".wallet_component[data-wallet]");
  const walletStacks = [...page.querySelectorAll(".wallet_stack")];
  const walletValue = page.querySelector("[data-wallet-value]");
  const walletNote = page.querySelector("[data-wallet-note]");
  const walletDelta = page.querySelector("[data-wallet-delta]");
  const walletPill = page.querySelector("[data-wallet-pill]");
  const walletPillValue = page.querySelector("[data-wallet-pill-value]");

  const stepsList = page.querySelector(".steps_list");
  const stepButtons = [...page.querySelectorAll("[data-step-target]")];
  const pawn = page.querySelector("[data-steps-pawn]");

  const prevButton = page.querySelector("[data-deck-prev]");
  const nextButton = page.querySelector("[data-deck-next]");
  const counter = page.querySelector("[data-deck-counter]");
  const swipeHint = page.querySelector("[data-deck-swipe]");
  const hintCursor = page.querySelector("[data-hint-cursor]");
  const scrollHint = page.querySelector("[data-scroll-hint]");

  const ribbonList = page.querySelector("[data-ribbon-list]");

  const team = page.querySelector(".team_component[data-team]");
  const hostOpeners = [...page.querySelectorAll("[data-host-open]")];
  const hostPanel = page.querySelector("[data-host-panel]");
  const hostClose = page.querySelector("[data-host-close]");
  const hostPhoto = page.querySelector(".host_photo");

  const live = page.querySelector("[data-deck-live]");
  const flyLayer = page.querySelector("[data-fly-layer]");

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const wideQuery = window.matchMedia("(min-width: 48rem)");
  const reducedMotion = () => reduceMotionQuery.matches;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  // Данные карт берём из разметки
  const cards = items.map((item, index) => ({
    item,
    index,
    kind: item.dataset.kind || "stage",
    step: Number(item.dataset.step || 0),
    wallet: item.dataset.wallet || "none",
    speaker: item.dataset.speaker === "client" ? "client" : "host",
    line: (item.dataset.line || "").trim(),
    short: (item.dataset.short || "").trim(),
    fillsTeam: item.dataset.team === "fill",
    title: item.querySelector(".card_title")?.textContent.replace(/\s+/g, " ").trim() || "",
    tag: item.querySelector(".card_tag")?.textContent.replace(/\s+/g, " ").trim() || "Билет",
  }));

  const TOTAL = cards.length;
  const TICKET = TOTAL - 1;
  const teamIndex = cards.findIndex((card) => card.fillsTeam);
  const stageCardIndex = {};
  cards.forEach((card) => {
    if (card.step && stageCardIndex[card.step] === undefined) stageCardIndex[card.step] = card.index;
  });

  let current = 0;
  let maxSeen = 0;
  let started = false;      // человек уже сделал первый ход
  let initialized = false;  // первая отрисовка прошла (до неё без анимации)


  /* --------------------------------------------------------------------------
     2. СМЕНА КАРТ (АНИМАЦИЯ)
     --------------------------------------------------------------------------
     Вперёд: верхняя карта улетает в стопку открытых (на десктопе — вправо,
     на телефоне — влево, «смахиванием»), следующая поднимается из колоды.
     Назад: карта возвращается из стопки, текущая уходит обратно в колоду.
     Прыжок через несколько карт — короткая смена без полёта.
     -------------------------------------------------------------------------- */

  let running = [];

  const stopRunning = () => {
    running.forEach((animation) => animation.cancel());
    running = [];
    items.forEach((item) => {
      item.classList.remove("is-moving");
      item.style.transform = "";
    });
  };

  const track$ = (animation, onDone) => {
    running.push(animation);
    animation.onfinish = () => {
      running = running.filter((item) => item !== animation);
      onDone?.();
    };
    return animation;
  };

  // Куда улетает карта: к стопке открытых карт
  const flyOutTransform = (direction = 1) => {
    if (wideQuery.matches) return "translate(62%, -4%) rotate(9deg) scale(0.42)";
    return direction < 0
      ? "translate(-118%, 2%) rotate(-14deg)"
      : "translate(118%, 2%) rotate(14deg)";
  };

  const UNDER = "translate(0, 0.625rem) scale(0.955)";

  const showOnly = (index) => {
    items.forEach((item, i) => {
      const isCurrent = i === index;
      item.classList.toggle("is-current", isCurrent);
      item.inert = !isCurrent;
      item.setAttribute("aria-hidden", String(!isCurrent));
    });
  };

  const moveCards = (from, to, kind, dragX = 0) => {
    stopRunning();
    showOnly(to);
    if (kind === "none" || from === to) return;

    const outgoing = items[from];
    const incoming = items[to];
    outgoing.classList.add("is-moving");
    const finish = () => outgoing.classList.remove("is-moving");

    if (kind === "forward") {
      const swipeDirection = dragX < 0 ? -1 : dragX > 0 ? 1 : -1;
      const start = dragX ? `translate(${dragX}px, 0) rotate(${dragX / 24}deg)` : "none";
      track$(
        outgoing.animate(
          [
            { transform: start, opacity: 1 },
            { transform: flyOutTransform(swipeDirection), opacity: 0 },
          ],
          { duration: 520, easing: "cubic-bezier(0.5, 0, 0.3, 1)" }
        ),
        finish
      );
      track$(
        incoming.animate(
          [
            { transform: UNDER, filter: "brightness(0.82)" },
            { transform: "none", filter: "brightness(1)" },
          ],
          { duration: 460, delay: 90, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" }
        )
      );
      return;
    }

    if (kind === "back") {
      incoming.style.zIndex = "5";
      track$(
        incoming.animate(
          [
            { transform: flyOutTransform(-1), opacity: 0 },
            { transform: "none", opacity: 1 },
          ],
          { duration: 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        ),
        () => { incoming.style.zIndex = ""; }
      );
      track$(
        outgoing.animate(
          [
            { transform: "none", opacity: 1 },
            { transform: UNDER, opacity: 0 },
          ],
          { duration: 360, easing: "ease-in" }
        ),
        finish
      );
      return;
    }

    // Прыжок через несколько карт
    track$(
      outgoing.animate(
        [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.97)" }],
        { duration: 200, easing: "ease-in" }
      ),
      finish
    );
    track$(
      incoming.animate(
        [{ opacity: 0, transform: "scale(0.97)" }, { opacity: 1, transform: "none" }],
        { duration: 300, delay: 120, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" }
      )
    );
  };


  /* --------------------------------------------------------------------------
     3. МОНЕТЫ КОМАНДЫ
     --------------------------------------------------------------------------
     Пять стопок по 20 монет. Одна нарисованная монета в стопке ≈ 3 игровые,
     поэтому полная стопка — 7 монет. Состояние берётся из data-wallet карты.
     🟢 Подписи под кучкой можно менять здесь.
     -------------------------------------------------------------------------- */

  const WALLET = {
    none: {
      stacks: [0, 0, 0, 0, 0],
      value: "",
      note: "Монеты выдадут вместе с кейсом",
      pill: "",
    },
    100: {
      stacks: [7, 7, 7, 7, 7],
      value: "100 монет",
      note: "у каждой команды на старте",
      pill: "100",
    },
    92: {
      stacks: [7, 7, 7, 7, 4],
      value: "92 монеты",
      note: "−8: два вопроса заказчику по 4 монеты",
      pill: "92",
      delta: "−8",
      fly: 2,
      flyTo: "client",
    },
    88: {
      stacks: [7, 7, 7, 7, 3],
      value: "88 монет",
      note: "−4: повторный вопрос, нового — ничего",
      pill: "88",
      delta: "−4",
      fly: 1,
      flyTo: "client",
    },
    unknown: {
      stacks: [7, 6, 5, 3, 1],
      value: "?",
      note: "Остаток зависит от решений команды",
      pill: "?",
      fly: 3,
      flyTo: "host",
    },
  };

  // Порядок состояний — чтобы понимать, что это «трата вперёд»
  const WALLET_ORDER = ["none", "100", "92", "88", "unknown"];

  let walletState = "none";

  const coinMarkup = (index, delay) =>
    `<svg class="wallet_coin${delay !== null ? " is-dropping" : ""}" viewBox="0 0 40 22" aria-hidden="true" focusable="false" style="--i:${index}${delay !== null ? `;--d:${delay}` : ""}"><use href="#g-coin" /></svg>`;

  const drawStacks = (counts, dropping = false) => {
    walletStacks.forEach((stack, stackIndex) => {
      const count = counts[stackIndex] || 0;
      let markup = "";
      for (let i = 0; i < count; i += 1) {
        markup += coinMarkup(i, dropping ? (stackIndex * 6 + i) * 34 : null);
      }
      stack.innerHTML = markup;
    });
  };

  // Центр элемента на экране; если элемент скрыт — null
  const centerOf = (element) => {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };

  // Откуда взлетают монеты: верх стопки, которая похудела, или плашка на телефоне
  const coinSource = (fromCounts, toCounts) => {
    for (let i = walletStacks.length - 1; i >= 0; i -= 1) {
      if ((toCounts[i] || 0) < (fromCounts[i] || 0)) {
        const top = walletStacks[i].lastElementChild || walletStacks[i];
        const point = centerOf(top);
        if (point) return point;
      }
    }
    return centerOf(walletPill);
  };

  const flyCoins = (count, from, to) => {
    if (!flyLayer || !from || !to) return;
    for (let i = 0; i < count; i += 1) {
      const coin = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      coin.setAttribute("viewBox", "0 0 40 22");
      coin.setAttribute("class", "fly-coin");
      coin.innerHTML = '<use href="#g-coin" />';
      flyLayer.append(coin);

      const size = coin.getBoundingClientRect();
      const half = { x: size.width / 2, y: size.height / 2 };
      const startX = from.x - half.x + (i - (count - 1) / 2) * 10;
      const startY = from.y - half.y;
      const endX = to.x - half.x;
      const endY = to.y - half.y;
      const midX = (startX + endX) / 2;
      const midY = Math.min(startY, endY) - 80;

      const animation = coin.animate(
        [
          { transform: `translate(${startX}px, ${startY}px) scale(1)`, opacity: 1 },
          { transform: `translate(${midX}px, ${midY}px) scale(1.12)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${endX}px, ${endY}px) scale(0.55)`, opacity: 0 },
        ],
        { duration: 760, delay: i * 140, easing: "cubic-bezier(0.45, 0, 0.35, 1)", fill: "both" }
      );
      animation.onfinish = () => coin.remove();
      animation.oncancel = () => coin.remove();
    }
  };

  const restartAnimation = (element, className) => {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  };

  const renderWallet = (nextState, animate) => {
    const target = WALLET[nextState] ? nextState : "unknown";
    const from = WALLET[walletState];
    const to = WALLET[target];
    const forwardStep =
      animate &&
      WALLET_ORDER.indexOf(target) === WALLET_ORDER.indexOf(walletState) + 1;

    if (target === walletState && initialized) return;

    if (forwardStep && to.fly) {
      const source = coinSource(from.stacks, to.stacks);
      const destination = to.flyTo === "host" ? centerOf(hostPhoto) : centerOf(clientFigure);
      flyCoins(to.fly, source, destination);
    }

    drawStacks(to.stacks, forwardStep && walletState === "none");

    wallet.dataset.state = target;
    walletValue.textContent = to.value;
    walletNote.textContent = to.note;

    if (forwardStep && to.delta && walletDelta) {
      walletDelta.textContent = to.delta;
      restartAnimation(walletDelta, "is-showing");
    }

    if (walletPill) {
      walletPill.hidden = target === "none";
      walletPillValue.textContent = to.pill;
      if (forwardStep) restartAnimation(walletPill, "is-bump");
    }

    walletState = target;
  };


  /* --------------------------------------------------------------------------
     4. СТОЛ: ШАГИ, ЗАКАЗЧИК, КОМАНДА, СЧЁТЧИКИ
     -------------------------------------------------------------------------- */

  let pawnStep = 0;

  const placePawn = (hop = false) => {
    if (!pawn || !stepsList) return;
    const button = stepButtons[Math.max(pawnStep, 1) - 1];
    if (!button) return;
    const nav = pawn.parentElement.getBoundingClientRect();
    const box = button.getBoundingClientRect();
    const x = box.left - nav.left + box.width / 2 - pawn.getBoundingClientRect().width / 2;
    pawn.style.setProperty("--pawn-x", `${x}px`);
    pawn.style.opacity = pawnStep > 0 ? "1" : "0.55";
    if (hop && !reducedMotion()) restartAnimation(pawn, "is-hop");
  };

  const renderSteps = (index, animate) => {
    let reached = 0;
    for (let i = 0; i <= index; i += 1) reached = Math.max(reached, cards[i].step);

    stepButtons.forEach((button) => {
      const step = Number(button.dataset.stepTarget);
      const state = reached === 0 ? "todo" : step < reached ? "done" : step === reached ? "current" : "todo";
      button.dataset.state = state;
      if (state === "current") button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });

    const changed = reached !== pawnStep;
    pawnStep = reached;
    placePawn(animate && changed);
  };

  // Говорит один: у него облачко с репликой, у второго — только подпись
  const renderSpeakers = (index, animate) => {
    const { speaker, line } = cards[index];
    Object.entries(speakers).forEach(([name, element]) => {
      if (!element) return;
      const active = name === speaker && line !== "";
      element.dataset.active = String(active);
      if (!active) return;
      const lineElement = element.querySelector("[data-speaker-line]");
      if (!lineElement || lineElement.textContent === line) return;
      lineElement.textContent = line;
      if (animate) restartAnimation(lineElement, "is-changing");
    });
  };

  const renderTeam = (index, animate) => {
    if (!team || teamIndex < 0) return;
    const filled = index >= teamIndex;
    const wasFilled = team.dataset.filled === "true";
    team.dataset.filled = String(filled);

    if (filled && !wasFilled && animate) {
      team.querySelectorAll(".team_seat:not(.is-you)").forEach((seat, i) => {
        seat.style.setProperty("--d", String(i * 130));
        restartAnimation(seat, "is-joining");
      });
    }
  };

  const renderCounters = (index) => {
    if (counter) counter.innerHTML = `<b>${index + 1}</b> из ${TOTAL}`;

    deck.dataset.remaining = String(clamp(TOTAL - 1 - index, 0, 2));

    if (prevButton) prevButton.disabled = index === 0;
    if (nextButton) nextButton.style.visibility = index === TICKET ? "hidden" : "";

    if (live && initialized) {
      live.textContent = `Карта ${index + 1} из ${TOTAL}: ${cards[index].title}`;
    }
  };

  const markStarted = () => {
    if (started) return;
    started = true;
    hintCursor?.classList.remove("is-visible");
    if (swipeHint) swipeHint.hidden = true;
    scrollHint?.classList.add("is-done");
  };

  const goTo = (target, options = {}) => {
    const next = clamp(target, 0, TOTAL - 1);
    if (next === current && initialized) return;

    const from = current;
    const distance = Math.abs(next - from);
    const animate = initialized && !reducedMotion() && options.animate !== false;
    const kind = !animate ? "none" : distance > 1 ? "jump" : next > from ? "forward" : "back";

    current = next;
    maxSeen = Math.max(maxSeen, next);
    if (initialized && next !== 0) markStarted();

    moveCards(from, next, kind, options.dragX || 0);
    renderSteps(next, animate);
    renderSpeakers(next, animate);
    renderWallet(cards[next].wallet, animate && kind === "forward");
    renderTeam(next, animate && kind === "forward");
    renderCounters(next);
    renderRibbon(animate && kind === "forward");
  };


  /* --------------------------------------------------------------------------
     5. ЛЕНТА ОТКРЫТЫХ КАРТ
     --------------------------------------------------------------------------
     Внизу стола — все карты мини-карточками. Вытянутые (до самой дальней,
     до которой дошёл человек) открываются по нажатию, остальные лежат
     рубашкой вверх. Текущая приподнята.
     -------------------------------------------------------------------------- */

  const miniKind = (kind) => (kind === "ticket" ? "paper" : kind);
  let ribbonSeen = -1;

  const buildRibbon = () => {
    if (!ribbonList) return;
    ribbonList.innerHTML = "";
    cards.forEach((card, i) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ribbon_card";
      button.dataset.kind = miniKind(card.kind);
      button.dataset.goCard = String(i);
      button.innerHTML = '<span class="ribbon_tag"></span><span class="ribbon_title"></span>';
      button.firstElementChild.textContent = card.tag;
      button.lastElementChild.textContent = card.short || card.title;
      li.append(button);
      ribbonList.append(li);
    });
  };

  // Прокрутить ленту так, чтобы текущая карта была видна (страницу не трогаем)
  const revealInRibbon = (button) => {
    if (!ribbonList || ribbonList.scrollWidth <= ribbonList.clientWidth) return;
    const left = button.offsetLeft - (ribbonList.clientWidth - button.offsetWidth) / 2;
    ribbonList.scrollTo({ left, behavior: reducedMotion() ? "instant" : "smooth" });
  };

  const renderRibbon = (animate) => {
    if (!ribbonList) return;
    [...ribbonList.querySelectorAll(".ribbon_card")].forEach((button, i) => {
      const seen = i <= maxSeen;
      const card = cards[i];
      button.classList.toggle("is-back", !seen);
      button.disabled = !seen;
      button.setAttribute(
        "aria-label",
        seen ? `Карта ${i + 1}: ${card.title}` : `Карта ${i + 1} ещё в колоде`
      );
      if (i === current) {
        button.setAttribute("aria-current", "true");
        revealInRibbon(button);
      } else {
        button.removeAttribute("aria-current");
      }
      if (animate && seen && i > ribbonSeen) restartAnimation(button, "is-flipping");
    });
    ribbonSeen = Math.max(ribbonSeen, maxSeen);
  };

  ribbonList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-go-card]");
    if (!button || button.disabled) return;
    showCard(Number(button.dataset.goCard));
  });


  /* --------------------------------------------------------------------------
     6. БИОГРАФИЯ ВЕДУЩЕЙ
     --------------------------------------------------------------------------
     Открывается по нажатию на фото ведущей или на «Биография». На десктопе
     панель раскрывается вниз из угла, на телефоне — шторкой с подложкой.
     -------------------------------------------------------------------------- */

  let backdrop = null;
  let panelOpener = null;

  const isHostOpen = () => hostPanel && !hostPanel.hidden;

  const closeHost = (returnFocus = true) => {
    if (!isHostOpen()) return;
    hostPanel.hidden = true;
    hostOpeners.forEach((button) => button.setAttribute("aria-expanded", "false"));
    backdrop?.remove();
    backdrop = null;
    if (returnFocus && panelOpener) panelOpener.focus({ preventScroll: true });
    panelOpener = null;
  };

  const openHost = (opener) => {
    if (!hostPanel) return;
    panelOpener = opener;
    hostPanel.hidden = false;
    hostOpeners.forEach((button) => button.setAttribute("aria-expanded", "true"));
    if (!wideQuery.matches) {
      backdrop = document.createElement("div");
      backdrop.className = "panel-backdrop";
      backdrop.setAttribute("aria-hidden", "true");
      backdrop.addEventListener("click", () => closeHost());
      page.append(backdrop);
    }
    const heading = hostPanel.querySelector("h3");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  };

  hostOpeners.forEach((button) => {
    button.addEventListener("click", () => {
      if (isHostOpen()) closeHost();
      else openHost(button);
    });
  });

  hostClose?.addEventListener("click", () => closeHost());

  // Клик мимо панели закрывает её (на десктопе подложки нет)
  document.addEventListener("pointerdown", (event) => {
    if (!isHostOpen()) return;
    if (hostPanel.contains(event.target)) return;
    if (hostOpeners.some((button) => button.contains(event.target))) return;
    closeHost(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeHost();
  });


  /* --------------------------------------------------------------------------
     7. ВАРИАНТ «КНОПКОЙ»: КНОПКИ, СВАЙП, КЛАВИАТУРА
     -------------------------------------------------------------------------- */

  const focusDeck = () => {
    if (MODE === "click" && nextButton && current !== TICKET) nextButton.focus({ preventScroll: true });
  };

  const isTyping = (target) =>
    target instanceof HTMLElement &&
    (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName));

  const stageInView = () => {
    const rect = stage.getBoundingClientRect();
    const visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    return visible > rect.height * 0.5;
  };

  const setupClickMode = () => {
    prevButton?.addEventListener("click", () => goTo(current - 1));
    nextButton?.addEventListener("click", () => goTo(current + 1));

    document.addEventListener("keydown", (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTyping(event.target) || !stageInView()) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(current + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(current - 1);
      }
    });

    // Свайп: карту можно смахнуть пальцем (или мышью). Влево — следующая,
    // вправо — предыдущая. Вертикальная прокрутка страницы не мешает.
    let drag = null;

    deck.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || current === TICKET) return;
      if (event.target.closest("a, button, input, label, select, textarea")) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, active: false };
    });

    deck.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.active) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
        drag.active = true;
        deck.setPointerCapture?.(event.pointerId);
        items[current].classList.add("is-dragging");
      }
      drag.dx = dx;
      items[current].style.transform = `translate(${dx}px, 0) rotate(${dx / 24}deg)`;
    });

    const endDrag = (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const { dx, active } = drag;
      drag = null;
      const card = items[current];
      card.classList.remove("is-dragging");
      if (!active) return;

      if (dx < -70 && current < TICKET) {
        card.style.transform = "";
        goTo(current + 1, { dragX: dx });
      } else if (dx > 70 && current > 0) {
        card.style.transform = "";
        goTo(current - 1);
      } else {
        const back = card.animate(
          [{ transform: card.style.transform || "none" }, { transform: "none" }],
          { duration: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
        card.style.transform = "";
        running.push(back);
      }
    };

    deck.addEventListener("pointerup", endDrag);
    deck.addEventListener("pointercancel", endDrag);

    hintCursor?.classList.add("is-visible");
  };


  /* --------------------------------------------------------------------------
     8. ВАРИАНТ «ПРОКРУТКОЙ»
     --------------------------------------------------------------------------
     Стол прилипает под шапкой, а «дорожка» под ним — длинная: на каждую
     карту приходится чуть больше половины экрана прокрутки. Какая карта
     открыта, считается по тому, насколько прокручена дорожка.
     -------------------------------------------------------------------------- */

  let stepPx = 0;
  let trackStart = 0;
  const snapMarks = [];
  let jumpTarget = null;
  let jumpTimer = 0;
  let scrollFrame = 0;

  const headerHeight = () => header?.offsetHeight || 0;

  const measureTrack = () => {
    if (MODE !== "scroll") return;
    stepPx = Math.max(window.innerHeight * 0.55, 320);
    track.style.height = `${stage.offsetHeight + stepPx * (TOTAL - 1)}px`;
    trackStart = track.getBoundingClientRect().top + window.scrollY - headerHeight();

    // Точки, к которым на телефоне «примагничивается» прокрутка: по одной
    // на карту (см. page.css, раздел 16 — scroll-snap только для тач-экранов)
    if (!snapMarks.length) {
      cards.forEach(() => {
        const mark = document.createElement("span");
        mark.className = "table_snap";
        mark.setAttribute("aria-hidden", "true");
        track.append(mark);
        snapMarks.push(mark);
      });
    }
    snapMarks.forEach((mark, i) => {
      mark.style.top = `${i * stepPx}px`;
    });
  };

  const indexFromScroll = () => clamp(Math.round((window.scrollY - trackStart) / stepPx), 0, TOTAL - 1);

  const onScroll = () => {
    scrollFrame = 0;
    if (jumpTarget !== null) return;
    goTo(indexFromScroll());
  };

  const scrollToCard = (index) => {
    const target = clamp(index, 0, TOTAL - 1);
    const targetY = trackStart + target * stepPx + 2;
    // Далёкий переход (например, сразу к билету) — без плавной прокрутки:
    // ехать через всю колоду долго и незачем
    const smooth = !reducedMotion() && Math.abs(window.scrollY - targetY) < window.innerHeight * 2.5;

    jumpTarget = target;
    goTo(target);
    window.scrollTo({ top: targetY, behavior: smooth ? "smooth" : "instant" });
    lockedUntil = performance.now() + (smooth ? 900 : 100);

    // Пока страница едет к карте, промежуточные карты не показываем.
    // Отпускаем, когда доехали (или по таймеру, если прокрутку прервали)
    window.clearTimeout(jumpTimer);
    let onEnd = null;
    const release = () => {
      window.clearTimeout(jumpTimer);
      if (onEnd) window.removeEventListener("scrollend", onEnd);
      jumpTarget = null;
      goTo(indexFromScroll(), { animate: false });
    };
    if (smooth && "onscrollend" in window) {
      onEnd = () => {
        if (Math.abs(window.scrollY - targetY) < 6) release();
      };
      window.addEventListener("scrollend", onEnd);
    }
    jumpTimer = window.setTimeout(release, smooth ? 1400 : 80);
  };

  /* Один жест — один экран.
     Колесо мыши, тачпад и клавиши не прокручивают страницу плавно,
     а переключают экраны: заставка → стол → следующая карта. После билета
     прокрутка снова обычная — до подвала. На телефоне листают пальцем,
     а прокрутка «примагничивается» к картам (scroll-snap в page.css). */

  const SLOT_SPLASH = -1;
  let lockedUntil = 0;
  let tween = 0;

  const lastCardY = () => trackStart + (TOTAL - 1) * stepPx;
  const slotY = (slot) => (slot === SLOT_SPLASH ? 0 : trackStart + slot * stepPx);

  // На каком экране мы сейчас: заставка или карта номер N
  const currentSlot = () => (window.scrollY < trackStart - 4 ? SLOT_SPLASH : indexFromScroll());

  // Быстрая плавная смена экрана — своя, чтобы длительность была одинаковой
  const glideTo = (y, duration = 560) => {
    window.cancelAnimationFrame(tween);
    const from = window.scrollY;
    const distance = y - from;
    if (Math.abs(distance) < 1) return 0;
    if (reducedMotion()) {
      window.scrollTo({ top: y, behavior: "instant" });
      return 0;
    }
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const frame = (now) => {
      const t = Math.min(1, (now - start) / duration);
      window.scrollTo({ top: from + distance * ease(t), behavior: "instant" });
      if (t < 1) tween = window.requestAnimationFrame(frame);
    };
    tween = window.requestAnimationFrame(frame);
    return duration;
  };

  // Шаг вперёд или назад. Возвращает false, если шаг не наш (после билета)
  const stepScreen = (direction) => {
    const slot = currentSlot();
    if (direction > 0 && slot === TOTAL - 1) return false;
    if (direction < 0 && slot === SLOT_SPLASH) return false;
    const target = direction > 0
      ? (slot === SLOT_SPLASH ? 0 : slot + 1)
      : (slot === 0 ? SLOT_SPLASH : slot - 1);
    const duration = glideTo(slotY(target), target === 0 && slot === SLOT_SPLASH ? 640 : 520);
    lockedUntil = performance.now() + duration + 120;
    markStarted();
    return true;
  };

  // Можно ли ещё прокрутить что-то внутри (форму в билете) в эту сторону
  const roomInside = (target, dy) => {
    for (let el = target instanceof Element ? target : null; el && el !== document.body; el = el.parentElement) {
      if (el.scrollHeight > el.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) {
        const room = dy > 0 ? el.scrollHeight - el.clientHeight - el.scrollTop : el.scrollTop;
        if (room > 1) return true;
      }
    }
    return false;
  };

  // Тачпад после жеста ещё долго присылает затухающую инерцию — её
  // пропускаем. Новый жест — это либо пауза, либо разгон.
  const wheelLog = [];
  const isNewGesture = (time, size) => {
    const previous = wheelLog[wheelLog.length - 1];
    wheelLog.push({ time, size });
    if (wheelLog.length > 12) wheelLog.shift();
    if (!previous || time - previous.time > 180) return true;
    if (wheelLog.length < 6) return false;
    const average = (list) => list.reduce((sum, item) => sum + item.size, 0) / list.length;
    return average(wheelLog.slice(-3)) > average(wheelLog.slice(0, -3)) * 1.25;
  };

  // Экраны переключаются, только пока мы на заставке или на столе
  const inScreens = () => window.scrollY <= lastCardY() + 4;

  const onWheel = (event) => {
    if (event.ctrlKey || !inScreens()) return;
    const dy = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    if (!dy || Math.abs(dy) < Math.abs(event.deltaX)) return;
    if (roomInside(event.target, dy)) {
      wheelLog.length = 0;
      return;
    }
    const direction = dy > 0 ? 1 : -1;
    // После билета вниз — обычная прокрутка к подвалу
    if (direction > 0 && currentSlot() === TOTAL - 1 && performance.now() >= lockedUntil) return;

    event.preventDefault();
    const now = performance.now();
    const fresh = isNewGesture(now, Math.abs(dy));
    if (!fresh || now < lockedUntil) return;
    stepScreen(direction);
  };

  const onKey = (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (isTyping(event.target) || !inScreens()) return;
    let direction = 0;
    if (event.key === "ArrowDown" || event.key === "PageDown") direction = 1;
    else if (event.key === "ArrowUp" || event.key === "PageUp") direction = -1;
    else if (event.key === " " && !(event.target instanceof Element && event.target.closest("button, a, summary"))) {
      direction = event.shiftKey ? -1 : 1;
    }
    if (!direction) return;
    if (performance.now() < lockedUntil) {
      event.preventDefault();
      return;
    }
    if (stepScreen(direction)) event.preventDefault();
  };

  const setupScrollMode = () => {
    measureTrack();
    document.documentElement.classList.add("is-deck-snap");
    window.addEventListener("scroll", () => {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(onScroll);
    }, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("keydown", onKey);
  };


  /* --------------------------------------------------------------------------
     9. ПЕРЕХОДЫ СО ВСЕЙ СТРАНИЦЫ: «УЗНАТЬ», «ЗАРЕГИСТРИРОВАТЬСЯ», ШАГИ
     -------------------------------------------------------------------------- */

  const scrollToTable = () => {
    const top = table.getBoundingClientRect().top + window.scrollY - headerHeight();
    window.scrollTo({ top, behavior: reducedMotion() ? "instant" : "smooth" });
  };

  // Открыть карту: в варианте «кнопкой» — сразу, в варианте «прокруткой» —
  // прокрутить дорожку до неё
  const showCard = (index) => {
    if (MODE === "scroll") {
      scrollToCard(index);
      return;
    }
    goTo(index);
    if (!stageInView()) scrollToTable();
  };

  page.querySelectorAll("[data-start]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      if (MODE === "scroll") scrollToCard(0);
      else scrollToTable();
      window.setTimeout(focusDeck, reducedMotion() ? 0 : 600);
    });
  });

  page.querySelectorAll("[data-go-ticket]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      closeHost(false);
      showCard(TICKET);
      // Фокус — на первое поле или кнопку в билете, когда он откроется
      window.setTimeout(() => {
        const field = items[TICKET].querySelector(
          ".lead-form_fallback:not([hidden]) input, .bh-w-messenger-button, .card_title"
        );
        if (field instanceof HTMLElement) {
          if (!field.matches("input, button, a")) field.tabIndex = -1;
          field.focus({ preventScroll: true });
        }
      }, reducedMotion() ? 50 : 750);
    });
  });

  stepButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = stageCardIndex[Number(button.dataset.stepTarget)];
      if (index === undefined) return;
      closeHost(false);
      showCard(index);
    });
  });


  /* --------------------------------------------------------------------------
     10. ЗАПУСК
     -------------------------------------------------------------------------- */

  page.classList.add("is-ready");

  buildRibbon();
  if (MODE === "click") setupClickMode();
  else setupScrollMode();

  // Первая отрисовка — без анимации
  drawStacks(WALLET.none.stacks);
  goTo(0, { animate: false });
  initialized = true;

  // Пришли по ссылке на билет — сразу открываем его
  if (window.location.hash === "#bilet") {
    if (MODE === "scroll") window.setTimeout(() => scrollToCard(TICKET), 60);
    else goTo(TICKET, { animate: false });
  } else if (MODE === "scroll") {
    goTo(indexFromScroll(), { animate: false });
  }

  // Ссылка на билет внутри страницы (например, из меню Тильды)
  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#bilet") showCard(TICKET);
  });

  // Шрифты и размеры меняются — пересчитать фишку и дорожку
  const relayout = () => {
    placePawn(false);
    if (MODE === "scroll") {
      measureTrack();
      if (jumpTarget === null) goTo(indexFromScroll(), { animate: false });
    }
  };

  if ("ResizeObserver" in window) {
    new ResizeObserver(relayout).observe(stage);
  }
  window.addEventListener("resize", relayout);
  document.fonts?.ready?.then(relayout);
})();




/* ============================================================================
   ЗАПИСЬ НА ВЕБИНАР: BOTHELP + ЗАПАСНАЯ ФОРМА
   ============================================================================
   🔴 Этот блок одинаковый на всех лендингах вебинаров с BotHelp. Если правите
      его на одной странице — перенесите правку и на остальные (найти их можно
      по этому заголовку). Всё, что отличается от страницы к странице, лежит
      в разметке блока записи: data-tilda-form-name, data-signup-source.

   КАК ЭТО РАБОТАЕТ
   При каждой загрузке страницы скрипт ждёт кнопки виджета BotHelp.

   1) BotHelp поднялся — всё как раньше. Полей на странице нет, человек
      нажимает кнопку мессенджера. Скрипт перехватывает нажатие, отправляет
      скрытую форму Тильды (пустые поля + служебные: ClientID Метрики, UTM-метки
      и подпись для отдела продаж), а потом возвращает нажатие виджету —
      и человек уходит подписываться на бота.

   2) BotHelp не поднялся — вместо кнопок появляется обычная лид-форма:
      имя, телефон, мессенджер, галочка согласия. Заявка уходит в ту же
      скрытую форму Тильды, но уже с заполненными полями и пометкой
      «запасная форма»: ссылку на эфир такому человеку отдел продаж
      отправляет вручную.

   КОГДА СЧИТАЕМ, ЧТО BOTHELP НЕ ПОДНЯЛСЯ
     · скрипт BotHelp вообще не загрузился (сервер не ответил, блокировщик
       рекламы, блок с виджетом убрали со страницы) — форма появляется сразу;
     · скрипт загрузился, но кнопки не пришли за 10 секунд после загрузки
       страницы. «Загрузка страницы» — событие load, но дольше 5 секунд его
       не ждём: его может задерживать тот же BotHelp или тяжёлая картинка.
   Если кнопки пришли позже, чем появилась форма, форму не убираем:
   человек мог уже начать её заполнять.

   ПРОВЕРИТЬ ЗАПАСНУЮ ФОРМУ, КОГДА BOTHELP РАБОТАЕТ
   Добавьте к адресу страницы ?signup=form — форма покажется сразу.

   ПОРЯДОК ПОДРАЗДЕЛОВ
     А. Настройки
     Б. Служебные значения: ClientID Метрики и UTM-метки
     В. Скрытая форма Тильды
     Г. Ждём виджет BotHelp
     Д. Запись через BotHelp
     Е. Запасная форма
     Ж. Запуск
   ========================================================================== */

(() => {
  "use strict";

  const blocks = [...document.querySelectorAll("[data-signup]")];
  if (blocks.length === 0) return;

  /* --------------------------------------------------------------------------
     А. НАСТРОЙКИ
     -------------------------------------------------------------------------- */

  // Сколько ждём кнопки BotHelp после загрузки страницы
  const BOTHELP_WAIT_MS = 10000;

  // Сколько ждём события «страница загрузилась», прежде чем начать отсчёт
  // сами. Событие может задерживаться из-за картинок или самого BotHelp
  const PAGE_LOAD_WAIT_MS = 5000;

  // Сколько ждём, что BotHelp уведёт человека в мессенджер. Если не увёл —
  // показываем прямую ссылку на бота
  const HANDOFF_TIMEOUT_MS = 6000;

  // Сколько ждём ответа Тильды при записи через BotHelp. Не дождались —
  // всё равно уводим в бота: без подписки человек не получит ссылку на эфир
  const TILDA_TIMEOUT_MS = 5000;

  // Сколько ждём ответа Тильды в запасной форме. Здесь Тильда — единственный
  // канал, поэтому ждём дольше
  const FALLBACK_TILDA_TIMEOUT_MS = 10000;

  // Сколько ждём ответа Метрики. Не дождались — берём номер из куки
  const METRIKA_TIMEOUT_MS = 1500;

  // На боевом домене скрытая форма Тильды обязана быть на странице.
  // На превью её нет, поэтому шаг с Тильдой пропускается — иначе страницу
  // нельзя было бы проверить.
  const IS_PRODUCTION = /(^|\.)modern-psy\.ru$/.test(window.location.hostname);

  // Проверка запасной формы: ?signup=form в адресе страницы
  const FORCE_FALLBACK = new URLSearchParams(window.location.search).get("signup") === "form";

  // 🟡 КАК ПОЛЯ НАЗЫВАЮТСЯ В ФОРМЕ ТИЛЬДЫ.
  // Имена должны совпадать с настройками формы буква в букву. Если поля
  // с таким именем в форме нет, скрипт добавит его сам скрытым полем.
  const FIELDS = {
    name: "Name",
    phone: "Phone",
    messenger: "messenger",
    contact: "messenger_contact",
    consent: "personal_data_consent",
    source: "form_source",
    clientId: "ym_client_id",
  };

  const UTM_FIELDS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ];

  // 🟢 ПОДПИСИ ДЛЯ ОТДЕЛА ПРОДАЖ.
  // Дописываются к названию лендинга (data-signup-source) в поле form_source:
  // по ним в CRM видно, как человек записался.
  const SOURCE_NOTES = {
    bot: "запись через бота BotHelp",
    form: "запасная форма: BotHelp не загрузился, ссылку на эфир отправить вручную",
  };

  // 🟢 Как мессенджеры называются в заявке и в тексте после отправки
  const MESSENGER_NAMES = {
    max: "MAX",
    telegram: "Telegram",
  };


  /* --------------------------------------------------------------------------
     Б. СЛУЖЕБНЫЕ ЗНАЧЕНИЯ: ClientID МЕТРИКИ И UTM-МЕТКИ
     --------------------------------------------------------------------------
     Скрипт собирает их сам: из адреса страницы и из счётчика Метрики.
     -------------------------------------------------------------------------- */

  // Метки живут в адресе только на первом шаге. Запоминаем их на время визита,
  // чтобы они не потерялись, если человек ушёл по ссылке и вернулся назад
  const utmStorageKey = (formName) => `signup-utm:${formName || "page"}`;

  const readStoredUtm = (key) => {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(key) || "{}");
      return saved && typeof saved === "object" ? saved : {};
    } catch (error) {
      return {};
    }
  };

  const collectUtm = (formName) => {
    const key = utmStorageKey(formName);
    const params = new URLSearchParams(window.location.search);
    const fromUrl = {};

    UTM_FIELDS.forEach((name) => {
      const value = (params.get(name) || "").trim();
      if (value) fromUrl[name] = value;
    });

    const result = { ...readStoredUtm(key), ...fromUrl };

    if (Object.keys(fromUrl).length > 0) {
      try {
        window.sessionStorage.setItem(key, JSON.stringify(result));
      } catch (error) {
        // Приватный режим браузера — просто работаем без запоминания
      }
    }

    return result;
  };

  // Номер посетителя Метрики лежит в куке _ym_uid. Это то же самое значение,
  // что отдаёт getClientID, поэтому кука — надёжный запасной вариант
  const clientIdFromCookie = () =>
    (document.cookie.match(/(?:^|;\s*)_ym_uid=([^;]+)/) || [])[1] || "";

  // Номер счётчика на странице: сначала смотрим, не указан ли он руками
  // в data-metrika-id, потом спрашиваем сам счётчик
  const findCounterId = (block) => {
    const manual = (block.dataset.metrikaId || "").trim();
    if (manual) return manual;

    const ya = window.Ya;
    const found = [];

    try {
      if (typeof ya?.Metrika2?.counters === "function") {
        found.push(...ya.Metrika2.counters().map((counter) => counter.id));
      }
      if (typeof ya?.Metrika?.counters === "function") {
        found.push(...ya.Metrika.counters().map((counter) => counter.id));
      }
      if (ya?._metrika?.counter?.id) found.push(ya._metrika.counter.id);
    } catch (error) {
      // Метрика ещё не поднялась — ниже вернём пусто и возьмём куку
    }

    return found.filter(Boolean)[0] || "";
  };

  const readClientId = (block) => new Promise((resolve) => {
    const fromCookie = clientIdFromCookie();
    const counter = findCounterId(block);

    if (!counter || typeof window.ym !== "function") {
      resolve(fromCookie);
      return;
    }

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(String(value || fromCookie || ""));
    };

    const timer = window.setTimeout(() => finish(""), METRIKA_TIMEOUT_MS);

    try {
      window.ym(Number(counter), "getClientID", finish);
    } catch (error) {
      finish("");
    }
  });


  /* --------------------------------------------------------------------------
     В. СКРЫТАЯ ФОРМА ТИЛЬДЫ
     --------------------------------------------------------------------------
     Тильда рисует свою форму где-то на странице. Мы её не удаляем — она и есть
     наш канал в AmoCRM, — а убираем с глаз и отправляем из скрипта.
     Значения выставляем «родным» сеттером и шлём события input/change —
     иначе скрипты Тильды не заметят, что поля заполнены.
     -------------------------------------------------------------------------- */

  const setNativeValue = (input, value) => {
    if (!(input instanceof HTMLInputElement)) return;

    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (setter) setter.call(input, value);
    else input.value = value;

    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  // Форму ищем по имени из настроек Тильды. Если имя не совпало, но форма
  // на странице всего одна — берём её и предупреждаем в консоли. Иначе самая
  // частая опечатка в имени тихо ломала бы всё: заявка никуда не уходит,
  // а штатная форма Тильды остаётся висеть на виду.
  let formNameWarned = false;

  const findTildaForm = (formName) => {
    const forms = [...document.querySelectorAll("form.t-form")];

    const byName = forms.find(
      (form) => form.querySelector('input[name="tildaspec-formname"]')?.value === formName
    );
    if (byName) return byName;

    if (forms.length === 1) {
      if (!formNameWarned) {
        formNameWarned = true;
        const realName = forms[0].querySelector('input[name="tildaspec-formname"]')?.value;
        console.warn(
          `[запись] Формы с именем «${formName}» на странице нет. ` +
          (realName
            ? `Единственная форма называется «${realName}» — работаем с ней. `
            : "Единственная форма вообще без имени — работаем с ней. ") +
          "Поправьте data-tilda-form-name в разметке, чтобы предупреждение ушло."
        );
      }
      return forms[0];
    }

    return null;
  };

  const hideTildaForm = (formName) => {
    const nativeForm = findTildaForm(formName);
    if (!(nativeForm instanceof HTMLFormElement)) return null;

    const record = nativeForm.closest(".t-rec") || nativeForm;
    record.setAttribute("aria-hidden", "true");
    record.setAttribute("data-signup-native-form-record", "");

    return nativeForm;
  };

  // Кладём значение в поле формы Тильды. Поля с таким именем может не быть —
  // тогда добавляем скрытое поле сами: Тильда отправляет всё, что внутри формы.
  const setTildaField = (nativeForm, name, value) => {
    let input = nativeForm.querySelector(`input[name="${name}"]`);

    if (!(input instanceof HTMLInputElement)) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.setAttribute("data-signup-added-field", "");
      nativeForm.appendChild(input);
    }

    setNativeValue(input, value);
  };

  // Если в форме Тильды есть поле телефона с маской, заполняем его через саму
  // Тильду — иначе при отправке она пересчитает номер из пустой маски
  const setTildaPhone = (nativeForm, phone) => {
    const group = nativeForm.querySelector(".t-input-group_ph");

    if (group && typeof window.t_form_phonemask__setValue === "function") {
      try {
        window.t_form_phonemask__setValue(group, phone, undefined, { noFocus: true });
      } catch (error) {
        console.warn("[запись] Тильда не приняла номер в поле с маской.", error);
      }
    }

    setTildaField(nativeForm, FIELDS.phone, phone);
  };

  // В форме Тильды поля могут остаться обязательными — тогда её же проверка
  // не пустит заявку. Снимаем обязательность только с пустых полей: если
  // в форме настроено поле со значением, мы его не трогаем.
  const relaxTildaValidation = (nativeForm) => {
    const relaxed = [];

    nativeForm.querySelectorAll("[required], [data-tilda-rule], [data-tilda-req]").forEach((field) => {
      if (String(field.value || "").trim()) return;

      relaxed.push(field.name || field.id || "без имени");
      field.removeAttribute("required");
      field.removeAttribute("data-tilda-rule");
      field.removeAttribute("data-tilda-req");
    });

    if (relaxed.length > 0) {
      console.info(
        "[запись] В форме Тильды есть обязательные поля, которых нет на странице: " +
        `${relaxed.join(", ")}. Заявка уйдёт с пустыми значениями — ` +
        "лучше снять с них обязательность в настройках формы."
      );
    }
  };

  const eventForm = (event, passedForm) =>
    passedForm instanceof HTMLFormElement ? passedForm
      : event?.detail?.form instanceof HTMLFormElement ? event.detail.form
      : event?.target instanceof HTMLFormElement ? event.target
      : null;

  // Ответ приходит событием, а не из requestSubmit, поэтому ждём его отдельно.
  // Возвращаем "success" | "error" | "timeout" — но в любом случае возвращаем:
  // застрять на странице человек не должен
  let waitCounter = 0;

  const waitForTilda = (nativeForm, timeoutMs) => new Promise((resolve) => {
    const namespace = `.signup${++waitCounter}`;
    let done = false;
    let timer = 0;

    const finish = (result) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      document.removeEventListener("tildaform:aftersuccess", onSuccess);
      document.removeEventListener("tildaform:aftererror", onError);
      if (typeof window.jQuery === "function") {
        window.jQuery(document).off(namespace);
      }
      resolve(result);
    };

    const isOurs = (event, passedForm) => {
      const form = eventForm(event, passedForm);
      return !form || form === nativeForm;
    };

    const onSuccess = (event, passedForm) => { if (isOurs(event, passedForm)) finish("success"); };
    const onError = (event, passedForm) => { if (isOurs(event, passedForm)) finish("error"); };

    document.addEventListener("tildaform:aftersuccess", onSuccess);
    document.addEventListener("tildaform:aftererror", onError);

    if (typeof window.jQuery === "function") {
      window.jQuery(document).on(`tildaform:aftersuccess${namespace}`, onSuccess);
      window.jQuery(document).on(`tildaform:aftererror${namespace}`, onError);
    }

    timer = window.setTimeout(() => finish("timeout"), timeoutMs);
  });

  // Заполняет скрытую форму и отправляет её.
  // Возвращает "success" | "error" | "timeout" | "skipped" (формы нет)
  const sendToTilda = async (block, values, timeoutMs) => {
    const formName = block.dataset.tildaFormName || "";
    const nativeForm = hideTildaForm(formName);

    if (!(nativeForm instanceof HTMLFormElement)) {
      const message = `[запись] Формы Тильды «${formName}» на странице нет — заявка не отправлена.`;
      if (IS_PRODUCTION) console.error(message);
      else console.info(`${message} Это превью, так и должно быть.`, values);
      return "skipped";
    }

    const utm = collectUtm(formName);
    const clientId = await readClientId(block);

    // Сначала содержательные поля, потом служебные. Порядок важен:
    // заполненное «Имя» проходит проверку Тильды само, и снимать
    // с него обязательность уже не придётся
    Object.entries(values).forEach(([name, value]) => {
      if (name === FIELDS.phone) setTildaPhone(nativeForm, value);
      else setTildaField(nativeForm, name, value);
    });

    setTildaField(nativeForm, FIELDS.clientId, clientId);
    UTM_FIELDS.forEach((name) => setTildaField(nativeForm, name, utm[name] || ""));

    relaxTildaValidation(nativeForm);

    const answer = waitForTilda(nativeForm, timeoutMs);

    // Кнопку Тильды можно спрятать через display:none — на отправку это никак
    // не влияет. А вот выключенную (disabled) в качестве отправителя брать
    // нельзя, поэтому в таком случае отправляем форму без указания кнопки
    const nativeSubmit = nativeForm.querySelector(
      'button[type="submit"]:not(:disabled), input[type="submit"]:not(:disabled)'
    );
    if (nativeSubmit instanceof HTMLElement) nativeForm.requestSubmit(nativeSubmit);
    else nativeForm.requestSubmit();

    return answer;
  };


  /* --------------------------------------------------------------------------
     Г. ЖДЁМ ВИДЖЕТ BOTHELP
     --------------------------------------------------------------------------
     Виджет подгружает свои кнопки не сразу. Пока ждём — на их месте стоит
     серый скелет. Итог один из двух: «ready» (кнопки пришли) или «failed»
     (не придут). Решение принимается один раз за загрузку страницы.
     -------------------------------------------------------------------------- */

  // Событие «страница загрузилась», но не дольше PAGE_LOAD_WAIT_MS
  const pageLoaded = new Promise((resolve) => {
    if (document.readyState === "complete") {
      resolve();
      return;
    }
    window.addEventListener("load", () => resolve(), { once: true });
    window.setTimeout(resolve, PAGE_LOAD_WAIT_MS);
  });

  // Выполнить после того, как отработали все обработчики DOMContentLoaded.
  // Скрипт BotHelp создаёт window.BhWidgets именно там
  const afterDomReady = (callback) => {
    const navigation = performance.getEntriesByType?.("navigation")?.[0];
    const alreadyFired = navigation
      ? navigation.domContentLoadedEventStart > 0
      : document.readyState === "complete";

    if (alreadyFired) {
      window.setTimeout(callback, 0);
    } else {
      document.addEventListener("DOMContentLoaded", () => window.setTimeout(callback, 0), { once: true });
    }
  };

  const watchBotHelp = (mount, onResult) => {
    let settled = false;
    let timer = 0;
    let observer = null;

    const hasButtons = () => mount.querySelector(".bh-w-messenger-button") !== null;

    const settle = (result, reason) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      observer?.disconnect();
      onResult(result, reason);
    };

    if (FORCE_FALLBACK) {
      settle("failed", "проверка запасной формы (?signup=form)");
      return;
    }

    if (hasButtons()) {
      settle("ready");
      return;
    }

    observer = new MutationObserver(() => {
      if (hasButtons()) settle("ready");
    });
    observer.observe(mount, { childList: true, subtree: true });

    // Скрипт BotHelp не выполнился вовсе — кнопок не будет, ждать нечего
    afterDomReady(() => {
      if (!window.BhWidgets) settle("failed", "скрипт BotHelp не загрузился");
    });

    pageLoaded.then(() => {
      if (settled) return;
      timer = window.setTimeout(
        () => settle("failed", `кнопки BotHelp не пришли за ${BOTHELP_WAIT_MS / 1000} с после загрузки страницы`),
        BOTHELP_WAIT_MS
      );
    });
  };


  /* --------------------------------------------------------------------------
     Д. ЗАПИСЬ ЧЕРЕЗ BOTHELP
     --------------------------------------------------------------------------
     Своих кнопок в блоке нет — есть только кнопки мессенджеров от BotHelp.
     По нажатию на любую из них:
       1) перехватываем нажатие в фазе погружения, чтобы обработчик BotHelp
          не успел сработать. Иначе он тут же уводит со страницы
          (location.href), и заявка в Тильду не успевает уйти;
       2) отправляем скрытую форму Тильды со служебными полями;
       3) возвращаем нажатие виджету — и человек уходит в мессенджер.
     -------------------------------------------------------------------------- */

  const setupBotSignup = (block, ui) => {
    const { mount, setStatus } = ui;
    const manualBlock = block.querySelector("[data-lead-manual]");
    const manualLink = block.querySelector("[data-lead-manual-link]");
    const source = block.dataset.signupSource || "";

    let busy = false;
    // Поднимаем на время, когда сами нажимаем кнопку виджета: по этому флагу
    // перехватчик пропускает нажатие дальше, к обработчику BotHelp
    let passThrough = false;

    // Согласие BotHelp проверяет сам и молча не пускает клик.
    // Мы читаем галочку до него, чтобы не отправить заявку впустую
    const consentGiven = () => {
      const items = [...mount.querySelectorAll("[data-consent-checkbox], .bh-w-consent__checkbox")];
      return items.length === 0 || items.every((item) => item.checked);
    };

    const showManual = (link) => {
      busy = false;
      block.dataset.state = "idle";
      setStatus();

      if (link && manualLink instanceof HTMLAnchorElement && manualBlock) {
        manualLink.href = link;
        manualBlock.hidden = false;
      }
    };

    const handoff = (button) => {
      setStatus("Переносим вас в мессенджер…", "loading");

      passThrough = true;
      button.click();
      passThrough = false;

      // Обычно страница закрывается прямо здесь. Если через несколько секунд
      // мы всё ещё тут — переход не сработал: пробуем уйти по прямой ссылке,
      // а заодно показываем её человеку, чтобы он не завис
      window.setTimeout(() => {
        const link = button.dataset.href || "";
        showManual(link);
        if (link) window.location.href = link;
      }, HANDOFF_TIMEOUT_MS);
    };

    const onClick = async (event) => {
      const button = event.target instanceof Element
        ? event.target.closest(".bh-w-messenger-button")
        : null;

      if (!button || !mount.contains(button)) return;
      if (passThrough) return; // это мы сами нажали — пропускаем к BotHelp

      // Останавливаем нажатие до того, как его увидит BotHelp
      event.preventDefault();
      event.stopImmediatePropagation();

      if (busy) return;

      if (!consentGiven()) {
        setStatus("Поставьте галочку согласия, чтобы продолжить", "error");
        return;
      }

      busy = true;
      block.dataset.state = "sending";
      if (manualBlock) manualBlock.hidden = true;
      setStatus("Секунду, записываем вас…", "loading");

      try {
        // Тильда не заводит сделку, если заполнены одни скрытые поля, поэтому
        // в «Имя» кладём название лендинга — как и раньше
        const result = await sendToTilda(block, {
          [FIELDS.name]: source,
          [FIELDS.source]: `${source} — ${SOURCE_NOTES.bot}`,
        }, TILDA_TIMEOUT_MS);

        if (result === "error") {
          console.warn("[запись] Тильда не приняла заявку — уводим в мессенджер без неё.");
        }
        if (result === "timeout") {
          console.warn("[запись] Тильда не ответила вовремя — уводим в мессенджер без неё.");
        }
      } catch (error) {
        console.error("[запись] Не получилось отправить заявку в Тильду.", error);
      }

      // Что бы ни случилось с Тильдой, подписку на бота не срываем:
      // без неё человек не получит ссылку на эфир
      block.dataset.state = "idle";
      handoff(button);
    };

    // Слушаем на document в фазе погружения: так мы гарантированно раньше
    // любого обработчика внутри виджета
    document.addEventListener("click", onClick, true);
  };


  /* --------------------------------------------------------------------------
     Е. ЗАПАСНАЯ ФОРМА
     --------------------------------------------------------------------------
     Обычная лид-форма: имя, телефон, мессенджер, галочка согласия.
     Своей отправки у неё нет — данные раскладываются по скрытой форме Тильды.
     Для MAX отдельный номер не спрашиваем: пишем на телефон из формы.
     -------------------------------------------------------------------------- */

  // Телефон приводим к виду +79001234567. Российский номер можно ввести
  // как угодно: 8 900…, 900…, +7 (900)…
  const normalizePhone = (value) => {
    const raw = String(value || "").trim();
    const digits = raw.replace(/\D/g, "");

    if (!digits) return "";
    if (raw.startsWith("+")) return `+${digits}`;
    if (digits.startsWith("00")) return `+${digits.slice(2)}`;
    if (digits.length === 11 && digits.startsWith("8")) return `+7${digits.slice(1)}`;
    if (digits.length === 10) return `+7${digits}`;
    return `+${digits}`;
  };

  const isPhoneValid = (phone) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("7")) return digits.length === 11;
    return digits.length >= 10 && digits.length <= 15;
  };

  // Ник в Telegram: принимаем и «@anna», и «anna», и ссылку t.me/anna
  const normalizeTelegram = (value) => {
    let nick = String(value || "").trim().replace(/^(https?:\/\/)?(t|telegram)\.me\//i, "");
    if (nick && !nick.startsWith("@")) nick = `@${nick}`;
    return nick;
  };

  const TELEGRAM_PATTERN = /^@[A-Za-z0-9_]{4,32}$/;

  // 🟢 Тексты ошибок под полями
  const ERRORS = {
    name: "Напишите, как к вам обращаться",
    phone: "Проверьте номер телефона",
    telegram: "Напишите ник в Telegram, например @anna_petrova",
    consent: "Без согласия мы не сможем записать вас на вебинар",
    send: "Не получилось отправить заявку. Проверьте интернет и попробуйте ещё раз.",
  };

  const setupFallback = (block, ui) => {
    const form = block.querySelector("[data-signup-fallback]");
    const success = block.querySelector("[data-signup-success]");
    const successMessenger = block.querySelector("[data-signup-success-messenger]");
    if (!(form instanceof HTMLFormElement)) return null;

    const { setStatus } = ui;
    const source = block.dataset.signupSource || "";
    const nameInput = form.elements.namedItem("name");
    const phoneInput = form.elements.namedItem("phone");
    const telegramInput = form.elements.namedItem("telegram");
    const consentInput = form.elements.namedItem("consent");
    const messengerInputs = [...form.querySelectorAll('input[name="messenger"]')];
    const telegramField = form.querySelector("[data-signup-telegram-field]");
    const maxNote = form.querySelector("[data-signup-max-note]");
    const submit = form.querySelector("[data-signup-submit]");
    const submitLabel = submit?.querySelector("[data-signup-submit-label]");
    const submitText = submitLabel?.textContent || "";
    let busy = false;

    const selectedMessenger = () =>
      messengerInputs.find((input) => input.checked)?.value || "max";

    // Ошибку пишем под полем; у галочки — своя строка под ней
    const setError = (input, message = "") => {
      if (!(input instanceof HTMLInputElement)) return;
      const field = input.closest("[data-signup-field]");
      const error = field?.querySelector("[data-signup-error]");

      input.setAttribute("aria-invalid", String(Boolean(message)));
      if (field) field.dataset.state = message ? "invalid" : "idle";
      if (error) error.textContent = message;
    };

    const checks = {
      name: () => (nameInput.value.trim().length >= 2 ? "" : ERRORS.name),
      phone: () => (isPhoneValid(normalizePhone(phoneInput.value)) ? "" : ERRORS.phone),
      telegram: () =>
        selectedMessenger() !== "telegram" || TELEGRAM_PATTERN.test(normalizeTelegram(telegramInput.value))
          ? ""
          : ERRORS.telegram,
      consent: () => (consentInput.checked ? "" : ERRORS.consent),
    };

    const inputs = { name: nameInput, phone: phoneInput, telegram: telegramInput, consent: consentInput };

    const validate = (key) => {
      const message = checks[key]();
      setError(inputs[key], message);
      return !message;
    };

    // Поле ника видно только при выборе Telegram
    const renderMessenger = () => {
      const isTelegram = selectedMessenger() === "telegram";
      if (telegramField) telegramField.hidden = !isTelegram;
      if (maxNote) maxNote.hidden = isTelegram;
      telegramInput.disabled = !isTelegram;
      if (!isTelegram) setError(telegramInput);
    };

    messengerInputs.forEach((input) => input.addEventListener("change", renderMessenger));
    renderMessenger();

    // Пока человек печатает, ошибку убираем; проверяем, когда он ушёл с поля
    Object.entries(inputs).forEach(([key, input]) => {
      input.addEventListener(input.type === "checkbox" ? "change" : "input", () => {
        if (input.getAttribute("aria-invalid") === "true") validate(key);
        setStatus();
      });
      if (input.type !== "checkbox") {
        input.addEventListener("blur", () => {
          if (input.value.trim()) validate(key);
        });
      }
    });

    const setBusy = (value) => {
      busy = value;
      block.dataset.state = value ? "sending" : "idle";
      if (submit instanceof HTMLButtonElement) {
        submit.disabled = value;
        submit.setAttribute("aria-busy", String(value));
      }
      if (submitLabel) submitLabel.textContent = value ? "Отправляем…" : submitText;
    };

    const showSuccess = (messenger) => {
      if (successMessenger) successMessenger.textContent = MESSENGER_NAMES[messenger] || "мессенджер";
      form.hidden = true;
      setStatus();
      block.dataset.state = "done";
      if (success instanceof HTMLElement) {
        success.hidden = false;
        // Карточка стала короче — без прокрутки сообщение уехало бы за верх экрана
        success.focus();
      }
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (busy) return;

      const results = Object.keys(checks).map((key) => [key, validate(key)]);
      const firstInvalid = results.find(([, ok]) => !ok);
      if (firstInvalid) {
        inputs[firstInvalid[0]].focus();
        return;
      }

      const messenger = selectedMessenger();
      const phone = normalizePhone(phoneInput.value);

      setBusy(true);
      setStatus("Отправляем заявку…", "loading");

      let result = "error";
      try {
        result = await sendToTilda(block, {
          [FIELDS.name]: nameInput.value.trim(),
          [FIELDS.phone]: phone,
          [FIELDS.messenger]: MESSENGER_NAMES[messenger] || messenger,
          [FIELDS.contact]: messenger === "telegram" ? normalizeTelegram(telegramInput.value) : phone,
          [FIELDS.consent]: "да",
          [FIELDS.source]: `${source} — ${SOURCE_NOTES.form}`,
        }, FALLBACK_TILDA_TIMEOUT_MS);
      } catch (error) {
        console.error("[запись] Не получилось отправить заявку в Тильду.", error);
      }

      // На превью формы Тильды нет — показываем экран успеха, чтобы его
      // можно было проверить. На боевом сайте без формы это ошибка
      if (result === "success" || (result === "skipped" && !IS_PRODUCTION)) {
        setBusy(false);
        block.dataset.state = "done";
        showSuccess(messenger);
        return;
      }

      if (result === "timeout") {
        console.warn("[запись] Тильда не ответила вовремя на заявку из запасной формы.");
      }

      setBusy(false);
      setStatus(ERRORS.send, "error");
    });

    return form;
  };


  /* --------------------------------------------------------------------------
     Ж. ЗАПУСК
     -------------------------------------------------------------------------- */

  blocks.forEach((block) => {
    const formName = block.dataset.tildaFormName || "";
    const mount = block.querySelector("[data-bh-mount]");
    const status = block.querySelector("[data-lead-status]");
    if (!mount) return;

    const skeleton = mount.querySelector("[data-bh-skeleton]");
    const errorNote = mount.querySelector("[data-bh-error]");

    const setStatus = (message = "", state = "idle") => {
      if (!status) return;
      status.textContent = message;
      status.dataset.state = state;
    };

    const ui = { mount, setStatus };
    const fallbackForm = block.querySelector("[data-signup-fallback]");

    // Запоминаем метки сразу при загрузке, не дожидаясь нажатия
    collectUtm(formName);

    block.dataset.signupMode = "waiting";

    watchBotHelp(mount, (result, reason) => {
      if (skeleton) skeleton.hidden = true;
      mount.dataset.bhState = result;

      if (result === "ready") {
        block.dataset.signupMode = "bot";
        setupBotSignup(block, ui);
        return;
      }

      // Запасной формы в разметке нет — показываем старую подсказку
      if (!(fallbackForm instanceof HTMLFormElement)) {
        if (errorNote) errorNote.hidden = false;
        console.warn(`[запись] BotHelp не поднялся: ${reason}. Запасной формы на странице нет.`);
        return;
      }

      console.warn(`[запись] BotHelp не поднялся: ${reason}. Показываем запасную форму.`);
      block.dataset.signupMode = "form";
      mount.hidden = true;
      block.querySelectorAll("[data-bh-only]").forEach((element) => { element.hidden = true; });
      setupFallback(block, ui);
      fallbackForm.hidden = false;
    });

    // Тильда дорисовывает свои блоки позже — прячем её форму, когда появится
    if (formName) {
      hideTildaForm(formName);

      const observer = new MutationObserver(() => {
        if (hideTildaForm(formName)) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });
})();

