/* Лендинг «АСТ: Терапия принятия и ответственности»: даты потоков и часы из CMS.
   Ниже — остальные части страницы, у каждой свой раздел. */

(() => {
  /* ---------- Даты потоков и часы из CMS ----------
     Даты берём из потоков курса (/api/public/course/act), часы — из каталога (/api/public/catalog):
     в ответе курса их нет. Куда ставить, задают метки data-cms в разметке:
     starts — «Старт 1 февраля и 17 мая» (все потоки с открытым набором, не больше двух, по порядку дат),
     enrollment-start — заголовок формы «Занятия начнутся 1 февраля» (ближайший открытый поток);
     hours — «425 академических часов».
     Если открытых потоков нет, в заголовок формы — «Запишитесь в лист ожидания».
     Если API не ответил или поле в CMS пустое, остаётся текст из разметки. */
  const API = 'https://modern-psy-asp-prod-8ceb.twc1.net';
  const SLUG = 'act';
  const getJson = path => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    return fetch(API + path, { headers: { Accept: 'application/json' }, signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); })
      .finally(() => clearTimeout(timer));
  };
  const put = (key, text) => document.querySelectorAll(`[data-cms="${key}"]`).forEach(node => { node.textContent = text; node.dataset.cmsState = 'ready'; });
  const dayMonth = date => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date).replace(' ', ' ');

  if (document.querySelector('[data-cms="starts"], [data-cms="enrollment-start"]')) {
    getJson('/api/public/course/' + SLUG)
      .then(course => {
        // Потоки с открытым набором и датой в будущем; закрытые и лист ожидания в строку старта не идут.
        const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
        const dates = (course.streams || [])
          .filter(stream => stream.status !== 'Набор закрыт' && stream.status !== 'Лист ожидания')
          .map(stream => new Date((stream.startDate || '') + 'T00:00:00Z'))
          .filter(date => Number.isFinite(date.getTime()) && date >= today)
          .sort((a, b) => a - b)
          .slice(0, 2);
        if (dates.length) {
          put('starts', 'Старт ' + dates.map(dayMonth).join(' и '));
          put('enrollment-start', 'Занятия начнутся ' + dayMonth(dates[0]));
        } else {
          put('enrollment-start', 'Запишитесь в лист ожидания');
          console.warn('[act] в CMS нет открытых потоков с датой, в первом экране остался текст страницы');
        }
      })
      .catch(error => console.warn('[act] потоки из CMS не загружены, остался текст страницы', error));
  }
  if (document.querySelector('[data-cms="hours"]')) {
    getJson('/api/public/catalog')
      .then(catalog => {
        const hours = catalog.cards?.find(card => card.slug === SLUG)?.hours;
        if (!Number.isInteger(hours) || hours <= 0) throw new Error('в каталоге нет часов курса');
        const last = hours % 10, lastTwo = hours % 100;
        const word = last === 1 && lastTwo !== 11 ? 'академический час'
          : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'академических часа' : 'академических часов';
        put('hours', hours + ' ' + word);
      })
      .catch(error => console.warn('[act] часы из CMS не загружены, остался текст страницы', error));
  }
})();

/* ---------- Сильное сообщество: список конференций ----------
   Выбор в списке меняет обложку, подпись на видео и описание под списком; видео Kinescope грузится только
   по кнопке «Смотреть, как это было». Стрелки, Home и End переключают конференции с клавиатуры. */
