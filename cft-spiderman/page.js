/* ============================================================================
   ПОВЕДЕНИЕ СТРАНИЦЫ «ЛОВУШКА СВЕРХОТВЕТСТВЕННОСТИ» (копия /cft-intro)
   ============================================================================

   Скрипт делает три вещи:
     1) плавно раскрывает вопросы в блоке «Ответы на популярные вопросы».
        Без скрипта аккордеон тоже работает — просто без анимации:
        это обычный тег <details>;
     2) открывает и закрывает меню в шапке на узких экранах;
     3) записывает на вебинар: через виджет BotHelp, а если он не поднялся —
        через запасную лид-форму.

   ЗАПИСЬ НА ВЕБИНАР
   Вынесена в отдельный блок «ЗАПИСЬ НА ВЕБИНАР: BOTHELP + ЗАПАСНАЯ ФОРМА»
   сразу после первого блока этого файла. Он одинаковый на всех лендингах
   вебинаров с BotHelp, как всё устроено — написано в его шапке.

   ПОРЯДОК РАЗДЕЛОВ
     0. Общее
     1. Аккордеон
     1.5. Меню в шапке
     2–5. Запись на вебинар: BotHelp и запасная форма (отдельный блок)
     6. Петля стрелок в блоке «Когда ответственность…»
     7. Точечная графика: ночной город в первом экране, паутина во втором
        блоке, полоса города в карточке «Практический разбор» и живое поле
        точек в карточке цикла
     8. Схема «Что разберем на встрече»: появление и наведение
   ========================================================================== */

(() => {
  "use strict";

  const page = document.querySelector(".cft-page");
  if (!page) return;

  /* --------------------------------------------------------------------------
     0. ОБЩЕЕ
     -------------------------------------------------------------------------- */

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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
})();


/* ============================================================================
   ЗАПИСЬ НА ВЕБИНАР: BOTHELP + ЗАПАСНАЯ ФОРМА
   ============================================================================
   🔴 Этот блок одинаковый на всех лендингах вебинаров с BotHelp. Если правите
      его на одной странице — перенесите правку и на остальные (найти их можно
      по этому заголовку). Всё, что отличается от страницы к странице, лежит
      в разметке блока записи: data-tilda-form-name, data-signup-source.

   КАК ЭТО РАБОТАЕТ
   При каждой загрузке страницы скрипт ждёт кнопки виджета BotHelp.

   1) BotHelp поднялся — всё как раньше. Полей на странице нет, человек
      нажимает кнопку мессенджера. Скрипт перехватывает нажатие, отправляет
      скрытую форму Тильды (пустые поля + служебные: ClientID Метрики, UTM-метки
      и подпись для отдела продаж), а потом возвращает нажатие виджету —
      и человек уходит подписываться на бота.

   2) BotHelp не поднялся — вместо кнопок появляется обычная лид-форма:
      имя, телефон, мессенджер, галочка согласия. Заявка уходит в ту же
      скрытую форму Тильды, но уже с заполненными полями и пометкой
      «запасная форма»: ссылку на эфир такому человеку отдел продаж
      отправляет вручную.

   КОГДА СЧИТАЕМ, ЧТО BOTHELP НЕ ПОДНЯЛСЯ
     · скрипт BotHelp вообще не загрузился (сервер не ответил, блокировщик
       рекламы, блок с виджетом убрали со страницы) — форма появляется сразу;
     · скрипт загрузился, но кнопки не пришли за 10 секунд после загрузки
       страницы. «Загрузка страницы» — событие load, но дольше 5 секунд его
       не ждём: его может задерживать тот же BotHelp или тяжёлая картинка.
   Если кнопки пришли позже, чем появилась форма, форму не убираем:
   человек мог уже начать её заполнять.

   ПРОВЕРИТЬ ЗАПАСНУЮ ФОРМУ, КОГДА BOTHELP РАБОТАЕТ
   Добавьте к адресу страницы ?signup=form — форма покажется сразу.

   ПОРЯДОК ПОДРАЗДЕЛОВ
     А. Настройки
     Б. Служебные значения: ClientID Метрики и UTM-метки
     В. Скрытая форма Тильды
     Г. Ждём виджет BotHelp
     Д. Запись через BotHelp
     Е. Запасная форма
     Ж. Запуск
   ========================================================================== */

