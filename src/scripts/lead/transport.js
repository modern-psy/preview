// Куда уходит заявка из формы на сайте Astro. Подключается компонентом LeadForm.
//
// Режим задаётся один раз на весь сайт в src/data/site.json (lead.mode):
//   stub       — превью и зеркало: заявка никуда не уходит, человек видит экран «Заявка принята»
//                и пометку, что это тестовая копия. Для коридорных тестов путь проходится до конца.
//   messengers — аварийный режим: вместо отправки просим написать в Telegram приёмной комиссии.
//   api        — наш сервер заявок (lead.endpoint). Тело запроса — контракт docs/lead-contract.md.
//
// На Тильде этого файла нет, и форма отправляет заявку в нативную форму Тильды, как раньше.
const config = window.ACADEMY_LEAD_CONFIG || { mode: 'stub' };

const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const CLICK_IDS = ['yclid', 'gclid'];

const readCookie = (name) => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : '';
};

// Метки рекламы запоминаем при первом входе на сайт: человек может оставить заявку
// через несколько страниц, когда в адресе меток уже нет.
const STORE = 'academy-lead-attribution';
const params = new URLSearchParams(location.search);
const fresh = Object.fromEntries([...UTM, ...CLICK_IDS].filter((k) => params.get(k)).map((k) => [k, params.get(k)]));
let stored = {};
try { stored = JSON.parse(sessionStorage.getItem(STORE) || '{}'); } catch {}
const attribution = Object.keys(fresh).length
  ? { ...fresh, landing: location.href, referrer: document.referrer }
  : { landing: location.href, referrer: document.referrer, ...stored };
try { sessionStorage.setItem(STORE, JSON.stringify(attribution)); } catch {}

// Контракт заявки: docs/lead-contract.md. Меняется вместе с документом.
export function buildLead(form, payload, extra = {}) {
  const d = form.dataset;
  return {
    contract: 1,
    form: d.leadForm || d.tildaFormName || form.id,
    intent: d.leadIntent || d.mode || 'course',
    course: d.leadCourse || '',
    stream: d.leadStream || '',
    tariff: d.leadTariff || '',
    placement: d.leadPlacement || '',
    source: d.source || '',
    contact: {
      name: payload.name,
      phone: payload.phone,
      email: payload.email || '',
      messenger: payload.messenger || '',
      messengerContact: payload.messengerContact || '',
    },
    page: { url: location.origin + location.pathname, path: location.pathname, title: document.title },
    attribution: {
      utm: Object.fromEntries(UTM.filter((k) => attribution[k]).map((k) => [k, attribution[k]])),
      yclid: attribution.yclid || '',
      gclid: attribution.gclid || '',
      landing: attribution.landing || '',
      referrer: attribution.referrer || '',
    },
    ids: {
      ymClientId: extra.ymClientId || readCookie('_ym_uid'),
      calltouchSessionId: (window.ct && typeof window.ct === 'function' && window.ct('calltracking_params')?.sessionId) || readCookie('_ct_session_id') || '',
    },
    device: extra.device || '',
    sentAt: new Date().toISOString(),
  };
}

const note = (form, text) => {
  let el = form.querySelector('[data-lead-note]');
  if (!el) {
    el = document.createElement('p');
    el.dataset.leadNote = '';
    el.className = 'request-form_hint lead-note';
    form.append(el);
  }
  el.textContent = text;
};

window.AcademyLeadTransport = {
  async send(form, payload, extra) {
    const lead = buildLead(form, payload, extra);
    if (config.mode === 'api' && config.endpoint) {
      const res = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      return res.ok ? { ok: true } : { ok: false };
    }
    if (config.mode === 'messengers') {
      const link = config.telegram || 'https://t.me/Welcometoasp_bot';
      return { ok: false, message: `Сейчас заявки принимаем в Telegram: ${link.replace('https://', '')}` };
    }
    // stub: превью и зеркало
    console.info('Заявка (тестовая копия сайта, никуда не отправлена):', lead);
    note(form, 'Это тестовая копия сайта: заявка никуда не отправлена.');
    return { ok: true };
  },
};