(() => {
  document.querySelectorAll('[data-conf]').forEach(root => {
    const box = root.querySelector('[data-conf-video]');
    const tabs = [...root.querySelectorAll('[data-conf-tab]')];
    if (!box || !tabs.length) return;
    let current = tabs.find(tab => tab.classList.contains('is-active')) || tabs[0];
    const select = (tab, focus) => {
      current = tab;
      tabs.forEach(other => {
        const active = other === tab;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-selected', String(active));
        other.tabIndex = active ? 0 : -1;
      });
      root.querySelectorAll('.act-conf_story').forEach(story => { story.hidden = story.id !== tab.dataset.confStory; });
      box.querySelector('iframe')?.remove();
      box.querySelector('[data-conf-poster-img]').src = tab.dataset.confPoster;
      box.querySelector('[data-conf-caption]').textContent = tab.dataset.confName + ', ' + tab.dataset.confYear;
      box.setAttribute('aria-labelledby', tab.id);
      if (focus) tab.focus();
    };
    tabs.forEach(tab => tab.addEventListener('click', () => select(tab, false)));
    root.querySelector('[role="tablist"]').addEventListener('keydown', event => {
      const index = tabs.indexOf(event.target.closest('[data-conf-tab]'));
      if (index < 0) return;
      const last = tabs.length - 1;
      const to = { ArrowDown: index + 1, ArrowRight: index + 1, ArrowUp: index - 1, ArrowLeft: index - 1, Home: 0, End: last }[event.key];
      if (to === undefined) return;
      event.preventDefault();
      select(tabs[to < 0 ? last : to > last ? 0 : to], true);
    });
    box.querySelector('[data-conf-play]').addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.src = 'https://kinescope.io/embed/' + current.dataset.confKin + '?autoplay=1';
      frame.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      frame.title = 'Видеоотчёт: ' + current.dataset.confName;
      box.append(frame);
    });
  });
})();

/* ---------- Программа обучения: модули вкладками (как на /treningi-dlya-detey) ----------
   Кнопка модуля показывает его панель; стрелки, Home и End переключают модули с клавиатуры.
   При переключении панель коротко выезжает сбоку, при «меньше движения» — сразу. Без скрипта видны все модули. */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-program-tabs]').forEach(block => {
    const tabs = [...block.querySelectorAll('[data-program-tab]')];
    const panels = [...block.querySelectorAll('[data-program-panel]')];
    if (!tabs.length || !panels.length) return;
    block.setAttribute('data-ready', '');
    const select = (tab, animate) => {
      tabs.forEach(item => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      panels.forEach(panel => {
        const isTarget = panel.id === tab.getAttribute('aria-controls');
        panel.hidden = !isTarget;
        panel.classList.remove('is-entering');
        if (isTarget && animate && !reducedMotion.matches) { void panel.offsetWidth; panel.classList.add('is-entering'); }
      });
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab, true));
      tab.addEventListener('keydown', event => {
        const delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
        const jump = { Home: 0, End: tabs.length - 1 }[event.key];
        if (delta === undefined && jump === undefined) return;
        event.preventDefault();
        const next = tabs[jump ?? (index + delta + tabs.length) % tabs.length];
        next.focus();
        select(next, true);
      });
    });
    select(tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0], false);
  });
})();

/* ---------- Преподаватели: имена, стрелки и лента связаны (как блок на «Клинической психологии») ----------
   Клик по имени прокручивает ленту к карточке (не всю страницу), стрелки листают по одной карточке.
   При прокрутке ленты подсвечивается имя первой видимой карточки, стрелки гаснут на краях.
   Без скрипта имена — обычные якоря, стрелки скрыты. */