(() => {
  "use strict";

  const blocks = [...document.querySelectorAll("[data-signup]")];
  if (blocks.length === 0) return;

  /* --------------------------------------------------------------------------
     А. НАСТРОЙКИ
     -------------------------------------------------------------------------- */

  // Сколько ждём кнопки BotHelp после загрузки страницы
  const BOTHELP_WAIT_MS = 10000;

  // Сколько ждём события «страница загрузилась», прежде чем начать отсчёт
  // сами. Событие может задерживаться из-за картинок или самого BotHelp
  const PAGE_LOAD_WAIT_MS = 5000;

  // Сколько ждём, что BotHelp уведёт человека в мессенджер. Если не увёл —
  // показываем прямую ссылку на бота
  const HANDOFF_TIMEOUT_MS = 6000;

  // Сколько ждём ответа Тильды при записи через BotHelp. Не дождались —
  // всё равно уводим в бота: без подписки человек не получит ссылку на эфир
  const TILDA_TIMEOUT_MS = 5000;

  // Сколько ждём ответа Тильды в запасной форме. Здесь Тильда — единственный
  // канал, поэтому ждём дольше
  const FALLBACK_TILDA_TIMEOUT_MS = 10000;

  // Сколько ждём ответа Метрики. Не дождались — берём номер из куки
  const METRIKA_TIMEOUT_MS = 1500;

  // На боевом домене скрытая форма Тильды обязана быть на странице.
  // На превью её нет, поэтому шаг с Тильдой пропускается — иначе страницу
  // нельзя было бы проверить.
  const IS_PRODUCTION = /(^|\.)modern-psy\.ru$/.test(window.location.hostname);

  // Проверка запасной формы: ?signup=form в адресе страницы
  const FORCE_FALLBACK = new URLSearchParams(window.location.search).get("signup") === "form";

  // 🟡 КАК ПОЛЯ НАЗЫВАЮТСЯ В ФОРМЕ ТИЛЬДЫ.
  // Имена должны совпадать с настройками формы буква в букву. Если поля
  // с таким именем в форме нет, скрипт добавит его сам скрытым полем.
  const FIELDS = {
    name: "Name",
    phone: "Phone",
    messenger: "messenger",
    contact: "messenger_contact",
    consent: "personal_data_consent",
    source: "form_source",
    clientId: "ym_client_id",
  };

  const UTM_FIELDS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ];

  // 🟢 ПОДПИСИ ДЛЯ ОТДЕЛА ПРОДАЖ.
  // Дописываются к названию лендинга (data-signup-source) в поле form_source:
  // по ним в CRM видно, как человек записался.
  const SOURCE_NOTES = {
    bot: "запись через бота BotHelp",
    form: "запасная форма: BotHelp не загрузился, ссылку на эфир отправить вручную",
  };

  // 🟢 Как мессенджеры называются в заявке и в тексте после отправки
  const MESSENGER_NAMES = {
    max: "MAX",
    telegram: "Telegram",
  };


  /* --------------------------------------------------------------------------
     Б. СЛУЖЕБНЫЕ ЗНАЧЕНИЯ: ClientID МЕТРИКИ И UTM-МЕТКИ
     --------------------------------------------------------------------------
     Скрипт собирает их сам: из адреса страницы и из счётчика Метрики.
     -------------------------------------------------------------------------- */

  // Метки живут в адресе только на первом шаге. Запоминаем их на время визита,
  // чтобы они не потерялись, если человек ушёл по ссылке и вернулся назад
  const utmStorageKey = (formName) => `signup-utm:${formName || "page"}`;

  const readStoredUtm = (key) => {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(key) || "{}");
      return saved && typeof saved === "object" ? saved : {};
    } catch (error) {
      return {};
    }
  };

  const collectUtm = (formName) => {
    const key = utmStorageKey(formName);
    const params = new URLSearchParams(window.location.search);
    const fromUrl = {};

    UTM_FIELDS.forEach((name) => {
      const value = (params.get(name) || "").trim();
      if (value) fromUrl[name] = value;
    });

    const result = { ...readStoredUtm(key), ...fromUrl };

    if (Object.keys(fromUrl).length > 0) {
      try {
        window.sessionStorage.setItem(key, JSON.stringify(result));
      } catch (error) {
        // Приватный режим браузера — просто работаем без запоминания
      }
    }

    return result;
  };

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
     В. СКРЫТАЯ ФОРМА ТИЛЬДЫ
     --------------------------------------------------------------------------
     Тильда рисует свою форму где-то на странице. Мы её не удаляем — она и есть
     наш канал в AmoCRM, — а убираем с глаз и отправляем из скрипта.
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
    record.setAttribute("data-signup-native-form-record", "");

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
      input.setAttribute("data-signup-added-field", "");
      nativeForm.appendChild(input);
    }

    setNativeValue(input, value);
  };

  // Если в форме Тильды есть поле телефона с маской, заполняем его через саму
  // Тильду — иначе при отправке она пересчитает номер из пустой маски
  const setTildaPhone = (nativeForm, phone) => {
    const group = nativeForm.querySelector(".t-input-group_ph");

    if (group && typeof window.t_form_phonemask__setValue === "function") {
      try {
        window.t_form_phonemask__setValue(group, phone, undefined, { noFocus: true });
      } catch (error) {
        console.warn("[запись] Тильда не приняла номер в поле с маской.", error);
      }
    }

    setTildaField(nativeForm, FIELDS.phone, phone);
  };

  // В форме Тильды поля могут остаться обязательными — тогда её же проверка
  // не пустит заявку. Снимаем обязательность только с пустых полей: если
  // в форме настроено поле со значением, мы его не трогаем.
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

  const eventForm = (event, passedForm) =>
    passedForm instanceof HTMLFormElement ? passedForm
      : event?.detail?.form instanceof HTMLFormElement ? event.detail.form
      : event?.target instanceof HTMLFormElement ? event.target
      : null;

  // Ответ приходит событием, а не из requestSubmit, поэтому ждём его отдельно.
  // Возвращаем "success" | "error" | "timeout" — но в любом случае возвращаем:
  // застрять на странице человек не должен
  let waitCounter = 0;

  const waitForTilda = (nativeForm, timeoutMs) => new Promise((resolve) => {
    const namespace = `.signup${++waitCounter}`;
    let done = false;
    let timer = 0;

    const finish = (result) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      document.removeEventListener("tildaform:aftersuccess", onSuccess);
      document.removeEventListener("tildaform:aftererror", onError);
      if (typeof window.jQuery === "function") {
        window.jQuery(document).off(namespace);
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
      window.jQuery(document).on(`tildaform:aftersuccess${namespace}`, onSuccess);
      window.jQuery(document).on(`tildaform:aftererror${namespace}`, onError);
    }

    timer = window.setTimeout(() => finish("timeout"), timeoutMs);
  });

  // Заполняет скрытую форму и отправляет её.
  // Возвращает "success" | "error" | "timeout" | "skipped" (формы нет)
  const sendToTilda = async (block, values, timeoutMs) => {
    const formName = block.dataset.tildaFormName || "";
    const nativeForm = hideTildaForm(formName);

    if (!(nativeForm instanceof HTMLFormElement)) {
      const message = `[запись] Формы Тильды «${formName}» на странице нет — заявка не отправлена.`;
      if (IS_PRODUCTION) console.error(message);
      else console.info(`${message} Это превью, так и должно быть.`, values);
      return "skipped";
    }

    const utm = collectUtm(formName);
    const clientId = await readClientId(block);

    // Сначала содержательные поля, потом служебные. Порядок важен:
    // заполненное «Имя» проходит проверку Тильды само, и снимать
    // с него обязательность уже не придётся
    Object.entries(values).forEach(([name, value]) => {
      if (name === FIELDS.phone) setTildaPhone(nativeForm, value);
      else setTildaField(nativeForm, name, value);
    });

    setTildaField(nativeForm, FIELDS.clientId, clientId);
    UTM_FIELDS.forEach((name) => setTildaField(nativeForm, name, utm[name] || ""));

    relaxTildaValidation(nativeForm);

    const answer = waitForTilda(nativeForm, timeoutMs);

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


  /* --------------------------------------------------------------------------
     Г. ЖДЁМ ВИДЖЕТ BOTHELP
     --------------------------------------------------------------------------
     Виджет подгружает свои кнопки не сразу. Пока ждём — на их месте стоит
     серый скелет. Итог один из двух: «ready» (кнопки пришли) или «failed»
     (не придут). Решение принимается один раз за загрузку страницы.
     -------------------------------------------------------------------------- */

  // Событие «страница загрузилась», но не дольше PAGE_LOAD_WAIT_MS
  const pageLoaded = new Promise((resolve) => {
    if (document.readyState === "complete") {
      resolve();
      return;
    }
    window.addEventListener("load", () => resolve(), { once: true });
    window.setTimeout(resolve, PAGE_LOAD_WAIT_MS);
  });

  // Выполнить после того, как отработали все обработчики DOMContentLoaded.
  // Скрипт BotHelp создаёт window.BhWidgets именно там
  const afterDomReady = (callback) => {
    const navigation = performance.getEntriesByType?.("navigation")?.[0];
    const alreadyFired = navigation
      ? navigation.domContentLoadedEventStart > 0
      : document.readyState === "complete";

    if (alreadyFired) {
      window.setTimeout(callback, 0);
    } else {
      document.addEventListener("DOMContentLoaded", () => window.setTimeout(callback, 0), { once: true });
    }
  };

  const watchBotHelp = (mount, onResult) => {
    let settled = false;
    let timer = 0;
    let observer = null;

    const hasButtons = () => mount.querySelector(".bh-w-messenger-button") !== null;

    const settle = (result, reason) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      observer?.disconnect();
      onResult(result, reason);
    };

    if (FORCE_FALLBACK) {
      settle("failed", "проверка запасной формы (?signup=form)");
      return;
    }

    if (hasButtons()) {
      settle("ready");
      return;
    }

    observer = new MutationObserver(() => {
      if (hasButtons()) settle("ready");
    });
    observer.observe(mount, { childList: true, subtree: true });

    // Скрипт BotHelp не выполнился вовсе — кнопок не будет, ждать нечего
    afterDomReady(() => {
      if (!window.BhWidgets) settle("failed", "скрипт BotHelp не загрузился");
    });

    pageLoaded.then(() => {
      if (settled) return;
      timer = window.setTimeout(
        () => settle("failed", `кнопки BotHelp не пришли за ${BOTHELP_WAIT_MS / 1000} с после загрузки страницы`),
        BOTHELP_WAIT_MS
      );
    });
  };


  /* --------------------------------------------------------------------------
     Д. ЗАПИСЬ ЧЕРЕЗ BOTHELP
     --------------------------------------------------------------------------
     Своих кнопок в блоке нет — есть только кнопки мессенджеров от BotHelp.
     По нажатию на любую из них:
       1) перехватываем нажатие в фазе погружения, чтобы обработчик BotHelp
          не успел сработать. Иначе он тут же уводит со страницы
          (location.href), и заявка в Тильду не успевает уйти;
       2) отправляем скрытую форму Тильды со служебными полями;
       3) возвращаем нажатие виджету — и человек уходит в мессенджер.
     -------------------------------------------------------------------------- */

  const setupBotSignup = (block, ui) => {
    const { mount, setStatus } = ui;
    const manualBlock = block.querySelector("[data-lead-manual]");
    const manualLink = block.querySelector("[data-lead-manual-link]");
    const source = block.dataset.signupSource || "";

    let busy = false;
    // Поднимаем на время, когда сами нажимаем кнопку виджета: по этому флагу
    // перехватчик пропускает нажатие дальше, к обработчику BotHelp
    let passThrough = false;

    // Согласие BotHelp проверяет сам и молча не пускает клик.
    // Мы читаем галочку до него, чтобы не отправить заявку впустую
    const consentGiven = () => {
      const items = [...mount.querySelectorAll("[data-consent-checkbox], .bh-w-consent__checkbox")];
      return items.length === 0 || items.every((item) => item.checked);
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

      if (!consentGiven()) {
        setStatus("Поставьте галочку согласия, чтобы продолжить", "error");
        return;
      }

      busy = true;
      block.dataset.state = "sending";
      if (manualBlock) manualBlock.hidden = true;
      setStatus("Секунду, записываем вас…", "loading");

      try {
        // Тильда не заводит сделку, если заполнены одни скрытые поля, поэтому
        // в «Имя» кладём название лендинга — как и раньше
        const result = await sendToTilda(block, {
          [FIELDS.name]: source,
          [FIELDS.source]: `${source} — ${SOURCE_NOTES.bot}`,
        }, TILDA_TIMEOUT_MS);

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
  };


  /* --------------------------------------------------------------------------
     Е. ЗАПАСНАЯ ФОРМА
     --------------------------------------------------------------------------
     Обычная лид-форма: имя, телефон, мессенджер, галочка согласия.
     Своей отправки у неё нет — данные раскладываются по скрытой форме Тильды.
     Для MAX отдельный номер не спрашиваем: пишем на телефон из формы.
     -------------------------------------------------------------------------- */

  // Телефон приводим к виду +79001234567. Российский номер можно ввести
  // как угодно: 8 900…, 900…, +7 (900)…
  const normalizePhone = (value) => {
    const raw = String(value || "").trim();
    const digits = raw.replace(/\D/g, "");

    if (!digits) return "";
    if (raw.startsWith("+")) return `+${digits}`;
    if (digits.startsWith("00")) return `+${digits.slice(2)}`;
    if (digits.length === 11 && digits.startsWith("8")) return `+7${digits.slice(1)}`;
    if (digits.length === 10) return `+7${digits}`;
    return `+${digits}`;
  };

  const isPhoneValid = (phone) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("7")) return digits.length === 11;
    return digits.length >= 10 && digits.length <= 15;
  };

  // Ник в Telegram: принимаем и «@anna», и «anna», и ссылку t.me/anna
  const normalizeTelegram = (value) => {
    let nick = String(value || "").trim().replace(/^(https?:\/\/)?(t|telegram)\.me\//i, "");
    if (nick && !nick.startsWith("@")) nick = `@${nick}`;
    return nick;
  };

  const TELEGRAM_PATTERN = /^@[A-Za-z0-9_]{4,32}$/;

  // 🟢 Тексты ошибок под полями
  const ERRORS = {
    name: "Напишите, как к вам обращаться",
    phone: "Проверьте номер телефона",
    telegram: "Напишите ник в Telegram, например @anna_petrova",
    consent: "Без согласия мы не сможем записать вас на вебинар",
    send: "Не получилось отправить заявку. Проверьте интернет и попробуйте ещё раз.",
  };

  const setupFallback = (block, ui) => {
    const form = block.querySelector("[data-signup-fallback]");
    const success = block.querySelector("[data-signup-success]");
    const successMessenger = block.querySelector("[data-signup-success-messenger]");
    if (!(form instanceof HTMLFormElement)) return null;

    const { setStatus } = ui;
    const source = block.dataset.signupSource || "";
    const nameInput = form.elements.namedItem("name");
    const phoneInput = form.elements.namedItem("phone");
    const telegramInput = form.elements.namedItem("telegram");
    const consentInput = form.elements.namedItem("consent");
    const messengerInputs = [...form.querySelectorAll('input[name="messenger"]')];
    const telegramField = form.querySelector("[data-signup-telegram-field]");
    const maxNote = form.querySelector("[data-signup-max-note]");
    const submit = form.querySelector("[data-signup-submit]");
    const submitLabel = submit?.querySelector("[data-signup-submit-label]");
    const submitText = submitLabel?.textContent || "";
    let busy = false;

    const selectedMessenger = () =>
      messengerInputs.find((input) => input.checked)?.value || "max";

    // Ошибку пишем под полем; у галочки — своя строка под ней
    const setError = (input, message = "") => {
      if (!(input instanceof HTMLInputElement)) return;
      const field = input.closest("[data-signup-field]");
      const error = field?.querySelector("[data-signup-error]");

      input.setAttribute("aria-invalid", String(Boolean(message)));
      if (field) field.dataset.state = message ? "invalid" : "idle";
      if (error) error.textContent = message;
    };

    const checks = {
      name: () => (nameInput.value.trim().length >= 2 ? "" : ERRORS.name),
      phone: () => (isPhoneValid(normalizePhone(phoneInput.value)) ? "" : ERRORS.phone),
      telegram: () =>
        selectedMessenger() !== "telegram" || TELEGRAM_PATTERN.test(normalizeTelegram(telegramInput.value))
          ? ""
          : ERRORS.telegram,
      consent: () => (consentInput.checked ? "" : ERRORS.consent),
    };

    const inputs = { name: nameInput, phone: phoneInput, telegram: telegramInput, consent: consentInput };

    const validate = (key) => {
      const message = checks[key]();
      setError(inputs[key], message);
      return !message;
    };

    // Поле ника видно только при выборе Telegram
    const renderMessenger = () => {
      const isTelegram = selectedMessenger() === "telegram";
      if (telegramField) telegramField.hidden = !isTelegram;
      if (maxNote) maxNote.hidden = isTelegram;
      telegramInput.disabled = !isTelegram;
      if (!isTelegram) setError(telegramInput);
    };

    messengerInputs.forEach((input) => input.addEventListener("change", renderMessenger));
    renderMessenger();

    // Пока человек печатает, ошибку убираем; проверяем, когда он ушёл с поля
    Object.entries(inputs).forEach(([key, input]) => {
      input.addEventListener(input.type === "checkbox" ? "change" : "input", () => {
        if (input.getAttribute("aria-invalid") === "true") validate(key);
        setStatus();
      });
      if (input.type !== "checkbox") {
        input.addEventListener("blur", () => {
          if (input.value.trim()) validate(key);
        });
      }
    });

    const setBusy = (value) => {
      busy = value;
      block.dataset.state = value ? "sending" : "idle";
      if (submit instanceof HTMLButtonElement) {
        submit.disabled = value;
        submit.setAttribute("aria-busy", String(value));
      }
      if (submitLabel) submitLabel.textContent = value ? "Отправляем…" : submitText;
    };

    const showSuccess = (messenger) => {
      if (successMessenger) successMessenger.textContent = MESSENGER_NAMES[messenger] || "мессенджер";
      form.hidden = true;
      setStatus();
      block.dataset.state = "done";
      if (success instanceof HTMLElement) {
        success.hidden = false;
        // Карточка стала короче — без прокрутки сообщение уехало бы за верх экрана
        success.focus();
      }
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (busy) return;

      const results = Object.keys(checks).map((key) => [key, validate(key)]);
      const firstInvalid = results.find(([, ok]) => !ok);
      if (firstInvalid) {
        inputs[firstInvalid[0]].focus();
        return;
      }

      const messenger = selectedMessenger();
      const phone = normalizePhone(phoneInput.value);

      setBusy(true);
      setStatus("Отправляем заявку…", "loading");

      let result = "error";
      try {
        result = await sendToTilda(block, {
          [FIELDS.name]: nameInput.value.trim(),
          [FIELDS.phone]: phone,
          [FIELDS.messenger]: MESSENGER_NAMES[messenger] || messenger,
          [FIELDS.contact]: messenger === "telegram" ? normalizeTelegram(telegramInput.value) : phone,
          [FIELDS.consent]: "да",
          [FIELDS.source]: `${source} — ${SOURCE_NOTES.form}`,
        }, FALLBACK_TILDA_TIMEOUT_MS);
      } catch (error) {
        console.error("[запись] Не получилось отправить заявку в Тильду.", error);
      }

      // На превью формы Тильды нет — показываем экран успеха, чтобы его
      // можно было проверить. На боевом сайте без формы это ошибка
      if (result === "success" || (result === "skipped" && !IS_PRODUCTION)) {
        setBusy(false);
        block.dataset.state = "done";
        showSuccess(messenger);
        return;
      }

      if (result === "timeout") {
        console.warn("[запись] Тильда не ответила вовремя на заявку из запасной формы.");
      }

      setBusy(false);
      setStatus(ERRORS.send, "error");
    });

    return form;
  };


  /* --------------------------------------------------------------------------
     Ж. ЗАПУСК
     -------------------------------------------------------------------------- */

  blocks.forEach((block) => {
    const formName = block.dataset.tildaFormName || "";
    const mount = block.querySelector("[data-bh-mount]");
    const status = block.querySelector("[data-lead-status]");
    if (!mount) return;

    const skeleton = mount.querySelector("[data-bh-skeleton]");
    const errorNote = mount.querySelector("[data-bh-error]");

    const setStatus = (message = "", state = "idle") => {
      if (!status) return;
      status.textContent = message;
      status.dataset.state = state;
    };

    const ui = { mount, setStatus };
    const fallbackForm = block.querySelector("[data-signup-fallback]");

    // Запоминаем метки сразу при загрузке, не дожидаясь нажатия
    collectUtm(formName);

    block.dataset.signupMode = "waiting";

    watchBotHelp(mount, (result, reason) => {
      if (skeleton) skeleton.hidden = true;
      mount.dataset.bhState = result;

      if (result === "ready") {
        block.dataset.signupMode = "bot";
        setupBotSignup(block, ui);
        return;
      }

      // Запасной формы в разметке нет — показываем старую подсказку
      if (!(fallbackForm instanceof HTMLFormElement)) {
        if (errorNote) errorNote.hidden = false;
        console.warn(`[запись] BotHelp не поднялся: ${reason}. Запасной формы на странице нет.`);
        return;
      }

      console.warn(`[запись] BotHelp не поднялся: ${reason}. Показываем запасную форму.`);
      block.dataset.signupMode = "form";
      mount.hidden = true;
      block.querySelectorAll("[data-bh-only]").forEach((element) => { element.hidden = true; });
      setupFallback(block, ui);
      fallbackForm.hidden = false;
    });

    // Тильда дорисовывает свои блоки позже — прячем её форму, когда появится
    if (formName) {
      hideTildaForm(formName);

      const observer = new MutationObserver(() => {
        if (hideTildaForm(formName)) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });
})();



/* ============================================================================
   6. ПЕТЛЯ СТРЕЛОК В БЛОКЕ «КОГДА ОТВЕТСТВЕННОСТЬ НЕ ОСТАВЛЯЕТ ПРАВА НА СЕБЯ»
   ============================================================================
   На планшете и десктопе три карточки стоят треугольником на паутине и
   связаны стрелками: 1 → 2 «сделать больше», 2 → 3 «самокритика»,
   3 → 1 «новая угроза». Высота карточек меняется вместе с шириной экрана,
   поэтому стрелки рисуются от реальных краёв карточек и пересчитываются
   при каждом изменении размера. Подписи встают на середину своей стрелки.
   На телефоне петля скрыта (там цепочка на CSS) — скрипт ничего не делает.
   Повторный запуск безопасен: блок помечается data-trap-ready.
   ========================================================================== */

(() => {
  "use strict";

  document.querySelectorAll('[data-js="trap-loop"]').forEach((diagram) => {
    if (diagram.dataset.trapReady === "true") return;
    diagram.dataset.trapReady = "true";

    const svg = diagram.querySelector(".trap_loop");
    const cards = [1, 2, 3].map((n) => diagram.querySelector(`.trap_card.is-${n}`));
    const steps = [1, 2, 3].map((n) => diagram.querySelector(`.trap_step.is-${n}`));
    const arcs = [1, 2, 3].map((n) => diagram.querySelector(`[data-trap-arc="${n}"]`));
    if (!svg || cards.some((c) => !c) || arcs.some((a) => !a)) return;

    // Зазор между наконечником стрелки и карточкой, в пикселях
    const GAP = 8;

    const box = (el, origin) => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left - origin.left,
        right: r.right - origin.left,
        top: r.top - origin.top,
        bottom: r.bottom - origin.top,
        width: r.width,
        height: r.height,
      };
    };

    const round = (v) => Math.round(v * 10) / 10;

    const draw = () => {
      // Петля видна только там, где карточки стоят треугольником
      if (getComputedStyle(svg).display === "none") {
        steps.forEach((step) => step && step.style.removeProperty("left"));
        steps.forEach((step) => step && step.style.removeProperty("top"));
        return;
      }

      const origin = diagram.getBoundingClientRect();
      if (!origin.width) return;
      const [a, b, c] = cards.map((card) => box(card, origin));

      svg.setAttribute("viewBox", `0 0 ${round(origin.width)} ${round(origin.height)}`);

      // Каждая стрелка — дуга окружности между краями двух карточек.
      // Дуги идут по часовой стрелке и выгибаются наружу от центра паутины,
      // поэтому вместе складываются в круговую петлю.
      const routes = [
        // 1 → 2: из правого края первой карточки к верху второй
        { from: [a.right + GAP, a.top + a.height * 0.55], to: [b.left + b.width * 0.62, b.top - GAP] },
        // 2 → 3: из низа второй карточки к правому краю третьей
        { from: [b.left + b.width * 0.55, b.bottom + GAP], to: [c.right + GAP, c.top + c.height * 0.55] },
        // 3 → 1: из верха третьей карточки к левому краю первой
        { from: [c.left + c.width * 0.25, c.top - GAP], to: [a.left - GAP, a.top + a.height * 0.6] },
      ];

      routes.forEach((route, i) => {
        const [x1, y1] = route.from;
        const [x2, y2] = route.to;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const chord = Math.hypot(dx, dy) || 1;
        // Радиус больше половины хорды — дуга мягкая, без «колена»
        const r = chord * 0.78;
        arcs[i].setAttribute("d", `M${round(x1)} ${round(y1)}A${round(r)} ${round(r)} 0 0 1 ${round(x2)} ${round(y2)}`);

        // Подпись — на вершине дуги: от середины хорды наружу на высоту дуги
        const sagitta = r - Math.sqrt(r * r - (chord / 2) ** 2);
        const nx = -dy / chord;
        const ny = dx / chord;
        if (steps[i]) {
          steps[i].style.left = `${round((x1 + x2) / 2 - nx * sagitta)}px`;
          steps[i].style.top = `${round((y1 + y2) / 2 - ny * sagitta)}px`;
        }
      });
    };

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };

    draw();

    // Пересчёт при изменении ширины и высоты карточек (например,
    // когда догрузился шрифт и текст перенёсся по-другому)
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(schedule);
      observer.observe(diagram);
      cards.forEach((card) => observer.observe(card));
    } else {
      window.addEventListener("resize", schedule);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  });
})();


