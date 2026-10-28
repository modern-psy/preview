/* Сгенерировано: node business-consulting/build.mjs. Общие скрипты Академии в порядке зависимостей, затем цена из CMS. Руками не править. */

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

/* === web-academy/shared/academy/request-form.js === */
// Форма заявки Академии: проверка полей, маска телефона и передача заявки
// в скрытую нативную форму Тильды. Как подключать — request-form.md,
// правила моста — rules/engineering/tilda-form-bridges.md.
//
// Можно менять: тексты в разделе «Тексты».
// Нельзя менять без проверки на опубликованной странице: поиск нативной формы,
// заполнение её полей и ожидание ответа Тильды (разделы «Мост» и «Отправка»).
(() => {
  "use strict";

  /* ---------- Тексты ---------- */

  const TEXT = {
    nameEmpty: "Напишите, как к вам обращаться",
    nameShort: "Напишите имя полностью",
    nameLong: "Имя слишком длинное, сократите до 60 символов",
    nameChars: "В имени только буквы, пробел и дефис",
    phoneEmpty: "Напишите номер телефона",
    phoneShort: "В номере не хватает цифр, пример: +7 912 345-67-89",
    phoneCode: "Проверьте код номера, пример: +7 912 345-67-89",
    phoneIntlShort: "Нужен код страны и номер, например +375 29 123-45-67",
    phoneIntlLong: "В номере слишком много цифр, проверьте его",
    emailEmpty: "Напишите почту, на неё придёт доступ",
    emailCyrillic: "Адрес почты пишется латиницей, пример: anna@mail.ru",
    emailInvalid: "Проверьте адрес почты, пример: anna@mail.ru",
    telegramEmpty: "Напишите ник в Telegram, например @anna_psy",
    telegramPhone: "Нужен ник, а не номер телефона, например @anna_psy",
    telegramCyrillic: "Ник пишется латиницей, например @anna_psy",
    telegramChars: "В нике только латинские буквы, цифры и подчёркивание, например @anna_psy",
    telegramLength: "В нике от 3 до 32 символов, например @anna_psy",
    sending: "Отправляем заявку…",
    sendFailed: "Не получилось отправить. Попробуйте ещё раз или напишите в приёмную комиссию",
    unavailable: "Отправка сейчас недоступна. Напишите в приёмную комиссию, ответим так же быстро",
    slow: "Отправляем дольше обычного. Если не получится, напишите в приёмную комиссию",
    noNative: "Если форма не отправится, напишите в приёмную комиссию",
    phoneCheck: "Проверьте номер: не хватает цифр или есть лишние",
    ruPlaceholder: "+7 900 000-00-00",
    intlPlaceholder: "+375 29 123-45-67",
  };

  /* ---------- Проверки и форматирование (их проверяет tests/request-form.test.mjs) ---------- */

  const digitsOf = (value) => String(value || "").replace(/\D/g, "");

  // Российский номер из того, что человек ввёл или вставил: +7…, 8…, 7…, 9…,
  // с пробелами, скобками и дефисами. foreign — номер с другим кодом страны.
  const parseRuPhone = (value) => {
    const cleaned = String(value || "").replace(/[^\d+]/g, "");
    const digits = digitsOf(cleaned);
    if (cleaned.startsWith("00") || (cleaned.startsWith("+") && digits && digits[0] !== "7")) {
      return { foreign: true, national: "" };
    }
    let national = digits;
    if (cleaned.startsWith("+")) national = digits.slice(1);
    else if (digits.length >= 11 && /^[78]/.test(digits)) national = digits.slice(1);
    // После +7 по привычке набрали 8 или 7: на одиннадцатой цифре лишнее убираем
    if (national.length >= 11 && /^[78]/.test(national)) national = national.slice(1);
    return { foreign: false, national: national.slice(0, 10) };
  };

  const formatRuPhone = (national) => {
    if (!national) return "";
    let result = `+7 ${national.slice(0, 3)}`;
    if (national.length > 3) result += ` ${national.slice(3, 6)}`;
    if (national.length > 6) result += `-${national.slice(6, 8)}`;
    if (national.length > 8) result += `-${national.slice(8, 10)}`;
    return result;
  };

  const ruPhoneMessage = (national) => {
    if (!national) return TEXT.phoneEmpty;
    if (national.length < 10) return TEXT.phoneShort;
    if (/^[0-2]/.test(national)) return TEXT.phoneCode;
    return "";
  };

  // Иностранный номер: только «+», цифры и привычные разделители
  const sanitizeIntlPhone = (value) => {
    let result = String(value || "").replace(/[^\d+()\-\s]/g, "").replace(/(?!^)\+/g, "");
    if (result.startsWith("00")) result = `+${result.slice(2)}`;
    if (result && !result.startsWith("+")) result = `+${result}`;
    return result;
  };

  const intlPhoneMessage = (value) => {
    const digits = digitsOf(value);
    if (!digits) return TEXT.phoneEmpty;
    if (digits.length < 8) return TEXT.phoneIntlShort;
    if (digits.length > 15) return TEXT.phoneIntlLong;
    return "";
  };

  // Ник из «anna_psy», «@anna_psy», «t.me/anna_psy» или полной ссылки
  const normalizeTelegram = (value) => {
    let nick = String(value || "").trim();
    const link = nick.match(/^(?:https?:\/\/)?(?:www\.)?(?:t|telegram)\.(?:me|dog)\/([^/?#\s]*)/i);
    if (link) nick = link[1];
    return nick.replace(/^@+/, "");
  };

  const telegramMessage = (value) => {
    const nick = normalizeTelegram(value);
    if (!nick) return TEXT.telegramEmpty;
    if (/^\+?[\d\s()-]{5,}$/.test(nick)) return TEXT.telegramPhone;
    if (/[а-яё]/i.test(nick)) return TEXT.telegramCyrillic;
    if (!/^[A-Za-z0-9_]+$/.test(nick)) return TEXT.telegramChars;
    if (nick.length < 3 || nick.length > 32) return TEXT.telegramLength;
    return "";
  };

  const EMAIL_PATTERN =
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

  // Частые опечатки в домене почты. Подсказку человек принимает сам, форма
  // ничего не исправляет молча
  const EMAIL_DOMAIN_FIXES = {
    "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmal.com": "gmail.com",
    "gamil.com": "gmail.com", "gnail.com": "gmail.com", "gmail.co": "gmail.com",
    "gmail.cm": "gmail.com", "gmail.con": "gmail.com", "gmail.ru": "gmail.com",
    "yandex.r": "yandex.ru", "yandx.ru": "yandex.ru", "yadex.ru": "yandex.ru",
    "yndex.ru": "yandex.ru", "yanex.ru": "yandex.ru", "mail.r": "mail.ru",
    "mial.ru": "mail.ru", "maill.ru": "mail.ru", "mai.ru": "mail.ru",
    "ramble.ru": "rambler.ru", "icloud.co": "icloud.com", "icloud.cm": "icloud.com",
    "iclod.com": "icloud.com", "outlok.com": "outlook.com", "hotmial.com": "hotmail.com",
  };

  const suggestEmail = (value) => {
    const email = String(value || "").trim();
    const at = email.lastIndexOf("@");
    if (at < 1) return "";
    const domain = email.slice(at + 1).toLowerCase();
    const fixed = EMAIL_DOMAIN_FIXES[domain] ||
      domain.replace(/\.ry$/, ".ru").replace(/\.(con|cmo|ocm)$/, ".com");
    return fixed && fixed !== domain ? `${email.slice(0, at)}@${fixed}` : "";
  };

  const emailMessage = (value) => {
    const email = String(value || "").trim();
    if (!email) return TEXT.emailEmpty;
    if (/[а-яё]/i.test(email)) return TEXT.emailCyrillic;
    if (!EMAIL_PATTERN.test(email)) return TEXT.emailInvalid;
    return "";
  };

  const normalizeName = (value) => String(value || "").replace(/\s+/g, " ").trim();
  // Любые буквы, пробел, дефис и апостроф. Старые браузеры не знают \p{L}:
  // для них запасной вариант с кириллицей и латиницей
  const NAME_PATTERN = (() => {
    try {
      return new RegExp("^\\p{L}[\\p{L}'’ -]*$", "u");
    } catch (error) {
      return /^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё'’ -]*$/;
    }
  })();

  const nameMessage = (value) => {
    const name = normalizeName(value);
    if (!name) return TEXT.nameEmpty;
    if (name.length < 2) return TEXT.nameShort;
    if (name.length > 60) return TEXT.nameLong;
    if (!NAME_PATTERN.test(name)) return TEXT.nameChars;
    return "";
  };

  // Москва живёт по UTC+3 круглый год
  const moscowHour = (date = new Date()) => (date.getUTCHours() + 3) % 24;

  const replyWhen = (hour, from, to) => {
    if (hour < from) return `сегодня после ${from}:00 по Москве`;
    if (hour < to) return `сегодня до ${to}:00 по Москве`;
    return `завтра после ${from}:00 по Москве`;
  };

  const fieldsWord = (count) => {
    const last = count % 10;
    const lastTwo = count % 100;
    if (last === 1 && lastTwo !== 11) return "поле";
    if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return "поля";
    return "полей";
  };

  // Устройство для заявки в amoCRM и параметров Метрики
  const detectDevice = (nav = window.navigator || {}) => {
    const ua = nav.userAgent || "";
    const touchMac = /Macintosh/.test(ua) && nav.maxTouchPoints > 1;
    if (/iPad|Tablet/i.test(ua) || touchMac || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "планшет";
    if (/Mobi|iPhone|iPod|Android/i.test(ua)) return "телефон";
    return "компьютер";
  };

  const successMessage = ({ mode, messenger, contact, email, hour, from, to, custom }) => {
    if (custom) return custom;
    if (mode === "access") {
      return `Письмо с доступом придёт на ${email}. Если его нет во «Входящих», загляните в «Спам».`;
    }
    const where = messenger === "max" ? `в MAX на номер ${contact}` : `в Telegram ${contact}`;
    return `Менеджер напишет ${where} ${replyWhen(hour, from, to)}. Если не ответите в мессенджере, позвоним.`;
  };

  const helpers = {
    TEXT, parseRuPhone, formatRuPhone, ruPhoneMessage, sanitizeIntlPhone, intlPhoneMessage,
    normalizeTelegram, telegramMessage, suggestEmail, emailMessage, normalizeName, nameMessage,
    moscowHour, replyWhen, fieldsWord, detectDevice, successMessage,
  };
  window.__academyRequestFormHelpers = helpers;

  /* ---------- Запуск ---------- */

  if (typeof window.__academyRequestFormCleanup === "function") {
    window.__academyRequestFormCleanup();
  }

  const forms = [...document.querySelectorAll("[data-academy-request-form]")];
  if (!forms.length) return;

  // На боевом домене нативная форма Тильды обязана быть на странице.
  // На превью её нет, поэтому предупреждение о ней там не показываем
  const IS_PRODUCTION = /(^|\.)modern-psy\.ru$/.test(window.location.hostname);
  const SLOW_DELIVERY_MS = 15000;
  const DISCOVERY_MS = 10000;

  const storage = (() => {
    try {
      const store = window.sessionStorage;
      store.setItem("__academy-request-form", "1");
      store.removeItem("__academy-request-form");
      return store;
    } catch (error) {
      return null;
    }
  })();

  // Маска телефона Тильды. На странице с формой Тильды скрипт уже есть,
  // иначе подгружаем его с tildacdn. Не загрузился — остаётся своя маска
  const TILDA_PHONE_MASK_URL = "https://static.tildacdn.com/js/tilda-phone-mask-1.1.min.js";
  let tildaMaskLoading = null;

  const loadTildaMask = () => {
    const ready = () => typeof window.t_form_phonemask_load === "function";
    if (ready()) return Promise.resolve(true);
    if (tildaMaskLoading) return tildaMaskLoading;
    tildaMaskLoading = new Promise((resolve) => {
      let script = [...document.scripts].find((item) => item.src.includes("tilda-phone-mask"));
      if (!script) {
        script = document.createElement("script");
        script.src = TILDA_PHONE_MASK_URL;
        script.async = true;
        document.head.append(script);
      }
      script.addEventListener("load", () => resolve(ready()));
      script.addEventListener("error", () => resolve(false));
      window.setTimeout(() => resolve(ready()), 8000);
    });
    return tildaMaskLoading;
  };

  const readCookie = (name) => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : "";
  };

  /* ---------- Мост к нативной форме Тильды ---------- */

  const setNativeInputValue = (input, value) => {
    if (!(input instanceof HTMLInputElement)) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (setter) setter.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  // Нативную форму ищем только по её имени (tildaspec-formname): номера блоков
  // Тильда меняет при копировании страницы
  const findTildaForm = (formName) =>
    (formName && [...document.querySelectorAll("form.t-form")].find(
      (form) => form.querySelector('input[name="tildaspec-formname"]')?.value === formName,
    )) || null;

  // Прячем только блок, где лежит найденная форма. Сама форма остаётся в DOM
  const hideTildaFormRecord = (formName) => {
    const nativeForm = findTildaForm(formName);
    if (!(nativeForm instanceof HTMLFormElement)) return null;
    const record = nativeForm.closest(".t-rec") || nativeForm;
    record.hidden = true;
    record.setAttribute("aria-hidden", "true");
    record.setAttribute("data-academy-native-form-record", "");
    return nativeForm;
  };

  const isRequiredInTilda = (element) =>
    Boolean(element && (element.getAttribute?.("data-tilda-req") === "1" ||
      element.querySelector?.('[data-tilda-req="1"]')));

  // Для маски без скрипта Тильды: 10 цифр российского номера или полный +код
  const getTildaPhoneValue = (e164) => {
    const digits = digitsOf(e164);
    if (!digits) return "";
    return digits.startsWith("7") ? digits.slice(1, 11) : `+${digits}`;
  };

  // Телефон Тильда ждёт в своей полной маске, например +7 (999) 000-00-01
  const fillTildaPhoneGroup = (group, e164, resultName) => {
    if (!(group instanceof HTMLElement)) return;
    const visibleInputs = [...group.querySelectorAll('input.t-input-phonemask:not([type="hidden"])')];
    if (typeof window.t_form_phonemask__setValue === "function") {
      window.t_form_phonemask__setValue(group, e164, undefined, { noFocus: true });
    } else {
      visibleInputs.forEach((input) => setNativeInputValue(input, getTildaPhoneValue(e164)));
    }
    const visible = visibleInputs[0];
    const visiblePhone = visible?.dataset.phonemaskCurrent || visible?.value || "";
    const dialCode = visible?.dataset.phonemaskCode || "";
    const formatted = visiblePhone.startsWith("+") ? visiblePhone : `${dialCode} ${visiblePhone}`.trim();
    group.querySelectorAll(`input.js-phonemask-result[name="${resultName}"]`)
      .forEach((input) => setNativeInputValue(input, formatted || e164));
    group.querySelectorAll("input.js-phonemask-result-iso")
      .forEach((input) => setNativeInputValue(input, visible?.dataset.phonemaskIso || input.value || "ru"));
  };

  // MAX в разных блоках Тильды лежит в слоте max, max_messenger или в слоте
  // whatsapp. В слот Telegram он не попадает никогда
  const selectTildaMessenger = (group, messenger) => {
    const radios = [...group.querySelectorAll('input[type="radio"][name="messenger-type"]')];
    const telegramRadio = radios.find((radio) => radio.value === "telegram");
    const maxRadio =
      radios.find((radio) => radio.value === "max" || radio.value === "max_messenger") ||
      radios.find((radio) => radio.value === "whatsapp") ||
      radios.find((radio) => radio.value !== "telegram");
    if (maxRadio && !maxRadio.dataset.academyOriginalValue) {
      maxRadio.dataset.academyOriginalValue = maxRadio.value;
    }
    if (maxRadio?.dataset.academyOriginalValue) maxRadio.value = maxRadio.dataset.academyOriginalValue;
    const selected = messenger === "telegram" ? telegramRadio : maxRadio;
    if (!(selected instanceof HTMLInputElement)) return "";
    const selectedType = selected.value;
    selected.checked = true;
    selected.dispatchEvent(new Event("input", { bubbles: true }));
    selected.dispatchEvent(new Event("change", { bubbles: true }));
    if (messenger === "max" && selected.value === "whatsapp") selected.value = "max";
    return selectedType;
  };

  // Скрытые служебные поля (form_source, устройство). Если поля нет, добавляем
  // скрытым: Тильда отправит его вместе с заявкой
  const setNativeExtra = (nativeForm, name, value, mode = "replace") => {
    if (!name || !value) return;
    let input = [...nativeForm.querySelectorAll("input")].find((item) => item.name === name);
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      nativeForm.append(input);
    }
    if (input.dataset.academyOriginalValue === undefined) {
      // Метку из адреса страницы сохраняем: устройство дописывается к ней, а не вместо неё
      input.dataset.academyOriginalValue = input.value || new URLSearchParams(window.location.search).get(name) || "";
    }
    const original = mode === "append" ? input.dataset.academyOriginalValue : "";
    setNativeInputValue(input, original ? `${original} · ${value}` : value);
  };

  // Следующий кадр, но не дольше 100 мс: в фоновой вкладке кадры не рисуются,
  // и отправка не должна из-за этого зависать
  const nextFrame = () => new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    window.requestAnimationFrame(finish);
    window.setTimeout(finish, 100);
  });

  class ContractError extends Error {}

  // Сначала проверяем, что в нативной форме есть всё нужное, и только потом
  // заполняем: неполную заявку отправлять нельзя
  const syncTildaForm = async (nativeForm, payload, extras) => {
    const nameInput = nativeForm.querySelector('input[data-tilda-rule="name"], input[name="Name"]');
    const emailInput = nativeForm.querySelector('input[data-tilda-rule="email"], input[name="email"], input[name="Email"]');
    const phoneGroup = [...nativeForm.querySelectorAll(".t-input-group_ph")]
      .find((group) => !group.closest(".t-input-group_contact_method"));
    const messengerGroup = nativeForm.querySelector(".t-input-group_contact_method");
    const problems = [];
    if (!(nameInput instanceof HTMLInputElement)) problems.push("нет поля Name");
    if (payload.email !== null && !(emailInput instanceof HTMLInputElement)) problems.push("нет поля email");
    if (payload.email === null && isRequiredInTilda(emailInput)) problems.push("email обязателен в Тильде, а форма его не спрашивает");
    if (!(phoneGroup instanceof HTMLElement)) problems.push("нет поля Phone");
    if (payload.messenger && !(messengerGroup instanceof HTMLElement)) problems.push("нет блока messenger-type");
    if (!payload.messenger && isRequiredInTilda(messengerGroup)) problems.push("мессенджер обязателен в Тильде, а форма его не спрашивает");
    if (problems.length) throw new ContractError(problems.join("; "));

    setNativeInputValue(nameInput, payload.name);
    if (payload.email !== null) setNativeInputValue(emailInput, payload.email);
    fillTildaPhoneGroup(phoneGroup, payload.phone, "Phone");
    // Несколько значений в одно поле собираем через « · »: так источник
    // и устройство вместе уходят в form_source, а не затирают друг друга
    const merged = new Map();
    extras.forEach(([name, value, mode]) => {
      if (!name || !value) return;
      const current = merged.get(name);
      if (mode === "append" && current) current.parts.push(value);
      else merged.set(name, { mode, parts: [value] });
    });
    merged.forEach(({ mode, parts }, name) => setNativeExtra(nativeForm, name, parts.join(" · "), mode));
    if (!payload.messenger) return;

    const selectedType = selectTildaMessenger(messengerGroup, payload.messenger);
    await nextFrame();

    // Очищаем контакты всех мессенджеров, иначе старое значение уйдёт в CRM вместе с новым
    messengerGroup.querySelectorAll(
      'input[name="messenger-id"], input[name="tildaspec-phone-part[]"], input[name="tildaspec-phone-part[]-iso"]',
    ).forEach((input) => {
      // Скрытые группы Тильда уже очистила и выключила: событие input включило бы их снова
      if (input.closest(".t-contact-method__hybrid.t-contact-method__hidden")) return;
      setNativeInputValue(input, "");
    });

    // Новый блок контактов: у каждого мессенджера своё поле с data-contact-method
    const typedInput = [...messengerGroup.querySelectorAll('input[name="messenger-id"][data-contact-method]')]
      .find((input) => input.dataset.contactMethod === selectedType);
    if (typedInput instanceof HTMLInputElement) {
      const valueGroup = typedInput.closest(".t-phonemask-input-group");
      if (/^[+0-9]/.test(payload.messengerContact) && valueGroup?.querySelector("input.t-input-phonemask")) {
        // Гибридное поле переключается на маску телефона от первого «+»
        setNativeInputValue(typedInput, "+");
        fillTildaPhoneGroup(valueGroup, payload.messengerContact, "messenger-id");
      } else {
        setNativeInputValue(typedInput, payload.messengerContact);
      }
    } else if (payload.messenger === "telegram") {
      const telegramInput = messengerGroup.querySelector('input[name="messenger-id"]:not([type="hidden"]):not(:disabled)');
      if (!(telegramInput instanceof HTMLInputElement)) throw new ContractError("нет активного поля Telegram");
      setNativeInputValue(telegramInput, payload.messengerContact);
    } else {
      const maxPhoneGroup = messengerGroup
        .querySelector('input.t-input-phonemask:not([type="hidden"]):not(:disabled)')
        ?.closest(".t-phonemask-input-group");
      if (!(maxPhoneGroup instanceof HTMLElement)) throw new ContractError("нет активного поля MAX");
      fillTildaPhoneGroup(maxPhoneGroup, payload.messengerContact, "messenger-id");
    }
  };

  const captchaOpen = () => Boolean(document.querySelector(
    '[class*="tildaformcaptchabox"], [id*="tildaformcaptchabox"], [class*="captchaIframeBox"], [id*="captchaIframeBox"]',
  ));

  const reachGoal = (form, goal, params) => {
    try {
      if (typeof window.ym !== "function") return;
      const id = Number(form.dataset.metrikaId) ||
        window.Ya?.Metrika2?.counters?.()?.[0]?.id ||
        window.Ya?.Metrika?.counters?.()?.[0]?.id;
      if (id) window.ym(id, "reachGoal", goal, params);
    } catch (error) {
      // Аналитика не должна ломать форму
    }
  };

  /* ---------- Одна форма ---------- */

  const controllers = [];
  const watchedNames = new Set();

  const setupForm = (form) => {
    const mode = form.dataset.mode || "course";
    const formName = form.dataset.tildaFormName?.trim() || "";
    const hoursFrom = Number(form.dataset.hoursFrom) || 10;
    const hoursTo = Number(form.dataset.hoursTo) || 19;
    const device = detectDevice();
    // Поля ищем каждый раз заново: маска Тильды подменяет поле телефона своим
    const byKey = (key) => form.querySelector(`[data-request-input="${key}"]`);
    const allInputs = () => [...form.querySelectorAll("[data-request-input]")];
    const inputOf = (target) =>
      (target instanceof HTMLInputElement && target.matches("[data-request-input]") ? target : null);
    const nameInput = byKey("name");
    const emailInput = byKey("email");
    const telegramInput = byKey("telegram");
    const phoneInput = () => byKey("phone");
    const telegramField = telegramInput?.closest("[data-request-field]") || null;
    const phoneMaskRoot = form.querySelector("[data-request-phone-mask]");
    const messengerInputs = [...form.querySelectorAll('input[name="messenger"]')];
    const tipButtons = [...form.querySelectorAll("[data-request-tip]")];
    const emailSuggest = form.querySelector("[data-request-email-suggest]");
    const emailFix = form.querySelector("[data-request-email-fix]");
    const submit = form.querySelector("[data-request-submit]");
    const summary = form.querySelector("[data-request-summary]");
    const help = form.querySelector("[data-request-help]");
    const helpText = form.querySelector("[data-request-help-text]");
    const contentParts = [...form.querySelectorAll("[data-request-content]")];
    const successView = form.querySelector("[data-request-success]");
    const successHeading = form.querySelector("[data-request-success-heading]");
    const successText = form.querySelector("[data-request-success-text]");
    const section = form.closest("section[aria-labelledby]");
    const draftKey = `academy-request-form:${window.location.pathname}:${form.id || formName}`;
    const cleanups = [];
    let phoneMode = "ru"; // своя маска: ru или intl
    let tildaMask = Boolean(phoneMaskRoot?.querySelector("input.t-input-phonemask"));
    let quiet = false; // скрипт сам заполняет поле: это не ввод человека
    let busy = false;
    let disposed = false;
    let started = false;
    let submittedForm = null;
    let slowTimer = 0;
    let viewSent = false;
    let onScreen = false;
    let focused = false;
    let lastVisible = null;

    const listen = (target, type, handler, options) => {
      if (!target) return;
      target.addEventListener(type, handler, options);
      cleanups.push(() => target.removeEventListener(type, handler, options));
    };

    const goalParams = (extra = {}) => ({ mode, page: window.location.pathname, device, ...extra });

    /* Состояние полей */

    const fieldOf = (input) => input.closest("[data-request-field]");
    const isActive = (input) => input && !input.disabled && !fieldOf(input)?.hidden;
    const activeInputs = () => allInputs().filter(isActive);
    const selectedMessenger = () => messengerInputs.find((input) => input.checked)?.value || null;

    /* Телефон: маска Тильды с выбором страны. Пока она не загрузилась
       или если не загрузится совсем, работает своя маска +7 */

    const phoneResult = () => phoneMaskRoot?.querySelector(".js-phonemask-result") || null;

    const phoneMessage = (input) => {
      if (!tildaMask) {
        return phoneMode === "ru" ? ruPhoneMessage(parseRuPhone(input.value).national) : intlPhoneMessage(input.value);
      }
      if (!digitsOf(input.value)) return TEXT.phoneEmpty;
      const value = phoneResult()?.value || "";
      const valid = typeof window.t_form_phonemask__validatePhone === "function"
        ? window.t_form_phonemask__validatePhone(value)
        : digitsOf(value).length >= 8;
      if (valid) return "";
      return input.getAttribute("data-phonemask-code") === "+7" ? TEXT.phoneShort : TEXT.phoneCheck;
    };

    const phoneTyped = () => {
      const input = phoneInput();
      if (!input) return "";
      if (tildaMask) return digitsOf(input.value);
      return phoneMode === "ru" ? parseRuPhone(input.value).national : digitsOf(input.value);
    };

    const phoneE164 = () => {
      const input = phoneInput();
      if (tildaMask) return `+${digitsOf(phoneResult()?.value)}`;
      if (phoneMode === "intl") return `+${digitsOf(input.value)}`;
      return `+7${parseRuPhone(input.value).national}`;
    };

    const phoneDisplay = () => (tildaMask ? phoneResult()?.value || "" : phoneInput()?.value.trim() || "");

    const messageFor = (input) => {
      const value = input.value;
      switch (input.dataset.requestInput) {
        case "name": return nameMessage(value);
        case "email": return emailMessage(value);
        case "telegram": return telegramMessage(value);
        case "phone": return phoneMessage(input);
        default: return "";
      }
    };

    const showFieldError = (input, message) => {
      const field = fieldOf(input);
      const wasInvalid = field?.dataset.state === "invalid";
      input.setAttribute("aria-invalid", String(Boolean(message)));
      if (field) field.dataset.state = message ? "invalid" : "idle";
      const error = field?.querySelector("[data-request-error]");
      if (error) error.textContent = message;
      if (message && !wasInvalid) reachGoal(form, "form_error", { mode, field: input.dataset.requestInput });
    };

    const isShownInvalid = (input) => fieldOf(input)?.dataset.state === "invalid";

    const setSummary = (message = "", state = "idle") => {
      if (!summary) return;
      summary.textContent = message;
      summary.dataset.state = state;
    };

    const refreshSummary = () => {
      if (summary?.dataset.state !== "invalid") return;
      const count = activeInputs().filter(isShownInvalid).length;
      setSummary(count ? `Проверьте ${count} ${fieldsWord(count)}` : "", count ? "invalid" : "idle");
    };

    const showHelp = (message) => {
      if (!help) return;
      if (helpText) helpText.textContent = message;
      help.hidden = false;
    };

    const hideHelp = () => {
      if (help) help.hidden = true;
    };

    // «Далее» на клавиатуре у всех полей, кроме последнего
    const updateEnterHints = () => {
      const list = activeInputs();
      list.forEach((input, index) => {
        input.setAttribute("enterkeyhint", index === list.length - 1 ? "done" : "next");
      });
    };

    /* Черновик: введённое не теряется, если человек ушёл назад и вернулся */

    const saveDraft = () => {
      if (!storage) return;
      try {
        storage.setItem(draftKey, JSON.stringify({
          name: nameInput?.value || "",
          email: emailInput?.value || "",
          phone: phoneTyped() ? phoneE164() : "",
          messenger: selectedMessenger(),
          telegram: telegramInput?.value || "",
        }));
      } catch (error) {
        // Хранилище переполнено или запрещено: форма работает и без черновика
      }
    };

    const clearDraft = () => {
      try {
        storage?.removeItem(draftKey);
      } catch (error) {
        // Нечего очищать
      }
    };

    const readDraft = () => {
      try {
        return JSON.parse(storage?.getItem(draftKey) || "null");
      } catch (error) {
        return null;
      }
    };

    /* Своя маска: нужна, только пока маска Тильды не подключилась */

    const setPhoneMode = (nextMode) => {
      phoneMode = nextMode;
      const input = phoneInput();
      if (input && !tildaMask) input.placeholder = nextMode === "ru" ? TEXT.ruPlaceholder : TEXT.intlPlaceholder;
    };

    const formatPhone = (input) => {
      if (phoneMode === "intl") {
        const sanitized = sanitizeIntlPhone(input.value);
        if (sanitized !== input.value) input.value = sanitized;
        return;
      }
      const raw = input.value;
      const parsed = parseRuPhone(raw);
      if (parsed.foreign) {
        setPhoneMode("intl");
        input.value = sanitizeIntlPhone(raw);
        return;
      }
      const formatted = formatRuPhone(parsed.national);
      if (formatted === raw) return;
      const caret = input.selectionStart ?? raw.length;
      const atEnd = caret >= raw.length;
      const cleaned = raw.replace(/[^\d+]/g, "");
      const hadPrefix = cleaned.startsWith("+") || (digitsOf(raw).length >= 11 && /^[78]/.test(digitsOf(raw)));
      input.value = formatted;
      if (document.activeElement !== input) return;
      if (atEnd) {
        input.setSelectionRange(formatted.length, formatted.length);
        return;
      }
      // Курсор встаёт после того же числа цифр, что и до форматирования
      let left = digitsOf(raw.slice(0, caret)).length + (hadPrefix ? 0 : 1);
      let position = 0;
      while (position < formatted.length && left > 0) {
        if (/\d/.test(formatted[position])) left -= 1;
        position += 1;
      }
      input.setSelectionRange(position, position);
    };

    const setOwnPhone = (e164) => {
      const input = phoneInput();
      if (!input || !e164) return;
      if (e164.startsWith("+7")) {
        setPhoneMode("ru");
        input.value = formatRuPhone(parseRuPhone(e164).national);
      } else {
        setPhoneMode("intl");
        input.value = sanitizeIntlPhone(e164);
      }
    };

    /* Маска Тильды: её скрипт заменяет наше поле своим с флагом и кодом страны */

    const startTildaMask = () => {
      const original = phoneInput();
      if (disposed || tildaMask || !phoneMaskRoot || !original || typeof window.t_form_phonemask_load !== "function") return;
      const describedBy = original.getAttribute("aria-describedby") || "";
      const hadFocus = document.activeElement === original;
      const e164 = phoneTyped() ? phoneE164() : "";
      const backup = original.cloneNode(true);
      original.value = "";
      try {
        window.t_form_phonemask_load(original);
      } catch (error) {
        // Ниже проверяем, дошла ли настройка маски до конца
      }
      const group = phoneMaskRoot.querySelector("[data-input-lid]");
      const input = phoneMaskRoot.querySelector("input.t-input-phonemask");
      if (group?.getAttribute("data-init-mask") !== "yes" || !input) {
        // Маска встала не до конца: возвращаем своё поле, чтобы телефон можно было ввести
        const wrap = phoneMaskRoot.querySelector(".t-input-phonemask__wrap");
        if (wrap) wrap.replaceWith(backup);
        if (e164) setOwnPhone(e164);
        return;
      }
      tildaMask = true;
      input.classList.add("request-form_phone-input");
      input.dataset.requestInput = "phone";
      input.required = true;
      input.setAttribute("autocomplete", "tel");
      input.setAttribute("inputmode", "tel");
      input.setAttribute("aria-invalid", "false");
      input.setAttribute("aria-describedby", describedBy);
      if (e164 && typeof window.t_form_phonemask__setValue === "function") {
        quiet = true;
        try {
          window.t_form_phonemask__setValue(phoneMaskRoot.querySelector("[data-input-lid]"), e164, undefined, { noFocus: true });
        } catch (error) {
          // Номер не перенёсся: человек наберёт его заново
        }
        quiet = false;
      }
      if (hadFocus) input.focus();
      updateEnterHints();
    };

    /* Мессенджер */

    const renderMessenger = () => {
      const isTelegram = selectedMessenger() === "telegram";
      if (telegramField && telegramInput) {
        telegramField.hidden = !isTelegram;
        telegramInput.disabled = !isTelegram;
        if (!isTelegram) showFieldError(telegramInput, "");
      }
      updateEnterHints();
      refreshSummary();
    };

    const showEmailSuggestion = () => {
      if (!emailInput || !emailSuggest || !emailFix) return;
      const suggestion = emailMessage(emailInput.value) === TEXT.emailEmpty ? "" : suggestEmail(emailInput.value);
      emailFix.textContent = suggestion;
      emailSuggest.hidden = !suggestion;
    };

    /* Реакция на ввод */

    const handleInput = (input) => {
      if (quiet) return;
      if (input.dataset.requestInput === "phone" && !tildaMask) formatPhone(input);
      if (input === emailInput && emailSuggest) emailSuggest.hidden = true;
      input.dataset.dirty = "true";
      // Ошибка исчезает, как только значение стало верным, не дожидаясь ухода из поля
      if (isShownInvalid(input)) showFieldError(input, messageFor(input));
      refreshSummary();
      saveDraft();
      if (!started) {
        started = true;
        reachGoal(form, "form_start", goalParams());
      }
    };

    // Поле проверяется, когда человек из него вышел и что-то в нём менял
    const handleBlur = (input) => {
      if (busy) return;
      const key = input.dataset.requestInput;
      if (key === "phone" && !tildaMask && phoneMode === "ru" && !parseRuPhone(input.value).national) input.value = "";
      if (key === "telegram" && !telegramMessage(input.value)) input.value = `@${normalizeTelegram(input.value)}`;
      if (input.dataset.dirty === "true") showFieldError(input, messageFor(input));
      if (key === "email") showEmailSuggestion();
      refreshSummary();
    };

    listen(form, "input", (event) => {
      const input = inputOf(event.target);
      if (input) handleInput(input);
    });
    // Маска Тильды при вставке номера и смене страны шлёт change, а не input
    listen(form, "change", (event) => {
      const input = inputOf(event.target);
      if (input?.dataset.requestInput === "phone") handleInput(input);
    });
    listen(form, "focusout", (event) => {
      const input = inputOf(event.target);
      if (input) handleBlur(input);
    });

    // Своя маска: пустое поле телефона сразу показывает код страны
    listen(form, "focusin", (event) => {
      const input = inputOf(event.target);
      if (input?.dataset.requestInput !== "phone" || tildaMask || phoneMode !== "ru" || input.value) return;
      input.value = "+7 ";
      window.requestAnimationFrame(() => input.setSelectionRange(3, 3));
    });

    // Своя маска: вставка целого номера в пустое поле заменяет «+7 », а не дописывается к нему
    listen(form, "paste", (event) => {
      const input = inputOf(event.target);
      if (input?.dataset.requestInput !== "phone" || tildaMask || phoneMode !== "ru") return;
      const text = event.clipboardData?.getData("text") || "";
      const allSelected = input.selectionStart === 0 && input.selectionEnd === input.value.length;
      if (!text || (parseRuPhone(input.value).national && !allSelected)) return;
      event.preventDefault();
      input.value = text;
      handleInput(input);
      const end = input.value.length;
      input.setSelectionRange(end, end);
    });

    listen(emailFix, "click", () => {
      emailInput.value = emailFix.textContent;
      emailSuggest.hidden = true;
      handleInput(emailInput);
      showFieldError(emailInput, messageFor(emailInput));
      emailInput.focus();
    });

    messengerInputs.forEach((input) => {
      listen(input, "change", () => {
        renderMessenger();
        saveDraft();
      });
    });

    // Enter переводит к следующему полю, на последнем отправляет форму
    listen(form, "keydown", (event) => {
      if (event.key !== "Enter" || event.isComposing) return;
      const list = activeInputs();
      const index = list.indexOf(event.target);
      if (index > -1 && index < list.length - 1) {
        event.preventDefault();
        list[index + 1].focus();
      }
    });

    /* Пояснения под «?»: нажатие открывает и закрепляет, наведение мышью
       показывает, Escape, нажатие мимо и уход фокуса закрывают */

    const canHover = Boolean(window.matchMedia?.("(hover: hover) and (pointer: fine)").matches);
    const tipOf = (button) => document.getElementById(button.getAttribute("aria-controls"));
    const setTip = (button, open, pinned = false) => {
      button.setAttribute("aria-expanded", String(open));
      button.dataset.pinned = open && pinned ? "true" : "";
      const tip = tipOf(button);
      if (tip) tip.hidden = !open;
    };
    const closeTips = (except) => {
      tipButtons.forEach((button) => {
        if (button !== except) setTip(button, false);
      });
    };

    tipButtons.forEach((button) => {
      listen(button, "click", () => {
        const pinnedOpen = button.getAttribute("aria-expanded") === "true" && button.dataset.pinned === "true";
        closeTips(button);
        setTip(button, !pinnedOpen, true);
      });
      listen(button, "blur", () => setTip(button, false));
      if (canHover) {
        listen(button, "mouseenter", () => {
          if (button.getAttribute("aria-expanded") === "true") return;
          closeTips(button);
          setTip(button, true);
        });
        listen(button, "mouseleave", () => {
          if (button.dataset.pinned !== "true") setTip(button, false);
        });
      }
    });

    if (tipButtons.length) {
      listen(document, "keydown", (event) => {
        if (event.key === "Escape") closeTips();
      });
      listen(document, "pointerdown", (event) => {
        const inside = tipButtons.some((button) => button.contains(event.target) || tipOf(button)?.contains(event.target));
        if (!inside) closeTips();
      });
    }

    /* Видимость: липкая панель страницы прячется, пока форма на экране или открыта клавиатура */

    const emitVisible = () => {
      const visible = onScreen || focused;
      if (visible === lastVisible) return;
      lastVisible = visible;
      form.dispatchEvent(new CustomEvent("academy-request-form:visible", { bubbles: true, detail: { visible } }));
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          onScreen = entry.isIntersecting;
          const half = entry.intersectionRatio >= 0.5 ||
            (entry.rootBounds && entry.intersectionRect.height >= entry.rootBounds.height * 0.5);
          if (!viewSent && half) {
            viewSent = true;
            reachGoal(form, "form_view", goalParams());
          }
        });
        emitVisible();
      }, { threshold: [0, 0.25, 0.5] });
      observer.observe(form);
      cleanups.push(() => observer.disconnect());
    }

    listen(form, "focusin", () => {
      focused = true;
      emitVisible();
    });
    listen(form, "focusout", () => {
      window.setTimeout(() => {
        focused = form.contains(document.activeElement);
        emitVisible();
      }, 0);
    });

    /* Отправка */

    const setBusy = (value) => {
      busy = value;
      form.setAttribute("aria-busy", String(value));
      submit?.setAttribute("aria-busy", String(value));
      submit?.setAttribute("aria-disabled", String(value));
      if (!value) window.clearTimeout(slowTimer);
    };

    const showSuccess = () => {
      const payload = submittedPayload;
      setBusy(false);
      submittedForm = null;
      setSummary();
      hideHelp();
      if (successText) {
        successText.textContent = successMessage({
          mode,
          messenger: payload?.messenger,
          contact: payload?.messenger === "max" ? payload.phoneDisplay : payload?.messengerContact,
          email: payload?.email,
          hour: moscowHour(),
          from: hoursFrom,
          to: hoursTo,
          custom: form.dataset.successText,
        });
      }
      contentParts.forEach((part) => {
        part.hidden = true;
      });
      if (successView) successView.hidden = false;
      form.dataset.state = "success";
      if (section && successHeading?.id) section.setAttribute("aria-labelledby", successHeading.id);
      clearDraft();
      reachGoal(form, "form_success", { mode, contact: payload?.messenger || "email" });
      window.requestAnimationFrame(() => (successHeading || successView)?.focus({ preventScroll: false }));
    };

    const showDeliveryError = (message) => {
      submittedForm = null;
      setBusy(false);
      setSummary(message, "error");
      showHelp(message);
    };

    const eventForm = (event, jqueryForm) => {
      if (jqueryForm instanceof HTMLFormElement) return jqueryForm;
      if (jqueryForm?.[0] instanceof HTMLFormElement) return jqueryForm[0];
      if (event?.detail?.form instanceof HTMLFormElement) return event.detail.form;
      if (event?.detail instanceof HTMLFormElement) return event.detail;
      return event?.target instanceof HTMLFormElement ? event.target : null;
    };

    // Успех показываем только по событию той же нативной формы, которую отправили
    const onTildaSuccess = (event, jqueryForm) => {
      if (submittedForm && eventForm(event, jqueryForm) === submittedForm) showSuccess();
    };
    const onTildaError = (event, jqueryForm) => {
      if (submittedForm && eventForm(event, jqueryForm) === submittedForm) showDeliveryError(TEXT.sendFailed);
    };

    listen(document, "tildaform:aftersuccess", onTildaSuccess);
    listen(document, "tildaform:aftererror", onTildaError);
    const jqueryNamespace = `.academyRequestForm${controllers.length}`;
    if (typeof window.jQuery === "function") {
      window.jQuery(document).on(`tildaform:aftersuccess${jqueryNamespace}`, onTildaSuccess);
      window.jQuery(document).on(`tildaform:aftererror${jqueryNamespace}`, onTildaError);
      cleanups.push(() => window.jQuery(document).off(jqueryNamespace));
    }

    // Пока открыта CAPTCHA Тильды, это не ошибка и не долгая отправка: ждём дальше
    const watchSlowDelivery = (nativeForm) => {
      window.clearTimeout(slowTimer);
      slowTimer = window.setTimeout(() => {
        if (!busy || submittedForm !== nativeForm) return;
        if (captchaOpen()) {
          watchSlowDelivery(nativeForm);
          return;
        }
        showHelp(TEXT.slow);
      }, SLOW_DELIVERY_MS);
    };

    let submittedPayload = null;

    const handleSubmit = async (event) => {
      event.preventDefault();
      if (busy) return;

      if (telegramInput && isActive(telegramInput) && !telegramMessage(telegramInput.value)) {
        telegramInput.value = `@${normalizeTelegram(telegramInput.value)}`;
      }
      const list = activeInputs();
      const invalid = list.filter((input) => {
        const message = messageFor(input);
        showFieldError(input, message);
        return Boolean(message);
      });
      if (invalid.length) {
        setSummary(`Проверьте ${invalid.length} ${fieldsWord(invalid.length)}`, "invalid");
        invalid[0].focus({ preventScroll: true });
        const smooth = !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        invalid[0].scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
        return;
      }

      const phone = phoneE164();
      const messenger = messengerInputs.length ? selectedMessenger() : null;
      const payload = {
        name: normalizeName(nameInput.value),
        email: emailInput ? emailInput.value.trim() : null,
        phone,
        phoneDisplay: phoneDisplay(),
        messenger,
        messengerContact: messenger === "telegram" ? `@${normalizeTelegram(telegramInput.value)}` : messenger === "max" ? phone : "",
      };
      submittedPayload = payload;
      reachGoal(form, "form_submit", { mode, contact: messenger || "email" });

      setSummary(TEXT.sending, "loading");
      hideHelp();
      setBusy(true);

      const nativeForm = hideTildaFormRecord(formName);
      if (!(nativeForm instanceof HTMLFormElement)) {
        showDeliveryError(TEXT.unavailable);
        return;
      }

      const extras = [];
      if (form.dataset.source) extras.push(["form_source", form.dataset.source, "replace"]);
      if (form.dataset.deviceField) extras.push([form.dataset.deviceField, device, form.dataset.deviceMode || "append"]);
      // Номер посетителя Метрики, как в прежних формах: по нему заявку связывают с визитом
      extras.push(["ym_client_id", readCookie("_ym_uid"), "replace"]);

      try {
        await syncTildaForm(nativeForm, payload, extras);
        if (disposed) return;
        submittedForm = nativeForm;
        const nativeSubmit = nativeForm.querySelector('button[type="submit"], input[type="submit"]');
        if (nativeSubmit instanceof HTMLElement) nativeForm.requestSubmit(nativeSubmit);
        else nativeForm.requestSubmit();
        await nextFrame();
        // Нативная проверка Тильды не пропустила поля: событие не придёт, выходим из ожидания
        if (submittedForm === nativeForm && nativeForm.querySelector(".js-error-control-box")) {
          showDeliveryError(TEXT.sendFailed);
          return;
        }
        if (submittedForm === nativeForm) watchSlowDelivery(nativeForm);
      } catch (error) {
        if (error instanceof ContractError) {
          console.error(`Форма заявки «${formName}»: нативная форма Тильды не совпадает с контрактом: ${error.message}`);
        }
        showDeliveryError(TEXT.sendFailed);
      }
    };

    listen(form, "submit", handleSubmit);

    /* Начальное состояние */

    const draft = readDraft();
    if (draft) {
      if (nameInput && draft.name) nameInput.value = draft.name;
      if (emailInput && draft.email) emailInput.value = draft.email;
      if (draft.phone) setOwnPhone(draft.phone);
      const savedMessenger = messengerInputs.find((input) => input.value === draft.messenger);
      if (savedMessenger) savedMessenger.checked = true;
      if (telegramInput && draft.telegram) telegramInput.value = draft.telegram;
    }
    renderMessenger();
    if (submit) submit.disabled = false;
    loadTildaMask().then((ready) => {
      if (ready) startTildaMask();
    });
    if (formName) watchedNames.add(formName);
    hideTildaFormRecord(formName);

    return {
      formName,
      onDiscoveryEnd() {
        if (IS_PRODUCTION && !findTildaForm(formName) && form.dataset.state !== "success") showHelp(TEXT.noNative);
      },
      cleanup() {
        disposed = true;
        submittedForm = null;
        window.clearTimeout(slowTimer);
        cleanups.forEach((release) => release());
      },
    };
  };

  /* ---------- Поиск нативных форм, которые Тильда дорисовывает позже ---------- */

  const hideKnownForms = () => {
    watchedNames.forEach(hideTildaFormRecord);
    if (watchedNames.size && [...watchedNames].every(findTildaForm)) finishDiscovery();
  };

  const observer = new MutationObserver(hideKnownForms);
  let discoveryTimer = 0;
  let discoveryDone = false;

  function finishDiscovery() {
    if (discoveryDone) return;
    discoveryDone = true;
    observer.disconnect();
    window.clearTimeout(discoveryTimer);
    controllers.forEach((controller) => controller.onDiscoveryEnd());
  }

  forms.forEach((form) => controllers.push(setupForm(form)));
  observer.observe(document.body, { childList: true, subtree: true });
  discoveryTimer = window.setTimeout(finishDiscovery, DISCOVERY_MS);
  hideKnownForms();

  window.__academyRequestFormCleanup = () => {
    observer.disconnect();
    window.clearTimeout(discoveryTimer);
    controllers.forEach((controller) => controller.cleanup());
    window.__academyRequestFormCleanup = undefined;
  };
})();

