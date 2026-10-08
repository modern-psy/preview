/* ============================================================================
   ПОВЕДЕНИЕ СТРАНИЦЫ «БИЗНЕС-ИГРА ДЛЯ ПСИХОЛОГОВ»
   ============================================================================

   Разделы 0–5 перенесены с /cft-spiderman без изменений логики:
     1) аккордеон (на этой странице его нет — код просто ничего не находит);
     1.5) меню в шапке на узких экранах;
     2–5) запись: кнопки виджета BotHelp → скрытая форма Тильды → мессенджер.

   ГЛАВНОЕ ПРО ЗАПИСЬ
   Полей и своих кнопок на странице нет. Человек видит только кнопки
   мессенджеров, которые рисует виджет BotHelp, и нажимает одну из них.
   По нажатию скрипт:
     1) перехватывает нажатие, пока его не увидел BotHelp;
     2) кладёт ClientID Метрики и UTM-метки в скрытую форму Тильды
        и отправляет её — дальше данные уходят в AmoCRM;
     3) как только Тильда ответила, возвращает нажатие виджету.
   Если Тильда не ответила, всё равно уводим в мессенджер: без подписки
   на бота человек не получит ссылку на игру.

   Разделы 6–8 — только этой страницы: появление клеток, курсоры
   участников, ходы фишки и кошелёк. Их описание — ниже, перед кодом.
   ========================================================================== */