/* ============================================================================
   7. ТОЧЕЧНАЯ ГРАФИКА: НОЧНОЙ ГОРОД И ПАУТИНА
   ============================================================================
   Вся графика страницы в стиле ascii.rest — сетка кружков на canvas.
   Ни картинок, ни видео: всё рисуется в браузере этим разделом.

   ГОРОД В ПЕРВОМ ЭКРАНЕ ([data-js="hero-city"])
     1) Город строится один раз как простая 3D-сцена: кварталы, дома-коробки
        с этажами и дворами, широкий проспект по диагонали и одна высотка.
        Камера висит над городом и смотрит вниз под углом ~44°: у домов
        видны крыша и фасады с рядами окон.
     2) Сцена рисуется в маленький скрытый canvas, он делится на ячейки,
        и каждая ячейка становится кружком: чем ярче место, тем крупнее
        и светлее кружок.
     3) Поверх неподвижного города 12 раз в секунду дорисовываются живые
        детали: мигающие окна, огни на крышах и машины на проспекте
        (машины ездят только по видимому куску проспекта).
     Анимация на паузе, когда первый экран не виден или вкладка скрыта.
     При «Уменьшить движение» — один неподвижный кадр.
     Сборка города — один раз после загрузки (~30 мс на ноутбуке),
     кадр анимации — меньше 1 мс. Сетевых запросов нет.

   ГОРОД В КАРТОЧКЕ «ПРАКТИЧЕСКИЙ РАЗБОР» ([data-js="practice-city"])
     Плоская полоса домов из точек по низу тёмной карточки, как силуэт
     того же города. Несколько окон тихо мигают (6 раз в секунду
     обновляется картинка). Дома строятся слева направо из одного
     «зерна», поэтому на любой ширине левая часть города одинаковая.

   ПОЛЕ ТОЧЕК В КАРТОЧКЕ ЦИКЛА ([data-js="cycle-field"])
     Сетка точек на тёмной карточке «Лучше понимать связь угрозы…».
     Яркость каждой точки задаёт плавное «поле», которое медленно
     перетекает: пятна света разгораются, плывут и гаснут. Самая яркая
     точка — такая же, как в неподвижном узоре из CSS. Вверху, за
     заголовком, поле слабее, чтобы не мешать чтению.
     24 кадра в секунду, пауза вне экрана, при «Уменьшить движение» —
     один неподвижный кадр.

   ПАУТИНА ВО ВТОРОМ БЛОКЕ ([data-js="trap-web"])
     Та же паутина, что в углу первого экрана, только на светлом фоне.
     Рисуется один раз (и заново при изменении размера). Как только она
     готова, векторная паутина-запаска (svg.trap_web) прячется.

   Всё одинаковое при каждом открытии (случайность с постоянным «зерном»).
   Повторный запуск безопасен: canvas помечаются data-dots-ready.
   ========================================================================== */

