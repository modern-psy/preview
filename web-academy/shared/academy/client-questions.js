// «Вопросы на небе»: каждая реплика появляется при входе в видимую область, фон движется отдельно.
// Повторный запуск (редактор и превью Тильды) сначала освобождает прежние наблюдатели и обработчики.
(() => {
  window.__academyClientQuestionsCleanup?.();
  const stages = [...document.querySelectorAll('[data-js="client-questions"]')];
  const bubbles = stages.flatMap(stage => [...stage.querySelectorAll('.client-questions_bubble')]);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 64.0625rem) and (hover: hover) and (pointer: fine)');
  const active = new Set();
  let revealObserver;
  let visibilityObserver;
  let frame = 0;
  const updateSky = () => {
    frame = 0;
    active.forEach(stage => {
      const box = stage.getBoundingClientRect();
      const progress = Math.max(-1, Math.min(1, (innerHeight / 2 - box.top - box.height / 2) / ((innerHeight + box.height) / 2)));
      stage.style.setProperty('--sky-shift', `${(progress * 1.5).toFixed(4)}rem`);
    });
  };
  const scheduleSky = () => { if (!frame && active.size) frame = requestAnimationFrame(updateSky); };
  const stop = () => {
    revealObserver?.disconnect();
    visibilityObserver?.disconnect();
    removeEventListener('scroll', scheduleSky);
    removeEventListener('resize', scheduleSky);
    cancelAnimationFrame(frame);
    frame = 0;
    active.clear();
    stages.forEach(stage => {
      stage.classList.remove('is-reveal-ready', 'is-parallax');
      stage.style.removeProperty('--sky-shift');
    });
    bubbles.forEach(bubble => bubble.classList.remove('is-revealed'));
  };
  const configure = () => {
    stop();
    if (motion.matches || !('IntersectionObserver' in window)) return;
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.25) return;
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      });
    }, {rootMargin: `0px 0px -${Math.round(innerHeight * 0.15)}px 0px`, threshold: 0.25});
    stages.forEach(stage => stage.classList.add('is-reveal-ready'));
    bubbles.forEach(bubble => revealObserver.observe(bubble));
    // На телефонах фон статичен, чтобы не добавлять непрерывную анимацию при касании.
    if (!desktop.matches) return;
    stages.forEach(stage => stage.classList.add('is-parallax'));
    visibilityObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? active.add(entry.target) : active.delete(entry.target));
      scheduleSky();
    });
    stages.forEach(stage => visibilityObserver.observe(stage));
    addEventListener('scroll', scheduleSky, {passive: true});
    addEventListener('resize', scheduleSky, {passive: true});
  };
  configure();
  motion.addEventListener('change', configure);
  desktop.addEventListener('change', configure);
  window.__academyClientQuestionsCleanup = () => {
    stop();
    motion.removeEventListener('change', configure);
    desktop.removeEventListener('change', configure);
  };
})();
