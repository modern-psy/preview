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
