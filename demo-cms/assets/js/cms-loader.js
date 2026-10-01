/**
 * cms-loader.js — «мостик» между страницей и нашим API.
 *
 * Что он делает: спрашивает у API (адрес указан в index.html, строка
 * <meta name="public-api-url" ...>) данные курса и подставляет их на страницу:
 * цену, дату старта, расписание, статус набора, скидку, обложку, преподавателей.
 *
 * Как код находит, КУДА подставлять: по меткам в HTML вида
 *   <span data-cms="price" data-course="trf-...">Стоимость уточняется</span>
 * data-cms  — ЧТО подставить (price, start-date, ...)
 * data-course — слаг курса (его «имя» в CMS, видно в админке в поле slug)
 *
 * Если API недоступен или поля нет — на странице остаётся текст-«запаска»,
 * ничего не ломается.
 *
 * ЦЕНЫ — четыре метки, и вот чем они отличаются:
 *   price             — главная цена: при единовременной оплате. На неё
 *                       действуют акции.
 *   old-price         — та же цена ДО скидки (её зачёркиваем). Пустая, если
 *                       акции нет.
 *   installment-price — «или 8 500 ₽/мес в рассрочку (24 мес.)».
 *   installment-total — «204 000 ₽ в рассрочку»: полная стоимость частями.
 *   Акции на рассрочку НЕ действуют — так решено, это не ошибка.
 *
 * 🔴 Весь этот файл — «шестерёнки». Менять его не нужно: тексты меняются
 * в index.html, а цены и даты — в админке CMS.
 */
