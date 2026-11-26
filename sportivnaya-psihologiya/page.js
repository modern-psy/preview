/* Лендинг «Спортивная психология»: дата старта, время практик и часы из CMS, вопросы и ответы,
   второй вариант заголовка блока «ниша» для превью, номер посетителя Метрики в заявке.
   Цены берёт сам блок цены (генератор /pricing). Устроено как на /couples-therapy. */
(() => {
  /* ---------- Дата старта, время занятий и часы из CMS ----------
     Два запроса к Public API:
     • каталог (/api/public/catalog) — часы курса и режим набора: идёт набор с датой старта или лист ожидания.
       Режим считает сама CMS по тем же правилам, что каталог и расписание: прошедший поток или поток
       со статусом «Лист ожидания» — это лист ожидания;
     • курс (/api/public/course/sportivnaya-psihologiya) — расписание потока («По вторникам и пятницам 18:00–20:30»).
     Куда ставить, задают метки data-cms в разметке:
       start-date — крупная цифра старта в первом экране: «11 мая»;
       enrollment-start — заголовок формы: «Занятия начнутся 11 мая»;
       hours-num и hours-word — крупная цифра часов в первом экране и подпись под ней: «252», «академических часа»;
       hours — «252 академических часа» (строка программы);
       schedule-sentence — «Практики по вторникам и пятницам с 18:00 до 20:30 по Москве» (строка программы).
     Дату ставим, только если у потока в CMS она есть. Лист ожидания без даты НЕ меняет текст страницы:
     старт 11 мая объявлен Дарьей 23.11.2026, а поток в CMS ещё не заведён. Когда в CMS появится поток с датой,
     дата пойдёт из CMS сама.
     Если API не ответил или поле в CMS пустое, остаётся текст из разметки. */
  const API = 'https://modern-psy-asp-prod-8ceb.twc1.net';
  const SLUG = 'sportivnaya-psihologiya';
  const getJson = path => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    return fetch(API + path, { headers: { Accept: 'application/json' }, signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); })
      .finally(() => clearTimeout(timer));
  };
  const put = (key, text) => document.querySelectorAll(`[data-cms="${key}"]`).forEach(node => { node.textContent = text; node.dataset.cmsState = 'ready'; });
  const dayMonth = iso => {
    const date = new Date(iso + 'T00:00:00Z');
    if (!Number.isFinite(date.getTime())) return '';
    /* «1 марта» с неразрывным пробелом между числом и месяцем */
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date).replace(' ', ' ');
  };
  const hoursWord = hours => {
    const last = hours % 10, lastTwo = hours % 100;
    return last === 1 && lastTwo !== 11 ? 'академический час'
      : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'академических часа' : 'академических часов';
  };

  const catalog = getJson('/api/public/catalog')
    .then(data => {
      const card = (data.cards || []).find(item => item.slug === SLUG);
      if (!card) throw new Error('курса нет в каталоге');
      return card;
    });
  const course = getJson('/api/public/course/' + SLUG);

  /* Режим набора и часы — из карточки каталога */
  catalog
    .then(card => {
      if (Number.isInteger(card.hours) && card.hours > 0) {
        put('hours', card.hours + ' ' + hoursWord(card.hours));
        put('hours-num', String(card.hours));
        put('hours-word', hoursWord(card.hours));
      }
      else console.warn('[sportivnaya-psihologiya] в каталоге нет часов курса, остался текст страницы');
      /* Прошедшая дата (старый поток) не показывается: остаётся «11 мая» из разметки */
      const upcoming = card.startDate && new Date(card.startDate + 'T23:59:59Z') >= new Date();
      const start = upcoming ? dayMonth(card.startDate) : '';
      if (start) {
        put('start-date', start);
        put('enrollment-start', 'Занятия начнутся ' + start);
      }
    })
    .catch(error => console.warn('[sportivnaya-psihologiya] каталог CMS не загружен, остался текст страницы', error));

  /* Время занятий — из потока, который сейчас продаётся (его дата в каталоге), иначе из ближайшего потока курса */
  Promise.all([course, catalog.catch(() => null)])
    .then(([data, card]) => {
      const streams = data.streams || [];
      const stream = (card && card.startDate && streams.find(item => item.startDate === card.startDate)) || data.nearestStream || streams[0] || {};
      const schedule = (stream.schedule || '').trim();
      if (!schedule) { console.warn('[sportivnaya-psihologiya] в CMS нет расписания потока, осталось время со страницы'); return; }
      /* «По вторникам и пятницам 18:00–20:30» → «Практики по вторникам и пятницам с 18:00 до 20:30 по Москве».
         Берём первое предложение расписания; неразрывный пробел после первого слова. */
      const first = schedule.split(/\.\s/)[0].replace(/\.$/, '');
      const sentence = first
        .replace(/(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})/, 'с $1 до $2')
        .replace(/^(\S+)\s/, '$1\u00a0');
      put('schedule-sentence', 'Практики ' + sentence.charAt(0).toLowerCase() + sentence.slice(1) + ' по\u00a0Москве');
    })
    .catch(error => console.warn('[sportivnaya-psihologiya] поток из CMS не загружен, остался текст страницы', error));
})();

