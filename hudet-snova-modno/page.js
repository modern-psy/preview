/* ============================================================================
   ПОВЕДЕНИЕ СТРАНИЦЫ «КЛИНИЧЕСКАЯ БАЗА: ТРЕНД ИЛИ НЕОБХОДИМОСТЬ»
   ============================================================================

   Скрипт делает три вещи:
     1) плавно раскрывает вопросы в блоке «Ответы на популярные вопросы».
        Без скрипта аккордеон тоже работает — просто без анимации:
        это обычный тег <details>;
     2) открывает и закрывает меню в шапке на узких экранах;
     3) связывает кнопки виджета BotHelp со скрытой формой Тильды.

   ГЛАВНОЕ ПРО ЗАПИСЬ НА ВЕБИНАР
   Полей и своих кнопок на странице нет. Человек видит только кнопки
   мессенджеров, которые рисует виджет BotHelp, и нажимает одну из них.
   По нажатию скрипт:

     1) перехватывает нажатие в фазе погружения, пока его не увидел BotHelp;
     2) кладёт служебные значения — ClientID Метрики и UTM-метки — в скрытую
        форму Тильды и отправляет её. Дальше данные уходят в AmoCRM штатной
        интеграцией Тильды;
     3) как только Тильда ответила, возвращает нажатие виджету, и человек
        уходит подписываться на бота.

   ПОЧЕМУ ИМЕННО ТАКОЙ ПОРЯДОК
   BotHelp по клику уводит со страницы в этой же вкладке (location.href).
   Если дать его кнопке сработать сразу, страница закроется, а заявка в Тильду
   уйти не успеет. Поэтому: сначала Тильда, потом BotHelp.

   А ЕСЛИ ТИЛЬДА НЕ ОТВЕТИЛА
   Всё равно уводим человека в мессенджер. Подписка на бота важнее: без неё
   он не получит ссылку на эфир. Про неудачу пишем в консоль.

   ПОРЯДОК РАЗДЕЛОВ
     0. Общее
     1. Аккордеон
     1.5. Меню в шапке
     2. Служебные значения: ClientID Метрики и UTM-метки
     3. Скрытая форма Тильды
     4. Виджет BotHelp
     5. Запись на вебинар
   ========================================================================== */

