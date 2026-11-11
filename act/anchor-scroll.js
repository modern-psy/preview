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
