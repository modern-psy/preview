/* ============================================================================
   ПОВЕДЕНИЕ СТРАНИЦЫ «ПРАЙС-ЛИСТ КУРСОВ»
   ============================================================================

   Скрипт делает четыре вещи:
     1) загружает прайс из Public API (/api/public/pricelist). Если API ещё
        не умеет этот адрес (старая версия), берёт каталог /api/public/courses
        и показывает только ближайшее повышение — с предупреждением в шапке;
     2) рисует карточки курсов по шаблонам из index.html: поток → тариф →
        лесенка ступеней цены (прошло / сейчас / впереди);
     3) поиск по названию и фильтр по типу программы;
     4) режим одного курса: ?course=slug — только эта карточка, заголовок
        страницы = название курса. Кнопка «Скопировать ссылку» кладёт адрес
        такой страницы в буфер обмена.

   Даты считаются по Москве: ступень «с 24 сентября» в CMS хранится как
   23 сентября 21:00 UTC, и именно так её показываем.

   ПОРЯДОК РАЗДЕЛОВ
     0. Общее
     1. Форматирование: рубли и даты
     2. Цены: выбор цены продажи, сборка лесенки
     3. Загрузка данных
     4. Отрисовка карточек
     5. Поиск и фильтры
     6. Копирование ссылки
     7. Запуск
   ========================================================================= */

