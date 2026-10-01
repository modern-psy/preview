/* ============================================================================
   ПОВЕДЕНИЕ СТРАНИЦЫ «ПСИХОСОМАТИКА В ПРАКТИКЕ ПСИХОЛОГА»
   ============================================================================

   Скрипт делает пять вещей:
     1) плавно раскрывает вопросы в блоке «Ответы на популярные вопросы».
        Без скрипта аккордеон тоже работает — просто без анимации:
        это обычный тег <details>;
     2) листает ленты «7 систем организма» и «Преподаватели» по стрелкам.
        Без скрипта ленты листаются пальцем и колесом — стрелки просто
        не работают;
     3) переключает модули в блоке «Программа курса». Без скрипта виден
        первый модуль;
     4) показывает карточки мифов по очереди при прокрутке. Без скрипта
        карточки просто видны сразу;
     5) отправляет форму заявки через скрытую форму Тильды.

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
     2. Ленты со стрелками
     3. Программа курса — переключение модулей
     4. Появление карточек при прокрутке
     5. Служебные значения: ClientID Метрики и UTM-метки
     6. Скрытая форма Тильды
     7. Отправка заявки
   ========================================================================== */

(() => {
  "use strict";

  // На Тильде страница разбита на несколько блоков T123, и обёртка
  // .psy-page есть у каждого блока. Поэтому «страница» здесь — это все
  // обёртки сразу: ищем элементы и вешаем классы на каждую из них.
  const pages = Array.from(document.querySelectorAll(".psy-page"));
  if (pages.length === 0) return;

  const page = {
    querySelectorAll: (selector) =>
      pages.flatMap((root) => Array.from(root.querySelectorAll(selector))),
    querySelector: (selector) => {
      for (const root of pages) {
        const found = root.querySelector(selector);
        if (found) return found;
      }
      return null;
    },
    addEventListener: (type, handler) =>
      pages.forEach((root) => root.addEventListener(type, handler)),
    classList: {
      add: (name) => pages.forEach((root) => root.classList.add(name)),
    },
  };

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
     2. ЛЕНТЫ СО СТРЕЛКАМИ
     --------------------------------------------------------------------------
     Лента — обычный скролл-контейнер. Стрелки прокручивают её на ширину
     одной карточки. У краёв стрелка гаснет (disabled).

     Листание анимируем сами через requestAnimationFrame: браузерный
     scrollBy({behavior: "smooth"}) спорит со scroll-snap и в части браузеров
     дёргается. На время анимации снимаем с ленты snap и smooth, чтобы они
     не перехватывали управление, и возвращаем в конце.
     -------------------------------------------------------------------------- */

  page.querySelectorAll("[data-slider-controls]").forEach((controls) => {
    const name = controls.dataset.sliderControls;
    const track = page.querySelector(`[data-slider-track="${name}"]`);
    const prev = controls.querySelector("[data-slider-prev]");
    const next = controls.querySelector("[data-slider-next]");

    if (!track || !prev || !next) return;

    // Шаг листания: ширина первой карточки + промежуток сетки
    const step = () => {
      const card = track.firstElementChild;
      if (!card) return track.clientWidth;
      const gap = parseFloat(window.getComputedStyle(track).columnGap) || 16;
      return card.getBoundingClientRect().width + gap;
    };

    const syncArrows = () => {
      const maxScroll = track.scrollWidth - track.clientWidth - 1;
      prev.disabled = track.scrollLeft <= 1;
      next.disabled = track.scrollLeft >= maxScroll;
    };

    const SLIDE_DURATION_MS = 450;
    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    let animationId = 0;
    // Цель копим между нажатиями: несколько быстрых кликов листают
    // на несколько карточек одной плавной анимацией
    let target = 0;
    let animating = false;

    const finishAnimation = () => {
      animating = false;
      track.style.scrollSnapType = "";
      track.style.scrollBehavior = "";
      syncArrows();
    };

    const slideTo = (nextTarget) => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      target = Math.max(0, Math.min(maxScroll, nextTarget));

      if (reducedMotion.matches) {
        track.scrollLeft = target;
        return;
      }

      window.cancelAnimationFrame(animationId);
      animating = true;
      track.style.scrollSnapType = "none";
      track.style.scrollBehavior = "auto";

      const from = track.scrollLeft;
      const distance = target - from;
      const start = performance.now();

      const frame = (now) => {
        const progress = Math.min(1, (now - start) / SLIDE_DURATION_MS);
        track.scrollLeft = from + distance * easeInOutCubic(progress);

        if (progress < 1) {
          animationId = window.requestAnimationFrame(frame);
        } else {
          finishAnimation();
        }
      };

      animationId = window.requestAnimationFrame(frame);
    };

    const base = () => (animating ? target : track.scrollLeft);

    prev.addEventListener("click", () => slideTo(base() - step()));
    next.addEventListener("click", () => slideTo(base() + step()));

    // Человек взялся листать сам — уступаем ленту ему
    track.addEventListener("pointerdown", () => {
      if (!animating) return;
      window.cancelAnimationFrame(animationId);
      finishAnimation();
    });

    track.addEventListener("scroll", syncArrows, { passive: true });
    window.addEventListener("resize", syncArrows);
    syncArrows();
  });


  /* --------------------------------------------------------------------------
     2.5. ПЛАВНЫЙ СКРОЛЛ К ЯКОРЯМ
     --------------------------------------------------------------------------
     Кнопка «Изучить программу» и другие ссылки на блоки этой же страницы
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
     3. ПРОГРАММА КУРСА — ПЕРЕКЛЮЧЕНИЕ МОДУЛЕЙ
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
          // Перезапуск анимации появления
          void panel.offsetWidth;
          panel.classList.add("is-entering");
        }
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => select(tab));

      // Стрелки вверх/вниз ходят по списку модулей — так положено табам
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
     3.5. КАРТА КОМПЕТЕНЦИЙ — ТАБЫ
     --------------------------------------------------------------------------
     Таб переключает сразу две вещи: текст в левой карточке и сцену справа.
     Тексты и сцены идут в том же порядке, что и табы. Сцена, которую
     спрятали, останавливает анимацию, показанная — начинает её с начала:
     так работает CSS-анимация на элементах с display: none.
     -------------------------------------------------------------------------- */

  page.querySelectorAll("[data-skills]").forEach((block) => {
    const tabs = Array.from(block.querySelectorAll("[data-skills-tab]"));
    const texts = Array.from(block.querySelectorAll("[data-skills-text]"));
    const scenes = Array.from(block.querySelectorAll("[data-skills-scene]"));

    const tabList = tabs[0]?.parentElement;

    const select = (index) => {
      tabs.forEach((tab, i) => tab.setAttribute("aria-selected", String(i === index)));
      scenes.forEach((scene, i) => { scene.hidden = i !== index; });

      // На телефоне табы лежат в горизонтальной ленте — подвозим выбранный
      // в кадр, не трогая вертикальную прокрутку страницы
      if (tabList && tabList.scrollWidth > tabList.clientWidth + 1) {
        tabs[index].scrollIntoView({
          inline: "center",
          block: "nearest",
          behavior: reducedMotion.matches ? "auto" : "smooth",
        });
      }
      texts.forEach((text, i) => {
        text.hidden = i !== index;
        text.classList.remove("is-entering");
        if (i === index && !reducedMotion.matches) {
          void text.offsetWidth;
          text.classList.add("is-entering");
        }
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => select(index));

      // Стрелки ходят по табам по кругу
      tab.addEventListener("keydown", (event) => {
        const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        if (!delta) return;
        event.preventDefault();
        const next = (index + delta + tabs.length) % tabs.length;
        tabs[next].focus();
        select(next);
      });
    });
  });


  /* --------------------------------------------------------------------------
     4. ПОЯВЛЕНИЕ КАРТОЧЕК ПРИ ПРОКРУТКЕ
     --------------------------------------------------------------------------
     Класс is-reveal-ready на странице включает начальное «спрятанное»
     состояние (см. page.css) — только когда скрипт точно работает.
     Дальше IntersectionObserver вешает is-visible по мере прокрутки,
     карточки одной группы появляются с небольшой задержкой по очереди.
     -------------------------------------------------------------------------- */

  const revealItems = Array.from(page.querySelectorAll("[data-reveal]"));

  if (revealItems.length > 0 && "IntersectionObserver" in window && !reducedMotion.matches) {
    page.classList.add("is-reveal-ready");

    // Задержка по порядку внутри группы — так карточки идут «волной»
    page.querySelectorAll("[data-reveal-group]").forEach((group) => {
      Array.from(group.querySelectorAll("[data-reveal]")).forEach((item, index) => {
        item.style.setProperty("--reveal-delay", `${index * 90}ms`);
      });
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.15 });

    revealItems.forEach((item) => observer.observe(item));
  }


  /* --------------------------------------------------------------------------
     5. СЛУЖЕБНЫЕ ЗНАЧЕНИЯ: ClientID МЕТРИКИ И UTM-МЕТКИ
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
  const UTM_STORAGE_KEY = "psihosomatika-utm";

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
     6. СКРЫТАЯ ФОРМА ТИЛЬДЫ
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

  // Форму ищем по имени из настроек Тильды (data-tilda-form-name). Если
  // такой нет, но форма на странице всего одна — берём её. Формы во
  // всплывающих окнах Тильды не трогаем: они работают сами по себе.
  // Что нашли — один раз пишем в консоль: так видно, что связка работает.
  let reportedForm = null;

  const describeTildaForm = (form) => {
    const name = form.querySelector('input[name="tildaspec-formname"]')?.value;
    const rec = form.closest(".t-rec")?.id;
    return [name ? `имя «${name}»` : "без имени", rec ? `блок ${rec}` : ""].filter(Boolean).join(", ");
  };

  const reportTildaForm = (form, how, formName) => {
    if (reportedForm === form) return;
    reportedForm = form;
    console.info(`[заявка] Форма Тильды найдена ${how}: ${describeTildaForm(form)}. Заявки уйдут в неё.`);
    if (how !== "по имени") {
      console.warn(
        `[заявка] Имя «${formName}» у этой формы не задано. Задайте его в настройках ` +
        "формы в Тильде или поправьте data-tilda-form-name в разметке."
      );
    }
  };

  const findTildaForm = (formName) => {
    const forms = [...document.querySelectorAll("form.t-form")]
      .filter((form) => !form.closest(".t-popup"));
    if (forms.length === 0) return null;

    const byName = forms.find(
      (form) => form.querySelector('input[name="tildaspec-formname"]')?.value === formName
    );
    if (byName) {
      reportTildaForm(byName, "по имени", formName);
      return byName;
    }

    if (forms.length === 1) {
      reportTildaForm(forms[0], "как единственная на странице", formName);
      return forms[0];
    }

    if (!reportedForm) {
      reportedForm = "none";
      console.error(
        `[заявка] Не нашли форму Тильды с именем «${formName}». ` +
        `Форм вне попапов на странице ${forms.length}: ` +
        forms.map(describeTildaForm).join("; ") + ". Заявки отправляться не будут."
      );
    }
    return null;
  };

  const hideTildaForm = (formName) => {
    const nativeForm = findTildaForm(formName);
    if (!(nativeForm instanceof HTMLFormElement)) return null;

    const record = nativeForm.closest(".t-rec") || nativeForm;
    if (record.hasAttribute("data-psy-native-form-record")) return nativeForm;

    record.setAttribute("aria-hidden", "true");
    record.setAttribute("data-psy-native-form-record", "");

    // Убираем блок с глаз, но не через display:none — скриптам Тильды нужно
    // измерять поля и ставить в них фокус. Стили прямо здесь, а не в page.css,
    // чтобы блок не мелькал, если стили подключатся позже скрипта.
    record.style.cssText += [
      "position:absolute !important", "width:1px !important", "height:1px !important",
      "margin:-1px !important", "padding:0 !important", "overflow:hidden !important",
      "border:0 !important", "clip:rect(0 0 0 0)", "clip-path:inset(50%)",
      "pointer-events:none !important", "white-space:nowrap !important",
    ].join(";");

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
      input.setAttribute("data-psy-added-field", "");
      nativeForm.appendChild(input);
    }

    setNativeValue(input, value);
  };

  // Телефон в форме Тильды — поле с маской «+7 (000) 000-00-00»: видимое
  // поле принимает 10 цифр без кода страны, а результат Тильда сама кладёт
  // в скрытое поле Phone. Если маски нет — пишем в Phone напрямую.
  const setTildaPhone = (nativeForm, rawPhone) => {
    const mask = nativeForm.querySelector(".t-input-group_ph input.t-input-phonemask");
    if (!(mask instanceof HTMLInputElement)) {
      setTildaField(nativeForm, "Phone", rawPhone);
      return;
    }

    setNativeValue(mask, nationalDigits(rawPhone));

    const result = nativeForm.querySelector('.t-input-group_ph input[name="Phone"]');
    if (result instanceof HTMLInputElement && !result.value.trim()) {
      setNativeValue(result, rawPhone);
    }
  };

  // Способ связи в форме Тильды — переключатель «Телефон / Telegram / Max»
  // (значения phone / telegram / max_messenger). У каждого варианта свой
  // контейнер .t-contact-method__<вариант>-value с полем «имя пользователя
  // или телефон». Это поле гибридное: как только в нём появляется номер,
  // Тильда сама переключает его в маску телефона и очищает — поэтому
  // после первого заполнения проверяем, не появилась ли маска, и вписываем
  // номер уже в неё. Что выбрал человек на самом деле, дополнительно уходит
  // отдельным полем Messenger.
  // 🟡 Какие значения переключателя Тильды подходят нашим кнопкам, по
  // убыванию предпочтения. Если ни одного нет — берём первый вариант.
  const MESSENGER_TO_TILDA = {
    "телефон": ["phone"],
    telegram: ["telegram"],
    max: ["max_messenger", "max"],
  };

  const nationalDigits = (phone) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 11 && /^[78]/.test(digits) ? digits.slice(1) : digits;
  };

  const pause = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const setTildaMessenger = async (nativeForm, messenger, phone) => {
    const radios = [...nativeForm.querySelectorAll('input[type="radio"][name="messenger-type"]')];
    if (radios.length === 0) return;

    const key = messenger.toLowerCase();
    const wanted = MESSENGER_TO_TILDA[key] || [key];
    const radio = wanted.map((value) => radios.find((item) => item.value === value)).find(Boolean) || radios[0];
    if (radio !== radios.find((item) => item.value === wanted[0])) {
      console.warn(`[заявка] В форме Тильды нет варианта «${messenger}» — выбран «${radio.value}». Настоящий выбор уйдёт полем Messenger.`);
    }
    radio.click();
    await pause(150);

    const container = nativeForm.querySelector(`.t-contact-method__${radio.value}-value`) || nativeForm;
    const isActive = (input) => !input.disabled && !input.closest(".t-contact-method__hidden");
    const activeUsername = () =>
      [...container.querySelectorAll("input.js-username-input")].find(isActive) || null;
    const activeMask = () =>
      [...container.querySelectorAll("input.t-input-phonemask")].find(isActive) || null;

    const username = activeUsername();
    if (username) {
      setNativeValue(username, phone);
      await pause(150);
    }

    const mask = activeMask();
    if (mask && !mask.value.trim()) {
      setNativeValue(mask, nationalDigits(phone));
      await pause(150);
    }

    // Последняя страховка: если после всех переключений результата нет —
    // пишем номер прямо в скрытое поле результата
    const result = [...container.querySelectorAll('input[name="messenger-id"]')].find((item) => !item.disabled);
    if (result instanceof HTMLInputElement && !result.value.trim()) {
      setNativeValue(result, phone);
    }
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
        window.jQuery(document).off(".psySignup");
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
      window.jQuery(document).on("tildaform:aftersuccess.psySignup", onSuccess);
      window.jQuery(document).on("tildaform:aftererror.psySignup", onError);
    }

    // Если поля не прошли проверку самой Тильды, события она не шлёт —
    // только показывает текст ошибки внутри (спрятанной) формы. Ловим его
    // сами, пишем в консоль и не ждём таймаута.
    const tildaErrors = () => [
      ...nativeForm.querySelectorAll(".t-input-error, .t-form__errorbox-item, .t-form__errorbox-text"),
    ]
      .filter((node) => node.textContent.trim() && window.getComputedStyle(node).display !== "none")
      .map((node) => node.textContent.trim());

    const poll = window.setInterval(() => {
      if (done) {
        window.clearInterval(poll);
        return;
      }
      const errors = tildaErrors();
      if (errors.length > 0 || nativeForm.classList.contains("js-send-form-error")) {
        window.clearInterval(poll);
        console.error("[заявка] Тильда не приняла форму:", errors.join(" | ") || "без текста");
        finish("error");
      }
    }, 250);

    timer = window.setTimeout(() => {
      window.clearInterval(poll);
      console.error("[заявка] Тильда не ответила за 8 секунд.");
      finish("timeout");
    }, TILDA_TIMEOUT_MS);
  });


  /* --------------------------------------------------------------------------
     7. ОТПРАВКА ЗАЯВКИ
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

    // Своя проверка полей. Возвращает первое поле с ошибкой и текст подсказки.
    //   имя — не короче двух букв;
    //   телефон — от 10 до 15 цифр (плюс, скобки и дефисы не мешают);
    //   почта — не обязательна, но если заполнена, должна быть похожа на адрес.
    const PHONE_ALLOWED = /^[\d\s()+\-]+$/;
    const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const checkField = (input) => {
      const value = String(input.value || "").trim();

      if (input.name === "Name") {
        if (!value) return "Напишите, как к вам обращаться";
        if (value.replace(/[^\p{L}]/gu, "").length < 2) return "Имя слишком короткое";
      }

      if (input.name === "Phone") {
        if (!value) return "Укажите телефон — по нему мы свяжемся с вами";
        const digits = value.replace(/\D/g, "");
        const russian = value.startsWith("+7");
        if (!PHONE_ALLOWED.test(value) || digits.length < 10 || digits.length > 15) {
          return "Проверьте телефон: нужно 10–15 цифр, например +7 (900) 000-00-00";
        }
        if (russian && digits.length !== 11) {
          return "Проверьте телефон: в российском номере 10 цифр после +7";
        }
      }

      if (input.name === "Email" && value && !EMAIL_LIKE.test(value)) {
        return "Проверьте адрес почты — например, name@example.com";
      }

      return "";
    };

    const validate = () => {
      let firstInvalid = null;
      let firstMessage = "";

      form.querySelectorAll(".lead-form_input").forEach((input) => {
        const message = checkField(input);
        input.setAttribute("aria-invalid", String(Boolean(message)));
        if (message && !firstInvalid) {
          firstInvalid = input;
          firstMessage = message;
        }
      });

      return firstInvalid ? { input: firstInvalid, message: firstMessage } : null;
    };

    // Снимаем подсветку, как только человек начал править поле
    form.querySelectorAll(".lead-form_input").forEach((input) => {
      input.addEventListener("input", () => input.removeAttribute("aria-invalid"));
    });

    // Маска телефона. Российский номер собирается в «+7 (900) 123-45-67»:
    // можно начать с 8, с +7 или сразу с 9. Номер другой страны — с плюса,
    // тогда оставляем только цифры без раскладки по скобкам.
    const formatPhone = (raw) => {
      const trimmed = raw.replace(/[^\d+()\s-]/g, "").trim();
      if (!trimmed || trimmed === "+") return trimmed;

      let digits = trimmed.replace(/\D/g, "");
      const foreign = trimmed.startsWith("+") && !digits.startsWith("7");
      if (foreign) return `+${digits.slice(0, 15)}`;

      if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
      if (!digits.startsWith("7")) digits = `7${digits}`;
      digits = digits.slice(0, 11);

      let out = "+7";
      if (digits.length > 1) out += ` (${digits.slice(1, 4)}`;
      if (digits.length >= 4) out += ")";
      if (digits.length > 4) out += ` ${digits.slice(4, 7)}`;
      if (digits.length > 7) out += `-${digits.slice(7, 9)}`;
      if (digits.length > 9) out += `-${digits.slice(9, 11)}`;
      return out;
    };

    form.querySelectorAll('.lead-form_input[type="tel"]').forEach((input) => {
      // Буквы и прочие символы в поле не попадают: пропускаем только цифры
      // и плюс. Вставка из буфера тоже чистится — в ней могут быть пробелы.
      input.addEventListener("beforeinput", (event) => {
        if (typeof event.data !== "string") return;
        if (!/^[\d+]+$/.test(event.data.replace(/[\s()\-]/g, ""))) event.preventDefault();
      });

      input.addEventListener("input", (event) => {
        // При стирании не дорисовываем скобки и дефисы обратно — иначе
        // символ не удалить. Только вычищаем лишнее; доформатируем при
        // следующем вводе или на blur.
        if (event.inputType && event.inputType.startsWith("delete")) {
          const cleaned = input.value.replace(/[^\d+()\s-]/g, "");
          if (cleaned !== input.value) input.value = cleaned;
          return;
        }
        const formatted = formatPhone(input.value);
        if (formatted !== input.value) input.value = formatted;
      });
      input.addEventListener("blur", () => {
        const formatted = formatPhone(input.value);
        if (formatted !== input.value) input.value = formatted;
      });
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
      const phone = String(values.get("Phone") || "").trim();
      const messenger = String(values.get("Messenger") || "");

      setTildaField(nativeForm, "Name", String(values.get("Name") || "").trim());
      setTildaField(nativeForm, "Email", String(values.get("Email") || "").trim());
      setTildaPhone(nativeForm, phone);
      await setTildaMessenger(nativeForm, messenger, phone);
      setTildaField(nativeForm, "Messenger", messenger);

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

      const problem = validate();
      if (problem) {
        setStatus(problem.message, "error");
        problem.input.focus();
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
})();