(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // 🟢 Цвета. Ступени яркости города — от тёмной к светлой.
  const COLORS = {
    grid: "#3a3047",
    ramp: ["#3a3047", "#47357a", "#5b3fb0", "#7c5cdb", "#a66cee", "#d77ef0", "#f9cdf2"],
    echo: "#e9a3d6",
    web: "#e4deff",
    lamp: "#c4b5fd",
    window: "#f6ecfb",
    beacon: "#ff8fc8",
    headlight: "#f6f2ff",
    taillight: "#ff8fc8",
    // Паутина на светлом фоне второго блока
    lightGrid: "#ded6fa",
    lightThread: "#7c5cdb",
  };

  const makeRandom = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Рисует кружки одним заходом: list = [x, y, r, x, y, r, …]
  const paintDots = (target, list, color, alpha = 1) => {
    if (!list.length) return;
    target.globalAlpha = alpha;
    target.fillStyle = color;
    target.beginPath();
    for (let k = 0; k < list.length; k += 3) {
      target.moveTo(list[k] + list[k + 2], list[k + 1]);
      target.arc(list[k], list[k + 1], list[k + 2], 0, TAU);
    }
    target.fill();
    target.globalAlpha = 1;
  };

  // Подготовка canvas под размер на экране с учётом плотности пикселей
  const fitCanvas = (canvas) => {
    const rect = canvas.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (width < 10 || height < 10) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    return { width, height, dpr };
  };

  // Паутина в виде «покрытия» по сетке ячеек: 0 — пусто, 1 — нить.
  // hub — центр в ячейках, radius — длина нитей, spokes — число нитей,
  // rings — число витков.
  const webCoverage = (cols, rows, { hub, radius, spokes, rings, line = 0.36, seed = 7 }) => {
    const SS = 3;
    const off = document.createElement("canvas");
    off.width = cols * SS;
    off.height = rows * SS;
    const w = off.getContext("2d", { willReadFrequently: true });
    w.setTransform(SS, 0, 0, SS, 0, 0);
    w.strokeStyle = "#fff";
    w.lineWidth = line;
    const random = makeRandom(seed);
    const angles = Array.from({ length: spokes }, (_, k) => (k / spokes) * TAU + 0.18 + (random() - 0.5) * 0.12);
    angles.forEach((a) => {
      w.beginPath();
      w.moveTo(hub[0], hub[1]);
      w.lineTo(hub[0] + Math.cos(a) * radius * 1.3, hub[1] + Math.sin(a) * radius * 1.3);
      w.stroke();
    });
    for (let ring = 1; ring <= rings; ring += 1) {
      const r = (radius * ring) / rings;
      w.beginPath();
      angles.forEach((a, k) => {
        const b = angles[(k + 1) % spokes] + (k === spokes - 1 ? TAU : 0);
        const mid = (a + b) / 2;
        if (k === 0) w.moveTo(hub[0] + Math.cos(a) * r, hub[1] + Math.sin(a) * r);
        w.quadraticCurveTo(hub[0] + Math.cos(mid) * r * 0.86, hub[1] + Math.sin(mid) * r * 0.86, hub[0] + Math.cos(b) * r, hub[1] + Math.sin(b) * r);
      });
      w.stroke();
    }
    const data = w.getImageData(0, 0, off.width, off.height).data;
    const cover = new Float32Array(cols * rows);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        let a = 0;
        for (let sy = 0; sy < SS; sy += 1) {
          for (let sx = 0; sx < SS; sx += 1) a += data[((y * SS + sy) * off.width + (x * SS + sx)) * 4 + 3];
        }
        cover[y * cols + x] = a / (255 * SS * SS);
      }
    }
    return cover;
  };

  // Пересборка при изменении размера, с небольшой задержкой.
  // Если размер не поменялся (например, первый вызов наблюдателя сразу
  // после подключения), ничего не пересобираем.
  const onResize = (element, callback) => {
    const sizeKey = () => `${element.clientWidth}x${element.clientHeight}`;
    let lastSize = sizeKey();
    let timer = 0;
    const schedule = () => {
      if (sizeKey() === lastSize) return;
      lastSize = sizeKey();
      clearTimeout(timer);
      timer = setTimeout(callback, 150);
    };
    if ("ResizeObserver" in window) new ResizeObserver(schedule).observe(element);
    else window.addEventListener("resize", schedule);
  };

  /* --- Город в первом экране --------------------------------------------- */

  const setupCity = (canvas) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 🟢 Настройки города. Размеры — в условных метрах.
    const SEED = 1962;
    const FPS = 12;
    const BLOCK = 26;        // сторона квартала
    const STREET = 5;        // обычная улица
    const AVENUE = 22;       // проспект (идёт вдоль оси X через центр)
    const FLOOR = 3.2;       // высота этажа
    const PITCH_DEG = 44;    // наклон камеры вниз
    const YAW_DEG = -50;     // поворот камеры: смотрим на кварталы с угла
    const CAMERA_HEIGHT = 215;
    const ZOOM = 2.25;       // чем больше, тем крупнее дома
    const FOG = 380;         // на каком расстоянии город тает в дымке
    const LANDMARK = [0, -2]; // квартал главной высотки (номер по сетке)

    let state = null;

    const build = () => {
      const size = fitCanvas(canvas);
      if (!size) return null;
      const { width, height, dpr } = size;
      // Размер точки постоянный: на любом экране шире телефона растр одинаковый
      const cell = width < 600 ? 5 : 6.5;
      const cols = Math.ceil(width / cell);
      const rows = Math.ceil(height / cell);
      const random = makeRandom(SEED);
      const wide = cols / rows > 1.2;

      // Камера
      const pitch = (PITCH_DEG * Math.PI) / 180;
      const yaw = (YAW_DEG * Math.PI) / 180;
      const fwd = [Math.cos(pitch) * Math.sin(yaw), Math.cos(pitch) * Math.cos(yaw), -Math.sin(pitch)];
      const right = [Math.cos(yaw), -Math.sin(yaw), 0];
      const up = [
        right[1] * fwd[2] - right[2] * fwd[1],
        right[2] * fwd[0] - right[0] * fwd[2],
        right[0] * fwd[1] - right[1] * fwd[0],
      ];
      const back = CAMERA_HEIGHT / Math.tan(pitch);
      const cam = [-Math.sin(yaw) * back, -Math.cos(yaw) * back, CAMERA_HEIGHT];
      const center = wide ? [cols * 0.8, rows * 0.5] : [cols * 0.55, rows * 0.3];
      const focal = (wide ? rows : cols * 0.8) * ZOOM;
      const targetDistance = Math.hypot(back, CAMERA_HEIGHT);
      const near = 15;

      const project = (x, y, z) => {
        const dx = x - cam[0];
        const dy = y - cam[1];
        const dz = z - cam[2];
        const zc = dx * fwd[0] + dy * fwd[1] + dz * fwd[2];
        const xc = dx * right[0] + dy * right[1] + dz * right[2];
        const yc = dx * up[0] + dy * up[1] + dz * up[2];
        return [center[0] + (focal * xc) / zc, center[1] - (focal * yc) / zc, zc];
      };
      const fogAt = (zc) => Math.exp(-Math.max(0, zc - targetDistance * 0.9) / FOG);
      const zMax = targetDistance + FOG * 2;
      const depthByte = (zc) => Math.round(255 * (1 - Math.min(1, Math.max(0, zc / zMax))));

      // Скрытый canvas: красный — яркость, зелёный — «фасад», синий — глубина
      const SS = 3;
      const off = document.createElement("canvas");
      off.width = cols * SS;
      off.height = rows * SS;
      const o = off.getContext("2d", { willReadFrequently: true });
      o.setTransform(SS, 0, 0, SS, 0, 0);
      o.fillStyle = "rgb(0,0,0)";
      o.fillRect(0, 0, cols, rows);

      const tone = (value, wall, zc) =>
        `rgb(${Math.round(Math.min(255, value * 255))},${wall ? 255 : 0},${zc ? depthByte(zc) : 0})`;
      const quad = (corners, color) => {
        const p = corners.map(([x, y, z]) => project(x, y, z));
        if (p.some((q) => q[2] < near)) return null;
        o.beginPath();
        o.moveTo(p[0][0], p[0][1]);
        for (let k = 1; k < p.length; k += 1) o.lineTo(p[k][0], p[k][1]);
        o.closePath();
        o.fillStyle = color;
        o.fill();
        return p;
      };

      // Сетка кварталов; по обе стороны проспекта кварталы раздвинуты
      const PITCH = BLOCK + STREET;
      const N = 14;
      const blocks = [];
      for (let i = -N; i <= N; i += 1) {
        for (let j = -N; j <= N; j += 1) {
          const x0 = i * PITCH + STREET / 2;
          const y0 = j * PITCH + STREET / 2 + (j >= 0 ? 1 : -1) * (AVENUE / 2 - STREET / 2);
          const [sx, sy, zc] = project(x0 + BLOCK / 2, y0 + BLOCK / 2, 0);
          if (zc < near || sx < -40 || sx > cols + 40 || sy < -40 || sy > rows + 60) continue;
          blocks.push({ x0, y0, zc, i, j });
        }
      }
      blocks.forEach(({ x0, y0, zc }) => {
        quad([[x0, y0, 0], [x0 + BLOCK, y0, 0], [x0 + BLOCK, y0 + BLOCK, 0], [x0, y0 + BLOCK, 0]], tone(0.06 * fogAt(zc)));
      });

      // Проспект светлее улиц: по нему всё время идут машины
      const roadLength = N * PITCH;
      for (let x = -roadLength; x < roadLength; x += PITCH) {
        const [, , zc] = project(x + PITCH / 2, 0, 0);
        if (zc < near) continue;
        quad([[x, -AVENUE / 2, 0], [x + PITCH, -AVENUE / 2, 0], [x + PITCH, AVENUE / 2, 0], [x, AVENUE / 2, 0]], tone(0.3 * fogAt(zc)));
      }

      // Разметка проспекта
      for (let x = -roadLength; x < roadLength; x += 8) {
        const [, , zc] = project(x, 0, 0);
        if (zc < near) continue;
        const f = fogAt(zc);
        [-AVENUE / 4, 0, AVENUE / 4].forEach((lane, k) => {
          const w = k === 1 ? 0.5 : 0.3;
          const len = k === 1 ? 7 : 3.5;
          quad([[x, lane - w / 2, 0], [x + len, lane - w / 2, 0], [x + len, lane + w / 2, 0], [x, lane + w / 2, 0]], tone(0.7 * f));
        });
      }

      // У каждого квартала своя постоянная «случайность», привязанная к его
      // номеру в сетке. Поэтому дом всегда одинаковый, на любой ширине экрана:
      // от размера окна зависит только то, какая часть города попала в кадр.
      const blockRandom = (i, j) => makeRandom(SEED + i * 7919 + j * 104729);

      // Надстройка на крыше (лифтовая будка или вентиляция) — у части домов
      const makeRoofBox = (rand, bx, by, bw, bd) => {
        if (Math.min(bw, bd) <= 6 || rand() >= 0.6) return null;
        const sw = 1.5 + rand() * Math.min(bw, bd) * 0.25;
        return { sw, sx0: bx + rand() * (bw - sw), sy0: by + rand() * (bd - sw) };
      };

      // Дома: 1–4 на квартал, высота растёт к «даунтауну»
      const buildings = [];
      const downtown = [10, 40];   // за проспектом: высотки не закрывают дорогу
      const sigma2 = 70 ** 2;
      blocks.forEach(({ x0, y0, i: blockI, j: blockJ }) => {
        const rand = blockRandom(blockI, blockJ);
        if (blockI === LANDMARK[0] && blockJ === LANDMARK[1]) {
          const bx = x0 + 3;
          const by = y0 + 3;
          const bw = BLOCK - 6;
          const [, , zc] = project(bx + bw / 2, by + bw / 2, 45);
          const [, , order] = project(bx + bw / 2, by + bw / 2, 0);
          buildings.push({ bx, by, bw, bd: bw, tall: 70, zc, order });
          buildings.push({
            bx: bx + 3, by: by + 3, bw: bw - 6, bd: bw - 6, tall: 96, zc, order: order - 0.01, base: 70,
            roofBox: makeRoofBox(rand, bx + 3, by + 3, bw - 6, bw - 6),
          });
          return;
        }
        const nx = rand() < 0.92 ? 1 : 2;
        const ny = rand() < 0.92 ? 1 : 2;
        const gw = BLOCK / nx;
        const gh = BLOCK / ny;
        for (let gx = 0; gx < nx; gx += 1) {
          for (let gy = 0; gy < ny; gy += 1) {
            if (rand() < 0.05) continue;
            const pad = 4;
            const bx = x0 + gx * gw + pad;
            const by = y0 + gy * gh + pad;
            const bw = gw - pad * 2;
            const bd = gh - pad * 2;
            const mx = bx + bw / 2;
            const my = by + bd / 2;
            const boost = Math.exp(-((mx - downtown[0]) ** 2 + (my - downtown[1]) ** 2) / sigma2);
            let tall = 8 + rand() * rand() * 22 + boost * rand() * 26;
            if (rand() < 0.05 + boost * 0.3) tall += 20 + rand() * 50 * boost;
            // Вдоль проспекта со стороны камеры — только низкие дома,
            // иначе они заслоняют дорогу и машины
            if (y0 < 0 && y0 + BLOCK > -AVENUE / 2 - 1) tall = Math.min(tall, 7);
            const [, , zc] = project(mx, my, tall / 2);
            // Очередь отрисовки — по основанию дома, а не по середине высоты:
            // иначе высотка «перепрыгивает» дом, стоящий перед ней
            const [, , order] = project(mx, my, 0);
            if (zc < near) continue;
            const courtyard = tall < 26 && Math.min(bw, bd) > 12 && rand() < 0.55;
            const roofBox = courtyard ? null : makeRoofBox(rand, bx, by, bw, bd);
            buildings.push({ bx, by, bw, bd, tall, zc, order, courtyard, roofBox });
            if (tall > 50) {
              const inset = Math.min(bw, bd) * 0.18;
              const tb = [bx + inset, by + inset, bw - inset * 2, bd - inset * 2];
              buildings.push({
                bx: tb[0], by: tb[1], bw: tb[2], bd: tb[3], tall: tall * 1.25, zc, order: order - 0.01, base: tall,
                roofBox: makeRoofBox(rand, ...tb),
              });
            }
          }
        }
      });
      // Дальние рисуются первыми, ближние перекрывают
      buildings.sort((a, b) => b.order - a.order);

      buildings.forEach(({ bx, by, bw, bd, tall, zc, base = 0, courtyard, roofBox }) => {
        const f = fogAt(zc);
        const x1 = bx + bw;
        const y1 = by + bd;
        const faces = [];
        if (cam[0] < bx) faces.push({ a: [bx, by], b: [bx, y1], light: 0.48 });
        if (cam[0] > x1) faces.push({ a: [x1, y1], b: [x1, by], light: 0.48 });
        if (cam[1] < by) faces.push({ a: [x1, by], b: [bx, by], light: 0.24 });
        if (cam[1] > y1) faces.push({ a: [bx, y1], b: [x1, y1], light: 0.24 });
        faces.forEach(({ a, b, light }) => {
          quad([[a[0], a[1], base], [b[0], b[1], base], [b[0], b[1], tall], [a[0], a[1], tall]], tone(light * f, true, zc));
          const floors = Math.floor((tall - base) / FLOOR);
          const ux = b[0] - a[0];
          const uy = b[1] - a[1];
          // Окна следуют плоскости фасада, а простенки сохраняют его объём.
          const bays = Math.max(2, Math.floor(Math.hypot(ux, uy) / 3.5));
          for (let k = 0; k < floors; k += 1) {
            const z1 = base + k * FLOOR + FLOOR * 0.28;
            const z2 = z1 + FLOOR * 0.38;
            for (let bay = 0; bay < bays; bay += 1) {
              const u1 = (bay + 0.24) / bays;
              const u2 = (bay + 0.68) / bays;
              quad([
                [a[0] + ux * u1, a[1] + uy * u1, z1],
                [a[0] + ux * u2, a[1] + uy * u2, z1],
                [a[0] + ux * u2, a[1] + uy * u2, z2],
                [a[0] + ux * u1, a[1] + uy * u1, z2],
              ], tone((light + 0.13) * f, true, zc));
            }
          }
          // Вертикальная грань помогает прочитать высоту даже в редком растре.
          const edge = [project(a[0], a[1], base), project(a[0], a[1], tall)];
          if (edge.every((p) => p[2] >= near)) {
            o.beginPath();
            o.moveTo(edge[0][0], edge[0][1]);
            o.lineTo(edge[1][0], edge[1][1]);
            o.strokeStyle = tone((light + 0.12) * f, true, zc);
            o.lineWidth = 0.55;
            o.stroke();
          }
        });
        // Крыша: ровная заливка и чуть более светлая кромка. Кромку нельзя
        // делать сильно ярче крыши — дома начинают «светиться» сверху.
        const height01 = Math.min(tall, 70) / 70;
        const roof = (0.56 + height01 * 0.06) * f;
        const rim = Math.min(1, roof + 0.18 * f);
        const rimLine = (p) => {
          if (!p) return;
          o.strokeStyle = tone(rim, false, zc);
          o.lineWidth = 0.45;
          o.stroke();
        };
        rimLine(quad([[bx, by, tall], [x1, by, tall], [x1, y1, tall], [bx, y1, tall]], tone(roof, false, zc)));
        // Двор: тёмный прямоугольник в середине крыши с той же кромкой
        if (courtyard) {
          const ix = bw * 0.3;
          const iy = bd * 0.3;
          rimLine(quad([[bx + ix, by + iy, tall], [x1 - ix, by + iy, tall], [x1 - ix, y1 - iy, tall], [bx + ix, y1 - iy, tall]], tone(roof * 0.2, false, zc)));
        } else if (roofBox) {
          // Надстройка на крыше: лифтовая будка или вентиляция
          const { sw, sx0, sy0 } = roofBox;
          quad([[sx0, sy0, tall + 1.5], [sx0 + sw, sy0, tall + 1.5], [sx0 + sw, sy0 + sw, tall + 1.5], [sx0, sy0 + sw, tall + 1.5]], tone(rim, false, zc));
        }
      });

      // Каждая ячейка — среднее по своему квадрату 3×3
      const data = o.getImageData(0, 0, off.width, off.height).data;
      const total = cols * rows;
      const level = new Float32Array(total);
      const wall = new Uint8Array(total);
      const depth = new Uint8Array(total);
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          let r = 0;
          let rMax = 0;
          let g = 0;
          let b = 0;
          for (let sy = 0; sy < SS; sy += 1) {
            for (let sx = 0; sx < SS; sx += 1) {
              const p = ((y * SS + sy) * off.width + (x * SS + sx)) * 4;
              r += data[p];
              rMax = Math.max(rMax, data[p]);
              g += data[p + 1];
              b = Math.max(b, data[p + 2]);
            }
          }
          const i = y * cols + x;
          // Тонкие яркие линии (кромки крыш, разметка) не должны теряться
          // при усреднении, поэтому берём почти самую яркую точку ячейки
          level[i] = Math.max(r / (255 * SS * SS), (rMax / 255) * 0.8);
          wall[i] = g / (255 * SS * SS) > 0.4 ? 1 : 0;
          depth[i] = b;
        }
      }

      // Паутина в правом верхнем углу
      const web = webCoverage(cols, rows, {
        hub: [cols * 0.97, rows * 0.06],
        radius: rows * (wide ? 0.8 : 0.5),
        spokes: 11,
        rings: 7,
        line: 0.4,
      });

      // Окна (постоянные и мигающие) и огни на крышах
      const windows = [];
      const beacons = [];
      const steady = new Uint8Array(total);
      for (let i = 0; i < total; i += 1) {
        if (wall[i] && level[i] > 0.34) {
          const roll = random();
          if (roll < 0.018) steady[i] = 1;
          else if (roll < 0.032) windows.push({ i, speed: 0.3 + random() * 1.4, phase: random() * TAU });
        } else if (!wall[i] && level[i] > 0.6 && random() < 0.025) {
          beacons.push({ i, phase: random() * TAU });
        }
      }

      // Фонари вдоль проспекта
      const lamps = [];
      for (let x = -roadLength; x < roadLength; x += 9) {
        [-AVENUE / 2 - 0.6, AVENUE / 2 + 0.6].forEach((y) => {
          const [sx, sy, zc] = project(x, y, 0);
          if (zc < near || sx < 0 || sy < 0 || sx >= cols || sy >= rows) return;
          const i = Math.floor(sy) * cols + Math.floor(sx);
          if (depth[i] && depth[i] > depthByte(zc) + 2) return;
          lamps.push({ x: sx, y: sy, r: Math.min(0.5, Math.max(0.26, 110 / zc)), a: 0.35 + 0.6 * fogAt(zc) });
        });
      }

      // Машины ездят только по видимому куску проспекта (с запасом
      // по краям), иначе большая часть из них всё время за кадром
      let carMin = Infinity;
      let carMax = -Infinity;
      for (let x = -roadLength; x < roadLength; x += 4) {
        const [sx, sy, zc] = project(x, 0, 0);
        if (zc < near || sx < -10 || sx > cols + 10 || sy < -10 || sy > rows + 10) continue;
        carMin = Math.min(carMin, x - 20);
        carMax = Math.max(carMax, x + 20);
      }
      if (carMin > carMax) {
        carMin = -roadLength;
        carMax = roadLength;
      }

      // Машины: четыре полосы, по две в каждую сторону
      const cars = Array.from({ length: wide ? 68 : 40 }, () => {
        const lane = [-AVENUE * 0.375, -AVENUE * 0.125, AVENUE * 0.125, AVENUE * 0.375][Math.floor(random() * 4)];
        const dir = lane < 0 ? 1 : -1;
        return { lane, x: carMin + random() * (carMax - carMin), speed: (14 + random() * 12) * dir };
      });
      const towardCamera = (dir) => dir * fwd[0] < 0;

      // Неподвижный слой
      const base = document.createElement("canvas");
      base.width = canvas.width;
      base.height = canvas.height;
      const b = base.getContext("2d");
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      b.fillStyle = "#2b2334";
      b.fillRect(0, 0, width, height);

      const groups = new Map();
      const dot = (color, x, y, r) => {
        if (!groups.has(color)) groups.set(color, []);
        groups.get(color).push(x, y, r);
      };
      const echo = [];
      const webDots = [];
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const i = y * cols + x;
          const px = (x + 0.5) * cell;
          const py = (y + 0.5) * cell;
          // Полутон: яркость крыш и земли чуть «дрожит» от точки к точке,
          // как растр в печати
          const grain = level[i] > 0.15 && !wall[i] ? (random() - 0.5) * 0.06 : 0;
          const v = Math.max(0, Math.min(1, level[i] + grain));
          // Нить паутины «прорезает» город: в этой ячейке только она
          if (web[i] > 0.08) {
            webDots.push(px, py, cell * (0.14 + 0.2 * Math.min(1, web[i] * 1.6)));
            continue;
          }
          if (steady[i]) {
            dot(COLORS.ramp[6], px, py, cell * 0.28);
          } else if (wall[i]) {
            // Стена тёмная, ряды окон чуть светлее — так виден объём.
            // Ярко горят только отдельные окна (они рисуются выше и в анимации).
            // Сохраняем освещение граней, не сводим обе к одному тону.
            const step = v < 0.2 ? 0 : v < 0.32 ? 1 : v < 0.46 ? 2 : v < 0.58 ? 3 : 4;
            dot(COLORS.ramp[step], px, py, cell * (0.19 + v * 0.28));
          } else if (v < 0.05) {
            dot(COLORS.grid, px, py, cell * 0.1);
          } else {
            const step = Math.min(COLORS.ramp.length - 1, Math.floor(v * COLORS.ramp.length));
            dot(COLORS.ramp[step], px, py, cell * (0.18 + 0.34 * ((step + 1) / COLORS.ramp.length)));
            if (v > 0.62) echo.push(px + cell * 0.22, py - cell * 0.18, cell * 0.3 * v);
          }
        }
      }
      // Розовый «сдвиг печати» у ярких точек — как в комиксе
      paintDots(b, echo, COLORS.echo, 0.45);
      COLORS.ramp.concat([COLORS.grid]).forEach((color) => {
        if (groups.has(color)) paintDots(b, groups.get(color), color);
      });
      lamps.forEach(({ x, y, r, a }) => paintDots(b, [x * cell, y * cell, r * cell], COLORS.lamp, a));
      paintDots(b, webDots, COLORS.web, 0.85);

      return { dpr, cell, cols, rows, depth, base, windows, beacons, cars, project, depthByte, near, carMin, carMax, towardCamera };
    };

    const draw = (time, dt) => {
      const s = state;
      if (!s) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(s.base, 0, 0);
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);

      const at = (i) => [((i % s.cols) + 0.5) * s.cell, (Math.floor(i / s.cols) + 0.5) * s.cell];
      const lit = [];
      s.windows.forEach(({ i, speed, phase }) => {
        if (Math.sin(time * speed + phase) > 0.45) {
          const [x, y] = at(i);
          lit.push(x, y, s.cell * 0.3);
        }
      });
      const beacons = [];
      s.beacons.forEach(({ i, phase }) => {
        if (Math.sin(time * 2.2 + phase) > 0.6) {
          const [x, y] = at(i);
          beacons.push(x, y, s.cell * 0.42);
        }
      });
      const head = [];
      const tail = [];
      const haloHead = [];
      const haloTail = [];
      const trailHead = [[], []];
      const trailTail = [[], []];
      s.cars.forEach((car) => {
        car.x += car.speed * dt;
        if (car.x > s.carMax) car.x -= s.carMax - s.carMin;
        if (car.x < s.carMin) car.x += s.carMax - s.carMin;
        const [sx, sy, zc] = s.project(car.x, car.lane, 0.6);
        if (zc < s.near) return;
        const col = Math.floor(sx);
        const row = Math.floor(sy);
        if (col < 0 || row < 0 || col >= s.cols || row >= s.rows) return;
        const d = s.depth[row * s.cols + col];
        if (d && d > s.depthByte(zc) + 2) return;
        // Машина: яркая точка, мягкий ореол и короткий след из двух точек
        const size = Math.min(0.75, Math.max(0.42, 160 / zc));
        const toward = s.towardCamera(Math.sign(car.speed));
        (toward ? head : tail).push(sx * s.cell, sy * s.cell, s.cell * size);
        (toward ? haloHead : haloTail).push(sx * s.cell, sy * s.cell, s.cell * size * 2.2);
        [3.5, 7].forEach((back, k) => {
          const [bx, by] = s.project(car.x - Math.sign(car.speed) * back, car.lane, 0.6);
          (toward ? trailHead : trailTail)[k].push(bx * s.cell, by * s.cell, s.cell * size * (0.7 - k * 0.2));
        });
      });

      paintDots(ctx, lit, COLORS.window);
      paintDots(ctx, haloHead, COLORS.headlight, 0.16);
      paintDots(ctx, haloTail, COLORS.taillight, 0.18);
      paintDots(ctx, trailHead[1], COLORS.headlight, 0.3);
      paintDots(ctx, trailTail[1], COLORS.taillight, 0.3);
      paintDots(ctx, trailHead[0], COLORS.headlight, 0.6);
      paintDots(ctx, trailTail[0], COLORS.taillight, 0.6);
      paintDots(ctx, head, COLORS.headlight);
      paintDots(ctx, tail, COLORS.taillight);
      paintDots(ctx, beacons, COLORS.beacon);
    };

    let raf = 0;
    let last = 0;
    let visible = false;
    const startTime = performance.now();
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / FPS) return;
      const dt = last ? Math.min(0.25, (now - last) / 1000) : 0;
      last = now;
      draw((now - startTime) / 1000, dt);
    };
    const update = () => {
      const run = visible && !document.hidden && !reducedMotion.matches && state;
      if (run && !raf) {
        last = 0;
        raf = requestAnimationFrame(loop);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const rebuild = () => {
      state = build();
      draw(0, 0);
      update();
    };

    onResize(canvas, rebuild);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        update();
      }).observe(canvas);
    } else {
      visible = true;
    }
    document.addEventListener("visibilitychange", update);
    if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", update);
    rebuild();
  };

  /* --- Полоса города в карточке «Практический разбор» ------------------- */

  const setupSkyline = (canvas) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 🟢 Настройки полосы города
    const SEED = 404;
    const FPS = 6;

    let state = null;

    const build = () => {
      const size = fitCanvas(canvas);
      if (!size) return null;
      const { width, height, dpr } = size;
      const cell = width < 600 ? 6 : 7;
      const cols = Math.ceil(width / cell);
      const rows = Math.ceil(height / cell);
      const random = makeRandom(SEED);

      // Два ряда домов: дальний — выше и темнее, ближний — ниже и ярче
      const layer = (minW, maxW, minH, maxH, maxGap) => {
        const list = [];
        let x = Math.floor(random() * 2);
        while (x < cols) {
          const w = minW + Math.floor(random() * (maxW - minW + 1));
          const h = Math.round(rows * (minH + random() * (maxH - minH)));
          list.push({ x, w, h, antenna: random() < 0.18, light: random() < 0.35 });
          x += w + Math.floor(random() * (maxGap + 1));
        }
        return list;
      };
      const back = layer(4, 9, 0.45, 0.95, 1);
      const front = layer(3, 7, 0.22, 0.62, 3);

      // Какая ячейка чем занята: 0 — пусто, 1 — дальний дом, 2 — ближний,
      // 3 — антенна; 5 — ближний дом посветлее (часть фасадов светлее,
      // чтобы полоса не выглядела одинаковой)
      const kind = new Uint8Array(cols * rows);
      const mark = (list, value) => {
        list.forEach(({ x, w, h, antenna, light }) => {
          const fill = value === 2 && light ? 5 : value;
          for (let cx = x; cx < Math.min(cols, x + w); cx += 1) {
            for (let cy = rows - h; cy < rows; cy += 1) {
              if (cy >= 0) kind[cy * cols + cx] = fill;
            }
          }
          // Антенна: столбик точек над серединой крыши
          if (antenna) {
            const ax = x + Math.floor(w / 2);
            for (let cy = rows - h - 3; cy < rows - h; cy += 1) {
              if (cy >= 0 && ax < cols) kind[cy * cols + ax] = value + 2;
            }
          }
        });
      };
      mark(back, 1);
      mark(front, 2);

      const base = document.createElement("canvas");
      base.width = canvas.width;
      base.height = canvas.height;
      const b = base.getContext("2d");
      b.setTransform(dpr, 0, 0, dpr, 0, 0);

      const grid = [];
      const far = [];
      const near = [];
      const nearLight = [];
      const lit = [];
      const pink = [];
      const twinkle = [];
      for (let cy = 0; cy < rows; cy += 1) {
        for (let cx = 0; cx < cols; cx += 1) {
          const k = kind[cy * cols + cx];
          const px = (cx + 0.5) * cell;
          const py = (cy + 0.5) * cell;
          const jitter = 0.85 + random() * 0.3;
          if (k === 0) {
            grid.push(px, py, cell * 0.08);
          } else if (k === 1 || k === 3) {
            far.push(px, py, cell * 0.22 * jitter);
          } else {
            const roll = random();
            const facade = k === 5;
            if (k !== 4 && roll < 0.05) lit.push(px, py, cell * 0.3);
            else if (k !== 4 && roll < 0.08) pink.push(px, py, cell * 0.3);
            else if (k !== 4 && roll < 0.11) twinkle.push({ x: px, y: py, speed: 0.6 + random() * 1.6, phase: random() * TAU });
            else (facade ? nearLight : near).push(px, py, cell * 0.3 * jitter);
          }
        }
      }
      paintDots(b, grid, COLORS.grid);
      paintDots(b, far, COLORS.ramp[2], 0.75);
      paintDots(b, near, COLORS.ramp[3]);
      paintDots(b, nearLight, COLORS.ramp[4]);
      paintDots(b, lit, COLORS.window, 0.9);
      paintDots(b, pink, COLORS.echo);

      return { dpr, cell, base, twinkle };
    };

    const draw = (time) => {
      const s = state;
      if (!s) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(s.base, 0, 0);
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      const on = [];
      const off = [];
      s.twinkle.forEach(({ x, y, speed, phase }) => {
        (Math.sin(time * speed + phase) > 0.2 ? on : off).push(x, y, s.cell * 0.3);
      });
      paintDots(ctx, off, COLORS.ramp[3]);
      paintDots(ctx, on, COLORS.window);
    };

    let raf = 0;
    let last = 0;
    let visible = false;
    const startTime = performance.now();
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / FPS) return;
      last = now;
      draw((now - startTime) / 1000);
    };
    const update = () => {
      const run = visible && !document.hidden && !reducedMotion.matches && state;
      if (run && !raf) {
        raf = requestAnimationFrame(loop);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const rebuild = () => {
      state = build();
      draw(0);
      update();
    };

    onResize(canvas, rebuild);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        update();
      }).observe(canvas);
    } else {
      visible = true;
    }
    document.addEventListener("visibilitychange", update);
    if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", update);
    rebuild();
  };

  /* --- Поле точек в карточке цикла ---------------------------------------- */

  // Плавный шум: случайные значения в узлах решётки, между узлами —
  // мягкое смешивание. Третья координата — время, поэтому поле перетекает.
  const hash3 = (x, y, z) => {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1440662683);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const ease = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const noise3 = (x, y, z) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const u = ease(x - xi);
    const v = ease(y - yi);
    const w = ease(z - zi);
    const corner = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
    return lerp(
      lerp(lerp(corner(0, 0, 0), corner(1, 0, 0), u), lerp(corner(0, 1, 0), corner(1, 1, 0), u), v),
      lerp(lerp(corner(0, 0, 1), corner(1, 0, 1), u), lerp(corner(0, 1, 1), corner(1, 1, 1), u), v),
      w,
    );
  };
  const smoothstep = (a, b, x) => ease(Math.min(1, Math.max(0, (x - a) / (b - a))));

  const setupField = (canvas) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const card = canvas.parentElement;

    // 🟢 Настройки поля
    const STEP = 8;          // шаг сетки точек, px
    const MAX_R = 1.6;       // радиус самой яркой точки, px
    const MAX_ALPHA = 0.8;   // прозрачность самой яркой точки
    const SCALE = 1 / 110;   // размер пятен: меньше число — крупнее пятна
    const SPEED = 0.09;      // как быстро поле меняется (в секунду)
    const DRIFT = 0.035;     // как быстро пятна плывут вбок
    const FPS = 24;
    const LEVELS = 8;        // ступени яркости (точки рисуются пачками)

    let state = null;

    const build = () => {
      const size = fitCanvas(canvas);
      if (!size) return null;
      const { width, height, dpr } = size;
      const dots = [];
      for (let y = STEP / 2; y < height; y += STEP) {
        // Вверху поле слабее: там заголовок и текст
        const weight = 0.3 + 0.7 * smoothstep(0.12, 0.55, y / height);
        for (let x = STEP / 2; x < width; x += STEP) dots.push(x, y, weight);
      }
      return { width, height, dpr, dots };
    };

    const draw = (time) => {
      const s = state;
      if (!s) return;
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      ctx.clearRect(0, 0, s.width, s.height);
      const z = time * SPEED;
      const drift = time * DRIFT;
      const buckets = Array.from({ length: LEVELS }, () => []);
      for (let k = 0; k < s.dots.length; k += 3) {
        const x = s.dots[k];
        const y = s.dots[k + 1];
        const n = 0.65 * noise3(x * SCALE + drift, y * SCALE, z) + 0.35 * noise3(x * SCALE * 2.1 + 7.3, y * SCALE * 2.1 - drift, z * 1.4 + 3.1);
        const level = smoothstep(0.42, 0.78, n) * s.dots[k + 2];
        const b = Math.round(level * (LEVELS - 1));
        if (b > 0) buckets[b].push(x, y, MAX_R * (0.45 + 0.55 * (b / (LEVELS - 1))));
      }
      buckets.forEach((list, b) => {
        if (b > 0) paintDots(ctx, list, COLORS.ramp[3], MAX_ALPHA * (b / (LEVELS - 1)));
      });
    };

    let raf = 0;
    let last = 0;
    let visible = false;
    const startTime = performance.now();
    // При «Уменьшить движение» показываем один кадр с этого момента поля
    const STILL_TIME = 37;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / FPS) return;
      last = now;
      draw(STILL_TIME + (now - startTime) / 1000);
    };
    const update = () => {
      const run = visible && !document.hidden && !reducedMotion.matches && state;
      if (run && !raf) {
        raf = requestAnimationFrame(loop);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const rebuild = () => {
      state = build();
      draw(STILL_TIME);
      if (state) card.classList.add("is-fluid");
      update();
    };

    onResize(canvas, rebuild);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        update();
      }).observe(canvas);
    } else {
      visible = true;
    }
    document.addEventListener("visibilitychange", update);
    if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", update);
    rebuild();
  };

  /* --- Паутина во втором блоке ------------------------------------------- */

  const setupTrapWeb = (canvas) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const holder = canvas.closest("[data-js='trap-loop']") || canvas.parentElement;

    const render = () => {
      const size = fitCanvas(canvas);
      if (!size) return;
      const { width, height, dpr } = size;
      const cell = 7;
      const cols = Math.ceil(width / cell);
      const rows = Math.ceil(height / cell);
      const web = webCoverage(cols, rows, {
        hub: [cols / 2, rows / 2],
        radius: Math.min(cols, rows) * 0.5,
        spokes: 15,
        rings: 10,
        line: 0.32,
        seed: 11,
      });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const grid = [];
      const threads = [];
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const c = web[y * cols + x];
          const px = (x + 0.5) * cell;
          const py = (y + 0.5) * cell;
          if (c > 0.08) threads.push(px, py, cell * (0.12 + 0.18 * Math.min(1, c * 1.6)));
          else grid.push(px, py, cell * 0.09);
        }
      }
      paintDots(ctx, grid, COLORS.lightGrid);
      paintDots(ctx, threads, COLORS.lightThread, 0.8);
      // Точечная паутина готова — векторную запаску прячем
      holder.classList.add("is-dotted");
    };

    onResize(canvas, render);
    render();
  };

  // Графику строим, когда браузер освободится после загрузки страницы:
  // текст и кнопки появляются сразу, город дорисовывается следом.
  // До этого на месте города просто тёмная панель.
  const whenIdle = (task) => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(task, { timeout: 600 });
    else setTimeout(task, 50);
  };

  whenIdle(() => {
    document.querySelectorAll('[data-js="hero-city"]').forEach((canvas) => {
      if (canvas.dataset.dotsReady === "true") return;
      canvas.dataset.dotsReady = "true";
      setupCity(canvas);
    });
    document.querySelectorAll('[data-js="trap-web"]').forEach((canvas) => {
      if (canvas.dataset.dotsReady === "true") return;
      canvas.dataset.dotsReady = "true";
      setupTrapWeb(canvas);
    });
    document.querySelectorAll('[data-js="practice-city"]').forEach((canvas) => {
      if (canvas.dataset.dotsReady === "true") return;
      canvas.dataset.dotsReady = "true";
      setupSkyline(canvas);
    });
    document.querySelectorAll('[data-js="cycle-field"]').forEach((canvas) => {
      if (canvas.dataset.dotsReady === "true") return;
      canvas.dataset.dotsReady = "true";
      setupField(canvas);
    });
  });
})();


