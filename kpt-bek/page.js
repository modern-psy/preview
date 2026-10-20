/* Лендинг «КПТ. Модель Бека»: поведение блоков страницы.
   1. Программа: табы модулей на десктопе, аккордеон до 1025 px.
   2. Преподаватели: вкладки с именами.
   3. Отзывы: стрелки ленты и видео Kinescope прямо в карточке.
   4. Ближайший старт: свежая дата из CMS в фактах о курсе и в заголовке формы.
   Без скрипта страница остаётся рабочей: видны все модули программы и первая карточка преподавателя. */
(() => {
  const desktop = window.matchMedia('(min-width: 64.0625rem)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- 1. Программа ---------- */
  document.querySelectorAll('[data-program-tabs]').forEach(root => {
    if (root.dataset.ready) return;
    root.dataset.ready = 'true';
    const tabs = [...root.querySelectorAll('[data-program-tab]')];
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
    const show = (index, {focus = false} = {}) => {
      tabs.forEach((tab, i) => {
        const open = i === index;
        tab.setAttribute('aria-expanded', String(open));
        panels[i].hidden = !open;
      });
      if (focus) tabs[index].focus();
    };
    // На узких экранах открытый модуль можно закрыть повторным нажатием; на десктопе всегда открыт один.
    tabs.forEach((tab, i) => tab.addEventListener('click', () => {
      const open = tab.getAttribute('aria-expanded') === 'true';
      if (open && !desktop.matches) { tab.setAttribute('aria-expanded', 'false'); panels[i].hidden = true; return; }
      show(i);
      if (!desktop.matches && !reduce.matches) tab.scrollIntoView({block: 'nearest', behavior: 'smooth'});
    }));
    // Стрелки вверх и вниз переводят фокус между модулями, Home и End — к первому и последнему.
    root.addEventListener('keydown', event => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const next = {ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1}[event.key];
      if (next === undefined) return;
      event.preventDefault();
      const target = (next + tabs.length) % tabs.length;
      if (desktop.matches) show(target, {focus: true}); else tabs[target].focus();
    });
    // При переходе на десктоп хотя бы один модуль должен быть открыт.
    desktop.addEventListener('change', () => {
      if (desktop.matches && !tabs.some(tab => tab.getAttribute('aria-expanded') === 'true')) show(0);
    });
    show(0);
  });

  /* ---------- 2. Преподаватели ---------- */
  document.querySelectorAll('[data-teachers]').forEach(root => {
    if (root.dataset.ready) return;
    root.dataset.ready = 'true';
    const tabs = [...root.querySelectorAll('[data-teacher-tab]')];
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
    const select = (index, focus) => {
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i].classList.toggle('is-active', on);
      });
      if (focus) tabs[index].focus();
      // На телефоне имена в прокручиваемой строке: выбранное имя должно быть видно целиком.
      tabs[index].scrollIntoView({block: 'nearest', inline: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth'});
    };
    tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i, false)));
    root.addEventListener('keydown', event => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const next = {ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1}[event.key];
      if (next === undefined) return;
      event.preventDefault();
      select((next + tabs.length) % tabs.length, true);
    });
  });

  /* ---------- 3. Отзывы ---------- */
  document.querySelectorAll('[data-reviews]').forEach(root => {
    if (root.dataset.ready) return;
    root.dataset.ready = 'true';
    const track = root.querySelector('[data-reviews-track]');
    const prev = root.querySelector('[data-reviews-prev]');
    const next = root.querySelector('[data-reviews-next]');
    const step = () => {
      const card = track.querySelector('.kpt-review_card');
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
    };
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    };
    const behavior = () => (reduce.matches ? 'auto' : 'smooth');
    prev.addEventListener('click', () => track.scrollBy({left: -step(), behavior: behavior()}));
    next.addEventListener('click', () => track.scrollBy({left: step(), behavior: behavior()}));
    track.addEventListener('scroll', update, {passive: true});
    window.addEventListener('resize', update);
    update();

    // Видео включается в карточке. Одновременно играет одно: при запуске другого прежнее снова становится обложкой.
    let playing = null;
    const stop = () => {
      if (!playing) return;
      playing.frame.replaceWith(playing.button);
      playing = null;
    };
    track.querySelectorAll('[data-review-video]').forEach(button => button.addEventListener('click', () => {
      stop();
      const id = button.dataset.reviewVideo;
      const frame = document.createElement('div');
      frame.className = 'kpt-review_media';
      const iframe = document.createElement('iframe');
      iframe.className = 'kpt-review_frame';
      iframe.src = `https://kinescope.io/embed/${encodeURIComponent(id)}?autoplay=1`;
      iframe.title = button.getAttribute('aria-label') || 'Видеоотзыв';
      iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write';
      frame.appendChild(iframe);
      button.replaceWith(frame);
      playing = {button, frame};
      iframe.focus();
    }));
  });

  /* ---------- 4. Ближайший старт из CMS ----------
     При сборке в страницу вписана дата на тот день. Здесь берём свежую: ближайший поток с открытым набором.
     Если CMS не ответила, остаётся дата из сборки. */
  const startSlots = document.querySelectorAll('[data-kpt-start]');
  const priceBlock = document.querySelector('[data-price-auto][data-course]');
  if (startSlots.length && priceBlock && 'fetch' in window) {
    const api = (priceBlock.getAttribute('data-api') || '').replace(/\/+$/, '');
    const slug = priceBlock.getAttribute('data-course');
    const OPEN = ['Идет набор', 'Идёт набор', 'Последний шанс'];
    const controller = 'AbortController' in window ? new AbortController() : null;
    const timer = setTimeout(() => controller?.abort(), 8000);
    fetch(`${api}/api/public/course/${encodeURIComponent(slug)}`, {headers: {Accept: 'application/json'}, signal: controller?.signal})
      .then(response => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then(course => {
        const today = Date.now() - 864e5;
        const stream = (course.streams || [])
          .filter(s => OPEN.includes(s.status) && s.startDate && Date.parse(s.startDate) >= today)
          .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate))[0];
        if (!stream) return;
        const date = new Intl.DateTimeFormat('ru-RU', {day: 'numeric', month: 'long', timeZone: 'Europe/Moscow'}).format(new Date(stream.startDate)).replace(' ', ' ');
        startSlots.forEach(slot => { slot.textContent = date; });
      })
      .catch(error => console.info('[kpt-bek] Дата старта из CMS не загрузилась, осталась дата из сборки.', error.message))
      .finally(() => clearTimeout(timer));
  }
})();
