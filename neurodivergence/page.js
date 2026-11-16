/* Лендинг «Психотерапия нейроотличных клиентов: РАС и СДВГ»: дата старта и часы из CMS, FAQ,
   номер посетителя Метрики для формы заявки.
   Форма заявки — общий компонент Академии, отдельный файл request-form.js. Блок цены несёт свой скрипт внутри. */
(() => {
  /* ---------- Номер посетителя Метрики в заявке ----------
     Общая форма заявки (request-form.js) передаёт в форму Тильды имя, телефон, мессенджер, form_source и устройство.
     Добавляем в форму Тильды скрытое поле ym_client_id и кладём в него номер из куки _ym_uid;
     общий скрипт сайта в head тоже заполняет это поле перед отправкой. */
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

  /* ---------- Дата старта и часы из CMS ----------
     Дату берём из ближайшего потока курса (/api/public/course/neurodivergence), часы — из каталога
     (/api/public/catalog): в ответе курса их нет. Куда ставить, задают метки data-cms в разметке:
     start — «Старт 23 января», enrollment-start — заголовок формы, hours — «80 академических часов».
     Если API не ответил, остаются тексты из разметки. Цены и микроразметку курса обновляет блок цены сам. */
  const API = 'https://modern-psy-asp-prod-8ceb.twc1.net';
  const SLUG = 'neurodivergence';
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
        const date = new Date((course.nearestStream?.startDate || '') + 'T00:00:00Z');
        if (!Number.isFinite(date.getTime())) throw new Error('в CMS нет ближайшего потока');
        const start = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date).replace(' ', ' ');
        put('start', 'Старт ' + start);
        put('enrollment-start', 'Занятия начнутся ' + start);
      })
      .catch(error => console.warn('[neurodivergence] дата старта из CMS не загружена, остался текст страницы', error));
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
      .catch(error => console.warn('[neurodivergence] часы из CMS не загружены, остался текст страницы', error));
  }

  /* ---------- FAQ: открыт один вопрос за раз ---------- */
  document.querySelectorAll('[data-faq]').forEach(list => {
    const items = [...list.querySelectorAll('[data-faq-item]')];
    items.forEach(item => item.addEventListener('toggle', () => {
      if (item.open) items.forEach(other => { if (other !== item) other.open = false; });
    }));
  });
})();
