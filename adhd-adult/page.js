/* Лендинг «Коучинг взрослых людей с СДВГ» (modern-psy.ru/adhd-adult).
   Цены, рассрочку и микроразметку курса обновляет сам блок цены. Здесь — остальные данные из CMS
   (старт, часы), вопросы-ответы и номер посетителя Метрики для формы. */
(() => {
  /* ---------- Старт и часы из CMS ----------
     Старт берём из ближайшего потока курса (/api/public/course/adhd-adult), часы — из каталога
     (/api/public/catalog): в ответе курса их нет. Куда ставить, задают метки data-cms в разметке:
       start            — «Старт 13 марта» в первом экране;
       enrollment-start — заголовок формы «Занятия начнутся 13 марта»;
       hours            — «16 академических часов» в фактах первого экрана.
     Если поток в листе ожидания или у него нет даты, вместо даты: «Формируем лист ожидания»
     и «Запишитесь в лист ожидания» (как на старой странице).
     Если API не ответил или поле в CMS пустое, остаётся текст из разметки. */
  const API = 'https://modern-psy-asp-prod-8ceb.twc1.net';
  const SLUG = 'adhd-adult';
  const getJson = path => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    return fetch(API + path, { headers: { Accept: 'application/json' }, signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); })
      .finally(() => clearTimeout(timer));
  };
  const put = (key, text) => document.querySelectorAll(`[data-cms="${key}"]`).forEach(node => { node.textContent = text; node.dataset.cmsState = 'ready'; });
  if (document.querySelector('[data-cms="start"], [data-cms="enrollment-start"]')) {
    getJson('/api/public/course/' + SLUG)
      .then(course => {
        const stream = course.nearestStream || {};
        const date = new Date((stream.startDate || '') + 'T00:00:00Z');
        const waitlist = /лист ожидания/i.test(stream.status || '') || !Number.isFinite(date.getTime());
        if (waitlist) {
          put('start', 'Формируем лист ожидания');
          put('enrollment-start', 'Запишитесь в лист ожидания');
          return;
        }
        /* «13 марта» с неразрывным пробелом между числом и месяцем */
        const start = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date).replace(' ', ' ');
        put('start', 'Старт ' + start);
        put('enrollment-start', 'Занятия начнутся ' + start);
      })
      .catch(error => console.warn('[adhd-adult] поток из CMS не загружен, остался текст страницы', error));
  }
  if (document.querySelector('[data-cms="hours"]')) {
    getJson('/api/public/catalog')
      .then(catalog => {
        const hours = catalog.cards?.find(card => card.slug === SLUG)?.hours;
        if (!Number.isInteger(hours) || hours <= 0) throw new Error('в каталоге нет часов курса');
        const last = hours % 10, lastTwo = hours % 100;
        const word = last === 1 && lastTwo !== 11 ? 'академический час'
          : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'академических часа' : 'академических часов';
        put('hours', hours + ' ' + word);
      })
      .catch(error => console.warn('[adhd-adult] часы из CMS не загружены, остался текст страницы', error));
  }
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
