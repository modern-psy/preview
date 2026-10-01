/* ============================================================================
   ПОВЕДЕНИЕ СТРАНИЦЫ «ПОЧЕМУ КПТ ПОДХОДИТ ПОЧТИ ПОД ЛЮБОЙ ЗАПРОС»
   ============================================================================

   Скрипт делает три вещи:
     1) плавно раскрывает вопросы в блоке «Ответы на популярные вопросы».
        Без скрипта аккордеон тоже работает — просто без анимации:
        это обычный тег <details>;
     2) проверяет форму и передаёт заявку в скрытую форму Тильды;
     3) после того как Тильда приняла заявку, нажимает нужную кнопку
        виджета BotHelp, чтобы человек подписался на бота.

   ПОЧЕМУ ИМЕННО ТАКОЙ ПОРЯДОК
   BotHelp по клику уводит со страницы в этой же вкладке (location.href).
   Если нажать его кнопку раньше, страница закроется, а заявка в Тильду
   уйти не успеет. Поэтому: сначала Тильда, потом BotHelp.

   ПОРЯДОК РАЗДЕЛОВ
     0. Общее
     1. Аккордеон
     2. Телефон: нормализация и выбор страны
     3. Скрытая форма Тильды
     4. Виджет BotHelp
     5. Форма записи
   ========================================================================== */

