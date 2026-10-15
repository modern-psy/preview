/* Лендинг «Психиатрия для психологов»: колода ситуаций, лист разбора случая, точечная иллюстрация первого экрана, форма. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* форма: на превью никуда не отправляет, на сайте её подключим к форме Тильды */
  document.querySelectorAll('[data-mock-form]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const btn = f.querySelector('.lf-submit'), was = btn.textContent;
    btn.textContent = 'Форма заработает на сайте';
    setTimeout(() => { btn.textContent = was; }, 2200);
  }));

  const watch = (el, on, off, threshold = 0.35) => {
    if (!('IntersectionObserver' in window)) { on(); return; }
    new IntersectionObserver(entries => entries.forEach(e => e.isIntersecting ? on() : off && off()), { threshold }).observe(el);
  };

  /* «Когда привычного понимания недостаточно»: колода ситуаций */
  document.querySelectorAll('[data-deck]').forEach(deck => {
    const cards = [...deck.querySelectorAll('.dk-card')];
    const dots = [...deck.querySelectorAll('.dk-dot')];
    const next = deck.querySelector('[data-next]');
    const stack = deck.querySelector('.dk-stack');
    const n = cards.length;
    let cur = 0;
    const render = () => {
      cards.forEach((c, i) => {
        const pos = (i - cur + n) % n;
        c.dataset.pos = String(pos);
        if (pos === 0) { c.removeAttribute('aria-hidden'); c.inert = false; }
        else { c.setAttribute('aria-hidden', 'true'); c.inert = true; }
      });
      dots.forEach((d, i) => d.setAttribute('aria-current', String(i === cur)));
      next.textContent = cur === n - 1 ? 'К первой ситуации' : 'Следующая ситуация';
    };
    const go = (to, dir = 1) => {
      to = (to + n) % n;
      if (to === cur) return;
      const leaving = cards[cur];
      if (!reduce) {
        const cls = dir > 0 ? 'is-out-left' : 'is-out-right';
        leaving.classList.add(cls);
        setTimeout(() => leaving.classList.remove(cls), 460);
      }
      cur = to;
      render();
    };
    next.addEventListener('click', () => go(cur + 1, 1));
    dots.forEach((d, i) => d.addEventListener('click', () => go(i, i > cur ? 1 : -1)));
    let x0 = null;
    stack.addEventListener('pointerdown', e => { x0 = e.clientX; });
    stack.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (dx < -40) go(cur + 1, 1); else if (dx > 40) go(cur - 1, -1);
    });
    stack.addEventListener('pointercancel', () => { x0 = null; });
    deck.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { go(cur + 1, 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { go(cur - 1, -1); e.preventDefault(); }
    });
    render();
  });

  /* линия «по ходу работы» дорисовывается при появлении блока */
  document.querySelectorAll('[data-draw]').forEach(el => {
    if (reduce) return;
    watch(el, () => { el.classList.remove('is-drawing'); void el.offsetWidth; el.classList.add('is-drawing'); }, null, 0.4);
  });

  /* «Главная идея»: лист «Разбор случая» заполняется при появлении */
  document.querySelectorAll('[data-sheet]').forEach(el => {
    if (reduce) return;
    watch(el, () => { if (!el.classList.contains('is-playing')) { void el.offsetWidth; el.classList.add('is-playing'); } }, () => el.classList.remove('is-playing'), 0.3);
  });


  /* Первый экран: два облака точек (психология и психиатрия) сходятся и расходятся,
     в пересечении точки вспыхивают фиолетовым. Цвета берутся из CSS-переменных поля .hr. */
  const ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const rgba = (tri, a) => 'rgba(' + tri + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
  const SCENES = {
    /* «Пересечение»: два облака редких точек, психология и психиатрия.
       Точки расставлены неравномерно с зазором, к центру облака крупнее, к краю мельче, каждая «дышит» в своём ритме.
       Облака медленно вращаются навстречу друг другу, расходятся до разрыва и снова сходятся.
       Фиолетовым вспыхивают только точки в пересечении, по одной. */
    venn(S, c) {
      let A = [], B = [], R = 100, gap = 18;
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      const cloud = (n, minD) => {
        const pts = [];
        for (let k = 0; k < n * 40 && pts.length < n; k++) {
          const r = Math.sqrt(Math.random()), a = Math.random() * 6.283, x = r * Math.cos(a), y = r * Math.sin(a);
          let ok = true;
          for (const p of pts) { const dx = p.x - x, dy = p.y - y; if (dx * dx + dy * dy < minD * minD) { ok = false; break; } }
          if (ok) pts.push({ x, y, r, a, s: 0.45 + Math.random() * 0.85, ph: Math.random() * 6.283, w: 0.5 + Math.random(), fl: Math.random() * 6.283 });
        }
        return pts;
      };
      const centers = (t) => {
        /* на десктопе центр композиции правее середины, сферы крупные: левая мягко заходит под текст (там почти прозрачная), правая в крайней точке чуть уходит за край */
        const b = S.box, dx = reduce ? 0 : Math.sin(t * 0.17), dy = reduce ? 0 : Math.cos(t * 0.21);
        /* на телефоне полоса короткая: центры у верхнего края, круги уходят за него и в стороны */
        const cx = S.wide ? S.W * (0.72 + 0.015 * dx) : S.short ? S.W * (0.5 + 0.03 * dx) : b.x + b.w * (0.5 + 0.03 * dx);
        const cy = S.wide ? S.H * (0.48 + 0.03 * dy) : S.short ? S.H * (0.2 + 0.05 * dy) : b.y + b.h * (0.5 + 0.04 * dy);
        const sep = R * (reduce ? 1.3 : (S.wide ? 1.38 : 1.45) + (S.wide ? 0.38 : 0.48) * Math.sin(t * 0.5));
        const ang = (S.wide ? 0.6 : S.short ? 0.14 : 0.44) + (reduce ? 0 : (S.wide || S.short ? 0.1 : 0.14) * Math.sin(t * 0.23));
        const hx = Math.cos(ang) * sep / 2, hy = Math.sin(ang) * sep / 2;
        let ox = 0, oy = 0;
        if (S.ptr.on) { ox = clamp((S.ptr.x - cx) * 0.08, -R * 0.18, R * 0.18); oy = clamp((S.ptr.y - cy) * 0.08, -R * 0.18, R * 0.18); }
        return [{ x: cx - hx, y: cy - hy }, { x: cx + hx + ox, y: cy + hy + oy }];
      };
      const drawCloud = (pts, C, O, rot, t) => {
        const col = S.col, rmax = S.wide ? 4.8 : 3.4;
        for (const p of pts) {
          const ang = p.a + rot, rr = p.r + 0.025 * Math.sin(t * 0.9 * p.w + p.ph);
          const x = C.x + Math.cos(ang) * rr * R, y = C.y + Math.sin(ang) * rr * R;
          const f = S.wide ? 1 - ss(0.42, 1, rr) : 1 - ss(0.3, 1.05, rr);
          const breath = reduce ? 1 : 0.7 + 0.3 * Math.sin(t * 1.1 * p.w + p.ph * 2);
          const field = reduce ? 1 : 0.85 + 0.15 * Math.sin(x * 0.021 + t * 0.5) * Math.cos(y * 0.018 - t * 0.4);
          let r = rmax * (0.16 + 0.84 * f) * p.s * breath * field;
          if (r < 0.35) continue;
          const mask = S.wide ? 0.1 + 0.9 * ss(S.W * 0.4, S.W * 0.6, x) : 1;
          const a = (0.4 + 0.6 * f) * col.k * mask;
          const depth = 1 - Math.hypot(x - O.x, y - O.y) / R;
          let v = 0;
          if (depth > 0) v = ss(0, 0.14, depth) * mask * (reduce ? 0.8 : ss(0.25, 0.75, 0.5 + 0.5 * Math.sin(t * 1.7 * p.w + p.fl)));
          if (v < 0.97) { c.fillStyle = rgba(col.dot, a * (1 - v)); c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill(); }
          if (v > 0.02) { c.globalAlpha = v; c.fillStyle = col.end; c.beginPath(); c.arc(x, y, r * (1 + 0.5 * v) + 0.6, 0, 6.283); c.fill(); c.globalAlpha = 1; }
        }
      };
      return {
        setup() {
          const b = S.box;
          /* на десктопе круги в своей зоне справа, на адаптивах крупнее: мягкий край может уходить за поле */
          R = S.wide ? S.H * 0.39 : S.short ? S.W * 0.34 : Math.min(b.h / 2.2, b.w / 2.5);
          gap = S.wide ? 22 : b.w > 500 ? 18 : 15;
          const n = Math.round(Math.PI * R * R / (gap * gap)), minD = gap / R * 0.78;
          A = cloud(n, minD); B = cloud(n, minD);
        },
        step() {},
        draw() {
          c.clearRect(0, 0, S.W, S.H);
          const t = S.time, [CA, CB] = centers(t);
          drawCloud(A, CA, CB, reduce ? 0 : t * 0.07, t);
          drawCloud(B, CB, CA, reduce ? 0.9 : -t * 0.06 + 0.9, t);
        }
      };
    }
  };

  const arts = [];
  document.querySelectorAll('[data-hero-art]').forEach(art => {
    const hr = art.closest('.hr'), cv = art.querySelector('canvas'), c = cv.getContext('2d');
    const S = { W: 0, H: 0, dpr: 1, wide: false, light: false, mode: art.dataset.mode, box: { x: 0, y: 0, w: 0, h: 0 }, col: {}, time: 0, ptr: { x: 0, y: 0, on: false } };
    const scene = SCENES[art.dataset.heroArt](S, c);
    let raf = 0, running = false, last = 0;
    const readColors = () => {
      const cs = getComputedStyle(hr), g = (n) => cs.getPropertyValue(n).trim();
      S.light = hr.dataset.tone === 'light';
      S.col = { dot: g('--fl-dot'), end: g('--fl-end'), ring: g('--fl-ring'), k: parseFloat(g('--fl-alpha')) || 1, chip: g('--fl-chip'), chipInk: g('--fl-chip-ink'), lens: g('--fl-lens'), on: g('--fl-on'), onInk: g('--fl-on-ink') };
    };
    const resize = () => {
      const r = cv.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      S.dpr = Math.min(2, window.devicePixelRatio || 1); S.W = r.width; S.H = r.height;
      cv.width = Math.round(S.W * S.dpr); cv.height = Math.round(S.H * S.dpr); c.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      S.wide = getComputedStyle(art).position === 'absolute';
      S.short = !S.wide && S.H < 220;
      S.box = S.wide ? { x: S.W * 0.53, y: S.H * 0.06, w: S.W * 0.45, h: S.H * 0.84 } : { x: 10, y: 10, w: S.W - 20, h: S.H - 20 };
      readColors(); scene.setup(); scene.prepare && scene.prepare(); scene.draw();
    };
    const frame = (now) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now; S.time += dt;
      scene.step(dt); scene.draw();
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (reduce || running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
      hr.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); S.ptr.x = e.clientX - r.left; S.ptr.y = e.clientY - r.top; S.ptr.on = true; });
      hr.addEventListener('pointerleave', () => { S.ptr.on = false; });
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(cv); else window.addEventListener('resize', resize);
    resize();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => scene.draw());
    watch(hr, start, stop, 0.1);
    arts.push({ hr, refresh: () => { readColors(); scene.prepare && scene.prepare(); scene.draw(); } });
  });
})();
