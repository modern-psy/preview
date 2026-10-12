// Собрано build.mjs: данные сценариев из data/ и page.js. Править исходники и пересобирать.
window.PRICING_SCENARIOS = {"scenarios":[{"n":1,"id":"single","name":"Одна цена и повышение","note":"Самый частый случай: 27 из 33 платных курсов с открытым набором (прайс на 12 октября). Человеку нужны цена, дата старта и повод не откладывать.","when":"Один поток, без тарифов. Цена растёт по лесенке, показываем одну ближайшую ступень.","promoNote":"Жёлтая плашка «−10 % до 31 октября», скидка входит в «Выгоду».","cms":"Есть","first":"Цена и дата, до которой она действует","course":{"slug":"schema-therapy","title":"Схема-терапия","short":"Схема-терапия","level":"Повышение квалификации","description":"Станет отличным дополнением к базовой КБТ-терапии, если клиент недостаточно отвечает на стандартные протоколы работы."},"streams":[{"id":"схематерапия4февраля","label":"Схема-терапия 4 февраля","short":"4 февраля 2027","start":"4 февраля 2027","status":"Идет набор"}],"items":[{"id":"course","kind":"single","name":"Схема-терапия","cmsNames":[],"short":"Схема-терапия","sub":null,"description":null,"includes":[],"requires":null,"parts":[],"prices":{"схематерапия4февраля":{"list":50000,"once":null,"months":24,"perMonth":2083,"perMonthSource":"catalog","next":{"label":"22 декабря","list":60000,"once":null},"free":false}}}],"addons":[],"recommended":null,"promo":null,"booking":null,"waitlist":null,"source":["CMS: schema-therapy"]},{"n":2,"id":"installment","name":"Рассрочка или оплата сразу","note":"Официальная цена — в рассрочку, оплата сразу — выгода от неё. Под ценой одна строка: «Выгода 28 000 ₽ при оплате сразу · или в рассрочку 7 000 ₽/мес на 24 мес», ниже — когда цена вырастет.","when":"У потока две цены: при оплате сразу дешевле, в рассрочку дороже, но платёж в месяц небольшой.","promoNote":"Скидка только на оплату сразу и входит в «Выгоду»; рассрочка не меняется.","cms":"Есть","first":"Цена при оплате сразу и выгода","course":{"slug":"kpt","title":"КПТ: Когнитивно-поведенческая терапия. Модель Бека","short":"КПТ, модель Бека","level":"Профессиональная переподготовка","description":"Программа позволит с нуля получить все необходимые навыки для внедрения подхода в свою практику и разработана таким образом, чтобы дать максимальный объём информации без накрутки часов — только профильный контент и много практики."},"streams":[{"id":"кптбек18февраля","label":"КПТ Бек 18 февраля","short":"18 февраля 2027","start":"18 февраля 2027","status":"Идет набор"}],"items":[{"id":"course","kind":"single","name":"КПТ: Когнитивно-поведенческая терапия. Модель Бека","cmsNames":[],"short":"КПТ: Когнитивно-поведенческая терапия. Модель Бека","sub":null,"description":null,"includes":[],"requires":null,"parts":[],"prices":{"кптбек18февраля":{"list":168000,"once":140000,"months":24,"perMonth":7000,"perMonthSource":"cms","next":{"label":"20 октября","list":180000,"once":150000},"free":false}}}],"addons":[],"recommended":null,"promo":null,"booking":null,"waitlist":null,"source":["CMS: kpt"]},{"n":3,"id":"streams","name":"Несколько потоков","note":"Даты старта переключаются сверху. Поздний поток дешевле, потому что его лесенка только началась, — это видно сразу.","when":"Набор идёт сразу на два старта. У каждого потока своя цена и своя лесенка.","promoNote":"Скидка на каждый поток отдельно.","cms":"Есть","first":"Ближайший поток и разница в цене","course":{"slug":"kpt","title":"КПТ: Когнитивно-поведенческая терапия. Модель Бека","short":"КПТ, модель Бека","level":"Профессиональная переподготовка","description":"Программа позволит с нуля получить все необходимые навыки для внедрения подхода в свою практику и разработана таким образом, чтобы дать максимальный объём информации без накрутки часов — только профильный контент и много практики."},"streams":[{"id":"поток19ноября2026","label":"Поток 19 ноября 2026","short":"19 ноября","start":"19 ноября","status":"Идет набор"},{"id":"кптбек18февраля","label":"КПТ Бек 18 февраля","short":"18 февраля 2027","start":"18 февраля 2027","status":"Идет набор"}],"items":[{"id":"course","kind":"single","name":"КПТ: Когнитивно-поведенческая терапия. Модель Бека","cmsNames":[],"short":"КПТ: Когнитивно-поведенческая терапия. Модель Бека","sub":null,"description":null,"includes":[],"requires":null,"parts":[],"prices":{"поток19ноября2026":{"list":192000,"once":160000,"months":24,"perMonth":8000,"perMonthSource":"catalog","next":{"label":"20 октября","list":204000,"once":170000},"free":false},"кптбек18февраля":{"list":168000,"once":140000,"months":24,"perMonth":7000,"perMonthSource":"cms","next":{"label":"20 октября","list":180000,"once":150000},"free":false}}}],"addons":[],"recommended":null,"promo":null,"booking":null,"waitlist":null,"source":["CMS: kpt"]},{"n":4,"id":"plans","name":"Тарифы и потоки вместе","note":"Даты старта переключаются сверху, внутри — сравнение тарифов галочками с ценой в шапке колонки: видно, за что доплата и что теряешь, если экономишь. Выбора тарифа в блоке нет — на человека не давим, решение в форме.","when":"Два тарифа с разным составом, и оба продаются в двух потоках.","promoNote":"Скидка на каждый тариф, рекомендуемый остаётся самым дорогим.","cms":"Есть, но в мартовском потоке тарифы названы «Пакет стандарт» и «Пакет эксперт», а в декабрьском «Стандарт» и «Эксперт»: сопоставлять по названию нельзя","first":"Чем тарифы различаются и сколько стоит каждый","course":{"slug":"psyeducation","title":"Профессия: Психолог-консультант","short":"Психолог-консультант","level":"Профессиональная переподготовка","description":"Получите профессию психолога-консультанта с дополнительной специализацией в контекстуально-поведенческом подходе на нашем большом курсе профессиональной переподготовки."},"streams":[{"id":"9декабря","label":"9 декабря","short":"9 декабря","start":"9 декабря","status":"Идет набор"},{"id":"пк016марта","label":"ПК0 16 марта","short":"16 марта 2027","start":"16 марта 2027","status":"Идет набор"}],"items":[{"id":"стандарт","kind":"tariff","name":"Стандарт","cmsNames":["Стандарт","Пакет стандарт"],"short":"Стандарт","sub":null,"description":"Освоите профессию психолога-консультанта и подготовитесь к самостоятельной практике.","includes":["Не просто психолог-консультант, а специалист в доказательных подходах","Практика встроена в обучение с первых месяцев","Подготовка к работе с реальными клиентскими запросами","Усиленный клинический блок","15 месяцев постепенного профессионального становления","Поддержка через кураторство, супервизии и профессиональное сообщество"],"requires":null,"parts":[],"prices":{"9декабря":{"list":210000,"once":182000,"months":24,"perMonth":8750,"perMonthSource":"cms","next":null,"free":false},"пк016марта":{"list":253000,"once":220000,"months":24,"perMonth":10542,"perMonthSource":"catalog","next":null,"free":false}}},{"id":"эксперт","kind":"tariff","name":"Эксперт","cmsNames":["Эксперт","Пакет эксперт"],"short":"Эксперт","sub":null,"description":"Получите всё из тарифа «Стандарт», а также персональную поддержку супервизора и курс по продвижению","includes":["Всё из тарифа «Стандарт»","Индивидуальная супервизия","Проверка отчетов и обратная связь по самостоятельной работе в тройках","Супервизорское сопровождение в малых группах, ответы на вопросы в чате на протяжении всего обучения","6 встреч с супервизором на темы по актуальным запросам от мини-группы","Курс по продвижению психологов"],"requires":null,"parts":[],"prices":{"9декабря":{"list":246000,"once":null,"months":24,"perMonth":10250,"perMonthSource":"cms","next":null,"free":false},"пк016марта":{"list":310000,"once":270000,"months":24,"perMonth":12917,"perMonthSource":"catalog","next":null,"free":false}}}],"addons":[],"recommended":"эксперт","promo":null,"booking":5000,"waitlist":null,"source":["CMS: psyeducation","вручную: web-academy/projects/psychologist-consultant/data/pricing.json (макет Figma 14:731)"]},{"n":5,"id":"modules","name":"Модули отдельно и полный курс","note":"Модули заведены в CMS как тарифы. Даты ступеней, часы и состав вписаны в вёрстку вручную.","when":"Курс из ступеней: можно взять одну ступень или весь курс дешевле суммы.","promoNote":"Скидка на каждую ступень и на полный курс; у полного курса «Выгода» считается от суммы ступеней.","cms":"Частично: модули как тарифы; дат, часов и связи «полный курс = ступени» нет","first":"Полный курс и его выгода","course":{"slug":"obuchenie-emdr-dpdg-terapii","title":"Базовый тренинг EMDR/ДПДГ-терапии","short":"EMDR/ДПДГ","level":"Повышение квалификации","description":"Освойте структурированный метод психотерапии, который помогает эффективно работать с травматическим опытом, тревогой и последствиями стрессовых событий"},"streams":[{"id":"emdr19февраля","label":"EMDR 19 февраля","short":"19 февраля 2027","start":"19 февраля 2027","status":"Идет набор"}],"items":[{"id":"основыemdrдпдг","kind":"module","name":"Основы EMDR/ДПДГ","cmsNames":["Основы EMDR/ДПДГ"],"short":"1 ступень","sub":"19–21 февраля · 3 дня обучения","description":"Базовые протоколы EMDR и восемь фаз терапии.","includes":["Теория и практика","Демо-сессии","Работа с фасилитатором в малых группах","5 групповых супервизий"],"requires":null,"parts":[],"prices":{"emdr19февраля":{"list":60000,"once":null,"months":24,"perMonth":2500,"perMonthSource":"catalog","next":{"label":"26 ноября","list":65000,"once":null},"free":false}}},{"id":"обучениеработесосложнымизапросами","kind":"module","name":"Обучение работе со сложными запросами","cmsNames":["Обучение работе со сложными запросами"],"short":"2 ступень","sub":"14–16 мая · 3 дня обучения","description":"Углублённая работа со сложными клиническими случаями.","includes":["Теория и практика","Демо-сессии","Работа с фасилитатором в малых группах","5 групповых супервизий"],"requires":null,"parts":[],"prices":{"emdr19февраля":{"list":60000,"once":null,"months":24,"perMonth":2500,"perMonthSource":"catalog","next":{"label":"26 ноября","list":65000,"once":null},"free":false}}},{"id":"полныйкурс","kind":"bundle","name":"Полный курс","cmsNames":["Полный курс"],"short":"Полный курс","sub":"Обе ступени · 132 академических часа · февраль и май","description":"Полный цикл: от базовых протоколов до сложных клинических случаев.","includes":["Обе ступени обучения","10 групповых супервизий","Сертификат Академии","Сертификат Ассоциации EMDR Россия","Удостоверение о повышении квалификации"],"requires":null,"parts":["основыemdrдпдг","обучениеработесосложнымизапросами"],"prices":{"emdr19февраля":{"list":110000,"once":null,"months":24,"perMonth":4583,"perMonthSource":"catalog","next":{"label":"26 ноября","list":120000,"once":null},"free":false}}}],"addons":[],"recommended":"полныйкурс","promo":null,"booking":5000,"waitlist":null,"source":["CMS: obuchenie-emdr-dpdg-terapii","вручную: apps/tilda/emdr/12-pricing.html (даты ступеней и состав вписаны вручную, в CMS их нет)"]},{"n":6,"id":"addons","name":"Модули и допуслуга","note":"Пакет супервизий есть только на лендинге IFS. Цена «отдельно» условная, её нужно подтвердить.","when":"Кроме модулей курса можно докупить услугу, например пакет супервизий. С курсом она дешевле.","promoNote":"Скидка на модули; на допуслугу не распространяется, пока не решено иначе.","cms":"Нет: допуслуги и цена «с курсом» живут только в вёрстке","first":"Пакет модулей и что можно добавить","course":{"slug":"ifs","title":"IFS: Терапия внутренних семейных систем","short":"IFS","level":"Повышение квалификации","description":"Вы познакомитесь с основами модели IFS, научитесь работать с внутренними частями, энергией Сэлф и конфликтами внутри системы. Освоите протоколы прямого доступа, унаследованного бремени и экстернализации."},"streams":[{"id":"ifs11января","label":"IFS 11 января","short":"11 января 2027","start":"11 января 2027","status":"Идет набор"}],"items":[{"id":"базовыймодуль","kind":"module","name":"Базовый модуль","cmsNames":["Базовый модуль"],"short":"Базовый","sub":"6 занятий · 36 академических часов","description":"Основы модели, работа с частями и энергией Сэлф.","includes":["Основы модели IFS","Работа с внутренними частями","IFS-медитации и демонстрационные сессии"],"requires":null,"parts":[],"prices":{"ifs11января":{"list":35000,"once":null,"months":24,"perMonth":1458,"perMonthSource":"catalog","next":{"label":"20 ноября","list":38000,"once":null},"free":false}}},{"id":"продвинутыймодуль","kind":"module","name":"Продвинутый модуль","cmsNames":["Продвинутый модуль"],"short":"Продвинутый","sub":"6 занятий · 34 академических часа","description":"Прямой доступ, унаследованное бремя, экстернализация.","includes":["Протокол прямого доступа","Работа с унаследованным бременем","Экстернализация"],"requires":"Только после базового модуля","parts":[],"prices":{"ifs11января":{"list":35000,"once":null,"months":24,"perMonth":1458,"perMonthSource":"catalog","next":{"label":"20 ноября","list":38000,"once":null},"free":false}}},{"id":"обамодулявместе","kind":"bundle","name":"Оба модуля вместе","cmsNames":["Оба модуля вместе"],"short":"Оба модуля","sub":"12 занятий · 70 академических часов","description":"Базовый и продвинутый модули одной покупкой.","includes":["Базовый и продвинутый модули","70 академических часов практики","Удостоверение о повышении квалификации"],"requires":null,"parts":["базовыймодуль","продвинутыймодуль"],"prices":{"ifs11января":{"list":55000,"once":null,"months":24,"perMonth":2292,"perMonthSource":"catalog","next":{"label":"20 ноября","list":60000,"once":null},"free":false}}}],"addons":[{"id":"supervision","name":"Пакет из четырёх супервизий","description":"Работа с системой терапевта, клиентскими случаями и вопросами из практики.","includes":["Медитации и упражнения в группе","Разбор реального кейса или вашего случая","Ответы на вопросы по клинической практике в IFS"],"price":10500,"priceSource":"лендинг IFS","priceSeparate":14000,"priceSeparateSource":"условно","requires":"Только вместе с базовым или продвинутым модулем","seatsLeft":15}],"recommended":"обамодулявместе","promo":null,"booking":null,"waitlist":null,"source":["CMS: ifs","вручную: apps/preview/ifs/index.html и apps/tilda/ifs/modules-pricing.html (часы и супервизии в CMS не заведены)"]},{"n":7,"id":"promo","name":"Курс месяца","note":"Здесь акция настоящая: КПТ Оксфорд в октябре. Переключатель «Курс месяца» сверху показывает её на остальных сценариях.","when":"Акция на месяц поверх любого сценария: −10 % до конца месяца при оплате сразу.","promoNote":"Это и есть акция: 160 000 ₽ → 144 000 ₽ при оплате сразу.","cms":"Есть: Monthly Promo с процентом и сроком","first":"Плашка акции со сроком и новая цена","course":{"slug":"cbt-oxford","title":"КПТ: Когнитивно-поведенческая терапия. Оксфордская модель","short":"КПТ, Оксфордская модель","level":"Профессиональная переподготовка","description":"В основе программы лежит видение клиента через Оксфордскую концептуализацию. В отличие от классической модели, здесь используется расширенная структура: учитываются биологические факторы, критические события, защитные механизмы, а также конкретные цели и триггеры клиента."},"streams":[{"id":"поток6ноября2026","label":"Поток 6 ноября 2026","short":"6 ноября","start":"6 ноября","status":"Идет набор"},{"id":"поток15января2027","label":"Поток 15 января 2027","short":"15 января 2027","start":"15 января 2027","status":"Идет набор"}],"items":[{"id":"course","kind":"single","name":"КПТ: Когнитивно-поведенческая терапия. Оксфордская модель","cmsNames":[],"short":"КПТ: Когнитивно-поведенческая терапия. Оксфордская модель","sub":null,"description":null,"includes":[],"requires":null,"parts":[],"prices":{"поток6ноября2026":{"list":192000,"once":160000,"months":24,"perMonth":8000,"perMonthSource":"catalog","next":{"label":"20 октября","list":204000,"once":170000},"free":false},"поток15января2027":{"list":168000,"once":140000,"months":24,"perMonth":7000,"perMonthSource":"catalog","next":{"label":"20 октября","list":180000,"once":150000},"free":false}}}],"addons":[],"recommended":null,"promo":{"label":"Курс месяца","percent":10,"until":"31 октября"},"booking":null,"waitlist":null,"source":["CMS: cbt-oxford"]},{"n":8,"id":"waitlist","name":"Лист ожидания","note":"Два варианта рядом, без вкладок: бесплатно или бронь 5 000 ₽. Что даёт бронь — со слов Дарьи, формулировки нужно подтвердить. Бронь бывает только здесь, при открытом наборе её не показываем.","when":"Набор не открыт. Можно забронировать место или оставить заявку.","promoNote":"Не применяется.","cms":"Есть: статус «Лист ожидания» и цена брони","first":"Бесплатно или бронь и что она даёт","course":{"slug":"s-risk","title":"Оценка и управление суицидальным риском","short":"Оценка суицидального риска","level":"Повышение квалификации","description":"Курс основан на международной программе AMSR, которая обучает ключевым навыкам работы с суицидальным риском."},"streams":[],"items":[],"addons":[],"recommended":null,"promo":null,"booking":null,"waitlist":{"booking":5000},"source":["CMS: s-risk"]}],"demoPromo":{"label":"Курс месяца","percent":10,"until":"31 октября"}};
/* =====================================================================
   Витрина блока цены: две системы подачи на одних данных.
   Данные сценариев вшивает build.mjs (window.PRICING_SCENARIOS).
   «Одна цифра» — переключатели и одна цена; «Сравнение» — все варианты
   рядом. «Чек» и «Цена и запись» сняты по решению Дарьи 12.10.2026.

   Правила Дарьи (12.10.2026), одинаковые в обеих системах:
   — в блоке цены нет кнопок: кнопка «Записаться» живёт в форме,
     которая идёт следующим блоком;
   — официальная цена — в рассрочку, оплата сразу — выгода от неё.
     Цена спокойного размера, под ней одна строка: «Выгода N ₽» акцентом
     и причина, затем «или в рассрочку N ₽/мес на 24 мес» (полную сумму
     рассрочки не пишем);
   — ближайшее повышение — заметный блок: это повод записаться раньше;
   — тарифы сравниваются бок о бок галочками, без выбора и без вкладок;
     даты старта переключаются сверху;
   — у пакета модулей — только выгода, без арифметики «60 + 60 = 120»;
   — бронь места — только в листе ожидания: бесплатно или 5 000 ₽;
   — курс месяца — жёлтая плашка «−10 % до 31 октября», его скидка
     входит в выгоду;
   — вместо описания курса — персональные скидки Академии (не суммируются);
   — платёж в месяц из CMS, а если его там нет — по правилу каталога:
     цена в рассрочку ÷ 24; названия тарифов как в CMS.
   ===================================================================== */