/* ============================================================================
   8. СХЕМА «ЧТО РАЗБЕРЕМ НА ВСТРЕЧЕ»: ПОЯВЛЕНИЕ И НАВЕДЕНИЕ
   ============================================================================
   1) Когда карточка «Теория» появляется на экране, три круга по очереди
      проступают, а затем в середине собираются крупные точки. Так же,
      отдельно, выезжает билетик с чек-листом.
   2) Пока схема на экране, кольца из точек медленно вращаются.
      Вне экрана — стоят.
   3) Наведение мышью на круг (или нажатие на телефоне) наливает его цветом.
   При «Уменьшить движение» ничего не прячется и не вращается.
   Без скрипта блок просто виден целиком. Повторный запуск безопасен.
   ========================================================================== */

(() => {
  "use strict";

  const block = document.querySelector(".program_component");
  if (!block || block.dataset.programReady === "true") return;
  block.dataset.programReady = "true";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const circles = block.querySelector('[data-js="program-circles"]');
  const hasObserver = "IntersectionObserver" in window;

  // 1. Появление
  const targets = [block.querySelector(".program_card.is-theory"), block.querySelector(".program_ticket")].filter(Boolean);
  if (hasObserver && !reducedMotion.matches && targets.length) {
    block.classList.add("is-armed");
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-shown");
        reveal.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    targets.forEach((target) => reveal.observe(target));
  }

  if (!circles) return;

  // 2. Кольца вращаются, только пока схема на экране
  if (hasObserver) {
    new IntersectionObserver((entries) => {
      circles.classList.toggle("is-live", entries.some((entry) => entry.isIntersecting));
    }).observe(circles);
  } else {
    circles.classList.add("is-live");
  }

  // 3. Наведение и нажатие
  const systems = Array.from(circles.querySelectorAll("[data-system]"));
  const setHot = (current) => {
    systems.forEach((system) => system.classList.toggle("is-hot", system === current));
  };
  systems.forEach((system) => {
    system.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") setHot(system);
    });
    system.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") setHot(null);
    });
    // На телефоне нажатие включает круг, повторное — выключает
    system.addEventListener("pointerup", (event) => {
      if (event.pointerType === "mouse") return;
      setHot(system.classList.contains("is-hot") ? null : system);
    });
  });
})();
