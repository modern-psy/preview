/* Сгенерировано: node kpt-bek/build.mjs. Общие скрипты Академии, блок цены и поведение страницы. Руками не править. */

/* === web-academy/shared/academy/components.js === */
// academy-slider-controls:start
(() => {
  window.AcademySliderControls = {
    motion(slider) {
      const style = getComputedStyle(slider);
      const token = style.getPropertyValue('--slider-duration').trim() || style.getPropertyValue('--motion-duration').trim();
      return {
        speed: token ? parseFloat(token) * (token.endsWith('ms') ? 1 : 1000) : 650,
        easing: style.getPropertyValue('--motion-easing').trim() || 'cubic-bezier(0.25, 1, 0.5, 1)',
        reducedMotion: {speed: 0, rewindSpeed: 0, autoplay: 'pause'},
      };
    },
    bind(slider, component, getInstance, previousButton, nextButton) {
      let wheelDistance = 0;
      let wheelIdleTimer = 0;
      let wheelLastMoveAt = Number.NEGATIVE_INFINITY;
      let wheelLastDirection = 0;
      let wheelPreviousMagnitude = 0;
      let wheelAwaitingFreshImpulse = false;

      const getEnd = () => {
        const splide = getInstance();
        if (!splide) return 0;
        let end = splide.Components.Controller.getEnd();
        const move = splide.Components.Move;
        while (end > 0 && Math.abs(move.toPosition(end, true) - move.toPosition(end - 1, true)) < 1) end -= 1;
        return end;
      };
      const updateControls = () => {
        const splide = getInstance();
        const endIndex = getEnd();

        if (previousButton) previousButton.disabled = !splide || splide.index <= 0;
        if (nextButton) nextButton.disabled = !splide || splide.index >= endIndex;
      };

      const showPrevious = () => {
        const splide = getInstance();
        if (splide) splide.go(splide.index > getEnd() ? Math.max(0, getEnd() - 1) : '<');
      };
      const showNext = () => { const splide = getInstance(); if (splide && splide.index < getEnd()) splide.go('>'); };

      const resetWheelGesture = () => {
        wheelDistance = 0;
        wheelIdleTimer = 0;
        wheelLastDirection = 0;
        wheelPreviousMagnitude = 0;
        wheelAwaitingFreshImpulse = false;
      };

      const handleWheel = (event) => {
        const splide = getInstance();
        if (!splide || event.defaultPrevented || event.ctrlKey || event.metaKey) return;
        const protectedTarget = event.target.closest('[data-slider-no-drag], input, textarea, select, [contenteditable]');
        if (protectedTarget && !(protectedTarget.matches('[data-review-video]') && !protectedTarget.controls)) return;

        const horizontalDistance = Math.abs(event.deltaX);
        const verticalDistance = Math.abs(event.deltaY);
        if (horizontalDistance < 1 || horizontalDistance <= verticalDistance) return;
        const delta = event.deltaX;

        const endIndex = getEnd();
        if ((delta < 0 && splide.index <= 0) || (delta > 0 && splide.index >= endIndex)) {
          window.clearTimeout(wheelIdleTimer);
          resetWheelGesture();
          return;
        }

        event.preventDefault();
        window.clearTimeout(wheelIdleTimer);
        wheelIdleTimer = window.setTimeout(resetWheelGesture, 140);

        const deltaMultiplier =
          event.deltaMode === WheelEvent.DOM_DELTA_LINE
            ? 16
            : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
              ? window.innerWidth
              : 1;
        const normalizedDelta = delta * deltaMultiplier;
        const normalizedMagnitude = Math.abs(normalizedDelta);
        const normalizedDirection = Math.sign(normalizedDelta);
        const eventTime = event.timeStamp;

        if (wheelAwaitingFreshImpulse) {
          const impulseDelayElapsed = eventTime - wheelLastMoveAt >= 96;
          const directionChanged = normalizedDirection !== wheelLastDirection;
          const magnitudeIncreased =
            normalizedMagnitude >= 4 &&
            normalizedMagnitude >= wheelPreviousMagnitude * 1.35;

          wheelPreviousMagnitude = normalizedMagnitude;

          if (!impulseDelayElapsed || (!directionChanged && !magnitudeIncreased)) {
            return;
          }

          wheelDistance = 0;
          wheelAwaitingFreshImpulse = false;
        }

        if (wheelDistance !== 0 && Math.sign(wheelDistance) !== normalizedDirection) {
          wheelDistance = 0;
        }

        wheelDistance += normalizedDelta;
        wheelPreviousMagnitude = normalizedMagnitude;

        if (Math.abs(wheelDistance) < 36) return;

        wheelDistance = 0;
        wheelLastMoveAt = eventTime;
        wheelLastDirection = normalizedDirection;
        wheelAwaitingFreshImpulse = true;

        if (normalizedDirection > 0) showNext();
        else showPrevious();
      };

      const handleKeydown = (event) => {
        const splide = getInstance();
        if (
          !splide ||
          event.target.closest('[data-slider-no-drag], input, textarea, select, [contenteditable]') ||
          event.defaultPrevented ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey
        ) {
          return;
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          showPrevious();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          showNext();
        }
      };

      const focusSlider = (event) => {
        if (!event.target.closest('button, a, input, textarea, select, [contenteditable], [data-slider-no-drag]')) slider.focus({ preventScroll: true });
      };


      previousButton?.addEventListener('click', showPrevious);
      nextButton?.addEventListener('click', showNext);
      slider.addEventListener('wheel', handleWheel, {passive: false});
      slider.addEventListener('pointerdown', focusSlider);
      component.addEventListener('keydown', handleKeydown);
      return {
        update: updateControls,
        destroy() {
          previousButton?.removeEventListener('click', showPrevious);
          nextButton?.removeEventListener('click', showNext);
          slider.removeEventListener('wheel', handleWheel);
          slider.removeEventListener('pointerdown', focusSlider);
          component.removeEventListener('keydown', handleKeydown);
          window.clearTimeout(wheelIdleTimer);
        },
      };
    },
  };
})();
// academy-slider-controls:end