/* === business-consulting/page.js === */
/* Блок «Стоимость обучения» лендинга «Корпоративное консультирование для психологов» и данные потока из CMS
   (дата старта и расписание занятий в первом экране, программе и форме).
   Подача «Одна цифра» из витрины /pricing-scenarios (утверждена 12.10.2026): одна горизонтальная карточка,
   слева курс и цена, справа «Что входит». Цена, зачёркнутая цена, жёлтый купон курса месяца, платёж в месяц
   и дата старта приходят из CMS через Public API.

   Одна функция рисует карточку и при сборке (build.mjs берёт отсюда BusinessConsultingPrice и вшивает
   снимок цены в страницу), и в браузере: после загрузки страница один раз спрашивает API и, если цена
   изменилась, перерисовывает карточку, дату старта и цену в микроразметке. API не ответил — остаётся снимок.
   Править здесь можно тексты подписей; правила цен — из docs/tilda-pricing-block.md и правил продаж Дарьи:
   крупно цена продажи, зачёркнутая только при акции, купон «−10 % до 31 октября» без слов «Курс месяца»,
   рассрочка тихой строкой, повышение отдельной серой плашкой, кнопок в блоке нет. */
(function () {
  var NBSP = ' ';
  var MINUS = '−';
  var OPEN = ['Идет набор', 'Идёт набор', 'Последний шанс', 'Старт в любое время'];
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  // Часы из каталога CMS с правильным окончанием: 81 академический час, 72 академических часа, 58 академических часов.
  function hoursPhrase(n) {
    var m10 = n % 10, m100 = n % 100;
    var word = m10 === 1 && m100 !== 11 ? 'академический час' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'академических часа' : 'академических часов';
    return n + NBSP + word;
  }
  // Строка с {hours} (например, «{hours} живых занятий») — в span с шаблоном, чтобы её можно было обновить из CMS.
  function withHours(item, hours) {
    if (item.indexOf('{hours}') === -1) return esc(item);
    return '<span data-cms-hours="' + esc(item) + '">' + esc(item.replace('{hours}', hours ? hoursPhrase(hours) : '')) + '</span>';
  }

  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  var digits = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP); };
  var rub = function (n) { return digits(n) + NBSP + '₽'; };
  // Дата из CMS («2026-11-18» или ISO-время) → «18 ноября» по московскому времени.
  function dayMonth(value) {
    if (!value) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    var d = m ? {day: Number(m[3]), month: Number(m[2]) - 1} : null;
    if (!d) {
      var t = new Date(new Date(value).getTime() + 3 * 3600 * 1000);
      if (isNaN(t)) return '';
      d = {day: t.getUTCDate(), month: t.getUTCMonth()};
    }
    return d.day + NBSP + MONTHS[d.month];
  }

  /* Расписание потока из CMS: «По средам 18:00–21:00» и дни занятий ["Среда"] →
     {days: «По средам», time: «18:00–21:00», short: «Ср, 18:00–21:00»}. Время не рвётся на тире. */
  var SHORT_DAYS = {'Понедельник': 'Пн', 'Вторник': 'Вт', 'Среда': 'Ср', 'Четверг': 'Чт', 'Пятница': 'Пт', 'Суббота': 'Сб', 'Воскресенье': 'Вс'};
  function splitSchedule(schedule, lessonDays) {
    var m = /^(.*?)[,\s]*(\d{1,2}:\d{2}\s*[–—-]\s*\d{1,2}:\d{2})\s*$/.exec(schedule || '');
    if (!m) return null;
    var time = m[2].replace(/\s*[–—-]\s*/, '\u2060–\u2060');
    var days = m[1].trim();
    var short = (lessonDays || []).map(function (d) { return SHORT_DAYS[d] || d; }).join(', ');
    return {days: days, time: time, short: short ? short + ', ' + time : days + ' ' + time};
  }

  /* Ответ /api/public/course/:slug → то, что нужно карточке. Берётся ближайший открытый поток.
     Открытых нет (курс в листе ожидания) — берётся ближайший поток ради даты старта, а waiting: true говорит
     микроразметке, что продажи нет и цену в неё писать нельзя. */
  function fromApi(course) {
    if (!course) return null;
    var open = (course.streams || []).filter(function (s) { return OPEN.indexOf(s.status) !== -1; })
      .sort(function (a, b) { return new Date(a.startDate || 0) - new Date(b.startDate || 0); });
    var stream = open[0] || course.nearestStream;
    var p = stream && stream.pricing;
    if (!p || p.hasTariffs) return null;
    var sale = p.fullPaymentPrice != null ? p.fullPaymentPrice : p.currentPrice;
    if (sale == null) return null;
    var before = p.fullPaymentPrice != null ? p.fullPaymentPriceBeforeDiscount : p.priceBeforeDiscount;
    var promo = course.promo && course.promo.active ? course.promo : null;
    var next = p.nextPriceChange && p.nextPriceChange.at ? p.nextPriceChange : null;
    return {
      waiting: !open.length,
      sale: sale,
      // Зачёркнутая цена — только при акции.
      was: promo && before != null && before > sale ? before : null,
      promo: promo ? {percent: promo.discountPercent, until: dayMonth(promo.until), label: promo.label || 'Курс месяца'} : null,
      // Платёж в месяц: из CMS, иначе по правилу каталога — цена ÷ 24.
      perMonth: p.installmentPerMonth || (sale > 0 ? Math.round(sale / 24) : null),
      months: p.installmentPerMonth ? p.installmentMonths : 24,
      start: dayMonth(stream.startDate),
      startDate: stream.startDate || null,
      schedule: splitSchedule(stream.schedule, stream.lessonDays),
      next: next ? {label: dayMonth(next.at), price: next.fullPaymentPrice != null ? next.fullPaymentPrice : next.price} : null,
    };
  }

  var ICON_CHECK = '<svg class="price-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_RISE = '<svg class="price-rise_icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M3 17l6-6 4 4 8-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 7h6v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // Подпись снимка: если в API те же цифры, карточку не перерисовываем.
  function signature(m) {
    return [m.sale, m.was, m.perMonth, m.months, m.start, m.promo ? m.promo.percent + '/' + m.promo.until : '', m.next ? m.next.label + '/' + m.next.price : ''].join('|');
  }

  /* Карточка цены. text — тексты из data/pricing.json (уже с неразрывными пробелами), model — fromApi. */
  function render(model, text) {
    var sticker = model.promo
      ? '<span class="price-sticker_component"><span class="price-sticker_coupon"><span class="screen-reader-text">' + esc(model.promo.label) + ': </span><span class="price-sticker_value">' + MINUS + model.promo.percent + NBSP + '%</span><span class="price-sticker_until">до ' + esc(model.promo.until) + '</span></span></span>'
      : '';
    var was = model.was != null
      ? '<span class="price-tag_was"><s class="price-old"><span class="screen-reader-text">вместо </span>' + rub(model.was) + '</s></span>'
      : '';
    var price = model.sale === 0
      ? '<p class="price-tag"><span class="price-tag_number">Бесплатно</span></p>'
      : '<p class="price-tag"><span class="price-tag_number">' + digits(model.sale) + '</span><span class="price-tag_unit">₽</span>' + was + '</p>';
    var lines = [];
    if (model.was != null) lines.push('<b class="price-caption_benefit">выгода ' + rub(model.was - model.sale) + '</b> по акции');
    if (model.perMonth) lines.push('или ' + rub(model.perMonth) + '/мес в рассрочку на ' + model.months + NBSP + 'мес');
    var caption = lines.length ? '<p class="price-caption">' + lines.map(function (l) { return '<span class="price-caption_line">' + l + '</span>'; }).join('') + '</p>' : '';
    var rise = '';
    if (model.next && model.next.price > model.sale) {
      rise = '<div class="price-wide_foot"><p class="price-rise">' + ICON_RISE + '<span class="price-rise_text"><span class="price-rise_title">С ' + esc(model.next.label) + ': ' + rub(model.next.price) + '</span><span class="price-rise_note">подорожает на ' + rub(model.next.price - model.sale) + '</span></span></p></div>';
    }
    var includes = '<ul class="price-check" role="list">' + text.includes.map(function (item) { return '<li class="price-check_item">' + ICON_CHECK + '<span>' + withHours(item, text.hours) + '</span></li>'; }).join('') + '</ul>';
    return '<div class="price-wide_component" data-price-card="' + esc(signature(model)) + '">' + sticker
      + '<div class="price-wide_main"><span class="price-wide_chip">' + esc(text.chip) + '</span>'
      + '<div class="price-wide_title"><p class="price-wide_name">' + esc(text.title) + '</p>' + (model.start ? '<p class="price-wide_sub">старт ' + esc(model.start) + '</p>' : '') + '</div>'
      + '<div class="price-wide_money">' + price + caption + rise + '</div></div>'
      + '<div class="price-wide_side"><p class="price-wide_side-title">' + esc(text.sideTitle) + '</p>' + includes + '</div>'
      + '</div>';
  }

  var api = {fromApi: fromApi, render: render, dayMonth: dayMonth, splitSchedule: splitSchedule, hoursPhrase: hoursPhrase};
  globalThis.BusinessConsultingPrice = api;
  if (typeof document === 'undefined') return;

  /* В браузере: один запрос к API. Карточка перерисовывается, только если разметка изменилась.
     На сайте вместо этой карточки стоит общий блок цены из генератора /pricing (data-price-auto, 28.10.2026):
     он сам рисует цену или лист ожидания. Тогда адрес API и курс берутся из него, а здесь обновляются
     только дата старта, расписание, часы и микроразметка. */
  var root = document.querySelector('[data-price-block]') || document.querySelector('[data-price-auto][data-course][data-api]');
  if (!root || !window.fetch) return;
  var text = null;
  if (root.hasAttribute('data-price-text')) {
    try { text = JSON.parse(root.getAttribute('data-price-text')); } catch (error) { text = null; }
  }
  var url = root.getAttribute('data-api') + '/api/public/course/' + root.getAttribute('data-course');
  fetch(url, {headers: {Accept: 'application/json'}})
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (course) {
      var model = fromApi(course);
      if (!model) return;
      var card = text && root.querySelector('[data-price-card]');
      if (card && card.getAttribute('data-price-card') !== signature(model)) card.outerHTML = render(model, text);
      // Дата старта в первом экране, программе и форме заявки. Курс в листе ожидания — вместо даты
      // «Лист ожидания» (текст в data-cms-waitlist, в data/hero.json и data/program.json); в программе
      // подпись «Старт» (data-cms-label) тоже меняется, а дата становится пустой и прячется.
      document.querySelectorAll('[data-cms-start], [data-cms-label]').forEach(function (el) {
        if (model.waiting && el.hasAttribute('data-cms-waitlist')) el.textContent = el.getAttribute('data-cms-waitlist');
        else if (model.waiting) return;
        else if (el.hasAttribute('data-cms-label')) el.textContent = el.getAttribute('data-cms-label');
        else if (model.start) el.textContent = el.getAttribute('data-cms-start').replace('{date}', model.start);
      });
      // Расписание: дни и время в программе, короткая плитка в первом экране.
      if (model.schedule) {
        var put = function (selector, value) { document.querySelectorAll(selector).forEach(function (el) { el.textContent = value; }); };
        put('[data-cms-schedule-days]', model.schedule.days);
        put('[data-cms-schedule-time]', model.schedule.time);
        put('[data-cms-schedule-short]', model.schedule.short);
      }
      // Цена в микроразметке совпадает с ценой на странице. В листе ожидания цены на странице нет,
      // поэтому цена из разметки уходит, а поток с датой старта остаётся. Набор открылся — цена возвращается.
      document.querySelectorAll('script[type="application/ld+json"][data-course-ld]').forEach(function (el) {
        try {
          var ld = JSON.parse(el.textContent);
          if (model.waiting) {
            delete ld.offers;
          } else {
            if (!ld.offers) ld.offers = {'@type': 'Offer', priceCurrency: 'RUB', availability: 'https://schema.org/InStock', url: ld.url};
            ld.offers.price = String(model.sale);
            if (model.promo && course.promo.until) ld.offers.priceValidUntil = course.promo.until; else delete ld.offers.priceValidUntil;
          }
          if (ld.hasCourseInstance && model.startDate) ld.hasCourseInstance.startDate = model.startDate;
          el.textContent = JSON.stringify(ld);
        } catch (error) { /* разметка не тронута */ }
      });
    })
    .catch(function () { /* API недоступен — на странице остаётся снимок цены со сборки */ });

  /* Объём курса в академических часах — из каталога CMS (в ответе курса его нет): «кубик» под первым экраном
     и строка «Что входит» в карточке цены. Каталог не ответил — остаются часы со сборки. */
  fetch(root.getAttribute('data-api') + '/api/public/catalog', {headers: {Accept: 'application/json'}})
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (catalog) {
      var slug = root.getAttribute('data-course');
      var found = null;
      (function walk(o) {
        if (found || !o || typeof o !== 'object') return;
        if (Array.isArray(o)) { o.forEach(walk); return; }
        if (o.slug === slug && o.hours) { found = o; return; }
        Object.keys(o).forEach(function (k) { walk(o[k]); });
      })(catalog);
      var hours = found && Number(found.hours);
      if (!hours) return;
      if (text) text.hours = hours;
      document.querySelectorAll('[data-cms-hours]').forEach(function (el) {
        el.textContent = el.getAttribute('data-cms-hours').replace('{hours}', hoursPhrase(hours));
      });
    })
    .catch(function () { /* каталог недоступен — часы со сборки */ });
})();

