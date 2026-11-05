/* Лендинг «Детская психология»: дата старта, время занятий и часы из CMS.
   Остальные части (форма, FAQ, номер посетителя Метрики) добавятся вместе со своими блоками. */
(() => {
  /* ---------- Дата старта, время занятий и часы из CMS ----------
     Дату и время занятий берём из ближайшего потока курса (/api/public/course/child-psy), часы — из каталога
     (/api/public/catalog): в ответе курса их нет. Куда ставить, задают метки data-cms в разметке:
     start — «Старт 25 марта», start-date — только дата («25 марта», в строке «Ближайший старт потока: …»),
     schedule — «По четвергам, 12:00–15:00», hours — «500 академических часов».
     Если API не ответил или поле в CMS пустое, остаётся текст из разметки. */
  const API = 'https://modern-psy-asp-prod-8ceb.twc1.net';
  const SLUG = 'child-psy';
  const getJson = path => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    return fetch(API + path, { headers: { Accept: 'application/json' }, signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); })
      .finally(() => clearTimeout(timer));
  };
  const put = (key, text) => document.querySelectorAll(`[data-cms="${key}"]`).forEach(node => { node.textContent = text; node.dataset.cmsState = 'ready'; });
  if (document.querySelector('[data-cms="start"], [data-cms="start-date"], [data-cms="enrollment-start"], [data-cms="schedule"]')) {
    getJson('/api/public/course/' + SLUG)
      .then(course => {
        const stream = course.nearestStream || {};
        const date = new Date((stream.startDate || '') + 'T00:00:00Z');
        if (Number.isFinite(date.getTime())) {
          const start = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date).replace(' ', ' ');
          put('start', 'Старт ' + start);
          put('start-date', start);
          put('enrollment-start', 'Занятия начнутся ' + start);
        } else {
          console.warn('[child-psy] в CMS нет даты ближайшего потока, остался текст страницы');
        }
        /* «По четвергам 12:00–15:00» из CMS → «По четвергам, 12:00–15:00»: запятая перед временем, как в макете */
        const schedule = (stream.schedule || '').trim().replace(/\s+(\d{1,2}:\d{2})/, ', $1');
        if (schedule) put('schedule', schedule);
        else console.warn('[child-psy] в CMS нет расписания потока, осталось время со страницы');
      })
      .catch(error => console.warn('[child-psy] поток из CMS не загружен, остался текст страницы', error));
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
      .catch(error => console.warn('[child-psy] часы из CMS не загружены, остался текст страницы', error));
  }
})();

/* ---------- Блок «Много практики»: переключатель «Малая группа / Большая группа» ----------
   Меняет схему в сцене плитки (атрибут data-mode у сцены, вид задаёт page.css). Без скрипта переключатель
   скрыт и видна малая группа. Сцена — иллюстрация, для скринридера она скрыта; текст плитки не меняется. */
(() => {
  document.querySelectorAll('[data-practice-switch]').forEach(switcher => {
    const tile = switcher.closest('.child-psy-practice_tile');
    const stage = tile && tile.querySelector('[data-practice-stage]');
    if (!stage) return;
    const buttons = switcher.querySelectorAll('button[data-mode]');
    buttons.forEach(button => button.addEventListener('click', () => {
      stage.dataset.mode = button.dataset.mode;
      buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    }));
    switcher.hidden = false;
  });
})();

/* ---------- Вопросы и ответы: открыт один вопрос за раз (как на /neurodivergence) ---------- */
(() => {
  document.querySelectorAll('[data-faq]').forEach(list => {
    const items = [...list.querySelectorAll('[data-faq-item]')];
    items.forEach(item => item.addEventListener('toggle', () => {
      if (item.open) items.forEach(other => { if (other !== item) other.open = false; });
    }));
  });
})();

/* ---------- Номер посетителя Метрики в заявке (как на /neurodivergence) ----------
   Общая форма заявки (request-form.js) передаёт в нативную форму Тильды child-psy имя, телефон, мессенджер,
   form_source и устройство. Добавляем в форму Тильды скрытое поле ym_client_id и кладём в него номер из куки
   _ym_uid; общий скрипт сайта в head тоже заполняет это поле перед отправкой. На превью формы Тильды нет. */
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
