/* Проектный скрипт лендинга: разделы блока «Ваши навыки после курса» (topic-tabs).
   Кнопка раздела связана со своей панелью через aria-controls и aria-expanded; открыт всегда один раздел.
   До 1025px это аккордеон: панель раскрывается под кнопкой, и если кнопка уехала выше экрана, страница
   подкручивается к ней. От 1025px те же кнопки работают как вкладки слева от панели.
   Без скрипта видны все панели. Повторный запуск снимает прошлые обработчики (Tilda перезапускает скрипты). */
(() => {
  window.__rodbtLiveTopicTabsCleanup?.();
  const controller = new AbortController();
  const {signal} = controller;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const blocks = [...document.querySelectorAll('[data-topic-tabs]')];
  if (!blocks.length) return;

  blocks.forEach((block) => {
    const tabs = [...block.querySelectorAll('[data-topic-tab]')];
    const panels = [...block.querySelectorAll('[data-topic-panel]')];
    if (!tabs.length || tabs.length !== panels.length) return;
    block.setAttribute('data-ready', '');

    const select = (tab, {animate = true} = {}) => {
      const targetId = tab.getAttribute('aria-controls');
      tabs.forEach((item) => item.setAttribute('aria-expanded', String(item === tab)));
      panels.forEach((panel) => {
        const isTarget = panel.id === targetId;
        panel.hidden = !isTarget;
        panel.classList.remove('is-entering');
        if (isTarget && animate && !reducedMotion.matches) {
          void panel.offsetWidth;
          panel.classList.add('is-entering');
        }
      });
      // Раздел выше закрылся и сдвинул нажатую кнопку за верх экрана: возвращаем её в поле зрения.
      if (animate && tab.getBoundingClientRect().top < 0) tab.parentElement.scrollIntoView({block: 'start', behavior: reducedMotion.matches ? 'auto' : 'smooth'});
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        if (tab.getAttribute('aria-expanded') !== 'true') select(tab);
      }, {signal});
    });
    select(tabs.find((tab) => tab.getAttribute('aria-expanded') === 'true') || tabs[0], {animate: false});
  });

  window.__rodbtLiveTopicTabsCleanup = () => {
    controller.abort();
    blocks.forEach((block) => {
      block.removeAttribute('data-ready');
      block.querySelectorAll('[data-topic-panel]').forEach((panel) => { panel.hidden = false; panel.classList.remove('is-entering'); });
    });
    delete window.__rodbtLiveTopicTabsCleanup;
  };
})();

/* Вкладки варианта 2 блока «Когда нужна другая стратегия» (strategy-tabs). Выбранная вкладка показывает свой текст
   и свою схему; схема запускается с начала. Клавиатура: стрелки вверх/вниз и влево/вправо, Home, End.
   Без скрипта видны все тексты и схемы. Повторный запуск снимает прошлые обработчики (Tilda перезапускает скрипты). */
(() => {
  window.__rodbtRecordStrategyTabsCleanup?.();
  const controller = new AbortController();
  const {signal} = controller;
  const blocks = [...document.querySelectorAll('[data-strategy-tabs]')];
  if (!blocks.length) return;

  blocks.forEach((block) => {
    const tabs = [...block.querySelectorAll('[data-strategy-tab]')];
    const panels = [...block.querySelectorAll('[data-strategy-panel]')];
    const scenes = [...block.querySelectorAll('[data-strategy-scene]')];
    if (!tabs.length || tabs.length !== panels.length || tabs.length !== scenes.length) return;

    const select = (index, {focus = false} = {}) => {
      tabs.forEach((tab, i) => {
        const active = i === index;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        panels[i].hidden = !active;
        scenes[i].hidden = !active;
      });
      // Схема выбранной вкладки начинается с начала цикла, а не с середины.
      scenes[index].getAnimations?.({subtree: true}).forEach((animation) => { animation.currentTime = 0; });
      if (focus) tabs[index].focus();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i), {signal});
      tab.addEventListener('keydown', (event) => {
        const last = tabs.length - 1;
        const next = {ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: last}[event.key];
        if (next === undefined) return;
        event.preventDefault();
        select((next + tabs.length) % tabs.length, {focus: true});
      }, {signal});
    });
    select(Math.max(0, tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true')));
  });

  window.__rodbtRecordStrategyTabsCleanup = () => {
    controller.abort();
    blocks.forEach((block) => block.querySelectorAll('[data-strategy-panel], [data-strategy-scene]').forEach((item) => { item.hidden = false; }));
    delete window.__rodbtRecordStrategyTabsCleanup;
  };
})();
