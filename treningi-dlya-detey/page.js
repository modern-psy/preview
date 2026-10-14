// «Когда упражнения есть, а тренинга не получается»: сообщения один раз появляются по очереди, затем ответ Академии,
// когда блок попадает на экран. Без скрипта и при «уменьшить движение» видно всё сразу.
// Повторный запуск (редактор и превью Тильды) сначала снимает прежнее наблюдение.
(() => {
  window.__treningiDialogCleanup?.();
  const observers = [];
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    document.querySelectorAll('[data-js="pains-reply"]').forEach(root => {
      root.querySelectorAll('.pains-reply_bubble, .pains-reply_answer').forEach((item, i) => item.style.setProperty('--message-index', i));
      root.classList.add('is-reveal-ready');
      const observer = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        root.classList.add('is-revealed');
        observer.disconnect();
      }, {threshold: 0.2});
      observer.observe(root);
      observers.push(observer);
    });
  }
  window.__treningiDialogCleanup = () => observers.forEach(observer => observer.disconnect());
})();

/* Программа курса: табы модулей (перенесено с /rodbt без изменений логики). Кнопки модулей связаны с панелями через
   aria-controls; стрелки ходят по списку; при переключении панель коротко выезжает сбоку, при reduced motion
   переключение мгновенное. Повторный запуск снимает прошлые обработчики (редактор Тильды перезапускает скрипты).
*/
(() => {
  window.__treningiProgramTabsCleanup?.();
  const controller = new AbortController();
  const {signal} = controller;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const blocks = [...document.querySelectorAll('[data-program-tabs]')];
  if (!blocks.length) return;

  blocks.forEach((block) => {
    const tabs = [...block.querySelectorAll('[data-program-tab]')];
    const panels = [...block.querySelectorAll('[data-program-panel]')];
    if (!tabs.length || !panels.length) return;
    block.setAttribute('data-ready', '');

    const select = (tab) => {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      const targetId = tab.getAttribute('aria-controls');
      panels.forEach((panel) => {
        const isTarget = panel.id === targetId;
        panel.hidden = !isTarget;
        panel.classList.remove('is-entering');
        if (isTarget && !reducedMotion.matches) {
          void panel.offsetWidth;
          panel.classList.add('is-entering');
        }
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab), {signal});
      tab.addEventListener('keydown', (event) => {
        const delta = {ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1}[event.key];
        const jump = {Home: 0, End: tabs.length - 1}[event.key];
        if (delta === undefined && jump === undefined) return;
        event.preventDefault();
        const next = tabs[jump ?? (index + delta + tabs.length) % tabs.length];
        next.focus();
        select(next);
      }, {signal});
    });
    select(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0]);
  });

  window.__treningiProgramTabsCleanup = () => {
    controller.abort();
    blocks.forEach((block) => {
      block.removeAttribute('data-ready');
      block.querySelectorAll('[data-program-panel]').forEach((panel) => { panel.hidden = false; panel.classList.remove('is-entering'); });
    });
    delete window.__treningiProgramTabsCleanup;
  };
})();
