/* ============================================================================
   ПОВЕДЕНИЕ СТРАНИЦЫ «ТЕРАПИЯ ВНУТРЕННИХ СЕМЕЙНЫХ СИСТЕМ (IFS)»
   ============================================================================

   Скрипт делает четыре вещи:
     1) плавно раскрывает занятия в «Программе обучения» и вопросы в блоке
        «Ответы на популярные вопросы». Без скрипта аккордеоны тоже
        работают — просто без анимации: это обычный тег <details>;
     2) плавно везёт к якорям на этой же странице и переключает модули
        в «Программе обучения» (без скрипта виден первый модуль);
     3) отправляет форму заявки через скрытую форму Тильды;
     4) подставляет цены тарифов, дату старта и расписание из CMS
        (Public API). Без ответа API остаются значения из HTML.

   ГЛАВНОЕ ПРО ФОРМУ ЗАЯВКИ
   Поля на странице свои — по макету. Скрытую форму Тильды мы не удаляем:
   она и есть наш канал в CRM. По нажатию «Отправить заявку» скрипт:
     1) проверяет, что имя и телефон заполнены;
     2) переносит значения полей и служебные данные (ClientID Метрики,
        UTM-метки) в скрытую форму Тильды;
     3) отправляет её через requestSubmit() и ждёт ответа. По ответу
        показывает «Заявка отправлена» или просит попробовать ещё раз.
   На превью формы Тильды нет — скрипт пишет об этом в консоль и показывает
   успешное состояние, чтобы страницу можно было проверить.

   ПОРЯДОК РАЗДЕЛОВ
     0. Общее
     1. Аккордеон
     2. Плавный скролл к якорям
     3. Служебные значения: ClientID Метрики и UTM-метки
     4. Скрытая форма Тильды
     5. Отправка заявки
     6. Цены и даты из CMS
   ========================================================================== */