(() => {
  "use strict";

  const page = document.querySelector(".game-page");
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
    Name: "Заявка с лендинга «Бизнес-игра для психологов»",
  };

  // Метки живут в адресе только на первом шаге. Запоминаем их на время визита,
  // чтобы они не потерялись, если человек ушёл по ссылке и вернулся назад.
  const UTM_STORAGE_KEY = "biznes-igra-utm";

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
    record.setAttribute("data-game-native-form-record", "");

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
      input.setAttribute("data-game-added-field", "");
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
        window.jQuery(document).off(".gameSignup");
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
      window.jQuery(document).on("tildaform:aftersuccess.gameSignup", onSuccess);
      window.jQuery(document).on("tildaform:aftererror.gameSignup", onError);
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
     5. ЗАПИСЬ НА ИГРУ
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


/* ============================================================================
   6–8. ИГРОВОЕ ПОЛЕ: ПОЯВЛЕНИЕ КЛЕТОК, КУРСОРЫ УЧАСТНИКОВ, ХОДЫ ФИШКИ
   ============================================================================

   6. Появление. Клетки с атрибутом data-reveal поднимаются снизу, когда
      доходят до экрана. Без скрипта всё видно сразу.

   7. Курсоры. Пять игроков с ролями и ведущая летают по странице.
      У каждого блока в атрибуте data-cursor записано, где курсорам стоять:
        data-cursor="analyst 0.17 0.13; keeper 0.67 0.14"
      роль, доля ширины и доля высоты блока (0 — левый/верхний край,
      1 — правый/нижний). На телефоне и планшете действует
      data-cursor-compact, если он есть. Атрибут data-cursor-spot ставит
      курсор относительно самого элемента — так «Вы» держит фишку.
      В блоке без мест курсоры гаснут. Когда блок сменился, курсор плавно
      перелетает к новому месту; если лететь далеко — гаснет и появляется
      уже рядом.

   8. Ходы фишки. В блоке «Как пройдёт игра» активный этап — тот, что
      пересекает середину экрана. Фишка прыгает на его клетку, кошелёк
      показывает число из data-wallet-* этапа, а в стопке остаётся столько
      монет, сколько указано в data-wallet-coins: лишние монеты с верха
      стопки улетают на клетку этапа. При прокрутке назад монеты
      возвращаются в стопку.

   При «уменьшить движение» в настройках системы курсоры стоят на местах
   без полёта и покачивания, фишка переставляется без прыжка.
   ========================================================================== */

(() => {
  "use strict";

  const page = document.querySelector(".game-page");
  if (!page || page.dataset.gameMotion === "ready") return;
  page.dataset.gameMotion = "ready";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compactLayout = window.matchMedia("(max-width: 64rem)");
  const prefersMotion = () => !reducedMotion.matches;

  /* --------------------------------------------------------------------------
     6. ПОЯВЛЕНИЕ КЛЕТОК
     -------------------------------------------------------------------------- */

  const revealItems = [...page.querySelectorAll("[data-reveal]")];

  if (revealItems.length > 0 && "IntersectionObserver" in window && prefersMotion()) {
    page.classList.add("has-motion");

    // Соседние клетки встают по очереди, с шагом 90 мс
    revealItems.forEach((item) => {
      const siblings = [...item.parentElement.children].filter((el) => el.hasAttribute("data-reveal"));
      const index = Math.min(siblings.indexOf(item), 4);
      item.style.setProperty("--reveal-delay", `${index * 90}ms`);
    });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else if (prefersMotion()) {
    page.classList.add("has-motion");
    revealItems.forEach((item) => item.classList.add("is-in"));
  }


  /* --------------------------------------------------------------------------
     7. КУРСОРЫ УЧАСТНИКОВ
     -------------------------------------------------------------------------- */

  const layer = page.querySelector("[data-cursors]");

  const parseSpots = (value) =>
    String(value || "")
      .split(";")
      .map((chunk) => chunk.trim().split(/\s+/))
      .filter((parts) => parts.length === 3)
      .map(([role, fx, fy]) => ({ role, fx: Number(fx), fy: Number(fy) }));

  if (layer) {
    const cursors = [...layer.querySelectorAll("[data-cursor-role]")].map((el, index) => ({
      el,
      role: el.dataset.cursorRole,
      x: -200,
      y: -200,
      visible: false,
      teleportAt: 0,
      seed: index * 1.7,
      nextPress: 0,
    }));

    // Блоки страницы: в каждом свой набор мест для курсоров
    const sections = [...page.querySelectorAll("main > section, footer")];

    const spotsIn = (section) => {
      const compact = compactLayout.matches;
      const result = [];

      section.querySelectorAll("[data-cursor]").forEach((host) => {
        const value = compact && host.hasAttribute("data-cursor-compact")
          ? host.dataset.cursorCompact
          : host.dataset.cursor;
        parseSpots(value).forEach((spot) => result.push({ ...spot, host }));
      });

      section.querySelectorAll("[data-cursor-spot]").forEach((host) => {
        const value = compact && host.hasAttribute("data-cursor-spot-compact")
          ? host.dataset.cursorSpotCompact
          : host.dataset.cursorSpot;
        parseSpots(value).forEach((spot) => result.push({ ...spot, host }));
      });

      return result;
    };

    // Активный блок — тот, что пересекает середину экрана
    const activeSection = () => {
      const middle = window.innerHeight * 0.5;
      return sections.find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= middle && rect.bottom >= middle;
      }) || null;
    };

    let lastScrollY = window.scrollY;
    let frame = 0;
    let lastTime = 0;
    let idleSince = 0;

    const show = (cursor, isVisible) => {
      if (cursor.visible === isVisible) return;
      cursor.visible = isVisible;
      cursor.el.classList.toggle("is-visible", isVisible);
    };

    const press = (cursor) => {
      if (!cursor.visible || !prefersMotion()) return;
      cursor.el.classList.add("is-pressing");
      window.setTimeout(() => cursor.el.classList.remove("is-pressing"), 180);
    };

    const tick = (time) => {
      frame = 0;
      const dt = lastTime ? Math.min(time - lastTime, 64) : 16;
      lastTime = time;

      // Содержимое страницы уехало при прокрутке — курсоры едут вместе с ним
      const scrollDelta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;

      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight;
      const section = activeSection();
      const spots = section ? spotsIn(section) : [];
      const motion = prefersMotion();
      const ease = motion ? 1 - Math.pow(1 - 0.1, dt / 16.7) : 1;
      let anyVisible = false;

      cursors.forEach((cursor) => {
        cursor.y -= scrollDelta;

        const spot = spots.find((item) => item.role === cursor.role);
        const rect = spot?.host.getBoundingClientRect();
        const hostVisible = rect && rect.width > 0 && rect.height > 0;
        const targetX = hostVisible ? rect.left + rect.width * spot.fx : null;
        const targetY = hostVisible ? rect.top + rect.height * spot.fy : null;
        const onScreen = hostVisible && targetY > 8 && targetY < viewportHeight - 28;

        if (!onScreen) {
          show(cursor, false);
          return;
        }

        // Первый выход или далёкий перелёт: гаснем и появляемся рядом с местом
        const distance = Math.hypot(targetX - cursor.x, targetY - cursor.y);
        if (!cursor.visible && !cursor.teleportAt) {
          cursor.x = targetX - 36;
          cursor.y = targetY + 44;
        } else if (cursor.visible && distance > viewportHeight * 0.75) {
          show(cursor, false);
          cursor.teleportAt = time + 320;
        }

        if (cursor.teleportAt) {
          if (time < cursor.teleportAt) {
            anyVisible = true;
            return;
          }
          cursor.teleportAt = 0;
          cursor.x = targetX - 36;
          cursor.y = targetY + 44;
        }

        cursor.x += (targetX - cursor.x) * ease;
        cursor.y += (targetY - cursor.y) * ease;
        show(cursor, true);
        anyVisible = true;

        // Лёгкое покачивание, как у живой руки на мышке
        const wobbleX = motion ? Math.sin(time / 1700 + cursor.seed) * 5 : 0;
        const wobbleY = motion ? Math.cos(time / 2300 + cursor.seed * 1.3) * 4 : 0;
        const width = cursor.el.offsetWidth || 120;
        const x = Math.max(4, Math.min(cursor.x + wobbleX, viewportWidth - width - 6));
        const y = cursor.y + wobbleY;
        cursor.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;

        // Время от времени игрок «кликает»
        if (motion && distance < 4) {
          if (!cursor.nextPress) cursor.nextPress = time + 2500 + Math.random() * 5000;
          if (time > cursor.nextPress) {
            press(cursor);
            cursor.nextPress = time + 4000 + Math.random() * 6000;
          }
        }
      });

      // Если на экране никого нет больше секунды — засыпаем до прокрутки
      if (anyVisible) idleSince = 0;
      else if (!idleSince) idleSince = time;

      if (anyVisible || time - idleSince < 1000) schedule();
    };

    const schedule = () => {
      if (frame || document.hidden) return;
      frame = window.requestAnimationFrame(tick);
    };

    const wake = () => {
      idleSince = 0;
      schedule();
    };

    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    document.addEventListener("visibilitychange", () => {
      lastTime = 0;
      lastScrollY = window.scrollY;
      wake();
    });
    compactLayout.addEventListener?.("change", wake);

    // «Аналитик» нажимает на фишку перед каждым её прыжком на первом экране
    const heroPawn = page.querySelector(".board_pawn");
    const analyst = cursors.find((cursor) => cursor.role === "analyst");
    if (heroPawn && analyst) {
      const syncPress = () => window.setTimeout(() => press(analyst), 5500);
      heroPawn.addEventListener("animationstart", syncPress);
      heroPawn.addEventListener("animationiteration", syncPress);
    }

    wake();
  }


  /* --------------------------------------------------------------------------
     8. ХОДЫ ФИШКИ И КОШЕЛЁК
     -------------------------------------------------------------------------- */

  const route = page.querySelector("[data-route]");

  if (route) {
    const steps = [...route.querySelectorAll("[data-route-step]")];
    const tiles = new Map(
      [...route.querySelectorAll("[data-route-tile]")].map((tile) => [Number(tile.dataset.routeTile), tile])
    );
    const tilesBox = route.querySelector("[data-route-tiles]");
    const pawn = route.querySelector("[data-route-pawn]");
    const walletValue = route.querySelector("[data-wallet-value]");
    const walletLabel = route.querySelector("[data-wallet-label]");
    const walletNote = route.querySelector("[data-wallet-note]");
    const stackCoins = [...route.querySelectorAll(".route_stack-coin")];

    let active = 0;
    let pawnPoint = null;
    let counter = 0;
    let coinsShown = stackCoins.length;

    // Точка на клетке, куда встаёт фишка: правый верхний угол.
    // У SVG нет offsetWidth, поэтому размер фишки берём из getBoundingClientRect
    const pointFor = (number) => {
      const tile = tiles.get(number);
      if (!tile || !pawn) return null;
      const size = pawn.getBoundingClientRect();
      return {
        x: tile.offsetLeft + tile.offsetWidth - size.width * 0.95,
        y: tile.offsetTop - size.height * 0.5,
      };
    };

    const placePawn = (number, animate) => {
      const point = pointFor(number);
      if (!point) return;

      const to = `${point.x.toFixed(1)}px ${point.y.toFixed(1)}px`;

      if (animate && pawnPoint && prefersMotion() && typeof pawn.animate === "function") {
        const from = `${pawnPoint.x.toFixed(1)}px ${pawnPoint.y.toFixed(1)}px`;
        const lift = Math.min(pawnPoint.y, point.y) - pawn.getBoundingClientRect().height * 0.6;
        const middle = `${((pawnPoint.x + point.x) / 2).toFixed(1)}px ${lift.toFixed(1)}px`;
        pawn.animate(
          [{ translate: from }, { translate: middle, offset: 0.45 }, { translate: to }],
          { duration: 560, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
      }

      pawn.style.translate = to;
      pawnPoint = point;
    };

    // Число в кошельке плавно пересчитывается
    const countTo = (from, to) => {
      window.cancelAnimationFrame(counter);
      if (!prefersMotion()) {
        walletValue.textContent = String(to);
        return;
      }
      const start = performance.now();
      const run = (now) => {
        const progress = Math.min((now - start) / 600, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        walletValue.textContent = String(Math.round(from + (to - from) * eased));
        if (progress < 1) counter = window.requestAnimationFrame(run);
      };
      counter = window.requestAnimationFrame(run);
    };

    // Монеты с верха стопки летят дугой на клетку этапа. Летят копии,
    // а сами монеты в стопке в этот же момент прячутся. Копии живут внутри
    // прилипающего поля и уезжают вместе с ним, если страницу быстро
    // проматывают (например, переход по ссылке из меню).
    const board = route.querySelector(".route_board");

    const flyFromStack = (coins, number) => {
      const tile = tiles.get(number);
      if (!tile || !board || !prefersMotion()) return;

      const boardRect = board.getBoundingClientRect();
      const to = tile.getBoundingClientRect();
      // Поле не на экране — лететь некому смотреть
      if (to.width === 0 || to.bottom < 0 || to.top > window.innerHeight) return;

      coins.forEach((source, index) => {
        const from = source.getBoundingClientRect();
        if (from.width === 0 || typeof source.animate !== "function") return;

        const coin = source.cloneNode(true);
        coin.removeAttribute("style");
        coin.setAttribute("class", "route_flying-coin");
        coin.setAttribute("aria-hidden", "true");
        coin.style.width = `${from.width}px`;
        board.appendChild(coin);

        // Координаты считаем от левого верхнего угла поля
        const startX = from.left - boardRect.left;
        const startY = from.top - boardRect.top;
        const endX = to.left - boardRect.left + to.width * (0.3 + (index % 3) * 0.2) - from.width / 2;
        const endY = to.top - boardRect.top + to.height * 0.35;
        const peakX = (startX + endX) / 2;
        const peakY = Math.min(startY, endY) - 70 - index * 14;

        const animation = coin.animate(
          [
            { transform: `translate(${startX}px, ${startY}px) rotate(0deg)`, opacity: 1 },
            { transform: `translate(${peakX}px, ${peakY}px) rotate(-14deg)`, opacity: 1, offset: 0.5 },
            { transform: `translate(${endX}px, ${endY}px) rotate(0deg) scale(0.55)`, opacity: 0 },
          ],
          { duration: 820, delay: index * 120, easing: "cubic-bezier(0.33, 0, 0.2, 1)", fill: "both" }
        );
        animation.addEventListener("finish", () => coin.remove(), { once: true });
        animation.addEventListener("cancel", () => coin.remove(), { once: true });
      });
    };

    // Сколько монет видно в стопке
    const setStack = (count, number, animate) => {
      const target = Math.max(0, Math.min(stackCoins.length, Number.isFinite(count) ? count : coinsShown));
      if (target === coinsShown) return;

      if (target < coinsShown) {
        // Уходят верхние монеты: сначала самая верхняя
        const leaving = stackCoins.slice(target, coinsShown).reverse();
        if (animate) flyFromStack(leaving, number);
        leaving.forEach((coin) => coin.classList.add("is-gone", "is-instant"));
      } else {
        // Монеты возвращаются и мягко падают на стопку снизу вверх
        stackCoins.slice(coinsShown, target).forEach((coin, index) => {
          coin.classList.remove("is-instant");
          coin.style.transitionDelay = `${index * 80}ms`;
          coin.getBoundingClientRect();
          coin.classList.remove("is-gone");
        });
      }

      coinsShown = target;
    };

    const setActive = (number, animate = true) => {
      if (number === active) return;
      const previous = active;
      active = number;

      steps.forEach((step) => {
        const stepNumber = Number(step.dataset.routeStep);
        step.dataset.state = stepNumber < number ? "passed" : stepNumber === number ? "active" : "upcoming";
      });
      tiles.forEach((tile, tileNumber) => {
        tile.dataset.state = tileNumber < number ? "passed" : tileNumber === number ? "active" : "upcoming";
      });

      placePawn(number, animate);

      const step = steps.find((item) => Number(item.dataset.routeStep) === number);
      if (!step || !walletValue) return;

      const oldValue = Number(walletValue.textContent);
      const newRaw = step.dataset.walletValue || "";
      const newValue = Number(newRaw);

      if (Number.isFinite(oldValue) && Number.isFinite(newValue) && newRaw !== "") {
        countTo(oldValue, newValue);
      } else {
        walletValue.textContent = newRaw;
      }

      if (walletLabel) walletLabel.textContent = step.dataset.walletLabel || "";
      if (walletNote) walletNote.textContent = step.dataset.walletNote || "";

      // Монеты улетают, только когда идём вперёд по этапам
      setStack(Number(step.dataset.walletCoins), number, animate && number > previous && previous > 0);
    };

    // Этап, который пересекает середину экрана, становится активным
    if ("IntersectionObserver" in window) {
      const stepObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(Number(entry.target.dataset.routeStep));
        });
      }, { rootMargin: "-50% 0px -50% 0px", threshold: 0 });

      steps.forEach((step) => stepObserver.observe(step));
    }

    // Клетки меняют размер — фишка остаётся на своей клетке
    if ("ResizeObserver" in window && tilesBox) {
      new ResizeObserver(() => {
        if (active) {
          pawnPoint = null;
          placePawn(active, false);
        }
      }).observe(tilesBox);
    }

    setActive(1, false);
  }
})();
