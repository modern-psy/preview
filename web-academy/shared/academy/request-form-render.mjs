// Форма заявки Академии: разметка по режиму. Контракт и правила — request-form.md.
// Лендинг передаёт только свои тексты, маркер нативной формы Тильды и ссылки.
// Подписи полей, подсказки и тексты ошибок — часть стандарта, их здесь не меняют.
import {escapeHtml, renderText, sectionId} from './html-render.mjs';

// course — заявка на курс, waitlist — лист ожидания (поля и поведение как у курса),
// access — доступ к мини-курсу на почту, webinar — запасная форма вебинара
const MODES = ['course', 'waitlist', 'access', 'webinar'];

// Значения по умолчанию из решений 24–26 октября 2026 (ТЗ «Форма заявки»).
// Лендинг может переопределить их в своих данных.
export const requestFormDefaults = {
  agreementUrl: 'https://modern-psy.ru/agreement',
  privacyUrl: 'https://modern-psy.ru/privacy',
  telegramBotUrl: 'https://t.me/Welcometoasp_bot',
  // Бота приёмной комиссии в MAX нет, поэтому и кнопки MAX нет
  maxBotUrl: '',
  // Менеджеры пишут и звонят с 10:00 до 19:00 по Москве каждый день
  hoursFrom: 10,
  hoursTo: 19,
  hoursNote: 'Ответим с 10:00 до 19:00 по Москве, без выходных',
  // Новых полей в amoCRM нет: устройство дописывается в последнее скрытое
  // поле с метками, ключевое слово рекламы в нём сохраняется
  deviceField: 'utm_term',
  deviceMode: 'append',
  defaultMessenger: 'telegram',
  successHeading: 'Заявка принята',
};

const ICONS = {
  telegram: '<svg class="request-form_icon" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M16.4809 4.10863C16.6868 4.02196 16.9122 3.99206 17.1336 4.02206C17.355 4.05206 17.5643 4.14085 17.7398 4.2792C17.9152 4.41755 18.0504 4.60039 18.1312 4.8087C18.212 5.01701 18.2355 5.24316 18.1992 5.46363L16.3092 16.9278C16.1259 18.0336 14.9125 18.6678 13.8984 18.117C13.05 17.6561 11.79 16.9461 10.6567 16.2053C10.09 15.8345 8.3542 14.647 8.56754 13.802C8.75087 13.0795 11.6675 10.3645 13.3342 8.7503C13.9884 8.11613 13.69 7.7503 12.9175 8.33363C10.9992 9.78196 7.9192 11.9845 6.90087 12.6045C6.00254 13.1511 5.5342 13.2445 4.9742 13.1511C3.95254 12.9811 3.00504 12.7178 2.2317 12.397C1.1867 11.9636 1.23754 10.527 2.23087 10.1086L16.4809 4.10863Z" fill="currentColor"/></svg>',
  max: '<svg class="request-form_icon" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.2238 19.9426C8.26666 19.9426 7.35714 19.6569 5.77618 18.514C4.77618 19.7997 1.60952 20.8045 1.47142 19.0854C1.47142 17.795 1.18571 16.7045 0.861895 15.514C0.476181 14.0473 0.0380859 12.414 0.0380859 10.0473C0.0380859 4.39496 4.67618 0.142578 10.1714 0.142578C15.6714 0.142578 19.9809 4.60448 19.9809 10.0997C19.9898 12.6981 18.9674 15.1938 17.1381 17.0391C15.3088 18.8846 12.8221 19.9288 10.2238 19.9426ZM10.3047 5.02829C7.62856 4.8902 5.54285 6.74258 5.08094 9.64733C4.69999 12.0521 5.37618 14.9807 5.95237 15.133C6.22856 15.1997 6.9238 14.6378 7.35714 14.2045C8.07367 14.6995 8.90808 14.9968 9.77615 15.0664C11.1092 15.1305 12.4141 14.669 13.4105 13.7813C14.4069 12.8935 15.0153 11.6503 15.1047 10.3188C15.1568 8.98449 14.6831 7.68308 13.7854 6.69456C12.8878 5.70604 11.6379 5.10941 10.3047 5.03305V5.02829Z" fill="currentColor"/></svg>',
};

