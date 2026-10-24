// Форма заявки Академии: проверка полей, маска телефона и передача заявки
// в скрытую нативную форму Тильды. Как подключать — request-form.md,
// правила моста — rules/engineering/tilda-form-bridges.md.
//
// Можно менять: тексты в разделе «Тексты».
// Нельзя менять без проверки на опубликованной странице: поиск нативной формы,
// заполнение её полей и ожидание ответа Тильды (разделы «Мост» и «Отправка»).
(() => {
  "use strict";

  /* ---------- Тексты ---------- */

  const TEXT = {
    nameEmpty: "Напишите, как к вам обращаться",
    nameShort: "Напишите имя полностью",
    nameLong: "Имя слишком длинное, сократите до 60 символов",
    nameChars: "В имени только буквы, пробел и дефис",
    phoneEmpty: "Напишите номер телефона",
    phoneShort: "В номере не хватает цифр, пример: +7 912 345-67-89",
    phoneCode: "Проверьте код номера, пример: +7 912 345-67-89",
    phoneIntlShort: "Нужен код страны и номер, например +375 29 123-45-67",
    phoneIntlLong: "В номере слишком много цифр, проверьте его",
    emailEmpty: "Напишите почту, на неё придёт доступ",
    emailCyrillic: "Адрес почты пишется латиницей, пример: anna@mail.ru",
    emailInvalid: "Проверьте адрес почты, пример: anna@mail.ru",
    telegramEmpty: "Напишите ник в Telegram, например @anna_psy",
    telegramPhone: "Нужен ник, а не номер телефона, например @anna_psy",
    telegramCyrillic: "Ник пишется латиницей, например @anna_psy",
    telegramChars: "В нике только латинские буквы, цифры и подчёркивание, например @anna_psy",
    telegramLength: "В нике от 3 до 32 символов, например @anna_psy",
    sending: "Отправляем заявку…",
    sendFailed: "Не получилось отправить. Попробуйте ещё раз или напишите в приёмную комиссию",
    unavailable: "Отправка сейчас недоступна. Напишите в приёмную комиссию, ответим так же быстро",
    slow: "Отправляем дольше обычного. Если не получится, напишите в приёмную комиссию",
    noNative: "Если форма не отправится, напишите в приёмную комиссию",
    countryOther: "Другая страна",
    countryRussia: "Номер в России",
    intlHint: "Номер с кодом страны, например +375 29 123-45-67",
    ruPlaceholder: "+7 900 000-00-00",
    intlPlaceholder: "+375 29 123-45-67",
  };

  /* ---------- Проверки и форматирование (их проверяет tests/request-form.test.mjs) ---------- */

  const digitsOf = (value) => String(value || "").replace(/\D/g, "");

  // Российский номер из того, что человек ввёл или вставил: +7…, 8…, 7…, 9…,
  // с пробелами, скобками и дефисами. foreign — номер с другим кодом страны.
  const parseRuPhone = (value) => {
    const cleaned = String(value || "").replace(/[^\d+]/g, "");
    const digits = digitsOf(cleaned);
    if (cleaned.startsWith("00") || (cleaned.startsWith("+") && digits && digits[0] !== "7")) {
      return { foreign: true, national: "" };
    }
    let national = digits;
    if (cleaned.startsWith("+")) national = digits.slice(1);
    else if (digits.length >= 11 && /^[78]/.test(digits)) national = digits.slice(1);
    // После +7 по привычке набрали 8 или 7: на одиннадцатой цифре лишнее убираем
    if (national.length >= 11 && /^[78]/.test(national)) national = national.slice(1);
    return { foreign: false, national: national.slice(0, 10) };
  };

  const formatRuPhone = (national) => {
    if (!national) return "";
    let result = `+7 ${national.slice(0, 3)}`;
    if (national.length > 3) result += ` ${national.slice(3, 6)}`;
    if (national.length > 6) result += `-${national.slice(6, 8)}`;
    if (national.length > 8) result += `-${national.slice(8, 10)}`;
    return result;
  };

  const ruPhoneMessage = (national) => {
    if (!national) return TEXT.phoneEmpty;
    if (national.length < 10) return TEXT.phoneShort;
    if (/^[0-2]/.test(national)) return TEXT.phoneCode;
    return "";
  };

  // Иностранный номер: только «+», цифры и привычные разделители
  const sanitizeIntlPhone = (value) => {
    let result = String(value || "").replace(/[^\d+()\-\s]/g, "").replace(/(?!^)\+/g, "");
    if (result.startsWith("00")) result = `+${result.slice(2)}`;
    if (result && !result.startsWith("+")) result = `+${result}`;
    return result;
  };

  const intlPhoneMessage = (value) => {
    const digits = digitsOf(value);
    if (!digits) return TEXT.phoneEmpty;
    if (digits.length < 8) return TEXT.phoneIntlShort;
    if (digits.length > 15) return TEXT.phoneIntlLong;
    return "";
  };

  // Ник из «anna_psy», «@anna_psy», «t.me/anna_psy» или полной ссылки
  const normalizeTelegram = (value) => {
    let nick = String(value || "").trim();
    const link = nick.match(/^(?:https?:\/\/)?(?:www\.)?(?:t|telegram)\.(?:me|dog)\/([^/?#\s]*)/i);
    if (link) nick = link[1];
    return nick.replace(/^@+/, "");
  };

  const telegramMessage = (value) => {
    const nick = normalizeTelegram(value);
    if (!nick) return TEXT.telegramEmpty;
    if (/^\+?[\d\s()-]{5,}$/.test(nick)) return TEXT.telegramPhone;
    if (/[а-яё]/i.test(nick)) return TEXT.telegramCyrillic;
    if (!/^[A-Za-z0-9_]+$/.test(nick)) return TEXT.telegramChars;
    if (nick.length < 3 || nick.length > 32) return TEXT.telegramLength;
    return "";
  };

  const EMAIL_PATTERN =
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

  // Частые опечатки в домене почты. Подсказку человек принимает сам, форма
  // ничего не исправляет молча
  const EMAIL_DOMAIN_FIXES = {
    "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmal.com": "gmail.com",
    "gamil.com": "gmail.com", "gnail.com": "gmail.com", "gmail.co": "gmail.com",
    "gmail.cm": "gmail.com", "gmail.con": "gmail.com", "gmail.ru": "gmail.com",
    "yandex.r": "yandex.ru", "yandx.ru": "yandex.ru", "yadex.ru": "yandex.ru",
    "yndex.ru": "yandex.ru", "yanex.ru": "yandex.ru", "mail.r": "mail.ru",
    "mial.ru": "mail.ru", "maill.ru": "mail.ru", "mai.ru": "mail.ru",
    "ramble.ru": "rambler.ru", "icloud.co": "icloud.com", "icloud.cm": "icloud.com",
    "iclod.com": "icloud.com", "outlok.com": "outlook.com", "hotmial.com": "hotmail.com",
  };

  const suggestEmail = (value) => {
    const email = String(value || "").trim();
    const at = email.lastIndexOf("@");
    if (at < 1) return "";
    const domain = email.slice(at + 1).toLowerCase();
    const fixed = EMAIL_DOMAIN_FIXES[domain] ||
      domain.replace(/\.ry$/, ".ru").replace(/\.(con|cmo|ocm)$/, ".com");
    return fixed && fixed !== domain ? `${email.slice(0, at)}@${fixed}` : "";
  };

  const emailMessage = (value) => {
    const email = String(value || "").trim();
    if (!email) return TEXT.emailEmpty;
    if (/[а-яё]/i.test(email)) return TEXT.emailCyrillic;
    if (!EMAIL_PATTERN.test(email)) return TEXT.emailInvalid;
    return "";
  };

  const normalizeName = (value) => String(value || "").replace(/\s+/g, " ").trim();
  // Любые буквы, пробел, дефис и апостроф. Старые браузеры не знают \p{L}:
  // для них запасной вариант с кириллицей и латиницей
  const NAME_PATTERN = (() => {
    try {
      return new RegExp("^\\p{L}[\\p{L}'’ -]*$", "u");
    } catch (error) {
      return /^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё'’ -]*$/;
    }
  })();

  const nameMessage = (value) => {
    const name = normalizeName(value);
    if (!name) return TEXT.nameEmpty;
    if (name.length < 2) return TEXT.nameShort;
    if (name.length > 60) return TEXT.nameLong;
    if (!NAME_PATTERN.test(name)) return TEXT.nameChars;
    return "";
  };

  // Москва живёт по UTC+3 круглый год
  const moscowHour = (date = new Date()) => (date.getUTCHours() + 3) % 24;

  const replyWhen = (hour, from, to) => {
    if (hour < from) return `сегодня после ${from}:00 по Москве`;
    if (hour < to) return `сегодня до ${to}:00 по Москве`;
    return `завтра после ${from}:00 по Москве`;
  };

  const fieldsWord = (count) => {
    const last = count % 10;
    const lastTwo = count % 100;
    if (last === 1 && lastTwo !== 11) return "поле";
    if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return "поля";
    return "полей";
  };

  // Устройство для заявки в amoCRM и параметров Метрики
  const detectDevice = (nav = window.navigator || {}) => {
    const ua = nav.userAgent || "";
    const touchMac = /Macintosh/.test(ua) && nav.maxTouchPoints > 1;
    if (/iPad|Tablet/i.test(ua) || touchMac || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "планшет";
    if (/Mobi|iPhone|iPod|Android/i.test(ua)) return "телефон";
    return "компьютер";
  };

  const successMessage = ({ mode, messenger, contact, email, hour, from, to, custom }) => {
    if (custom) return custom;
    if (mode === "access") {
      return `Письмо с доступом придёт на ${email}. Если его нет во «Входящих», загляните в «Спам».`;
    }
    const where = messenger === "max" ? `в MAX на номер ${contact}` : `в Telegram ${contact}`;
    return `Менеджер напишет ${where} ${replyWhen(hour, from, to)}. Если не ответите в мессенджере, позвоним.`;
  };

  const helpers = {
    TEXT, parseRuPhone, formatRuPhone, ruPhoneMessage, sanitizeIntlPhone, intlPhoneMessage,
    normalizeTelegram, telegramMessage, suggestEmail, emailMessage, normalizeName, nameMessage,
    moscowHour, replyWhen, fieldsWord, detectDevice, successMessage,
  };
  window.__academyRequestFormHelpers = helpers;

  /* ---------- Запуск ---------- */

  if (typeof window.__academyRequestFormCleanup === "function") {
    window.__academyRequestFormCleanup();
  }

  const forms = [...document.querySelectorAll("[data-academy-request-form]")];
  if (!forms.length) return;

  // На боевом домене нативная форма Тильды обязана быть на странице.
  // На превью её нет, поэтому предупреждение о ней там не показываем
  const IS_PRODUCTION = /(^|\.)modern-psy\.ru$/.test(window.location.hostname);
  const SLOW_DELIVERY_MS = 15000;
  const DISCOVERY_MS = 10000;

  const storage = (() => {
    try {
      const store = window.sessionStorage;
      store.setItem("__academy-request-form", "1");
      store.removeItem("__academy-request-form");
      return store;
    } catch (error) {
      return null;
    }
  })();

  /* ---------- Мост к нативной форме Тильды ---------- */

  const setNativeInputValue = (input, value) => {
    if (!(input instanceof HTMLInputElement)) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (setter) setter.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  // Нативную форму ищем только по её имени (tildaspec-formname): номера блоков
  // Тильда меняет при копировании страницы
  const findTildaForm = (formName) =>
    (formName && [...document.querySelectorAll("form.t-form")].find(
      (form) => form.querySelector('input[name="tildaspec-formname"]')?.value === formName,
    )) || null;

  // Прячем только блок, где лежит найденная форма. Сама форма остаётся в DOM
  const hideTildaFormRecord = (formName) => {
    const nativeForm = findTildaForm(formName);
    if (!(nativeForm instanceof HTMLFormElement)) return null;
    const record = nativeForm.closest(".t-rec") || nativeForm;
    record.hidden = true;
    record.setAttribute("aria-hidden", "true");
    record.setAttribute("data-academy-native-form-record", "");
    return nativeForm;
  };

  const isRequiredInTilda = (element) =>
    Boolean(element && (element.getAttribute?.("data-tilda-req") === "1" ||
      element.querySelector?.('[data-tilda-req="1"]')));

  // Для маски без скрипта Тильды: 10 цифр российского номера или полный +код
  const getTildaPhoneValue = (e164) => {
    const digits = digitsOf(e164);
    if (!digits) return "";
    return digits.startsWith("7") ? digits.slice(1, 11) : `+${digits}`;
  };

  // Телефон Тильда ждёт в своей полной маске, например +7 (999) 000-00-01
  const fillTildaPhoneGroup = (group, e164, resultName) => {
    if (!(group instanceof HTMLElement)) return;
    const visibleInputs = [...group.querySelectorAll('input.t-input-phonemask:not([type="hidden"])')];
    if (typeof window.t_form_phonemask__setValue === "function") {
      window.t_form_phonemask__setValue(group, e164, undefined, { noFocus: true });
    } else {
      visibleInputs.forEach((input) => setNativeInputValue(input, getTildaPhoneValue(e164)));
    }
    const visible = visibleInputs[0];
    const visiblePhone = visible?.dataset.phonemaskCurrent || visible?.value || "";
    const dialCode = visible?.dataset.phonemaskCode || "";
    const formatted = visiblePhone.startsWith("+") ? visiblePhone : `${dialCode} ${visiblePhone}`.trim();
    group.querySelectorAll(`input.js-phonemask-result[name="${resultName}"]`)
      .forEach((input) => setNativeInputValue(input, formatted || e164));
    group.querySelectorAll("input.js-phonemask-result-iso")
      .forEach((input) => setNativeInputValue(input, visible?.dataset.phonemaskIso || input.value || "ru"));
  };

  // MAX в разных блоках Тильды лежит в слоте max, max_messenger или в слоте
  // whatsapp. В слот Telegram он не попадает никогда
  const selectTildaMessenger = (group, messenger) => {
    const radios = [...group.querySelectorAll('input[type="radio"][name="messenger-type"]')];
    const telegramRadio = radios.find((radio) => radio.value === "telegram");
    const maxRadio =
      radios.find((radio) => radio.value === "max" || radio.value === "max_messenger") ||
      radios.find((radio) => radio.value === "whatsapp") ||
      radios.find((radio) => radio.value !== "telegram");
    if (maxRadio && !maxRadio.dataset.academyOriginalValue) {
      maxRadio.dataset.academyOriginalValue = maxRadio.value;
    }
    if (maxRadio?.dataset.academyOriginalValue) maxRadio.value = maxRadio.dataset.academyOriginalValue;
    const selected = messenger === "telegram" ? telegramRadio : maxRadio;
    if (!(selected instanceof HTMLInputElement)) return "";
    const selectedType = selected.value;
    selected.checked = true;
    selected.dispatchEvent(new Event("input", { bubbles: true }));
    selected.dispatchEvent(new Event("change", { bubbles: true }));
    if (messenger === "max" && selected.value === "whatsapp") selected.value = "max";
    return selectedType;
  };

  // Скрытые служебные поля (form_source, устройство). Если поля нет, добавляем
  // скрытым: Тильда отправит его вместе с заявкой
  const setNativeExtra = (nativeForm, name, value, mode = "replace") => {
    if (!name || !value) return;
    let input = [...nativeForm.querySelectorAll("input")].find((item) => item.name === name);
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      nativeForm.append(input);
    }
    if (input.dataset.academyOriginalValue === undefined) input.dataset.academyOriginalValue = input.value;
    const original = mode === "append" ? input.dataset.academyOriginalValue : "";
    setNativeInputValue(input, original ? `${original} · ${value}` : value);
  };

  class ContractError extends Error {}

  // Сначала проверяем, что в нативной форме есть всё нужное, и только потом
  // заполняем: неполную заявку отправлять нельзя
  const syncTildaForm = async (nativeForm, payload, extras) => {
    const nameInput = nativeForm.querySelector('input[data-tilda-rule="name"], input[name="Name"]');
    const emailInput = nativeForm.querySelector('input[data-tilda-rule="email"], input[name="email"], input[name="Email"]');
    const phoneGroup = [...nativeForm.querySelectorAll(".t-input-group_ph")]
      .find((group) => !group.closest(".t-input-group_contact_method"));
    const messengerGroup = nativeForm.querySelector(".t-input-group_contact_method");
    const problems = [];
    if (!(nameInput instanceof HTMLInputElement)) problems.push("нет поля Name");
    if (payload.email !== null && !(emailInput instanceof HTMLInputElement)) problems.push("нет поля email");
    if (payload.email === null && isRequiredInTilda(emailInput)) problems.push("email обязателен в Тильде, а форма его не спрашивает");
    if (!(phoneGroup instanceof HTMLElement)) problems.push("нет поля Phone");
    if (payload.messenger && !(messengerGroup instanceof HTMLElement)) problems.push("нет блока messenger-type");
    if (!payload.messenger && isRequiredInTilda(messengerGroup)) problems.push("мессенджер обязателен в Тильде, а форма его не спрашивает");
    if (problems.length) throw new ContractError(problems.join("; "));

    setNativeInputValue(nameInput, payload.name);
    if (payload.email !== null) setNativeInputValue(emailInput, payload.email);
    fillTildaPhoneGroup(phoneGroup, payload.phone, "Phone");
    extras.forEach(([name, value, mode]) => setNativeExtra(nativeForm, name, value, mode));
    if (!payload.messenger) return;

    const selectedType = selectTildaMessenger(messengerGroup, payload.messenger);
    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    // Очищаем контакты всех мессенджеров, иначе старое значение уйдёт в CRM вместе с новым
    messengerGroup.querySelectorAll(
      'input[name="messenger-id"], input[name="tildaspec-phone-part[]"], input[name="tildaspec-phone-part[]-iso"]',
    ).forEach((input) => {
      // Скрытые группы Тильда уже очистила и выключила: событие input включило бы их снова
      if (input.closest(".t-contact-method__hybrid.t-contact-method__hidden")) return;
      setNativeInputValue(input, "");
    });

    // Новый блок контактов: у каждого мессенджера своё поле с data-contact-method
    const typedInput = [...messengerGroup.querySelectorAll('input[name="messenger-id"][data-contact-method]')]
      .find((input) => input.dataset.contactMethod === selectedType);
    if (typedInput instanceof HTMLInputElement) {
      const valueGroup = typedInput.closest(".t-phonemask-input-group");
      if (/^[+0-9]/.test(payload.messengerContact) && valueGroup?.querySelector("input.t-input-phonemask")) {
        // Гибридное поле переключается на маску телефона от первого «+»
        setNativeInputValue(typedInput, "+");
        fillTildaPhoneGroup(valueGroup, payload.messengerContact, "messenger-id");
      } else {
        setNativeInputValue(typedInput, payload.messengerContact);
      }
    } else if (payload.messenger === "telegram") {
      const telegramInput = messengerGroup.querySelector('input[name="messenger-id"]:not([type="hidden"]):not(:disabled)');
      if (!(telegramInput instanceof HTMLInputElement)) throw new ContractError("нет активного поля Telegram");
      setNativeInputValue(telegramInput, payload.messengerContact);
    } else {
      const maxPhoneGroup = messengerGroup
        .querySelector('input.t-input-phonemask:not([type="hidden"]):not(:disabled)')
        ?.closest(".t-phonemask-input-group");
      if (!(maxPhoneGroup instanceof HTMLElement)) throw new ContractError("нет активного поля MAX");
      fillTildaPhoneGroup(maxPhoneGroup, payload.messengerContact, "messenger-id");
    }
  };

  const captchaOpen = () => Boolean(document.querySelector(
    '[class*="tildaformcaptchabox"], [id*="tildaformcaptchabox"], [class*="captchaIframeBox"], [id*="captchaIframeBox"]',
  ));

  const reachGoal = (form, goal, params) => {
    try {
      if (typeof window.ym !== "function") return;
      const id = Number(form.dataset.metrikaId) ||
        window.Ya?.Metrika2?.counters?.()?.[0]?.id ||
        window.Ya?.Metrika?.counters?.()?.[0]?.id;
      if (id) window.ym(id, "reachGoal", goal, params);
    } catch (error) {
      // Аналитика не должна ломать форму
    }
  };

  /* ---------- Одна форма ---------- */

  const controllers = [];
  const watchedNames = new Set();

  const setupForm = (form) => {
    const mode = form.dataset.mode || "course";
    const formName = form.dataset.tildaFormName?.trim() || "";
    const hoursFrom = Number(form.dataset.hoursFrom) || 10;
    const hoursTo = Number(form.dataset.hoursTo) || 20;
    const device = detectDevice();
    const inputs = [...form.querySelectorAll("[data-request-input]")];
    const byKey = (key) => inputs.find((input) => input.dataset.requestInput === key) || null;
    const nameInput = byKey("name");
    const phoneInput = byKey("phone");
    const emailInput = byKey("email");
    const telegramInput = byKey("telegram");
    const telegramField = telegramInput?.closest("[data-request-field]") || null;
    const messengerInputs = [...form.querySelectorAll('input[name="messenger"]')];
    const maxHint = form.querySelector("[data-request-max-hint]");
    const countryButton = form.querySelector("[data-request-country]");
    const phoneHint = phoneInput?.closest("[data-request-field]")?.querySelector("[data-request-hint]") || null;
    const phoneHintText = phoneHint?.textContent || "";
    const emailSuggest = form.querySelector("[data-request-email-suggest]");
    const emailFix = form.querySelector("[data-request-email-fix]");
    const submit = form.querySelector("[data-request-submit]");
    const summary = form.querySelector("[data-request-summary]");
    const help = form.querySelector("[data-request-help]");
    const helpText = form.querySelector("[data-request-help-text]");
    const contentParts = [...form.querySelectorAll("[data-request-content]")];
    const successView = form.querySelector("[data-request-success]");
    const successHeading = form.querySelector("[data-request-success-heading]");
    const successText = form.querySelector("[data-request-success-text]");
    const section = form.closest("section[aria-labelledby]");
    const draftKey = `academy-request-form:${window.location.pathname}:${form.id || formName}`;
    const cleanups = [];
    let phoneMode = "ru";
    let busy = false;
    let disposed = false;
    let started = false;
    let submittedForm = null;
    let slowTimer = 0;
    let viewSent = false;
    let onScreen = false;
    let focused = false;
    let lastVisible = null;

    const listen = (target, type, handler, options) => {
      if (!target) return;
      target.addEventListener(type, handler, options);
      cleanups.push(() => target.removeEventListener(type, handler, options));
    };

    const goalParams = (extra = {}) => ({ mode, page: window.location.pathname, device, ...extra });

    /* Состояние полей */

    const fieldOf = (input) => input.closest("[data-request-field]");
    const isActive = (input) => input && !input.disabled && !fieldOf(input)?.hidden;
    const activeInputs = () => inputs.filter(isActive);
    const selectedMessenger = () => messengerInputs.find((input) => input.checked)?.value || null;

    const messageFor = (input) => {
      const value = input.value;
      switch (input.dataset.requestInput) {
        case "name": return nameMessage(value);
        case "email": return emailMessage(value);
        case "telegram": return telegramMessage(value);
        case "phone": return phoneMode === "ru" ? ruPhoneMessage(parseRuPhone(value).national) : intlPhoneMessage(value);
        default: return "";
      }
    };

    const showFieldError = (input, message) => {
      const field = fieldOf(input);
      const wasInvalid = field?.dataset.state === "invalid";
      input.setAttribute("aria-invalid", String(Boolean(message)));
      if (field) field.dataset.state = message ? "invalid" : "idle";
      const error = field?.querySelector("[data-request-error]");
      if (error) error.textContent = message;
      if (message && !wasInvalid) reachGoal(form, "form_error", { mode, field: input.dataset.requestInput });
    };

    const isShownInvalid = (input) => fieldOf(input)?.dataset.state === "invalid";

    const setSummary = (message = "", state = "idle") => {
      if (!summary) return;
      summary.textContent = message;
      summary.dataset.state = state;
    };

    const refreshSummary = () => {
      if (summary?.dataset.state !== "invalid") return;
      const count = activeInputs().filter(isShownInvalid).length;
      setSummary(count ? `Проверьте ${count} ${fieldsWord(count)}` : "", count ? "invalid" : "idle");
    };

    const showHelp = (message) => {
      if (!help) return;
      if (helpText) helpText.textContent = message;
      help.hidden = false;
    };

    const hideHelp = () => {
      if (help) help.hidden = true;
    };

    // «Далее» на клавиатуре у всех полей, кроме последнего
    const updateEnterHints = () => {
      const list = activeInputs();
      list.forEach((input, index) => {
        input.setAttribute("enterkeyhint", index === list.length - 1 ? "done" : "next");
      });
    };

    /* Черновик: введённое не теряется, если человек ушёл назад и вернулся */

    const saveDraft = () => {
      if (!storage) return;
      try {
        storage.setItem(draftKey, JSON.stringify({
          name: nameInput?.value || "",
          email: emailInput?.value || "",
          phone: phoneInput?.value || "",
          phoneMode,
          messenger: selectedMessenger(),
          telegram: telegramInput?.value || "",
        }));
      } catch (error) {
        // Хранилище переполнено или запрещено: форма работает и без черновика
      }
    };

    const clearDraft = () => {
      try {
        storage?.removeItem(draftKey);
      } catch (error) {
        // Нечего очищать
      }
    };

    const readDraft = () => {
      try {
        return JSON.parse(storage?.getItem(draftKey) || "null");
      } catch (error) {
        return null;
      }
    };

    /* Телефон */

    const setPhoneMode = (nextMode, { keepValue = false, focus = false } = {}) => {
      if (!phoneInput) return;
      phoneMode = nextMode;
      phoneInput.dataset.phoneMode = nextMode;
      phoneInput.placeholder = nextMode === "ru" ? TEXT.ruPlaceholder : TEXT.intlPlaceholder;
      if (countryButton) countryButton.textContent = nextMode === "ru" ? TEXT.countryOther : TEXT.countryRussia;
      if (phoneHint) phoneHint.textContent = nextMode === "ru" ? phoneHintText : TEXT.intlHint;
      if (!keepValue) phoneInput.value = nextMode === "intl" ? "+" : "";
      showFieldError(phoneInput, "");
      if (focus) {
        phoneInput.focus();
        const end = phoneInput.value.length;
        phoneInput.setSelectionRange(end, end);
      }
    };

    const formatPhone = () => {
      if (!phoneInput) return;
      if (phoneMode === "intl") {
        const sanitized = sanitizeIntlPhone(phoneInput.value);
        if (sanitized !== phoneInput.value) phoneInput.value = sanitized;
        return;
      }
      const raw = phoneInput.value;
      const parsed = parseRuPhone(raw);
      if (parsed.foreign) {
        setPhoneMode("intl", { keepValue: true });
        phoneInput.value = sanitizeIntlPhone(raw);
        return;
      }
      const formatted = formatRuPhone(parsed.national);
      if (formatted === raw) return;
      const caret = phoneInput.selectionStart ?? raw.length;
      const atEnd = caret >= raw.length;
      const cleaned = raw.replace(/[^\d+]/g, "");
      const hadPrefix = cleaned.startsWith("+") || (digitsOf(raw).length >= 11 && /^[78]/.test(digitsOf(raw)));
      phoneInput.value = formatted;
      if (document.activeElement !== phoneInput) return;
      if (atEnd) {
        phoneInput.setSelectionRange(formatted.length, formatted.length);
        return;
      }
      // Курсор встаёт после того же числа цифр, что и до форматирования
      let left = digitsOf(raw.slice(0, caret)).length + (hadPrefix ? 0 : 1);
      let position = 0;
      while (position < formatted.length && left > 0) {
        if (/\d/.test(formatted[position])) left -= 1;
        position += 1;
      }
      phoneInput.setSelectionRange(position, position);
    };

    const phoneE164 = () => {
      if (phoneMode === "intl") return `+${digitsOf(phoneInput.value)}`;
      return `+7${parseRuPhone(phoneInput.value).national}`;
    };

    /* Мессенджер */

    const renderMessenger = () => {
      const isTelegram = selectedMessenger() === "telegram";
      if (telegramField && telegramInput) {
        telegramField.hidden = !isTelegram;
        telegramInput.disabled = !isTelegram;
        if (!isTelegram) showFieldError(telegramInput, "");
      }
      if (maxHint) maxHint.hidden = isTelegram;
      updateEnterHints();
      refreshSummary();
    };

    const showEmailSuggestion = () => {
      if (!emailInput || !emailSuggest || !emailFix) return;
      const suggestion = emailMessage(emailInput.value) === TEXT.emailEmpty ? "" : suggestEmail(emailInput.value);
      emailFix.textContent = suggestion;
      emailSuggest.hidden = !suggestion;
    };

    /* Реакция на ввод */

    const handleInput = (input) => {
      if (input === phoneInput) formatPhone();
      if (input === emailInput && emailSuggest) emailSuggest.hidden = true;
      input.dataset.dirty = "true";
      // Ошибка исчезает, как только значение стало верным, не дожидаясь ухода из поля
      if (isShownInvalid(input)) showFieldError(input, messageFor(input));
      refreshSummary();
      saveDraft();
      if (!started) {
        started = true;
        reachGoal(form, "form_start", goalParams());
      }
    };

    inputs.forEach((input) => {
      listen(input, "input", () => handleInput(input));
      // Поле проверяется, когда человек из него вышел и что-то в нём менял
      listen(input, "blur", () => {
        if (busy) return;
        if (input === phoneInput && phoneMode === "ru" && !parseRuPhone(input.value).national) input.value = "";
        if (input === telegramInput && !telegramMessage(input.value)) input.value = `@${normalizeTelegram(input.value)}`;
        if (input.dataset.dirty === "true") showFieldError(input, messageFor(input));
        if (input === emailInput) showEmailSuggestion();
        refreshSummary();
      });
    });

    // Пустое поле телефона сразу показывает код страны
    listen(phoneInput, "focus", () => {
      if (phoneMode === "ru" && !phoneInput.value) {
        phoneInput.value = "+7 ";
        window.requestAnimationFrame(() => phoneInput.setSelectionRange(3, 3));
      }
    });

    // Вставка целого номера в пустое поле заменяет «+7 », а не дописывается к нему
    listen(phoneInput, "paste", (event) => {
      if (phoneMode !== "ru") return;
      const text = event.clipboardData?.getData("text") || "";
      const allSelected = phoneInput.selectionStart === 0 && phoneInput.selectionEnd === phoneInput.value.length;
      if (!text || (parseRuPhone(phoneInput.value).national && !allSelected)) return;
      event.preventDefault();
      phoneInput.value = text;
      handleInput(phoneInput);
      const end = phoneInput.value.length;
      phoneInput.setSelectionRange(end, end);
    });

    listen(countryButton, "click", () => {
      setPhoneMode(phoneMode === "ru" ? "intl" : "ru", { focus: true });
      saveDraft();
    });

    listen(emailFix, "click", () => {
      emailInput.value = emailFix.textContent;
      emailSuggest.hidden = true;
      handleInput(emailInput);
      showFieldError(emailInput, messageFor(emailInput));
      emailInput.focus();
    });

    messengerInputs.forEach((input) => {
      listen(input, "change", () => {
        renderMessenger();
        saveDraft();
      });
    });

    // Enter переводит к следующему полю, на последнем отправляет форму
    listen(form, "keydown", (event) => {
      if (event.key !== "Enter" || event.isComposing) return;
      const list = activeInputs();
      const index = list.indexOf(event.target);
      if (index > -1 && index < list.length - 1) {
        event.preventDefault();
        list[index + 1].focus();
      }
    });

    /* Видимость: липкая панель страницы прячется, пока форма на экране или открыта клавиатура */

    const emitVisible = () => {
      const visible = onScreen || focused;
      if (visible === lastVisible) return;
      lastVisible = visible;
      form.dispatchEvent(new CustomEvent("academy-request-form:visible", { bubbles: true, detail: { visible } }));
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          onScreen = entry.isIntersecting;
          const half = entry.intersectionRatio >= 0.5 ||
            (entry.rootBounds && entry.intersectionRect.height >= entry.rootBounds.height * 0.5);
          if (!viewSent && half) {
            viewSent = true;
            reachGoal(form, "form_view", goalParams());
          }
        });
        emitVisible();
      }, { threshold: [0, 0.25, 0.5] });
      observer.observe(form);
      cleanups.push(() => observer.disconnect());
    }

    listen(form, "focusin", () => {
      focused = true;
      emitVisible();
    });
    listen(form, "focusout", () => {
      window.setTimeout(() => {
        focused = form.contains(document.activeElement);
        emitVisible();
      }, 0);
    });

    /* Отправка */

    const setBusy = (value) => {
      busy = value;
      form.setAttribute("aria-busy", String(value));
      submit?.setAttribute("aria-busy", String(value));
      submit?.setAttribute("aria-disabled", String(value));
      if (!value) window.clearTimeout(slowTimer);
    };

    const showSuccess = () => {
      const payload = submittedPayload;
      setBusy(false);
      submittedForm = null;
      setSummary();
      hideHelp();
      if (successText) {
        successText.textContent = successMessage({
          mode,
          messenger: payload?.messenger,
          contact: payload?.messenger === "max" ? payload.phoneDisplay : payload?.messengerContact,
          email: payload?.email,
          hour: moscowHour(),
          from: hoursFrom,
          to: hoursTo,
          custom: form.dataset.successText,
        });
      }
      contentParts.forEach((part) => {
        part.hidden = true;
      });
      if (successView) successView.hidden = false;
      form.dataset.state = "success";
      if (section && successHeading?.id) section.setAttribute("aria-labelledby", successHeading.id);
      clearDraft();
      reachGoal(form, "form_success", { mode, contact: payload?.messenger || "email" });
      window.requestAnimationFrame(() => (successHeading || successView)?.focus({ preventScroll: false }));
    };

    const showDeliveryError = (message) => {
      submittedForm = null;
      setBusy(false);
      setSummary(message, "error");
      showHelp(message);
    };

    const eventForm = (event, jqueryForm) => {
      if (jqueryForm instanceof HTMLFormElement) return jqueryForm;
      if (jqueryForm?.[0] instanceof HTMLFormElement) return jqueryForm[0];
      if (event?.detail?.form instanceof HTMLFormElement) return event.detail.form;
      if (event?.detail instanceof HTMLFormElement) return event.detail;
      return event?.target instanceof HTMLFormElement ? event.target : null;
    };

    // Успех показываем только по событию той же нативной формы, которую отправили
    const onTildaSuccess = (event, jqueryForm) => {
      if (submittedForm && eventForm(event, jqueryForm) === submittedForm) showSuccess();
    };
    const onTildaError = (event, jqueryForm) => {
      if (submittedForm && eventForm(event, jqueryForm) === submittedForm) showDeliveryError(TEXT.sendFailed);
    };

    listen(document, "tildaform:aftersuccess", onTildaSuccess);
    listen(document, "tildaform:aftererror", onTildaError);
    const jqueryNamespace = `.academyRequestForm${controllers.length}`;
    if (typeof window.jQuery === "function") {
      window.jQuery(document).on(`tildaform:aftersuccess${jqueryNamespace}`, onTildaSuccess);
      window.jQuery(document).on(`tildaform:aftererror${jqueryNamespace}`, onTildaError);
      cleanups.push(() => window.jQuery(document).off(jqueryNamespace));
    }

    // Пока открыта CAPTCHA Тильды, это не ошибка и не долгая отправка: ждём дальше
    const watchSlowDelivery = (nativeForm) => {
      window.clearTimeout(slowTimer);
      slowTimer = window.setTimeout(() => {
        if (!busy || submittedForm !== nativeForm) return;
        if (captchaOpen()) {
          watchSlowDelivery(nativeForm);
          return;
        }
        showHelp(TEXT.slow);
      }, SLOW_DELIVERY_MS);
    };

    let submittedPayload = null;

    const handleSubmit = async (event) => {
      event.preventDefault();
      if (busy) return;

      if (telegramInput && isActive(telegramInput) && !telegramMessage(telegramInput.value)) {
        telegramInput.value = `@${normalizeTelegram(telegramInput.value)}`;
      }
      const list = activeInputs();
      const invalid = list.filter((input) => {
        const message = messageFor(input);
        showFieldError(input, message);
        return Boolean(message);
      });
      if (invalid.length) {
        setSummary(`Проверьте ${invalid.length} ${fieldsWord(invalid.length)}`, "invalid");
        invalid[0].focus({ preventScroll: true });
        const smooth = !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        invalid[0].scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
        return;
      }

      const phone = phoneE164();
      const messenger = messengerInputs.length ? selectedMessenger() : null;
      const payload = {
        name: normalizeName(nameInput.value),
        email: emailInput ? emailInput.value.trim() : null,
        phone,
        phoneDisplay: phoneInput.value.trim(),
        messenger,
        messengerContact: messenger === "telegram" ? `@${normalizeTelegram(telegramInput.value)}` : messenger === "max" ? phone : "",
      };
      submittedPayload = payload;
      reachGoal(form, "form_submit", { mode, contact: messenger || "email" });

      setSummary(TEXT.sending, "loading");
      hideHelp();
      setBusy(true);

      const nativeForm = hideTildaFormRecord(formName);
      if (!(nativeForm instanceof HTMLFormElement)) {
        showDeliveryError(TEXT.unavailable);
        return;
      }

      const extras = [];
      if (form.dataset.source) extras.push(["form_source", form.dataset.source, "replace"]);
      if (form.dataset.deviceField) extras.push([form.dataset.deviceField, device, form.dataset.deviceMode || "append"]);

      try {
        await syncTildaForm(nativeForm, payload, extras);
        if (disposed) return;
        submittedForm = nativeForm;
        const nativeSubmit = nativeForm.querySelector('button[type="submit"], input[type="submit"]');
        if (nativeSubmit instanceof HTMLElement) nativeForm.requestSubmit(nativeSubmit);
        else nativeForm.requestSubmit();
        await new Promise((resolve) => window.requestAnimationFrame(resolve));
        // Нативная проверка Тильды не пропустила поля: событие не придёт, выходим из ожидания
        if (submittedForm === nativeForm && nativeForm.querySelector(".js-error-control-box")) {
          showDeliveryError(TEXT.sendFailed);
          return;
        }
        if (submittedForm === nativeForm) watchSlowDelivery(nativeForm);
      } catch (error) {
        if (error instanceof ContractError) {
          console.error(`Форма заявки «${formName}»: нативная форма Тильды не совпадает с контрактом: ${error.message}`);
        }
        showDeliveryError(TEXT.sendFailed);
      }
    };

    listen(form, "submit", handleSubmit);

    /* Начальное состояние */

    const draft = readDraft();
    if (draft) {
      if (nameInput && draft.name) nameInput.value = draft.name;
      if (emailInput && draft.email) emailInput.value = draft.email;
      if (phoneInput && draft.phone) {
        if (draft.phoneMode === "intl") setPhoneMode("intl", { keepValue: true });
        phoneInput.value = draft.phone;
      }
      const savedMessenger = messengerInputs.find((input) => input.value === draft.messenger);
      if (savedMessenger) savedMessenger.checked = true;
      if (telegramInput && draft.telegram) telegramInput.value = draft.telegram;
    }
    renderMessenger();
    if (submit) submit.disabled = false;
    if (formName) watchedNames.add(formName);
    hideTildaFormRecord(formName);

    return {
      formName,
      onDiscoveryEnd() {
        if (IS_PRODUCTION && !findTildaForm(formName) && form.dataset.state !== "success") showHelp(TEXT.noNative);
      },
      cleanup() {
        disposed = true;
        submittedForm = null;
        window.clearTimeout(slowTimer);
        cleanups.forEach((release) => release());
      },
    };
  };

  /* ---------- Поиск нативных форм, которые Тильда дорисовывает позже ---------- */

  const hideKnownForms = () => {
    watchedNames.forEach(hideTildaFormRecord);
    if (watchedNames.size && [...watchedNames].every(findTildaForm)) finishDiscovery();
  };

  const observer = new MutationObserver(hideKnownForms);
  let discoveryTimer = 0;
  let discoveryDone = false;

  function finishDiscovery() {
    if (discoveryDone) return;
    discoveryDone = true;
    observer.disconnect();
    window.clearTimeout(discoveryTimer);
    controllers.forEach((controller) => controller.onDiscoveryEnd());
  }

  forms.forEach((form) => controllers.push(setupForm(form)));
  observer.observe(document.body, { childList: true, subtree: true });
  discoveryTimer = window.setTimeout(finishDiscovery, DISCOVERY_MS);
  hideKnownForms();

  window.__academyRequestFormCleanup = () => {
    observer.disconnect();
    window.clearTimeout(discoveryTimer);
    controllers.forEach((controller) => controller.cleanup());
    window.__academyRequestFormCleanup = undefined;
  };
})();
