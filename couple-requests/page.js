/* Лендинг «Работа с темой отношений в практике психолога»: дата старта, время занятий и часы из CMS,
   вопросы и ответы, номер посетителя Метрики в заявке. Цены и бронь берёт сам блок цены (генератор /pricing). */
(() => {
  /* ---------- Дата старта, время занятий и часы из CMS ----------
     Два запроса к Public API:
     • каталог (/api/public/catalog) — часы курса и режим набора: идёт набор с датой старта или лист ожидания.
       Режим считает сама CMS по тем же правилам, что каталог и расписание: прошедший поток или поток
       со статусом «Лист ожидания» — это лист ожидания;
     • курс (/api/public/course/couple-requests) — расписание потока («По четвергам 18:00–20:30»).
     Куда ставить, задают метки data-cms в разметке:
       start — строка над кнопкой первого экрана: «Старт 8 октября» или «Запись в лист ожидания»;
       enrollment-start — заголовок формы: «Занятия начнутся 8 октября» или «Запишитесь в лист ожидания»;
       hours — «30 академических часов»;
       schedule — «По четвергам, 18:00–20:30» (факт под первым экраном);
       schedule-sentence — «Занятия проходят по четвергам с 18:00 до 20:30» (подзаголовок программы).
     Если API не ответил или поле в CMS пустое, остаётся текст из разметки. */
  const API = 'https://modern-psy-asp-prod-8ceb.twc1.net';
  const SLUG = 'couple-requests';
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
    /* «8 октября» с неразрывным пробелом между числом и месяцем */
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date).replace(' ', ' ');
  };
  const hoursText = hours => {
    const last = hours % 10, lastTwo = hours % 100;
    const word = last === 1 && lastTwo !== 11 ? 'академический час'
      : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'академических часа' : 'академических часов';
    return hours + ' ' + word;
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
      if (Number.isInteger(card.hours) && card.hours > 0) put('hours', hoursText(card.hours));
      else console.warn('[couple-requests] в каталоге нет часов курса, остался текст страницы');
      const start = card.mode !== 'waitlist' && card.startDate ? dayMonth(card.startDate) : '';
      if (start) {
        put('start', 'Старт ' + start);
        put('enrollment-start', 'Занятия начнутся ' + start);
      } else if (card.mode === 'waitlist') {
        put('start', 'Запись в лист ожидания');
        put('enrollment-start', 'Запишитесь в лист ожидания');
      }
    })
    .catch(error => console.warn('[couple-requests] каталог CMS не загружен, остался текст страницы', error));

  /* Время занятий — из потока, который сейчас продаётся (его дата в каталоге), иначе из ближайшего потока курса */
  Promise.all([course, catalog.catch(() => null)])
    .then(([data, card]) => {
      const streams = data.streams || [];
      const stream = (card && card.startDate && streams.find(item => item.startDate === card.startDate)) || data.nearestStream || streams[0] || {};
      const schedule = (stream.schedule || '').trim();
      if (!schedule) { console.warn('[couple-requests] в CMS нет расписания потока, осталось время со страницы'); return; }
      /* «По четвергам 18:00–20:30» → «По четвергам, 18:00–20:30» (запятая перед временем) */
      put('schedule', schedule.replace(/\s+(\d{1,2}:\d{2})/, ', $1').replace(/^(\S+)\s/, '$1 '));
      /* → «Занятия проходят по четвергам с 18:00 до 20:30», как было на странице */
      const sentence = schedule
        .replace(/(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})/, 'с $1 до $2')
        .replace(/^(\S+)\s/, '$1 ');
      put('schedule-sentence', 'Занятия проходят ' + sentence.charAt(0).toLowerCase() + sentence.slice(1));
    })
    .catch(error => console.warn('[couple-requests] поток из CMS не загружен, остался текст страницы', error));
})();

/* ---------- Вопросы и ответы: открыт один вопрос за раз (как на /child-psy) ---------- */
(() => {
  document.querySelectorAll('[data-faq]').forEach(list => {
    const items = [...list.querySelectorAll('[data-faq-item]')];
    items.forEach(item => item.addEventListener('toggle', () => {
      if (item.open) items.forEach(other => { if (other !== item) other.open = false; });
    }));
  });
})();

/* ---------- Номер посетителя Метрики в заявке (как на /child-psy) ----------
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