(() => {
  document.querySelectorAll('[data-tutors]').forEach(root => {
    const track = root.querySelector('[data-tutors-track]');
    const tabs = [...root.querySelectorAll('[data-tutor-tab]')];
    const slides = [...root.querySelectorAll('.act-tutors_slide')];
    const prev = root.querySelector('[data-tutors-prev]');
    const next = root.querySelector('[data-tutors-next]');
    const controls = root.querySelector('[data-tutors-controls]');
    if (!track || !slides.length || !prev || !next) return;
    controls.hidden = false;
    let picked = 0;
    const step = () => (slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth);
    const visible = () => Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / step())));
    const mark = index => {
      tabs.forEach((tab, i) => { if (i === index) tab.setAttribute('aria-current', 'true'); else tab.removeAttribute('aria-current'); });
      const box = tabs[index] && tabs[index].parentElement;
      if (box && box.scrollWidth > box.clientWidth) box.scrollTo({ left: tabs[index].offsetLeft - 12, behavior: 'smooth' });
    };
    // left — позиция, к которой лента едет; без неё берём текущую
    const update = (left = track.scrollLeft) => {
      const max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = left <= 2;
      next.disabled = left >= max;
      // у конца ленты последние карточки уже не прокрутить к началу: оставляем выбранное имя
      const shown = Math.max(0, Math.min(slides.length - 1, Math.round(left / step())));
      mark(left >= max ? Math.max(shown, picked) : shown);
    };
    const go = index => {
      picked = index;
      const left = Math.min(track.scrollWidth - track.clientWidth, slides[index].offsetLeft - slides[0].offsetLeft);
      track.scrollTo({ left });
      update(left);
      mark(index);
    };
    tabs.forEach((tab, index) => tab.addEventListener('click', event => { event.preventDefault(); go(index); }));
    prev.addEventListener('click', () => go(Math.max(0, picked - 1)));
    next.addEventListener('click', () => go(Math.min(slides.length - 1, picked + 1)));
    // листание пальцем: выбранная карточка — первая видимая
    track.addEventListener('scroll', () => { if (track.scrollLeft < track.scrollWidth - track.clientWidth - 2) picked = visible(); update(); }, { passive: true });
    window.addEventListener('resize', () => update());
    update();
  });
})();

/* ---------- Отзывы: лента со стрелками и видео по нажатию ----------
   Стрелки листают по одной карточке и гаснут на краях ленты; без скрипта стрелки скрыты,
   лента листается пальцем. Нажатие на обложку заменяет её плеером Kinescope с автозапуском. */
(() => {
  document.querySelectorAll('[data-slider]').forEach(root => {
    const track = root.querySelector('[data-slider-track]');
    const prev = root.querySelector('[data-slider-prev]');
    const next = root.querySelector('[data-slider-next]');
    const slides = track ? [...track.querySelectorAll(':scope > ul > li')] : [];
    if (!track || !prev || !next || !slides.length) return;
    root.querySelector('[data-slider-controls]').hidden = false;
    const step = () => (slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth);
    const index = () => Math.round(track.scrollLeft / step());
    const max = () => track.scrollWidth - track.clientWidth;
    // left — позиция, к которой лента едет; без неё берём текущую
    const update = (left = track.scrollLeft) => {
      prev.disabled = left <= 2;
      next.disabled = left >= max() - 2;
    };
    let target = 0;
    const go = i => {
      target = Math.min(max(), slides[Math.max(0, Math.min(slides.length - 1, i))].offsetLeft - slides[0].offsetLeft);
      track.scrollTo({ left: target });
      update(target);
    };
    // во время плавной прокрутки считаем от позиции назначения, иначе быстрые нажатия «съедаются»
    const from = () => Math.round((Math.abs(track.scrollLeft - target) > 2 ? target : track.scrollLeft) / step());
    prev.addEventListener('click', () => go(from() - 1));
    next.addEventListener('click', () => go(from() + 1));
    // состояние стрелок обновляется прямо при прокрутке: расчёт дешёвый, кадры анимации не нужны
    track.addEventListener('scroll', () => { target = track.scrollLeft; update(); }, { passive: true });
    window.addEventListener('resize', () => update());
    update();
  });
  document.querySelectorAll('[data-review-play]').forEach(button => button.addEventListener('click', () => {
    const box = button.closest('[data-review-video]');
    const frame = document.createElement('iframe');
    frame.src = 'https://kinescope.io/embed/' + box.dataset.reviewVideo + '?autoplay=1';
    frame.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    frame.allowFullscreen = true;
    frame.title = button.getAttribute('aria-label');
    box.replaceChildren(frame);
  }));
})();

/* ---------- Вопросы и ответы: открыт один вопрос за раз (как на /child-psy и /adhd-adult) ---------- */
(() => {
  document.querySelectorAll('[data-faq]').forEach(list => {
    const items = [...list.querySelectorAll('[data-faq-item]')];
    items.forEach(item => item.addEventListener('toggle', () => {
      if (item.open) items.forEach(other => { if (other !== item) other.open = false; });
    }));
  });
})();

/* ---------- Номер посетителя Метрики в заявке (как на /child-psy и /adhd-adult) ----------
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