(() => {
  if (typeof window.__academyComponentsCleanup === "function") {
    window.__academyComponentsCleanup();
  }

  const pages = [...document.querySelectorAll(".academy-page")]
    .filter(page => !page.parentElement?.closest(".academy-page"));
  if (!pages.length) return;
  const pageCleanups = [];
  pages.forEach(page => {
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const touchPointerQuery = window.matchMedia("(hover: none), (pointer: coarse)");
  const componentCleanups = [];
  const motionStyle = getComputedStyle(page);
  const motionDuration = parseFloat(motionStyle.getPropertyValue("--motion-duration")) || 300;
  const motionEasing = motionStyle.getPropertyValue("--motion-easing").trim();
  const touchHighlightTones = ["is-bright", "is-medium", "is-muted", "is-medium"];
  const neighborOffsets = [
    { column: -1, row: 0 },
    { column: 1, row: 0 },
    { column: 0, row: -1 },
    { column: 0, row: 1 },
  ];
  const neighborDelays = { medium: 70, muted: 130 };
  const defaultCometOrigins = [
    { x: 382, y: 164, size: 16 },
    { x: 282, y: 264, size: 12 },
    { x: 1082, y: 164, size: 20 },
    { x: 982, y: 64, size: 10 },
  ];
  const cometDirections = [
    { name: "right", x: 1, y: 0, angle: 0 },
    { name: "down", x: 0, y: 1, angle: 90 },
    { name: "left", x: -1, y: 0, angle: 180 },
    { name: "up", x: 0, y: -1, angle: 270 },
  ];

  page.querySelectorAll("[data-cta-grid]").forEach((component) => {
    const stage = component.querySelector("[data-cta-grid-stage]");
    const highlightLayer = component.querySelector("[data-cta-grid-highlights]");
    const cometLayer = component.querySelector("[data-cta-comet-layer]");

    if (!stage || !highlightLayer) return;

    component.dataset.interactiveGridInitialized = "true";

    const cells = new Map();
    const gridCellSize = Number.parseFloat(stage.dataset.gridCellSize || "100");
    const gridOrigin = {
      x: Number.parseFloat(stage.dataset.gridOriginX || "82"),
      y: Number.parseFloat(stage.dataset.gridOriginY || "64"),
    };
    const gridColumns = {
      min: Number.parseInt(stage.dataset.gridColumnMin || "-1", 10),
      max: Number.parseInt(stage.dataset.gridColumnMax || "11", 10),
    };
    const gridRows = {
      min: Number.parseInt(stage.dataset.gridRowMin || "-1", 10),
      max: Number.parseInt(stage.dataset.gridRowMax || "2", 10),
    };
    let activeCellKey = "";
    let pointerFrame = 0;
    let resizeFrame = 0;
    let latestPointer = null;
    let isInViewport = false;
    let cometTimer = 0;
    let isDestroyed = false;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const isTouchGridMode = () =>
      touchPointerQuery.matches || !finePointerQuery.matches;

    const clearHighlights = () => {
      cells.forEach((cell) => {
        cell.classList.remove(
          "is-muted",
          "is-medium",
          "is-bright",
          "is-touch-static",
        );
      });
      activeCellKey = "";
    };

    const buildCells = () => {
      clearHighlights();
      highlightLayer.replaceChildren();
      cells.clear();

      for (let row = gridRows.min; row <= gridRows.max; row += 1) {
        for (let column = gridColumns.min; column <= gridColumns.max; column += 1) {
          const cell = document.createElement("span");
          const key = `${column}:${row}`;

          cell.className = "interactive-grid_cell";
          cell.style.setProperty(
            "--grid-cell-x",
            `${gridOrigin.x + column * gridCellSize}px`,
          );
          cell.style.setProperty(
            "--grid-cell-y",
            `${gridOrigin.y + row * gridCellSize}px`,
          );
          cell.style.setProperty("--grid-cell-size", `${gridCellSize}px`);
          highlightLayer.append(cell);
          cells.set(key, cell);
        }
      }
    };

    const setHighlight = (column, row, className, delay = 0) => {
      const cell = cells.get(`${column}:${row}`);

      if (!cell) return;

      cell.style.setProperty("--grid-cell-delay", `${delay}ms`);
      cell.classList.add(className);
    };

    const shuffle = (items) => {
      const shuffled = [...items];

      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
      }

      return shuffled;
    };

    const getTouchHighlightCandidates = () => {
      const componentRect = component.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const visibleBounds = {
        top: Math.max(componentRect.top, stageRect.top),
        right: Math.min(componentRect.right, stageRect.right),
        bottom: Math.min(componentRect.bottom, stageRect.bottom),
        left: Math.max(componentRect.left, stageRect.left),
      };
      const visibleWidth = Math.max(0, visibleBounds.right - visibleBounds.left);
      const visibleHeight = Math.max(0, visibleBounds.bottom - visibleBounds.top);
      const insetX = Math.min(gridCellSize * 0.6, visibleWidth * 0.18);
      const insetY = Math.min(gridCellSize * 0.45, visibleHeight * 0.16);

      const collectCandidates = (candidateInsetX, candidateInsetY) => {
        const candidates = [];

        for (let row = gridRows.min; row <= gridRows.max; row += 1) {
          for (let column = gridColumns.min; column <= gridColumns.max; column += 1) {
            const centerX =
              stageRect.left + gridOrigin.x + column * gridCellSize + gridCellSize / 2;
            const centerY =
              stageRect.top + gridOrigin.y + row * gridCellSize + gridCellSize / 2;

            if (
              centerX >= visibleBounds.left + candidateInsetX &&
              centerX <= visibleBounds.right - candidateInsetX &&
              centerY >= visibleBounds.top + candidateInsetY &&
              centerY <= visibleBounds.bottom - candidateInsetY
            ) {
              candidates.push({ column, row, x: centerX, y: centerY });
            }
          }
        }

        return candidates;
      };
      const insetCandidates = collectCandidates(insetX, insetY);

      return insetCandidates.length >= 4 ? insetCandidates : collectCandidates(0, 0);
    };

    const applyTouchHighlights = () => {
      clearHighlights();

      if (!isTouchGridMode() || reducedMotionQuery.matches) {
        component.dataset.gridInputMode = reducedMotionQuery.matches
          ? "reduced-motion"
          : "fine";
        return;
      }

      component.dataset.gridInputMode = "touch-static";

      const candidates = getTouchHighlightCandidates();

      if (!candidates.length) return;

      const bounds = candidates.reduce(
        (result, candidate) => ({
          minX: Math.min(result.minX, candidate.x),
          maxX: Math.max(result.maxX, candidate.x),
          minY: Math.min(result.minY, candidate.y),
          maxY: Math.max(result.maxY, candidate.y),
        }),
        { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
      );
      const midpoint = {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2,
      };
      const quadrantChecks = [
        (candidate) => candidate.x <= midpoint.x && candidate.y <= midpoint.y,
        (candidate) => candidate.x > midpoint.x && candidate.y <= midpoint.y,
        (candidate) => candidate.x <= midpoint.x && candidate.y > midpoint.y,
        (candidate) => candidate.x > midpoint.x && candidate.y > midpoint.y,
      ];
      const selected = [];

      quadrantChecks.forEach((isInQuadrant) => {
        const options = candidates.filter(
          (candidate) =>
            isInQuadrant(candidate) &&
            !selected.some(
              (selectedCandidate) =>
                selectedCandidate.column === candidate.column &&
                selectedCandidate.row === candidate.row,
            ),
        );

        if (options.length) {
          selected.push(options[Math.floor(Math.random() * options.length)]);
        }
      });

      shuffle(candidates).forEach((candidate) => {
        if (selected.length >= 4) return;
        if (
          selected.some(
            (selectedCandidate) =>
              selectedCandidate.column === candidate.column &&
              selectedCandidate.row === candidate.row,
          )
        ) {
          return;
        }

        selected.push(candidate);
      });

      selected.slice(0, 4).forEach((candidate, index) => {
        const cell = cells.get(`${candidate.column}:${candidate.row}`);

        if (!cell) return;

        setHighlight(candidate.column, candidate.row, touchHighlightTones[index]);
        cell.classList.add("is-touch-static");
      });
    };

    const updateGrid = (clientX, clientY) => {
      if (isTouchGridMode() || reducedMotionQuery.matches) return;

      const stageRect = stage.getBoundingClientRect();
      const column = clamp(
        Math.floor((clientX - stageRect.left - gridOrigin.x) / gridCellSize),
        gridColumns.min,
        gridColumns.max,
      );
      const row = clamp(
        Math.floor((clientY - stageRect.top - gridOrigin.y) / gridCellSize),
        gridRows.min,
        gridRows.max,
      );
      const nextCellKey = `${column}:${row}`;

      if (activeCellKey === nextCellKey) return;

      clearHighlights();
      setHighlight(column, row, "is-bright");

      const availableOffsets = neighborOffsets.filter(
        (offset) =>
          column + offset.column >= gridColumns.min &&
          column + offset.column <= gridColumns.max &&
          row + offset.row >= gridRows.min &&
          row + offset.row <= gridRows.max,
      );
      const cornerPairs = [];

      for (let firstIndex = 0; firstIndex < availableOffsets.length; firstIndex += 1) {
        for (
          let secondIndex = firstIndex + 1;
          secondIndex < availableOffsets.length;
          secondIndex += 1
        ) {
          const first = availableOffsets[firstIndex];
          const second = availableOffsets[secondIndex];
          const dotProduct = first.column * second.column + first.row * second.row;

          if (dotProduct === 0) cornerPairs.push([first, second]);
        }
      }

      const selectedPair =
        cornerPairs[Math.floor(Math.random() * cornerPairs.length)] || [];
      const [mediumOffset, mutedOffset] = selectedPair;

      if (mediumOffset) {
        setHighlight(
          column + mediumOffset.column,
          row + mediumOffset.row,
          "is-medium",
          neighborDelays.medium,
        );
      }

      if (mutedOffset) {
        setHighlight(
          column + mutedOffset.column,
          row + mutedOffset.row,
          "is-muted",
          neighborDelays.muted,
        );
      }

      activeCellKey = nextCellKey;
    };

    const handlePointerPosition = (event) => {
      if (isTouchGridMode() || reducedMotionQuery.matches) return;

      latestPointer = { x: event.clientX, y: event.clientY };

      if (pointerFrame) return;

      pointerFrame = window.requestAnimationFrame(() => {
        pointerFrame = 0;
        if (latestPointer) updateGrid(latestPointer.x, latestPointer.y);
      });
    };

    const handlePointerLeave = () => {
      latestPointer = null;
      window.cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;

      if (!isTouchGridMode()) clearHighlights();
    };

    const requestCellBuild = () => {
      if (!isTouchGridMode() || resizeFrame) return;

      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        applyTouchHighlights();
      });
    };

    const syncGridInputMode = () => {
      latestPointer = null;
      window.cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;

      if ((isTouchGridMode() || reducedMotionQuery.matches) && cometLayer) {
        cometLayer.replaceChildren();
      }

      applyTouchHighlights();
    };

    const spawnComet = () => {
      if (
        isDestroyed ||
        !isInViewport ||
        document.hidden ||
        reducedMotionQuery.matches ||
        isTouchGridMode() ||
        !cometLayer
      ) {
        return;
      }

      const origin =
        defaultCometOrigins[Math.floor(Math.random() * defaultCometOrigins.length)];
      const direction =
        cometDirections[Math.floor(Math.random() * cometDirections.length)];
      const startGap = origin.size / 2 + 4;
      const distance = 32 + Math.random() * 28;
      const startX = origin.x + direction.x * startGap;
      const startY = origin.y + direction.y * startGap;
      const offsetX = direction.x * distance;
      const offsetY = direction.y * distance;
      const comet = document.createElement("span");

      comet.className = "cta_comet";
      comet.dataset.direction = direction.name;
      comet.style.left = `${startX}px`;
      comet.style.top = `${startY}px`;
      cometLayer.append(comet);

      if (typeof comet.animate !== "function") {
        comet.remove();
        return;
      }

      const animation = comet.animate(
        [
          {
            opacity: 0,
            transform: `translate3d(0, 0, 0) rotate(${direction.angle}deg)`,
          },
          { opacity: 0.38, offset: 0.24 },
          {
            opacity: 0,
            transform: `translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${direction.angle}deg)`,
          },
        ],
        {
          duration: motionDuration,
          easing: motionEasing || "cubic-bezier(0.4, 0, 0.2, 1)",
        },
      );

      animation.addEventListener("finish", () => comet.remove(), { once: true });
      animation.addEventListener("cancel", () => comet.remove(), { once: true });
    };

    const scheduleComet = () => {
      window.clearTimeout(cometTimer);

      if (isDestroyed || reducedMotionQuery.matches || isTouchGridMode()) return;

      cometTimer = window.setTimeout(() => {
        spawnComet();
        scheduleComet();
      }, 4200 + Math.random() * 4200);
    };

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              isInViewport = entries.some((entry) => entry.isIntersecting);
            },
            { threshold: 0.15 },
          )
        : null;
    const resizeObserver =
      "ResizeObserver" in window ? new ResizeObserver(requestCellBuild) : null;

    buildCells();
    applyTouchHighlights();
    component.addEventListener("pointerenter", handlePointerPosition);
    component.addEventListener("pointermove", handlePointerPosition);
    component.addEventListener("pointerleave", handlePointerLeave);
    resizeObserver?.observe(component);
    observer?.observe(component);
    finePointerQuery.addEventListener("change", syncGridInputMode);
    touchPointerQuery.addEventListener("change", syncGridInputMode);
    reducedMotionQuery.addEventListener("change", syncGridInputMode);

    if (!observer) isInViewport = true;
    scheduleComet();

    componentCleanups.push(() => {
      isDestroyed = true;
      window.clearTimeout(cometTimer);
      window.cancelAnimationFrame(pointerFrame);
      window.cancelAnimationFrame(resizeFrame);
      resizeObserver?.disconnect();
      observer?.disconnect();
      component.removeEventListener("pointerenter", handlePointerPosition);
      component.removeEventListener("pointermove", handlePointerPosition);
      component.removeEventListener("pointerleave", handlePointerLeave);
      finePointerQuery.removeEventListener("change", syncGridInputMode);
      touchPointerQuery.removeEventListener("change", syncGridInputMode);
      reducedMotionQuery.removeEventListener("change", syncGridInputMode);
      highlightLayer.replaceChildren();
      cometLayer?.replaceChildren();
      delete component.dataset.interactiveGridInitialized;
      delete component.dataset.gridInputMode;
    });
  });

  page.querySelectorAll("[data-accordion]").forEach((accordion) => {
    const accordionToken = getComputedStyle(accordion).getPropertyValue('--accordion-duration').trim();
    const accordionDuration = accordionToken ? parseFloat(accordionToken) * (accordionToken.endsWith('ms') ? 1 : 1000) : motionDuration;
    const items = Array.from(accordion.querySelectorAll("[data-accordion-item]"));
    const itemAnimations = new Map();
    const listeners = [];
    const singleOpen = accordion.hasAttribute("data-accordion-single");

    const getParts = (item) => ({
      summary: item.querySelector("[data-accordion-trigger]"),
      panel: item.querySelector("[data-accordion-panel]"),
    });

    const syncState = (item, isOpen) => {
      const { summary } = getParts(item);

      summary?.setAttribute("aria-expanded", String(isOpen));
      item.dataset.accordionState = isOpen ? "open" : "closed";
    };

    const setOpen = (item, shouldOpen, shouldAnimate = true) => {
      const { summary, panel } = getParts(item);

      if (!summary || !panel) return;

      itemAnimations.get(item)?.cancel();
      itemAnimations.delete(item);

      if (
        !shouldAnimate ||
        reducedMotionQuery.matches ||
        typeof panel.animate !== "function"
      ) {
        item.open = shouldOpen;
        syncState(item, shouldOpen);
        return;
      }

      summary.setAttribute("aria-expanded", String(shouldOpen));

      if (shouldOpen) {
        item.open = true;
        item.dataset.accordionState = "opening";

        const targetHeight = panel.scrollHeight;
        const animation = panel.animate(
          [
            { height: "0px", opacity: 0 },
            { height: `${targetHeight}px`, opacity: 1 },
          ],
          {
            duration: accordionDuration,
            easing: motionEasing || "cubic-bezier(0.22, 1, 0.36, 1)",
          },
        );

        itemAnimations.set(item, animation);
        animation.addEventListener(
          "finish",
          () => {
            itemAnimations.delete(item);
            syncState(item, true);
          },
          { once: true },
        );
        return;
      }

      if (!item.open) {
        syncState(item, false);
        return;
      }

      item.dataset.accordionState = "closing";

      const startHeight = panel.getBoundingClientRect().height;
      const animation = panel.animate(
        [
          { height: `${startHeight}px`, opacity: 1 },
          { height: "0px", opacity: 0 },
        ],
        {
          duration: accordionDuration,
          easing: motionEasing || "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      );

      itemAnimations.set(item, animation);
      animation.addEventListener(
        "finish",
        () => {
          itemAnimations.delete(item);
          item.open = false;
          syncState(item, false);
        },
        { once: true },
      );
    };

    items.forEach((item) => {
      const { summary } = getParts(item);

      if (!summary) return;

      syncState(item, item.open);

      const handleSummaryClick = (event) => {
        event.preventDefault();

        const shouldOpen =
          !item.open || item.dataset.accordionState === "closing";

        if (shouldOpen && singleOpen) {
          items.forEach((otherItem) => {
            if (otherItem !== item) setOpen(otherItem, false);
          });
        }

        setOpen(item, shouldOpen);
      };

      summary.addEventListener("click", handleSummaryClick);
      listeners.push(() => summary.removeEventListener("click", handleSummaryClick));
    });

    accordion.dataset.accordionInitialized = "true";

    componentCleanups.push(() => {
      listeners.splice(0).forEach((removeListener) => removeListener());
      itemAnimations.forEach((animation) => animation.cancel());
      itemAnimations.clear();
      items.forEach((item) => {
        delete item.dataset.accordionState;
      });
      delete accordion.dataset.accordionInitialized;
    });
  });

  page.querySelectorAll("[data-academy-slider]").forEach((slider) => {
    const component = slider.closest("[data-slider-component]") || slider;
    const previousButton = component.querySelector("[data-slider-previous]");
    const nextButton = component.querySelector("[data-slider-next]");
    const sliderQuery = window.matchMedia(slider.hasAttribute("data-slider-all-widths") ? "(min-width: 0px)" : "(min-width: 32.5625rem)");
    let splide = null;
    const controls = window.AcademySliderControls.bind(slider, component, () => splide, previousButton, nextButton);
    const updateControls = controls.update;

    const destroySlider = () => {
      if (!splide) return;

      splide.destroy(true);
      splide = null;
      delete slider.dataset.splideInitialized;
      updateControls();
    };

    const mountSlider = () => {
      if (
        splide ||
        !sliderQuery.matches ||
        typeof window.Splide !== "function"
      ) {
        updateControls();
        return;
      }

      splide = new window.Splide(slider, {
        type: "slide",
        autoWidth: true,
        gap: "var(--slider-gap, 1rem)",
        arrows: false,
        pagination: false,
        drag: true,
        keyboard: false,
        wheel: false,
        snap: true,
        rewind: false,
        waitForTransition: false,
        perMove: 1,
        ...window.AcademySliderControls.motion(slider),
        noDrag: '[data-slider-no-drag], button, a',
        focusableNodes: 'a, button, textarea, input, select, iframe',
        reducedMotion: {
          speed: 0,
          rewindSpeed: 0,
          autoplay: "pause",
        },
        i18n: {
          prev: "Предыдущие преподаватели",
          next: "Следующие преподаватели",
          first: "Перейти к первому преподавателю",
          last: "Перейти к последнему преподавателю",
          slideX: "Перейти к слайду %s",
          pageX: "Перейти на страницу %s",
          carousel: slider.dataset.sliderLabel || "Преподаватели курса",
          select: "Выберите слайд",
          slide: "Слайд",
          slideLabel: "%s из %s",
        },
      });

      splide.on("mounted move moved updated resized", updateControls);
      splide.on("visible hidden", ({slide}) => {
        slide.querySelectorAll('[data-review-full]').forEach(panel => {
          panel.tabIndex = !panel.hidden && slide.getAttribute('aria-hidden') !== 'true' ? 0 : -1;
        });
      });
      splide.mount();
      // Enhancement switches the authored grid to a flex track. Re-measure it
      // after .is-initialized is applied so omitEnd uses actual slide geometry.
      splide.refresh();
      slider.dataset.splideInitialized = "true";
    };

    const syncSliderMode = () => {
      if (sliderQuery.matches) mountSlider();
      else destroySlider();
    };

    sliderQuery.addEventListener("change", syncSliderMode);
    syncSliderMode();

    componentCleanups.push(() => {
      controls.destroy();
      sliderQuery.removeEventListener("change", syncSliderMode);
      destroySlider();
    });
  });

  pageCleanups.push(() => {
    componentCleanups.splice(0).forEach((componentCleanup) => componentCleanup());
  });
  });

  const cleanup = () => {
    pageCleanups.splice(0).forEach(pageCleanup => pageCleanup());
    window.removeEventListener("pagehide", cleanup);

    if (window.__academyComponentsCleanup === cleanup) {
      delete window.__academyComponentsCleanup;
    }
  };

  window.__academyComponentsCleanup = cleanup;
  window.addEventListener("pagehide", cleanup, { once: true });
})();