(() => {
  "use strict";

  const page = document.querySelector(".clinic-page");
  if (!page) return;

  /* --------------------------------------------------------------------------
     0. ОБЩЕЕ
     -------------------------------------------------------------------------- */

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // На боевом домене скрытая форма Тильды обязана быть на странице.
  // На превью её нет, поэтому шаг с Тильдой пропускается — иначе страницу
  // нельзя было бы проверить.
  const IS_PRODUCTION = /(^|\.)modern-psy\.ru$/.test(window.location.hostname);

  // Сколько ждём виджет BotHelp, прежде чем признать, что он не загрузился
  const BOTHELP_TIMEOUT_MS = 12000;

  // Сколько ждём, что BotHelp уведёт человека в мессенджер. Если не увёл
  // (например, не ответил их сервер) — разблокируем форму и показываем ссылку
  const HANDOFF_TIMEOUT_MS = 6000;

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
     2. СЛУЖЕБНЫЕ ЗНАЧЕНИЯ: ClientID МЕТРИКИ И UTM-МЕТКИ
     --------------------------------------------------------------------------
     Это те самые скрытые поля, ради которых мы вообще трогаем форму Тильды.
     Полей на странице нет, значит и человек их не заполняет — всё, что можно
     узнать, скрипт собирает сам: из адреса страницы и из счётчика Метрики.
     -------------------------------------------------------------------------- */

  // 🟡 КАК ПОЛЯ НАЗЫВАЮТСЯ В ФОРМЕ ТИЛЬДЫ.
  // Имена должны совпадать с настройками формы буква в букву. Если в Тильде
  // поле назвали иначе — поменяйте строку здесь, больше нигде править не надо.
  // Если поля с таким именем в форме нет, скрипт добавит его сам.
  const CLIENT_ID_FIELD = "ym_client_id";
  const UTM_FIELDS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ];

  // 🟡 ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ.
  // Тильда не заводит сделку в CRM, если в форме заполнены одни только скрытые
  // поля: она считает такую заявку пустой. Поэтому кладём в «Имя» понятную
  // подпись — по ней в CRM видно, с какого лендинга пришёл человек.
  // Слева — имя поля в форме Тильды, справа — что в него подставить.
  const DEFAULT_FIELDS = {
    Name: "Заявка с лендинга «Худеть снова модно» (вебинар 15.10)",
  };

  // Метки живут в адресе только на первом шаге. Запоминаем их на время визита,
  // чтобы они не потерялись, если человек ушёл по ссылке и вернулся назад.
  const UTM_STORAGE_KEY = "clinic-utm";

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
     3. СКРЫТАЯ ФОРМА ТИЛЬДЫ
     --------------------------------------------------------------------------
     Тильда рисует свою форму где-то на странице. Мы её не удаляем — она и есть
     наш канал в AmoCRM, — а убираем с глаз и отправляем из скрипта.
     Своей кнопки на странице для этого не нужно: у формы вызывается
     requestSubmit(), как будто по её собственной кнопке нажали.
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
  // на странице всего одна — берём её и предупреждаем в консоли. Иначе самая
  // частая опечатка в имени тихо ломала бы всё: заявка никуда не уходит,
  // а штатная форма Тильды остаётся висеть на виду.
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
          `[запись] Формы с именем «${formName}» на странице нет. ` +
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
    record.setAttribute("data-clinic-native-form-record", "");

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
      input.setAttribute("data-clinic-added-field", "");
      nativeForm.appendChild(input);
    }

    setNativeValue(input, value);
  };

  // Поля на странице мы больше не показываем, а в форме Тильды «Имя» и
  // «Телефон» могут остаться обязательными — тогда её же проверка не пустит
  // заявку. Снимаем обязательность только с пустых полей: если кто-то настроит
  // в форме поле со значением, мы его не трогаем.
  const relaxTildaValidation = (nativeForm) => {
    const relaxed = [];

    nativeForm.querySelectorAll("[required], [data-tilda-rule], [data-tilda-req]").forEach((field) => {
      if (String(field.value || "").trim()) return;

      relaxed.push(field.name || field.id || "без имени");
      field.removeAttribute("required");
      field.removeAttribute("data-tilda-rule");
      field.removeAttribute("data-tilda-req");
    });

    if (relaxed.length > 0) {
      console.info(
        "[запись] В форме Тильды есть обязательные поля, которых нет на странице: " +
        `${relaxed.join(", ")}. Заявка уйдёт с пустыми значениями — ` +
        "лучше снять с них обязательность в настройках формы."
      );
    }
  };

  // Сколько ждём ответа Тильды, прежде чем всё равно увести человека в бота.
  // Подписка на бота важнее: без неё он не получит ссылку на эфир
  const TILDA_TIMEOUT_MS = 5000;

  const eventForm = (event, passedForm) =>
    passedForm instanceof HTMLFormElement ? passedForm
      : event?.detail?.form instanceof HTMLFormElement ? event.detail.form
      : event?.target instanceof HTMLFormElement ? event.target
      : null;

  // Ответ приходит событием, а не из requestSubmit, поэтому ждём его отдельно.
  // Возвращаем "success" | "error" | "timeout" — но в любом случае возвращаем:
  // застрять на странице человек не должен
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
        window.jQuery(document).off(".clinicSignup");
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
      window.jQuery(document).on("tildaform:aftersuccess.clinicSignup", onSuccess);
      window.jQuery(document).on("tildaform:aftererror.clinicSignup", onError);
    }

    timer = window.setTimeout(() => finish("timeout"), TILDA_TIMEOUT_MS);
  });


  /* --------------------------------------------------------------------------
     4. ВИДЖЕТ BOTHELP
     --------------------------------------------------------------------------
     Виджет подгружает свои кнопки не сразу, поэтому ждём их появления.
     Пока не дождались — на их месте стоит серый скелет. Если за отведённое
     время кнопки не пришли, показываем подсказку: записаться будет негде.
     -------------------------------------------------------------------------- */

  const createBotHelp = (mount) => {
    const skeleton = mount.querySelector("[data-bh-skeleton]");
    const errorNote = mount.querySelector("[data-bh-error]");
    let state = "loading"; // loading → ready | failed
    let observer = null;
    let timer = 0;

    const buttons = () => [...mount.querySelectorAll(".bh-w-messenger-button")];

    const checkboxes = () => [
      ...mount.querySelectorAll("[data-consent-checkbox], .bh-w-consent__checkbox"),
    ];

    const setState = (next) => {
      if (state === next) return;
      state = next;
      mount.dataset.bhState = next;
      if (skeleton) skeleton.hidden = next !== "loading";
      if (errorNote) errorNote.hidden = next !== "failed";
    };

    const finish = () => {
      window.clearTimeout(timer);
      observer?.disconnect();
      observer = null;
    };

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
      // Согласие BotHelp проверяет сам и молча не пускает клик.
      // Мы читаем галочку до него, чтобы не отправить заявку впустую
      consentGiven: () => {
        const items = checkboxes();
        return items.length === 0 || items.every((item) => item.checked);
      },
    };
  };


  /* --------------------------------------------------------------------------
     5. ЗАПИСЬ НА ВЕБИНАР
     --------------------------------------------------------------------------
     Своих кнопок в блоке нет — есть только кнопки мессенджеров от BotHelp.
     По нажатию на любую из них:
       1) перехватываем нажатие в фазе погружения, чтобы обработчик BotHelp
          не успел сработать. Иначе он тут же уводит со страницы
          (location.href), и заявка в Тильду не успевает уйти;
       2) отправляем скрытую форму Тильды со служебными полями;
       3) возвращаем нажатие виджету — и человек уходит в мессенджер.
     -------------------------------------------------------------------------- */

  page.querySelectorAll("[data-signup]").forEach((block) => {
    const formName = block.dataset.tildaFormName || "";
    const mount = block.querySelector("[data-bh-mount]");
    const status = block.querySelector("[data-lead-status]");
    const manualBlock = block.querySelector("[data-lead-manual]");
    const manualLink = block.querySelector("[data-lead-manual-link]");

    if (!mount) return;

    const bothelp = createBotHelp(mount);

    let busy = false;
    // Поднимаем на время, когда сами нажимаем кнопку виджета: по этому флагу
    // перехватчик пропускает нажатие дальше, к обработчику BotHelp
    let passThrough = false;

    const setStatus = (message = "", state = "idle") => {
      if (!status) return;
      status.textContent = message;
      status.dataset.state = state;
    };

    const showManual = (link) => {
      busy = false;
      block.dataset.state = "idle";
      setStatus();

      if (link && manualLink instanceof HTMLAnchorElement && manualBlock) {
        manualLink.href = link;
        manualBlock.hidden = false;
      }
    };

    /* --- Шаг 2: заявка в Тильду ------------------------------------------ */

    const sendToTilda = async () => {
      const nativeForm = hideTildaForm(formName);

      // На превью формы Тильды нет — это нормально, просто пропускаем шаг
      if (!(nativeForm instanceof HTMLFormElement)) {
        const message = `[запись] Формы Тильды «${formName}» на странице нет — заявка не отправлена.`;
        if (IS_PRODUCTION) console.error(message);
        else console.info(`${message} Это превью, так и должно быть.`);
        return "skipped";
      }

      const utm = collectUtm();
      const clientId = await readClientId(block);

      // Сначала значения по умолчанию, потом служебные поля.
      // Порядок важен: заполненное «Имя» проходит проверку Тильды само,
      // и снимать с него обязательность уже не придётся
      Object.entries(DEFAULT_FIELDS).forEach(([name, value]) => {
        setTildaField(nativeForm, name, value);
      });

      setTildaField(nativeForm, CLIENT_ID_FIELD, clientId);
      UTM_FIELDS.forEach((key) => setTildaField(nativeForm, key, utm[key] || ""));

      relaxTildaValidation(nativeForm);

      const answer = waitForTilda(nativeForm);

      // Кнопку Тильды можно спрятать через display:none — на отправку это никак
      // не влияет. А вот выключенную (disabled) в качестве отправителя брать
      // нельзя, поэтому в таком случае отправляем форму без указания кнопки
      const nativeSubmit = nativeForm.querySelector(
        'button[type="submit"]:not(:disabled), input[type="submit"]:not(:disabled)'
      );
      if (nativeSubmit instanceof HTMLElement) nativeForm.requestSubmit(nativeSubmit);
      else nativeForm.requestSubmit();

      return answer;
    };

    /* --- Шаг 3: передаём нажатие виджету ---------------------------------- */

    const handoff = (button) => {
      setStatus("Переносим вас в мессенджер…", "loading");

      passThrough = true;
      button.click();
      passThrough = false;

      // Обычно страница закрывается прямо здесь. Если через несколько секунд
      // мы всё ещё тут — переход не сработал: пробуем уйти по прямой ссылке,
      // а заодно показываем её человеку, чтобы он не завис
      window.setTimeout(() => {
        const link = button.dataset.href || "";
        showManual(link);
        if (link) window.location.href = link;
      }, HANDOFF_TIMEOUT_MS);
    };

    /* --- Шаг 1: перехват нажатия ------------------------------------------ */

    const onClick = async (event) => {
      const button = event.target instanceof Element
        ? event.target.closest(".bh-w-messenger-button")
        : null;

      if (!button || !mount.contains(button)) return;
      if (passThrough) return; // это мы сами нажали — пропускаем к BotHelp

      // Останавливаем нажатие до того, как его увидит BotHelp
      event.preventDefault();
      event.stopImmediatePropagation();

      if (busy) return;

      if (!bothelp.consentGiven()) {
        setStatus("Поставьте галочку согласия, чтобы продолжить", "error");
        return;
      }

      busy = true;
      block.dataset.state = "sending";
      if (manualBlock) manualBlock.hidden = true;
      setStatus("Секунду, записываем вас…", "loading");

      try {
        const result = await sendToTilda();
        if (result === "error") {
          console.warn("[запись] Тильда не приняла заявку — уводим в мессенджер без неё.");
        }
        if (result === "timeout") {
          console.warn("[запись] Тильда не ответила вовремя — уводим в мессенджер без неё.");
        }
      } catch (error) {
        console.error("[запись] Не получилось отправить заявку в Тильду.", error);
      }

      // Что бы ни случилось с Тильдой, подписку на бота не срываем:
      // без неё человек не получит ссылку на эфир
      block.dataset.state = "idle";
      handoff(button);
    };

    // Слушаем на document в фазе погружения: так мы гарантированно раньше
    // любого обработчика внутри виджета
    document.addEventListener("click", onClick, true);

    /* --- Старт ------------------------------------------------------------ */

    if (formName) {
      hideTildaForm(formName);

      // Тильда дорисовывает свои блоки позже — прячем форму снова, когда появится
      new MutationObserver(() => hideTildaForm(formName))
        .observe(document.body, { childList: true, subtree: true });
    }
  });
})();