/* ---------- Преподаватели, второй вариант: вкладки ----------
   Нажатие на вкладку показывает панель преподавателя, стрелки влево и вправо переключают вкладки с клавиатуры.
   Орбита вокруг фото — SVG-анимация: на паузе, пока блок не на экране, и при «уменьшить движение». */
(() => {
  const root = document.querySelector('[data-staff]');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[data-staff-tab]')];
  const panels = [...root.querySelectorAll('[data-staff-panel]')];
  if (!tabs.length || tabs.length !== panels.length) return;
  const show = (index, focus) => {
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
    });
    if (focus) tabs[index].focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => show(i, false));
    tab.addEventListener('keydown', event => {
      const step = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[event.key];
      if (!step) return;
      event.preventDefault();
      show((i + step + tabs.length) % tabs.length, true);
    });
  });
  show(0, false);

  const svgs = [...root.querySelectorAll('.sport-staff_orbit')];
  const setSmil = run => svgs.forEach(svg => {
    if (typeof svg.pauseAnimations !== 'function') return;
    if (run) svg.unpauseAnimations(); else svg.pauseAnimations();
  });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setSmil(false); return; }
  if (!('IntersectionObserver' in window)) return;
  setSmil(false);
  root.classList.add('is-offscreen');
  new IntersectionObserver(entries => {
    const on = entries[0].isIntersecting;
    root.classList.toggle('is-offscreen', !on);
    setSmil(on);
  }, {threshold: 0.15}).observe(root);
})();

/* ---------- Мини-курс: блик на наклейке гранта стоит, пока блок не на экране ---------- */
(() => {
  const section = document.querySelector('.sport-free_section');
  if (!section || !('IntersectionObserver' in window)) return;
  section.classList.add('is-offscreen');
  new IntersectionObserver(entries => section.classList.toggle('is-offscreen', !entries[0].isIntersecting)).observe(section);
})();

/* ---------- «Практика занимает 70 % обучения»: анимации карточек ----------
   CSS-анимации встают на паузу классом is-offscreen, анимации внутри SVG (орбита, лента форматов) —
   через pauseAnimations(). Кольцо 80 % заполняется один раз, когда блок появляется на экране (is-visible).
   При «уменьшить движение» SVG-анимации сразу на паузе, лента стоит, плашки разложены по дуге. */