/* === web-academy/shared/academy/anchor-scroll.js === */
(() => {
  window.__academyAnchorScrollCleanup?.();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const interruptEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown', 'popstate', 'hashchange'];
  let frame = 0;
  let finish = null;
  let releaseFocus = null;

  const cancel = () => {
    window.cancelAnimationFrame(frame);
    frame = 0;
    finish = null;
    interruptEvents.forEach(name => window.removeEventListener(name, cancel));
  };

  const focusTarget = target => {
    releaseFocus?.();
    if (!target.hasAttribute('tabindex') && target.tabIndex < 0) {
      target.setAttribute('tabindex', '-1');
      releaseFocus = () => {
        if (target.getAttribute('tabindex') === '-1') target.removeAttribute('tabindex');
        target.removeEventListener('blur', releaseFocus);
        releaseFocus = null;
      };
      target.addEventListener('blur', releaseFocus);
    }
    target.focus({ preventScroll: true });
  };

  const handleClick = event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
        event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
    const link = event.target.closest('a[href^="#"]');
    const root = link?.closest('[data-academy-anchor-scroll]');
    const hash = link?.getAttribute('href');
    if (!root || !hash || hash === '#' ||
        link.matches('.skip-link, [data-anchor-scroll-ignore], [aria-disabled="true"], [download]') ||
        link.hasAttribute("data-tilda-popup-link") ||
        (link.target && link.target.toLowerCase() !== '_self')) return;

    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!(target instanceof HTMLElement) || !target.getClientRects().length) return;

    event.preventDefault();
    cancel();
    releaseFocus?.();
    const startY = window.scrollY;
    const scrollMarginTop = parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const targetY = Math.min(maxY, Math.max(0, target.getBoundingClientRect().top + startY - scrollMarginTop));
    const distance = targetY - startY;
    const left = window.scrollX;
    const scroll = top => window.scrollTo({ left, top, behavior: 'instant' });

    if (window.location.hash === hash) {
      window.history.replaceState(window.history.state, '', hash);
    } else {
      window.history.pushState(window.history.state, '', hash);
    }

    finish = () => {
      cancel();
      if (!target.isConnected || !root.isConnected) return;
      scroll(targetY);
      focusTarget(target);
    };
    if (reducedMotion.matches || Math.abs(distance) < 1) {
      finish();
      return;
    }

    const duration = Math.min(900, Math.max(480, Math.abs(distance) * 0.28));
    const startTime = performance.now();
    interruptEvents.forEach(name => window.addEventListener(name, cancel, { passive: true }));
    const render = currentTime => {
      if (!target.isConnected || !root.isConnected) { cancel(); return; }
      const progress = Math.min(1, Math.max(0, (currentTime - startTime) / duration));
      if (progress === 1) { finish(); return; }
      scroll(startY + distance * (1 - (1 - progress) ** 3));
      frame = window.requestAnimationFrame(render);
    };
    frame = window.requestAnimationFrame(render);
  };

  const handleMotionChange = () => { if (reducedMotion.matches) finish?.(); };
  document.addEventListener('click', handleClick);
  reducedMotion.addEventListener('change', handleMotionChange);
  window.__academyAnchorScrollCleanup = () => {
    cancel();
    releaseFocus?.();
    document.removeEventListener('click', handleClick);
    reducedMotion.removeEventListener('change', handleMotionChange);
  };
})();