(() => {
  "use strict";

  const page = document.querySelector(".ifs-page");
  if (!page) return;

  /* --------------------------------------------------------------------------
     0. ОБЩЕЕ
     -------------------------------------------------------------------------- */

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // На боевом домене скрытая форма Тильды обязана быть на странице.
  // На превью её нет, поэтому шаг с Тильдой пропускается — иначе страницу
  // нельзя было бы проверить.
  const IS_PRODUCTION = /(^|\.)modern-psy\.ru$/.test(window.location.hostname);


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
     2. ПЛАВНЫЙ СКРОЛЛ К ЯКОРЯМ
     --------------------------------------------------------------------------
     Кнопка «Записаться на обучение» и другие ссылки на блоки этой же страницы
     едут к цели с плавным ускорением и замедлением. Анимируем сами,
     а не через CSS scroll-behavior: внутри Тильды её скрипты могут
     перебивать поведение html. Ссылки на попапы Тильды («#popup:…»)
     не трогаем — их обрабатывает сама Тильда.
     -------------------------------------------------------------------------- */

  const scrollEase = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  let anchorAnimationId = 0;

  const scrollToAnchor = (targetElement) => {
    const targetY = Math.max(
      0,
      Math.min(
        targetElement.getBoundingClientRect().top + window.scrollY - 32,
        document.documentElement.scrollHeight - window.innerHeight
      )
    );

    if (reducedMotion.matches) {
      window.scrollTo(0, targetY);
      return;
    }

    window.cancelAnimationFrame(anchorAnimationId);

    // На время анимации выключаем CSS scroll-behavior: smooth на странице,
    // иначе каждый наш кадр сам превращается в плавный скролл и всё вязнет
    const pageRoot = document.documentElement;
    pageRoot.style.scrollBehavior = "auto";

    const from = window.scrollY;
    const distance = targetY - from;
    // Длительность растёт с расстоянием, но в разумных пределах
    const duration = Math.min(900, Math.max(400, Math.abs(distance) / 6));
    const start = performance.now();

    const frame = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      window.scrollTo(0, from + distance * scrollEase(progress));

      if (progress < 1) {
        anchorAnimationId = window.requestAnimationFrame(frame);
      } else {
        pageRoot.style.scrollBehavior = "";
      }
    };

    anchorAnimationId = window.requestAnimationFrame(frame);
  };

  page.addEventListener("click", (event) => {
    const link = event.target instanceof Element
      ? event.target.closest('a[href^="#"]')
      : null;
    if (!link) return;

    const hash = link.getAttribute("href") || "";
    if (hash.startsWith("#popup:")) return; // всплывающие окна — забота Тильды

    const target = hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
    if (!target) return;

    event.preventDefault();
    scrollToAnchor(target);
    window.history.replaceState(null, "", hash);
  });




  /* --------------------------------------------------------------------------
     2.5. ПРОГРАММА ОБУЧЕНИЯ — ПЕРЕКЛЮЧЕНИЕ МОДУЛЕЙ
     --------------------------------------------------------------------------
     Кнопки слева, панели справа. Кнопка связана с панелью через
     aria-controls. При переключении панель коротко выезжает сбоку.
     -------------------------------------------------------------------------- */

  page.querySelectorAll("[data-program]").forEach((block) => {
    const tabs = Array.from(block.querySelectorAll("[data-program-tab]"));
    const panels = Array.from(block.querySelectorAll("[data-program-panel]"));

    const select = (tab) => {
      tabs.forEach((item) => item.setAttribute("aria-selected", String(item === tab)));

      const targetId = tab.getAttribute("aria-controls");
      panels.forEach((panel) => {
        const isTarget = panel.id === targetId;
        panel.hidden = !isTarget;
        panel.classList.remove("is-entering");
        if (isTarget && !reducedMotion.matches) {
          void panel.offsetWidth; // перезапуск анимации появления
          panel.classList.add("is-entering");
        }
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => select(tab));

      // Стрелки ходят по списку модулей — так положено табам
      tab.addEventListener("keydown", (event) => {
        const delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
        if (!delta) return;
        event.preventDefault();
        const nextTab = tabs[(index + delta + tabs.length) % tabs.length];
        nextTab.focus();
        select(nextTab);
      });
    });
  });


  /* --------------------------------------------------------------------------
     3. СЛУЖЕБНЫЕ ЗНАЧЕНИЯ: ClientID МЕТРИКИ И UTM-МЕТКИ
     --------------------------------------------------------------------------
     Скрытые поля, которые уходят в CRM вместе с заявкой. Человек их
     не заполняет — скрипт собирает всё сам: из адреса страницы
     и из счётчика Метрики.
     -------------------------------------------------------------------------- */

  // 🟡 КАК ПОЛЯ НАЗЫВАЮТСЯ В ФОРМЕ ТИЛЬДЫ.
  // Имена должны совпадать с настройками формы буква в букву. Если в Тильде
  // поле назвали иначе — поменяйте строку здесь, больше нигде править не надо.
  const CLIENT_ID_FIELD = "ym_client_id";
  const UTM_FIELDS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ];

  // Метки живут в адресе только на первом шаге. Запоминаем их на время визита,
  // чтобы они не потерялись, если человек ушёл по ссылке и вернулся назад.
  const UTM_STORAGE_KEY = "ifs-utm";

  const readStoredUtm = () => {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(UTM_STORAGE_KEY) || "{}");
      return saved && typeof saved === "object" ? saved : {};
    } catch (error) {
      return {};
    }
  };

  const collectUtm = () => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = {};

    UTM_FIELDS.forEach((key) => {
      const value = (params.get(key) || "").trim();
      if (value) fromUrl[key] = value;
    });

    const result = { ...readStoredUtm(), ...fromUrl };

    if (Object.keys(fromUrl).length > 0) {
      try {
        window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(result));
      } catch (error) {
        // Приватный режим браузера — просто работаем без запоминания
      }
    }

    return result;
  };

  // Запоминаем метки сразу при загрузке, не дожидаясь нажатия
  collectUtm();

  // Сколько ждём ответа Метрики. Не дождались — берём номер из куки
  const METRIKA_TIMEOUT_MS = 1500;

  // Номер посетителя Метрики лежит в куке _ym_uid. Это то же самое значение,
  // что отдаёт getClientID, поэтому кука — надёжный запасной вариант
  const clientIdFromCookie = () =>
    (document.cookie.match(/(?:^|;\s*)_ym_uid=([^;]+)/) || [])[1] || "";

  // Номер счётчика на странице: сначала смотрим, не указан ли он руками
  // в data-metrika-id, потом спрашиваем сам счётчик
  const findCounterId = (block) => {
    const manual = (block.dataset.metrikaId || "").trim();
    if (manual) return manual;

    const ya = window.Ya;
    const found = [];

    try {
      if (typeof ya?.Metrika2?.counters === "function") {
        found.push(...ya.Metrika2.counters().map((counter) => counter.id));
      }
      if (typeof ya?.Metrika?.counters === "function") {
        found.push(...ya.Metrika.counters().map((counter) => counter.id));
      }
      if (ya?._metrika?.counter?.id) found.push(ya._metrika.counter.id);
    } catch (error) {
      // Метрика ещё не поднялась — ниже вернём пусто и возьмём куку
    }

    return found.filter(Boolean)[0] || "";
  };

  const readClientId = (block) => new Promise((resolve) => {
    const fromCookie = clientIdFromCookie();
    const counter = findCounterId(block);

    if (!counter || typeof window.ym !== "function") {
      resolve(fromCookie);
      return;
    }

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(String(value || fromCookie || ""));
    };

    const timer = window.setTimeout(() => finish(""), METRIKA_TIMEOUT_MS);

    try {
      window.ym(Number(counter), "getClientID", finish);
    } catch (error) {
      finish("");
    }
  });


  /* --------------------------------------------------------------------------
     4. СКРЫТАЯ ФОРМА ТИЛЬДЫ
     --------------------------------------------------------------------------
     Тильда рисует свою форму где-то на странице. Мы её не удаляем — она
     и есть наш канал в CRM, — а убираем с глаз и отправляем из скрипта.
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

  // Форму ищем по имени из настроек Тильды. Если имя не совпало, но форма
  // на странице всего одна — берём её и предупреждаем в консоли.
  let formNameWarned = false;

  const findTildaForm = (formName) => {
    const forms = [...document.querySelectorAll("form.t-form")];

    const byName = forms.find(
      (form) => form.querySelector('input[name="tildaspec-formname"]')?.value === formName
    );
    if (byName) return byName;

    if (forms.length === 1) {
      if (!formNameWarned) {
        formNameWarned = true;
        const realName = forms[0].querySelector('input[name="tildaspec-formname"]')?.value;
        console.warn(
          `[заявка] Формы с именем «${formName}» на странице нет. ` +
          (realName
            ? `Единственная форма называется «${realName}» — работаем с ней. `
            : "Единственная форма вообще без имени — работаем с ней. ") +
          "Поправьте data-tilda-form-name в разметке, чтобы предупреждение ушло."
        );
      }
      return forms[0];
    }

    return null;
  };

  const hideTildaForm = (formName) => {
    const nativeForm = findTildaForm(formName);
    if (!(nativeForm instanceof HTMLFormElement)) return null;

    const record = nativeForm.closest(".t-rec") || nativeForm;
    record.setAttribute("aria-hidden", "true");
    record.setAttribute("data-ifs-native-form-record", "");

    return nativeForm;
  };

  // Кладём значение в поле формы Тильды. Поля с таким именем может не быть —
  // тогда добавляем скрытое поле сами: Тильда отправляет всё, что внутри формы.
  const setTildaField = (nativeForm, name, value) => {
    let input = nativeForm.querySelector(`input[name="${name}"]`);

    if (!(input instanceof HTMLInputElement)) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.setAttribute("data-ifs-added-field", "");
      nativeForm.appendChild(input);
    }

    setNativeValue(input, value);
  };

  // Сколько ждём ответа Тильды, прежде чем показать ошибку
  const TILDA_TIMEOUT_MS = 8000;

  const eventForm = (event, passedForm) =>
    passedForm instanceof HTMLFormElement ? passedForm
      : event?.detail?.form instanceof HTMLFormElement ? event.detail.form
      : event?.target instanceof HTMLFormElement ? event.target
      : null;

  // Ответ приходит событием, а не из requestSubmit, поэтому ждём его отдельно.
  // Возвращаем "success" | "error" | "timeout".
  const waitForTilda = (nativeForm) => new Promise((resolve) => {
    let done = false;
    let timer = 0;

    const finish = (result) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      document.removeEventListener("tildaform:aftersuccess", onSuccess);
      document.removeEventListener("tildaform:aftererror", onError);
      if (typeof window.jQuery === "function") {
        window.jQuery(document).off(".ifsSignup");
      }
      resolve(result);
    };

    const isOurs = (event, passedForm) => {
      const form = eventForm(event, passedForm);
      return !form || form === nativeForm;
    };

    const onSuccess = (event, passedForm) => { if (isOurs(event, passedForm)) finish("success"); };
    const onError = (event, passedForm) => { if (isOurs(event, passedForm)) finish("error"); };

    document.addEventListener("tildaform:aftersuccess", onSuccess);
    document.addEventListener("tildaform:aftererror", onError);

    if (typeof window.jQuery === "function") {
      window.jQuery(document).on("tildaform:aftersuccess.ifsSignup", onSuccess);
      window.jQuery(document).on("tildaform:aftererror.ifsSignup", onError);
    }

    timer = window.setTimeout(() => finish("timeout"), TILDA_TIMEOUT_MS);
  });


  /* --------------------------------------------------------------------------
     5. ОТПРАВКА ЗАЯВКИ
     -------------------------------------------------------------------------- */

  page.querySelectorAll("[data-lead-form]").forEach((block) => {
    const formName = block.dataset.tildaFormName || "";
    const form = block.querySelector("form.lead-form_component");
    const status = block.querySelector("[data-lead-status]");
    const submit = block.querySelector(".lead-form_submit");

    if (!(form instanceof HTMLFormElement)) return;

    let busy = false;

    const setStatus = (message = "", state = "idle") => {
      if (!status) return;
      status.textContent = message;
      status.dataset.state = state;
    };

    // Своя проверка обязательных полей: подсвечиваем пустые
    const validate = () => {
      let firstInvalid = null;

      form.querySelectorAll(".lead-form_input[required]").forEach((input) => {
        const isEmpty = !String(input.value || "").trim();
        const isBadEmail = input.type === "email" && input.value && !input.checkValidity();
        const invalid = isEmpty || isBadEmail;

        input.setAttribute("aria-invalid", String(invalid));
        if (invalid && !firstInvalid) firstInvalid = input;
      });

      return firstInvalid;
    };

    // Снимаем подсветку, как только человек начал править поле
    form.querySelectorAll(".lead-form_input").forEach((input) => {
      input.addEventListener("input", () => input.removeAttribute("aria-invalid"));
    });

    const sendToTilda = async () => {
      const nativeForm = hideTildaForm(formName);

      // На превью формы Тильды нет — это нормально, просто пропускаем шаг
      if (!(nativeForm instanceof HTMLFormElement)) {
        const message = `[заявка] Формы Тильды «${formName}» на странице нет — заявка не отправлена.`;
        if (IS_PRODUCTION) console.error(message);
        else console.info(`${message} Это превью, так и должно быть.`);
        return IS_PRODUCTION ? "error" : "skipped";
      }

      const utm = collectUtm();
      const clientId = await readClientId(block);
      const values = new FormData(form);

      // Сначала видимые поля, потом служебные
      ["Name", "Phone", "Messenger"].forEach((name) => {
        setTildaField(nativeForm, name, String(values.get(name) || ""));
      });

      setTildaField(nativeForm, CLIENT_ID_FIELD, clientId);
      UTM_FIELDS.forEach((key) => setTildaField(nativeForm, key, utm[key] || ""));

      const answer = waitForTilda(nativeForm);

      // Выключенную (disabled) кнопку в качестве отправителя брать нельзя —
      // в таком случае отправляем форму без указания кнопки
      const nativeSubmit = nativeForm.querySelector(
        'button[type="submit"]:not(:disabled), input[type="submit"]:not(:disabled)'
      );
      if (nativeSubmit instanceof HTMLElement) nativeForm.requestSubmit(nativeSubmit);
      else nativeForm.requestSubmit();

      return answer;
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (busy) return;

      const firstInvalid = validate();
      if (firstInvalid) {
        setStatus("Заполните, пожалуйста, имя и телефон", "error");
        firstInvalid.focus();
        return;
      }

      busy = true;
      if (submit) submit.disabled = true;
      setStatus("Секунду, отправляем заявку…", "loading");

      let result = "error";
      try {
        result = await sendToTilda();
      } catch (error) {
        console.error("[заявка] Не получилось отправить заявку в Тильду.", error);
      }

      busy = false;
      if (submit) submit.disabled = false;

      if (result === "success" || result === "skipped") {
        setStatus("Заявка отправлена! Мы свяжемся с вами в рабочее время.", "success");
        form.reset();
      } else {
        setStatus(
          "Не получилось отправить заявку. Попробуйте ещё раз или напишите нам на info@modern-psy.ru",
          "error"
        );
      }
    });

    /* --- Старт ------------------------------------------------------------ */

    if (formName) {
      hideTildaForm(formName);

      // Тильда дорисовывает свои блоки позже — прячем форму снова, когда появится
      new MutationObserver(() => hideTildaForm(formName))
        .observe(document.body, { childList: true, subtree: true });
    }
  });

  /* --------------------------------------------------------------------------
     6. ЦЕНЫ И ДАТЫ ИЗ CMS
     --------------------------------------------------------------------------
     Страница спрашивает у Public API курс по слагу (data-course на обёртке
     страницы, адрес API — в <meta name="public-api-url">) и подставляет
     значения в метки:

       data-cms-tariff="Название тарифа"  цена тарифа. Название должно
                                          совпадать с админкой CMS буква
                                          в букву (регистр и пробелы по краям
                                          не важны);
       data-cms="start-date"              дата старта ближайшего потока,
                                          «7 сентября»;
       data-cms="schedule"                расписание потока, текст из CMS
                                          с маленькой буквы («по понедельникам
                                          16:00–19:00»);
       data-cms="saving"                  «выгода N ₽» — сумма модулей минус
                                          цена пакета «все модули».

     Пока данные грузятся, метки чуть прозрачные (класс is-cms-loading).
     Если API не ответил или поля нет — остаётся текст-«запаска» из HTML,
     страница не ломается. Работает и внутри Тильды: это обычный fetch
     с той же страницы, CORS на API для modern-psy.ru открыт.
     -------------------------------------------------------------------------- */

  // 🔴 Названия тарифов в CMS, из которых считается выгода пакета
  const SAVING_PARTS = ["Базовый модуль", "Продвинутый модуль"];
  const SAVING_TOTAL = "Оба модуля вместе";

  const CMS_TIMEOUT_MS = 8000;

  const formatRub = (value) => {
    if (value == null || Number.isNaN(Number(value))) return null;
    try {
      return new Intl.NumberFormat("ru-RU", {
        style: "currency", currency: "RUB", maximumFractionDigits: 0,
      }).format(Number(value));
    } catch (error) {
      return `${Number(value).toLocaleString("ru-RU")} ₽`;
    }
  };

  // «2026-09-07» → «7 сентября»
  const formatDay = (iso) => {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(date);
  };

  const normalizeTitle = (text) => String(text || "").trim().toLowerCase();

  // Цена тарифа: единовременная, если задана, иначе основная
  const tariffPrice = (tariff) => {
    if (!tariff) return null;
    if (tariff.fullPaymentPrice != null) return tariff.fullPaymentPrice;
    return tariff.price != null ? tariff.price : null;
  };

  const setCmsText = (element, text) => {
    if (text != null && text !== "") element.textContent = text;
    element.classList.remove("is-cms-loading");
  };

  const applyCourseData = (data) => {
    const stream = data.nearestStream || null;
    const pricing = stream && stream.pricing ? stream.pricing : null;
    const tariffs = pricing && pricing.hasTariffs ? pricing.tariffs || [] : [];

    const findTariff = (title) =>
      tariffs.find((tariff) => normalizeTitle(tariff.title) === normalizeTitle(title)) || null;

    page.querySelectorAll("[data-cms-tariff]").forEach((element) => {
      const tariff = findTariff(element.dataset.cmsTariff);
      if (!tariff) {
        console.warn(`[cms] тарифа «${element.dataset.cmsTariff}» в CMS нет — оставляю запаску.`);
      }
      setCmsText(element, formatRub(tariffPrice(tariff)));
    });

    page.querySelectorAll("[data-cms]").forEach((element) => {
      switch (element.dataset.cms) {
        case "start-date":
          setCmsText(element, stream ? formatDay(stream.startDate) : null);
          break;

        case "schedule": {
          const text = stream && stream.schedule ? String(stream.schedule).trim() : "";
          setCmsText(element, text ? text.charAt(0).toLowerCase() + text.slice(1) : null);
          break;
        }

        case "saving": {
          const parts = SAVING_PARTS.map((title) => tariffPrice(findTariff(title)));
          const total = tariffPrice(findTariff(SAVING_TOTAL));
          const complete = total != null && parts.every((price) => price != null);
          const saving = complete ? parts.reduce((sum, price) => sum + price, 0) - total : null;
          if (saving != null && saving > 0) {
            setCmsText(element, `выгода ${formatRub(saving)}`);
          } else {
            // Выгоды нет или цены неполные — строку убираем, чтобы не врать
            element.textContent = "";
            element.classList.remove("is-cms-loading");
          }
          break;
        }

        default:
          setCmsText(element, null);
      }
    });
  };

  const loadCourse = () => {
    const slug = (page.dataset.course || "").trim();
    const apiMeta = document.querySelector('meta[name="public-api-url"]');
    const apiBase = (apiMeta && apiMeta.content ? apiMeta.content : "").replace(/\/+$/, "");
    const marks = page.querySelectorAll("[data-cms], [data-cms-tariff]");

    if (!marks.length) return;
    if (!slug || !apiBase) {
      console.warn("[cms] не задан data-course или meta public-api-url — показываю запаски.");
      return;
    }

    marks.forEach((element) => element.classList.add("is-cms-loading"));

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), CMS_TIMEOUT_MS);

    fetch(`${apiBase}/api/public/course/${encodeURIComponent(slug)}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(applyCourseData)
      .catch((error) => {
        console.error(`[cms] данные курса «${slug}» не загружены — остаются запаски.`, error);
        marks.forEach((element) => element.classList.remove("is-cms-loading"));
      })
      .finally(() => window.clearTimeout(timer));
  };

  loadCourse();
})();
