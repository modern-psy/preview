(() => {
  const page = document.querySelector(".page-wrapper");

  if (!page) return;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const dialogueMobileQuery = window.matchMedia("(max-width: 47.9375rem)");
  const documentRoot = document.documentElement;

  if (typeof window.__psychologistAnchorScrollCleanup === "function") {
    window.__psychologistAnchorScrollCleanup();
  }

  let anchorScrollFrame = 0;
  let anchorScrollInitialBehavior = "";
  let anchorScrollInterrupted = false;
  const anchorScrollInterruptEvents = ["wheel", "touchstart", "keydown"];

  const restoreAnchorScrollBehavior = () => {
    documentRoot.style.scrollBehavior = anchorScrollInitialBehavior;
  };

  const removeAnchorScrollInterrupts = () => {
    anchorScrollInterruptEvents.forEach((eventName) => {
      window.removeEventListener(eventName, cancelAnchorScroll);
    });
  };

  const cancelAnchorScroll = () => {
    anchorScrollInterrupted = true;

    if (anchorScrollFrame) {
      window.cancelAnimationFrame(anchorScrollFrame);
      anchorScrollFrame = 0;
    }

    removeAnchorScrollInterrupts();
    restoreAnchorScrollBehavior();
  };

  const handleAnchorClick = (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !(event.target instanceof Element)
    ) {
      return;
    }

    const link = event.target.closest('a[href^="#"]:not(.skip-link)');
    const hash = link?.getAttribute("href");

    if (!link || !hash || hash === "#") {
      return;
    }

    const target = document.getElementById(hash.slice(1));

    if (!target) {
      return;
    }

    event.preventDefault();
    cancelAnchorScroll();

    const scrollMarginTop =
      Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
    const startY = window.scrollY;
    const targetY = Math.max(
      0,
      target.getBoundingClientRect().top + startY - scrollMarginTop,
    );
    const distance = targetY - startY;

    if (window.location.hash === hash) {
      window.history.replaceState(null, "", hash);
    } else {
      window.history.pushState(null, "", hash);
    }

    anchorScrollInitialBehavior = documentRoot.style.scrollBehavior;
    documentRoot.style.scrollBehavior = "auto";

    if (reducedMotionQuery.matches || Math.abs(distance) < 1) {
      window.scrollTo(0, targetY);
      restoreAnchorScrollBehavior();
      return;
    }

    const duration = Math.min(900, Math.max(480, Math.abs(distance) * 0.28));
    const startTime = performance.now();
    anchorScrollInterrupted = false;

    anchorScrollInterruptEvents.forEach((eventName) => {
      window.addEventListener(eventName, cancelAnchorScroll, { passive: true });
    });

    const renderAnchorScroll = (currentTime) => {
      const progress = Math.min(1, (currentTime - startTime) / duration);
      const easedProgress = 1 - (1 - progress) ** 3;

      window.scrollTo(0, startY + distance * easedProgress);

      if (progress < 1 && !anchorScrollInterrupted) {
        anchorScrollFrame = window.requestAnimationFrame(renderAnchorScroll);
        return;
      }

      anchorScrollFrame = 0;
      removeAnchorScrollInterrupts();
      restoreAnchorScrollBehavior();
    };

    anchorScrollFrame = window.requestAnimationFrame(renderAnchorScroll);
  };

  page.addEventListener("click", handleAnchorClick);
  window.__psychologistAnchorScrollCleanup = () => {
    page.removeEventListener("click", handleAnchorClick);
    cancelAnchorScroll();
  };

  const floatingNav = page.querySelector("[data-floating-nav]");
  const floatingNavStart = page.querySelector("#audience");
  const floatingNavEnd = page.querySelector("#register");
  const floatingNavRegistration = page.querySelector("[data-floating-nav-registration]");

  if (
    floatingNav &&
    floatingNavStart &&
    floatingNavEnd &&
    floatingNavRegistration &&
    floatingNav.dataset.floatingNavInitialized !== "true"
  ) {
    floatingNav.dataset.floatingNavInitialized = "true";
    let floatingNavFrame = 0;

    const renderFloatingNav = () => {
      floatingNavFrame = 0;
      const topOffset = Number.parseFloat(window.getComputedStyle(floatingNav).top) || 0;
      const revealPoint = topOffset + floatingNav.offsetHeight / 2;
      const hasReachedRegistration =
        floatingNavEnd.getBoundingClientRect().top <= window.innerHeight;
      const shouldShowRegistration =
        floatingNavStart.getBoundingClientRect().top <= revealPoint &&
        !hasReachedRegistration;

      floatingNav.classList.toggle("is-registration-visible", shouldShowRegistration);
      floatingNavRegistration.setAttribute("aria-hidden", String(!shouldShowRegistration));
      floatingNavRegistration.tabIndex = shouldShowRegistration ? 0 : -1;
    };

    const requestFloatingNavRender = () => {
      if (floatingNavFrame) return;
      floatingNavFrame = window.requestAnimationFrame(renderFloatingNav);
    };

    window.addEventListener("scroll", requestFloatingNavRender, { passive: true });
    window.addEventListener("resize", requestFloatingNavRender, { passive: true });
    requestFloatingNavRender();

    window.addEventListener(
      "pagehide",
      () => {
        window.cancelAnimationFrame(floatingNavFrame);
        window.removeEventListener("scroll", requestFloatingNavRender);
        window.removeEventListener("resize", requestFloatingNavRender);
      },
      { once: true },
    );
  }

  const heroVideos = Array.from(page.querySelectorAll("[data-hero-video]"));

  heroVideos.forEach((video) => {
    if (video.dataset.heroVideoInitialized === "true") return;

    const sources = (video.dataset.videoSources || "").split("|").filter(Boolean);

    if (!sources.length) return;

    video.dataset.heroVideoInitialized = "true";
    video.muted = true;
    let sourceIndex = Math.max(sources.indexOf(video.getAttribute("src") || ""), 0);
    let isInViewport = false;

    const syncPlayback = () => {
      if (reducedMotionQuery.matches || !isInViewport || document.hidden) {
        video.pause();
        return;
      }

      video.play().catch(() => {});
    };

    const showNextVideo = () => {
      sourceIndex = (sourceIndex + 1) % sources.length;
      video.src = sources[sourceIndex];

      video.load();
      syncPlayback();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        isInViewport = entries.some((entry) => entry.isIntersecting);
        syncPlayback();
      },
      { threshold: 0.1 },
    );

    const handleVisibilityChange = () => syncPlayback();
    const handleMotionChange = () => syncPlayback();

    video.addEventListener("ended", showNextVideo);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    reducedMotionQuery.addEventListener("change", handleMotionChange);
    observer.observe(video.closest(".hero_event") || video);

    window.addEventListener(
      "pagehide",
      () => {
        observer.disconnect();
        video.pause();
        video.removeEventListener("ended", showNextVideo);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        reducedMotionQuery.removeEventListener("change", handleMotionChange);
      },
      { once: true },
    );
  });

  const horizontalSections = Array.from(page.querySelectorAll("[data-horizontal-section]"));

  horizontalSections.forEach((section) => {
    if (section.dataset.horizontalInitialized === "true") return;

    const shell = section.querySelector("[data-horizontal-shell]");
    const sticky = section.querySelector("[data-horizontal-sticky]");
    const viewport = section.querySelector("[data-horizontal-viewport]");
    const track = section.querySelector("[data-horizontal-track]");

    if (!shell || !sticky || !viewport || !track) return;

    section.dataset.horizontalInitialized = "true";

    let scrollFrame = 0;
    let measureFrame = 0;
    let horizontalDistance = 0;
    let shellTop = 0;
    let scrollRange = 1;
    let isScrollDriven = false;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const render = () => {
      scrollFrame = 0;

      if (!isScrollDriven) {
        section.style.setProperty("--dialogue-scroll-offset", "0px");
        return;
      }

      const progress = clamp((window.scrollY - shellTop) / scrollRange, 0, 1);
      section.style.setProperty(
        "--dialogue-scroll-offset",
        `${horizontalDistance * progress}px`,
      );
    };

    const requestRender = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(render);
    };

    const measure = () => {
      measureFrame = 0;
      horizontalDistance = Math.max(track.scrollWidth - viewport.clientWidth, 0);
      isScrollDriven =
        !dialogueMobileQuery.matches &&
        !reducedMotionQuery.matches &&
        window.innerHeight >= 620 &&
        horizontalDistance > 1;

      section.classList.toggle("is-scroll-driven", isScrollDriven);
      viewport.tabIndex = isScrollDriven || dialogueMobileQuery.matches ? -1 : 0;
      shell.style.setProperty(
        "--dialogue-scroll-distance",
        isScrollDriven ? `${horizontalDistance}px` : "0px",
      );

      if (isScrollDriven) {
        shell.style.setProperty("--dialogue-sticky-height", `${sticky.offsetHeight}px`);
      } else {
        shell.style.removeProperty("--dialogue-sticky-height");
      }

      const shellRect = shell.getBoundingClientRect();
      shellTop = shellRect.top + window.scrollY;
      scrollRange = Math.max(shell.offsetHeight - sticky.offsetHeight, 1);
      render();
    };

    const requestMeasure = () => {
      if (measureFrame) return;
      measureFrame = window.requestAnimationFrame(measure);
    };

    const resizeObserver =
      "ResizeObserver" in window ? new ResizeObserver(requestMeasure) : null;

    resizeObserver?.observe(viewport);
    resizeObserver?.observe(track);
    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", requestMeasure, { passive: true });
    dialogueMobileQuery.addEventListener("change", requestMeasure);
    reducedMotionQuery.addEventListener("change", requestMeasure);

    if (document.fonts?.ready) {
      document.fonts.ready.then(requestMeasure);
    }

    requestMeasure();

    window.addEventListener(
      "pagehide",
      () => {
        window.cancelAnimationFrame(scrollFrame);
        window.cancelAnimationFrame(measureFrame);
        resizeObserver?.disconnect();
        window.removeEventListener("scroll", requestRender);
        window.removeEventListener("resize", requestMeasure);
        dialogueMobileQuery.removeEventListener("change", requestMeasure);
        reducedMotionQuery.removeEventListener("change", requestMeasure);
      },
      { once: true },
    );
  });

  const items = Array.from(page.querySelectorAll("[data-accordion-item]"));

  const setOpen = (item, shouldOpen) => {
    const question = item.querySelector(".faq_question");
    const answer = item.querySelector(".faq_answer");

    if (!question || !answer) return;

    item.classList.toggle("is-open", shouldOpen);
    question.setAttribute("aria-expanded", String(shouldOpen));
    answer.setAttribute("aria-hidden", String(!shouldOpen));
  };

  items.forEach((item) => {
    if (item.dataset.accordionInitialized === "true") return;

    item.dataset.accordionInitialized = "true";
    setOpen(item, item.classList.contains("is-open"));

    item.addEventListener("click", (event) => {
      if (event.target.closest("a, input, textarea, select")) return;

      const shouldOpen = !item.classList.contains("is-open");

      items.forEach((otherItem) => {
        setOpen(otherItem, otherItem === item && shouldOpen);
      });
    });
  });

  const gridComponents = Array.from(
    page.querySelectorAll("[data-cta-grid], [data-interactive-grid]"),
  );
  const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const touchPointerQuery = window.matchMedia("(hover: none), (pointer: coarse)");
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

  gridComponents.forEach((component) => {
    if (component.dataset.interactiveGridInitialized === "true") return;

    const stage = component.querySelector(
      "[data-cta-grid-stage], [data-interactive-grid-stage]",
    );
    const highlightLayer = component.querySelector("[data-cta-grid-highlights]");
    const cometLayer = component.querySelector("[data-cta-comet-layer]");

    if (!stage || !highlightLayer) return;

    component.dataset.interactiveGridInitialized = "true";

    const cells = new Map();
    const isFluidGrid = stage.dataset.gridFluid === "true";
    const gridCellSize = Number.parseFloat(stage.dataset.gridCellSize || "100");
    const gridOrigin = {
      x: Number.parseFloat(stage.dataset.gridOriginX || (isFluidGrid ? "0" : "82")),
      y: Number.parseFloat(stage.dataset.gridOriginY || (isFluidGrid ? "0" : "64")),
    };
    const gridColumns = {
      min: Number.parseInt(stage.dataset.gridColumnMin || (isFluidGrid ? "0" : "-1"), 10),
      max: Number.parseInt(stage.dataset.gridColumnMax || "11", 10),
    };
    const gridRows = {
      min: Number.parseInt(stage.dataset.gridRowMin || (isFluidGrid ? "0" : "-1"), 10),
      max: Number.parseInt(stage.dataset.gridRowMax || "2", 10),
    };
    let activeCellKey = "";
    let pointerFrame = 0;
    let resizeFrame = 0;
    let latestPointer = null;
    let isInViewport = false;
    let cometTimer = 0;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const isTouchGridMode = () =>
      touchPointerQuery.matches || !finePointerQuery.matches;

    const clearHighlights = () => {
      cells.forEach((cell) =>
        cell.classList.remove(
          "is-muted",
          "is-medium",
          "is-bright",
          "is-touch-static",
        ),
      );
      activeCellKey = "";
    };

    const buildCells = () => {
      clearHighlights();
      highlightLayer.replaceChildren();
      cells.clear();

      if (isFluidGrid) {
        gridColumns.max = Math.max(
          gridColumns.min,
          Math.ceil((stage.clientWidth - gridOrigin.x) / gridCellSize) - 1,
        );
        gridRows.max = Math.max(
          gridRows.min,
          Math.ceil((stage.clientHeight - gridOrigin.y) / gridCellSize) - 1,
        );
      }

      for (let row = gridRows.min; row <= gridRows.max; row += 1) {
        for (let column = gridColumns.min; column <= gridColumns.max; column += 1) {
          const cell = document.createElement("span");
          const key = `${column}:${row}`;

          cell.className = "interactive-grid_cell";
          cell.style.setProperty("--grid-cell-x", `${gridOrigin.x + column * gridCellSize}px`);
          cell.style.setProperty("--grid-cell-y", `${gridOrigin.y + row * gridCellSize}px`);
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
            const centerX = stageRect.left + gridOrigin.x + column * gridCellSize + gridCellSize / 2;
            const centerY = stageRect.top + gridOrigin.y + row * gridCellSize + gridCellSize / 2;

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

      return insetCandidates.length >= 4
        ? insetCandidates
        : collectCandidates(0, 0);
    };

    const applyTouchHighlights = () => {
      clearHighlights();
      component.dataset.gridInputMode = "touch-static";

      if (!isTouchGridMode() || reducedMotionQuery.matches) {
        component.dataset.gridInputMode = reducedMotionQuery.matches
          ? "reduced-motion"
          : "fine";
        return;
      }

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

    buildCells();
    applyTouchHighlights();

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

      const availableOffsets = neighborOffsets
        .filter(
          (offset) =>
            column + offset.column >= gridColumns.min &&
            column + offset.column <= gridColumns.max &&
            row + offset.row >= gridRows.min &&
            row + offset.row <= gridRows.max,
        );
      const cornerPairs = [];

      for (let firstIndex = 0; firstIndex < availableOffsets.length; firstIndex += 1) {
        for (let secondIndex = firstIndex + 1; secondIndex < availableOffsets.length; secondIndex += 1) {
          const first = availableOffsets[firstIndex];
          const second = availableOffsets[secondIndex];
          const dotProduct = first.column * second.column + first.row * second.row;

          if (dotProduct === 0) cornerPairs.push([first, second]);
        }
      }

      const selectedPair = cornerPairs[Math.floor(Math.random() * cornerPairs.length)] || [];
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

    component.addEventListener("pointerenter", handlePointerPosition);
    component.addEventListener("pointermove", handlePointerPosition);

    component.addEventListener("pointerleave", () => {
      latestPointer = null;
      window.cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;

      if (!isTouchGridMode()) clearHighlights();
    });

    const requestCellBuild = () => {
      if ((!isFluidGrid && !isTouchGridMode()) || resizeFrame) return;

      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;

        if (isFluidGrid) {
          buildCells();
        }

        applyTouchHighlights();
      });
    };

    const resizeObserver =
      "ResizeObserver" in window ? new ResizeObserver(requestCellBuild) : null;

    const syncGridInputMode = () => {
      latestPointer = null;
      window.cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;

      if ((isTouchGridMode() || reducedMotionQuery.matches) && cometLayer) {
        cometLayer.replaceChildren();
      }

      applyTouchHighlights();
    };

    resizeObserver?.observe(isFluidGrid ? stage : component);
    finePointerQuery.addEventListener("change", syncGridInputMode);
    touchPointerQuery.addEventListener("change", syncGridInputMode);
    reducedMotionQuery.addEventListener("change", syncGridInputMode);

    const spawnComet = () => {
      if (
        !isInViewport ||
        document.hidden ||
        reducedMotionQuery.matches ||
        isTouchGridMode()
      ) {
        return;
      }

      if (!cometLayer) return;

      const origin = defaultCometOrigins[
        Math.floor(Math.random() * defaultCometOrigins.length)
      ];
      const direction = cometDirections[Math.floor(Math.random() * cometDirections.length)];
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

      const animation = comet.animate(
        [
          { opacity: 0, transform: `translate3d(0, 0, 0) rotate(${direction.angle}deg)` },
          { opacity: 0.38, offset: 0.24 },
          { opacity: 0, transform: `translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${direction.angle}deg)` },
        ],
        {
          duration: 300,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        },
      );

      animation.addEventListener("finish", () => comet.remove(), { once: true });
      animation.addEventListener("cancel", () => comet.remove(), { once: true });
    };

    const scheduleComet = () => {
      window.clearTimeout(cometTimer);
      cometTimer = window.setTimeout(() => {
        spawnComet();
        scheduleComet();
      }, 4200 + Math.random() * 4200);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        isInViewport = entries.some((entry) => entry.isIntersecting);
      },
      { threshold: 0.15 },
    );

    observer.observe(component);

    if (cometLayer && !reducedMotionQuery.matches) scheduleComet();

    window.addEventListener(
      "pagehide",
      () => {
        window.clearTimeout(cometTimer);
        window.cancelAnimationFrame(pointerFrame);
        window.cancelAnimationFrame(resizeFrame);
        resizeObserver?.disconnect();
        observer.disconnect();
        finePointerQuery.removeEventListener("change", syncGridInputMode);
        touchPointerQuery.removeEventListener("change", syncGridInputMode);
        reducedMotionQuery.removeEventListener("change", syncGridInputMode);
      },
      { once: true },
    );
  });

  page.querySelectorAll("img").forEach((image) => {
    image.draggable = false;
  });

  if (page.dataset.imageDragGuard !== "true") {
    page.dataset.imageDragGuard = "true";
    page.addEventListener("dragstart", (event) => {
      if (event.target instanceof HTMLImageElement) event.preventDefault();
    });
  }

  const currentYear = String(new Date().getFullYear());

  page.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = currentYear;
  });
})();
