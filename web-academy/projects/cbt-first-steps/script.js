(() => {
  "use strict";

  const page = document.querySelector(".cbt-first-steps-page");
  const stack = page?.querySelector(".course-program_list");

  if (!page || !stack) return;

  window.__cbtFirstStepsStackController?.abort();

  const controller = new AbortController();
  const { signal } = controller;
  const items = Array.from(stack.querySelectorAll(":scope > .course-program_item"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const wideViewport = window.matchMedia("(min-width: 48rem)");
  const edgeGap = 16;
  let resizeTimer = 0;

  window.__cbtFirstStepsStackController = controller;

  function clearStops() {
    items.forEach((item) => item.style.removeProperty("--course-program-stick-top"));
  }

  function tuneStack() {
    clearStops();

    if (reducedMotion.matches || !wideViewport.matches) return;

    const baseTop = parseFloat(window.getComputedStyle(items[0]).top) || 0;
    const viewportHeight = window.innerHeight;

    items.forEach((item) => {
      const card = item.querySelector(".course-program_card");
      if (!card) return;

      const cardHeight = card.offsetHeight;
      const stop = cardHeight + baseTop + edgeGap <= viewportHeight
        ? baseTop
        : Math.round(viewportHeight - cardHeight - edgeGap);

      item.style.setProperty("--course-program-stick-top", `${stop}px`);
    });
  }

  function scheduleTune() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(tuneStack, 50);
  }

  window.addEventListener("load", scheduleTune, { signal });
  window.addEventListener("resize", scheduleTune, { signal });
  window.addEventListener("orientationchange", scheduleTune, { signal });
  reducedMotion.addEventListener("change", scheduleTune, { signal });
  wideViewport.addEventListener("change", scheduleTune, { signal });

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(scheduleTune);
    observer.observe(stack);
    signal.addEventListener("abort", () => observer.disconnect(), { once: true });
  }

  if (document.fonts?.ready) document.fonts.ready.then(scheduleTune);

  const currentYear = String(new Date().getFullYear());

  page.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = currentYear;
  });

  tuneStack();
  scheduleTune();
})();