/* === web-academy/shared/academy/lead-form.js === */
// Academy lead form: opt-in UI and Tilda bridge. Integration: lead-form.md.
(() => {
  if (typeof window.__academyLeadFormCleanup === "function") {
    window.__academyLeadFormCleanup();
  }

  const forms = [...document.querySelectorAll(".academy-page [data-academy-lead-form]")];
  if (!forms.length) return;

  const INTL_TEL_INPUT_UTILS_URL =
    "https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/js/utils.js";
  // Longest wait for the utils module before phone validation falls back to the
  // plausibility check; exact validation takes over once the module arrives.
  const INTL_TEL_INPUT_UTILS_WAIT_MS = 1500;
  const ASCII_EMAIL_PATTERN =
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
  const TELEGRAM_USERNAME_PATTERN = /^@[A-Za-z0-9_]{3,32}$/;
  const formControllers = [];
  const observedTildaFormNames = new Set();

  const normalizePhoneToE164 = (value, defaultCallingCode = "7") => {
    const rawValue = String(value || "").trim();
    let digits = rawValue.replace(/\D/g, "");

    if (!digits) {
      return "";
    }

    if (digits.startsWith("00")) {
      return `+${digits.slice(2, 17)}`;
    }

    if (rawValue.startsWith("+")) {
      return `+${digits.slice(0, 15)}`;
    }

    if (defaultCallingCode === "7") {
      if (digits.length === 11 && digits.startsWith("8")) {
        digits = `7${digits.slice(1)}`;
      } else if (digits.length === 10) {
        digits = `7${digits}`;
      } else if (!digits.startsWith("7")) {
        digits = `7${digits}`;
      }
    } else if (!digits.startsWith(defaultCallingCode)) {
      digits = `${defaultCallingCode}${digits}`;
    }

    return `+${digits.slice(0, 15)}`;
  };

  const isPlausibleInternationalPhone = (value) => {
    const digits = String(value || "").replace(/\D/g, "");

    return digits.length >= 8 && digits.length <= 15;
  };

  const getTildaPhoneValue = (value) => {
    const e164Value = normalizePhoneToE164(value);
    const digits = e164Value.replace(/\D/g, "");

    if (!digits) {
      return "";
    }

    return digits.startsWith("7") ? digits.slice(1, 11) : `+${digits}`;
  };

  const dispatchNativeInputEvents = (input) => {
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const setNativeInputValue = (input, value) => {
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;

    if (valueSetter) {
      valueSetter.call(input, value);
    } else {
      input.value = value;
    }

    dispatchNativeInputEvents(input);
  };

  const findTildaForm = (formName) =>
    (formName && [...document.querySelectorAll("form.t-form")].find(
      (form) =>
        form.querySelector('input[name="tildaspec-formname"]')?.value ===
        formName,
    )) || null;

  const hideTildaFormRecord = (formName) => {
    const nativeForm = findTildaForm(formName);

    if (!(nativeForm instanceof HTMLFormElement)) {
      return null;
    }

    const record = nativeForm.closest(".t-rec") || nativeForm;

    record.hidden = true;
    record.setAttribute("aria-hidden", "true");
    record.setAttribute("data-academy-native-form-record", "");

    return nativeForm;
  };

  const hideKnownTildaForms = () => {
    observedTildaFormNames.forEach(hideTildaFormRecord);
    if (observedTildaFormNames.size && [...observedTildaFormNames].every(findTildaForm)) {
      tildaFormObserver.disconnect();
      clearTimeout(discoveryTimer);
    }
  };

  const tildaFormObserver = new MutationObserver(hideKnownTildaForms);
  const discoveryTimer = setTimeout(() => tildaFormObserver.disconnect(), 10000);

  tildaFormObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  const initializePhoneInput = (input) => {
    let utilsReady = false;
    let instance = null;
    let ready = Promise.resolve();

    if (
      input instanceof HTMLInputElement &&
      typeof window.intlTelInput === "function"
    ) {
      instance = window.intlTelInput(input, {
        countryNameLocale: "ru",
        countryOrder: ["ru", "kz", "by", "uz"],
        countrySearch: true,
        countrySelectorMode: "AUTO",
        dropdownParent: document.body,
        formatAsYouType: true,
        initialCountry: "ru",
        loadUtils: () => import(INTL_TEL_INPUT_UTILS_URL),
        numberDisplayFormat: "INTERNATIONAL",
        placeholderNumberPolicy: "AGGRESSIVE",
        separateDialCode: true,
        strictMode: true,
        uiTranslations: {
          selectedCountryAriaLabel:
            "Изменить страну номера, выбрана ${countryName} (${dialCode})",
          noCountrySelected: "Выбрать страну номера телефона",
          countryListAriaLabel: "Список стран",
          searchPlaceholder: "Поиск страны или кода",
          clearSearchAriaLabel: "Очистить поиск",
          searchEmptyState: "Страна не найдена",
          searchSummaryAria(count) {
            return `Найдено стран: ${count}`;
          },
        },
      });
      // The library defers the utils download until the window "load" event. On
      // pages with heavy third-party widgets (modern-psy.ru: the Jivo chat arrives
      // after ~6 s) that kept phone validation and the submit button pending.
      // Start the download now; a repeated call is a no-op inside the library.
      window.intlTelInput.attachUtils?.(() => import(INTL_TEL_INPUT_UTILS_URL))?.catch(() => {});
      ready = Promise.race([
        instance.promise
          .then(() => {
            utilsReady = true;
          })
          .catch(() => {
            utilsReady = false;
          }),
        new Promise((resolve) => {
          window.setTimeout(resolve, INTL_TEL_INPUT_UTILS_WAIT_MS);
        }),
      ]);
    }

    return {
      destroy() {
        instance?.destroy();
        instance = null;
      },
      getCountryCallingCode() {
        return instance?.getSelectedCountry?.()?.dialCode || "7";
      },
      getNumber() {
        if (utilsReady && instance?.isValidNumber()) {
          return instance.getNumber();
        }

        return normalizePhoneToE164(
          input.value,
          instance?.getSelectedCountry?.()?.dialCode || "7",
        );
      },
      isValid() {
        const normalized = normalizePhoneToE164(
          input.value,
          instance?.getSelectedCountry?.()?.dialCode || "7",
        );

        return utilsReady && instance
          ? instance.isValidNumber()
          : isPlausibleInternationalPhone(normalized);
      },
      ready,
    };
  };

  const fillTildaPhoneGroup = (group, e164Phone, resultName) => {
    if (!(group instanceof HTMLElement)) {
      return;
    }

    const visibleInputs = [
      ...group.querySelectorAll(
        'input.t-input-phonemask:not([type="hidden"])',
      ),
    ];

    const tildaControlsPhoneMask =
      typeof window.t_form_phonemask__setValue === "function";

    if (tildaControlsPhoneMask) {
      window.t_form_phonemask__setValue(group, e164Phone, undefined, {
        noFocus: true,
      });
    } else {
      visibleInputs.forEach((input) => {
        setNativeInputValue(input, getTildaPhoneValue(e164Phone));
      });
    }

    const visibleInput = visibleInputs[0];
    const visiblePhone =
      visibleInput?.dataset.phonemaskCurrent || visibleInput?.value || "";
    const dialCode = visibleInput?.dataset.phonemaskCode || "";
    const formattedPhone = visiblePhone.startsWith("+")
      ? visiblePhone
      : `${dialCode} ${visiblePhone}`.trim();

    group
      .querySelectorAll(`input.js-phonemask-result[name="${resultName}"]`)
      .forEach((input) => {
        setNativeInputValue(input, formattedPhone || e164Phone);
      });

    group
      .querySelectorAll('input.js-phonemask-result-iso')
      .forEach((input) => {
        setNativeInputValue(
          input,
          visibleInput?.dataset.phonemaskIso || input.value || "ru",
        );
      });
  };

  const selectTildaMessenger = (group, messenger) => {
    const radios = [
      ...group.querySelectorAll('input[type="radio"][name="messenger-type"]'),
    ];
    const telegramRadio = radios.find((radio) => radio.value === "telegram");
    // MAX slot differs between Tilda blocks: `max`, `max_messenger` (newer contact
    // block) or a reused `whatsapp`. Never fall back to the Telegram radio.
    const maxRadio =
      radios.find((radio) => radio.value === "max" || radio.value === "max_messenger") ||
      radios.find((radio) => radio.value === "whatsapp") ||
      radios.find((radio) => radio.value !== "telegram");

    if (maxRadio && !maxRadio.dataset.academyOriginalValue) {
      maxRadio.dataset.academyOriginalValue = maxRadio.value;
    }

    if (maxRadio?.dataset.academyOriginalValue) {
      maxRadio.value = maxRadio.dataset.academyOriginalValue;
    }

    const selectedRadio = messenger === "telegram" ? telegramRadio : maxRadio;

    if (!(selectedRadio instanceof HTMLInputElement)) {
      return "";
    }

    // Native type before the whatsapp → max rename: it names the matching value field.
    const selectedType = selectedRadio.value;

    selectedRadio.checked = true;
    selectedRadio.dispatchEvent(new Event("input", { bubbles: true }));
    selectedRadio.dispatchEvent(new Event("change", { bubbles: true }));

    if (messenger === "max" && selectedRadio.value === "whatsapp") {
      selectedRadio.value = "max";
    }

    return selectedType;
  };

  const syncTildaForm = async (nativeForm, formData) => {
    const nameInput = nativeForm.querySelector(
      'input[data-tilda-rule="name"], input[name="Name"]',
    );
    const emailInput = nativeForm.querySelector(
      'input[data-tilda-rule="email"], input[name="email"], input[name="Email"]',
    );
    const phoneGroup = [...nativeForm.querySelectorAll(".t-input-group_ph")].find(
      (group) => !group.closest(".t-input-group_contact_method"),
    );
    const messengerGroup = nativeForm.querySelector(
      ".t-input-group_contact_method",
    );

    // E-mail is optional per landing: a form rendered without the field sends
    // email: null and then the native form may omit the e-mail input too.
    const needsEmail = formData.email !== null;

    if (
      !(nameInput instanceof HTMLInputElement) ||
      (needsEmail && !(emailInput instanceof HTMLInputElement)) ||
      !(phoneGroup instanceof HTMLElement) ||
      !(messengerGroup instanceof HTMLElement)
    ) {
      throw new Error("Required Tilda form fields were not found");
    }

    setNativeInputValue(nameInput, formData.name);
    if (needsEmail) setNativeInputValue(emailInput, formData.email);
    fillTildaPhoneGroup(phoneGroup, formData.phone, "Phone");
    const selectedType = selectTildaMessenger(messengerGroup, formData.messenger);

    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    messengerGroup
      .querySelectorAll(
        'input[name="messenger-id"], input[name="tildaspec-phone-part[]"], input[name="tildaspec-phone-part[]-iso"]',
      )
      .forEach((input) => {
        // Hidden hybrid groups are already reset and disabled by Tilda; an input
        // event there would make its hybrid handler re-enable an empty text field.
        if (input.closest(".t-contact-method__hybrid.t-contact-method__hidden")) {
          return;
        }

        setNativeInputValue(input, "");
      });

    // Newer hybrid contact block: every messenger has its own text field marked
    // with data-contact-method (Telegram «Имя пользователя или телефон», MAX
    // «Ссылка или телефон»). Fill exactly the field of the selected type.
    const typedContactInput = [
      ...messengerGroup.querySelectorAll(
        'input[name="messenger-id"][data-contact-method]',
      ),
    ].find((input) => input.dataset.contactMethod === selectedType);

    if (typedContactInput instanceof HTMLInputElement) {
      const valueGroup = typedContactInput.closest(".t-phonemask-input-group");
      const isPhoneContact = /^[+0-9]/.test(formData.messengerContact);

      if (isPhoneContact && valueGroup?.querySelector("input.t-input-phonemask")) {
        // Hybrid field: Tilda drops the text and switches to its phone mask as soon
        // as the text starts with + or a digit, so switch first, then fill the mask.
        setNativeInputValue(typedContactInput, "+");
        fillTildaPhoneGroup(valueGroup, formData.messengerContact, "messenger-id");
      } else {
        setNativeInputValue(typedContactInput, formData.messengerContact);
      }
    } else if (formData.messenger === "telegram") {
      const telegramInput = messengerGroup.querySelector(
        'input[name="messenger-id"]:not([type="hidden"]):not(:disabled)',
      );

      if (!(telegramInput instanceof HTMLInputElement)) {
        throw new Error("Active Tilda Telegram field was not found");
      }

      setNativeInputValue(telegramInput, formData.messengerContact);
    } else {
      const activeMessengerPhoneInput = messengerGroup.querySelector(
        'input.t-input-phonemask:not([type="hidden"]):not(:disabled)',
      );
      const activeMessengerPhoneGroup =
        activeMessengerPhoneInput?.closest(".t-phonemask-input-group") || null;

      if (!(activeMessengerPhoneGroup instanceof HTMLElement)) {
        throw new Error("Active Tilda MAX field was not found");
      }

      fillTildaPhoneGroup(
        activeMessengerPhoneGroup,
        formData.messengerContact,
        "messenger-id",
      );
    }
  };

  const setupLeadForm = (form) => {
    const formName = form.dataset.tildaFormName?.trim() || "";
    const inputs = [...form.querySelectorAll("[data-lead-input]")];
    const messengerInputs = [
      ...form.querySelectorAll('input[name="messenger"]'),
    ];
    const mainPhoneInput = form.querySelector("[data-lead-phone]");
    const maxContactInput = form.querySelector("[data-lead-max-contact]");
    const telegramContactInput = form.querySelector(
      "[data-lead-telegram-contact]",
    );
    const maxContactField = maxContactInput?.closest("[data-lead-field]");
    const telegramContactField = form.querySelector(
      "[data-lead-telegram-field]",
    );
    const submit = form.querySelector("[data-lead-submit]");
    const submitLabel = form.querySelector("[data-lead-submit-label]");
    const status = form.querySelector("[data-lead-status]");
    const contentParts = [...form.querySelectorAll("[data-lead-content]")];
    const successView = form.querySelector("[data-lead-success]");
    const section = form.closest("section[aria-labelledby]");
    const listeners = [];
    const phoneControllers = new Map();
    let disposed = false;
    let busy = false;
    let formIsValid = false;
    let validityRevision = 0;
    let submittedTildaForm = null;

    if (formName) observedTildaFormNames.add(formName);
    hideTildaFormRecord(formName);

    [mainPhoneInput, maxContactInput].forEach((input) => {
      if (input instanceof HTMLInputElement) {
        phoneControllers.set(input, initializePhoneInput(input));
      }
    });

    const listen = (target, eventName, handler, options) => {
      target?.addEventListener(eventName, handler, options);
      listeners.push(() => target?.removeEventListener(eventName, handler, options));
    };

    const setStatus = (message = "", state = "idle") => {
      if (!status) {
        return;
      }

      status.textContent = message;
      status.dataset.state = state;
    };

    const renderSubmitState = () => {
      if (submit instanceof HTMLButtonElement) {
        submit.disabled = busy || !formIsValid;
        submit.setAttribute("aria-disabled", String(submit.disabled));
        submit.setAttribute("aria-busy", String(busy));
        submit.dataset.state = busy
          ? "loading"
          : formIsValid
            ? "ready"
            : "disabled";
      }

      if (submitLabel) {
        submitLabel.textContent = busy ? "Отправляем заявку…" : "Отправить заявку";
      }
    };

    const setBusy = (isBusy) => {
      busy = isBusy;
      renderSubmitState();
    };

    const getFieldParts = (input) => {
      const field = input.closest("[data-lead-field]");
      const error = field?.querySelector("[data-lead-error]");

      return { field, error };
    };

    const updateHasValue = (input) => {
      const { field } = getFieldParts(input);

      if (field) {
        field.dataset.hasValue = String(Boolean(input.value.trim()));
      }
    };

    const setFieldState = (input, message = "", isValid = false) => {
      const { field, error } = getFieldParts(input);

      input.setCustomValidity(message);
      input.setAttribute("aria-invalid", String(Boolean(message)));

      if (field) {
        field.dataset.state = message ? "invalid" : isValid ? "valid" : "idle";
      }

      if (error) {
        error.textContent = message;
      }

      updateHasValue(input);
    };

    const getInputValidationMessage = async (input) => {
      if (!(input instanceof HTMLInputElement) || input.disabled || input.hidden) {
        return "";
      }

      const value = input.value.trim();
      let message = "";

      if (input.name === "name") {
        message = value ? "" : "Имя не может быть пустым";
      } else if (input.name === "email") {
        message = ASCII_EMAIL_PATTERN.test(value)
          ? ""
          : "Введите корректный e-mail";
      } else if (input.name === "telegramContact") {
        message = TELEGRAM_USERNAME_PATTERN.test(value)
          ? ""
          : "Введите имя пользователя, начиная с @";
      } else if (phoneControllers.has(input)) {
        const phoneController = phoneControllers.get(input);

        await phoneController.ready;
        message = phoneController.isValid()
          ? ""
          : "Введите корректный номер телефона";
      } else if (!value) {
        message = "Поле не может быть пустым";
      }

      return message;
    };

    const validateInput = async (input) => {
      const message = await getInputValidationMessage(input);
      if (disposed) return false;
      const value = input.value.trim();

      setFieldState(input, message, !message && Boolean(value));

      return !message;
    };

    const getActiveInputs = () =>
      inputs.filter((input) => !input.disabled && !input.hidden);

    const updateSubmitAvailability = async () => {
      const revision = ++validityRevision;
      const activeInputs = getActiveInputs();
      const messages = await Promise.all(
        activeInputs.map((input) => getInputValidationMessage(input)),
      );

      if (disposed || revision !== validityRevision) {
        return;
      }

      formIsValid =
        activeInputs.length > 0 && messages.every((message) => !message);
      renderSubmitState();
    };

    const clearEditedState = (input) => {
      setFieldState(input);
      setStatus();
    };

    const renderMessengerField = () => {
      const selectedMessenger = messengerInputs.find((input) => input.checked)?.value;
      const isTelegram = selectedMessenger === "telegram";

      if (maxContactField instanceof HTMLElement && maxContactInput) {
        maxContactField.hidden = isTelegram;
        maxContactInput.disabled = isTelegram;
        setFieldState(maxContactInput);
      }

      if (telegramContactField instanceof HTMLElement && telegramContactInput) {
        telegramContactField.hidden = !isTelegram;
        telegramContactInput.disabled = !isTelegram;
        setFieldState(telegramContactInput);
      }

      setStatus();
    };

    inputs.forEach((input) => {
      updateHasValue(input);
      listen(input, "input", () => {
        input.dataset.dirty = "true";
        clearEditedState(input);
        void updateSubmitAvailability();
      });
      listen(input, "blur", () => {
        if (input.dataset.dirty === "true") {
          void validateInput(input).then(updateSubmitAvailability);
        }
      });
      listen(input, "countrychange", () => {
        clearEditedState(input);
        void updateSubmitAvailability();
      });
    });

    messengerInputs.forEach((input) => {
      listen(input, "change", () => {
        renderMessengerField();
        void updateSubmitAvailability();
      });
    });

    const getTildaEventForm = (event, eventForm) =>
        eventForm instanceof HTMLFormElement
          ? eventForm
          : event?.detail?.form instanceof HTMLFormElement
            ? event.detail.form
            : event?.target instanceof HTMLFormElement
              ? event.target
              : null;

    const showSuccess = () => {
      setBusy(false);
      setStatus();
      contentParts.forEach((part) => {
        part.hidden = true;
      });

      if (successView instanceof HTMLElement) {
        successView.hidden = false;
      }

      form.dataset.state = "success";

      if (section instanceof HTMLElement) {
        const headingId = successView?.querySelector("[data-lead-success-heading]")?.id;
        if (headingId) section.setAttribute("aria-labelledby", headingId);
      }

      window.requestAnimationFrame(() => {
        successView?.focus({ preventScroll: true });
      });
      submittedTildaForm = null;
    };

    const showTildaError = (message) => {
      submittedTildaForm = null;
      setBusy(false);
      setStatus(message, "error");
    };

    const handleTildaSuccess = (event, eventForm) => {
      const successfulForm = getTildaEventForm(event, eventForm);

      if (successfulForm !== submittedTildaForm) {
        return;
      }

      if (!submittedTildaForm) {
        return;
      }

      showSuccess();
    };

    const handleTildaError = (event, eventForm) => {
      const failedForm = getTildaEventForm(event, eventForm);

      if (failedForm !== submittedTildaForm) {
        return;
      }

      if (!submittedTildaForm) {
        return;
      }

      showTildaError(
        "Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.",
      );
    };

    listen(document, "tildaform:aftersuccess", handleTildaSuccess);
    listen(document, "tildaform:aftererror", handleTildaError);

    const jquerySuccessHandler = (event, eventForm) => {
      handleTildaSuccess(event, eventForm);
    };

    const jqueryErrorHandler = (event, eventForm) => {
      handleTildaError(event, eventForm);
    };

    if (typeof window.jQuery === "function") {
      window.jQuery(document).on(
        "tildaform:aftersuccess.academyLeadForm",
        jquerySuccessHandler,
      );
      window.jQuery(document).on(
        "tildaform:aftererror.academyLeadForm",
        jqueryErrorHandler,
      );
    }

    const handleSubmit = async (event) => {
      event.preventDefault();

      if (busy) {
        return;
      }

      const activeInputs = getActiveInputs();
      const validationResults = await Promise.all(
        activeInputs.map((input) => validateInput(input)),
      );
      if (disposed) return;
      const firstInvalidIndex = validationResults.findIndex((result) => !result);

      if (firstInvalidIndex !== -1) {
        formIsValid = false;
        renderSubmitState();
        activeInputs[firstInvalidIndex].focus();
        setStatus("Проверьте выделенные поля.", "error");
        return;
      }

      setBusy(true);
      setStatus("Отправляем заявку…", "loading");

      const selectedMessenger =
        messengerInputs.find((input) => input.checked)?.value || "max";
      const phoneController = phoneControllers.get(mainPhoneInput);
      const maxContactController = phoneControllers.get(maxContactInput);
      const formData = {
        email: form.elements.email ? form.elements.email.value.trim() : null,
        messenger: selectedMessenger,
        messengerContact:
          selectedMessenger === "telegram"
            ? telegramContactInput.value.trim()
            : maxContactController.getNumber(),
        name: form.elements.name.value.trim(),
        phone: phoneController.getNumber(),
      };
      const nativeForm = hideTildaFormRecord(formName);

      form.dispatchEvent(
        new CustomEvent("academy-lead-form:validated", {
          bubbles: true,
          detail: { formData },
        }),
      );

      if (!(nativeForm instanceof HTMLFormElement)) {
        setBusy(false);
        setStatus(
          "Отправка заявки временно недоступна. Пожалуйста, попробуйте позже.",
          "error",
        );
        return;
      }

      try {
        await syncTildaForm(nativeForm, formData);
        if (disposed) return;
        submittedTildaForm = nativeForm;
        const nativeSubmit = nativeForm.querySelector(
          'button[type="submit"], input[type="submit"]',
        );

        if (nativeSubmit instanceof HTMLElement) {
          nativeForm.requestSubmit(nativeSubmit);
        } else {
          nativeForm.requestSubmit();
        }

        await new Promise((resolve) => window.requestAnimationFrame(resolve));

        if (
          submittedTildaForm === nativeForm &&
          nativeForm.querySelector(".js-error-control-box")
        ) {
          showTildaError(
            "Не удалось отправить заявку. Проверьте заполненные поля и попробуйте ещё раз.",
          );
        }
      } catch (error) {
        showTildaError(
          "Не удалось передать заявку. Обновите страницу и попробуйте ещё раз.",
        );
      }
    };

    listen(form, "submit", handleSubmit);
    renderMessengerField();
    void updateSubmitAvailability();

    return {
      cleanup() {
        disposed = true;
        validityRevision++;
        submittedTildaForm = null;
        listeners.forEach((removeListener) => removeListener());
        phoneControllers.forEach((controller) => controller.destroy());

        if (typeof window.jQuery === "function") {
          window.jQuery(document).off(
            "tildaform:aftersuccess.academyLeadForm",
            jquerySuccessHandler,
          );
          window.jQuery(document).off(
            "tildaform:aftererror.academyLeadForm",
            jqueryErrorHandler,
          );
        }
      },
    };
  };

  forms.forEach((form) => {
    formControllers.push(setupLeadForm(form));
  });
  hideKnownTildaForms();

  window.__academyLeadFormCleanup = () => {
    tildaFormObserver.disconnect();
    clearTimeout(discoveryTimer);
    formControllers.forEach((controller) => controller.cleanup());
  };
})();

/* === pricing/src/price-auto.js (утверждённый блок цены, не править здесь) === */
/* =====================================================================
   БЛОК ЦЕНЫ ИЗ CMS · сам решает, как показать цену

   Скрипт берёт курс из Public API (адрес и курс заданы у секции
   атрибутами data-api и data-course) и по данным выбирает сценарий.
   Руками ничего переключать не нужно:

   1. Лист ожидания — нет открытых потоков, есть поток со статусом
      «Лист ожидания». Две карточки: бесплатно и бронь места (если в CMS
      есть цена брони).
   2. Тарифы — у потока в CMS два и больше тарифов. Карточки рядом,
      самый дорогой тёмный с ярлыком «Рекомендуем». Выбора тарифа нет.
      Если у блока задан состав тарифов, у каждого общий список пунктов:
      что входит — галочка, чего нет — серым с крестиком.
   3. Одна цена — всё остальное. Одна карточка: курс слева, цена справа.
      Если у блока задан состав курса («Что входит»), карточка как
      в витрине: слева курс и цена, справа пункты с галочками.
      • Если оплата сразу дешевле, чем в рассрочку, под ценой строка
        «выгода N ₽ при оплате сразу». Крупно — цена при оплате сразу.
      • С data-system="compare" такой случай показывается двумя
        карточками рядом: «Оплата сразу» и «В рассрочку».
   Поверх любого сценария:
   • несколько открытых потоков — даты старта переключаются сверху;
   • курс месяца — жёлтый купон «−10 % до 31 октября», рядом с ценой
     зачёркнутая цена до акции;
   • ближайшее повышение — серая плашка под ценой «С 20 октября: …»
     и «подорожает на N ₽». Нет повышения — плашки нет;
   • внизу «Гибкие условия оплаты» (выключить: data-terms="off").
   Нет ни открытых потоков, ни листа ожидания — блок прячется целиком.

   Правила взяты из витрины /pricing-scenarios (решения Дарьи 12.10.2026):
   кнопок в блоке нет (кнопка живёт в форме ниже), официальная цена —
   в рассрочку, оплата сразу — выгода от неё, платёж в месяц из CMS,
   а если его там нет — цена в рассрочку ÷ 24.

   Пока ответ CMS не пришёл и если CMS не ответила, на странице
   остаётся снимок цен на дату сборки блока.

   Что можно править: тексты в разделе 1.
   Что нельзя: остальное — по нему работает выбор сценария.
   ===================================================================== */
(function (global) {
  'use strict';

  /* ---------- 1. Тексты ---------- */
  var TEXT = {
    heading: 'Стоимость обучения',
    waitlistHeading: 'Запишитесь в лист ожидания',
    termsHeading: 'Гибкие условия оплаты',
    recommended: 'Рекомендуем',
    lastChance: 'поток уже идёт, ещё можно присоединиться',
    anytime: 'старт в любое время',
    includes: 'Что входит',
  };
  // Что даёт бронь — со слов Дарьи 12.10.2026, формулировки уточнить у отдела продаж.
  var BOOKING_BENEFITS = [
    'Свяжемся первыми, когда откроется набор',
    'Купите курс по самой низкой цене, до первого повышения',
    'Место за вами, даже если группа наберётся раньше старта',
  ];
  var WAITLIST_FREE = ['Напишем, когда откроется набор', 'Цену и даты узнаете вместе со всеми'];
  // Персональные скидки Академии. Что они не суммируются, не пишем (решение Дарьи 12.10.2026).
  // note — условие мелким серым под строкой. За коллегу: пригласивший может учиться у нас не впервые,
  // а приглашённый должен быть совсем новым, скидка обоим (формулировка Дарьи 20.10.2026).
  var DISCOUNTS = [
    { value: '−10', label: 'новым студентам' },
    { value: '−20', label: 'вам и коллеге, которого вы пригласили', note: 'если он ещё не учился у нас' },
    { prefix: 'до', value: '−20', label: 'нашим выпускникам за отзыв' },
  ];
  var TERMS = {
    installmentTitle: 'Рассрочка до 24 месяцев',
    installment: 'От банков-партнёров. Платёж делится на равные части, платите со второго месяца обучения.',
    discountsTitle: 'Персональные скидки',
    taxTitle: 'Налоговый вычет 13 %',
    tax: 'Подробно расскажем, как оформить документы, чтобы вернуть 13 % от стоимости обучения.',
  };

  /* ---------- 2. Статусы потоков в CMS ---------- */
  var OPEN = ['Идет набор', 'Идёт набор', 'Последний шанс', 'Старт в любое время'];
  var WAITLIST = 'Лист ожидания';
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var DAY_MS = 864e5;

  /* ---------- 3. Числа и текст ---------- */
  var NBSP = ' ';
  var MINUS = '−';
  var JOIN = '⁠'; // «₽/мес» не разрывается переносом строки
  function norm(v) { return String(v || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, ''); }
  function num(v) { return v == null || v === '' || isNaN(Number(v)) ? null : Number(v); }
  function digits(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP); }
  function rub(n) { return digits(n) + NBSP + '₽'; }
  function perMonth(n) { return rub(n) + JOIN + '/' + JOIN + 'мес'; }
  // Неразрывный пробел после коротких слов и чисел: «в рассрочку», «на 24 мес».
  function nb(text) { return String(text == null ? '' : text).replace(/(^|[\s(«])([а-яёА-ЯЁ]{1,2}|\d+) /g, '$1$2' + NBSP).replace(/(^|[\s(«])([а-яёА-ЯЁ]{1,2}|\d+) /g, '$1$2' + NBSP); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function t(v) { return esc(nb(v)); }
  // «1 платёж», «24 платежа», «5 платежей».
  function plural(n, one, few, many) { var a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many; }

  /* ---------- 4. Даты по московскому времени ---------- */
  // Даты в CMS приходят как «полночь по Москве» в UTC, поэтому день считаем в Москве.
  function moscow(ms) {
    var d = new Date(ms + 3 * 36e5); // Москва — UTC+3 круглый год
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
  }
  function partsOf(iso) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) { var a = iso.split('-').map(Number); return { y: a[0], m: a[1], d: a[2] }; }
    var ms = Date.parse(iso);
    return isNaN(ms) ? null : moscow(ms);
  }
  // «20 октября», год — только если он не текущий: «18 февраля 2027».
  function dayLabel(iso, now) {
    var p = iso && partsOf(iso);
    if (!p) return null;
    return p.d + ' ' + MONTHS[p.m - 1] + (p.y !== moscow(now).y ? ' ' + p.y : '');
  }
  function todayIso(now) { var p = moscow(now); return p.y + '-' + String(p.m).padStart(2, '0') + '-' + String(p.d).padStart(2, '0'); }

  /* ---------- 5. Модель: что пришло из CMS ---------- */
  // Цена потока или тарифа. reg — цены без «Курса месяца», sale — с ним (их считает API).
  // Снимок в вёрстке может устареть: если дата повышения уже прошла, двигаемся по графику цен сами.
  function priceOf(src, promo, now) {
    var regList = num(src.priceBeforeDiscount != null ? src.priceBeforeDiscount : (src.currentPrice != null ? src.currentPrice : src.price));
    var regOnce = num(src.fullPaymentPriceBeforeDiscount != null ? src.fullPaymentPriceBeforeDiscount : src.fullPaymentPrice);
    var saleList = num(src.currentPrice != null ? src.currentPrice : src.price);
    var saleOnce = num(src.fullPaymentPrice);
    var cmsMonth = num(src.installmentPerMonth);
    var next = src.nextPriceChange || null;
    var moved = false;
    var steps = (src.priceSchedule || []).filter(function (s) { return s && s.at && num(s.price) != null; })
      .sort(function (a, b) { return Date.parse(a.at) - Date.parse(b.at); });
    while (next && next.at && Date.parse(next.at) <= now) {
      regList = num(next.price);
      regOnce = num(next.fullPaymentPrice);
      moved = true;
      var after = Date.parse(next.at);
      next = steps.filter(function (s) { return Date.parse(s.at) > after; })[0] || null;
    }
    if (!promo) { saleList = regList; saleOnce = regOnce; }
    else if (moved) {
      // Акция действует, а цена сдвинулась по графику: скидку считаем сами, как API — на цену «сразу», если она есть.
      if (regOnce != null) saleOnce = Math.round(regOnce * (1 - promo.percent / 100));
      else saleList = Math.round(regList * (1 - promo.percent / 100));
    }
    if (regList == null && saleOnce == null) return null;
    if (moved) cmsMonth = null; // платёж из CMS считан под старую цену

    var twoPrices = regOnce != null && regList != null && regOnce < regList;
    var sale = saleOnce != null ? saleOnce : saleList;
    var was = saleOnce != null ? regOnce : regList;
    var p = {
      sale: sale,
      was: promo && was != null && was > sale ? was : null,
      official: regList,
      twoPrices: twoPrices,
      benefit: twoPrices ? regList - sale : 0,
      free: sale === 0,
      perMonth: cmsMonth || (regList ? Math.round(regList / 24) : null),
      months: cmsMonth ? (num(src.installmentMonths) || 24) : 24,
      next: null,
    };
    if (next) {
      var nextOnce = num(next.fullPaymentPrice), nextList = num(next.price);
      var nextSale = nextOnce != null && (nextList == null || nextOnce < nextList) ? nextOnce : nextList;
      if (nextSale != null && nextSale > sale) p.next = { at: next.at, day: dayLabel(next.at, now), price: nextSale, diff: nextSale - sale };
    }
    return p;
  }

  function model(course, now) {
    now = now || Date.now();
    var raw = course.promo || {};
    var promoOn = raw.active && num(raw.discountPercent) && (!raw.until || String(raw.until).slice(0, 10) >= todayIso(now));
    var promo = promoOn ? { percent: num(raw.discountPercent), until: dayLabel(raw.until, now) } : null;
    var all = course.streams || [];
    var open = all.filter(function (s) { return OPEN.indexOf(s.status) !== -1 && s.pricing; })
      .sort(function (a, b) { return String(a.startDate || '9999').localeCompare(String(b.startDate || '9999')); });
    var streams = [];
    open.forEach(function (s, index) {
      var pr = s.pricing;
      var items = [];
      if (pr.hasTariffs) {
        (pr.tariffs || []).forEach(function (tariff) {
          var price = priceOf(tariff, promo, now);
          if (price) items.push({ name: tariff.title, description: tariff.description || null, price: price });
        });
        // От дешёвого к дорогому; рекомендуемый — самый дорогой.
        items.sort(function (a, b) { return a.price.sale - b.price.sale; });
        // Один тариф не называем тарифом: это просто цена курса.
        if (items.length === 1) items = [{ name: course.title, description: null, price: items[0].price }];
      } else {
        var price = priceOf(pr, promo, now);
        if (price) items.push({ name: course.title, description: null, price: price });
      }
      var anytime = s.status === 'Старт в любое время' || !s.startDate;
      if (items.length) {
        streams.push({
          id: s.startDate || 'stream-' + index,
          startDate: s.startDate || null,
          start: anytime ? null : dayLabel(s.startDate, now),
          anytime: anytime,
          lastChance: s.status === 'Последний шанс',
          items: items,
        });
      }
    });
    var waiting = !streams.length ? all.filter(function (s) { return s.status === WAITLIST; })[0] : null;
    return {
      title: course.title || '',
      level: course.educationLevel || null,
      promo: promo,
      streams: streams,
      waitlist: waiting ? { booking: num(waiting.pricing && waiting.pricing.bookingPrice) } : null,
    };
  }

  /* ---------- 6. Какой сценарий показать ---------- */
  function scenarioOf(m, opts) {
    if (!m.streams.length) return m.waitlist ? 'waitlist' : 'none';
    var tariffs = m.streams.some(function (s) { return s.items.length > 1; });
    if (tariffs) return 'tariffs';
    var p = m.streams[0].items[0].price;
    if (m.streams.length === 1 && p.twoPrices && !p.free && opts.system === 'compare') return 'compare';
    return 'single';
  }

  /* ---------- 7. Разметка ---------- */
  // Галочка и крестик рисуются в CSS (маской), а не svg в каждом пункте: так код блока короче.
  var ICON_CHECK = '<span class="price-icon is-check" aria-hidden="true"></span>';
  var ICON_CROSS = '<span class="price-icon is-cross" aria-hidden="true"></span>';
  // Значок повышения: линия графика вверх со стрелкой.
  var ICON_RISE = '<svg class="price-rise_icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 17l6-6 4 4 8-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 7h6v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // Цена: число крупно, «₽» и «/мес» мелко. При акции рядом зачёркнутая цена до неё.
  function priceTag(value, o) {
    o = o || {};
    var isNumber = typeof value === 'number';
    var unit = isNumber ? '<span class="price-tag_unit">₽' + (o.month ? JOIN + '/' + JOIN + 'мес' : '') + '</span>' : '';
    var was = o.was != null ? '<span class="price-tag_was"><s class="price-old"><span class="price-auto_sr">вместо </span>' + rub(o.was) + '</s></span>' : '';
    return '<p class="price-tag" data-price-auto-total><span class="price-tag_number">' + (isNumber ? digits(value) : t(value)) + '</span>' + unit + was + '</p>';
  }
  function priceMain(p) {
    if (p.free) return priceTag('Бесплатно');
    return priceTag(p.sale, { was: p.was });
  }

  // Строка под ценой, серым, выгода акцентом: «выгода N ₽ при оплате сразу», «или N ₽/мес в рассрочку на 24 мес».
  function caption(p) {
    if (p.free) return '';
    var lines = [];
    if (p.twoPrices) lines.push(p.benefit > 0 ? '<b class="price-caption_benefit">' + t('выгода ' + rub(p.benefit)) + '</b> ' + t('при оплате сразу') : t('при оплате сразу'));
    if (p.perMonth) lines.push(t('или ' + perMonth(p.perMonth) + ' в рассрочку на ' + p.months + ' мес'));
    return lines.length ? '<p class="price-caption">' + lines.map(function (l) { return '<span class="price-caption_line">' + l + '</span>'; }).join('') + '</p>' : '';
  }

  // Ближайшее повышение: «С 20 октября: 170 000 ₽», ниже «подорожает на 26 000 ₽».
  function rise(p) {
    if (!p.next || !p.next.day) return '';
    return '<p class="price-rise">' + ICON_RISE + '<span class="price-rise_text"><span class="price-rise_title">' + t('С ' + p.next.day + ': ' + rub(p.next.price)) + '</span>'
      + '<span class="price-rise_note">' + t('подорожает на ' + rub(p.next.diff)) + '</span></span></p>';
  }

  // Курс месяца — жёлтый купон «−10 % | до 31 октября», наклеен на карточку с ценой.
  function sticker(m) {
    if (!m.promo) return '';
    return '<span class="price-sticker_component"><span class="price-sticker_coupon"><span class="price-auto_sr">Курс месяца: </span>'
      + '<span class="price-sticker_value">' + MINUS + m.promo.percent + NBSP + '%</span>'
      + (m.promo.until ? '<span class="price-sticker_until">' + t('до ' + m.promo.until) + '</span>' : '') + '</span></span>';
  }

  // Список «что входит»: строка или { text, has }. Чего нет в тарифе — серым с крестиком.
  // Пояснение мелким серым под пунктом пишется после « | »: «Лекции в записи | Смотрите без привязки к расписанию».
  function checklist(list) {
    return '<ul class="price-check" role="list">' + list.map(function (row) {
      var r = typeof row === 'string' ? { text: row, has: true } : row;
      var parts = String(r.text).split(' | ');
      var note = r.note || parts[1] || '';
      return '<li class="price-check_item' + (r.has ? '' : ' is-off') + '">' + (r.has ? ICON_CHECK : ICON_CROSS)
        + '<span>' + t(parts[0]) + (note ? '<span class="price-check_note">' + t(note) + '</span>' : '')
        + (r.has ? '' : '<span class="price-auto_sr">, не входит</span>') + '</span></li>';
    }).join('') + '</ul>';
  }

  // Описание и состав тарифа из настроек блока: «Пакет стандарт» в CMS находит «Стандарт».
  function tariffInfo(name, tariffs) {
    var key = norm(name), best = null;
    Object.keys(tariffs || {}).forEach(function (k) {
      if (key.indexOf(norm(k)) !== -1 && (!best || k.length > best.length)) best = k;
    });
    return best ? tariffs[best] : {};
  }
  // Общий список пунктов по всем тарифам, от младшего к старшему: так видно, что теряешь, если экономишь.
  function featureRows(items, tariffs) {
    var infos = items.map(function (item) { return tariffInfo(item.name, tariffs); });
    var rows = [];
    infos.forEach(function (info) { (info.includes || []).forEach(function (text) { if (rows.indexOf(text) === -1) rows.push(text); }); });
    return items.map(function (item, i) {
      var own = infos[i].includes || [];
      return { description: item.description || infos[i].description || null, list: rows.map(function (text) { return { text: text, has: own.indexOf(text) !== -1 }; }) };
    });
  }

  // «Гибкие условия оплаты» — одинаковые во всех сценариях: рассрочка, скидки, вычет.
  function terms(uid) {
    var row = function (title, body) { return '<div class="price-terms_row"><dt class="price-terms_title">' + t(title) + '</dt><dd class="price-terms_body">' + body + '</dd></div>'; };
    var discounts = '<ul class="price-discounts" role="list">' + DISCOUNTS.map(function (d) {
      return '<li class="price-discounts_item"><p class="price-discounts_value">' + (d.prefix ? '<span class="price-discounts_prefix">' + t(d.prefix) + '</span>' : '')
        + '<span>' + t(d.value) + NBSP + '%</span></p><p class="price-discounts_label">' + t(d.label) + (d.note ? '<span class="price-discounts_note">' + t(d.note) + '</span>' : '') + '</p></li>';
    }).join('') + '</ul>';
    return '<section class="price-terms_component" aria-labelledby="' + uid + '-terms"><h3 class="price-terms_heading" id="' + uid + '-terms">' + t(TEXT.termsHeading) + '</h3><dl class="price-terms_list">'
      + row(TERMS.installmentTitle, '<p class="price-terms_text">' + t(TERMS.installment) + '</p>')
      + row(TERMS.discountsTitle, discounts)
      + row(TERMS.taxTitle, '<p class="price-terms_text">' + t(TERMS.tax) + '</p>')
      + '</dl></section>';
  }

  // Даты старта переключаются сверху. Настоящие радиокнопки: работают стрелками с клавиатуры.
  function streamSwitch(m, stream, uid) {
    if (m.streams.length < 2) return '';
    var name = uid + '-stream';
    return '<fieldset class="price-switch"><legend class="price-switch_legend">Старт</legend><div class="segmented_component">'
      + m.streams.map(function (s, i) {
        return '<label class="segmented_item"><input class="segmented_input" type="radio" id="' + name + '-' + i + '" name="' + name + '" value="' + esc(s.id) + '" data-price-auto-stream'
          + (s.id === stream.id ? ' checked' : '') + '><span class="segmented_label">' + t(s.start || 'в любое время') + '</span></label>';
      }).join('') + '</div></fieldset>';
  }

  function startLine(stream) {
    if (stream.lastChance) return TEXT.lastChance;
    return stream.start ? 'старт ' + stream.start : TEXT.anytime;
  }

  // Вертикальная карточка: тариф, способ оплаты, вариант листа ожидания.
  function card(o) {
    return '<li class="price-card_component' + (o.featured ? ' is-featured' : '') + '">'
      + (o.tag ? '<span class="price-card_badge">' + t(o.tag) + '</span>' : '') + (o.sticker || '')
      + '<div class="price-card_head"><h3 class="price-card_name">' + t(o.title) + '</h3>' + (o.sub ? '<p class="price-card_sub">' + t(o.sub) + '</p>' : '') + '</div>'
      + '<div class="price-card_money">' + o.price + (o.caption || '') + '</div>'
      + '<div class="price-card_list">' + (o.list && o.list.length ? checklist(o.list) : '') + '</div>'
      + (o.foot ? '<div class="price-card_foot">' + o.foot + '</div>' : '')
      + '</li>';
  }
  function cardGrid(list) { return '<ul class="price-cards is-count-' + Math.min(list.length, 3) + '" role="list">' + list.join('') + '</ul>'; }

  // Горизонтальная карточка «Одной цифры», как в витрине. С составом: слева курс и цена,
  // справа «Что входит» с галочками. Без состава (is-plain): слева курс, справа цена.
  // Плашка повышения всегда прямо под ценой: она относится только к цене.
  function wideCard(m, stream, p, includes) {
    var money = '<div class="price-wide_money">' + priceMain(p) + caption(p) + (p.next ? '<div class="price-wide_foot">' + rise(p) + '</div>' : '') + '</div>';
    var side = includes && includes.length ? '<p class="price-wide_side-title">' + t(TEXT.includes) + '</p>' + checklist(includes) : '';
    return '<div class="price-wide_component' + (side ? '' : ' is-plain') + '">' + sticker(m)
      + '<div class="price-wide_main">' + (m.level ? '<span class="price-wide_chip">' + t(m.level) + '</span>' : '')
      + '<div class="price-wide_title"><h3 class="price-wide_name">' + t(m.title) + '</h3><p class="price-wide_sub">' + t(startLine(stream)) + '</p></div>'
      + (side ? money : '') + '</div>'
      + '<div class="price-wide_side">' + (side || money) + '</div>'
      + '</div>';
  }

  function frame(o) {
    return '<div class="price-block_component">'
      + '<div class="price-block_head"><div class="price-block_title"><h2 class="price-block_heading">' + t(o.heading) + '</h2>' + (o.lead ? '<p class="price-block_lead">' + o.lead + '</p>' : '') + '</div>'
      + (o.controls ? '<div class="price-block_controls">' + o.controls + '</div>' : '') + '</div>'
      + o.body + (o.terms ? terms(o.uid) : '') + '</div>';
  }
  function lead(m, stream) {
    var parts = [m.title];
    if (stream && m.streams.length === 1) parts.push(startLine(stream));
    if (m.level) parts.push(m.level.toLowerCase());
    return parts.map(t).join(', ');
  }

  // Главная функция: модель и выбранный поток → разметка блока. Пустая строка — показывать нечего.
  function render(m, state, opts) {
    state = state || {};
    opts = opts || {};
    var uid = opts.uid || 'price-auto';
    var scenario = scenarioOf(m, opts);
    if (scenario === 'none') return '';
    if (scenario === 'waitlist') {
      var cards = [card({ title: 'Лист ожидания', sub: 'Без оплаты', price: priceTag('Бесплатно'), list: WAITLIST_FREE })];
      if (m.waitlist.booking) cards.push(card({ featured: true, tag: 'Место за вами', title: 'Бронь места', sub: 'Место в следующем потоке', price: priceTag(m.waitlist.booking), list: BOOKING_BENEFITS }));
      return frame({ heading: TEXT.waitlistHeading, lead: lead(m, null), body: cardGrid(cards), terms: opts.terms, uid: uid });
    }
    var stream = m.streams.filter(function (s) { return s.id === state.stream; })[0] || m.streams[0];
    var controls = streamSwitch(m, stream, uid);
    var first = stream.items[0].price;
    var showTerms = opts.terms && !first.free;
    var body;
    if (stream.items.length > 1) {
      var top = stream.items.length - 1; // самый дорогой — последний
      var rows = featureRows(stream.items, opts.tariffs);
      body = cardGrid(stream.items.map(function (item, i) {
        var p = item.price;
        return card({
          featured: i === top, tag: i === top ? TEXT.recommended : '', sticker: i === top ? sticker(m) : '',
          title: item.name, sub: rows[i].description, price: priceMain(p), caption: caption(p), list: rows[i].list, foot: rise(p),
        });
      }));
      return frame({ heading: TEXT.heading, lead: lead(m, stream), controls: controls, body: body, terms: showTerms, uid: uid });
    }
    if (scenario === 'compare') {
      body = cardGrid([
        card({ featured: true, tag: first.benefit > 0 ? 'Выгода ' + rub(first.benefit) : '', sticker: sticker(m), title: 'Оплата сразу', sub: 'Один платёж', price: priceTag(first.sale, { was: first.was }), foot: rise(first) }),
        card({ title: 'В рассрочку', sub: 'Официальная цена, ' + first.months + ' ' + plural(first.months, 'ежемесячный платёж', 'ежемесячных платежа', 'ежемесячных платежей'), price: priceTag(first.perMonth, { month: true }) }),
      ]);
      return frame({ heading: TEXT.heading, lead: lead(m, stream), controls: controls, body: body, terms: showTerms, uid: uid });
    }
    // Карточка сама называет курс и дату старта, поэтому подзаголовка над ней нет.
    return frame({ heading: TEXT.heading, controls: controls, body: wideCard(m, stream, first, opts.includes), terms: showTerms, uid: uid });
  }

  /* ---------- 8. Микроразметка курса (schema.org) ---------- */
  // Потоки и цены для блока микроразметки (второй блок из генератора /pricing), по шаблону docs/seo.md:
  // один открытый поток — один CourseInstance, в нём цена, которую человек видит на странице.
  // Ближайшее повышение — срок действия цены (priceValidUntil, день до повышения).
  function dayBefore(iso) {
    var d = moscow(Date.parse(iso) - DAY_MS);
    return d.y + '-' + String(d.m).padStart(2, '0') + '-' + String(d.d).padStart(2, '0');
  }
  function offerLd(p, url, name) {
    var o = { '@type': 'Offer', price: String(p.sale), priceCurrency: 'RUB', availability: 'https://schema.org/InStock', url: url };
    if (name) o.name = name;
    if (p.next && p.next.at) o.priceValidUntil = dayBefore(p.next.at);
    return o;
  }
  function instancesLd(m, url, instructor) {
    return m.streams.map(function (s) {
      var i = { '@type': 'CourseInstance', courseMode: 'online', location: { '@type': 'VirtualLocation', url: url } };
      if (s.start) i.name = 'Поток ' + s.start;
      if (s.startDate) i.startDate = s.startDate;
      if (instructor) i.instructor = instructor;
      i.offers = s.items.length > 1
        ? s.items.map(function (item) { return offerLd(item.price, url, item.name); })
        : offerLd(s.items[0].price, url);
      return i;
    });
  }
  // Свежие цены пришли — переписываем потоки в блоке микроразметки этого курса, остальное не трогаем.
  function updateLd(slug, m) {
    if (typeof document === 'undefined' || !slug) return;
    Array.prototype.forEach.call(document.querySelectorAll('script[type="application/ld+json"][data-price-auto-ld]'), function (el) {
      if (el.getAttribute('data-price-auto-ld') !== slug) return;
      try {
        var data = JSON.parse(el.textContent);
        var old = Array.isArray(data.hasCourseInstance) ? data.hasCourseInstance[0] : data.hasCourseInstance;
        var list = instancesLd(m, data.url, old && old.instructor);
        if (list.length) data.hasCourseInstance = list; else delete data.hasCourseInstance;
        el.textContent = JSON.stringify(data, null, 2);
      } catch (e) { /* разметку не трогаем, если её не прочитать */ }
    });
  }

  var api = { model: model, render: render, scenarioOf: scenarioOf, instancesLd: instancesLd };

  /* ---------- 8. Живой блок на странице ---------- */
  if (typeof document === 'undefined') { global.PriceAuto = api; return; }

  // Плавная смена (решение Дарьи 12.10.2026): новая разметка сверяется со старой, заменяются только
  // изменившиеся куски — цифра, строка выгоды, дата повышения. Они мягко проявляются, карточки стоят на месте.
  function plain(el) { return el.outerHTML.replace(/ checked(="[^"]*")?/g, '').replace(/ is-fading/g, ''); }
  function sig(el) { return el.tagName + '.' + (el.classList[0] || ''); }
  function ownText(el) { return Array.prototype.filter.call(el.childNodes, function (n) { return n.nodeType === 3; }).map(function (n) { return n.nodeValue; }).join('|'); }
  function fadeIn(el) { el.classList.add('is-fading'); }
  function syncAttributes(oldEl, newEl) {
    var fading = oldEl.classList.contains('is-fading');
    Array.prototype.slice.call(oldEl.attributes).forEach(function (a) { if (a.name !== 'checked' && !newEl.hasAttribute(a.name)) oldEl.removeAttribute(a.name); });
    Array.prototype.slice.call(newEl.attributes).forEach(function (a) { if (a.name !== 'checked' && oldEl.getAttribute(a.name) !== a.value) oldEl.setAttribute(a.name, a.value); });
    if (fading) oldEl.classList.add('is-fading');
  }
  function morph(oldEl, newEl) {
    if (plain(oldEl) === plain(newEl)) return;
    if (sig(oldEl) !== sig(newEl) || ownText(oldEl) !== ownText(newEl)) { oldEl.replaceWith(newEl); fadeIn(newEl); return; }
    syncAttributes(oldEl, newEl);
    var oldKids = Array.prototype.slice.call(oldEl.children);
    var next = 0;
    Array.prototype.slice.call(newEl.children).forEach(function (newKid) {
      var match = -1;
      for (var i = next; i < oldKids.length; i++) { if (sig(oldKids[i]) === sig(newKid)) { match = i; break; } }
      if (match === -1) { oldEl.insertBefore(newKid, oldKids[next] || null); fadeIn(newKid); return; }
      oldKids.slice(next, match).forEach(function (k) { k.remove(); });
      morph(oldKids[match], newKid);
      next = match + 1;
    });
    oldKids.slice(next).forEach(function (k) { k.remove(); });
  }

  var counter = 0;
  function setup(root) {
    if (root.__priceAuto) return root.__priceAuto; // Тильда может запустить скрипт повторно
    var body = root.querySelector('[data-price-auto-body]');
    if (!body) return null;
    var snapshotEl = root.querySelector('script[data-price-auto-snapshot]');
    var snapshot = null;
    try { snapshot = snapshotEl ? JSON.parse(snapshotEl.textContent) : null; } catch (e) { snapshot = null; }
    // Чего нет в CMS (состав курса для галочек) — лежит в самом блоке отдельным JSON.
    var extraEl = root.querySelector('script[data-price-auto-extra]');
    var extra = {};
    try { extra = extraEl ? JSON.parse(extraEl.textContent) || {} : {}; } catch (e) { extra = {}; }
    var slug = (root.getAttribute('data-course') || '').trim();
    counter += 1;
    var opts = {
      system: root.getAttribute('data-system') === 'compare' ? 'compare' : 'figure',
      terms: root.getAttribute('data-terms') !== 'off',
      includes: Array.isArray(extra.includes) ? extra.includes : [],
      tariffs: extra.tariffs && typeof extra.tariffs === 'object' ? extra.tariffs : {},
      uid: 'price-auto-' + (slug.replace(/[^a-z0-9-]/gi, '') || 'course') + '-' + counter,
    };
    var state = { stream: null };
    var current = null;
    var live = document.createElement('p');
    live.className = 'price-auto_sr';
    live.setAttribute('aria-live', 'polite');
    root.appendChild(live);

    function paint(fade) {
      var html = render(current, state, opts);
      root.hidden = !html; // показывать нечего — блок прячется целиком
      root.setAttribute('data-scenario', scenarioOf(current, opts));
      var oldRoot = body.firstElementChild;
      if (!html) { body.innerHTML = ''; return; }
      if (!fade || !oldRoot) { body.innerHTML = html; return; }
      var tpl = document.createElement('template');
      tpl.innerHTML = html;
      morph(oldRoot, tpl.content.firstElementChild);
    }
    function show(course, fade) {
      current = model(course, Date.now());
      paint(fade);
      updateLd(slug, current);
    }

    body.addEventListener('change', function (event) {
      var el = event.target;
      if (!el.hasAttribute || !el.hasAttribute('data-price-auto-stream') || !current) return;
      state.stream = el.value;
      paint(true);
      var again = document.getElementById(el.id);
      if (again) again.focus({ preventScroll: true });
      var total = body.querySelector('[data-price-auto-total]');
      if (total) live.textContent = Array.prototype.map.call(total.childNodes, function (n) { return n.textContent; }).join(' ');
    });
    body.addEventListener('animationend', function (event) { event.target.classList.remove('is-fading'); });

    var ctl = { show: show, options: opts, snapshot: snapshot, repaint: function () { if (current) paint(true); } };
    root.__priceAuto = ctl;
    if (snapshot) current = model(snapshot, Date.now());
    return ctl;
  }

  function load(root) {
    if (root.__priceAutoLoaded) return; // Тильда может запустить скрипт повторно
    root.__priceAutoLoaded = true;
    var ctl = setup(root);
    if (!ctl) return;
    var base = (root.getAttribute('data-api') || '').replace(/\/+$/, '');
    var slug = (root.getAttribute('data-course') || '').trim();
    var fallback = function (err) {
      if (err) console.error('[price-auto] цены из CMS не загрузились, остаётся снимок из вёрстки.', err);
      root.setAttribute('data-cms-state', 'error');
      if (ctl.snapshot) ctl.show(ctl.snapshot, true); // снимок пересчитывается на сегодня: прошедшие повышения учтены
    };
    if (!base || !slug || !window.fetch) { fallback(); return; }
    var abort = window.AbortController ? new AbortController() : null;
    var timer = abort && setTimeout(function () { abort.abort(); }, 8000);
    root.setAttribute('data-cms-state', 'loading');
    fetch(base + '/api/public/course/' + encodeURIComponent(slug), { headers: { Accept: 'application/json' }, signal: abort ? abort.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (course) {
        if (!course || course.error || !Array.isArray(course.streams)) throw new Error((course && course.error) || 'нет потоков в ответе');
        ctl.show(course, true);
        root.setAttribute('data-cms-state', 'ready');
      })
      .catch(fallback)
      .then(function () { if (timer) clearTimeout(timer); });
  }

  api.load = load;
  global.PriceAuto = api;
  function init() { Array.prototype.forEach.call(document.querySelectorAll('[data-price-auto]'), load); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : globalThis);

/* === kpt-bek/page.js === */
/* Лендинг «КПТ. Модель Бека»: поведение блоков страницы.
   1. Программа: табы модулей на десктопе, аккордеон до 1025 px.
   2. Преподаватели: вкладки с именами.
   3. Отзывы: стрелки ленты и видео Kinescope прямо в карточке.
   4. Ближайший старт: свежая дата из CMS в фактах о курсе и в заголовке формы.
   Без скрипта страница остаётся рабочей: видны все модули программы и первая карточка преподавателя. */
(() => {
  const desktop = window.matchMedia('(min-width: 64.0625rem)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- 1. Программа ---------- */
  document.querySelectorAll('[data-program-tabs]').forEach(root => {
    if (root.dataset.ready) return;
    root.dataset.ready = 'true';
    const tabs = [...root.querySelectorAll('[data-program-tab]')];
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
    const show = (index, {focus = false} = {}) => {
      tabs.forEach((tab, i) => {
        const open = i === index;
        tab.setAttribute('aria-expanded', String(open));
        panels[i].hidden = !open;
      });
      if (focus) tabs[index].focus();
    };
    // На узких экранах открытый модуль можно закрыть повторным нажатием; на десктопе всегда открыт один.
    tabs.forEach((tab, i) => tab.addEventListener('click', () => {
      const open = tab.getAttribute('aria-expanded') === 'true';
      if (open && !desktop.matches) { tab.setAttribute('aria-expanded', 'false'); panels[i].hidden = true; return; }
      show(i);
      if (!desktop.matches && !reduce.matches) tab.scrollIntoView({block: 'nearest', behavior: 'smooth'});
    }));
    // Стрелки вверх и вниз переводят фокус между модулями, Home и End — к первому и последнему.
    root.addEventListener('keydown', event => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const next = {ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1}[event.key];
      if (next === undefined) return;
      event.preventDefault();
      const target = (next + tabs.length) % tabs.length;
      if (desktop.matches) show(target, {focus: true}); else tabs[target].focus();
    });
    // При переходе на десктоп хотя бы один модуль должен быть открыт.
    desktop.addEventListener('change', () => {
      if (desktop.matches && !tabs.some(tab => tab.getAttribute('aria-expanded') === 'true')) show(0);
    });
    show(0);
  });

  /* ---------- 2. Преподаватели ---------- */
  document.querySelectorAll('[data-teachers]').forEach(root => {
    if (root.dataset.ready) return;
    root.dataset.ready = 'true';
    const tabs = [...root.querySelectorAll('[data-teacher-tab]')];
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
    const select = (index, focus) => {
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i].classList.toggle('is-active', on);
      });
      if (focus) tabs[index].focus();
      // На телефоне имена в прокручиваемой строке: выбранное имя должно быть видно целиком.
      tabs[index].scrollIntoView({block: 'nearest', inline: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth'});
    };
    tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i, false)));
    root.addEventListener('keydown', event => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const next = {ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1}[event.key];
      if (next === undefined) return;
      event.preventDefault();
      select((next + tabs.length) % tabs.length, true);
    });
  });

  /* ---------- 3. Отзывы ---------- */
  document.querySelectorAll('[data-reviews]').forEach(root => {
    if (root.dataset.ready) return;
    root.dataset.ready = 'true';
    const track = root.querySelector('[data-reviews-track]');
    const prev = root.querySelector('[data-reviews-prev]');
    const next = root.querySelector('[data-reviews-next]');
    const step = () => {
      const card = track.querySelector('.kpt-review_card');
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
    };
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    };
    const behavior = () => (reduce.matches ? 'auto' : 'smooth');
    prev.addEventListener('click', () => track.scrollBy({left: -step(), behavior: behavior()}));
    next.addEventListener('click', () => track.scrollBy({left: step(), behavior: behavior()}));
    track.addEventListener('scroll', update, {passive: true});
    window.addEventListener('resize', update);
    update();

    // Видео включается в карточке. Одновременно играет одно: при запуске другого прежнее снова становится обложкой.
    let playing = null;
    const stop = () => {
      if (!playing) return;
      playing.frame.replaceWith(playing.button);
      playing = null;
    };
    track.querySelectorAll('[data-review-video]').forEach(button => button.addEventListener('click', () => {
      stop();
      const id = button.dataset.reviewVideo;
      const frame = document.createElement('div');
      frame.className = 'kpt-review_media';
      const iframe = document.createElement('iframe');
      iframe.className = 'kpt-review_frame';
      iframe.src = `https://kinescope.io/embed/${encodeURIComponent(id)}?autoplay=1`;
      iframe.title = button.getAttribute('aria-label') || 'Видеоотзыв';
      iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write';
      frame.appendChild(iframe);
      button.replaceWith(frame);
      playing = {button, frame};
      iframe.focus();
    }));
  });

  /* ---------- 4. Ближайший старт из CMS ----------
     При сборке в страницу вписана дата на тот день. Здесь берём свежую: ближайший поток с открытым набором.
     Если CMS не ответила, остаётся дата из сборки. */
  const startSlots = document.querySelectorAll('[data-kpt-start]');
  const priceBlock = document.querySelector('[data-price-auto][data-course]');
  if (startSlots.length && priceBlock && 'fetch' in window) {
    const api = (priceBlock.getAttribute('data-api') || '').replace(/\/+$/, '');
    const slug = priceBlock.getAttribute('data-course');
    const OPEN = ['Идет набор', 'Идёт набор', 'Последний шанс'];
    const controller = 'AbortController' in window ? new AbortController() : null;
    const timer = setTimeout(() => controller?.abort(), 8000);
    fetch(`${api}/api/public/course/${encodeURIComponent(slug)}`, {headers: {Accept: 'application/json'}, signal: controller?.signal})
      .then(response => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then(course => {
        const today = Date.now() - 864e5;
        const stream = (course.streams || [])
          .filter(s => OPEN.includes(s.status) && s.startDate && Date.parse(s.startDate) >= today)
          .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate))[0];
        if (!stream) return;
        const date = new Intl.DateTimeFormat('ru-RU', {day: 'numeric', month: 'long', timeZone: 'Europe/Moscow'}).format(new Date(stream.startDate)).replace(' ', ' ');
        startSlots.forEach(slot => { slot.textContent = date; });
      })
      .catch(error => console.info('[kpt-bek] Дата старта из CMS не загрузилась, осталась дата из сборки.', error.message))
      .finally(() => clearTimeout(timer));
  }
})();
