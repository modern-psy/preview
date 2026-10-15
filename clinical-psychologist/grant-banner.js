// Баннер гранта: сумма на сертификате набирается от нуля, когда баннер появляется на экране,
// а лента уроков не крутится, пока баннер за его пределами.
// Без JS и при настройке «уменьшить движение» сумма сразу полная, анимаций нет.
(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const format = value => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  // От нуля до гранта за секунду, с замедлением в конце.
  const countUp = element => {
    const target = Number(element.dataset.grantCount);
    const start = performance.now();
    const step = now => {
      const progress = Math.min(1, (now - start) / 1100);
      const eased = progress === 1 ? 1 : 1 - 2 ** (-10 * progress);
      element.textContent = format(Math.round((target * eased) / 100) * 100);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const init = root => {
    if (root.dataset.grantReady || !('IntersectionObserver' in window)) return;
    root.dataset.grantReady = 'true';
    const counters = [...root.querySelectorAll('[data-grant-count]')];
    if (!motion.matches && counters.length) {
      counters.forEach(element => { element.textContent = '0'; });
      const reveal = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        reveal.disconnect();
        counters.forEach(countUp);
      }, {threshold: 0.35});
      reveal.observe(root);
    }
    const visibility = new IntersectionObserver(entries => {
      entries.forEach(entry => root.classList.toggle('is-paused', !entry.isIntersecting));
    });
    visibility.observe(root);
  };

  const boot = () => document.querySelectorAll('[data-js="grant-banner"]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once: true});
  else boot();
})();