(() => {
  const root = document.querySelector('[data-practice]');
  if (!root) return;
  const svgs = [...root.querySelectorAll('.sport-practice_smil')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const setSmil = run => svgs.forEach(svg => {
    if (typeof svg.pauseAnimations !== 'function') return;
    if (run) svg.unpauseAnimations(); else svg.pauseAnimations();
  });
  // Ширина плашек ленты по настоящей длине надписи: в разметке стоит примерная
  root.querySelectorAll('[data-practice-chip]').forEach(chip => {
    const text = chip.querySelector('text');
    const rect = chip.querySelector('rect');
    try {
      const width = Math.ceil(text.getComputedTextLength()) + 32;
      if (width > 40) { rect.setAttribute('width', width); rect.setAttribute('x', -width / 2); }
    } catch (error) { /* не страшно: останется примерная ширина */ }
  });
  if (reduced) {
    setSmil(false);
    root.classList.add('is-visible');
    return;
  }
  if (!('IntersectionObserver' in window)) { root.classList.add('is-visible'); return; }
  setSmil(false);
  root.classList.add('is-offscreen');
  new IntersectionObserver(entries => {
    const on = entries[0].isIntersecting;
    root.classList.toggle('is-offscreen', !on);
    if (on) root.classList.add('is-visible');
    setSmil(on);
  }, {threshold: 0.15}).observe(root);
})();

/* ---------- Вопросы и ответы: открыт один вопрос за раз (как на /couples-therapy) ---------- */
(() => {
  document.querySelectorAll('[data-faq]').forEach(list => {
    const items = [...list.querySelectorAll('[data-faq-item]')];
    items.forEach(item => item.addEventListener('toggle', () => {
      if (item.open) items.forEach(other => { if (other !== item) other.open = false; });
    }));
  });
})();

/* ---------- Номер посетителя Метрики в заявке (как на /couples-therapy) ----------
   Общая форма заявки (request-form.js) передаёт в нативную форму Тильды имя, телефон, мессенджер, form_source
   и устройство. Добавляем в форму Тильды скрытое поле ym_client_id и кладём в него номер из куки _ym_uid;
   общий скрипт сайта в head тоже заполняет это поле перед отправкой. На превью формы Тильды нет. */
(() => {
  const clientId = () => (document.cookie.match(/(?:^|;\s*)_ym_uid=([^;]+)/) || [])[1] || '';
  const addClientIdField = () => {
    const name = document.querySelector('[data-academy-request-form]')?.dataset.tildaFormName;
    const native = name && [...document.querySelectorAll('form.t-form')].find(f => f.querySelector('input[name="tildaspec-formname"]')?.value === name);
    if (!native) return false;
    let input = native.querySelector('input[name="ym_client_id"]');
    if (!input) { input = document.createElement('input'); input.type = 'hidden'; input.name = 'ym_client_id'; native.append(input); }
    if (!input.value) input.value = clientId();
    native.addEventListener('submit', () => { if (!input.value) input.value = clientId(); }, true);
    return true;
  };
  if (!addClientIdField()) {
    const mo = new MutationObserver(() => { if (addClientIdField()) mo.disconnect(); });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 10000);
  }
})();

/* ---------- Бегущая строка доверия: пауза, пока её не видно ----------
   Правила Safari: бесконечная анимация за экраном тратит кадры и батарею. Класс is-offscreen ставит паузу
   в page.css (раздел 2). Как бегущие ряды на главной. */
(() => {
  const marquees = document.querySelectorAll('[data-sport-marquee]');
  if (!marquees.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('is-offscreen', !entry.isIntersecting));
  });
  marquees.forEach(node => io.observe(node));
})();

/* ---------- Первый экран: анимация «Беговые дорожки» ----------
   Стадион из точек в лёгкой перспективе, семь дорожек. По каждой бежит огонёк со следом, у белых темп чуть плавает,
   светло-фиолетовый идёт ровно и обходит остальных. Поперёк дорожек — пунктир линии старта.
   На компьютере стадион стоит справа от текста (отступ считается по правому краю заголовка, описания, цифр и кнопок),
   под текстом точки почти прозрачные. На планшете и телефоне — полосой над заголовком.
   Цвета берутся из переменных --dot и --dot-accent блока .sport-hero.
   Рисует только пока карточка на экране и вкладка открыта; при «уменьшить движение» — один неподвижный кадр.
   Анимируется только холст (без фильтров и размытия), правила Safari соблюдены. */