(function () {
  "use strict";

  /* -------------------------------------------------------------------------
     0. ОБЩЕЕ
     ------------------------------------------------------------------------- */

  const page = document.querySelector("[data-price-page]");
  if (!page) return;

  const apiMeta = document.querySelector('meta[name="public-api-url"]');
  const API = ((apiMeta && apiMeta.content) || "").replace(/\/+$/, "");
  const MSK = "Europe/Moscow";
  const TIMEOUT_MS = 10000;

  const params = new URLSearchParams(window.location.search);
  const singleSlug = (params.get("course") || "").trim();

  const els = {
    heading: page.querySelector("[data-heading]"),
    singleLink: page.querySelector("[data-single-link]"),
    singleUrl: page.querySelector("[data-single-url]"),
    singleCopy: page.querySelector("[data-single-link] [data-copy]"),
    description: page.querySelector("[data-description]"),
    status: page.querySelector("[data-status]"),
    back: page.querySelector("[data-back]"),
    toolbar: page.querySelector("[data-toolbar]"),
    search: page.querySelector("[data-search]"),
    filters: page.querySelector("[data-filters]"),
    list: page.querySelector("[data-list]"),
    empty: page.querySelector("[data-empty]"),
    error: page.querySelector("[data-error]"),
    retry: page.querySelector("[data-retry]"),
  };

  const tpl = {
    course: page.querySelector("[data-course-template]"),
    stream: page.querySelector("[data-stream-template]"),
    tariff: page.querySelector("[data-tariff-template]"),
    step: page.querySelector("[data-step-template]"),
  };

  const state = {
    courses: [],
    generatedAt: null,
    fallback: false, // true — данные из старого каталога, лесенка неполная
    query: "",
    level: "all",
  };

  const OTHER_LEVEL = "Другое";
  const PROMO_FILTER = "promo"; // ключ фильтра «Курс месяца»

  /* -------------------------------------------------------------------------
     1. ФОРМАТИРОВАНИЕ
     ------------------------------------------------------------------------- */

  // 20000 → «20 000 ₽», 0 → «Бесплатно»
  function rub(value) {
    if (value == null || isNaN(Number(value))) return null;
    if (Number(value) === 0) return "Бесплатно";
    try {
      return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
      }).format(Number(value));
    } catch (e) {
      return Number(value).toLocaleString("ru-RU") + " ₽";
    }
  }

  // ISO-момент → «24 сентября» (по Москве; год добавляется, если не текущий).
  // shiftMs — сдвиг: −1 мс даёт «до 23 сентября» для конца предыдущей цены.
  function day(iso, shiftMs) {
    if (!iso) return null;
    const d = new Date(new Date(iso).getTime() + (shiftMs || 0));
    if (isNaN(d.getTime())) return null;
    const opts = { day: "numeric", month: "long", timeZone: MSK };
    const yearOf = (x) => Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: MSK }).format(x));
    if (yearOf(d) !== yearOf(new Date())) opts.year = "numeric";
    return noYearSuffix(new Intl.DateTimeFormat("ru-RU", opts).format(d));
  }

  // Браузер пишет «19 января 2027 г.» — «г.» убираем
  function noYearSuffix(text) {
    return String(text).replace(/\s*г\.(?=,|\s|$)/g, "");
  }

  // Дата без времени «2027-01-19» → «19 января 2027»
  function dateOnly(ymd) {
    if (!ymd) return null;
    const d = new Date(ymd + "T12:00:00+03:00");
    if (isNaN(d.getTime())) return null;
    const opts = { day: "numeric", month: "long", timeZone: MSK };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
    return noYearSuffix(new Intl.DateTimeFormat("ru-RU", opts).format(d));
  }

  // «12 сентября 2026, 14:03» (по Москве)
  function dateTime(iso) {
    const d = iso ? new Date(iso) : new Date();
    const date = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: MSK }).format(d);
    const time = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: MSK }).format(d);
    return noYearSuffix(date) + ", " + time;
  }

  function plural(n, one, few, many) {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  /* -------------------------------------------------------------------------
     2. ЦЕНЫ
     ------------------------------------------------------------------------- */

  // Цена продажи — при единовременной оплате. Если её нет — единственная цена.
  function salePrice(o) {
    if (!o) return null;
    if (o.fullPaymentPrice != null) return o.fullPaymentPrice;
    if (o.currentPrice != null) return o.currentPrice;
    return o.price != null ? o.price : null;
  }

  // Та же цена до скидки «Курс месяца» (null, если акции нет)
  function salePriceBefore(o) {
    if (!o) return null;
    if (o.fullPaymentPrice != null) {
      return o.fullPaymentPriceBeforeDiscount != null ? o.fullPaymentPriceBeforeDiscount : null;
    }
    return o.priceBeforeDiscount != null ? o.priceBeforeDiscount : null;
  }

  /**
   * Собрать строки таблицы для потока без тарифов или для одного тарифа.
   * Строка: { state, label, now, value, old, note }.
   *
   * Источник ступеней:
   *   • priceSchedule из /pricelist — вся лесенка со state у каждой ступени;
   *   • если его нет (старый API) — одна ступень из nextPriceChange.
   */
  function buildLadder(o) {
    const steps = Array.isArray(o.priceSchedule)
      ? o.priceSchedule
      : o.nextPriceChange && o.nextPriceChange.at
        ? [{ at: o.nextPriceChange.at, price: o.nextPriceChange.price, fullPaymentPrice: o.nextPriceChange.fullPaymentPrice, note: null, state: "upcoming" }]
        : [];

    const anyPassed = steps.some((s) => s.state === "past" || s.state === "active");

    // Базовая цена — до первой ступени. В старом каталоге отдельного поля
    // нет: берём текущую (до скидки), она и есть база, раз ступени только впереди.
    let base = o.basePrice;
    let baseFull = o.baseFullPaymentPrice;
    if (base === undefined) {
      base = o.priceBeforeDiscount != null ? o.priceBeforeDiscount : (o.currentPrice != null ? o.currentPrice : o.price);
      baseFull = o.fullPaymentPriceBeforeDiscount != null ? o.fullPaymentPriceBeforeDiscount : o.fullPaymentPrice;
    }

    // «в рассрочку 210 000 ₽» — только если есть отдельная единовременная цена
    const installmentNote = (full, price) => (full != null && price != null ? "в рассрочку " + rub(price) : null);
    const rows = [];

    if (base != null || baseFull != null) {
      const first = steps[0];
      rows.push({
        state: anyPassed ? "past" : "active",
        label: first ? "до " + day(first.at, -1) : "текущая цена",
        now: !anyPassed,
        value: baseFull != null ? baseFull : base,
        note: installmentNote(baseFull, base),
      });
    }

    steps.forEach((s) => {
      rows.push({
        state: s.state,
        label: "с " + day(s.at),
        now: s.state === "active",
        value: s.fullPaymentPrice != null ? s.fullPaymentPrice : s.price,
        note: [installmentNote(s.fullPaymentPrice, s.price), s.note || null].filter(Boolean).join(" · ") || null,
      });
    });

    // На действующую ступень накладываем скидку «Курс месяца», если она есть:
    // API уже посчитал цену со скидкой, лесенка хранит цену без неё.
    // Сама акция подписана плашкой в шапке карточки — здесь не повторяем.
    const active = rows.find((r) => r.state === "active");
    if (active) {
      const before = salePriceBefore(o);
      if (before != null) {
        active.old = before;
        active.value = salePrice(o);
      }
    }

    return rows;
  }

  /* -------------------------------------------------------------------------
     3. ЗАГРУЗКА ДАННЫХ
     ------------------------------------------------------------------------- */

  function fetchJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    return fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .finally(() => clearTimeout(timer));
  }

  // Потоки, которые можно продавать (как в расписании и в /pricelist)
  const OPEN_STATUSES = ["Идет набор", "Последний шанс", "Лист ожидания", "Старт в любое время"];

  // Старый каталог → тот же вид, что у /pricelist (один ближайший поток у курса)
  function adaptCatalog(list) {
    return (Array.isArray(list) ? list : [])
      .filter((c) => c && c.nearestStream && OPEN_STATUSES.includes(c.nearestStream.status))
      .map((c) => ({
        slug: c.slug,
        title: c.title,
        subtitle: null,
        educationLevel: c.educationLevel,
        url: null,
        hours: null,
        documents: c.documents || [],
        promo: c.promo || { active: false },
        streams: [c.nearestStream],
      }))
      .sort((a, b) => String(a.title).localeCompare(String(b.title), "ru"));
  }

  function load() {
    setStatus("Загружаем цены из CMS…");
    els.error.hidden = true;
    els.list.innerHTML = "";

    return fetchJson(API + "/api/public/pricelist")
      .then((data) => {
        state.courses = data.courses || [];
        state.generatedAt = data.generatedAt || null;
        state.fallback = false;
      })
      .catch((err) => {
        console.warn("[прайс] /pricelist недоступен, беру /courses:", err.message);
        return fetchJson(API + "/api/public/courses").then((list) => {
          state.courses = adaptCatalog(list);
          state.generatedAt = null;
          state.fallback = true;
        });
      })
      .then(() => {
        buildFilters();
        render();
      })
      .catch((err) => {
        console.error("[прайс] не удалось загрузить данные:", err);
        setStatus("Данные не загрузились", "is-error");
        els.error.hidden = false;
        els.toolbar.hidden = true;
      });
  }

  function setStatus(text, modifier) {
    els.status.className = "header_status" + (modifier ? " " + modifier : "");
    els.status.textContent = text;
  }

  /* -------------------------------------------------------------------------
     4. ОТРИСОВКА
     ------------------------------------------------------------------------- */

  function clone(template) {
    return template.content.firstElementChild.cloneNode(true);
  }

  function pill(text, modifier) {
    const li = document.createElement("li");
    li.className = "meta-pill_component" + (modifier ? " " + modifier : "");
    li.textContent = text;
    return li;
  }

  function statusModifier(status) {
    if (status === "Последний шанс") return "is-accent";
    if (status === "Лист ожидания") return "is-muted";
    if (status === "Старт в любое время") return "is-soft";
    return "";
  }

  // Адрес папки страницы со слэшем на конце: /price-list/ .
  // Открыть страницу могут и как /price-list (без слэша), и как /price-list/index.html —
  // относительный «./» в первом случае потерял бы папку, поэтому считаем сами.
  function pageBase() {
    let path = window.location.pathname;
    if (/\/index\.html$/.test(path)) path = path.replace(/index\.html$/, "");
    else if (!path.endsWith("/")) path += "/";
    return path;
  }

  function coursePath(slug) {
    return pageBase() + "?course=" + encodeURIComponent(slug);
  }

  function courseUrl(slug) {
    return window.location.origin + coursePath(slug);
  }

  function renderStep(row) {
    const tr = clone(tpl.step);
    tr.classList.add("is-" + row.state);
    tr.querySelector("[data-step-label]").textContent = row.label;
    tr.querySelector("[data-step-now]").hidden = !row.now;
    tr.querySelector("[data-step-value]").textContent = rub(row.value) || "—";

    const old = tr.querySelector("[data-step-old]");
    if (row.old != null) {
      old.textContent = rub(row.old);
      old.hidden = false;
    }

    tr.querySelector("[data-step-sub]").textContent = row.note || "";
    return tr;
  }

  function renderTariff(o, title) {
    const node = clone(tpl.tariff);
    if (title) {
      node.querySelector("[data-tariff-title]").textContent = title;
      node.querySelector("[data-tariff-title]").hidden = false;
    }

    const table = node.querySelector("[data-table]");
    const body = node.querySelector("[data-ladder]");
    const rows = buildLadder(o);
    if (!rows.length) {
      const tr = clone(tpl.step);
      tr.classList.add("is-none");
      tr.querySelector("[data-step-label]").textContent = "цена";
      tr.querySelector("[data-step-now]").hidden = true;
      tr.querySelector("[data-step-value]").textContent = "не назначена";
      body.appendChild(tr);
    } else {
      rows.forEach((row) => body.appendChild(renderStep(row)));
    }
    if (!rows.some((r) => r.note)) table.classList.add("is-no-notes");

    // Рассрочка помесячно: «Рассрочка 4 мес. — 11 000 ₽/мес».
    // Общая цена в рассрочку уже подписана в строке, здесь не дублируем.
    const inst = node.querySelector("[data-installment]");
    if (o.installmentMonths && o.installmentPerMonth != null) {
      inst.textContent = "Рассрочка " + o.installmentMonths + " мес. — " + rub(o.installmentPerMonth) + "/мес";
      inst.hidden = false;
    }
    return node;
  }

  function renderStream(stream, course, showLabel) {
    const node = clone(tpl.stream);
    const p = stream.pricing || {};

    if (showLabel && stream.label) {
      const h = node.querySelector("[data-stream-label]");
      h.textContent = stream.label;
      h.hidden = false;
    }

    const meta = node.querySelector("[data-stream-meta]");
    if (stream.startDate) meta.appendChild(pill("Старт " + dateOnly(stream.startDate)));
    if (stream.schedule) meta.appendChild(pill(stream.schedule));
    if (stream.status) meta.appendChild(pill(stream.status, statusModifier(stream.status)));
    if (!meta.children.length) meta.hidden = true;

    const tariffs = node.querySelector("[data-tariffs]");
    if (p.hasTariffs && Array.isArray(p.tariffs) && p.tariffs.length) {
      p.tariffs.forEach((t) => tariffs.appendChild(renderTariff(t, t.title)));
    } else {
      tariffs.appendChild(renderTariff(p, null));
    }

    const notes = node.querySelector("[data-notes]");
    if (p.bookingPrice != null) {
      const li = document.createElement("li");
      li.textContent = "Бронь места — " + rub(p.bookingPrice);
      notes.appendChild(li);
    }
    if (notes.children.length) notes.hidden = false;

    return node;
  }

  function renderCourse(course) {
    const card = clone(tpl.course);
    card.id = "course-" + course.slug;

    card.querySelector("[data-level]").textContent = course.educationLevel || OTHER_LEVEL;

    const titleLink = card.querySelector("[data-title-link]");
    titleLink.textContent = course.title;
    titleLink.href = coursePath(course.slug);

    if (course.subtitle) {
      const sub = card.querySelector("[data-subtitle]");
      sub.textContent = course.subtitle;
      sub.hidden = false;
    }

    const meta = card.querySelector("[data-meta]");
    if (course.promo && course.promo.active) {
      meta.appendChild(pill(
        (course.promo.label || "Курс месяца") + " −" + course.promo.discountPercent + "%" +
        (course.promo.until ? " до " + dateOnly(course.promo.until) : ""),
        "is-warning"
      ));
    }
    if (course.hours) meta.appendChild(pill(course.hours + " ак. " + plural(Number(course.hours), "час", "часа", "часов")));
    (course.documents || []).forEach((d) => meta.appendChild(pill(d, "is-soft")));
    if (!meta.children.length) meta.hidden = true;

    const streams = card.querySelector("[data-streams]");
    const list = Array.isArray(course.streams) ? course.streams : [];
    list.forEach((s) => streams.appendChild(renderStream(s, course, list.length > 1)));

    card.querySelector("[data-open]").href = coursePath(course.slug);

    const copy = card.querySelector("[data-copy]");
    copy.addEventListener("click", () => copyLink(courseUrl(course.slug), copy));

    if (course.url) {
      const site = card.querySelector("[data-site-link]");
      site.href = course.url;
      site.hidden = false;
    }

    return card;
  }

  function visibleCourses() {
    const q = state.query.trim().toLowerCase();
    return state.courses.filter((c) => {
      if (singleSlug) return c.slug === singleSlug;
      const level = c.educationLevel || OTHER_LEVEL;
      if (state.level === PROMO_FILTER) {
        if (!(c.promo && c.promo.active)) return false;
      } else if (state.level !== "all" && level !== state.level) {
        return false;
      }
      if (!q) return true;
      return [c.title, c.subtitle, c.slug].some((s) => s && String(s).toLowerCase().includes(q));
    });
  }

  function render() {
    const courses = visibleCourses();
    els.list.innerHTML = "";
    courses.forEach((c) => els.list.appendChild(renderCourse(c)));
    els.empty.hidden = courses.length > 0;

    if (singleSlug) {
      renderSingleHeader(courses[0]);
    } else {
      renderListHeader(courses.length);
      scrollToHash();
    }
  }

  function renderListHeader(shown) {
    const total = state.courses.length;
    const when = "Актуально на " + dateTime(state.generatedAt);
    const count = shown === total
      ? total + " " + plural(total, "курс", "курса", "курсов")
      : "показано " + shown + " из " + total;
    if (state.fallback) {
      setStatus(when + " · " + count + " · показано только ближайшее повышение: API ещё не обновлён до полной лесенки", "is-warning");
    } else {
      setStatus(when + " · " + count);
    }
  }

  function renderSingleHeader(course) {
    page.classList.add("is-single");
    els.toolbar.hidden = true;
    els.back.hidden = false;
    els.back.href = pageBase();

    if (!course) {
      els.heading.textContent = "Курс не найден";
      els.description.textContent = "Такого курса нет в прайсе. Проверьте ссылку или откройте общий список.";
      setStatus("");
      els.empty.hidden = true;
      return;
    }

    document.title = course.title + " — цены и повышения";
    els.singleUrl.textContent = courseUrl(course.slug);
    els.singleUrl.href = coursePath(course.slug);
    els.singleLink.hidden = false;
    if (!els.singleCopy.dataset.bound) {
      els.singleCopy.dataset.bound = "1";
      els.singleCopy.addEventListener("click", () => copyLink(courseUrl(course.slug), els.singleCopy));
    }
    els.heading.textContent = course.title;
    els.description.textContent = [course.educationLevel, course.subtitle].filter(Boolean).join(" · ") ||
      "Цена сейчас и все повышения с датами.";
    const when = "Актуально на " + dateTime(state.generatedAt);
    setStatus(state.fallback ? when + " · показано только ближайшее повышение" : when, state.fallback ? "is-warning" : "");
  }

  // Ссылка вида #course-rft в общем списке — прокрутить к карточке и подсветить
  function scrollToHash() {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const target = document.getElementById(hash) || document.getElementById("course-" + hash);
    if (!target) return;
    target.scrollIntoView({ block: "start" });
    target.classList.add("is-highlighted");
  }

  /* -------------------------------------------------------------------------
     5. ПОИСК И ФИЛЬТРЫ
     ------------------------------------------------------------------------- */

  function buildFilters() {
    els.filters.innerHTML = "";
    if (singleSlug) return;

    const counts = new Map();
    state.courses.forEach((c) => {
      const level = c.educationLevel || OTHER_LEVEL;
      counts.set(level, (counts.get(level) || 0) + 1);
    });

    const levels = Array.from(counts.keys()).sort((a, b) => counts.get(b) - counts.get(a));
    const items = [["all", "Все", state.courses.length]].concat(levels.map((l) => [l, l, counts.get(l)]));

    // «Курс месяца» — отдельный фильтр, если акция сейчас идёт хоть у одного курса
    const promoCourses = state.courses.filter((c) => c.promo && c.promo.active);
    if (promoCourses.length) {
      const label = promoCourses[0].promo.label || "Курс месяца";
      items.push([PROMO_FILTER, label, promoCourses.length]);
    }

    items.forEach(([key, label, count]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter_chip";
      btn.dataset.level = key;
      if (key === PROMO_FILTER) btn.classList.add("is-promo");
      btn.setAttribute("aria-pressed", String(key === state.level));
      btn.append(label + " ");
      const c = document.createElement("span");
      c.className = "filter_chip-count";
      c.textContent = String(count);
      btn.appendChild(c);
      btn.addEventListener("click", () => {
        state.level = key;
        els.filters.querySelectorAll(".filter_chip").forEach((b) => {
          b.setAttribute("aria-pressed", String(b.dataset.level === key));
        });
        render();
      });
      els.filters.appendChild(btn);
    });
  }

  let searchTimer = null;
  els.search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = els.search.value;
      render();
    }, 120);
  });

  /* -------------------------------------------------------------------------
     6. КОПИРОВАНИЕ ССЫЛКИ
     ------------------------------------------------------------------------- */

  function copyLink(url, button) {
    const label = button.querySelector("[data-copy-label]");
    const done = () => {
      button.classList.add("is-copied");
      label.textContent = "Скопировано ✓";
      setTimeout(() => {
        button.classList.remove("is-copied");
        label.textContent = "Скопировать ссылку";
      }, 2000);
    };
    const fallback = () => {
      // Старые браузеры и http без TLS: временное поле + execCommand
      const input = document.createElement("input");
      input.value = url;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(input);
      if (ok) done();
      else window.prompt("Скопируйте ссылку вручную:", url);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(done, fallback);
    } else {
      fallback();
    }
  }

  /* -------------------------------------------------------------------------
     7. ЗАПУСК
     ------------------------------------------------------------------------- */

  els.retry.addEventListener("click", () => {
    els.toolbar.hidden = !!singleSlug;
    load();
  });

  if (!API) {
    setStatus("Не указан адрес API (meta public-api-url)", "is-error");
    els.error.hidden = false;
    return;
  }

  load();
})();
