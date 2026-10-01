(() => {
  if (typeof window.__astShrekTimelineCleanup === "function") {
    window.__astShrekTimelineCleanup();
  }

  const timelines = Array.from(document.querySelectorAll("[data-webinar-timeline]"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cleanupTasks = [];
  let cancelled = false;

  const restoreStaticState = (timeline) => {
    timeline.classList.remove("is-scroll-animated");
    timeline.style.removeProperty("--webinar-line-progress");
    timeline.style.removeProperty("--webinar-line-start");
    timeline.style.removeProperty("--webinar-line-length");
    delete timeline.dataset.motionInitialized;
  };

  const cleanup = () => {
    cancelled = true;
    cleanupTasks.splice(0).forEach((task) => task());
    timelines.forEach(restoreStaticState);
    reducedMotion.removeEventListener("change", handleReducedMotion);
  };

  const handleReducedMotion = (event) => {
    if (event.matches) cleanup();
  };

  window.__astShrekTimelineCleanup = cleanup;

  if (!timelines.length || reducedMotion.matches) return;

  timelines.forEach((timeline) => {
    timeline.dataset.motionInitialized = "true";
  });

  reducedMotion.addEventListener("change", handleReducedMotion);

  import("https://cdn.jsdelivr.net/npm/motion@12.42.2/+esm")
    .then(({ scroll }) => {
      if (cancelled) return;

      timelines.forEach((timeline) => {
        const markers = Array.from(
          timeline.querySelectorAll(".webinar-timeline_number"),
        );

        if (markers.length < 2) {
          restoreStaticState(timeline);
          return;
        }

        timeline.classList.add("is-scroll-animated");
        let maximumLineDistance = 0;

        const updateTimeline = () => {
          const firstMarker = markers[0];
          const lastMarker = markers.at(-1);
          const timelineRect = timeline.getBoundingClientRect();
          const firstRect = firstMarker.getBoundingClientRect();
          const lastRect = lastMarker.getBoundingClientRect();
          const firstCenter = firstRect.top - timelineRect.top + firstRect.height / 2;
          const lastCenter = lastRect.top - timelineRect.top + lastRect.height / 2;
          const lineLength = Math.max(1, lastCenter - firstCenter);
          const activationY = window.innerHeight * 0.9;
          const currentLineDistance = Math.min(
            lineLength,
            Math.max(0, activationY - firstRect.top - firstRect.height / 2),
          );

          maximumLineDistance = Math.min(
            lineLength,
            Math.max(maximumLineDistance, currentLineDistance),
          );

          timeline.style.setProperty("--webinar-line-start", `${firstCenter}px`);
          timeline.style.setProperty("--webinar-line-length", `${lineLength}px`);
          timeline.style.setProperty(
            "--webinar-line-progress",
            (maximumLineDistance / lineLength).toFixed(4),
          );
        };

        const stopScroll = scroll(updateTimeline, {
          target: timeline,
          offset: ["start end", "end start"],
        });

        updateTimeline();
        cleanupTasks.push(() => stopScroll());
      });
    })
    .catch(() => {
      timelines.forEach(restoreStaticState);
    });
})();

(() => {
  if (typeof window.__astShrekAccordionCleanup === "function") {
    window.__astShrekAccordionCleanup();
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cleanupTasks = [];

  document.querySelectorAll("[data-accordion]").forEach((accordion) => {
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
        reducedMotion.matches ||
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
            duration: 300,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
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
          duration: 300,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
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

    cleanupTasks.push(() => {
      listeners.splice(0).forEach((removeListener) => removeListener());
      itemAnimations.forEach((animation) => animation.cancel());
      itemAnimations.clear();
      items.forEach((item) => {
        delete item.dataset.accordionState;
      });
      delete accordion.dataset.accordionInitialized;
    });
  });

  window.__astShrekAccordionCleanup = () => {
    cleanupTasks.splice(0).forEach((task) => task());
  };
})();