(() => {
  const art = document.querySelector('[data-hero-track]');
  if (!art) return;
  const hero = art.closest('.sport-hero'), card = art.closest('.sport-hero_card'), cv = art.querySelector('canvas');
  const c = cv && cv.getContext ? cv.getContext('2d') : null;
  if (!c) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const rgba = (tri, a) => 'rgba(' + tri + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
  const dot = (x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill(); };

  let W = 0, H = 0, wide = false, textR = 0, time = 0, colDot = '230, 229, 235', colEnd = '#a993f0';
  let lanes = [], finish = [], cx = 0, cy = 0, sy = 0.6, L = 0, r0 = 0, lane = 0;
  const rot = -0.16;
  const per = r => 2 * L + 2 * Math.PI * r;
  /* точка на стадионе по длине пути s (центр стадиона в 0,0) */
  const at = (r, s) => {
    const P = per(r); s = ((s % P) + P) % P;
    if (s < L) return [-L / 2 + s, r];
    s -= L; if (s < Math.PI * r) { const a = Math.PI / 2 - s / r; return [L / 2 + r * Math.cos(a), r * Math.sin(a)]; }
    s -= Math.PI * r; if (s < L) return [L / 2 - s, -r];
    s -= L; const a = -Math.PI / 2 - s / r; return [-L / 2 + r * Math.cos(a), r * Math.sin(a)];
  };
  const proj = (X, Y) => {
    const x = X * Math.cos(rot) - Y * Math.sin(rot), y = X * Math.sin(rot) + Y * Math.cos(rot);
    return [cx + x, cy + y * sy, y];
  };
  /* на компьютере под текстом точки почти прозрачные */
  const mask = x => wide ? 0.05 + 0.95 * ss(textR - 30, textR + 90, x) : 1;

  const setup = () => {
    const free = W - textR - 48;
    const size = wide ? Math.min(free * 0.9, H * 1.2, W * 0.5) : Math.min(W * 1.02, H * 2.5);
    cx = wide ? textR + 24 + free / 2 : W * 0.5; cy = wide ? H * 0.5 : H * 0.55;
    L = size * 0.4; r0 = size * 0.15; lane = size * 0.04; sy = wide ? 0.62 : 0.55;
    const gap = wide ? 13 : 11;
    const speeds = [0.2, 0.23, 0.26, 0.21, 0.24, 0.19, 0.22];
    lanes = [];
    for (let k = 0; k < 7; k++) {
      const r = r0 + k * lane, P = per(r), n = Math.round(P / gap), pts = [];
      for (let i = 0; i < n; i++) pts.push({ s: i * P / n, ph: Math.random() * 6.283 });
      lanes.push({ r, P, pts, v: speeds[k], off: (k * 0.137 + Math.random() * 0.1) % 1, violet: k === 2 });
    }
    finish = [];
    for (let r = r0 - lane * 0.5; r <= r0 + lane * 6.5; r += 5) finish.push(r);
  };

  const draw = () => {
    c.clearRect(0, 0, W, H);
    for (const r of finish) { const [x, y] = proj(0, r); c.fillStyle = rgba(colDot, 0.55 * mask(x)); dot(x, y, 1.3); }
    const heads = [];
    for (const ln of lanes) {
      const lap = reduce ? (ln.violet ? 0.3 : ln.off) : (ln.off + time * ln.v * 0.2 + (ln.violet ? 0 : 0.025 * Math.sin(time * 0.7 + ln.off * 6)));
      const hs = (lap % 1) * ln.P, trail = ln.P * 0.36;
      for (const p of ln.pts) {
        const [X, Y] = at(ln.r, p.s), [x, y, depth] = proj(X, Y);
        const far = 0.62 + 0.38 * ss(-ln.r, ln.r, depth);
        let back = hs - p.s; if (back < 0) back += ln.P;
        const v = back < trail ? Math.pow(1 - back / trail, 1.6) : 0;
        const m = mask(x), tw = reduce ? 1 : 0.85 + 0.15 * Math.sin(time * 1.2 + p.ph);
        if (ln.violet && v > 0.02) { c.globalAlpha = Math.max(v, 0.35) * m; c.fillStyle = colEnd; dot(x, y, (1.9 + 2.4 * v) * far); c.globalAlpha = 1; }
        else { c.fillStyle = rgba(colDot, (0.42 * tw + 0.58 * v) * far * m); dot(x, y, (1.85 + 1.9 * v) * far); }
      }
      const [X, Y] = at(ln.r, hs), [x, y] = proj(X, Y);
      heads.push({ x, y, violet: ln.violet, m: mask(x) });
    }
    /* головы бегунов поверх дорожек, с мягким ореолом */
    for (const h of heads) {
      c.fillStyle = h.violet ? colEnd : '#ffffff';
      c.globalAlpha = (h.violet ? 0.28 : 0.16) * h.m; dot(h.x, h.y, h.violet ? 13 : 10);
      c.globalAlpha = h.m; dot(h.x, h.y, h.violet ? 6.5 : 5);
    }
    c.globalAlpha = 1;
  };

  const resize = () => {
    const r = cv.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    wide = getComputedStyle(art).position === 'absolute';
    const parts = [...card.querySelectorAll('.sport-hero_kicker, .sport-hero_title, .sport-hero_lead, .sport-hero_keys, .sport-hero_buttons')];
    textR = Math.max(0, ...parts.map(el => el.getBoundingClientRect().right)) - r.left;
    const cs = getComputedStyle(hero);
    colDot = cs.getPropertyValue('--dot').trim() || colDot;
    colEnd = cs.getPropertyValue('--dot-accent').trim() || colEnd;
    setup(); draw();
  };

  let raf = 0, running = false, visible = false, last = 0;
  const frame = now => {
    if (!running) return;
    time += Math.min(0.05, (now - last) / 1000 || 0); last = now;
    draw(); raf = requestAnimationFrame(frame);
  };
  const start = () => { if (reduce || running || !visible || document.hidden) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(cv); else window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visible ? start() : stop(); }, { threshold: 0.05 }).observe(card);
  else { visible = true; start(); }
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
  resize();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
})();
