// Academy lead form: opt-in UI and Tilda bridge. Integration: lead-form.md.
(() => {
  if (typeof window.__academyLeadFormCleanup === "function") {
    window.__academyLeadFormCleanup();
  }

  const forms = [...document.querySelectorAll(".academy-page [data-academy-lead-form]")];
  if (!forms.length) return;

  const INTL_TEL_INPUT_UTILS_URL =
    "https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/js/utils.js";
  const ASCII_EMAIL_PATTERN =
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
  const TELEGRAM_USERNAME_PATTERN = /^@[A-Za-z0-9_]{3,32}$/;
  const formControllers = [];
  const observedTildaFormNames = new Set();

  const normalizePhoneToE164 = (value, defaultCallingCode = "7") => {
    const rawValue = String(value || "").trim();
    let digits = rawValue.replace(/\D/g, "");

    if (!digits) {
      return "";
    }

    if (digits.startsWith("00")) {
      return `+${digits.slice(2, 17)}`;
    }

    if (rawValue.startsWith("+")) {
      return `+${digits.slice(0, 15)}`;
    }

    if (defaultCallingCode === "7") {
      if (digits.length === 11 && digits.startsWith("8")) {
        digits = `7${digits.slice(1)}`;
      } else if (digits.length === 10) {
        digits = `7${digits}`;
      } else if (!digits.startsWith("7")) {
        digits = `7${digits}`;
      }
    } else if (!digits.startsWith(defaultCallingCode)) {
      digits = `${defaultCallingCode}${digits}`;
    }

    return `+${digits.slice(0, 15)}`;
  };

  const isPlausibleInternationalPhone = (value) => {
    const digits = String(value || "").replace(/\D/g, "");

    return digits.length >= 8 && digits.length <= 15;
  };

  const getTildaPhoneValue = (value) => {
    const e164Value = normalizePhoneToE164(value);
    const digits = e164Value.replace(/\D/g, "");

    if (!digits) {
      return "";
    }

    return digits.startsWith("7") ? digits.slice(1, 11) : `+${digits}`;
  };

  const dispatchNativeInputEvents = (input) => {
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const setNativeInputValue = (input, value) => {
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;

    if (valueSetter) {
      valueSetter.call(input, value);
    } else {
      input.value = value;
    }

    dispatchNativeInputEvents(input);
  };

  const findTildaForm = (formName) =>
    (formName && [...document.querySelectorAll("form.t-form")].find(
      (form) =>
        form.querySelector('input[name="tildaspec-formname"]')?.value ===
        formName,
    )) || null;

  const hideTildaFormRecord = (formName) => {
    const nativeForm = findTildaForm(formName);

    if (!(nativeForm instanceof HTMLFormElement)) {
      return null;
    }

    const record = nativeForm.closest(".t-rec") || nativeForm;

    record.hidden = true;
    record.setAttribute("aria-hidden", "true");
    record.setAttribute("data-academy-native-form-record", "");

    return nativeForm;
  };

  const hideKnownTildaForms = () => {
    observedTildaFormNames.forEach(hideTildaFormRecord);
    if (observedTildaFormNames.size && [...observedTildaFormNames].every(findTildaForm)) {
      tildaFormObserver.disconnect();
      clearTimeout(discoveryTimer);
    }
  };

  const tildaFormObserver = new MutationObserver(hideKnownTildaForms);
  const discoveryTimer = setTimeout(() => tildaFormObserver.disconnect(), 10000);

  tildaFormObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  const initializePhoneInput = (input) => {
    let utilsReady = false;
    let instance = null;
    let ready = Promise.resolve();

    if (
      input instanceof HTMLInputElement &&
      typeof window.intlTelInput === "function"
    ) {
      instance = window.intlTelInput(input, {
        countryNameLocale: "ru",
        countryOrder: ["ru", "kz", "by", "uz"],
        countrySearch: true,
        countrySelectorMode: "AUTO",
        dropdownParent: document.body,
        formatAsYouType: true,
        initialCountry: "ru",
        loadUtils: () => import(INTL_TEL_INPUT_UTILS_URL),
        numberDisplayFormat: "INTERNATIONAL",
        placeholderNumberPolicy: "AGGRESSIVE",
        separateDialCode: true,
        strictMode: true,
        uiTranslations: {
          selectedCountryAriaLabel:
            "Изменить страну номера, выбрана ${countryName} (${dialCode})",
          noCountrySelected: "Выбрать страну номера телефона",
          countryListAriaLabel: "Список стран",
          searchPlaceholder: "Поиск страны или кода",
          clearSearchAriaLabel: "Очистить поиск",
          searchEmptyState: "Страна не найдена",
          searchSummaryAria(count) {
            return `Найдено стран: ${count}`;
          },
        },
      });
      ready = instance.promise
        .then(() => {
          utilsReady = true;
        })
        .catch(() => {
          utilsReady = false;
        });
    }

    return {
      destroy() {
        instance?.destroy();
        instance = null;
      },
      getCountryCallingCode() {
        return instance?.getSelectedCountry?.()?.dialCode || "7";
      },
      getNumber() {
        if (utilsReady && instance?.isValidNumber()) {
          return instance.getNumber();
        }

        return normalizePhoneToE164(
          input.value,
          instance?.getSelectedCountry?.()?.dialCode || "7",
        );
      },
      isValid() {
        const normalized = normalizePhoneToE164(
          input.value,
          instance?.getSelectedCountry?.()?.dialCode || "7",
        );

        return utilsReady && instance
          ? instance.isValidNumber()
          : isPlausibleInternationalPhone(normalized);
      },
      ready,
    };
  };

  const fillTildaPhoneGroup = (group, e164Phone, resultName) => {
    if (!(group instanceof HTMLElement)) {
      return;
    }

    const visibleInputs = [
      ...group.querySelectorAll(
        'input.t-input-phonemask:not([type="hidden"])',
      ),
    ];

    const tildaControlsPhoneMask =
      typeof window.t_form_phonemask__setValue === "function";

    if (tildaControlsPhoneMask) {
      window.t_form_phonemask__setValue(group, e164Phone, undefined, {
        noFocus: true,
      });
    } else {
      visibleInputs.forEach((input) => {
        setNativeInputValue(input, getTildaPhoneValue(e164Phone));
      });
    }

    const visibleInput = visibleInputs[0];
    const visiblePhone =
      visibleInput?.dataset.phonemaskCurrent || visibleInput?.value || "";
    const dialCode = visibleInput?.dataset.phonemaskCode || "";
    const formattedPhone = visiblePhone.startsWith("+")
      ? visiblePhone
      : `${dialCode} ${visiblePhone}`.trim();

    group
      .querySelectorAll(`input.js-phonemask-result[name="${resultName}"]`)
      .forEach((input) => {
        setNativeInputValue(input, formattedPhone || e164Phone);
      });

    group
      .querySelectorAll('input.js-phonemask-result-iso')
      .forEach((input) => {
        setNativeInputValue(
          input,
          visibleInput?.dataset.phonemaskIso || input.value || "ru",
        );
      });
  };

  const selectTildaMessenger = (group, messenger) => {
    const radios = [
      ...group.querySelectorAll('input[type="radio"][name="messenger-type"]'),
    ];
    const telegramRadio = radios.find((radio) => radio.value === "telegram");
    const maxRadio =
      radios.find((radio) => radio.value === "max") ||
      radios.find((radio) => radio.value === "whatsapp") ||
      radios[0];

    if (maxRadio && !maxRadio.dataset.academyOriginalValue) {
      maxRadio.dataset.academyOriginalValue = maxRadio.value;
    }

    if (maxRadio?.dataset.academyOriginalValue) {
      maxRadio.value = maxRadio.dataset.academyOriginalValue;
    }

    const selectedRadio = messenger === "telegram" ? telegramRadio : maxRadio;

    if (!(selectedRadio instanceof HTMLInputElement)) {
      return;
    }

    selectedRadio.checked = true;
    selectedRadio.dispatchEvent(new Event("input", { bubbles: true }));
    selectedRadio.dispatchEvent(new Event("change", { bubbles: true }));

    if (messenger === "max" && selectedRadio.value === "whatsapp") {
      selectedRadio.value = "max";
    }
  };

  const syncTildaForm = async (nativeForm, formData) => {
    const nameInput = nativeForm.querySelector(
      'input[data-tilda-rule="name"], input[name="Name"]',
    );
    const emailInput = nativeForm.querySelector(
      'input[data-tilda-rule="email"], input[name="email"], input[name="Email"]',
    );
    const phoneGroup = [...nativeForm.querySelectorAll(".t-input-group_ph")].find(
      (group) => !group.closest(".t-input-group_contact_method"),
    );
    const messengerGroup = nativeForm.querySelector(
      ".t-input-group_contact_method",
    );

    if (
      !(nameInput instanceof HTMLInputElement) ||
      !(emailInput instanceof HTMLInputElement) ||
      !(phoneGroup instanceof HTMLElement) ||
      !(messengerGroup instanceof HTMLElement)
    ) {
      throw new Error("Required Tilda form fields were not found");
    }

    setNativeInputValue(nameInput, formData.name);
    setNativeInputValue(emailInput, formData.email);
    fillTildaPhoneGroup(phoneGroup, formData.phone, "Phone");
    selectTildaMessenger(messengerGroup, formData.messenger);

    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    messengerGroup
      .querySelectorAll(
        'input[name="messenger-id"], input[name="tildaspec-phone-part[]"], input[name="tildaspec-phone-part[]-iso"]',
      )
      .forEach((input) => {
        setNativeInputValue(input, "");
      });

    if (formData.messenger === "telegram") {
      const telegramInput = messengerGroup.querySelector(
        'input[name="messenger-id"]:not([type="hidden"]):not(:disabled)',
      );

      if (!(telegramInput instanceof HTMLInputElement)) {
        throw new Error("Active Tilda Telegram field was not found");
      }

      setNativeInputValue(telegramInput, formData.messengerContact);
    } else {
      const activeMessengerPhoneInput = messengerGroup.querySelector(
        'input.t-input-phonemask:not([type="hidden"]):not(:disabled)',
      );
      const activeMessengerPhoneGroup =
        activeMessengerPhoneInput?.closest(".t-phonemask-input-group") || null;

      if (!(activeMessengerPhoneGroup instanceof HTMLElement)) {
        throw new Error("Active Tilda MAX field was not found");
      }

      fillTildaPhoneGroup(
        activeMessengerPhoneGroup,
        formData.messengerContact,
        "messenger-id",
      );
    }
  };

  const setupLeadForm = (form) => {
    const formName = form.dataset.tildaFormName?.trim() || "";
    const inputs = [...form.querySelectorAll("[data-lead-input]")];
    const messengerInputs = [
      ...form.querySelectorAll('input[name="messenger"]'),
    ];
    const mainPhoneInput = form.querySelector("[data-lead-phone]");
    const maxContactInput = form.querySelector("[data-lead-max-contact]");
    const telegramContactInput = form.querySelector(
      "[data-lead-telegram-contact]",
    );
    const maxContactField = maxContactInput?.closest("[data-lead-field]");
    const telegramContactField = form.querySelector(
      "[data-lead-telegram-field]",
    );
    const submit = form.querySelector("[data-lead-submit]");
    const submitLabel = form.querySelector("[data-lead-submit-label]");
    const status = form.querySelector("[data-lead-status]");
    const contentParts = [...form.querySelectorAll("[data-lead-content]")];
    const successView = form.querySelector("[data-lead-success]");
    const section = form.closest("section[aria-labelledby]");
    const listeners = [];
    const phoneControllers = new Map();
    let disposed = false;
    let busy = false;
    let formIsValid = false;
    let validityRevision = 0;
    let submittedTildaForm = null;

    if (formName) observedTildaFormNames.add(formName);
    hideTildaFormRecord(formName);

    [mainPhoneInput, maxContactInput].forEach((input) => {
      if (input instanceof HTMLInputElement) {
        phoneControllers.set(input, initializePhoneInput(input));
      }
    });

    const listen = (target, eventName, handler, options) => {
      target?.addEventListener(eventName, handler, options);
      listeners.push(() => target?.removeEventListener(eventName, handler, options));
    };

    const setStatus = (message = "", state = "idle") => {
      if (!status) {
        return;
      }

      status.textContent = message;
      status.dataset.state = state;
    };

    const renderSubmitState = () => {
      if (submit instanceof HTMLButtonElement) {
        submit.disabled = busy || !formIsValid;
        submit.setAttribute("aria-disabled", String(submit.disabled));
        submit.setAttribute("aria-busy", String(busy));
        submit.dataset.state = busy
          ? "loading"
          : formIsValid
            ? "ready"
            : "disabled";
      }

      if (submitLabel) {
        submitLabel.textContent = busy ? "Отправляем заявку…" : "Отправить заявку";
      }
    };

    const setBusy = (isBusy) => {
      busy = isBusy;
      renderSubmitState();
    };

    const getFieldParts = (input) => {
      const field = input.closest("[data-lead-field]");
      const error = field?.querySelector("[data-lead-error]");

      return { field, error };
    };

    const updateHasValue = (input) => {
      const { field } = getFieldParts(input);

      if (field) {
        field.dataset.hasValue = String(Boolean(input.value.trim()));
      }
    };

    const setFieldState = (input, message = "", isValid = false) => {
      const { field, error } = getFieldParts(input);

      input.setCustomValidity(message);
      input.setAttribute("aria-invalid", String(Boolean(message)));

      if (field) {
        field.dataset.state = message ? "invalid" : isValid ? "valid" : "idle";
      }

      if (error) {
        error.textContent = message;
      }

      updateHasValue(input);
    };

    const getInputValidationMessage = async (input) => {
      if (!(input instanceof HTMLInputElement) || input.disabled || input.hidden) {
        return "";
      }

      const value = input.value.trim();
      let message = "";

      if (input.name === "name") {
        message = value ? "" : "Имя не может быть пустым";
      } else if (input.name === "email") {
        message = ASCII_EMAIL_PATTERN.test(value)
          ? ""
          : "Введите корректный e-mail";
      } else if (input.name === "telegramContact") {
        message = TELEGRAM_USERNAME_PATTERN.test(value)
          ? ""
          : "Введите имя пользователя, начиная с @";
      } else if (phoneControllers.has(input)) {
        const phoneController = phoneControllers.get(input);

        await phoneController.ready;
        message = phoneController.isValid()
          ? ""
          : "Введите корректный номер телефона";
      } else if (!value) {
        message = "Поле не может быть пустым";
      }

      return message;
    };

    const validateInput = async (input) => {
      const message = await getInputValidationMessage(input);
      if (disposed) return false;
      const value = input.value.trim();

      setFieldState(input, message, !message && Boolean(value));

      return !message;
    };

    const getActiveInputs = () =>
      inputs.filter((input) => !input.disabled && !input.hidden);

    const updateSubmitAvailability = async () => {
      const revision = ++validityRevision;
      const activeInputs = getActiveInputs();
      const messages = await Promise.all(
        activeInputs.map((input) => getInputValidationMessage(input)),
      );

      if (disposed || revision !== validityRevision) {
        return;
      }

      formIsValid =
        activeInputs.length > 0 && messages.every((message) => !message);
      renderSubmitState();
    };

    const clearEditedState = (input) => {
      setFieldState(input);
      setStatus();
    };

    const renderMessengerField = () => {
      const selectedMessenger = messengerInputs.find((input) => input.checked)?.value;
      const isTelegram = selectedMessenger === "telegram";

      if (maxContactField instanceof HTMLElement && maxContactInput) {
        maxContactField.hidden = isTelegram;
        maxContactInput.disabled = isTelegram;
        setFieldState(maxContactInput);
      }

      if (telegramContactField instanceof HTMLElement && telegramContactInput) {
        telegramContactField.hidden = !isTelegram;
        telegramContactInput.disabled = !isTelegram;
        setFieldState(telegramContactInput);
      }

      setStatus();
    };

    inputs.forEach((input) => {
      updateHasValue(input);
      listen(input, "input", () => {
        input.dataset.dirty = "true";
        clearEditedState(input);
        void updateSubmitAvailability();
      });
      listen(input, "blur", () => {
        if (input.dataset.dirty === "true") {
          void validateInput(input).then(updateSubmitAvailability);
        }
      });
      listen(input, "countrychange", () => {
        clearEditedState(input);
        void updateSubmitAvailability();
      });
    });

    messengerInputs.forEach((input) => {
      listen(input, "change", () => {
        renderMessengerField();
        void updateSubmitAvailability();
      });
    });

    const getTildaEventForm = (event, eventForm) =>
        eventForm instanceof HTMLFormElement
          ? eventForm
          : event?.detail?.form instanceof HTMLFormElement
            ? event.detail.form
            : event?.target instanceof HTMLFormElement
              ? event.target
              : null;

    const showSuccess = () => {
      setBusy(false);
      setStatus();
      contentParts.forEach((part) => {
        part.hidden = true;
      });

      if (successView instanceof HTMLElement) {
        successView.hidden = false;
      }

      form.dataset.state = "success";

      if (section instanceof HTMLElement) {
        const headingId = successView?.querySelector("[data-lead-success-heading]")?.id;
        if (headingId) section.setAttribute("aria-labelledby", headingId);
      }

      window.requestAnimationFrame(() => {
        successView?.focus({ preventScroll: true });
      });
      submittedTildaForm = null;
    };

    const showTildaError = (message) => {
      submittedTildaForm = null;
      setBusy(false);
      setStatus(message, "error");
    };

    const handleTildaSuccess = (event, eventForm) => {
      const successfulForm = getTildaEventForm(event, eventForm);

      if (successfulForm !== submittedTildaForm) {
        return;
      }

      if (!submittedTildaForm) {
        return;
      }

      showSuccess();
    };

    const handleTildaError = (event, eventForm) => {
      const failedForm = getTildaEventForm(event, eventForm);

      if (failedForm !== submittedTildaForm) {
        return;
      }

      if (!submittedTildaForm) {
        return;
      }

      showTildaError(
        "Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.",
      );
    };

    listen(document, "tildaform:aftersuccess", handleTildaSuccess);
    listen(document, "tildaform:aftererror", handleTildaError);

    const jquerySuccessHandler = (event, eventForm) => {
      handleTildaSuccess(event, eventForm);
    };

    const jqueryErrorHandler = (event, eventForm) => {
      handleTildaError(event, eventForm);
    };

    if (typeof window.jQuery === "function") {
      window.jQuery(document).on(
        "tildaform:aftersuccess.academyLeadForm",
        jquerySuccessHandler,
      );
      window.jQuery(document).on(
        "tildaform:aftererror.academyLeadForm",
        jqueryErrorHandler,
      );
    }

    const handleSubmit = async (event) => {
      event.preventDefault();

      if (busy) {
        return;
      }

      const activeInputs = getActiveInputs();
      const validationResults = await Promise.all(
        activeInputs.map((input) => validateInput(input)),
      );
      if (disposed) return;
      const firstInvalidIndex = validationResults.findIndex((result) => !result);

      if (firstInvalidIndex !== -1) {
        formIsValid = false;
        renderSubmitState();
        activeInputs[firstInvalidIndex].focus();
        setStatus("Проверьте выделенные поля.", "error");
        return;
      }

      setBusy(true);
      setStatus("Отправляем заявку…", "loading");

      const selectedMessenger =
        messengerInputs.find((input) => input.checked)?.value || "max";
      const phoneController = phoneControllers.get(mainPhoneInput);
      const maxContactController = phoneControllers.get(maxContactInput);
      const formData = {
        email: form.elements.email.value.trim(),
        messenger: selectedMessenger,
        messengerContact:
          selectedMessenger === "telegram"
            ? telegramContactInput.value.trim()
            : maxContactController.getNumber(),
        name: form.elements.name.value.trim(),
        phone: phoneController.getNumber(),
      };
      const nativeForm = hideTildaFormRecord(formName);

      form.dispatchEvent(
        new CustomEvent("academy-lead-form:validated", {
          bubbles: true,
          detail: { formData },
        }),
      );

      if (!(nativeForm instanceof HTMLFormElement)) {
        setBusy(false);
        setStatus(
          "Отправка заявки временно недоступна. Пожалуйста, попробуйте позже.",
          "error",
        );
        return;
      }

      try {
        await syncTildaForm(nativeForm, formData);
        if (disposed) return;
        submittedTildaForm = nativeForm;
        const nativeSubmit = nativeForm.querySelector(
          'button[type="submit"], input[type="submit"]',
        );

        if (nativeSubmit instanceof HTMLElement) {
          nativeForm.requestSubmit(nativeSubmit);
        } else {
          nativeForm.requestSubmit();
        }

        await new Promise((resolve) => window.requestAnimationFrame(resolve));

        if (
          submittedTildaForm === nativeForm &&
          nativeForm.querySelector(".js-error-control-box")
        ) {
          showTildaError(
            "Не удалось отправить заявку. Проверьте заполненные поля и попробуйте ещё раз.",
          );
        }
      } catch (error) {
        showTildaError(
          "Не удалось передать заявку. Обновите страницу и попробуйте ещё раз.",
        );
      }
    };

    listen(form, "submit", handleSubmit);
    renderMessengerField();
    void updateSubmitAvailability();

    return {
      cleanup() {
        disposed = true;
        validityRevision++;
        submittedTildaForm = null;
        listeners.forEach((removeListener) => removeListener());
        phoneControllers.forEach((controller) => controller.destroy());

        if (typeof window.jQuery === "function") {
          window.jQuery(document).off(
            "tildaform:aftersuccess.academyLeadForm",
            jquerySuccessHandler,
          );
          window.jQuery(document).off(
            "tildaform:aftererror.academyLeadForm",
            jqueryErrorHandler,
          );
        }
      },
    };
  };

  forms.forEach((form) => {
    formControllers.push(setupLeadForm(form));
  });
  hideKnownTildaForms();

  window.__academyLeadFormCleanup = () => {
    tildaFormObserver.disconnect();
    clearTimeout(discoveryTimer);
    formControllers.forEach((controller) => controller.cleanup());
  };
})();
