/* ==========================================================================
   Страница «Сообщество выпускников» · modern-psy.ru/alumni
   Скрипт нужен только вопросам-ответам: без него они тоже открываются,
   просто сразу несколько.
   ========================================================================== */
(() => {
  /* ---------- 1. Вопросы и ответы: открыт один за раз ---------- */
  document.querySelectorAll('.alumni-page [data-faq]').forEach((list) => {
    const items = [...list.querySelectorAll('[data-faq-item]')];
    items.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (!item.open) return;
        items.forEach((other) => {
          if (other !== item && other.open) other.open = false;
        });
      });
    });
  });

  /* ---------- 2. Сцены форматов: анимация только на экране ----------
     Класс is-run включает движение в page.css (раздел 3). Без скрипта
     сцены просто стоят неподвижно. */
  const scenes = document.querySelector('.alumni-page [data-format-scenes]');
  if (scenes && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => scenes.classList.toggle('is-run', entry.isIntersecting));
    }, { rootMargin: '0px 0px -10% 0px' }).observe(scenes);
  }
})();