(function () {
  'use strict';

  const DATA = window.PRICING_SCENARIOS;
  const page = document.querySelector('.pricing-scenarios-page');
  if (!DATA || !page) return;

  const NBSP = String.fromCharCode(160);
  const MINUS = String.fromCharCode(8722);
  const JOIN = String.fromCharCode(0x2060); // «₽/мес» не разрывается переносом строки
  const STORE = 'pricing-scenarios:v4';
  const SYSTEMS = ['figure', 'compare'];
  // Что даёт бронь 5 000 ₽ — со слов Дарьи 12.10.2026, формулировки уточнить у отдела продаж.
  const BOOKING_BENEFITS = [
    'Свяжемся первыми, когда откроется набор',
    'Купите курс по самой низкой цене — до первого повышения',
    'Место за вами, даже если группа наберётся раньше старта',
  ];
  // Персональные скидки Академии — условия как на лендингах RFT и «Психосоматики»; с 12.10.2026 не суммируются.
  const DISCOUNTS = [
    ['−10 %', 'новым студентам'],
    ['−20 %', 'нашему студенту и коллеге, который у нас впервые'],
    ['до −20 %', 'нашим выпускникам за отзыв'],
  ];
  const state = { system: 'figure', promo: false, picks: {} };
  let animateFigure = null;

  /* ---------- Текст и деньги ---------- */
  const digits = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const rub = n => digits(n) + NBSP + '₽';
  const perMonth = n => `${rub(n)}${JOIN}/${JOIN}мес`;
  const nb = text => String(text == null ? '' : text).replace(/(?<=^|[\s(«])([а-яёА-ЯЁ]{1,2}|\d+) /g, '$1' + NBSP);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const t = value => esc(nb(value));
  const STATUS = { 'Идет набор': 'Идёт набор', 'Последний шанс': 'Поток идёт, ещё можно присоединиться', 'Старт в любое время': 'Старт в любое время' };

  const ICON_CHECK = '<svg class="price-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_DASH = '<svg class="price-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 12h10" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"/></svg>';
  // Значок повышения: линия графика вверх со стрелкой, рисуется цветом текста.
  const ICON_RISE = '<svg class="price-rise_icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 17l6-6 4 4 8-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 7h6v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_CLOCK = '<img class="meta-pill_icon" src="https://static.tildacdn.com/tild3661-3930-4334-a631-643062633834/icon-clock-alert-bla.svg" width="20" height="20" alt="" aria-hidden="true" draggable="false">';

  /* ---------- Выбор ---------- */
  const modulesOf = s => s.items.filter(item => item.kind === 'module');
  const isModular = s => modulesOf(s).length > 0;
  const isTariffs = s => !isModular(s) && s.items.length > 1;
  const streamOf = (s, id) => s.streams.find(stream => stream.id === id) || s.streams[0];
  const itemOf = (s, id) => s.items.find(item => item.id === id) || s.items[0];
  const promoOf = s => (s.waitlist ? null : s.promo || (state.promo ? DATA.demoPromo : null));

  function picks(s) {
    if (!state.picks[s.id]) {
      state.picks[s.id] = {
        stream: s.streams.length ? s.streams[0].id : null,
        item: s.recommended || (s.items[0] && s.items[0].id) || null,
        addons: [],
      };
    }
    return state.picks[s.id];
  }

  // Официальная цена — в рассрочку (list). Оплата сразу (once) и курс месяца — выгода от неё.
  // Акция, как в Public API: при отдельной цене «сразу» только на неё, иначе на саму цену.
  function priced(p, promo) {
    const r = Object.assign({}, p);
    let sale = p.once != null ? p.once : p.list;
    if (promo && !p.free) sale = Math.round(sale * (1 - promo.percent / 100));
    r.sale = sale;
    r.official = p.list;
    r.twoPrices = p.once != null;
    // Платёж в месяц: из CMS, иначе по правилу каталога — цена в рассрочку ÷ 24 (сборка уже посчитала).
    r.hasInstallment = Boolean(p.perMonth) && !p.free;
    r.installmentMonths = p.perMonthSource === 'cms' ? p.months : 24;
    return r;
  }
  const priceOf = (s, item, streamId) => (item && item.prices[streamId] ? priced(item.prices[streamId], promoOf(s)) : null);

  // Выгода — от чего считать: у пакета от суммы официальных цен модулей, у остальных от официальной цены.
  function benefitOf(s, item, p, streamId) {
    if (item && item.kind === 'bundle') {
      const sum = modulesOf(s).reduce((total, module) => total + module.prices[streamId].list, 0);
      return { value: sum - p.sale, reason: 'по сравнению с покупкой по отдельности' };
    }
    const value = p.official != null && p.official > p.sale ? p.official - p.sale : 0;
    return { value, reason: p.twoPrices ? 'при оплате сразу' : 'по акции' };
  }

  // Под ценой одна строка: «Выгода N ₽» акцентом и причина, затем рассрочка. Полную сумму рассрочки не пишем.
  function offerLine(s, item, p, streamId, extra) {
    const parts = [];
    const gain = benefitOf(s, item, p, streamId);
    if (gain.value > 0) parts.push(`<strong class="price-offer_benefit">${t(`Выгода ${rub(gain.value)}`)}</strong> ${t(gain.reason)}`);
    if (extra) parts.push(t(extra));
    else if (p.hasInstallment) parts.push(t(`или в рассрочку ${perMonth(p.perMonth)} на ${p.installmentMonths} мес`));
    // Части — отдельные span: в узких колонках тарифов они встают друг под другом без «·».
    return parts.length ? `<p class="price-offer">${parts.map(part => `<span class="price-offer_part">${part}</span>`).join('<span class="price-offer_sep"> · </span>')}</p>` : '';
  }
  const caption = line => (line ? `<p class="price-offer">${t(line)}</p>` : '');

  // Персональные скидки Академии вместо описания курса.
  const discounts = extra => `<div class="price-discounts${extra ? ' ' + extra : ''}"><p class="price-discounts_title">Персональные скидки</p><ul class="price-discounts_list" role="list">${DISCOUNTS.map(([value, text]) => `<li class="price-discounts_item"><span class="price-discounts_value">${t(value)}</span> ${t(text)}</li>`).join('')}</ul><p class="price-discounts_note">Скидки не суммируются</p></div>`;

  // Ближайшее повышение — заметный блок: дата, новая цена и на сколько вырастет.
  function rise(p, extra) {
    if (!p || !p.next) return '';
    const next = p.next.once != null ? p.next.once : p.next.list;
    const diff = next - p.sale;
    return `<div class="price-rise${extra ? ' ' + extra : ''}">${ICON_RISE}<p class="price-rise_text"><span class="price-rise_title">${t(`С ${p.next.label} — ${rub(next)}`)}</span>${diff > 0 ? `<span class="price-rise_note">${t(`цена вырастет на ${rub(diff)}`)}</span>` : ''}</p></div>`;
  }

  const promoBadge = promo => (promo ? `<p class="price-promo_badge"><span class="screen-reader-text">${t(promo.label)}: </span>${MINUS}${promo.percent}${NBSP}% до ${t(promo.until)}</p>` : '');
  const flagOf = (s, item) => (item.id !== s.recommended ? '' : item.kind === 'bundle' ? 'Выгоднее всего' : 'Рекомендуем');
  const amount = (cls, value, extraHtml) => `<p class="${cls}"><span class="price-number" data-js="total">${value}</span>${extraHtml || ''}</p>`;

  /* ---------- Общие куски разметки ---------- */
  function pills(s, stream) {
    const list = [];
    if (stream && stream.start) list.push(`${ICON_CLOCK}Старт${NBSP}${t(stream.start)}`);
    if (s.course.level) list.push(t(s.course.level));
    if (!list.length) return '';
    return `<ul class="price-pills" role="list">${list.map(item => `<li class="meta-pill_component is-responsive">${item}</li>`).join('')}</ul>`;
  }
  const heading = (s, cls) => `<h3 class="section-title_component is-responsive ${cls}">${t(s.waitlist ? 'Запишитесь в лист ожидания' : 'Стоимость обучения')}</h3>`;
  const includesList = list => (list && list.length
    ? `<ul class="price-includes" role="list">${list.map(text => `<li class="price-includes_item">${ICON_CHECK}<span>${t(text)}</span></li>`).join('')}</ul>`
    : '');

  function choiceRow(o) {
    const id = esc(o.id);
    return `<label class="price-choice_row" for="${id}">`
      + `<input class="price-choice_input" type="${o.type}" id="${id}" name="${esc(o.name)}" value="${esc(o.value)}" data-scenario="${esc(o.scenario)}" data-field="${o.field}"${o.checked ? ' checked' : ''}>`
      + `<span class="price-choice_mark is-${o.type}" aria-hidden="true">${o.type === 'checkbox' ? ICON_CHECK : ''}</span>`
      + `<span class="price-choice_copy"><span class="price-choice_name">${t(o.title)}</span>${o.note ? `<span class="price-choice_note">${t(o.note)}</span>` : ''}</span>`
      + '</label>';
  }

  function segmented(s, field, legend, options, checkedId, tone) {
    const name = `${s.id}-${state.system}-${field}`;
    return `<fieldset class="price-switch"><legend class="price-switch_legend">${t(legend)}</legend><div class="segmented_component ${tone || 'is-accent'}">`
      + options.map(o => `<label class="segmented_item"><input class="segmented_input" type="radio" id="${name}-${esc(o.id)}" name="${name}" value="${esc(o.id)}" data-scenario="${s.id}" data-field="${field}"${o.id === checkedId ? ' checked' : ''}><span class="segmented_label">${t(o.label)}</span></label>`).join('')
      + '</div></fieldset>';
  }
  const dateSwitch = (s, pick, tone) => (s.streams.length > 1 ? segmented(s, 'stream', 'Старт', s.streams.map(st => ({ id: st.id, label: st.short })), pick.stream, tone) : '');

  /* ---------- Сравнение тарифов: галочки по колонкам ----------
     Общее у всех тарифов, затем то, что есть только в старшем; строка «Всё из тарифа …» —
     это наследование, в таблицу не попадает. Выбора в таблице нет: решение принимается
     в форме, на человека не давим. */
  function featureMatrix(s) {
    const rows = [];
    s.items.forEach((item, index) => {
      item.includes.forEach(text => {
        if (/^Всё из тарифа/.test(text)) return;
        if (!rows.some(row => row.text === text)) rows.push({ text, from: index });
      });
    });
    return rows.map(row => ({ text: row.text, has: s.items.map((item, index) => index >= row.from) }));
  }

  function tariffTable(s, pick) {
    const captionId = `${s.id}-${state.system}-tariffs`;
    const head = s.items.map(item => {
      const featured = item.id === s.recommended;
      const p = priceOf(s, item, pick.stream);
      const flag = flagOf(s, item);
      const title = `<span class="price-tariffs_title"><span class="price-tariffs_name">${t(item.name)}</span>${flag ? `<span class="price-flag${featured ? ' is-dark' : ''}">${t(flag)}</span>` : ''}</span>`;
      const money = p
        ? `<span class="price-tariffs_number">${rub(p.sale)}</span>${offerLine(s, item, p, pick.stream)}${rise(p, 'is-compact')}`
        : '<span class="price-offer">нет в этом потоке</span>';
      return `<th class="price-tariffs_head${featured ? ' is-featured' : ''}" scope="col">${title}${money}</th>`;
    }).join('');
    const rows = featureMatrix(s).map(row => `<tr><th class="price-tariffs_feature" scope="row">${t(row.text)}</th>${row.has.map((has, i) => `<td class="price-tariffs_mark-cell${s.items[i].id === s.recommended ? ' is-featured' : ''}${has ? ' is-yes' : ''}">${has ? ICON_CHECK : ICON_DASH}<span class="screen-reader-text">${has ? 'входит' : 'не входит'}</span></td>`).join('')}</tr>`).join('');
    return `<p class="price-tariffs_caption" id="${captionId}">Что входит в тарифы</p><table class="price-tariffs_table is-count-${s.items.length}" aria-labelledby="${captionId}"><thead><tr><th class="price-tariffs_corner" scope="col"><span class="screen-reader-text">Что входит</span></th>${head}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  /* ---------- Лист ожидания: бесплатно или бронь 5 000 ₽ ----------
     Без вкладок: два варианта рядом в обеих системах, бронь — на тёмной карточке. */
  const waitOptions = s => [
    { id: 'free', title: 'Лист ожидания', value: 'Бесплатно', sub: 'Без оплаты', includes: ['Напишем, когда откроется набор', 'Цену и даты узнаете вместе со всеми'] },
    { id: 'booking', title: 'Бронь места', value: rub(s.waitlist.booking), sub: 'Место в следующем потоке', includes: BOOKING_BENEFITS, featured: true },
  ];

  /* =====================================================================
     «Одна цифра»: когда начинаем → что берём → сколько стоит → когда подорожает.
     ===================================================================== */
  function renderFigure(s) {
    const pick = picks(s);
    const promo = promoOf(s);
    const stream = s.streams.length ? streamOf(s, pick.stream) : null;
    const head = `${heading(s, 'price-figure_heading')}<div class="price-figure_head">${pills(s, s.streams.length === 1 ? stream : null)}<p class="content-heading_component is-profile price-figure_course-name">${t(s.course.title)}</p></div>`;
    const enter = animateFigure === s.id ? ' is-entering' : '';

    // Лист ожидания показывается как в «Сравнении»: два варианта рядом, без вкладок.
    if (s.waitlist) return renderCompare(s);

    // Тарифы: даты сверху, ниже сравнение галочками на всю ширину, цены в шапках колонок.
    if (isTariffs(s)) {
      return `<div class="price-figure_component is-tariffs" data-system="figure">${head}`
        + `<div class="price-figure_stage">${dateSwitch(s, pick)}${promoBadge(promo)}</div>`
        + `<div class="price-figure_table">${tariffTable(s, pick)}</div>`
        + discounts('is-row')
        + '</div>';
    }

    const item = itemOf(s, pick.item);
    const p = priceOf(s, item, pick.stream);
    const addonsOn = s.addons.filter(addon => pick.addons.includes(addon.id));
    const addonsSum = addonsOn.reduce((sum, addon) => sum + addon.price, 0);
    const extra = addonsOn.length ? `включая «${addonsOn[0].name}» — ${rub(addonsSum)}` : '';
    const money = `<div class="price-figure_money">${promoBadge(promo)}${amount('price-figure_amount' + enter, rub(p.sale + addonsSum))}${offerLine(s, item, p, pick.stream, extra)}</div>`;

    const flag = flagOf(s, item);
    const choice = s.items.length > 1
      ? segmented(s, 'item', 'Формат', s.items.map(it => ({ id: it.id, label: it.short })), item.id)
        + `<div class="price-figure_choice"><p class="price-figure_choice-name">${t(item.name)}${flag ? ` <span class="price-flag">${t(flag)}</span>` : ''}</p>${item.sub || item.requires ? `<p class="price-figure_choice-sub">${t([item.sub, item.requires].filter(Boolean).join(' · '))}</p>` : ''}</div>`
      : '';
    const addons = s.addons.map(addon => `<label class="price-figure_addon" for="${s.id}-figure-addon-${addon.id}"><span class="price-figure_addon-copy"><span class="price-figure_addon-name">${t(`Добавить «${addon.name}»`)}</span><span class="price-figure_addon-note">${t(`+${rub(addon.price)} с курсом${addon.priceSeparate ? `, отдельно ${rub(addon.priceSeparate)}${addon.priceSeparateSource === 'условно' ? ' (условно)' : ''}` : ''}${addon.seatsLeft ? ` · осталось ${addon.seatsLeft} мест` : ''}`)}</span></span><input class="switch_input" type="checkbox" role="switch" id="${s.id}-figure-addon-${addon.id}" value="${addon.id}" data-scenario="${s.id}" data-field="addon"${pick.addons.includes(addon.id) ? ' checked' : ''}><span class="switch_track" aria-hidden="true"></span></label>`).join('');
    const stage = `<div class="price-figure_stage">${dateSwitch(s, pick)}${choice}${money}${rise(p)}${addons}</div>`;
    const details = `<div class="price-figure_details">${item.includes.length ? `<div class="price-figure_includes"><p class="price-figure_includes-title">${t(s.items.length > 1 ? `В «${item.short}» входит` : 'Что входит')}</p>${includesList(item.includes)}</div>` : ''}${discounts()}</div>`;
    return `<div class="price-figure_component" data-system="figure">${head}${stage}${details}</div>`;
  }

  /* =====================================================================
     «Сравнение»: все варианты рядом, без кнопок.
     ===================================================================== */
  function compareCard(o) {
    return `<li class="price-compare_card${o.featured ? ' is-featured' : ''}">`
      + `<div class="price-compare_card-head"><h4 class="price-compare_name">${t(o.title)}</h4>${o.flag ? `<span class="price-flag${o.featured ? ' is-dark' : ''}">${t(o.flag)}</span>` : ''}</div>`
      + `<p class="price-compare_sub">${o.sub ? t(o.sub) : ''}</p>`
      + `<div class="price-compare_price">${amount('price-compare_amount', o.value)}${o.offer || ''}${o.rise || ''}</div>`
      + `<div class="price-compare_includes-wrap">${includesList(o.includes)}</div>`
      + '</li>';
  }

  function renderCompare(s) {
    const pick = picks(s);
    const promo = promoOf(s);
    const oneStream = s.streams.length === 1 ? s.streams[0] : null;
    const wide = !s.waitlist && !isModular(s) && s.items.length === 1 && s.streams.length === 1 && !priceOf(s, s.items[0], s.streams[0].id).twoPrices;
    const head = `<div class="price-compare_head">${heading(s, 'price-compare_heading')}${pills(s, oneStream)}${wide ? '' : `<p class="content-heading_component is-profile">${t(s.course.title)}</p>`}</div>`;
    const badge = promoBadge(promo);

    if (isTariffs(s)) {
      return `<div class="price-compare_component" data-system="compare">${head}<div class="price-compare_bar">${dateSwitch(s, pick, 'is-page')}${badge}</div>${tariffTable(s, pick)}${discounts('is-band')}</div>`;
    }

    const cards = [];
    if (s.waitlist) {
      waitOptions(s).forEach(o => cards.push(compareCard({ featured: o.featured, title: o.title, sub: o.sub, value: o.value, includes: o.includes })));
    } else if (!isModular(s) && s.items.length === 1 && s.streams.length === 1) {
      const p = priceOf(s, s.items[0], s.streams[0].id);
      if (p.twoPrices) {
        // Две цены одного потока: оплата сразу — выгода от официальной цены, её Академии выгоднее продавать.
        const gain = benefitOf(s, null, p);
        cards.push(compareCard({ featured: true, title: 'Оплата сразу', sub: 'Один платёж', value: rub(p.sale), offer: gain.value > 0 ? `<p class="price-offer"><strong class="price-offer_benefit">${t(`Выгода ${rub(gain.value)}`)}</strong></p>` : '', rise: rise(p) }));
        cards.push(compareCard({ title: 'В рассрочку', sub: `Официальная цена, ${p.installmentMonths} ежемесячных платежей`, value: perMonth(p.perMonth), offer: promo ? caption('курс месяца на рассрочку не действует') : '' }));
      } else {
        cards.push(`<li class="price-compare_card is-wide"><div class="price-compare_card-body"><h4 class="price-compare_name">${t(s.course.title)}</h4>${discounts()}</div><div class="price-compare_card-side"><div class="price-compare_price">${amount('price-compare_amount', rub(p.sale))}${offerLine(s, null, p)}${rise(p)}</div></div></li>`);
      }
    } else if (!isModular(s) && s.items.length === 1) {
      s.streams.forEach((st, i) => {
        const p = priceOf(s, s.items[0], st.id);
        cards.push(compareCard({ title: `Старт ${st.start}`, flag: i === 0 ? 'Ближайший поток' : '', sub: STATUS[st.status] || st.status, value: rub(p.sale), offer: offerLine(s, null, p), rise: rise(p) }));
      });
    } else {
      const sid = pick.stream;
      let order = s.items.slice();
      // Пакет ставим в середину: на него смотрят первым, а модули по бокам служат сравнением.
      if (order.length === 3 && order[2].kind === 'bundle') order = [order[0], order[2], order[1]];
      order.forEach(item => {
        const p = priceOf(s, item, sid);
        if (!p) return;
        cards.push(compareCard({
          featured: item.id === s.recommended,
          title: item.name,
          flag: flagOf(s, item),
          sub: [item.sub, item.requires].filter(Boolean).join(' · ') || item.description,
          value: rub(p.sale),
          offer: offerLine(s, item, p, sid),
          rise: rise(p),
          includes: item.includes,
        }));
      });
    }

    const grid = `<ul class="price-compare_grid is-count-${cards.length}" role="list">${cards.join('')}</ul>`;
    const addons = s.addons.map(addon => '<div class="price-compare_addon">'
      + `<div class="price-compare_addon-copy"><h4 class="price-compare_addon-name">${t(addon.name)}</h4><p class="price-compare_addon-text">${t(`${addon.description} ${addon.requires}.`)}</p>${includesList(addon.includes)}</div>`
      + `<div class="price-compare_addon-price"><p class="price-compare_addon-number">${rub(addon.price)} <span class="price-compare_addon-number-note">вместе с${NBSP}курсом</span></p>${addon.priceSeparate ? `<p class="price-compare_addon-separate">${t(`Отдельно — ${rub(addon.priceSeparate)}${addon.priceSeparateSource === 'условно' ? ' (условно)' : ''}`)}</p>` : ''}${addon.seatsLeft ? `<p><span class="price-flag">${t(`Осталось ${addon.seatsLeft} мест`)}</span></p>` : ''}</div>`
      + choiceRow({ type: 'checkbox', id: `${s.id}-compare-addon-${addon.id}`, name: `${s.id}-compare-addon`, value: addon.id, scenario: s.id, field: 'addon', checked: pick.addons.includes(addon.id), title: 'Добавить к заявке', note: 'Добавится к любому выбранному модулю' })
      + '</div>').join('');
    const band = s.waitlist || wide ? '' : discounts('is-band');
    return `<div class="price-compare_component" data-system="compare">${head}${s.waitlist ? '' : badge}${grid}${addons}${band}</div>`;
  }

  /* ---------- Отрисовка и события ---------- */
  const renderers = { figure: renderFigure, compare: renderCompare };
  const stageOf = s => page.querySelector(`.scenario_stage[data-scenario="${s.id}"]`);
  function renderScenario(s) {
    const stage = stageOf(s);
    if (stage) stage.innerHTML = renderers[state.system](s);
  }
  const renderAll = () => DATA.scenarios.forEach(renderScenario);

  const announcer = document.createElement('p');
  announcer.className = 'screen-reader-text';
  announcer.setAttribute('aria-live', 'polite');
  page.appendChild(announcer);
  function announce(s) {
    const total = stageOf(s) && stageOf(s).querySelector('[data-js="total"]');
    if (total) announcer.textContent = `${s.name}: ${total.textContent}`;
  }

  const toggleIn = (list, value, on) => {
    const i = list.indexOf(value);
    if (on && i === -1) list.push(value);
    if (!on && i !== -1) list.splice(i, 1);
  };
  function rerender(s, focusId) {
    renderScenario(s);
    animateFigure = null;
    const again = focusId && document.getElementById(focusId);
    if (again) again.focus({ preventScroll: true });
    announce(s);
  }

  page.addEventListener('change', event => {
    const el = event.target;
    if (el.name === 'system') { state.system = el.value; save(); renderAll(); return; }
    if (el.name === 'promo') { state.promo = el.checked; save(); renderAll(); return; }
    const s = DATA.scenarios.find(item => item.id === el.dataset.scenario);
    if (!s) return;
    const pick = picks(s);
    const field = el.dataset.field;
    if (field === 'stream') pick.stream = el.value;
    else if (field === 'item') pick.item = el.value;
    else if (field === 'addon') toggleIn(pick.addons, el.value, el.checked);
    if (state.system === 'figure' && field !== 'addon') animateFigure = s.id;
    rerender(s, el.id);
  });

  /* Высота липкой панели: от неё считается отступ якорей. */
  const controls = page.querySelector('[data-js="controls"]');
  function measure() {
    if (!controls) return;
    const h = controls.offsetHeight;
    page.style.setProperty('--controls-offset', `${h}px`);
    document.documentElement.style.scrollPaddingTop = `${h + 32}px`;
  }
  if (controls && 'ResizeObserver' in window) new ResizeObserver(measure).observe(controls);
  measure();

  /* Выбор системы и акции запоминается в браузере; ?system=figure|compare&promo=1 в адресе главнее. */
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify({ system: state.system, promo: state.promo })); } catch (error) { /* хранилище недоступно — не страшно */ }
  }
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved && SYSTEMS.includes(saved.system)) { state.system = saved.system; state.promo = Boolean(saved.promo); }
  } catch (error) { /* приватный режим */ }
  const params = new URLSearchParams(location.search);
  if (SYSTEMS.includes(params.get('system'))) state.system = params.get('system');
  if (params.has('promo')) state.promo = params.get('promo') === '1';
  page.querySelectorAll('input[name="system"]').forEach(input => { input.checked = input.value === state.system; });
  const promoSwitch = page.querySelector('input[name="promo"]');
  if (promoSwitch) promoSwitch.checked = state.promo;

  renderAll();
})();
