/* Лендинг вебинара «РО ДБТ: введение в подход»: FAQ и запись на вебинар.
   Раздел записи скопирован один в один с других вебинарных лендингов (hudet-snova-modno и др.) и помечен
   заголовком «ЗАПИСЬ НА ВЕБИНАР: BOTHELP + ЗАПАСНАЯ ФОРМА»: если правите его здесь, перенесите правку и туда. */

/* ---------- Схемы второго блока: запуск анимации, когда блок появился на экране ----------
   Блок с атрибутом data-reveal получает класс is-on, дальше всё делает CSS (page.css, раздел 2).
   Если в системе отключено движение, схемы сразу показываются в конечном виде. */
(() => {
  "use strict";
  const blocks = [...document.querySelectorAll("[data-reveal]")];
  if (!blocks.length) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    blocks.forEach((b) => b.classList.add("is-on"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-on");
      io.unobserve(e.target);
    });
  }, { threshold: 0.25 });
  blocks.forEach((b) => io.observe(b));
})();

/* ---------- FAQ: открыт один вопрос за раз ---------- */
(() => {
  "use strict";
  document.querySelectorAll("[data-faq]").forEach((list) => {
    const items = [...list.querySelectorAll("[data-faq-item]")];
    items.forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) return;
        items.forEach((other) => { if (other !== item && other.open) other.open = false; });
      });
    });
  });
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

