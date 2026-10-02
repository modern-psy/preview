/* Проектный скрипт лендинга: разделы topic-tabs (навыки, второй вариант программы) и вкладки со схемами
   (третий вариант программы). Про topic-tabs:
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

  /* Третий вариант программы: вкладка переключает сразу описание темы слева и схему справа.
     Скрытая схема не анимируется, показанная начинает цикл с начала (так работает CSS-анимация). */
  const sceneBlocks = [...document.querySelectorAll('[data-scene-tabs]')];
  sceneBlocks.forEach((block) => {
    const tabs = [...block.querySelectorAll('[data-scene-tab]')];
    const texts = [...block.querySelectorAll('[data-scene-text]')];
    const scenes = [...block.querySelectorAll('[data-scene-panel]')];
    if (!tabs.length || tabs.length !== texts.length || tabs.length !== scenes.length) return;
    const list = tabs[0].parentElement;

    const select = (index, {animate = true} = {}) => {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
      });
      scenes.forEach((scene, i) => { scene.hidden = i !== index; });
      texts.forEach((text, i) => {
        text.hidden = i !== index;
        text.classList.remove('is-entering');
        if (i === index && animate && !reducedMotion.matches) {
          void text.offsetWidth;
          text.classList.add('is-entering');
        }
      });
      // На телефоне вкладки лежат в горизонтальной ленте: подвозим выбранную в кадр, страницу не двигаем.
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

  window.__rodbtLiveTopicTabsCleanup = () => {
    controller.abort();
    blocks.forEach((block) => {
      block.removeAttribute('data-ready');
      block.querySelectorAll('[data-topic-panel]').forEach((panel) => { panel.hidden = false; panel.classList.remove('is-entering'); });
    });
    sceneBlocks.forEach((block) => {
      block.querySelectorAll('[data-scene-text], [data-scene-panel]').forEach((item) => { item.hidden = false; item.classList.remove('is-entering'); });
    });
    delete window.__rodbtLiveTopicTabsCleanup;
  };
})();