(function () {
  'use strict';

  // Адрес API берём из index.html (тег <meta name="public-api-url">).
  var API_BASE = (function () {
    var meta = document.querySelector('meta[name="public-api-url"]');
    return (meta && meta.content ? meta.content : '').replace(/\/+$/, '');
  })();

  // Небольшая задержка, чтобы значения появлялись плавно, без «дёрганья».
  var MIN_VISUAL_DELAY = 300;
  // Сколько ждём ответа API, прежде чем оставить «запаски» (8 секунд).
  var FETCH_TIMEOUT = 8000;

  // Статусы, при которых на курс МОЖНО записаться (значок будет зелёным).
  var OPEN_STATUSES = ['Идет набор', 'Последний шанс', 'Старт в любое время'];

  // --- Красивое отображение чисел и дат ---

  // 20000 -> «20 000 ₽»
  function formatPrice(value) {
    if (value == null || value === '') return null;
    try {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency', currency: 'RUB', maximumFractionDigits: 0,
      }).format(Number(value));
    } catch (e) {
      return Number(value).toLocaleString('ru-RU') + ' ₽';
    }
  }

  // «2027-01-19» -> «19 января 2027 г.»
  function formatDate(iso) {
    if (!iso) return null;
    var d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
    }).format(d);
  }

  /*
    🔴 ГЛАВНАЯ ЦЕНА КУРСА — та, что действует при единовременной оплате
    («цена продажи»). Именно она стоит крупно на странице и именно на неё
    действуют акции. Цена в рассрочку живёт отдельной строкой и на скидки
    не реагирует — так решено в CMS, менять тут ничего не нужно.

    Где её взять в ответе API:
      • если заполнена fullPaymentPrice — это она;
      • если нет — значит у курса цена одна, и она же цена продажи.
  */
  function salePrice(o) {
    if (!o) return null;
    if (o.fullPaymentPrice != null) return o.fullPaymentPrice;
    if (o.currentPrice != null) return o.currentPrice;
    return o.price != null ? o.price : null;
  }
  // Та же цена ДО скидки акции (её зачёркиваем). Нет акции — null.
  function salePriceBefore(o) {
    if (!o) return null;
    if (o.fullPaymentPrice != null) {
      return o.fullPaymentPriceBeforeDiscount != null ? o.fullPaymentPriceBeforeDiscount : null;
    }
    return o.priceBeforeDiscount != null ? o.priceBeforeDiscount : null;
  }

  // Достаём из ответа API «главные» цены ближайшего потока.
  // У курсов с тарифами берём самый дешёвый тариф и показываем «от ...».
  function mainPricing(data) {
    var stream = data.nearestStream;
    var p = stream && stream.pricing ? stream.pricing : null;
    if (!p) return null;

    if (p.hasTariffs) {
      var cheapest = null; // самый дешёвый — сравниваем по цене продажи
      (p.tariffs || []).forEach(function (t) {
        if (salePrice(t) == null) return;
        if (cheapest == null || salePrice(t) < salePrice(cheapest)) cheapest = t;
      });
      if (!cheapest) return null;
      return {
        from: true, // цена «от ...», потому что тарифов несколько
        price: salePrice(cheapest),
        priceBeforeDiscount: salePriceBefore(cheapest),
        fullPaymentPrice: cheapest.fullPaymentPrice,
        installmentPrice: cheapest.price, // полная стоимость в рассрочку
        installmentPerMonth: cheapest.installmentPerMonth,
        installmentMonths: cheapest.installmentMonths,
      };
    }

    return {
      from: false,
      price: salePrice(p),
      priceBeforeDiscount: salePriceBefore(p),
      fullPaymentPrice: p.fullPaymentPrice,
      installmentPrice: p.currentPrice,
      installmentPerMonth: p.installmentPerMonth,
      installmentMonths: p.installmentMonths,
    };
  }

  // --- Подстановка одного значения в одно место страницы ---
  function applyField(el, type, data) {
    var stream = data.nearestStream || null;
    var money = mainPricing(data);

    switch (type) {
      // Текущая цена (у тарифных курсов — «от ...»)
      case 'price': {
        if (money && money.price != null) {
          setText(el, (money.from ? 'от ' : '') + formatPrice(money.price));
        }
        break;
      }

      // Старая (зачёркнутая) цена — показывается только во время акции
      case 'old-price': {
        if (money && money.priceBeforeDiscount != null && money.priceBeforeDiscount > money.price) {
          setText(el, formatPrice(money.priceBeforeDiscount));
        } else {
          el.textContent = ''; // акции нет — строка прячется сама (CSS)
        }
        break;
      }

      // «или 833 ₽/мес в рассрочку (24 мес.)»
      case 'installment-price': {
        if (money && money.installmentPerMonth != null) {
          var months = money.installmentMonths ? ' (' + money.installmentMonths + ' мес.)' : '';
          setText(el, 'или ' + formatPrice(money.installmentPerMonth) + '/мес в рассрочку' + months);
        }
        break;
      }

      // «18 000 ₽ при единовременной оплате».
      // Обычно эта строка остаётся ПУСТОЙ и прячется: главная цена на странице
      // и так единовременная. Текст появится только если цены почему-то разные.
      case 'full-price': {
        if (money && money.fullPaymentPrice != null && money.fullPaymentPrice !== money.price) {
          setText(el, formatPrice(money.fullPaymentPrice) + ' при единовременной оплате');
        }
        break;
      }

      // «204 000 ₽ в рассрочку» — полная стоимость при оплате частями.
      // Скидки на неё не действуют никогда.
      case 'installment-total': {
        if (money && money.installmentPrice != null && money.installmentPrice !== money.price) {
          setText(el, formatPrice(money.installmentPrice) + ' в рассрочку');
        }
        break;
      }

      // Строка про акцию «Курс месяца»
      case 'discount': {
        if (data.promo && data.promo.active) {
          var label = data.promo.label || 'Курс месяца';
          var until = formatDate(data.promo.until);
          setText(el, label + ' — скидка ' + data.promo.discountPercent + '%' + (until ? ' до ' + until : ''));
        }
        break;
      }

      // Дата старта ближайшего потока
      case 'start-date': {
        var sd = stream ? formatDate(stream.startDate) : null;
        if (sd) setText(el, sd);
        break;
      }

      // Расписание ближайшего потока (текст из CMS, например «По вторникам 12:00-14:00»)
      case 'schedule': {
        if (stream && stream.schedule) setText(el, stream.schedule);
        break;
      }

      // Статус набора («Идет набор», «Лист ожидания» и т.д.)
      case 'sales-status': {
        var status = stream && stream.status ? stream.status : null;
        if (status) {
          setText(el, status);
          var open = OPEN_STATUSES.indexOf(status) !== -1;
          el.setAttribute('data-sales', open ? 'open' : 'closed');
        }
        break;
      }

      // Обложка курса из CMS (поле catalog_cover)
      case 'cover': {
        applyImage(el, data.cover);
        break;
      }

      // Карточки преподавателей — собираются целиком из CMS
      case 'teachers': {
        applyTeachers(el, data.teachers);
        break;
      }

      default:
        // Неизвестная метка — тихо пропускаем, «запаска» остаётся.
        break;
    }
  }

  function setText(el, text) {
    el.textContent = text;
    markReady(el);
  }

  function applyImage(el, media) {
    if (!media || !media.url) { markReady(el); return; }
    if (el.tagName === 'IMG') {
      el.src = media.url;
      if (media.alt) el.alt = media.alt;
    } else {
      el.style.backgroundImage = 'url("' + media.url + '")';
    }
    markReady(el);
  }

  // Рисуем карточки преподавателей: фото, имя, роль, короткое описание.
  function applyTeachers(container, teachers) {
    if (!Array.isArray(teachers) || !teachers.length) { markReady(container); return; }
    var frag = document.createDocumentFragment();
    teachers.forEach(function (t) {
      if (!t || !t.name) return;
      var card = document.createElement('article');
      card.className = 'card teacher';

      if (t.photo && t.photo.url) {
        var img = document.createElement('img');
        img.className = 'teacher__photo';
        img.src = t.photo.url;
        img.alt = t.photo.alt || t.name;
        img.loading = 'lazy';
        card.appendChild(img);
      }

      var name = document.createElement('h3');
      name.textContent = t.name;
      card.appendChild(name);

      if (t.role) {
        var role = document.createElement('p');
        role.className = 'teacher__role';
        role.textContent = t.role;
        card.appendChild(role);
      }

      if (t.bio) {
        var bio = document.createElement('p');
        bio.className = 'teacher__bio';
        bio.textContent = t.bio;
        card.appendChild(bio);
      }

      frag.appendChild(card);
    });
    container.innerHTML = '';
    container.appendChild(frag);
    markReady(container);
  }

  function markLoading(el) { el.classList.add('cms-loading'); }
  function markReady(el) {
    el.classList.remove('cms-loading');
    el.classList.add('cms-ready');
  }

  // --- Обновляем невидимую «карточку курса» для поисковиков (JSON-LD) ---
  // Важно: сюда подставляются ТЕ ЖЕ цены и даты, что видит человек.
  function updateJsonLd(data) {
    var node = document.getElementById('course-jsonld');
    if (!node) return;
    var ld;
    try { ld = JSON.parse(node.textContent); } catch (e) { ld = { '@context': 'https://schema.org', '@type': 'Course' }; }

    var stream = data.nearestStream || null;
    var money = mainPricing(data);

    var offer = { '@type': 'Offer', priceCurrency: 'RUB' };
    if (money && money.price != null) offer.price = String(money.price);
    var status = stream && stream.status ? stream.status : null;
    offer.availability = (status && OPEN_STATUSES.indexOf(status) !== -1)
      ? 'https://schema.org/InStock'
      : 'https://schema.org/SoldOut';
    ld.offers = offer;

    if (stream && stream.startDate) {
      ld.hasCourseInstance = [{
        '@type': 'CourseInstance',
        courseMode: 'online',
        startDate: stream.startDate,
      }];
    }
    node.textContent = JSON.stringify(ld);
  }

  // --- Запрос данных курса у API (с ограничением по времени) ---
  function fetchCourse(slug) {
    var url = API_BASE + '/api/public/course/' + encodeURIComponent(slug);
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT);
    return fetch(url, { headers: { 'Accept': 'application/json' }, signal: controller.signal })
      .then(function (res) {
        clearTimeout(timer);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .catch(function (err) { clearTimeout(timer); throw err; });
  }

  // --- Главный запуск: находим все метки и наполняем их данными ---
  function init() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-cms][data-course]'));
    if (!nodes.length) return;
    if (!API_BASE) {
      console.warn('[cms-loader] meta[name="public-api-url"] не задан — оставляю fallback-значения.');
      return;
    }

    // Группируем метки по курсу: один курс = один запрос к API.
    var byCourse = {};
    nodes.forEach(function (el) {
      var slug = el.getAttribute('data-course');
      (byCourse[slug] = byCourse[slug] || []).push(el);
      markLoading(el);
    });

    var startedAt = Date.now();

    Object.keys(byCourse).forEach(function (slug) {
      var els = byCourse[slug];
      fetchCourse(slug)
        .then(function (data) {
          var wait = Math.max(0, MIN_VISUAL_DELAY - (Date.now() - startedAt));
          setTimeout(function () {
            els.forEach(function (el) {
              try { applyField(el, el.getAttribute('data-cms'), data); }
              catch (e) { console.error('[cms-loader] поле не подставлено:', el, e); markReady(el); }
            });
            updateJsonLd(data);
          }, wait);
        })
        .catch(function (err) {
          console.error('[cms-loader] данные курса "' + slug + '" не загружены:', err);
          // «Запаски» остаются как есть — просто убираем полупрозрачность.
          els.forEach(markReady);
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