ICONS.question = '<svg class="request-form_tip-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8.25" stroke="currentColor" stroke-width="1.5"/><path d="M6.9 7a2.15 2.15 0 0 1 4.2.55c0 1.45-2.1 1.85-2.1 3.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="13.2" r=".95" fill="currentColor"/></svg>';

const MESSENGERS = [
  {value: 'telegram', label: 'Telegram'},
  {value: 'max', label: 'MAX'},
];

const attr = value => escapeHtml(value);

const required = (data, key) => {
  const value = data[key];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Request form: missing ${key}`);
  return value;
};

const httpsUrl = (value, key) => {
  if (!/^https:\/\/\S+$/.test(value)) throw new Error(`Request form: ${key} must be an https URL`);
  return value;
};

// Пояснение под значком «?»: открывается нажатием (на компьютере и наведением),
// а скринридер читает его вместе с полем через aria-describedby
const tipButton = (tipId, label) =>
  `<button class="request-form_tip-button" type="button" aria-label="${attr(label)}" aria-expanded="false" aria-controls="${tipId}" data-request-tip>${ICONS.question}</button>`;
const tipText = (tipId, text) => `<p class="request-form_tip" id="${tipId}" hidden>${renderText(text)}</p>`;

// Одно текстовое поле: подпись над полем, ошибка и подсказка под ним
function field({id, key, label, input, hint = '', after = '', extraClass = '', hidden = false, tip = null, inputId = '', inputClass = '', wrap = null}) {
  const controlId = inputId || `${id}-${key}`;
  const tipId = tip ? `${id}-${key}-tip` : '';
  const describedBy = [`${id}-${key}-error`, hint ? `${id}-${key}-hint` : '', tipId].filter(Boolean).join(' ');
  const labelHtml = `<label class="request-form_label" for="${controlId}">${renderText(label)}</label>`;
  const control = `<input class="request-form_input${inputClass}" id="${controlId}" ${input} aria-describedby="${describedBy}" aria-invalid="false" data-request-input="${key}"${hidden ? ' disabled' : ''}>`;
  return `<div class="request-form_field${extraClass}" data-request-field="${key}" data-state="idle"${hidden ? ' hidden' : ''}>`
    + (tip ? `<div class="request-form_label-row">${labelHtml}${tipButton(tipId, tip.label)}</div>${tipText(tipId, tip.text)}` : labelHtml)
    + (wrap ? wrap(control) : control)
    + `<p class="request-form_error" id="${id}-${key}-error" aria-live="polite" data-request-error></p>`
    + (hint ? `<p class="request-form_hint" id="${id}-${key}-hint" data-request-hint>${renderText(hint)}</p>` : '')
    + after
    + '</div>';
}

function botLinks(config, className = '') {
  const links = [];
  if (config.telegramBotUrl) links.push(`<a class="request-form_bot is-primary" href="${attr(httpsUrl(config.telegramBotUrl, 'telegramBotUrl'))}" target="_blank" rel="noopener">${ICONS.telegram}<span>Написать в&nbsp;Telegram</span></a>`);
  if (config.maxBotUrl) links.push(`<a class="request-form_bot" href="${attr(httpsUrl(config.maxBotUrl, 'maxBotUrl'))}" target="_blank" rel="noopener">${ICONS.max}<span>Написать в&nbsp;MAX</span></a>`);
  return links.length ? `<div class="request-form_bots${className}">${links.join('')}</div>` : '';
}

export function renderRequestForm(input, {id = 'request-form', headingLevel = 2} = {}) {
  sectionId(id);
  const data = {...requestFormDefaults, ...input};
  const mode = data.mode || 'course';
  if (!MODES.includes(mode)) throw new Error(`Request form: unknown mode ${mode}`);
  // Без точного маркера мост не найдёт нативную форму Тильды: default здесь запрещён
  const nativeMarker = required(data, 'nativeMarker').trim();
  const heading = required(data, 'heading');
  const submitLabel = required(data, 'submitLabel');
  httpsUrl(data.agreementUrl, 'agreementUrl');
  httpsUrl(data.privacyUrl, 'privacyUrl');
  if (!MESSENGERS.some(item => item.value === data.defaultMessenger)) throw new Error('Request form: defaultMessenger must be telegram or max');
  // Для вебинара текст успеха пишет лендинг: что именно придёт человеку, знает только он
  if (mode === 'webinar') required(data, 'successText');
  if (data.lecture && (!data.lecture.label?.trim() || !/^https:\/\//.test(data.lecture.url || ''))) throw new Error('Request form: lecture needs label and https url');
  const from = Number(data.hoursFrom);
  const to = Number(data.hoursTo);
  if (!(Number.isInteger(from) && Number.isInteger(to) && from >= 0 && to <= 24 && from < to)) throw new Error('Request form: invalid hours');

  const hasMessenger = mode !== 'access';
  const telegramFirst = data.defaultMessenger === 'telegram';
  const level = Math.min(Math.max(Number(headingLevel) || 2, 2), 4);
  const dataAttrs = [
    `data-mode="${mode}"`,
    `data-tilda-form-name="${attr(nativeMarker)}"`,
    `data-hours-from="${from}"`,
    `data-hours-to="${to}"`,
    data.source ? `data-source="${attr(data.source)}"` : '',
    data.deviceField ? `data-device-field="${attr(data.deviceField)}"` : '',
    data.deviceField && data.deviceMode ? `data-device-mode="${attr(data.deviceMode)}"` : '',
    data.metrikaId ? `data-metrika-id="${attr(String(data.metrikaId))}"` : '',
    data.successText ? `data-success-text="${attr(data.successText)}"` : '',
  ].filter(Boolean).join(' ');

  const fields = [];
  fields.push(field({
    id, key: 'name', label: 'Имя',
    input: 'type="text" name="name" autocomplete="name" autocapitalize="words" enterkeyhint="next" placeholder="Анна" maxlength="80" required',
  }));
  if (mode === 'access') {
    fields.push(field({
      id, key: 'email', label: 'Почта',
      input: 'type="email" name="email" inputmode="email" autocomplete="email" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="next" placeholder="anna@mail.ru" maxlength="120" required',
      hint: 'Пришлём доступ на эту почту',
      after: '<p class="request-form_hint" data-request-email-suggest hidden>Может быть, <button class="request-form_link-button is-inline" type="button" data-request-email-fix></button>?</p>',
    }));
  }
  // Телефон: скрипт подключает к полю маску Тильды с выбором страны (Россия
  // по умолчанию). Атрибуты data-phonemask-* и обёртки #rec… и .t-input-block
  // нужны её скрипту: он ищет поле внутри #rec<id> по data-input-lid и заменяет его своим
  const lid = `${id}-phone`;
  fields.push(field({
    id, key: 'phone', label: 'Телефон', extraClass: ' is-phone', inputId: `input_${lid}`, inputClass: ' js-phonemask-input',
    input: `type="tel" name="phone" inputmode="tel" autocomplete="tel" enterkeyhint="${hasMessenger ? 'next' : 'done'}" placeholder="+7 900 000-00-00" maxlength="24" required data-phonemask-id="${lid}" data-phonemask-lid="${lid}" data-phonemask-maskcountry="RU" data-phonemask-init="no" data-phonemask-skip-auto-init="true"`,
    hint: hasMessenger ? 'Напишем в выбранный мессенджер, а если не получится, позвоним' : '',
    wrap: control => `<div class="request-form_phone" id="rec${lid}" data-request-phone-mask><div class="request-form_phone-group" data-input-lid="${lid}"><div class="t-input-block">${control}</div></div></div>`,
  }));

  let contact = '';
  if (hasMessenger) {
    const options = MESSENGERS.map(({value, label}) => {
      const checked = value === data.defaultMessenger ? ' checked' : '';
      return `<input class="request-form_choice-input" type="radio" name="messenger" value="${value}" id="${id}-messenger-${value}"${checked}>`
        + `<label class="request-form_choice-option" for="${id}-messenger-${value}">${ICONS[value]}<span lang="en">${label}</span></label>`;
    }).join('');
    const messengerTip = `${id}-messenger-tip`;
    contact = '<div class="request-form_contact">'
      + `<div class="request-form_choice" role="radiogroup" aria-labelledby="${id}-messenger-label" aria-describedby="${messengerTip}" data-request-messenger>`
      + `<div class="request-form_label-row"><span class="request-form_label" id="${id}-messenger-label">Где удобнее переписываться</span>${tipButton(messengerTip, 'Как с вами свяжутся')}</div>`
      + tipText(messengerTip, 'В Telegram напишем по нику. В MAX напишем на номер телефона, который вы указали выше.')
      + `<div class="request-form_choice-options">${options}</div></div>`
      + field({
        id, key: 'telegram', label: 'Ник в Telegram', extraClass: ' is-telegram', hidden: !telegramFirst,
        input: 'type="text" name="telegram" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="@anna_psy" maxlength="64" required',
        tip: {label: 'Зачем нужен ник', text: 'По номеру в Telegram найти получается не всегда, поэтому нужен ник. Он есть в «Настройках», строка «Имя пользователя».'},
      })
      + '</div>';
  }

  const legal = `Нажимая на кнопку «${renderText(submitLabel)}», я даю <a href="${attr(data.agreementUrl)}" target="_blank" rel="noopener noreferrer">согласие</a> на обработку моих персональных данных в соответствии с <a href="${attr(data.privacyUrl)}" target="_blank" rel="noopener noreferrer">политикой обработки персональных данных</a>`;
  const lecture = data.lecture
    ? `<p class="request-form_lecture">Пока ждёте: <a href="${attr(data.lecture.url)}" target="_blank" rel="noopener">${renderText(data.lecture.label)}</a></p>`
    : '';
  // Текст успеха без JS не нужен: экран успеха открывает только скрипт
  const successFallback = mode === 'webinar' ? data.successText : 'Менеджер скоро свяжется с вами.';

  return `<form id="${id}" class="request-form_component" data-academy-request-form ${dataAttrs} aria-labelledby="${id}-heading" novalidate>`
    + `<div class="request-form_intro section-header_component is-left is-responsive" data-request-content>`
    + `<h${level} class="section-title_component is-left is-responsive" id="${id}-heading">${renderText(heading)}</h${level}>`
    + (data.description ? `<p class="section-subtitle_component">${renderText(data.description)}</p>` : '')
    + '</div>'
    + '<div class="request-form_body" data-request-content>'
    + `<p class="request-form_summary" id="${id}-summary" role="status" aria-live="polite" data-request-summary></p>`
    + `<div class="request-form_fields">${fields.join('')}</div>`
    + contact
    + '<div class="request-form_actions">'
    // Без JS кнопка выключена: форма всё равно не может отправиться. Скрипт включает её сразу
    + `<button class="request-form_submit" type="submit" aria-busy="false" disabled data-request-submit><span class="request-form_submit-label">${renderText(submitLabel)}</span><span class="request-form_submit-busy" aria-hidden="true"><span class="request-form_spinner"></span>Отправляем…</span></button>`
    + `<div class="request-form_help" data-request-help hidden><p class="request-form_help-text" data-request-help-text></p>${botLinks(data)}</div>`
    + `<p class="request-form_legal">${legal}</p>`
    + '</div>'
    + '</div>'
    // Часы ответа отдельно от колонки с полями: на телефоне встают под согласие,
    // от 768 px сетка ставит их вниз левой колонки. Только для курса и листа
    // ожидания: доступ к мини-курсу приходит письмом сразу, а вебинарная форма
    // запасная, основную запись круглые сутки ведёт бот BotHelp
    + (mode === 'course' || mode === 'waitlist' ? `<p class="request-form_note" data-request-content>${renderText(data.hoursNote)}</p>` : '')
    + `<div class="request-form_success section-header_component is-left is-responsive" tabindex="-1" data-request-success hidden>`
    + `<h${level} class="section-title_component is-left is-responsive" id="${id}-success-heading" tabindex="-1" data-request-success-heading>${renderText(data.successHeading)}</h${level}>`
    + `<p class="section-subtitle_component" data-request-success-text>${renderText(successFallback)}</p>`
    + botLinks(data, ' is-success')
    + lecture
    + '</div>'
    + '</form>';
}

export function renderRequestFormSection(data, {id = 'application', formId = `${id}-form`, headingLevel = 2} = {}) {
  sectionId(id);
  return `<section class="section_request-form section-spacing_component" id="${id}" aria-labelledby="${escapeHtml(formId)}-heading"><div class="padding-global"><div class="container-xlarge column-grid_component"><div class="column-grid_content is-content-wide">${renderRequestForm(data, {id: formId, headingLevel})}</div></div></div></section>`;
}
