/* Проектный скрипт лендинга «Основы нарративной практики».
   1. Схемы ситуаций (блок «Где можно применять»): анимация идёт, только пока схема видна на экране,
      остальные стоят на паузе — так страница не тратит ресурсы на шесть-восемнадцать циклов сразу.
      Без скрипта анимации просто идут всегда.
   2. Вкладки второго варианта блока: выбранная ситуация показывает свою схему и текст справа.
      Стрелки влево/вправо (и вверх/вниз), Home и End переключают вкладки с клавиатуры.
   Повторный запуск снимает прошлые обработчики (Tilda может перезапускать скрипты). */
(() => {
  window.__narrativeTherapyCleanup?.();
  const controller = new AbortController();
  const {signal} = controller;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const scenes = [...document.querySelectorAll('[data-scene]')];
  let observer = null;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.toggleAttribute('data-in-view', entry.isIntersecting));
    }, {rootMargin: '0px 0px -10% 0px'});
    scenes.forEach((scene) => {
      scene.setAttribute('data-scene-observed', '');
      observer.observe(scene);
    });
  }

  const blocks = [...document.querySelectorAll('[data-use-case-tabs]')];
  blocks.forEach((block) => {
    const tabs = [...block.querySelectorAll('[data-use-case-tab]')];
    const panels = [...block.querySelectorAll('[data-use-case-panel]')];
    if (!tabs.length || tabs.length !== panels.length) return;
    const list = tabs[0].parentElement;

    const select = (index, {animate = true} = {}) => {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
      });
      panels.forEach((panel, i) => {
        panel.hidden = i !== index;
        panel.classList.remove('is-entering');
        if (i === index && animate && !reducedMotion.matches) {
          void panel.offsetWidth;
          panel.classList.add('is-entering');
        }
      });
      // На телефоне вкладки лежат лентой с прокруткой: подвозим выбранную в кадр, страницу не двигаем.
      if (animate && list.scrollWidth > list.clientWidth + 1) {
        const tab = tabs[index];
        list.scrollTo({left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: reducedMotion.matches ? 'auto' : 'smooth'});
      }
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(index), {signal});
      tab.addEventListener('keydown', (event) => {
        const delta = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[event.key];
        const jump = {Home: 0, End: tabs.length - 1}[event.key];
        if (delta === undefined && jump === undefined) return;
        event.preventDefault();
        const next = jump ?? (index + delta + tabs.length) % tabs.length;
        tabs[next].focus();
        select(next);
      }, {signal});
    });
    select(0, {animate: false});
  });

  window.__narrativeTherapyCleanup = () => {
    controller.abort();
    observer?.disconnect();
    scenes.forEach((scene) => scene.removeAttribute('data-scene-observed'));
    blocks.forEach((block) => block.querySelectorAll('[data-use-case-panel]').forEach((panel) => { panel.hidden = false; panel.classList.remove('is-entering'); }));
    delete window.__narrativeTherapyCleanup;
  };
})();