(() => {
  "use strict";

  const page = document.querySelector(".kpt-page");
  if (!page) return;

  /* --------------------------------------------------------------------------
     0. ОБЩЕЕ
     -------------------------------------------------------------------------- */

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // На боевом домене форма обязана достучаться до формы Тильды.
  // На превью её нет, поэтому шаг с Тильдой пропускается — иначе страницу
  // нельзя было бы проверить.
  const IS_PRODUCTION = /(^|\.)modern-psy\.ru$/.test(window.location.hostname);

  // Сколько ждём виджет BotHelp, прежде чем признать, что он не загрузился
  const BOTHELP_TIMEOUT_MS = 12000;

  // Сколько ждём, что BotHelp уведёт человека в мессенджер. Если не увёл
  // (например, не ответил их сервер) — разблокируем форму и показываем ссылку
  const HANDOFF_TIMEOUT_MS = 6000;

  // Ник принимаем и с собачкой, и без неё — в Тильду уходит всегда с ней
  const TELEGRAM_USERNAME = /^@?[A-Za-z0-9_]{3,32}$/;
  const withAt = (value) => {
    const clean = String(value || "").trim().replace(/^@+/, "");
    return clean ? `@${clean}` : "";
  };
  const VK_CONTACT = /^(https?:\/\/)?(m\.)?vk\.(com|ru)\/[A-Za-z0-9._-]{2,}$|^id\d{4,}$|^[A-Za-z][A-Za-z0-9._-]{2,}$/;

  /* --------------------------------------------------------------------------
     1. АККОРДЕОН
     --------------------------------------------------------------------------
     Тег <details> открывается мгновенно. Чтобы содержимое выезжало плавно,
     перехватываем нажатие и анимируем высоту панели сами.
     -------------------------------------------------------------------------- */

  page.querySelectorAll("[data-accordion]").forEach((accordion) => {
    const items = Array.from(accordion.querySelectorAll("[data-accordion-item]"));
    const animations = new Map();

    const parts = (item) => ({
      summary: item.querySelector("[data-accordion-trigger]"),
      panel: item.querySelector("[data-accordion-panel]"),
    });

    const syncState = (item, isOpen) => {
      const { summary } = parts(item);
      summary?.setAttribute("aria-expanded", String(isOpen));
      item.dataset.accordionState = isOpen ? "open" : "closed";
    };

    const setOpen = (item, shouldOpen) => {
      const { summary, panel } = parts(item);
      if (!summary || !panel) return;

      animations.get(item)?.cancel();
      animations.delete(item);

      if (reducedMotion.matches || typeof panel.animate !== "function") {
        item.open = shouldOpen;
        syncState(item, shouldOpen);
        return;
      }

      summary.setAttribute("aria-expanded", String(shouldOpen));

      if (shouldOpen) {
        item.open = true;
        item.dataset.accordionState = "opening";

        const animation = panel.animate(
          [
            { height: "0px", opacity: 0 },
            { height: `${panel.scrollHeight}px`, opacity: 1 },
          ],
          { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );

        animations.set(item, animation);
        animation.addEventListener("finish", () => {
          animations.delete(item);
          syncState(item, true);
        }, { once: true });
        return;
      }

      if (!item.open) {
        syncState(item, false);
        return;
      }

      item.dataset.accordionState = "closing";

      const animation = panel.animate(
        [
          { height: `${panel.getBoundingClientRect().height}px`, opacity: 1 },
          { height: "0px", opacity: 0 },
        ],
        { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
      );

      animations.set(item, animation);
      animation.addEventListener("finish", () => {
        animations.delete(item);
        item.open = false;
        syncState(item, false);
      }, { once: true });
    };

    items.forEach((item) => {
      const { summary } = parts(item);
      if (!summary) return;

      syncState(item, item.open);

      summary.addEventListener("click", (event) => {
        event.preventDefault();
        setOpen(item, !item.open || item.dataset.accordionState === "closing");
      });
    });
  });


  /* --------------------------------------------------------------------------
     1.5. МЕНЮ В ШАПКЕ
     --------------------------------------------------------------------------
     На узких экранах разделы страницы спрятаны под кнопку с тремя полосками.
     Закрывается по выбору пункта, по клику мимо и по Esc.
     -------------------------------------------------------------------------- */

  const menuToggle = document.querySelector("[data-menu-toggle]");
  const menu = menuToggle && document.getElementById(menuToggle.getAttribute("aria-controls"));

  if (menuToggle && menu) {
    const setMenu = (isOpen) => {
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menu.hidden = !isOpen;
    };

    menuToggle.addEventListener("click", () => {
      setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("click", (event) => {
      if (menu.hidden) return;
      if (event.target.closest(".site-header_component")) return;
      setMenu(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || menu.hidden) return;
      setMenu(false);
      menuToggle.focus();
    });
  }


  /* --------------------------------------------------------------------------
     2. ТЕЛЕФОН
     -------------------------------------------------------------------------- */

  // Приводим что угодно к виду +79991234567. Российские «8…» и «9…» чинятся.
  const toE164 = (value, callingCode = "7") => {
    const raw = String(value || "").trim();
    let digits = raw.replace(/\D/g, "");
    if (!digits) return "";

    if (digits.startsWith("00")) return `+${digits.slice(2, 17)}`;
    if (raw.startsWith("+")) return `+${digits.slice(0, 15)}`;

    if (callingCode === "7") {
      if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
      else if (digits.length === 10) digits = `7${digits}`;
      else if (!digits.startsWith("7")) digits = `7${digits}`;
    } else if (!digits.startsWith(callingCode)) {
      digits = `${callingCode}${digits}`;
    }

    return `+${digits.slice(0, 15)}`;
  };

  const looksLikePhone = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15;
  };

  // Тильда хранит российский номер без «+7», а иностранный — целиком
  const toTildaPhone = (e164) => {
    const digits = e164.replace(/\D/g, "");
    if (!digits) return "";
    return digits.startsWith("7") ? digits.slice(1, 11) : `+${digits}`;
  };

  // Выбор страны с автоопределением по введённому номеру — как на /trauma-therapy
  const createPhoneControl = (input) => {
    let utilsReady = false;
    let instance = null;
    let ready = Promise.resolve();

    if (input instanceof HTMLInputElement && typeof window.intlTelInput === "function") {
      instance = window.intlTelInput(input, {
        countryNameLocale: "ru",
        countryOrder: ["ru", "kz", "by", "uz"],
        countrySearch: true,
        countrySelectorMode: "AUTO",
        dropdownParent: document.body,
        formatAsYouType: true,
        initialCountry: "ru",
        loadUtils: () => import("https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/js/utils.js"),
        numberDisplayFormat: "INTERNATIONAL",
        placeholderNumberPolicy: "AGGRESSIVE",
        separateDialCode: true,
        strictMode: true,
        uiTranslations: {
          selectedCountryAriaLabel: "Изменить страну номера, выбрана ${countryName} (${dialCode})",
          noCountrySelected: "Выбрать страну номера телефона",
          countryListAriaLabel: "Список стран",
          searchPlaceholder: "Поиск страны или кода",
          clearSearchAriaLabel: "Очистить поиск",
          searchEmptyState: "Страна не найдена",
          searchSummaryAria: (count) => `Найдено стран: ${count}`,
        },
      });

      ready = instance.promise
        .then(() => { utilsReady = true; })
        .catch(() => { utilsReady = false; });
    }

    const callingCode = () => instance?.getSelectedCountry?.()?.dialCode || "7";

    return {
      ready,
      getNumber() {
        if (utilsReady && instance?.isValidNumber()) return instance.getNumber();
        return toE164(input.value, callingCode());
      },
      isValid() {
        if (utilsReady && instance) return instance.isValidNumber();
        return looksLikePhone(toE164(input.value, callingCode()));
      },
    };
  };


  /* --------------------------------------------------------------------------
     3. СКРЫТАЯ ФОРМА ТИЛЬДЫ
     --------------------------------------------------------------------------
     Тильда рисует свою форму где-то на странице. Мы её прячем, а по нажатию
     на нашу кнопку раскладываем данные по её полям и жмём её кнопку.
     Значения выставляем «родным» сеттером и шлём события input/change —
     иначе скрипты Тильды не заметят, что поля заполнены.
     -------------------------------------------------------------------------- */

  const setNativeValue = (input, value) => {
    if (!(input instanceof HTMLInputElement)) return;

    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (setter) setter.call(input, value);
    else input.value = value;

    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const findTildaForm = (formName) =>
    [...document.querySelectorAll("form.t-form")].find(
      (form) => form.querySelector('input[name="tildaspec-formname"]')?.value === formName
    ) || null;

  const hideTildaForm = (formName) => {
    const nativeForm = findTildaForm(formName);
    if (!(nativeForm instanceof HTMLFormElement)) return null;

    const record = nativeForm.closest(".t-rec") || nativeForm;
    record.hidden = true;
    record.setAttribute("aria-hidden", "true");
    record.setAttribute("data-kpt-native-form-record", "");

    return nativeForm;
  };

  const fillTildaPhone = (group, e164, resultName) => {
    if (!(group instanceof HTMLElement)) return;

    const visibleInputs = [...group.querySelectorAll('input.t-input-phonemask:not([type="hidden"])')];

    if (typeof window.t_form_phonemask__setValue === "function") {
      window.t_form_phonemask__setValue(group, e164, undefined, { noFocus: true });
    } else {
      visibleInputs.forEach((input) => setNativeValue(input, toTildaPhone(e164)));
    }

    const visible = visibleInputs[0];
    const shown = visible?.dataset.phonemaskCurrent || visible?.value || "";
    const dialCode = visible?.dataset.phonemaskCode || "";
    const formatted = shown.startsWith("+") ? shown : `${dialCode} ${shown}`.trim();

    group.querySelectorAll(`input.js-phonemask-result[name="${resultName}"]`)
      .forEach((input) => setNativeValue(input, formatted || e164));

    group.querySelectorAll("input.js-phonemask-result-iso")
      .forEach((input) => setNativeValue(input, visible?.dataset.phonemaskIso || input.value || "ru"));
  };

  // В блоке «способ связи» у Тильды свои названия вариантов.
  // Если нужного варианта в форме нет — не роняем заявку, а пишем предупреждение.
  const TILDA_MESSENGER_ALIASES = {
    vkontakte: ["vkontakte", "vk"],
    telegram: ["telegram"],
    max: ["max"],
  };

  const selectTildaMessenger = (group, messenger) => {
    const radios = [...group.querySelectorAll('input[type="radio"][name="messenger-type"]')];
    const aliases = TILDA_MESSENGER_ALIASES[messenger] || [messenger];
    const radio = radios.find((item) => aliases.includes(item.value));

    if (!(radio instanceof HTMLInputElement)) {
      console.warn(
        `[форма] В форме Тильды нет способа связи «${messenger}». ` +
        `Есть: ${radios.map((item) => item.value).join(", ") || "ни одного"}. ` +
        "Заявка уйдёт без способа связи."
      );
      return false;
    }

    radio.checked = true;
    radio.dispatchEvent(new Event("input", { bubbles: true }));
    radio.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  };

  const syncTildaForm = async (nativeForm, data) => {
    const nameInput = nativeForm.querySelector('input[data-tilda-rule="name"], input[name="Name"]');
    const phoneGroup = [...nativeForm.querySelectorAll(".t-input-group_ph")]
      .find((group) => !group.closest(".t-input-group_contact_method"));
    const messengerGroup = nativeForm.querySelector(".t-input-group_contact_method");

    if (!(nameInput instanceof HTMLInputElement) || !(phoneGroup instanceof HTMLElement)) {
      throw new Error("В форме Тильды не нашлись поля «Имя» или «Телефон»");
    }

    setNativeValue(nameInput, data.name);
    fillTildaPhone(phoneGroup, data.phone, "Phone");

    if (!(messengerGroup instanceof HTMLElement)) {
      console.warn("[форма] В форме Тильды нет блока «способ связи» — контакт в мессенджере не передан.");
      return;
    }

    const messengerSelected = selectTildaMessenger(messengerGroup, data.messenger);

    // Даём Тильде кадр, чтобы перерисовать поле под выбранный мессенджер
    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    messengerGroup
      .querySelectorAll('input[name="messenger-id"], input[name="tildaspec-phone-part[]"], input[name="tildaspec-phone-part[]-iso"]')
      .forEach((input) => setNativeValue(input, ""));

    if (!messengerSelected) return;

    if (data.messenger === "max") {
      const activeInput = messengerGroup.querySelector('input.t-input-phonemask:not([type="hidden"]):not(:disabled)');
      const activeGroup = activeInput?.closest(".t-phonemask-input-group");

      if (activeGroup instanceof HTMLElement) {
        fillTildaPhone(activeGroup, data.messengerContact, "messenger-id");
      } else {
        console.warn("[форма] Не нашлось поле телефона MAX в форме Тильды.");
      }
      return;
    }

    const contactInput = messengerGroup.querySelector('input[name="messenger-id"]:not([type="hidden"]):not(:disabled)');
    if (contactInput instanceof HTMLInputElement) {
      setNativeValue(contactInput, data.messengerContact);
    } else {
      console.warn("[форма] Не нашлось текстовое поле контакта в форме Тильды.");
    }
  };


  /* --------------------------------------------------------------------------
     4. ВИДЖЕТ BOTHELP
     --------------------------------------------------------------------------
     Виджет подгружает свои кнопки не сразу, поэтому ждём их появления.
     Пока не дождались — кнопка отправки заблокирована, на месте согласия
     стоит скелет. Если за отведённое время кнопки не пришли, форма всё равно
     начинает работать: заявка уйдёт в Тильду, а ссылку пришлют вручную.
     -------------------------------------------------------------------------- */

  const createBotHelp = (mount, onChange) => {
    const skeleton = mount.querySelector("[data-bh-skeleton]");
    const errorNote = mount.querySelector("[data-bh-error]");
    let state = "loading"; // loading → ready | failed
    let observer = null;
    let timer = 0;

    const buttons = () => [...mount.querySelectorAll("button.bh-w-messenger-button")];
    const checkboxes = () => [...mount.querySelectorAll("[data-consent-checkbox]")];

    const setState = (next) => {
      if (state === next) return;
      state = next;
      mount.dataset.bhState = next;
      if (skeleton) skeleton.hidden = next !== "loading";
      if (errorNote) errorNote.hidden = next !== "failed";
      onChange();
    };

    const finish = () => {
      window.clearTimeout(timer);
      observer?.disconnect();
      observer = null;
    };

    // Согласие: BotHelp сам не пускает клик, пока галочка снята,
    // причём молча. Поэтому состояние читаем и блокируем кнопку сами.
    const consentGiven = () => {
      const items = checkboxes();
      return items.length === 0 || items.every((item) => item.checked);
    };

    mount.addEventListener("change", (event) => {
      if (event.target.matches("[data-consent-checkbox]")) onChange();
    });

    const check = () => {
      if (buttons().length === 0) return false;
      finish();
      setState("ready");
      return true;
    };

    if (!check()) {
      observer = new MutationObserver(check);
      observer.observe(mount, { childList: true, subtree: true });
      timer = window.setTimeout(() => {
        finish();
        setState("failed");
      }, BOTHELP_TIMEOUT_MS);
    }

    return {
      isReady: () => state === "ready",
      isLoading: () => state === "loading",
      consentGiven,
      hasButton: (type) => buttons().some((button) => button.dataset.type === type),
      // Прямая ссылка на бота — запасной вариант, если переход не сработал
      linkFor: (type) => buttons().find((item) => item.dataset.type === type)?.dataset.href || "",
      // Нажимаем именно <button>: BotHelp читает data-href у самого event.target,
      // а у иконки и подписи внутри этих атрибутов нет.
      open(type) {
        const button = buttons().find((item) => item.dataset.type === type);
        if (!button) return false;
        button.click();
        return true;
      },
      destroy: finish,
    };
  };


  /* --------------------------------------------------------------------------
     5. ФОРМА ЗАПИСИ
     -------------------------------------------------------------------------- */

  page.querySelectorAll("[data-lead-form]").forEach((form) => {
    const formName = form.dataset.tildaFormName || "";
    const inputs = [...form.querySelectorAll("[data-lead-input]")];
    const messengerInputs = [...form.querySelectorAll('input[name="messenger"]')];
    const contactFields = [...form.querySelectorAll("[data-lead-contact-field]")];
    const submit = form.querySelector("[data-lead-submit]");
    const submitLabel = form.querySelector("[data-lead-submit-label]");
    const status = form.querySelector("[data-lead-status]");
    const contentParts = [...form.querySelectorAll("[data-lead-content]")];
    const successView = form.querySelector("[data-lead-success]");
    const manualBlock = form.querySelector("[data-lead-manual]");
    const manualLink = form.querySelector("[data-lead-manual-link]");
    const roistat = form.querySelector("[data-lead-roistat]");
    const bhMount = form.querySelector("[data-bh-mount]");

    const phoneControls = new Map();
    let busy = false;
    let formIsValid = false;
    let submittedForm = null;

    if (roistat) roistat.value = window.location.href;

    // Выбор страны подключаем только к видимому полю: пока поле скрыто,
    // библиотека меряет нулевую ширину и потом рисует код страны мимо рамки.
    const ensurePhoneControl = (input) => {
      if (!(input instanceof HTMLInputElement)) return null;
      if (!phoneControls.has(input)) phoneControls.set(input, createPhoneControl(input));
      return phoneControls.get(input);
    };

    ensurePhoneControl(form.querySelector("[data-lead-phone]"));

    const setStatus = (message = "", state = "idle") => {
      if (!status) return;
      status.textContent = message;
      status.dataset.state = state;
    };

    const bothelp = bhMount ? createBotHelp(bhMount, () => void refreshSubmit()) : null;

    /* --- Проверка полей ------------------------------------------------- */

    const fieldOf = (input) => input.closest("[data-lead-field]");

    const messageFor = async (input) => {
      if (!(input instanceof HTMLInputElement) || input.disabled || input.hidden) return "";

      const value = input.value.trim();

      if (input.name === "name") {
        return value.length >= 2 ? "" : "Напишите, как вас зовут";
      }

      if (input.name === "telegramContact") {
        return TELEGRAM_USERNAME.test(value) ? "" : "От 3 символов: латиница, цифры и подчёркивание";
      }

      if (input.name === "vkContact") {
        return VK_CONTACT.test(value) ? "" : "Ссылка на страницу или ID: vk.com/id1234567";
      }

      if (phoneControls.has(input)) {
        const control = phoneControls.get(input);
        await control.ready;
        return control.isValid() ? "" : "Проверьте номер телефона";
      }

      return value ? "" : "Поле не может быть пустым";
    };

    const applyFieldState = (input, message, isValid) => {
      const field = fieldOf(input);
      const error = field?.querySelector("[data-lead-error]");

      input.setAttribute("aria-invalid", String(Boolean(message)));
      if (field) field.dataset.state = message ? "invalid" : isValid ? "valid" : "idle";
      if (error) error.textContent = message;
    };

    const validate = async (input) => {
      const message = await messageFor(input);
      applyFieldState(input, message, !message && Boolean(input.value.trim()));
      return !message;
    };

    const activeInputs = () => inputs.filter((input) => !input.disabled && !input.hidden);

    /* --- Состояние кнопки ------------------------------------------------ */

    const blockingReason = () => {
      if (!formIsValid) return "";
      if (bothelp?.isLoading()) return "Загружаем выбор мессенджера…";
      if (bothelp?.isReady() && !bothelp.consentGiven()) return "Подтвердите согласие, чтобы продолжить";
      return "";
    };

    const renderSubmit = () => {
      const blocked = Boolean(blockingReason());

      if (submit instanceof HTMLButtonElement) {
        submit.disabled = busy || !formIsValid || blocked;
        submit.setAttribute("aria-busy", String(busy));
        submit.dataset.state = busy ? "loading" : submit.disabled ? "disabled" : "ready";
      }

      if (submitLabel) {
        submitLabel.textContent = busy ? "Отправляем…" : "Записаться на вебинар";
      }
    };

    let revision = 0;
    const refreshSubmit = async () => {
      const current = ++revision;
      const list = activeInputs();
      const messages = await Promise.all(list.map(messageFor));
      if (current !== revision) return;

      formIsValid = list.length > 0 && messages.every((message) => !message);
      renderSubmit();
    };

    /* --- Переключение мессенджера ---------------------------------------- */

    const selectedMessenger = () =>
      messengerInputs.find((input) => input.checked)?.value || "vkontakte";

    const renderContactField = () => {
      const current = selectedMessenger();

      contactFields.forEach((field) => {
        const isActive = field.dataset.leadContactField === current;
        const input = field.querySelector("[data-lead-input]");

        field.hidden = !isActive;
        if (!input) return;

        input.disabled = !isActive;
        applyFieldState(input, "", false);

        if (isActive && input.hasAttribute("data-lead-max-contact")) {
          ensurePhoneControl(input);
        }
      });

      setStatus();
    };

    /* --- События ---------------------------------------------------------- */

    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        input.dataset.dirty = "true";
        applyFieldState(input, "", false);
        setStatus();
        void refreshSubmit();
      });

      input.addEventListener("blur", () => {
        if (input.dataset.dirty === "true") void validate(input).then(refreshSubmit);
      });

      // Смена страны в выпадающем списке телефона
      input.addEventListener("countrychange", () => {
        applyFieldState(input, "", false);
        void refreshSubmit();
      });
    });

    messengerInputs.forEach((input) => {
      input.addEventListener("change", () => {
        renderContactField();
        void refreshSubmit();
      });
    });

    /* --- Ответ Тильды ----------------------------------------------------- */

    const eventForm = (event, passedForm) =>
      passedForm instanceof HTMLFormElement ? passedForm
        : event?.detail?.form instanceof HTMLFormElement ? event.detail.form
        : event?.target instanceof HTMLFormElement ? event.target
        : null;

    const showSuccess = () => {
      busy = false;
      setStatus();
      contentParts.forEach((part) => { part.hidden = true; });
      if (successView instanceof HTMLElement) successView.hidden = false;
      form.dataset.state = "success";
      window.requestAnimationFrame(() => successView?.focus({ preventScroll: true }));
      submittedForm = null;
    };

    const showError = (message) => {
      submittedForm = null;
      busy = false;
      renderSubmit();
      setStatus(message, "error");
    };

    // Заявка ушла — уводим человека в мессенджер.
    // Если виджет не загрузился, показываем обычный экран «Вы записаны».
    const handoffToBotHelp = () => {
      const messenger = selectedMessenger();

      if (bothelp?.isReady() && bothelp.hasButton(messenger)) {
        setStatus("Переносим вас в мессенджер…", "loading");
        submittedForm = null;

        if (bothelp.open(messenger)) {
          // Обычно страница закрывается прямо здесь. Если через несколько
          // секунд мы всё ещё тут — переход не сработал: показываем экран
          // «Вы записаны» и ссылку на бота, чтобы человек не завис.
          window.setTimeout(() => {
            const link = bothelp.linkFor(messenger);

            if (link && manualLink instanceof HTMLAnchorElement && manualBlock) {
              manualLink.href = link;
              manualBlock.hidden = false;
            }

            showSuccess();
          }, HANDOFF_TIMEOUT_MS);
          return;
        }
      }

      showSuccess();
    };

    const handleTildaSuccess = (event, passedForm) => {
      if (!submittedForm) return;
      const successful = eventForm(event, passedForm);
      if (successful && successful !== submittedForm) return;
      handoffToBotHelp();
    };

    const handleTildaError = (event, passedForm) => {
      if (!submittedForm) return;
      const failed = eventForm(event, passedForm);
      if (failed && failed !== submittedForm) return;
      showError("Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.");
    };

    document.addEventListener("tildaform:aftersuccess", handleTildaSuccess);
    document.addEventListener("tildaform:aftererror", handleTildaError);

    if (typeof window.jQuery === "function") {
      window.jQuery(document).on("tildaform:aftersuccess.kptLeadForm", handleTildaSuccess);
      window.jQuery(document).on("tildaform:aftererror.kptLeadForm", handleTildaError);
    }

    /* --- Отправка --------------------------------------------------------- */

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (busy) return;

      const list = activeInputs();
      const results = await Promise.all(list.map(validate));
      const firstBad = results.findIndex((ok) => !ok);

      if (firstBad !== -1) {
        formIsValid = false;
        renderSubmit();
        list[firstBad].focus();
        setStatus("Проверьте выделенные поля.", "error");
        return;
      }

      const blocked = blockingReason();
      if (blocked) {
        setStatus(blocked, "error");
        return;
      }

      busy = true;
      renderSubmit();
      setStatus("Отправляем заявку…", "loading");

      const messenger = selectedMessenger();
      const contactInput = form.querySelector(`[data-lead-contact-field="${messenger}"] [data-lead-input]`);
      const contactControl = phoneControls.get(contactInput);

      const data = {
        name: form.elements.name.value.trim(),
        phone: phoneControls.get(form.querySelector("[data-lead-phone]")).getNumber(),
        messenger,
        messengerContact: contactControl
          ? contactControl.getNumber()
          : messenger === "telegram"
            ? withAt(contactInput.value)
            : contactInput.value.trim(),
      };

      form.dispatchEvent(new CustomEvent("kpt-lead-form:validated", {
        bubbles: true,
        detail: { formData: data },
      }));

      const nativeForm = hideTildaForm(formName);

      // На превью формы Тильды нет — сразу отдаём управление BotHelp
      if (!(nativeForm instanceof HTMLFormElement)) {
        if (IS_PRODUCTION) {
          showError("Не удалось найти служебную форму Tilda. Обновите страницу и попробуйте ещё раз.");
          return;
        }
        console.info("[форма] Формы Тильды на странице нет — превью-режим, отправка пропущена.", data);
        handoffToBotHelp();
        return;
      }

      try {
        await syncTildaForm(nativeForm, data);
        submittedForm = nativeForm;

        const nativeSubmit = nativeForm.querySelector('button[type="submit"], input[type="submit"]');
        if (nativeSubmit instanceof HTMLElement) nativeForm.requestSubmit(nativeSubmit);
        else nativeForm.requestSubmit();

        await new Promise((resolve) => window.requestAnimationFrame(resolve));

        // Тильда не приняла данные своей же проверкой
        if (submittedForm === nativeForm && nativeForm.querySelector(".js-error-control-box")) {
          showError("Tilda не приняла данные формы. Проверьте заполненные поля и попробуйте ещё раз.");
        }
      } catch (error) {
        console.error(error);
        showError("Не удалось передать заявку. Обновите страницу и попробуйте ещё раз.");
      }
    });

    /* --- Старт ------------------------------------------------------------ */

    if (formName) hideTildaForm(formName);
    renderContactField();
    void refreshSubmit();

    // Тильда дорисовывает свои блоки позже — прячем форму снова, когда появится
    if (formName) {
      new MutationObserver(() => hideTildaForm(formName))
        .observe(document.body, { childList: true, subtree: true });
    }
  });
})();
