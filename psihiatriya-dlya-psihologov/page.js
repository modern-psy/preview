/* Лендинг «Психиатрия для психологов»: колода ситуаций, лист разбора случая, точечная иллюстрация первого экрана, форма. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* ---------- Заявка: отправка через скрытую форму Тильды ----------
     На modern-psy.ru на странице стоит обычный блок с формой Тильды, его имя указано в data-tilda-form-name у <form>.
     Эта форма и есть канал в AmoCRM: скрипт прячет её, переносит в неё имя, телефон и мессенджер и отправляет.
     На превью формы Тильды нет: заявка никуда не уходит, сразу показываем ответ «Заявка отправлена», чтобы его было видно.
     🟡 Имена полей ниже должны совпадать с настройками формы в Тильде буква в букву.
        Если поля с таким именем в форме нет, скрипт добавит его скрытым. */
  const LEAD = {
    fields: { name: 'Name', phone: 'Phone', messenger: 'messenger', source: 'form_source', clientId: 'ym_client_id' },
    utm: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'],
    messengers: { max: 'MAX', telegram: 'Telegram' },
    errors: { name: 'Напишите, как к вам обращаться', phone: 'Проверьте номер телефона', send: 'Не получилось отправить заявку. Проверьте интернет и попробуйте ещё раз.' },
    timeout: 10000
  };
  const isProduction = /(^|\.)modern-psy\.ru$/.test(location.hostname);
  const normalizePhone = v => {
    const raw = String(v || '').trim(), d = raw.replace(/\D/g, '');
    if (!d) return '';
    if (raw.startsWith('+')) return '+' + d;
    if (d.length === 11 && d.startsWith('8')) return '+7' + d.slice(1);
    if (d.length === 10) return '+7' + d;
    return '+' + d;
  };
  const phoneOk = p => { const d = p.replace(/\D/g, ''); return d.startsWith('7') ? d.length === 11 : d.length >= 10 && d.length <= 15; };
  /* метки utm живут в адресе только на первом шаге, запоминаем их на время визита */
  const readUtm = () => {
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem('psy-utm') || '{}') || {}; } catch (e) { saved = {}; }
    const q = new URLSearchParams(location.search), fresh = {};
    LEAD.utm.forEach(k => { const v = (q.get(k) || '').trim(); if (v) fresh[k] = v; });
    const all = Object.assign({}, saved, fresh);
    if (Object.keys(fresh).length) { try { sessionStorage.setItem('psy-utm', JSON.stringify(all)); } catch (e) { /* приватный режим */ } }
    return all;
  };
  /* номер посетителя Метрики лежит в куке _ym_uid */
  const ymClientId = () => (document.cookie.match(/(?:^|;\s*)_ym_uid=([^;]+)/) || [])[1] || '';
  /* форму ищем по имени; если имя не совпало, но форма на странице одна, берём её и предупреждаем в консоли */
  const findTildaForm = name => {
    const forms = [...document.querySelectorAll('form.t-form')];
    const byName = forms.find(f => f.querySelector('input[name="tildaspec-formname"]')?.value === name);
    if (byName) return byName;
    if (forms.length === 1) {
      console.warn('[заявка] Формы «' + name + '» на странице нет, работаем с единственной формой Тильды. Поправьте data-tilda-form-name или имя формы в Тильде.');
      return forms[0];
    }
    return null;
  };
  const hideTildaForm = name => {
    const form = findTildaForm(name);
    if (!form) return null;
    const rec = form.closest('.t-rec') || form;
    rec.setAttribute('data-psy-native-form', '');
    rec.setAttribute('aria-hidden', 'true');
    return form;
  };
  /* значение ставим «родным» сеттером и шлём input/change, иначе скрипты Тильды не заметят заполненное поле */
  const setValue = (input, value) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (setter) setter.call(input, value); else input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const setField = (form, name, value) => {
    let input = form.querySelector('input[name="' + name + '"]');
    if (!(input instanceof HTMLInputElement)) {
      input = document.createElement('input');
      input.type = 'hidden'; input.name = name;
      form.appendChild(input);
    }
    setValue(input, value);
  };
  /* телефон с маской Тильды заполняем через саму Тильду, иначе она пересчитает номер из пустой маски */
  const setPhone = (form, phone) => {
    const group = form.querySelector('.t-input-group_ph');
    if (group && typeof window.t_form_phonemask__setValue === 'function') {
      try { window.t_form_phonemask__setValue(group, phone, undefined, { noFocus: true }); } catch (e) { console.warn('[заявка] Тильда не приняла номер в поле с маской.', e); }
    }
    setField(form, LEAD.fields.phone, phone);
  };
  /* обязательные поля формы Тильды, которых нет на странице, не дали бы отправить заявку: снимаем обязательность только с пустых */
  const relax = form => form.querySelectorAll('[required], [data-tilda-rule], [data-tilda-req]').forEach(f => {
    if (String(f.value || '').trim()) return;
    f.removeAttribute('required'); f.removeAttribute('data-tilda-rule'); f.removeAttribute('data-tilda-req');
  });
  /* ответ Тильды приходит событием: success, error или timeout, если не ответила */
  let waits = 0;
  const waitTilda = (form, ms) => new Promise(resolve => {
    const ns = '.psyLead' + (++waits);
    let done = false, timer = 0;
    const mine = (e, passed) => { const f = passed instanceof HTMLFormElement ? passed : e?.detail?.form || e?.target; return !(f instanceof HTMLFormElement) || f === form; };
    const ok = (e, f) => { if (mine(e, f)) finish('success'); };
    const fail = (e, f) => { if (mine(e, f)) finish('error'); };
    const finish = r => {
      if (done) return; done = true; clearTimeout(timer);
      document.removeEventListener('tildaform:aftersuccess', ok); document.removeEventListener('tildaform:aftererror', fail);
      if (typeof window.jQuery === 'function') window.jQuery(document).off(ns);
      resolve(r);
    };
    document.addEventListener('tildaform:aftersuccess', ok); document.addEventListener('tildaform:aftererror', fail);
    if (typeof window.jQuery === 'function') { window.jQuery(document).on('tildaform:aftersuccess' + ns, ok); window.jQuery(document).on('tildaform:aftererror' + ns, fail); }
    timer = setTimeout(() => finish('timeout'), ms);
  });
  const sendToTilda = async (formName, values) => {
    const native = hideTildaForm(formName);
    if (!native) {
      const msg = '[заявка] Формы Тильды «' + formName + '» на странице нет, заявка не отправлена.';
      if (isProduction) console.error(msg); else console.info(msg + ' Это превью, так и должно быть.', values);
      return 'skipped';
    }
    Object.entries(values).forEach(([k, v]) => k === LEAD.fields.phone ? setPhone(native, v) : setField(native, k, v));
    const utm = readUtm();
    setField(native, LEAD.fields.clientId, ymClientId());
    LEAD.utm.forEach(k => setField(native, k, utm[k] || ''));
    relax(native);
    const answer = waitTilda(native, LEAD.timeout);
    const btn = native.querySelector('button[type="submit"]:not(:disabled), input[type="submit"]:not(:disabled)');
    if (btn) native.requestSubmit(btn); else native.requestSubmit();
    return answer;
  };
  document.querySelectorAll('[data-lead-form]').forEach(form => {
    const box = form.parentElement, name = form.dataset.tildaFormName || '', source = form.dataset.leadSource || document.title;
    const nameInput = form.querySelector('input[name="name"]'), phoneInput = form.querySelector('input[name="phone"]');
    const submit = form.querySelector('.lf-submit'), status = form.querySelector('[data-lead-status]');
    const done = box.querySelector('[data-lead-success]'), doneMessenger = box.querySelector('[data-lead-success-messenger]');
    const label = submit.textContent;
    let busy = false;
    readUtm();
    /* форму Тильды прячем сразу, как она появится на странице */
    if (name && !hideTildaForm(name)) {
      const mo = new MutationObserver(() => { if (hideTildaForm(name)) mo.disconnect(); });
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => mo.disconnect(), 10000);
    }
    const checks = { name: () => nameInput.value.trim() ? '' : LEAD.errors.name, phone: () => phoneOk(normalizePhone(phoneInput.value)) ? '' : LEAD.errors.phone };
    const inputs = { name: nameInput, phone: phoneInput };
    const setStatus = (text = '') => { status.textContent = text; };
    Object.entries(inputs).forEach(([k, input]) => input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true' && !checks[k]()) { input.removeAttribute('aria-invalid'); setStatus(); }
    }));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (busy) return;
      const bad = Object.keys(checks).filter(k => checks[k]());
      Object.keys(inputs).forEach(k => bad.includes(k) ? inputs[k].setAttribute('aria-invalid', 'true') : inputs[k].removeAttribute('aria-invalid'));
      if (bad.length) { setStatus(checks[bad[0]]()); inputs[bad[0]].focus(); return; }
      const messenger = form.querySelector('input[name="messenger"]:checked')?.value || 'max';
      busy = true; submit.disabled = true; submit.textContent = 'Отправляем…'; setStatus();
      let result = 'error';
      try {
        result = await sendToTilda(name, {
          [LEAD.fields.name]: nameInput.value.trim(),
          [LEAD.fields.phone]: normalizePhone(phoneInput.value),
          [LEAD.fields.messenger]: LEAD.messengers[messenger] || messenger,
          [LEAD.fields.source]: source
        });
      } catch (err) { console.error('[заявка] Не получилось отправить заявку в Тильду.', err); }
      busy = false; submit.disabled = false; submit.textContent = label;
      if (result === 'success' || (result === 'skipped' && !isProduction)) {
        if (doneMessenger) doneMessenger.textContent = LEAD.messengers[messenger] || 'мессенджер';
        form.hidden = true;
        if (done) { done.hidden = false; done.focus(); }
        return;
      }
      if (result === 'timeout') console.warn('[заявка] Тильда не ответила вовремя.');
      setStatus(LEAD.errors.send);
    });
  });

  /* ---------- FAQ: открыт один вопрос за раз ---------- */
  document.querySelectorAll('[data-faq]').forEach(list => {
    const items = [...list.querySelectorAll('[data-faq-item]')];
    items.forEach(item => item.addEventListener('toggle', () => {
      if (item.open) items.forEach(other => { if (other !== item) other.open = false; });
    }));
  });

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
          /* на десктопе левый край под текстом почти прозрачный, нижний край тает над полосой фактов */
          const mask = S.wide ? (0.1 + 0.9 * ss(S.W * 0.4, S.W * 0.6, x)) * (1 - ss(S.H * 0.8, S.H * 0.99, y)) : 1;
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
          /* на десктопе круги в своей зоне справа, на адаптивах крупнее: мягкий край может уходить за поле.
             Зона на десктопе ниже карточки на полосу фактов, поэтому доля 0.47: размер кругов прежний, около 290 px */
          R = S.wide ? S.H * 0.47 : S.short ? S.W * 0.34 : Math.min(b.h / 2.2, b.w / 2.5);
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