/* Вкладки блока «Как вы будете учиться». Выбранная вкладка показывает свой текст и свою схему; схема начинается
   с начала цикла. Клавиатура: стрелки вверх/вниз и влево/вправо, Home, End. Без скрипта видны все тексты и схемы.
   Повторный запуск снимает прошлые обработчики (Тильда может перезапустить скрипты). */
(function () {
  if (typeof document === 'undefined') return;
  if (window.__businessConsultingLearningCleanup) window.__businessConsultingLearningCleanup();
  var controller = new AbortController();
  var signal = controller.signal;
  var blocks = Array.prototype.slice.call(document.querySelectorAll('[data-learning-tabs]'));
  if (!blocks.length) return;

  blocks.forEach(function (block) {
    var tabs = Array.prototype.slice.call(block.querySelectorAll('[data-learning-tab]'));
    var panels = Array.prototype.slice.call(block.querySelectorAll('[data-learning-panel]'));
    var scenes = Array.prototype.slice.call(block.querySelectorAll('[data-learning-scene]'));
    if (!tabs.length || tabs.length !== panels.length || tabs.length !== scenes.length) return;

    var select = function (index, focus) {
      tabs.forEach(function (tab, i) {
        var active = i === index;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        panels[i].hidden = !active;
        scenes[i].hidden = !active;
      });
      if (scenes[index].getAnimations) scenes[index].getAnimations({subtree: true}).forEach(function (animation) { animation.currentTime = 0; });
      if (focus) tabs[index].focus();
    };

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); }, {signal: signal});
      tab.addEventListener('keydown', function (event) {
        var last = tabs.length - 1;
        var next = {ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: last}[event.key];
        if (next === undefined) return;
        event.preventDefault();
        select((next + tabs.length) % tabs.length, true);
      }, {signal: signal});
    });
    var current = tabs.findIndex(function (tab) { return tab.getAttribute('aria-selected') === 'true'; });
    select(Math.max(0, current), false);
  });

  window.__businessConsultingLearningCleanup = function () {
    controller.abort();
    blocks.forEach(function (block) { block.querySelectorAll('[data-learning-panel], [data-learning-scene]').forEach(function (item) { item.hidden = false; }); });
    delete window.__businessConsultingLearningCleanup;
  };
})();
