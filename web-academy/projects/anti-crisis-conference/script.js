(() => {
  const TILDA_RECORDINGS_PRODUCT = Object.freeze({
    name: "Антикризисная конференция — записи всех выступлений",
    price: 1999,
  });
  const INTL_TEL_INPUT_UTILS_URL =
    "https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/js/utils.js";

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

  if (window.__ANTI_CRISIS_TEST__ === true) {
    window.__antiCrisisRegistrationHelpers = Object.freeze({
      getTildaPhoneValue,
      isPlausibleInternationalPhone,
      normalizePhoneToE164,
    });
  }

  const page = document.querySelector('[data-page="anti-crisis-conference"]');
  const loader = document.querySelector("[data-page-loader]");

  if (loader && loader.dataset.cleanupReady !== "true") {
    loader.dataset.cleanupReady = "true";

    const removeLoader = () => {
      loader.remove();
    };

    loader.addEventListener("animationend", removeLoader, { once: true });
    window.setTimeout(removeLoader, 1200);
  }

  if (!page) {
    return;
  }

  page.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  if (typeof window.__antiCrisisDesktopScaleCleanup === "function") {
    window.__antiCrisisDesktopScaleCleanup();
  }

  const desktopScaleQuery = window.matchMedia("(min-width: 64rem)");
  const documentRoot = document.documentElement;
  const initialRootFontSize = documentRoot.style.fontSize;
  let desktopScaleFrame = 0;

  const renderDesktopScale = () => {
    desktopScaleFrame = 0;

    if (!desktopScaleQuery.matches) {
      documentRoot.style.fontSize = initialRootFontSize;
      page.removeAttribute("data-desktop-scale");
      return;
    }

    const viewportWidth = documentRoot.clientWidth || window.innerWidth;
    const desktopScale = viewportWidth / 1680;
    const rootFontSize = 16 * desktopScale;

    documentRoot.style.fontSize = `${rootFontSize.toFixed(6)}px`;
    page.dataset.desktopScale = desktopScale.toFixed(6);
  };

  const requestDesktopScale = () => {
    if (!desktopScaleFrame) {
      desktopScaleFrame = window.requestAnimationFrame(renderDesktopScale);
    }
  };

  window.addEventListener("resize", requestDesktopScale, { passive: true });
  desktopScaleQuery.addEventListener("change", requestDesktopScale);
  requestDesktopScale();

  window.__antiCrisisDesktopScaleCleanup = () => {
    window.removeEventListener("resize", requestDesktopScale);
    desktopScaleQuery.removeEventListener("change", requestDesktopScale);

    if (desktopScaleFrame) {
      window.cancelAnimationFrame(desktopScaleFrame);
      desktopScaleFrame = 0;
    }

    documentRoot.style.fontSize = initialRootFontSize;
    page.removeAttribute("data-desktop-scale");
  };

  if (page.dataset.imageDragGuard !== "true") {
    page.dataset.imageDragGuard = "true";
    page.addEventListener("dragstart", (event) => {
      if (event.target instanceof Element && event.target.closest("img")) {
        event.preventDefault();
      }
    });
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (typeof window.__antiCrisisRegistrationCleanup === "function") {
    window.__antiCrisisRegistrationCleanup();
  }

  const registrationForm = page.querySelector("[data-registration-form]");

  if (registrationForm) {
    const registrationOptions = [
      ...registrationForm.querySelectorAll('input[name="participation"]'),
    ];
    const registrationFields = registrationForm.querySelector(
      "[data-registration-fields]",
    );
    const registrationFieldsRegion = registrationForm.querySelector(
      "[data-registration-fields-region]",
    );
    const registrationSubmit = registrationForm.querySelector(
      "[data-registration-submit]",
    );
    const registrationSubmitLabel = registrationForm.querySelector(
      "[data-registration-submit-label]",
    );
    const registrationPhone = registrationForm.querySelector(
      '[data-registration-phone]',
    );
    const registrationPhoneError = registrationForm.querySelector(
      "[data-registration-phone-error]",
    );
    const registrationStatus = registrationForm.querySelector(
      "[data-registration-status]",
    );
    let registrationBusy = false;
    let registrationValidationPending = false;
    let registrationDisposed = false;
    let registrationPhoneIntl = null;
    let registrationPhoneUtilsReady = false;
    let registrationPhoneReady = Promise.resolve();
    let cartWaitCleanup = () => {};

    const setRegistrationStatus = (message = "", state = "idle") => {
      if (!registrationStatus) {
        return;
      }

      registrationStatus.textContent = message;
      registrationStatus.dataset.state = state;
    };

    const renderRegistrationSubmit = () => {
      if (!registrationSubmit || !registrationSubmitLabel) {
        return;
      }

      const isLocked = registrationBusy || registrationValidationPending;

      registrationSubmit.disabled = isLocked;
      registrationSubmit.setAttribute("aria-busy", String(isLocked));
      registrationSubmitLabel.textContent = registrationBusy
        ? "Открываем оплату…"
        : registrationValidationPending
          ? "Проверяем номер…"
        : registrationForm.dataset.registrationMode === "recordings"
          ? "Зарегистрироваться"
          : "Зарегистрироваться";
    };

    const setRegistrationBusy = (isBusy) => {
      registrationBusy = isBusy;
      renderRegistrationSubmit();
    };

    const setRegistrationValidationPending = (isPending) => {
      registrationValidationPending = isPending;
      renderRegistrationSubmit();
    };

    const setPhoneValidation = (message = "") => {
      if (!(registrationPhone instanceof HTMLInputElement)) {
        return;
      }

      registrationPhone.setCustomValidity(message);
      registrationPhone.setAttribute("aria-invalid", String(Boolean(message)));

      if (registrationPhoneError) {
        registrationPhoneError.textContent = message;
      }
    };

    const validateInternationalPhone = async ({ announce = false } = {}) => {
      if (!(registrationPhone instanceof HTMLInputElement)) {
        return true;
      }

      const hasValue = Boolean(registrationPhone.value.trim());

      if (!hasValue) {
        const message = announce ? "Введите номер телефона." : "";
        setPhoneValidation(message);

        if (announce) {
          registrationPhone.reportValidity();
        }

        return false;
      }

      await registrationPhoneReady;

      const selectedCountry = registrationPhoneIntl?.getSelectedCountry?.();
      const fallbackValue = normalizePhoneToE164(
        registrationPhone.value,
        selectedCountry?.dialCode || "7",
      );
      const isValid = registrationPhoneUtilsReady
        ? registrationPhoneIntl.isValidNumber()
        : isPlausibleInternationalPhone(fallbackValue);
      const message = isValid
        ? ""
        : "Проверьте номер и выбранную страну.";

      setPhoneValidation(message);

      if (announce && !isValid) {
        registrationPhone.reportValidity();
      }

      return isValid;
    };

    const getRegistrationPhoneE164 = async () => {
      if (!(registrationPhone instanceof HTMLInputElement)) {
        return "";
      }

      await registrationPhoneReady;

      if (registrationPhoneUtilsReady && registrationPhoneIntl.isValidNumber()) {
        return registrationPhoneIntl.getNumber();
      }

      const selectedCountry = registrationPhoneIntl?.getSelectedCountry?.();

      return normalizePhoneToE164(
        registrationPhone.value,
        selectedCountry?.dialCode || "7",
      );
    };

    const handlePhoneInput = () => {
      setPhoneValidation();
    };

    const handlePhoneBlur = () => {
      void validateInternationalPhone();
    };

    if (
      registrationPhone instanceof HTMLInputElement &&
      typeof window.intlTelInput === "function"
    ) {
      registrationPhoneIntl = window.intlTelInput(registrationPhone, {
        countryNameLocale: "ru",
        countryOrder: ["ru", "kz", "by", "uz"],
        countrySearch: true,
        countrySelectorMode: "AUTO",
        dropdownParent: page,
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
      registrationPhoneReady = registrationPhoneIntl.promise
        .then(() => {
          registrationPhoneUtilsReady = true;
        })
        .catch(() => {
          registrationPhoneUtilsReady = false;
        });
    }

    const setNativeInputValue = (input, value) => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;

      if (valueSetter) {
        valueSetter.call(input, value);
      } else {
        input.value = value;
      }

      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };

    const findTildaCartForm = () => {
      const cartForm = document.querySelector(
        ".t706__orderform form, .t706 form[data-formsended-callback='t706_onSuccessCallback']",
      );

      if (!(cartForm instanceof HTMLFormElement)) {
        return null;
      }

      const cart = cartForm.closest(".t706");
      const expectedProductName = TILDA_RECORDINGS_PRODUCT.name
        .replace(/\s+/g, " ")
        .trim();
      const hasExpectedProduct = [
        ...(cart?.querySelectorAll(".t706__product") || []),
      ].some((product) =>
        String(product.textContent || "")
          .replace(/\s+/g, " ")
          .includes(expectedProductName),
      );
      const hasExpectedStoredProduct = Array.isArray(window.tcart?.products)
        ? window.tcart.products.some(
            (product) =>
              product?.deleted !== "yes" &&
              String(product?.name || "")
                .replace(/\s+/g, " ")
                .trim() === expectedProductName &&
              Number(product?.price) === TILDA_RECORDINGS_PRODUCT.price,
          )
        : false;

      return hasExpectedProduct || hasExpectedStoredProduct ? cartForm : null;
    };

    const waitForTildaCartForm = (timeout = 6000) => {
      const existingForm = findTildaCartForm();

      if (existingForm instanceof HTMLFormElement) {
        return Promise.resolve(existingForm);
      }

      return new Promise((resolve, reject) => {
        const observer = new MutationObserver(() => {
          const cartForm = findTildaCartForm();

          if (cartForm instanceof HTMLFormElement) {
            cleanup();
            resolve(cartForm);
          }
        });
        const timeoutId = window.setTimeout(() => {
          cleanup();
          reject(new Error("Tilda cart form was not found"));
        }, timeout);
        const cleanup = () => {
          observer.disconnect();
          window.clearTimeout(timeoutId);
          cartWaitCleanup = () => {};
        };

        cartWaitCleanup = () => {
          cleanup();
          reject(new Error("Tilda cart lookup was cancelled"));
        };
        observer.observe(document.body, {
          attributes: true,
          characterData: true,
          childList: true,
          subtree: true,
        });
      });
    };

    const openTildaRecordingsOrder = () => {
      const existingCartForm = findTildaCartForm();

      if (existingCartForm instanceof HTMLFormElement) {
        const cartOpenButton = existingCartForm
          .closest(".t706")
          ?.querySelector(".t706__carticon-wrapper, .t706__carticon");

        if (cartOpenButton instanceof HTMLElement) {
          cartOpenButton.click();
          return;
        }
      }

      const orderLink = document.querySelector(
        "[data-conference-recordings-order]",
      );

      if (!(orderLink instanceof HTMLAnchorElement)) {
        throw new Error("The native Tilda order link was not found");
      }

      orderLink.click();
    };

    const findTildaVisiblePhoneInput = (cartForm) =>
      cartForm.querySelector(
        '.t-input-group_ph input.t-input-phonemask, .t-input-group_ph input.js-phonemask-input:not([type="hidden"]), input[data-tilda-rule="phone"]:not([type="hidden"]), input[name="Phone"]:not([type="hidden"]), input[name="phone"]:not([type="hidden"])',
      );

    const isTildaPhoneInputReady = (phoneInput) =>
      phoneInput instanceof HTMLInputElement &&
      (phoneInput.classList.contains("t-input-phonemask")
        ? phoneInput.closest(".t-input-group_ph")?.dataset.inputReady === "true" ||
          phoneInput.closest(".t-input-group_ph")?.dataset.initMask === "yes"
        : phoneInput.dataset.phonemaskInit !== "no");

    const waitForTildaPhoneInput = (cartForm, timeout = 6000) => {
      const existingInput = findTildaVisiblePhoneInput(cartForm);

      if (isTildaPhoneInputReady(existingInput)) {
        return Promise.resolve(existingInput);
      }

      return new Promise((resolve, reject) => {
        const observer = new MutationObserver(() => {
          const phoneInput = findTildaVisiblePhoneInput(cartForm);

          if (isTildaPhoneInputReady(phoneInput)) {
            cleanup();
            resolve(phoneInput);
          }
        });
        const timeoutId = window.setTimeout(() => {
          cleanup();
          reject(new Error("Tilda phone mask was not ready"));
        }, timeout);
        const cleanup = () => {
          observer.disconnect();
          window.clearTimeout(timeoutId);
        };

        observer.observe(cartForm, {
          attributes: true,
          childList: true,
          subtree: true,
        });
      });
    };

    const fillTildaCartForm = async (cartForm, formData) => {
      const fields = {
        name: cartForm.querySelector(
          'input[data-tilda-rule="name"], input[name="Name"], input[name="name"]',
        ),
        email: cartForm.querySelector(
          'input[data-tilda-rule="email"], input[name="Email"], input[name="email"]',
        ),
      };

      if (!Object.values(fields).every((field) => field instanceof HTMLInputElement)) {
        throw new Error("Required Tilda cart fields were not found");
      }

      setNativeInputValue(fields.name, String(formData.name || "").trim());
      setNativeInputValue(fields.email, String(formData.email || "").trim());
      const phoneInput = await waitForTildaPhoneInput(cartForm);
      const phoneGroup = phoneInput.closest(".t-input-group_ph");
      const e164Phone = normalizePhoneToE164(formData.phone);

      if (
        phoneGroup instanceof HTMLElement &&
        typeof window.t_form_phonemask__setValue === "function"
      ) {
        window.t_form_phonemask__setValue(phoneGroup, e164Phone, undefined, {
          noFocus: true,
        });
        phoneInput.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        setNativeInputValue(phoneInput, getTildaPhoneValue(e164Phone));
      }

      const tildaPhoneResult = phoneGroup?.querySelector(".js-phonemask-result");

      if (
        tildaPhoneResult instanceof HTMLInputElement &&
        !tildaPhoneResult.value.trim()
      ) {
        throw new Error("Tilda phone mask did not synchronize its result");
      }
    };

    const handleRecordingsRegistration = async (event) => {
      if (registrationBusy || !(event instanceof CustomEvent)) {
        return;
      }

      setRegistrationBusy(true);
      setRegistrationStatus("Открываем корзину и переносим ваши данные…", "loading");

      try {
        openTildaRecordingsOrder();
        const cartForm = await waitForTildaCartForm();

        if (registrationDisposed) {
          return;
        }

        await fillTildaCartForm(cartForm, event.detail?.formData || {});
        setRegistrationStatus(
          "Данные перенесены. Проверьте заказ и выберите способ оплаты.",
          "success",
        );
      } catch (error) {
        if (!registrationDisposed) {
          setRegistrationStatus(
            "Не удалось открыть корзину. Обновите страницу и попробуйте ещё раз.",
            "error",
          );
        }
      } finally {
        if (!registrationDisposed) {
          setRegistrationBusy(false);
        }
      }
    };

    const renderRegistrationMode = (mode) => {
      const isRecordings = mode === "recordings";

      registrationForm.dataset.registrationMode = isRecordings
        ? "recordings"
        : "free";

      if (registrationFields) {
        registrationFields.disabled = !isRecordings;
      }

      registrationPhoneIntl?.setDisabled(!isRecordings);

      if (registrationFieldsRegion) {
        registrationFieldsRegion.dataset.expanded = String(isRecordings);
        registrationFieldsRegion.setAttribute(
          "aria-hidden",
          String(!isRecordings),
        );
      }

      if (registrationSubmit) {
        registrationSubmit.dataset.registrationEvent = isRecordings
          ? "recordings-registration"
          : "free-registration";
        registrationSubmit.classList.toggle("btn-cta", !isRecordings);
      }

      if (registrationSubmitLabel) {
        renderRegistrationSubmit();
      }

      setRegistrationStatus();

      if (!isRecordings) {
        setPhoneValidation();
      }
    };

    const handleRegistrationModeChange = (event) => {
      if (event.target instanceof HTMLInputElement && event.target.checked) {
        renderRegistrationMode(event.target.value);
      }
    };

    const handleRegistrationSubmit = async (event) => {
      event.preventDefault();

      if (registrationBusy || registrationValidationPending) {
        return;
      }

      const mode = registrationForm.dataset.registrationMode;

      if (mode === "recordings") {
        if (!registrationForm.reportValidity()) {
          if (registrationPhone instanceof HTMLInputElement && !registrationPhone.value) {
            setPhoneValidation("Введите номер телефона.");
          }
          return;
        }

        setRegistrationValidationPending(true);

        try {
          if (!(await validateInternationalPhone({ announce: true }))) {
            return;
          }

          const formData = Object.fromEntries(new FormData(registrationForm));
          formData.phone = await getRegistrationPhoneE164();
          registrationForm.dispatchEvent(
            new CustomEvent("conference:recordings-registration", {
              bubbles: true,
              detail: { mode, formData },
            }),
          );
        } finally {
          setRegistrationValidationPending(false);
        }
        return;
      }

      registrationForm.dispatchEvent(
        new CustomEvent("conference:free-registration", {
          bubbles: true,
          detail: { mode: "free" },
        }),
      );
    };

    registrationOptions.forEach((option) => {
      option.addEventListener("change", handleRegistrationModeChange);
    });
    registrationPhone?.addEventListener("input", handlePhoneInput);
    registrationPhone?.addEventListener("countrychange", handlePhoneInput);
    registrationPhone?.addEventListener("blur", handlePhoneBlur);
    registrationForm.addEventListener("submit", handleRegistrationSubmit);
    registrationForm.addEventListener(
      "conference:recordings-registration",
      handleRecordingsRegistration,
    );

    window.__antiCrisisRegistrationCleanup = () => {
      registrationDisposed = true;
      cartWaitCleanup();
      registrationOptions.forEach((option) => {
        option.removeEventListener("change", handleRegistrationModeChange);
      });
      registrationPhone?.removeEventListener("input", handlePhoneInput);
      registrationPhone?.removeEventListener("countrychange", handlePhoneInput);
      registrationPhone?.removeEventListener("blur", handlePhoneBlur);
      registrationForm.removeEventListener("submit", handleRegistrationSubmit);
      registrationForm.removeEventListener(
        "conference:recordings-registration",
        handleRecordingsRegistration,
      );
      registrationPhoneIntl?.destroy();
      registrationPhoneIntl = null;
    };

    const selectedRegistrationOption = registrationOptions.find(
      (option) => option.checked,
    );
    renderRegistrationMode(selectedRegistrationOption?.value || "free");
  }

  if (typeof window.__antiCrisisRegistrationModalCleanup === "function") {
    window.__antiCrisisRegistrationModalCleanup();
  }

  const registrationModal = page.querySelector("[data-registration-modal]");

  if (registrationModal) {
    const registrationModalClose = registrationModal.querySelector(
      ".conference-registration_modal-close",
    );
    let registrationModalPreviousFocus = null;
    let registrationModalBodyOverflow = "";
    let registrationModalBodyPaddingRight = "";

    const getRegistrationModalFocusable = () => [
      ...registrationModal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((element) => element.getClientRects().length > 0);

    const openRegistrationModal = () => {
      if (registrationModal.classList.contains("is-open")) {
        return;
      }

      registrationModalPreviousFocus =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      registrationModalBodyOverflow = document.body.style.overflow;
      registrationModalBodyPaddingRight = document.body.style.paddingRight;

      const scrollbarWidth = Math.max(
        0,
        window.innerWidth - document.documentElement.clientWidth,
      );

      document.body.style.overflow = "hidden";

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      registrationModal.classList.add("is-open");
      registrationModal.setAttribute("aria-hidden", "false");

      window.requestAnimationFrame(() => {
        registrationModalClose?.focus({ preventScroll: true });
      });
    };

    const closeRegistrationModal = (restoreFocus = true) => {
      if (!registrationModal.classList.contains("is-open")) {
        return;
      }

      registrationModal.classList.remove("is-open");
      registrationModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = registrationModalBodyOverflow;
      document.body.style.paddingRight = registrationModalBodyPaddingRight;

      if (
        restoreFocus &&
        registrationModalPreviousFocus?.isConnected
      ) {
        registrationModalPreviousFocus.focus({ preventScroll: true });
      }
    };

    const handleRegistrationModalClick = (event) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-registration-modal-close]")
      ) {
        closeRegistrationModal();
      }
    };

    const handleRegistrationModalKeydown = (event) => {
      if (!registrationModal.classList.contains("is-open")) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeRegistrationModal();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getRegistrationModalFocusable();

      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };

    const handleFreeRegistration = () => {
      openRegistrationModal();
    };

    registrationModal.addEventListener("click", handleRegistrationModalClick);
    document.addEventListener("keydown", handleRegistrationModalKeydown);
    page.addEventListener(
      "conference:free-registration",
      handleFreeRegistration,
    );

    window.__antiCrisisRegistrationModalCleanup = () => {
      closeRegistrationModal(false);
      registrationModal.removeEventListener(
        "click",
        handleRegistrationModalClick,
      );
      document.removeEventListener("keydown", handleRegistrationModalKeydown);
      page.removeEventListener(
        "conference:free-registration",
        handleFreeRegistration,
      );
    };
  }

  if (typeof window.__antiCrisisAnchorScrollCleanup === "function") {
    window.__antiCrisisAnchorScrollCleanup();
  }

  let anchorScrollFrame = 0;
  let anchorScrollInitialBehavior = "";
  let anchorScrollInterrupted = false;
  const anchorScrollInterruptEvents = ["wheel", "touchstart", "keydown"];

  const restoreAnchorScrollBehavior = () => {
    documentRoot.style.scrollBehavior = anchorScrollInitialBehavior;
  };

  const removeAnchorScrollInterrupts = () => {
    anchorScrollInterruptEvents.forEach((eventName) => {
      window.removeEventListener(eventName, cancelAnchorScroll);
    });
  };

  const cancelAnchorScroll = () => {
    anchorScrollInterrupted = true;

    if (anchorScrollFrame) {
      window.cancelAnimationFrame(anchorScrollFrame);
      anchorScrollFrame = 0;
    }

    removeAnchorScrollInterrupts();
    restoreAnchorScrollBehavior();
  };

  const handleAnchorClick = (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !(event.target instanceof Element)
    ) {
      return;
    }

    const link = event.target.closest('a[href^="#"]:not(.skip-link)');
    const hash = link?.getAttribute("href");

    if (!link || !hash || hash === "#") {
      return;
    }

    const target = document.getElementById(hash.slice(1));

    if (!target) {
      return;
    }

    event.preventDefault();
    cancelAnchorScroll();

    const scrollMarginTop = Number.parseFloat(
      window.getComputedStyle(target).scrollMarginTop,
    ) || 0;
    const startY = window.scrollY;
    const targetY = Math.max(
      0,
      target.getBoundingClientRect().top + startY - scrollMarginTop,
    );
    const distance = targetY - startY;

    if (window.location.hash === hash) {
      window.history.replaceState(null, "", hash);
    } else {
      window.history.pushState(null, "", hash);
    }

    anchorScrollInitialBehavior = documentRoot.style.scrollBehavior;
    documentRoot.style.scrollBehavior = "auto";

    if (reducedMotion.matches || Math.abs(distance) < 1) {
      window.scrollTo(0, targetY);
      restoreAnchorScrollBehavior();
      return;
    }

    const duration = Math.min(900, Math.max(480, Math.abs(distance) * 0.28));
    const startTime = performance.now();
    anchorScrollInterrupted = false;

    anchorScrollInterruptEvents.forEach((eventName) => {
      window.addEventListener(eventName, cancelAnchorScroll, { passive: true });
    });

    const renderAnchorScroll = (currentTime) => {
      const progress = Math.min(1, (currentTime - startTime) / duration);
      const easedProgress = 1 - (1 - progress) ** 3;

      window.scrollTo(0, startY + distance * easedProgress);

      if (progress < 1 && !anchorScrollInterrupted) {
        anchorScrollFrame = window.requestAnimationFrame(renderAnchorScroll);
        return;
      }

      anchorScrollFrame = 0;
      removeAnchorScrollInterrupts();
      restoreAnchorScrollBehavior();
    };

    anchorScrollFrame = window.requestAnimationFrame(renderAnchorScroll);
  };

  page.addEventListener("click", handleAnchorClick);
  window.__antiCrisisAnchorScrollCleanup = () => {
    page.removeEventListener("click", handleAnchorClick);
    cancelAnchorScroll();
  };

  const floatingNav = page.querySelector("[data-floating-nav]");
  const floatingNavStart = page.querySelector("#audience");
  const floatingNavEnd = page.querySelector("#registration");
  const floatingNavRegistration = page.querySelector(
    "[data-floating-nav-registration]",
  );

  if (typeof window.__antiCrisisFloatingNavCleanup === "function") {
    window.__antiCrisisFloatingNavCleanup();
  }

  if (
    floatingNav &&
    floatingNavStart &&
    floatingNavEnd &&
    floatingNavRegistration
  ) {
    let floatingNavFrame = 0;

    const renderFloatingNav = () => {
      floatingNavFrame = 0;
      const topOffset = Number.parseFloat(
        window.getComputedStyle(floatingNav).top,
      ) || 0;
      const revealPoint = topOffset + floatingNav.offsetHeight / 2;
      const hasReachedRegistration =
        floatingNavEnd.getBoundingClientRect().top <= window.innerHeight;
      const shouldShowRegistration =
        floatingNavStart.getBoundingClientRect().top <= revealPoint &&
        !hasReachedRegistration;

      floatingNav.classList.toggle(
        "is-registration-visible",
        shouldShowRegistration,
      );
      floatingNavRegistration.setAttribute(
        "aria-hidden",
        String(!shouldShowRegistration),
      );
      floatingNavRegistration.tabIndex = shouldShowRegistration ? 0 : -1;
    };

    const requestFloatingNavRender = () => {
      if (!floatingNavFrame) {
        floatingNavFrame = window.requestAnimationFrame(renderFloatingNav);
      }
    };

    window.addEventListener("scroll", requestFloatingNavRender, { passive: true });
    window.addEventListener("resize", requestFloatingNavRender, { passive: true });
    window.__antiCrisisFloatingNavCleanup = () => {
      window.removeEventListener("scroll", requestFloatingNavRender);
      window.removeEventListener("resize", requestFloatingNavRender);

      if (floatingNavFrame) {
        window.cancelAnimationFrame(floatingNavFrame);
      }

      floatingNav.classList.remove("is-registration-visible");
      floatingNavRegistration.setAttribute("aria-hidden", "true");
      floatingNavRegistration.tabIndex = -1;
    };

    requestFloatingNavRender();
  }

  const animatePracticeCounters = (scope) => {
    const counters = scope.querySelectorAll("[data-practice-count]");

    if (!counters.length || scope.dataset.countersStarted === "true") {
      return;
    }

    scope.dataset.countersStarted = "true";

    if (reducedMotion.matches) {
      return;
    }

    const duration = 1800;
    const startTime = performance.now();

    const renderCounters = (currentTime) => {
      const progress = Math.min(1, (currentTime - startTime) / duration);
      const easedProgress = 1 - (1 - progress) ** 3;

      counters.forEach((counter) => {
        const target = Number(counter.dataset.countTo || 0);
        const decimals = Number(counter.dataset.countDecimals || 0);
        const suffix = counter.dataset.countSuffix || "";
        const value = target * easedProgress;

        counter.textContent = `${value.toFixed(decimals)}${suffix}`;
      });

      if (progress < 1) {
        window.requestAnimationFrame(renderCounters);
      }
    };

    window.requestAnimationFrame(renderCounters);
  };

  if (page.dataset.scrollReveal !== "true") {
    page.dataset.scrollReveal = "true";
    const revealItems = page.querySelectorAll("[data-scroll-reveal]");

    if (
      revealItems.length &&
      !reducedMotion.matches &&
      "IntersectionObserver" in window
    ) {
      page.classList.add("is-reveal-ready");
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add("is-visible");
            animatePracticeCounters(entry.target);
            revealObserver.unobserve(entry.target);
          });
        },
        {
          rootMargin: "0px 0px 8% 0px",
          threshold: 0.01,
        },
      );

      revealItems.forEach((item) => revealObserver.observe(item));
    }

    const speakerCardsReveal = page.querySelector(
      "[data-speaker-cards-reveal]",
    );

    if (
      speakerCardsReveal &&
      speakerCardsReveal.dataset.scrollRevealComplete !== "true" &&
      !reducedMotion.matches &&
      "IntersectionObserver" in window
    ) {
      page.classList.add("is-reveal-ready");
      const speakerCardsObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target
              .querySelectorAll("[data-speaker-slide-reveal]")
              .forEach((slide) => slide.classList.add("is-scroll-revealed"));
            entry.target.dataset.scrollRevealComplete = "true";
            speakerCardsObserver.disconnect();
          });
        },
        {
          rootMargin: "0px 0px 150px 0px",
          threshold: 0.08,
        },
      );

      speakerCardsObserver.observe(speakerCardsReveal);
    }
  }

  const marketScene = page.querySelector("[data-market-scene]");

  if (marketScene) {
    if (typeof window.__antiCrisisMarketCleanup === "function") {
      window.__antiCrisisMarketCleanup();
    }

    const marketCards = [...marketScene.querySelectorAll("[data-market-card]")];
    const desktopScene = window.matchMedia("(min-width: 64rem)");
    let marketFrame = 0;

    const clamp = (value, min = 0, max = 1) =>
      Math.min(max, Math.max(min, value));

    const resetMarketCards = () => {
      marketScene.classList.remove("is-market-motion-ready");
      marketCards.forEach((card) => {
        card.style.removeProperty("opacity");
        card.style.removeProperty("transform");
        card.style.removeProperty("will-change");
      });
    };

    const renderMarketScene = () => {
      marketFrame = 0;

      if (reducedMotion.matches || !desktopScene.matches) {
        resetMarketCards();
        return;
      }

      const sceneRect = marketScene.getBoundingClientRect();
      const scrollDistance = Math.max(
        1,
        marketScene.offsetHeight - window.innerHeight,
      );
      const sceneProgress = clamp(-sceneRect.top / scrollDistance);

      marketScene.classList.add("is-market-motion-ready");

      marketCards.forEach((card) => {
        const order = Number(card.dataset.revealOrder || 0);
        const finalRotation = Number(card.dataset.finalRotation || 0);
        const revealRotation = Number(card.dataset.revealRotation || 0);
        const start = 0.04 + order * 0.075;
        const localProgress = clamp((sceneProgress - start) / 0.3);
        const easedProgress = 1 - (1 - localProgress) ** 3;
        const scale = 0.52 + 0.48 * easedProgress;
        const rotation = finalRotation + revealRotation * (1 - easedProgress);
        const lift = 40 * (1 - easedProgress);

        card.style.opacity = easedProgress.toFixed(3);
        card.style.transform =
          `translate3d(0, ${lift.toFixed(3)}px, 0) ` +
          `rotate(${rotation.toFixed(3)}deg) scale(${scale.toFixed(3)})`;
        card.style.willChange =
          localProgress > 0 && localProgress < 1 ? "transform, opacity" : "auto";
      });
    };

    const requestMarketRender = () => {
      if (!marketFrame) {
        marketFrame = window.requestAnimationFrame(renderMarketScene);
      }
    };

    window.addEventListener("scroll", requestMarketRender, { passive: true });
    window.addEventListener("resize", requestMarketRender, { passive: true });
    reducedMotion.addEventListener("change", requestMarketRender);
    desktopScene.addEventListener("change", requestMarketRender);
    window.__antiCrisisMarketCleanup = () => {
      window.removeEventListener("scroll", requestMarketRender);
      window.removeEventListener("resize", requestMarketRender);
      reducedMotion.removeEventListener("change", requestMarketRender);
      desktopScene.removeEventListener("change", requestMarketRender);

      if (marketFrame) {
        window.cancelAnimationFrame(marketFrame);
      }

      resetMarketCards();
    };
    requestMarketRender();
  }

  const partnersMarquee = page.querySelector("[data-partners-marquee]");

  if (typeof window.__antiCrisisPartnersMarqueeCleanup === "function") {
    window.__antiCrisisPartnersMarqueeCleanup();
  }

  if (partnersMarquee) {
    const partnersTrack = partnersMarquee.querySelector("[data-partners-track]");
    const partnersList = partnersMarquee.querySelector("[data-partners-list]");
    let duplicateList = null;

    const setPartnersMotion = () => {
      partnersMarquee.classList.remove("is-marquee-ready");
      duplicateList?.remove();
      duplicateList = null;

      if (reducedMotion.matches || !partnersTrack || !partnersList) {
        return;
      }

      duplicateList = partnersList.cloneNode(true);
      duplicateList.removeAttribute("data-partners-list");
      duplicateList.setAttribute("aria-hidden", "true");
      duplicateList.querySelectorAll("img").forEach((image) => {
        image.alt = "";
      });
      partnersTrack.append(duplicateList);

      window.requestAnimationFrame(() => {
        partnersMarquee.classList.add("is-marquee-ready");
      });
    };

    reducedMotion.addEventListener("change", setPartnersMotion);
    setPartnersMotion();

    window.__antiCrisisPartnersMarqueeCleanup = () => {
      reducedMotion.removeEventListener("change", setPartnersMotion);
      partnersMarquee.classList.remove("is-marquee-ready");
      duplicateList?.remove();
    };
  }

  const speakersSlider = page.querySelector("[data-speakers-slider]");

  if (typeof window.__antiCrisisSpeakersSliderCleanup === "function") {
    window.__antiCrisisSpeakersSliderCleanup();
  }

  if (speakersSlider && typeof window.Splide === "function") {
    const previousButton = page.querySelector("[data-speakers-previous]");
    const nextButton = page.querySelector("[data-speakers-next]");
    const speakersKeyboardRegion =
      speakersSlider.closest(".conference-speakers_body") || speakersSlider;
    const speakersSplide = new window.Splide(speakersSlider, {
      type: "slide",
      autoWidth: true,
      gap: "var(--card-gap)",
      arrows: false,
      pagination: false,
      drag: true,
      keyboard: false,
      wheel: false,
      snap: true,
      rewind: false,
      waitForTransition: false,
      perMove: 1,
      speed: 650,
      reducedMotion: {
        speed: 0,
        rewindSpeed: 0,
        autoplay: "pause",
      },
      i18n: {
        prev: "Предыдущие спикеры",
        next: "Следующие спикеры",
        first: "Перейти к первому спикеру",
        last: "Перейти к последнему спикеру",
        slideX: "Перейти к слайду %s",
        pageX: "Перейти на страницу %s",
        carousel: "Эксперты конференции",
        select: "Выберите слайд",
        slide: "Слайд",
        slideLabel: "%s из %s",
      },
    });

    const updateSpeakerControls = () => {
      const endIndex = speakersSplide.Components.Controller.getEnd();

      if (previousButton) {
        previousButton.disabled = speakersSplide.index <= 0;
      }

      if (nextButton) {
        nextButton.disabled = speakersSplide.index >= endIndex;
      }
    };

    const showPreviousSpeakers = () => speakersSplide.go("<");
    const showNextSpeakers = () => speakersSplide.go(">");
    const wheelThreshold = 36;
    const wheelIdleDelay = 140;
    const wheelImpulseDelay = 96;
    const wheelImpulseGrowth = 1.35;
    let wheelDistance = 0;
    let wheelIdleTimer = 0;
    let wheelLastMoveAt = Number.NEGATIVE_INFINITY;
    let wheelLastDirection = 0;
    let wheelPreviousMagnitude = 0;
    let wheelAwaitingFreshImpulse = false;

    const resetSpeakerWheelGesture = () => {
      wheelDistance = 0;
      wheelIdleTimer = 0;
      wheelLastDirection = 0;
      wheelPreviousMagnitude = 0;
      wheelAwaitingFreshImpulse = false;
    };

    const handleSpeakerWheel = (event) => {
      const horizontalDistance = Math.abs(event.deltaX);
      const verticalDistance = Math.abs(event.deltaY);

      if (horizontalDistance < 1 || horizontalDistance <= verticalDistance) {
        return;
      }

      event.preventDefault();
      window.clearTimeout(wheelIdleTimer);
      wheelIdleTimer = window.setTimeout(
        resetSpeakerWheelGesture,
        wheelIdleDelay,
      );

      const deltaMultiplier =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? window.innerWidth
            : 1;
      const normalizedDelta = event.deltaX * deltaMultiplier;
      const normalizedMagnitude = Math.abs(normalizedDelta);
      const normalizedDirection = Math.sign(normalizedDelta);
      const eventTime = event.timeStamp;

      if (wheelAwaitingFreshImpulse) {
        const impulseDelayElapsed =
          eventTime - wheelLastMoveAt >= wheelImpulseDelay;
        const directionChanged = normalizedDirection !== wheelLastDirection;
        const magnitudeIncreased =
          normalizedMagnitude >= 4 &&
          normalizedMagnitude >= wheelPreviousMagnitude * wheelImpulseGrowth;

        wheelPreviousMagnitude = normalizedMagnitude;

        if (!impulseDelayElapsed || (!directionChanged && !magnitudeIncreased)) {
          return;
        }

        wheelDistance = 0;
        wheelAwaitingFreshImpulse = false;
      }

      if (
        wheelDistance !== 0 &&
        Math.sign(wheelDistance) !== normalizedDirection
      ) {
        wheelDistance = 0;
      }

      wheelDistance += normalizedDelta;
      wheelPreviousMagnitude = normalizedMagnitude;

      if (Math.abs(wheelDistance) < wheelThreshold) {
        return;
      }

      wheelDistance = 0;
      wheelLastMoveAt = eventTime;
      wheelLastDirection = normalizedDirection;
      wheelAwaitingFreshImpulse = true;

      if (normalizedDirection > 0) {
        showNextSpeakers();
      } else {
        showPreviousSpeakers();
      }
    };

    const handleSpeakerKeydown = (event) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPreviousSpeakers();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextSpeakers();
      }
    };

    const focusSpeakerSlider = () => {
      speakersSlider.focus({ preventScroll: true });
    };

    speakersSplide.on("mounted moved updated resized", updateSpeakerControls);
    previousButton?.addEventListener("click", showPreviousSpeakers);
    nextButton?.addEventListener("click", showNextSpeakers);
    speakersSlider.addEventListener("wheel", handleSpeakerWheel, {
      passive: false,
    });
    speakersSlider.addEventListener("pointerdown", focusSpeakerSlider);
    speakersKeyboardRegion.addEventListener("keydown", handleSpeakerKeydown);
    speakersSplide.mount();
    speakersSlider.dataset.splideInitialized = "true";

    window.__antiCrisisSpeakersSliderCleanup = () => {
      previousButton?.removeEventListener("click", showPreviousSpeakers);
      nextButton?.removeEventListener("click", showNextSpeakers);
      speakersSlider.removeEventListener("wheel", handleSpeakerWheel);
      speakersSlider.removeEventListener("pointerdown", focusSpeakerSlider);
      speakersKeyboardRegion.removeEventListener("keydown", handleSpeakerKeydown);
      window.clearTimeout(wheelIdleTimer);
      speakersSplide.destroy(true);
      delete speakersSlider.dataset.splideInitialized;
    };
  }

  if (typeof window.__antiCrisisSpeakerCardsStaggerCleanup === "function") {
    window.__antiCrisisSpeakerCardsStaggerCleanup();
  }

  if (speakersSlider) {
    const speakerCards = [
      ...speakersSlider.querySelectorAll(".conference-speakers_card"),
    ];
    const speakerCardsDesktop = window.matchMedia("(min-width: 64rem)");
    const staggerStep = 48;
    let speakerCardsFrame = 0;

    const resetSpeakerCardsStagger = () => {
      speakersSlider.classList.remove("is-scroll-stagger-ready");
      speakerCards.forEach((card) => {
        card.style.removeProperty("--speaker-scroll-offset");
      });
    };

    const renderSpeakerCardsStagger = () => {
      speakerCardsFrame = 0;

      if (reducedMotion.matches || !speakerCardsDesktop.matches) {
        resetSpeakerCardsStagger();
        return;
      }

      const sliderRect = speakersSlider.getBoundingClientRect();
      const travelDistance = Math.max(1, window.innerHeight + sliderRect.height);
      const progress = Math.min(
        1,
        Math.max(0, (window.innerHeight - sliderRect.top) / travelDistance),
      );
      const direction = 1 - progress * 2;

      speakersSlider.classList.add("is-scroll-stagger-ready");
      speakerCards.forEach((card, index) => {
        const centeredIndex = index - (speakerCards.length - 1) / 2;
        const normalizedIndex = centeredIndex / Math.max(1, speakerCards.length - 1);
        const offset = normalizedIndex * staggerStep * direction;
        card.style.setProperty("--speaker-scroll-offset", `${offset.toFixed(2)}px`);
      });
    };

    const requestSpeakerCardsStagger = () => {
      if (!speakerCardsFrame) {
        speakerCardsFrame = window.requestAnimationFrame(renderSpeakerCardsStagger);
      }
    };

    window.addEventListener("scroll", requestSpeakerCardsStagger, { passive: true });
    window.addEventListener("resize", requestSpeakerCardsStagger, { passive: true });
    reducedMotion.addEventListener("change", requestSpeakerCardsStagger);
    speakerCardsDesktop.addEventListener("change", requestSpeakerCardsStagger);
    window.__antiCrisisSpeakerCardsStaggerCleanup = () => {
      window.removeEventListener("scroll", requestSpeakerCardsStagger);
      window.removeEventListener("resize", requestSpeakerCardsStagger);
      reducedMotion.removeEventListener("change", requestSpeakerCardsStagger);
      speakerCardsDesktop.removeEventListener("change", requestSpeakerCardsStagger);

      if (speakerCardsFrame) {
        window.cancelAnimationFrame(speakerCardsFrame);
      }

      resetSpeakerCardsStagger();
    };
    requestSpeakerCardsStagger();
  }

  const speakersScene = page.querySelector("[data-speakers-reveal]");

  if (speakersScene) {
    if (typeof window.__antiCrisisSpeakersMotionCleanup === "function") {
      window.__antiCrisisSpeakersMotionCleanup();
    }

    const speakersStage = speakersScene.querySelector(".conference-speakers_intro-stage");
    const speakersHeading = speakersScene.querySelector(".conference-speakers_heading");
    const speakersPhotoTarget = speakersScene.querySelector("[data-speakers-photo-target]");
    const speakersPhotoMotion = speakersScene.querySelector("[data-speakers-photo-motion]");
    const speakersPhotoVisual = speakersScene.querySelector("[data-speakers-photo-visual]");
    const speakersDesktop = window.matchMedia("(min-width: 64rem)");
    const targetRatio = 415.345 / 277.304;
    const clampSpeakerProgress = (value) => Math.min(1, Math.max(0, value));
    let speakersFrame = 0;

    const resetSpeakersMotion = () => {
      speakersScene.classList.remove("is-speaker-motion-ready");
      speakersHeading?.style.removeProperty("opacity");
      speakersHeading?.style.removeProperty("transform");
      speakersPhotoTarget?.style.removeProperty("opacity");
      speakersPhotoMotion?.style.removeProperty("transform");
      speakersPhotoMotion?.style.removeProperty("visibility");
      speakersPhotoVisual?.style.removeProperty("width");
      speakersPhotoVisual?.style.removeProperty("border-radius");
      speakersPhotoVisual?.style.removeProperty("transform");
    };

    const renderSpeakersMotion = () => {
      speakersFrame = 0;

      if (
        reducedMotion.matches ||
        !speakersDesktop.matches ||
        !speakersStage ||
        !speakersHeading ||
        !speakersPhotoTarget ||
        !speakersPhotoMotion ||
        !speakersPhotoVisual
      ) {
        resetSpeakersMotion();
        return;
      }

      speakersScene.classList.add("is-speaker-motion-ready");

      const sceneRect = speakersScene.getBoundingClientRect();
      const stageRect = speakersStage.getBoundingClientRect();
      const targetRect = speakersPhotoTarget.getBoundingClientRect();
      const scrollDistance = Math.max(
        1,
        speakersScene.offsetHeight - speakersStage.offsetHeight,
      );
      const progress = clampSpeakerProgress(-sceneRect.top / scrollDistance);
      const easedProgress = progress * progress * (3 - 2 * progress);
      const coverWidth = Math.max(
        window.innerWidth,
        window.innerHeight * targetRatio,
      );
      const targetScale = targetRect.width / coverWidth;
      const currentScale = 1 + (targetScale - 1) * easedProgress;
      const startCenterX = window.innerWidth / 2;
      const startCenterY = window.innerHeight / 2;
      const targetCenterX = targetRect.left - stageRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top - stageRect.top + targetRect.height / 2;
      const centerX = startCenterX + (targetCenterX - startCenterX) * easedProgress;
      const centerY = startCenterY + (targetCenterY - startCenterY) * easedProgress;
      const radius = (16 * easedProgress) / Math.max(currentScale, 0.001);
      const headingProgress = clampSpeakerProgress((progress - 0.3) / 0.42);
      const targetOpacity = clampSpeakerProgress(progress / 0.65);
      const headingPerspective = 1000 - 500 * headingProgress;
      const headingLift = 200 * (1 - headingProgress);
      const headingRotation = 90 * (1 - headingProgress);
      const headingScale = 0.6 + 0.4 * headingProgress;

      speakersPhotoMotion.style.visibility = "visible";
      speakersPhotoMotion.style.transform =
        `translate3d(${centerX.toFixed(3)}px, ${centerY.toFixed(3)}px, 0)`;
      speakersPhotoVisual.style.width = `${coverWidth.toFixed(3)}px`;
      speakersPhotoVisual.style.borderRadius = `${radius.toFixed(3)}px`;
      speakersPhotoVisual.style.transform =
        `translate3d(-50%, -50%, 0) scale(${currentScale.toFixed(5)}) ` +
        `rotate(${(-5.39 * easedProgress).toFixed(3)}deg)`;
      speakersPhotoTarget.style.opacity = targetOpacity.toFixed(3);
      speakersHeading.style.opacity = headingProgress.toFixed(3);
      speakersHeading.style.transform =
        `perspective(${headingPerspective.toFixed(3)}px) ` +
        `translate3d(0, ${headingLift.toFixed(3)}px, 0) ` +
        `rotate3d(-500, 10, 0, ${headingRotation.toFixed(3)}deg) ` +
        `scale(${headingScale.toFixed(5)})`;
    };

    const requestSpeakersRender = () => {
      if (!speakersFrame) {
        speakersFrame = window.requestAnimationFrame(renderSpeakersMotion);
      }
    };

    window.addEventListener("scroll", requestSpeakersRender, { passive: true });
    window.addEventListener("resize", requestSpeakersRender, { passive: true });
    reducedMotion.addEventListener("change", requestSpeakersRender);
    speakersDesktop.addEventListener("change", requestSpeakersRender);
    window.__antiCrisisSpeakersMotionCleanup = () => {
      window.removeEventListener("scroll", requestSpeakersRender);
      window.removeEventListener("resize", requestSpeakersRender);
      reducedMotion.removeEventListener("change", requestSpeakersRender);
      speakersDesktop.removeEventListener("change", requestSpeakersRender);

      if (speakersFrame) {
        window.cancelAnimationFrame(speakersFrame);
      }

      resetSpeakersMotion();
    };
    requestSpeakersRender();
  }

  const topicsSection = page.querySelector(".section_topics");

  if (topicsSection && topicsSection.dataset.topicsInitialized !== "true") {
    topicsSection.dataset.topicsInitialized = "true";

    const topicCards = [...topicsSection.querySelectorAll(".conference-topics_card")];
    const topicTriggers = [...topicsSection.querySelectorAll(".conference-topics_trigger")];
    const topicsHeadingScene = topicsSection.querySelector("[data-topics-heading-scene]");

    topicCards.forEach((card) => {
      card.dataset.open = "false";

      const answer = card.querySelector(".conference-topics_answer");
      answer?.setAttribute("aria-hidden", "true");
    });

    topicTriggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const card = trigger.closest(".conference-topics_card");
        const answerId = trigger.getAttribute("aria-controls");
        const answer = answerId ? document.getElementById(answerId) : null;

        if (!card || !answer) {
          return;
        }

        const willOpen = trigger.getAttribute("aria-expanded") !== "true";
        trigger.setAttribute("aria-expanded", String(willOpen));
        answer.setAttribute("aria-hidden", String(!willOpen));
        card.dataset.open = String(willOpen);

        if (willOpen) {
          card.style.setProperty("--topics-answer-height", `${answer.scrollHeight}px`);
        }
      });
    });

    topicCards.forEach((card) => {
      card.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest(".conference-topics_trigger")) {
          return;
        }

        card.querySelector(".conference-topics_trigger")?.click();
      });
    });

    if (topicsHeadingScene) {
      const topicsHeadingStage = topicsHeadingScene.querySelector(
        ".conference-topics_heading-stage",
      );
      const topicsHeading = topicsHeadingScene.querySelector("[data-topics-heading]");
      const topicsPhotoTarget = topicsHeadingScene.querySelector(
        "[data-topics-photo-target]",
      );
      const topicsPhotoMotion = topicsHeadingScene.querySelector(
        "[data-topics-photo-motion]",
      );
      const topicsPhotoVisual = topicsHeadingScene.querySelector(
        "[data-topics-photo-visual]",
      );
      const topicsDesktop = window.matchMedia("(min-width: 64rem)");
      const topicsTargetRatio = 358.608 / 239.424;
      const clampTopicsProgress = (value) => Math.min(1, Math.max(0, value));
      let topicsFrame = 0;

      const resetTopicsMotion = () => {
        topicsHeadingScene.classList.remove("is-topics-motion-ready");
        topicsHeading?.style.removeProperty("opacity");
        topicsHeading?.style.removeProperty("transform");
        topicsPhotoTarget?.style.removeProperty("opacity");
        topicsPhotoMotion?.style.removeProperty("transform");
        topicsPhotoMotion?.style.removeProperty("visibility");
        topicsPhotoVisual?.style.removeProperty("width");
        topicsPhotoVisual?.style.removeProperty("border-radius");
        topicsPhotoVisual?.style.removeProperty("transform");
      };

      const renderTopicsMotion = () => {
        topicsFrame = 0;

        if (
          reducedMotion.matches ||
          !topicsDesktop.matches ||
          !topicsHeadingStage ||
          !topicsHeading ||
          !topicsPhotoTarget ||
          !topicsPhotoMotion ||
          !topicsPhotoVisual
        ) {
          resetTopicsMotion();
          return;
        }

        topicsHeadingScene.classList.add("is-topics-motion-ready");

        const sceneRect = topicsHeadingScene.getBoundingClientRect();
        const stageRect = topicsHeadingStage.getBoundingClientRect();
        const targetRect = topicsPhotoTarget.getBoundingClientRect();
        const scrollDistance = Math.max(
          1,
          topicsHeadingScene.offsetHeight - topicsHeadingStage.offsetHeight,
        );
        const progress = clampTopicsProgress(-sceneRect.top / scrollDistance);
        const easedProgress = progress * progress * (3 - 2 * progress);
        const coverWidth = Math.max(
          window.innerWidth,
          window.innerHeight * topicsTargetRatio,
        );
        const targetScale = targetRect.width / coverWidth;
        const currentScale = 1 + (targetScale - 1) * easedProgress;
        const startCenterX = window.innerWidth / 2 - stageRect.left;
        const startCenterY = window.innerHeight / 2;
        const targetCenterX = targetRect.left - stageRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top - stageRect.top + targetRect.height / 2;
        const centerX = startCenterX + (targetCenterX - startCenterX) * easedProgress;
        const centerY = startCenterY + (targetCenterY - startCenterY) * easedProgress;
        const radius = (16 * easedProgress) / Math.max(currentScale, 0.001);
        const headingProgress = clampTopicsProgress((progress - 0.3) / 0.42);
        const targetOpacity = clampTopicsProgress(progress / 0.65);
        const headingPerspective = 1000 - 500 * headingProgress;
        const headingLift = 200 * (1 - headingProgress);
        const headingRotation = 90 * (1 - headingProgress);
        const headingScale = 0.6 + 0.4 * headingProgress;

        topicsPhotoMotion.style.visibility = "visible";
        topicsPhotoMotion.style.transform =
          `translate3d(${centerX.toFixed(3)}px, ${centerY.toFixed(3)}px, 0)`;
        topicsPhotoVisual.style.width = `${coverWidth.toFixed(3)}px`;
        topicsPhotoVisual.style.borderRadius = `${radius.toFixed(3)}px`;
        topicsPhotoVisual.style.transform =
          `translate3d(-50%, -50%, 0) scale(${currentScale.toFixed(5)}) ` +
          `rotate(${(5.61 * easedProgress).toFixed(3)}deg)`;
        topicsPhotoTarget.style.opacity = targetOpacity.toFixed(3);
        topicsHeading.style.opacity = headingProgress.toFixed(3);
        topicsHeading.style.transform =
          `perspective(${headingPerspective.toFixed(3)}px) ` +
          `translate3d(0, ${headingLift.toFixed(3)}px, 0) ` +
          `rotate3d(-500, 10, 0, ${headingRotation.toFixed(3)}deg) ` +
          `scale(${headingScale.toFixed(5)})`;
      };

      const requestTopicsRender = () => {
        if (!topicsFrame) {
          topicsFrame = window.requestAnimationFrame(renderTopicsMotion);
        }
      };

      window.addEventListener("scroll", requestTopicsRender, { passive: true });
      window.addEventListener("resize", requestTopicsRender, { passive: true });
      reducedMotion.addEventListener("change", requestTopicsRender);
      topicsDesktop.addEventListener("change", requestTopicsRender);
      requestTopicsRender();
    }

  }
})();
