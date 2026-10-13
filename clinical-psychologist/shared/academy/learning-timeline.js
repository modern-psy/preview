(() => {
  window.__academyLearningTimelineCleanup?.();
  const timelines = [...document.querySelectorAll('[data-learning-timeline]')];
  if (!timelines.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const controller = new AbortController();
  const options = { passive: true, signal: controller.signal };
  let frame = 0;
  let active = true;
  let visible = new Set(timelines);

  const update = () => {
    frame = 0;
    if (!active) return;
    // Read geometry before writing styles. Text and markers never animate.
    const positions = timelines.filter(el => visible.has(el)).map(el => {
      const bounds = el.getBoundingClientRect();
      const origin = parseFloat(getComputedStyle(el, '::before').top) || 0;
      const length = Math.max(1, bounds.height - origin);
      // Keep the growing tip 10% above the viewport bottom on every screen.
      const progress = reduced.matches ? 1 : Math.max(0, Math.min(1, (innerHeight * 0.9 - bounds.top - origin) / length));
      return [el, progress];
    });
    positions.forEach(([el, progress]) => el.style.setProperty('--timeline-progress', String(progress)));
  };
  const schedule = () => { if (!frame && active) frame = requestAnimationFrame(update); };
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.add(entry.target);
      else {
        visible.delete(entry.target);
        entry.target.style.setProperty('--timeline-progress', reduced.matches || entry.boundingClientRect.bottom < 0 ? '1' : '0');
      }
    });
    schedule();
  }, { rootMargin: '20% 0px' }) : null;
  timelines.forEach(el => observer?.observe(el));
  const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
  resize?.observe(document.body);
  window.addEventListener('scroll', schedule, options);
  window.addEventListener('resize', schedule, options);
  reduced.addEventListener('change', schedule, { signal: controller.signal });
  update();

  window.__academyLearningTimelineCleanup = () => {
    active = false;
    controller.abort();
    observer?.disconnect();
    resize?.disconnect();
    cancelAnimationFrame(frame);
    timelines.forEach(el => el.style.removeProperty('--timeline-progress'));
    visible.clear();
  };
})();
