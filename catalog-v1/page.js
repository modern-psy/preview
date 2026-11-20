/* ==========================================================================
   Каталог курсов /courses · превью 16.11.2026
   Данные: сразу рисуем снимок /api/public/catalog на 20.11.2026 (CARDS, TOPICS),
   затем берём свежий каталог из CMS и перерисовываем (раздел «Живые данные из CMS»).
   Обложки: мини-курсы — модель метода из кода, остальные — картинка-предмет из img/.
   Фильтры, поиск и сортировка считаются в браузере, раздел «Фильтры каталога».
   ========================================================================== */
/* Снимок /api/public/catalog, без описаний и обложек */
const CARDS = [{"slug": "cbt-oxford", "title": "КПТ: Когнитивно-поведенческая терапия. Оксфордская модель", "subtitle": "профессиональная переподготовка · диплом", "description": "В основе программы лежит видение клиента через Оксфордскую концептуализацию. В отличие от классической модели, здесь используется расширенная структура: учитываются биологические факторы, критические события, защитные механизмы, а также конкретные цели и триггеры клиента.", "url": "https://modern-psy.ru/cbt-oxford", "cover": {"url": "https://s3.twcstorage.ru/asp-media/cbt_oxford_646d44e6b9.webp", "alt": ""}, "section": "Методы психотерапии", "flagship": true, "hours": 750, "promo": null, "searchWords": ["КПТ", "CBT", "когнитивно-поведенческая", "когнитивная", "Оксфорд", "оксфордская", "тревога", "депрессия"], "teachers": ["Алексей Бабурин", "Алена Пличко", "Борис Пашков", "Даниил Ривин", "Дарья Батищева", "Денис Ермаков", "Екатерина Горбушина", "Елизавета Марьяненко", "Иона Гусаченко", "Сергей Падве"], "mode": "open", "status": "Последний шанс", "startDate": "2026-11-06", "startDates": ["2026-11-06", "2027-01-15"], "price": {"free": false, "from": true, "full": 150000, "discounted": null, "monthly": 7500, "onePayment": true}, "booking": null}, {"slug": "kpt", "title": "КПТ: Когнитивно-поведенческая терапия. Модель Бека", "subtitle": "профессиональная переподготовка · диплом", "description": "Программа позволит с нуля получить все необходимые навыки для внедрения подхода в свою практику и разработана таким образом, чтобы дать максимальный объём информации без накрутки часов — только профильный контент и много практики.", "url": "https://modern-psy.ru/kpt", "cover": {"url": "https://s3.twcstorage.ru/asp-media/kpt_ed616d8e51.webp", "alt": ""}, "section": "Методы психотерапии", "flagship": true, "hours": 750, "promo": null, "searchWords": ["КПТ", "CBT", "когнитивно-поведенческая", "когнитивная", "Бек", "бековская", "модель Бека", "тревога", "депрессия"], "teachers": ["Борис Пашков", "Даниил Ривин", "Иона Гусаченко"], "mode": "open", "status": "Идёт набор", "startDate": "2026-11-19", "startDates": ["2026-11-19", "2027-02-18"], "price": {"free": false, "from": true, "full": 150000, "discounted": null, "monthly": 7500, "onePayment": true}, "booking": null}, {"slug": "psyeducation", "title": "Профессия: Психолог-консультант", "subtitle": "профессиональная переподготовка · диплом", "description": "Получите профессию психолога-консультанта с дополнительной специализацией в контекстуально-поведенческом подходе на нашем большом курсе профессиональной переподготовки.", "url": "https://modern-psy.ru/psyeducation", "cover": {"url": "https://s3.twcstorage.ru/asp-media/psyeducation_cac36fee14.webp", "alt": ""}, "section": "Профессии", "flagship": true, "hours": 1200, "promo": {"active": true, "label": "Курс ноября", "discountPercent": 10, "until": "2026-11-30", "startDate": "2026-12-09", "price": {"free": false, "from": true, "full": 220000, "discounted": 198000, "monthly": 10542, "onePayment": true}}, "searchWords": ["психолог-консультант", "психолог консультант", "консультант", "с нуля", "профессия", "стать психологом", "без психологического образования", "переподготовка", "диплом", "второе высшее"], "teachers": [], "mode": "open", "status": "Идёт набор", "startDate": "2026-12-09", "startDates": ["2026-12-09", "2027-03-16"], "price": {"free": false, "from": true, "full": 220000, "discounted": 198000, "monthly": 10542, "onePayment": true}, "booking": null}, {"slug": "act", "title": "АСТ: Терапия принятия и ответственности", "subtitle": "профессиональная переподготовка · диплом", "description": "Это полный курс по Терапии принятия и ответственности (АСТ). Он позволит полностью изучить АСТ, а затем полноценно внедрить его в практику.", "url": "https://modern-psy.ru/act", "cover": {"url": "https://s3.twcstorage.ru/asp-media/act_1fb05f04d7.webp", "alt": ""}, "section": "Методы психотерапии", "flagship": true, "hours": 425, "promo": null, "searchWords": ["АСТ", "ACT", "терапия принятия и ответственности", "принятие", "ответственность", "третья волна", "контекстуальная", "психологическая гибкость", "матрица"], "teachers": ["Всеволод Ардов", "Елизавета Силина", "Илья Гавин", "Ирина Шакшина", "Ксения Белова", "Ольга Радогуз", "Ольга Турчинская"], "mode": "open", "status": "Идёт набор", "startDate": "2027-02-01", "startDates": ["2027-02-01", "2027-05-17"], "price": {"free": false, "from": true, "full": 115000, "discounted": null, "monthly": 5542, "onePayment": true}, "booking": null}, {"slug": "obuchenie-emdr-dpdg-terapii", "title": "Базовый тренинг EMDR/ДПДГ-терапии", "subtitle": "повышение квалификации · удостоверение", "description": "Освойте структурированный метод психотерапии, который помогает эффективно работать с травматическим опытом, тревогой и последствиями стрессовых событий", "url": "https://modern-psy.ru/obuchenie-emdr-dpdg-terapii", "cover": {"url": "https://s3.twcstorage.ru/asp-media/obuchenie_emdr_dpdg_terapii_9eadd80575.webp", "alt": ""}, "section": "Методы психотерапии", "flagship": true, "hours": 132, "promo": null, "searchWords": ["EMDR", "ЕМДР", "ДПДГ", "десенсибилизация", "движения глаз", "травма", "ПТСР", "тренинг"], "teachers": ["Юлия Глазкова"], "mode": "open", "status": "Идёт набор", "startDate": "2027-02-19", "startDates": ["2027-02-19"], "price": {"free": false, "from": true, "full": 60000, "discounted": null, "monthly": 2500, "onePayment": false}, "booking": null}, {"slug": "clinical_psychology", "title": "Клиническая психология", "subtitle": "профессиональная переподготовка · диплом", "description": "Разовьете клиническое мышление, научитесь работать с психическими расстройствами, которые чаще всего встречаются в реальной практике, и отработайте новые навыки под руководством клинических психологов и врачей", "url": "https://modern-psy.ru/clinical_psychology", "cover": {"url": "https://s3.twcstorage.ru/asp-media/clinical_psychology_63add850d6.webp", "alt": ""}, "section": "Профессии", "flagship": true, "hours": 1000, "promo": null, "searchWords": ["клинический психолог", "клиническая", "с нуля", "переподготовка", "профессия", "диплом", "стать психологом", "без психологического образования", "диагностика", "расстройства"], "teachers": ["Борис Пашков", "Дарья Зюзина", "Илья Гавин", "Иона Гусаченко", "Ирина Демченко", "Марина Овечкина", "Ольга Тумсэк"], "mode": "open", "status": "Идёт набор", "startDate": "2027-03-25", "startDates": ["2027-03-25"], "price": {"free": false, "from": false, "full": 145000, "discounted": null, "monthly": 6958, "onePayment": true}, "booking": null}, {"slug": "client-centered-therapy", "title": "Основы клиент-центрированной психотерапии", "subtitle": "повышение квалификации · удостоверение", "description": "Научитесь выстраивать глубокие, поддерживающие отношения с клиентом, помогая ему развиваться, расти и справляться с трудностями..", "url": "https://modern-psy.ru/client-centered-therapy", "cover": {"url": "https://s3.twcstorage.ru/asp-media/client_centered_therapy_ff1c93f035.webp", "alt": ""}, "section": "Методы психотерапии", "flagship": false, "hours": 52, "promo": null, "searchWords": ["КЦТ", "клиент-центрированная", "клиентоцентрированная", "Роджерс", "гуманистическая", "эмпатия"], "teachers": ["Кристина Антонова"], "mode": "open", "status": "Последний шанс", "startDate": "2026-11-15", "startDates": ["2026-11-15"], "price": {"free": false, "from": false, "full": 30000, "discounted": null, "monthly": 1250, "onePayment": false}, "booking": null}, {"slug": "sexology", "title": "Сексология", "subtitle": "профессиональная переподготовка · диплом", "description": "Научитесь консультировать по вопросам сексуальности, интимных отношений и сексуального здоровья на научной и этичной основе.", "url": "https://modern-psy.ru/sexology", "cover": {"url": "https://s3.twcstorage.ru/asp-media/sexology_b7cfb9793f.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 300, "promo": null, "searchWords": ["сексология", "сексолог", "секс", "сексуальность", "пары", "интимная жизнь"], "teachers": ["Борис Пашков", "Ксения Белова"], "mode": "open", "status": "Последний шанс", "startDate": "2026-11-17", "startDates": ["2026-11-17"], "price": {"free": false, "from": false, "full": 120000, "discounted": null, "monthly": 5000, "onePayment": false}, "booking": null}, {"slug": "couples-therapy", "title": "Терапия пар", "subtitle": "повышение квалификации · удостоверение", "description": "Программа позволяет изучить разные подходы к работе с парами, увидеть возможности их сочетания и выбрать направление для углублённого изучения. Вы также сможете применять несколько методов одновременно в своей практике.", "url": "https://modern-psy.ru/couples-therapy", "cover": {"url": "https://s3.twcstorage.ru/asp-media/couples_therapy_cd2082efe1.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 130, "promo": {"active": true, "label": "Курс ноября", "discountPercent": 10, "until": "2026-11-30", "startDate": "2026-11-23", "price": {"free": false, "from": false, "full": 70000, "discounted": 63000, "monthly": 2625, "onePayment": false}}, "searchWords": ["пары", "парная", "супруги", "супружеская", "отношения", "семейная", "конфликты", "развод"], "teachers": ["Артём Анненков", "Ринат Хайруллин"], "mode": "open", "status": "Идёт набор", "startDate": "2026-11-23", "startDates": ["2026-11-23"], "price": {"free": false, "from": false, "full": 70000, "discounted": 63000, "monthly": 2625, "onePayment": false}, "booking": null}, {"slug": "course-marketing-data", "title": "Терапия травмы: ПТСР и кПТСР", "subtitle": "повышение квалификации · удостоверение", "description": "Научитесь выстраивать целостную логику терапии травмы: от оценки состояния и концептуализации случая до выбора интервенций и пересмотра терапевтического плана", "url": "https://modern-psy.ru/trauma-therapy", "cover": {"url": "https://s3.twcstorage.ru/asp-media/trauma_therapy_350e238971.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 120, "promo": null, "searchWords": ["травма", "ПТСР", "комплексная травма", "посттравматическое"], "teachers": ["Юлия Глазкова"], "mode": "open", "status": "Идёт набор", "startDate": "2026-11-24", "startDates": ["2026-11-24"], "price": {"free": false, "from": false, "full": 80000, "discounted": null, "monthly": 3333, "onePayment": false}, "booking": null}, {"slug": "rodbt-live", "title": "Первый уровень РО ДБТ: старт для практикующих психологов", "subtitle": "повышение квалификации · удостоверение", "description": "Первый уровень курса по РО ДБТ — это базовая подготовка для тех, кто хочет работать в этом методе. Вы изучите трансдиагностический подход к лечению расстройств, связанных с избыточным контролем, под руководством автора терапии.", "url": "https://modern-psy.ru/rodbt-live", "cover": {"url": "https://s3.twcstorage.ru/asp-media/rodbt_live_9523c3f6af.webp", "alt": ""}, "section": "Методы психотерапии", "flagship": false, "hours": 16, "promo": null, "searchWords": ["РО ДБТ", "RO DBT", "родбт", "ДБТ", "DBT", "сверхконтроль", "Линч", "первый уровень"], "teachers": [], "mode": "open", "status": "Идёт набор", "startDate": "2026-11-26", "startDates": ["2026-11-26"], "price": {"free": false, "from": false, "full": 40000, "discounted": null, "monthly": 1667, "onePayment": false}, "booking": null}, {"slug": "navyki-konsultirovaniya-dlya-psihologov", "title": "Навыки консультирования для психологов", "subtitle": "повышение квалификации · удостоверение", "description": "Учимся выстраивать психологическую консультацию от первого контакта до завершения встречи: слышать запрос клиента, задавать точные вопросы, удерживать фокус и спокойно работать с тем, что возникает в диалоге.", "url": "https://modern-psy.ru/navyki-konsultirovaniya-dlya-psihologov", "cover": {"url": "https://s3.twcstorage.ru/asp-media/navyki_konsultirovaniya_dlya_psihologov_d7342ecb88.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 50, "promo": null, "searchWords": ["навыки консультирования", "консультирование", "первая сессия", "начинающим", "практика", "техники"], "teachers": ["Олеся Шаповал"], "mode": "open", "status": "Идёт набор", "startDate": "2026-12-02", "startDates": ["2026-12-02"], "price": {"free": false, "from": false, "full": 45000, "discounted": null, "monthly": 1875, "onePayment": false}, "booking": null}, {"slug": "ifs", "title": "IFS: Терапия внутренних семейных систем", "subtitle": "повышение квалификации · удостоверение", "description": "Вы познакомитесь с основами модели IFS, научитесь работать с внутренними частями, энергией Сэлф и конфликтами внутри системы. Освоите протоколы прямого доступа, унаследованного бремени и экстернализации.", "url": "https://modern-psy.ru/ifs", "cover": {"url": "https://s3.twcstorage.ru/asp-media/ifs_0b8a7c1269.webp", "alt": ""}, "section": "Методы психотерапии", "flagship": false, "hours": 70, "promo": null, "searchWords": ["IFS", "ИФС", "внутренние семейные системы", "части", "субличности", "Шварц"], "teachers": ["Ирина Диянкова", "Юлия Варлакова"], "mode": "open", "status": "Идёт набор", "startDate": "2027-01-11", "startDates": ["2027-01-11"], "price": {"free": false, "from": true, "full": 38000, "discounted": null, "monthly": 1583, "onePayment": false}, "booking": null}, {"slug": "rft", "title": "RFT: Теория реляционных фреймов", "subtitle": "повышение квалификации · удостоверение", "description": "Курс для психологов, которые хотят понимать не только что делать в сессии, но и почему это работает — и что конкретно происходит с реляционной сетью клиента, когда вы задаёте вопрос.", "url": "https://modern-psy.ru/rft", "cover": {"url": "https://s3.twcstorage.ru/asp-media/rft_a1f92aa382.webp", "alt": ""}, "section": "Методы психотерапии", "flagship": false, "hours": 18, "promo": null, "searchWords": ["RFT", "РФТ", "реляционные фреймы", "реляционных фреймов", "поведенческий анализ"], "teachers": ["Ксения Белова"], "mode": "open", "status": "Идёт набор", "startDate": "2027-01-19", "startDates": ["2027-01-19"], "price": {"free": false, "from": false, "full": 25000, "discounted": null, "monthly": 1042, "onePayment": false}, "booking": null}, {"slug": "abuse-therapy", "title": "Терапия взрослых, переживших сексуализированное насилие в детстве", "subtitle": "повышение квалификации · удостоверение", "description": "Системный подход к работе с травмой: от актуальных клинических рекомендаций до анализа социального контекста.", "url": "https://modern-psy.ru/abuse-therapy", "cover": {"url": "https://s3.twcstorage.ru/asp-media/abuse_therapy_b152562048.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 54, "promo": null, "searchWords": ["насилие", "сексуализированное насилие", "детская травма", "абьюз", "травма детства"], "teachers": ["Александра Олейник", "Екатерина Вакуненкова"], "mode": "open", "status": "Идёт набор", "startDate": "2027-01-22", "startDates": ["2027-01-22"], "price": {"free": false, "from": false, "full": 42000, "discounted": null, "monthly": 1750, "onePayment": false}, "booking": null}, {"slug": "neurodivergence", "title": "Психотерапия нейроотличных клиентов: РАС и СДВГ", "subtitle": "повышение квалификации · удостоверение", "description": "Первый российский курс, который системно объединяет работу с РАС и СДВГ, учитывает коморбидность и создан нейроотличными специалистами.", "url": "https://modern-psy.ru/neurodivergence", "cover": {"url": "https://s3.twcstorage.ru/asp-media/neurodivergence_8bcc81b24b.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 80, "promo": null, "searchWords": ["РАС", "СДВГ", "аутизм", "нейроотличные", "нейроразнообразие", "ADHD", "гиперактивность", "дефицит внимания"], "teachers": ["Николай Емельянов"], "mode": "open", "status": "Идёт набор", "startDate": "2027-01-23", "startDates": ["2027-01-23"], "price": {"free": false, "from": false, "full": 47000, "discounted": null, "monthly": 1958, "onePayment": false}, "booking": null}, {"slug": "narrative-therapy", "title": "Основы нарративной практики", "subtitle": "повышение квалификации · удостоверение", "description": "Нарративный подход меняет саму оптику работы с клиентом: то, как терапевт слышит историю, что считает «проблемой» и где ищет ресурс.", "url": "https://modern-psy.ru/narrative-therapy", "cover": {"url": "https://s3.twcstorage.ru/asp-media/narrative_therapy_3cb2ca9329.webp", "alt": ""}, "section": "Методы психотерапии", "flagship": false, "hours": 88, "promo": {"active": true, "label": "Курс ноября", "discountPercent": 10, "until": "2026-11-30", "startDate": "2027-01-26", "price": {"free": false, "from": true, "full": 35000, "discounted": 31500, "monthly": 1313, "onePayment": false}}, "searchWords": ["нарративная", "нарратив", "narrative", "истории", "Уайт"], "teachers": ["Олеся Шаповал"], "mode": "open", "status": "Идёт набор", "startDate": "2027-01-26", "startDates": ["2027-01-26"], "price": {"free": false, "from": true, "full": 35000, "discounted": 31500, "monthly": 1313, "onePayment": false}, "booking": null}, {"slug": "adult-adhd-therapy", "title": "Тонкости работы со взрослыми с СДВГ", "subtitle": "вебинар · сертификат", "description": "Цикл вебинаров для психологов, психиатров и коучей, заинтересованных в работе с СДВГ. Будут актуализированы часто возникающие сложности и способы работы с ними в любой модальности психотерапии.", "url": "https://modern-psy.ru/adult-adhd-therapy", "cover": {"url": "https://s3.twcstorage.ru/asp-media/adult_adhd_therapy_9e5d8685ab.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 16, "promo": null, "searchWords": ["СДВГ", "ADHD", "взрослые", "дефицит внимания"], "teachers": [], "mode": "open", "status": "Идёт набор", "startDate": "2027-01-31", "startDates": ["2027-01-31"], "price": {"free": false, "from": true, "full": 7000, "discounted": null, "monthly": 292, "onePayment": false}, "booking": null}, {"slug": "schema-therapy", "title": "Схема-терапия", "subtitle": "повышение квалификации · удостоверение", "description": "Станет отличным дополнением к базовой КБТ-терапии, если клиент недостаточно отвечает на стандартные протоколы работы.", "url": "https://modern-psy.ru/schema-therapy", "cover": {"url": "https://s3.twcstorage.ru/asp-media/schema_therapy_1c79750758.webp", "alt": ""}, "section": "Методы психотерапии", "flagship": false, "hours": 72, "promo": null, "searchWords": ["схема-терапия", "схематерапия", "schema", "схемы", "режимы", "Янг", "расстройства личности"], "teachers": [], "mode": "open", "status": "Идёт набор", "startDate": "2027-02-04", "startDates": ["2027-02-04"], "price": {"free": false, "from": false, "full": 55000, "discounted": null, "monthly": 2292, "onePayment": false}, "booking": null}, {"slug": "orkt", "title": "ОРКТ: ориентированная на решение краткосрочная терапия", "subtitle": "повышение квалификации · удостоверение", "description": "Научитесь проводить сессии по решенческой методике, признанной в Европе и России, с живыми клиентами и супервизией.", "url": "https://modern-psy.ru/orkt", "cover": {"url": "https://s3.twcstorage.ru/asp-media/orkt_f2f8d8e03b.webp", "alt": ""}, "section": "Методы психотерапии", "flagship": false, "hours": 116, "promo": null, "searchWords": ["ОРКТ", "SFBT", "ориентированная на решение", "краткосрочная", "решение-ориентированная", "зависимости"], "teachers": ["Анна Хегай", "Мария Шут"], "mode": "open", "status": "Идёт набор", "startDate": "2027-03-01", "startDates": ["2027-03-01"], "price": {"free": false, "from": false, "full": 40000, "discounted": null, "monthly": 1667, "onePayment": false}, "booking": null}, {"slug": "child-training-practice", "title": "Практика создания и проведения тренингов для детей и подростков", "subtitle": "повышение квалификации · удостоверение", "description": "Научитесь собирать и проводить тренинги для детей и подростков: в школьном классе и открытой группе, по готовому протоколу и по своей программе. Уйдёте с навыками снятия запроса, создания и проведения тренинга для детей и подростков.", "url": "https://modern-psy.ru/child-training-practice", "cover": {"url": "https://s3.twcstorage.ru/asp-media/Destkie_treningi_8d451b3af3.jpg", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 60, "promo": null, "searchWords": ["дети", "детская", "подростки", "тренинги", "группы", "групповая работа"], "teachers": [], "mode": "open", "status": "Идёт набор", "startDate": "2027-03-04", "startDates": ["2027-03-04"], "price": {"free": false, "from": false, "full": 30000, "discounted": null, "monthly": 1250, "onePayment": false}, "booking": null}, {"slug": "adhd-adult", "title": "Коучинг взрослых людей с СДВГ", "subtitle": "повышение квалификации · удостоверение", "description": "Курс будет полезен психологам, психиатрам, психотерапевтам, коучам, преподавателям, которые работают со взрослыми людьми с СДВГ.", "url": "https://modern-psy.ru/adhd-adult", "cover": {"url": "https://s3.twcstorage.ru/asp-media/adhd_adult_07ac53fe47.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 16, "promo": null, "searchWords": ["СДВГ", "ADHD", "коучинг", "взрослые", "дефицит внимания"], "teachers": ["Евгения Дашкова"], "mode": "open", "status": "Идёт набор", "startDate": "2027-03-13", "startDates": ["2027-03-13"], "price": {"free": false, "from": false, "full": 15000, "discounted": null, "monthly": 625, "onePayment": false}, "booking": null}, {"slug": "psychiatry-for-psy", "title": "Психиатрия для психологов", "subtitle": "повышение квалификации · удостоверение", "description": "Научитесь замечать клинически значимые проявления и «красные флаги», формулировать рабочие гипотезы и определять, когда нужна консультация психиатра.", "url": "https://modern-psy.ru/psychiatry-for-psy", "cover": {"url": "https://s3.twcstorage.ru/asp-media/psychiatry_for_psy_706c0f3b83.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 65, "promo": null, "searchWords": ["психиатрия", "психиатр", "красные флаги", "диагностика", "психические расстройства", "таблетки", "препараты"], "teachers": ["Анжела Баззаева"], "mode": "open", "status": "Идёт набор", "startDate": "2027-03-16", "startDates": ["2027-03-16"], "price": {"free": false, "from": false, "full": 30000, "discounted": null, "monthly": 1250, "onePayment": false}, "booking": null}, {"slug": "child-psy", "title": "Детская психология", "subtitle": "профессиональная переподготовка · диплом", "description": "Освоите ключевые подходы работы с детьми и подростками до 18 лет.\nУзнаете, как формируется детская психика, научитесь анализировать поведение и применять современные доказательные методы психотерапии.", "url": "https://modern-psy.ru/child-psy", "cover": {"url": "https://s3.twcstorage.ru/asp-media/child_psy_2faaa033ff.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 500, "promo": null, "searchWords": ["дети", "детская", "детский психолог", "ребенок", "подростки", "родители"], "teachers": ["Никита Прилепский"], "mode": "open", "status": "Идёт набор", "startDate": "2027-03-25", "startDates": ["2027-03-25"], "price": {"free": false, "from": false, "full": 84000, "discounted": null, "monthly": 3500, "onePayment": false}, "booking": null}, {"slug": "couple-requests", "title": "Работа с темой отношений в практике психолога", "subtitle": "повышение квалификации · удостоверение", "description": "Учим распознавать парную динамику через одного клиента, удерживать нейтралитет и применять техники КПТ, СФТ и системного подхода — без скатывания в советы и спасательство.", "url": "https://modern-psy.ru/couple-requests", "cover": {"url": "https://s3.twcstorage.ru/asp-media/couple_requests_f2eb708fab.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 35, "promo": null, "searchWords": ["отношения", "пары", "расставание", "ревность", "одиночество"], "teachers": ["Жанна Пятницкая"], "mode": "open", "status": "Идёт набор", "startDate": "2027-03-25", "startDates": ["2027-03-25"], "price": {"free": false, "from": false, "full": 25000, "discounted": null, "monthly": 1042, "onePayment": false}, "booking": null}, {"slug": "clinical-psychology-start", "title": "Введение в клиническую психологию", "subtitle": "мини-курс · грант", "description": "6 уроков, чтобы понять, подходит ли вам клиническая психология: патопсихология, нейропсихология, сон, РПП и как войти в профессию. Грант 20 000 ₽.", "url": "https://modern-psy.ru/clinical-psychology-start?utm_source=catalog&utm_medium=banner&utm_campaign=organic", "cover": {"url": "https://s3.twcstorage.ru/asp-media/clinical_psychology_start_6c614df2d2.webp", "alt": ""}, "section": "Бесплатные мини-курсы", "flagship": false, "hours": null, "promo": null, "searchWords": ["бесплатно", "мини-курс", "клиническая", "введение", "грант"], "teachers": [], "mode": "open", "status": "Старт в любое время", "startDate": null, "startDates": [], "price": {"free": true, "from": false, "full": 0, "discounted": null, "monthly": null, "onePayment": false}, "booking": null}, {"slug": "ro-dbt-2", "title": "Второй уровень РО ДБТ", "subtitle": "повышение квалификации", "description": "Углублённый курс для психотерапевтов, прошедших Уровень 1. Вы переходите от теории к полноценной клинической практике: работе с цепочками событий, терапевтическим альянсом и специфическими механизмами сверхконтроля.", "url": "https://modern-psy.ru/rodbt-lvl2", "cover": {"url": "https://s3.twcstorage.ru/asp-media/rodbt_lvl2_54d7f50b93.webp", "alt": ""}, "section": "Методы психотерапии", "flagship": false, "hours": null, "promo": null, "searchWords": ["РО ДБТ", "RO DBT", "родбт", "ДБТ", "DBT", "сверхконтроль", "второй уровень"], "teachers": [], "mode": "open", "status": "Старт в любое время", "startDate": null, "startDates": [], "price": {"free": false, "from": true, "full": 23500, "discounted": null, "monthly": null, "onePayment": false}, "booking": null}, {"slug": "cbt-oxford-start", "title": "Знакомство с КПТ. Оксфордская модель", "subtitle": "мини-курс · грант", "description": "4 урока: отличия Оксфордской модели от модели Бека, концептуализация и порочные круги, техника «падающая стрела», работа с тревогой. Грант 20 000 ₽.", "url": "https://modern-psy.ru/cbt-oxford-start", "cover": {"url": "https://s3.twcstorage.ru/asp-media/KPT_O_Ksford_MK_ec3e2fdcbd.jpg", "alt": ""}, "section": "Бесплатные мини-курсы", "flagship": false, "hours": null, "promo": null, "searchWords": ["бесплатно", "мини-курс", "КПТ", "CBT", "Оксфорд", "грант"], "teachers": ["Борис Пашков", "Иона Гусаченко"], "mode": "open", "status": "Старт в любое время", "startDate": null, "startDates": [], "price": {"free": true, "from": false, "full": 0, "discounted": null, "monthly": null, "onePayment": false}, "booking": null}, {"slug": "act-base", "title": "Первое знакомство с ACT", "subtitle": "мини-курс · грант", "description": "5 лекций о логике ACT: психологическая гибкость, функциональный анализ поведения, ловушка контроля на примере тревоги, стандарты ACBS. Грант 20 000 ₽.", "url": "https://modern-psy.ru/act-base", "cover": {"url": "https://s3.twcstorage.ru/asp-media/act_base_379a51b735.webp", "alt": ""}, "section": "Бесплатные мини-курсы", "flagship": false, "hours": null, "promo": null, "searchWords": ["бесплатно", "мини-курс", "АСТ", "ACT", "грант"], "teachers": [], "mode": "open", "status": "Старт в любое время", "startDate": null, "startDates": [], "price": {"free": true, "from": false, "full": 0, "discounted": null, "monthly": null, "onePayment": false}, "booking": null}, {"slug": "cbt-first-steps", "title": "Первые шаги в КПТ", "subtitle": "мини-курс · грант", "description": "5 уроков по 25 минут: когнитивная модель, 12 искажений мышления, концептуализация случая, работа с мыслями, поведенческая активация и экспозиция. Грант 20 000 ₽.", "url": "https://modern-psy.ru/cbt-first-steps", "cover": {"url": "https://s3.twcstorage.ru/asp-media/cbt_first_steps_b9bc4c7f12.webp", "alt": ""}, "section": "Бесплатные мини-курсы", "flagship": false, "hours": null, "promo": null, "searchWords": ["бесплатно", "мини-курс", "КПТ", "CBT", "первые шаги", "грант"], "teachers": [], "mode": "open", "status": "Старт в любое время", "startDate": null, "startDates": [], "price": {"free": true, "from": false, "full": 0, "discounted": null, "monthly": null, "onePayment": false}, "booking": null}, {"slug": "put-v-professiyu", "title": "Путь в профессию психолога-консультанта", "subtitle": "мини-курс · грант", "description": "4 вебинара о старте в профессии: как выбрать метод, сколько зарабатывает психолог, как проходит его день и где брать первых клиентов. Грант 30 000 ₽.", "url": "https://modern-psy.ru/put-v-professiyu", "cover": {"url": "https://s3.twcstorage.ru/asp-media/put_v_professiyu_bbb151e0e9.webp", "alt": ""}, "section": "Бесплатные мини-курсы", "flagship": false, "hours": null, "promo": null, "searchWords": ["бесплатно", "мини-курс", "с нуля", "профессия", "стать психологом", "психолог-консультант", "грант"], "teachers": [], "mode": "open", "status": "Старт в любое время", "startDate": null, "startDates": [], "price": {"free": true, "from": false, "full": 0, "discounted": null, "monthly": null, "onePayment": false}, "booking": null}, {"slug": "sexology-mini-course", "title": "Сексология в практике психолога", "subtitle": "мини-курс · грант", "description": "За четыре коротких урока познакомитесь с современной сексологией, разберёте мифы о сексуальном желании и узнаете, с какими вопросами люди приходят на сексологическое консультирование", "url": "https://modern-psy.ru/sexology-mini-course", "cover": {"url": "https://s3.twcstorage.ru/asp-media/seks_minik_015218f323.jpg", "alt": ""}, "section": "Бесплатные мини-курсы", "flagship": false, "hours": null, "promo": null, "searchWords": [], "teachers": [], "mode": "open", "status": "Старт в любое время", "startDate": null, "startDates": [], "price": {"free": true, "from": false, "full": 0, "discounted": null, "monthly": null, "onePayment": false}, "booking": null}, {"slug": "rpp-start", "title": "Современная терапия расстройств пищевого поведения", "subtitle": "мини-курс · грант", "description": "6 уроков для психологов: признаки РПП у клиента, мифы, подходы CBT-E, ACT, DBT и CFT, как стать специалистом по РПП. Грант 10 000 ₽.", "url": "https://modern-psy.ru/rpp-start", "cover": {"url": "https://s3.twcstorage.ru/asp-media/rpp_start_989a912272.webp", "alt": ""}, "section": "Бесплатные мини-курсы", "flagship": false, "hours": null, "promo": null, "searchWords": ["бесплатно", "мини-курс", "РПП", "пищевое поведение", "грант"], "teachers": [], "mode": "open", "status": "Старт в любое время", "startDate": null, "startDates": [], "price": {"free": true, "from": false, "full": 0, "discounted": null, "monthly": null, "onePayment": false}, "booking": null}, {"slug": "bar", "title": "Биполярное расстройство (БАР) в практике психолога", "subtitle": "повышение квалификации · удостоверение", "description": "Курс объединяет знания психиатрии, фармакологии и психотерапии, и предоставляет участникам комплексный взгляд на работу с БАР.", "url": "https://modern-psy.ru/bar", "cover": {"url": "https://s3.twcstorage.ru/asp-media/bar_a6513d199d.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 60, "promo": null, "searchWords": ["БАР", "биполярное", "биполярное расстройство", "маниакально-депрессивное", "мания"], "teachers": [], "mode": "waitlist", "status": "Лист ожидания", "startDate": null, "startDates": [], "price": null, "booking": 5000}, {"slug": "battle-trauma-ptsd", "title": "Военная травма и ПТСР: работа с ветеранами и их близкими", "subtitle": "повышение квалификации · удостоверение", "description": "Освойте диагностику, планирование терапии и современные методы помощи людям с боевым опытом, ветеранам и их близким.", "url": "https://modern-psy.ru/battle-trauma-ptsd", "cover": {"url": "https://s3.twcstorage.ru/asp-media/battle_trauma_ptsd_087b5217e5.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 196, "promo": null, "searchWords": ["военная травма", "ветераны", "военные", "боевая травма", "ПТСР", "родственники"], "teachers": ["Иона Гусаченко"], "mode": "waitlist", "status": "Лист ожидания", "startDate": null, "startDates": [], "price": null, "booking": 5000}, {"slug": "womens-care", "title": "Комплексный подход в работе с женщинами: гинекология, психология, психиатрия", "subtitle": "повышение квалификации · удостоверение", "description": "Курс о комплексной работе с женщинами с коморбидными запросами. Разбираем биопсихосоциальную модель, гинекологию, психологию, основы психиатрии, экологичную коммуникацию в современном клиническом контексте.", "url": "https://modern-psy.ru/womens-care", "cover": {"url": "https://s3.twcstorage.ru/asp-media/womens_care_b6a89e57dc.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 82, "promo": null, "searchWords": ["женщины", "гинекология", "беременность", "перинатальная", "женское здоровье"], "teachers": ["Ольга Винер"], "mode": "waitlist", "status": "Лист ожидания", "startDate": null, "startDates": [], "price": null, "booking": 5000}, {"slug": "rpp", "title": "Консультирование расстройств пищевого поведения", "subtitle": "профессиональная переподготовка · диплом", "description": "Курс обучает работе с расстройствами пищевого поведения, такими как нервная анорексия, нервная булимия, приступообразное переедание и другими уточнёнными и неуточненными расстройствами пищевого поведения.", "url": "https://modern-psy.ru/rpp", "cover": {"url": "https://s3.twcstorage.ru/asp-media/rpp_ca2f53c8c1.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 255, "promo": null, "searchWords": ["РПП", "пищевое поведение", "расстройства пищевого поведения", "анорексия", "булимия", "переедание", "еда", "вес"], "teachers": ["Анжела Макарова", "Ксения Соловьева", "Ольга Тумсэк"], "mode": "waitlist", "status": "Лист ожидания", "startDate": null, "startDates": [], "price": null, "booking": 5000}, {"slug": "business-consulting", "title": "Корпоративное консультирование для психологов", "subtitle": "повышение квалификации · удостоверение", "description": "Курс даёт практическую рамку: как упаковать свою экспертизу в продукт, говорить с HR и руководителями на их языке и проектировать форматы, которые покупают и в которых видят пользу.", "url": "https://modern-psy.ru/business-consulting", "cover": {"url": "https://s3.twcstorage.ru/asp-media/business_consulting_ea2f1161f3.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 58, "promo": null, "searchWords": ["корпоративное", "бизнес", "организационное", "компании", "сотрудники", "EAP", "выгорание"], "teachers": [], "mode": "waitlist", "status": "Лист ожидания", "startDate": null, "startDates": [], "price": null, "booking": 5000}, {"slug": "oct", "title": "ОСТ: Односессионная терапия", "subtitle": "повышение квалификации · удостоверение", "description": "Два дня практики по односессионной терапии с экспертом международного уровня: кейсы, демонстрации и готовые инструменты для работы.", "url": "https://modern-psy.ru/oct", "cover": {"url": "https://s3.twcstorage.ru/asp-media/oct_e765761b58.webp", "alt": ""}, "section": "Методы психотерапии", "flagship": false, "hours": 22, "promo": null, "searchWords": ["ОСТ", "односессионная", "одна сессия", "single session"], "teachers": [], "mode": "waitlist", "status": "Лист ожидания", "startDate": null, "startDates": [], "price": null, "booking": 5000}, {"slug": "s-risk", "title": "Оценка и управление суицидальным риском", "subtitle": "повышение квалификации · удостоверение", "description": "Курс основан на международной программе AMSR, которая обучает ключевым навыкам работы с суицидальным риском.", "url": "https://modern-psy.ru/s-risk", "cover": {"url": "https://s3.twcstorage.ru/asp-media/s_risk_77db7cb9c9.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 20, "promo": null, "searchWords": ["суицид", "суицидальный", "суицидальный риск", "самоповреждение", "кризис"], "teachers": ["Всеволод Ардов"], "mode": "waitlist", "status": "Лист ожидания", "startDate": null, "startDates": [], "price": null, "booking": 5000}, {"slug": "course-rl", "title": "Современная интегративная психотерапия расстройств личности", "subtitle": "повышение квалификации · удостоверение", "description": "На курсе вы подробно изучите клинические критерии 10 расстройств по МКБ и DSM, принципы успешных терапевтических интервенций и специфику взаимодействия с клиентами на короткой и долгой дистанциях.", "url": "https://modern-psy.ru/course-rl", "cover": {"url": "https://s3.twcstorage.ru/asp-media/course_rl_5e54167f2d.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": null, "promo": null, "searchWords": ["расстройства личности", "ПРЛ", "пограничное", "нарциссическое", "интегративная"], "teachers": [], "mode": "waitlist", "status": "Лист ожидания", "startDate": null, "startDates": [], "price": null, "booking": 5000}, {"slug": "sportivnaya-psihologiya", "title": "Спортивная психология", "subtitle": "профессиональная переподготовка · диплом", "description": "Системный курс по спортивной психологии: от диагностики до выстраивания работы со спортсменом, его окружением и результатами. Практика, современные подходы и реальные кейсы.", "url": "https://modern-psy.ru/sportivnaya-psihologiya", "cover": {"url": "https://s3.twcstorage.ru/asp-media/sportivnaya_psihologiya_2cce5b8591.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 252, "promo": null, "searchWords": ["спорт", "спортивная", "спортсмены", "тренеры", "соревнования"], "teachers": ["Дарья Батищева"], "mode": "waitlist", "status": "Лист ожидания", "startDate": null, "startDates": [], "price": null, "booking": 5000}, {"slug": "schema-terapiya-neklinicheskie-zaprosy", "title": "Схема-терапия: 10 краткосрочных протоколов для повседневных запросов", "subtitle": "повышение квалификации · удостоверение", "description": "Научитесь выстраивать чёткий план терапии на 7–⁠10 встреч, опираясь на современные протоколы для работы с выгоранием, прокрастинацией, ревностью, сепарацией и другими часто встречающимися запросами.", "url": "https://modern-psy.ru/schema-terapiya-neklinicheskie-zaprosy", "cover": {"url": "https://s3.twcstorage.ru/asp-media/schema_terapiya_neklinicheskie_zaprosy_fa3a4c6733.webp", "alt": ""}, "section": "Методы психотерапии", "flagship": false, "hours": 52, "promo": null, "searchWords": ["схема-терапия", "схематерапия", "schema", "протоколы", "краткосрочная", "повседневные запросы", "режимы"], "teachers": ["Анна Белова", "Мария Семиглазова"], "mode": "waitlist", "status": "Лист ожидания", "startDate": null, "startDates": [], "price": null, "booking": 5000}, {"slug": "addiction-therapy", "title": "Техники терапии зависимостей", "subtitle": "повышение квалификации · удостоверение", "description": "Курс включает в себя основы мотивационного интервью, ACT в работе с зависимостями и протоколы, основанные на mindfulness. Курс позволяет сразу начать работать с клиентами с зависимостью.", "url": "https://modern-psy.ru/addiction-therapy", "cover": {"url": "https://s3.twcstorage.ru/asp-media/addiction_therapy_209760123f.webp", "alt": ""}, "section": "Специализации", "flagship": false, "hours": 130, "promo": null, "searchWords": ["зависимости", "аддикции", "алкоголь", "наркотики", "созависимость"], "teachers": ["Илья Гавин", "Светлана Лысенко", "Татьяна Волк"], "mode": "waitlist", "status": "Лист ожидания", "startDate": null, "startDates": [], "price": null, "booking": 5000}, {"slug": "cft", "title": "CFT: Введение в терапию, сфокусированную на сострадании", "subtitle": "повышение квалификации · удостоверение", "description": "Курс направлен на освоение концептуальной модели CFT, понимание роли сострадания в психотерапии и интеграцию подхода в работу с клиентами с высоким уровнем самокритики и сложными эмоциями независимо от их основного терапевтического метода.", "url": "https://modern-psy.ru/cft", "cover": {"url": "https://s3.twcstorage.ru/asp-media/cft_10b878a04c.webp", "alt": ""}, "section": "Методы психотерапии", "flagship": false, "hours": 76, "promo": null, "searchWords": ["CFT", "СФТ", "сострадание", "компассия", "стыд", "самокритика", "Гилберт"], "teachers": ["Исмагилова Эльвира"], "mode": "waitlist", "status": "Лист ожидания", "startDate": null, "startDates": [], "price": null, "booking": 5000}, {"slug": "fap", "title": "FAP: Функциональная аналитическая терапия", "subtitle": "повышение квалификации · удостоверение", "description": "Станет отличным дополнением к базовой КБТ-терапии, если клиент недостаточно отвечает на стандартные протоколы работы", "url": "https://modern-psy.ru/fap", "cover": {"url": "https://s3.twcstorage.ru/asp-media/fap_4b552f3618.webp", "alt": ""}, "section": "Методы психотерапии", "flagship": false, "hours": 47, "promo": null, "searchWords": ["FAP", "ФАП", "функциональная аналитическая", "функционально-аналитическая", "терапевтические отношения"], "teachers": ["Ксения Белова"], "mode": "waitlist", "status": "Лист ожидания", "startDate": null, "startDates": [], "price": null, "booking": 5000}];
/* Темы запросов клиентов из CMS (поле topics в ответе каталога) */
const TOPICS = [{"title": "Психотические расстройства", "terms": ["шизофрения", "психоз", "психотическое", "бред", "галлюцинации", "шизоаффективное", "параноидное"], "courses": ["psychiatry-for-psy", "clinical_psychology", "clinical-psychology-start"]}, {"title": "Препараты и психиатрия", "terms": ["антидепрессанты", "таблетки", "препараты", "медикаменты", "фармакотерапия", "фармакология", "нейролептики", "антипсихотики", "транквилизаторы", "стабилизаторы настроения", "сиозс"], "courses": ["psychiatry-for-psy", "bar", "clinical_psychology"]}, {"title": "Военные и участники боевых действий", "terms": ["сво", "ветераны", "военные", "военнослужащие", "участники боевых действий", "боевые действия", "боевой опыт", "мобилизация", "мобилизованные", "семьи военных", "жены военных"], "courses": ["battle-trauma-ptsd", "course-marketing-data", "obuchenie-emdr-dpdg-terapii"]}, {"title": "Травма и ПТСР", "terms": ["травма", "птср", "кптср", "флешбэки", "посттравматическое", "травматический опыт", "психологическая травма"], "courses": ["course-marketing-data", "obuchenie-emdr-dpdg-terapii", "battle-trauma-ptsd", "abuse-therapy"]}, {"title": "Насилие", "terms": ["насилие", "абьюз", "домашнее насилие", "сексуальное насилие", "инцест"], "courses": ["abuse-therapy", "course-marketing-data"]}, {"title": "Депрессия", "terms": ["депрессия", "депрессивное", "апатия", "подавленность"], "courses": ["cbt-oxford", "kpt", "act", "clinical_psychology"]}, {"title": "Тревога и паника", "terms": ["тревога", "тревожность", "панические атаки", "паника", "фобии", "страхи", "беспокойство"], "courses": ["cbt-oxford", "kpt", "act", "obuchenie-emdr-dpdg-terapii"]}];

/* Генераторы обложек из артефакта «Обложки каталога» (итерация 4) */
/* Восемь тонов обложек: светлый фон и насыщенный тон для залитого элемента */
const TINTS = {
  slate: ['#DCE3EC', '#4A6688'], sage: ['#DFE8DC', '#557352'], sand: ['#EEE6D6', '#8E6F3A'],
  clay: ['#F0DFD6', '#A65F43'], rose: ['#F1E0E5', '#9C5069'], mist: ['#D9E8E6', '#3B7770'],
  lilac: ['#E5E3EF', '#5D5A86'], stone: ['#E6E3DE', '#6E665C']
};
const INK = '#2B2334';

/* Курс → схема, семья, аббревиатура, короткое имя */
const M = {
  'clinical_psychology': { g: 'criteria', t: 'lilac', c: 'Клин', n: 'Клинический психолог' },
  'clinical-psychology-start': { g: 'criteria', t: 'lilac', c: 'Клин', n: 'Введение в клиническую', mini: 1 },
  'psyeducation': { g: 'egan', t: 'sand', c: 'ПК', n: 'Психолог-консультант' },
  'put-v-professiyu': { g: 'egan', t: 'sand', c: 'ПК', n: 'Путь в профессию', mini: 1 },
  'kpt': { g: 'beck', t: 'slate', c: 'КПТ', n: 'КПТ, модель Бека' },
  'cbt-oxford': { g: 'flower', t: 'slate', c: 'КПТ', n: 'КПТ, Оксфорд' },
  'cbt-first-steps': { g: 'beck', t: 'slate', c: 'КПТ', n: 'Первые шаги в КПТ', mini: 1 },
  'cbt-workshops': { g: 'tri3', t: 'slate', c: 'КПТ', n: 'Мастерская КПТ' },
  'act': { g: 'hexa', t: 'sage', c: 'ACT', n: 'ACT' },
  'act-base': { g: 'hexa', t: 'sage', c: 'ACT', n: 'Первое знакомство с ACT', mini: 1 },
  'cft': { g: 'cft', t: 'rose', c: 'CFT', n: 'CFT' },
  'mother': { g: 'hold', t: 'rose', c: 'ACT+CFT', n: 'Терапия для матерей' },
  'fap': { g: 'fap', t: 'mist', c: 'FAP', n: 'FAP' },
  'rft': { g: 'rft', t: 'stone', c: 'RFT', n: 'RFT' },
  'schema-therapy': { g: 'pattern', t: 'clay', c: 'Схема', n: 'Схема-терапия' },
  'schema-terapiya-neklinicheskie-zaprosy': { g: 'modes', t: 'clay', c: 'Схема', n: 'Схема-терапия, неклинические запросы' },
  'client-centered-therapy': { g: 'rogers', t: 'sand', c: 'КЦТ', n: 'Клиент-центрированная терапия' },
  'sexology': { g: 'dual', t: 'rose', c: 'Сексология', n: 'Сексология' },
  'business-consulting': { g: 'org', t: 'slate', c: 'Бизнес', n: 'Бизнес-консультирование' },
  'couples-therapy': { g: 'bridge', t: 'clay', c: 'Пары', n: 'Терапия пар' },
  'couple-requests': { g: 'dist', t: 'clay', c: 'Отношения', n: 'Тема отношений' },
  'course-marketing-data': { g: 'window', t: 'stone', c: 'ПТСР', n: 'Терапия травмы' },
  'battle-trauma-ptsd': { g: 'broken', t: 'stone', c: 'ПТСР', n: 'Военная травма' },
  'abuse-therapy': { g: 'cont', t: 'stone', c: 'Травма', n: 'Последствия насилия в детстве' },
  'autistic-disorders': { g: 'spiky', t: 'sage', c: 'РАС', n: 'РАС' },
  'neurodivergence': { g: 'neuro', t: 'sage', c: 'РАС+СДВГ', n: 'Нейроотличные клиенты' },
  'adhd-adult': { g: 'route', t: 'sage', c: 'СДВГ', n: 'Коучинг при СДВГ' },
  'adult-adhd-therapy': { g: 'clock', t: 'sage', c: 'СДВГ', n: 'Взрослые с СДВГ' },
  'rpp': { g: 'cycle', t: 'rose', c: 'РПП', n: 'РПП' },
  'rpp-start': { g: 'cycle', t: 'rose', c: 'РПП', n: 'Терапия РПП, мини-курс', mini: 1 },
  'bar': { g: 'bar', t: 'lilac', c: 'БАР', n: 'Биполярное расстройство' },
  'sportivnaya-psihologiya': { g: 'yerkes', t: 'clay', c: 'Спорт', n: 'Спортивная психология' },
  'logic': { g: 'toul', t: 'sand', c: 'Логика', n: 'Логика и аргументация' },
  'narrative-therapy': { g: 'story', t: 'sand', c: 'Нарратив', n: 'Нарративная терапия' },
  'obuchenie-emdr-dpdg-terapii': { g: 'bilat', t: 'mist', c: 'EMDR', n: 'EMDR' },
  'orkt': { g: 'scale', t: 'mist', c: 'ОРКТ', n: 'ОРКТ' },
  'oct': { g: 'single', t: 'sage', c: 'ОСТ', n: 'Односессионная терапия' },
  'sft': { g: 'geno', t: 'clay', c: 'ССТ', n: 'Семейная системная терапия' },
  'ifs': { g: 'ifs', t: 'lilac', c: 'IFS', n: 'IFS' },
  'rodbt-live': { g: 'open', t: 'mist', c: 'РО ДБТ', n: 'РО ДБТ, уровень 1', lvl: 1 },
  'rodbt-lvl2': { g: 'open', t: 'mist', c: 'РО ДБТ', n: 'РО ДБТ, уровень 2', lvl: 2 },
  'eet-course': { g: 'calm', t: 'mist', c: 'ТЭЭ', n: 'ТЭЭ' },
  'mbt-i': { g: 'mind', t: 'sage', c: 'MBT-I', n: 'MBT-I' },
  's-risk': { g: 'stairs', t: 'stone', c: 'Риск', n: 'Суицидальный риск' },
  'child-psy': { g: 'growth', t: 'sand', c: 'Дети', n: 'Детская психология' },
  'womens-care': { g: 'three', t: 'rose', c: 'Женщины', n: 'Работа с женщинами' },
  'course-rl': { g: 'radar', t: 'lilac', c: 'РЛ', n: 'Расстройства личности' },
  'addiction-therapy': { g: 'spiral', t: 'slate', c: 'Зависимость', n: 'Зависимости' },
  'feminist-lens': { g: 'lens', t: 'rose', c: 'Фем', n: 'Феминистская оптика' },
  'navyki-konsultirovaniya-dlya-psihologov': { g: 'pyr', t: 'lilac', c: 'Навыки', n: 'Навыки консультирования' }
};

/* Схема → название, тип (m — модель метода, f — метафора), пояснение */
const GL = {
  criteria: { n: 'Критерии диагноза', k: 'm', d: 'Диагноз ставят, когда набирается нужное число критериев, например пять из девяти.' },
  egan: { n: 'Модель Игана', k: 'm', d: 'Три шага консультирования: где клиент сейчас, куда хочет прийти и как туда дойти.' },
  beck: { n: 'Когнитивный треугольник', k: 'm', d: 'Мысли, эмоции и поведение влияют друг на друга. Залиты мысли: с них начинается работа.' },
  flower: { n: 'Порочный цветок', k: 'm', d: 'Формулировка случая: проблему в центре поддерживают замкнутые круги-лепестки. Отделяет Оксфорд от Бека внутри одной семьи.' },
  tri3: { n: 'Треугольник три раза', k: 'f', d: 'Модель КПТ, отработанная несколько раз: курс про практику навыков.' },
  hexa: { n: 'Гексафлекс', k: 'm', d: 'Шесть процессов психологической гибкости связаны друг с другом. В центре сама гибкость.' },
  cft: { n: 'Три круга эмоций', k: 'm', d: 'Системы угрозы, достижения и успокоения по Гилберту. Залита система успокоения, её и тренирует CFT.' },
  hold: { n: 'Рядом', k: 'f', d: 'Большой и маленький круг рядом: мать и ребёнок, и забота о той, кто заботится.' },
  fap: { n: 'Цикл в отношениях', k: 'f', d: 'FAP работает с поведением клиента прямо в отношениях с терапевтом, здесь и сейчас.' },
  rft: { n: 'Производные отношения', k: 'm', d: 'Связи А–Б и Б–В выучены, связь А–В человек выводит сам. Она пунктиром.' },
  pattern: { n: 'Повторяющаяся схема', k: 'f', d: 'Ранняя схема повторяется в разных ситуациях, и в одной из них она сработала.' },
  modes: { n: 'Режимы', k: 'm', d: 'Модель режимов схема-терапии. Залит здоровый взрослый.' },
  rogers: { n: 'Конгруэнтность', k: 'm', d: 'Я-концепция и опыт по Роджерсу. Их пересечение растёт в терапии.' },
  dual: { n: 'Двойной контроль', k: 'm', d: 'Сексуальный отклик — баланс «газа» и «тормоза»: модель Банкрофта и Янссена.' },
  org: { n: 'Оргструктура', k: 'f', d: 'Работа с командой и компанией, а не только с одним человеком.' },
  bridge: { n: 'Мост', k: 'f', d: 'Двое и связь между ними.' },
  dist: { n: 'Дистанция', k: 'f', d: 'Близость и расстояние: главная тема запросов про отношения.' },
  window: { n: 'Окно толерантности', k: 'm', d: 'Зона, в которой человек выдерживает переживания. При травме возбуждение вылетает за её границы.' },
  broken: { n: 'Застрявший фрагмент', k: 'f', d: 'Травматическое воспоминание не встраивается в историю жизни и остаётся «сейчас». Терапия возвращает его на место.' },
  cont: { n: 'Безопасное пространство', k: 'f', d: 'Работа начинается с безопасности и границ.' },
  spiky: { n: 'Неровный профиль', k: 'm', d: 'Сильные и слабые стороны при РАС сильно различаются, профиль получается зубчатым.' },
  neuro: { n: 'Два профиля', k: 'f', d: 'РАС и СДВГ: два разных неровных профиля на одной шкале.' },
  route: { n: 'Маршрут', k: 'f', d: 'Коучинг собирает рассеянное внимание в путь к цели.' },
  clock: { n: 'Неровное время', k: 'f', d: 'При СДВГ время ощущается неравномерно.' },
  cycle: { n: 'Поддерживающий цикл', k: 'm', d: 'Ограничение, срыв и компенсация поддерживают друг друга.' },
  bar: { n: 'Фазы настроения', k: 'f', d: 'Подъём и спад, между которыми живёт человек с БАР.' },
  yerkes: { n: 'Закон Йеркса — Додсона', k: 'm', d: 'Результат лучше всего при среднем возбуждении: перевёрнутая U.' },
  toul: { n: 'Модель Тулмина', k: 'm', d: 'Данные, вывод и основание, которое их связывает.' },
  story: { n: 'Альтернативная история', k: 'm', d: 'Рядом с доминирующей историей появляется другая, и её насыщают деталями.' },
  bilat: { n: 'Билатеральная стимуляция', k: 'm', d: 'Движение взгляда слева направо, на котором построен EMDR.' },
  scale: { n: 'Шкалирующий вопрос', k: 'm', d: 'Где вы от 0 до 10 и что поможет подняться на один балл.' },
  single: { n: 'Одна встреча', k: 'f', d: 'Одной сессии может быть достаточно, дальше человек идёт сам.' },
  geno: { n: 'Генограмма', k: 'm', d: 'Схема семьи. Заливкой отмечен носитель симптома.' },
  ifs: { n: 'Self и части', k: 'm', d: 'Внутри много частей, вокруг них Self: пространство, которое их принимает.' },
  open: { n: 'Выход из круга', k: 'f', d: 'Радикальная открытость: выйти из слишком плотного самоконтроля. Число колец показывает уровень обучения.' },
  calm: { n: 'От всплеска к ровной волне', k: 'f', d: 'Эмоция проходит, если её не подавлять.' },
  mind: { n: 'Ум в уме', k: 'm', d: 'Ментализация: я держу в голове твой ум, ты держишь мой.' },
  stairs: { n: 'План безопасности', k: 'f', d: 'Пошаговый план, который составляют вместе с клиентом.' },
  growth: { n: 'Развитие', k: 'f', d: 'Возрастные ступени ребёнка.' },
  three: { n: 'Три специалиста', k: 'f', d: 'Гинекология, психология и психиатрия вместе.' },
  radar: { n: 'Профиль черт', k: 'm', d: 'Дименсиональный взгляд: у каждого расстройства личности свой профиль.' },
  spiral: { n: 'Спираль', k: 'f', d: 'Зависимость затягивает по кругу, терапия выводит наружу.' },
  lens: { n: 'Линза', k: 'f', d: 'Линза меняет ход лучей, феминистская оптика меняет взгляд на запрос.' },
  pyr: { n: 'Иерархия микронавыков', k: 'm', d: 'Навыки по Айви строятся снизу вверх, в основании внимание к клиенту.' }
};

/* ---------- Примитивы SVG в координатах −50…50 ---------- */
const F = n => +(+n).toFixed(2);
const c = (x, y, r, cls = 's') => `<circle class="${cls}" cx="${F(x)}" cy="${F(y)}" r="${r}"/>`;
const l = (x1, y1, x2, y2, cls = 's') => `<line class="${cls}" x1="${F(x1)}" y1="${F(y1)}" x2="${F(x2)}" y2="${F(y2)}"/>`;
const p = (d, cls = 's', extra = '') => `<path class="${cls}" d="${d}"${extra}/>`;
const r = (cx, cy, w, h, rx, cls = 's') => `<rect class="${cls}" x="${F(cx - w / 2)}" y="${F(cy - h / 2)}" width="${w}" height="${h}" rx="${rx}"/>`;
const poly = (pts, cls = 's', closed = true) => `<${closed ? 'polygon' : 'polyline'} class="${cls}" points="${pts.map(q => F(q[0]) + ',' + F(q[1])).join(' ')}"/>`;
const rad = a => a * Math.PI / 180;
const pol = (R, a) => [R * Math.cos(rad(a)), R * Math.sin(rad(a))];
const arcPath = (R, a0, a1, dx = 0, dy = 0) => {
  const s = pol(R, a0), e = pol(R, a1);
  return `M${F(s[0] + dx)},${F(s[1] + dy)} A${R},${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${F(e[0] + dx)},${F(e[1] + dy)}`;
};
const smooth = pts => {
  let d = `M${F(pts[0][0])},${F(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${F(p1[0] + (p2[0] - p0[0]) / 6)},${F(p1[1] + (p2[1] - p0[1]) / 6)} ${F(p2[0] - (p3[0] - p1[0]) / 6)},${F(p2[1] - (p3[1] - p1[1]) / 6)} ${F(p2[0])},${F(p2[1])}`;
  }
  return d;
};
const head = (x, y, dir, len = 5, cls = 's') => {
  const a1 = pol(len, dir + 180 - 32), a2 = pol(len, dir + 180 + 32);
  return p(`M${F(x + a1[0])},${F(y + a1[1])} L${F(x)},${F(y)} L${F(x + a2[0])},${F(y + a2[1])}`, cls);
};
const near = (pts, T) => pts.reduce((b, q) => (Math.hypot(q[0] - T[0], q[1] - T[1]) < Math.hypot(b[0] - T[0], b[1] - T[1]) ? q : b));
const nearRow = (rows, y) => rows.reduce((b, v) => (Math.abs(v - y) < Math.abs(b - y) ? v : b));
let uid = 0;

/* ---------- Узоры из моделей: поле 320×140, края обрезаются ----------
   Каждая функция получает посев R и точку акцента T, возвращает
   o — узор (рисуется тоном семьи полупрозрачно) и a — акцент (в полную силу). */
const PAT = {
  criteria(R, T) {
    const s = 54, rr = 19; let o = ''; const pts = [];
    for (let y = 4; y < 170; y += s) for (let x = 4; x < 350; x += s) pts.push([x, y]);
    const q = near(pts, T);
    pts.forEach(([x, y]) => {
      const di = Math.round((x - q[0]) / s), dj = Math.round((y - q[1]) / s);
      const inBlock = Math.abs(di) <= 1 && Math.abs(dj) <= 1, i = di + 1 + 3 * (dj + 1);
      o += c(x, y, rr, inBlock && [0, 2, 5, 7].includes(i) ? 'pf' : 'ps');
    });
    return { o, a: c(q[0], q[1], rr, 'af') };
  },
  egan(R, T) {
    let o = ''; const pts = [];
    [[34, -20], [104, 12]].forEach(([y, off], j) => {
      o += l(-10, y, 330, y, 'ps');
      for (let x = off, k = j; x < 350; x += 64, k++) { const f = k % 3 === 2; if (f) pts.push([x, y]); o += c(x, y, 20, f ? 'pf' : 'pb'); }
    });
    const q = near(pts, T); return { o, a: c(q[0], q[1], 20, 'af') };
  },
  beck(R, T) {
    const s = 96, h = s * Math.sqrt(3) / 2, k = 1 / Math.sqrt(3); let o = '';
    for (let j = -3; j <= 3; j++) { const y = T[1] + j * h; o += l(-20, y, 340, y, 'ps'); }
    for (let i = -6; i <= 6; i++) { const x0 = T[0] + i * s; o += l(x0 + (-20 - T[1]) * k, -20, x0 + (170 - T[1]) * k, 170, 'ps') + l(x0 - (-20 - T[1]) * k, -20, x0 - (170 - T[1]) * k, 170, 'ps'); }
    for (let j = -3; j <= 3; j++) for (let i = -6; i <= 6; i++) { const x = T[0] + i * s + j * s / 2, y = T[1] + j * h; if (x > -20 && x < 340 && y > -20 && y < 160) o += c(x, y, 9, 'pb'); }
    return { o, a: c(T[0], T[1], 11, 'af') };
  },
  flower(R, T) {
    const fl = (cx, cy, d, rx, ry) => { let s = ''; for (let k = 0; k < 6; k++) s += `<ellipse class="ps" cx="${F(cx)}" cy="${F(cy - d)}" rx="${rx}" ry="${ry}" transform="rotate(${k * 60} ${F(cx)} ${F(cy)})"/>`; return s; };
    return { o: fl(T[0], T[1], 50, 22, 36) + fl(-6, 8, 34, 15, 24) + c(-6, 8, 12, 'pf'), a: c(T[0], T[1], 14, 'af') };
  },
  tri3(R, T) {
    let o = '', k = 0; const pts = [];
    const tri = (x, y, cls) => poly([[x, y - 24], [x - 26, y + 21], [x + 26, y + 21]], cls);
    [[38, 20], [108, -22]].forEach(([y, off]) => { for (let x = off; x < 360; x += 76, k++) { pts.push([x, y]); o += tri(x, y, k % 3 === 2 ? 'pf' : 'ps'); } });
    const q = near(pts, T); return { o, a: tri(q[0], q[1], 'af') };
  },
  hexa(R, T) {
    const r0 = 44, w = Math.sqrt(3) * r0, vh = 1.5 * r0; let o = '';
    const hex = (x, y) => [0, 1, 2, 3, 4, 5].map(k => { const q = pol(r0, -90 + 60 * k); return [x + q[0], y + q[1]]; });
    for (let j = -2; j <= 2; j++) for (let i = -4; i <= 4; i++) { const x = T[0] + i * w + (Math.abs(j) % 2 ? w / 2 : 0), y = T[1] + j * vh; if (x > -60 && x < 380 && y > -60 && y < 200) o += poly(hex(x, y), 'ps') + c(x, y, 4, 'pf'); }
    const V = hex(T[0], T[1]);
    return { o, a: poly(V, 'as') + poly([V[0], V[2], V[4]], 'as th') + poly([V[1], V[3], V[5]], 'as th') + c(T[0], T[1], 9, 'af') };
  },
  cft(R, T) {
    let o = '';
    const trio = (x, y, rr) => { const D = (2 * rr + 6) / Math.sqrt(3); return [-90, 150, 30].map(a => { const q = pol(D, a); return [x + q[0], y + q[1], rr]; }); };
    const main = trio(T[0], T[1], 30);
    [...trio(14, 18, 22), ...trio(84, 150, 20)].forEach((q, i) => o += c(q[0], q[1], q[2], i % 3 === 2 ? 'pf' : 'ps'));
    main.slice(0, 2).forEach(q => o += c(q[0], q[1], q[2], 'ps'));
    return { o, a: c(main[2][0], main[2][1], 30, 'af') };
  },
  hold(R, T) {
    let o = ''; const pts = [];
    for (const [y, off] of [[30, 10], [102, 65]]) for (let x = off; x < 360; x += 110) { o += c(x, y, 28, 'ps') + c(x + 35, y + 18.8, 11.8, 'pf'); pts.push([x + 35, y + 18.8]); }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 11.8, 'af') };
  },
  fap(R, T) {
    let o = ''; const pts = [], sp = 92;
    for (const [y, off] of [[36, -30], [106, 16]]) {
      for (let x = off; x < 340; x += sp) o += p(`M${x},${y} Q${x + sp / 2},${y - 34} ${x + sp},${y} Q${x + sp / 2},${y + 34} ${x},${y}`, 'ps');
      for (let x = off; x < 350; x += sp) { o += c(x, y, 9, 'pb'); pts.push([x, y]); }
    }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 10, 'af') };
  },
  rft(R, T) {
    let o = ''; const s = 74, N = [];
    for (let y = T[1] - 2 * s; y < 180; y += s) for (let x = T[0] - 3 * s; x < 360; x += s) if (y > -40 && x > -40) N.push([x, y]);
    N.forEach(([x, y]) => { o += l(x, y, x + s, y, R() < 0.35 ? 'ps dsh' : 'ps') + l(x, y, x, y + s, R() < 0.35 ? 'ps dsh' : 'ps'); if (R() < 0.3) o += l(x, y, x + s, y + s, 'ps dsh'); });
    N.forEach(([x, y]) => o += r(x, y, 18, 18, 3, 'pb'));
    return { o, a: r(T[0], T[1], 20, 20, 3, 'af') };
  },
  pattern(R, T) {
    const rr = 40; let o = ''; const pts = [];
    for (let j = 0, y = -6; y < 190; j++, y += rr) for (let x = (j % 2 ? rr : 0) - rr; x < 370; x += 2 * rr) { o += p(`M${x - rr},${y} A${rr},${rr} 0 0 1 ${x + rr},${y}`, 'ps'); pts.push([x, y]); }
    const q = near(pts, T); return { o, a: p(`M${q[0] - rr},${q[1]} A${rr},${rr} 0 0 1 ${q[0] + rr},${q[1]} Z`, 'af') };
  },
  modes(R, T) {
    const s = 68; let o = ''; const pts = [];
    const qd = (x, y, k) => [
      `M${x},${y} L${x + s},${y} A${s},${s} 0 0 1 ${x},${y + s} Z`,
      `M${x + s},${y} L${x + s},${y + s} A${s},${s} 0 0 1 ${x},${y} Z`,
      `M${x},${y + s} L${x},${y} A${s},${s} 0 0 1 ${x + s},${y + s} Z`,
      `M${x + s},${y + s} L${x},${y + s} A${s},${s} 0 0 1 ${x + s},${y} Z`][k];
    for (let y = -10; y < 150; y += s) for (let x = -14; x < 330; x += s) { const d = qd(x, y, Math.floor(R() * 4)); o += p(d, R() < 0.3 ? 'pf' : 'ps'); pts.push([x + s / 2, y + s / 2, d]); }
    const q = near(pts, T); return { o, a: p(q[2], 'af') };
  },
  rogers(R, T) {
    const rr = 30, off = 17, h = F(Math.sqrt(rr * rr - off * off)); let o = ''; const pts = [];
    for (const [y, x0] of [[30, -10], [108, 60]]) for (let x = x0; x < 370; x += 140) {
      const lens = `M${x},${F(y - h)} A${rr},${rr} 0 0 1 ${x},${F(y + h)} A${rr},${rr} 0 0 1 ${x},${F(y - h)} Z`;
      o += p(lens, 'pf') + c(x - off, y, rr, 'ps') + c(x + off, y, rr, 'ps'); pts.push([x, y, lens]);
    }
    const q = near(pts, T); return { o, a: p(q[2], 'af') };
  },
  dual(R, T) {
    let o = ''; const pts = [];
    for (const [y, off] of [[40, -20], [112, 30]]) {
      let d = ''; const P = [];
      for (let i = 0, x = off - 100; x < 420; i++, x += 100) { const yy = y + (i % 2 ? 16 : -16); P.push([x, yy, i % 2]); d += (i ? 'L' : 'M') + x + ',' + yy; }
      o += p(d, 'ps');
      P.forEach(([x, yy, dn]) => { if (dn) { o += c(x, yy - 14, 12, 'pf'); pts.push([x, yy - 14]); } else o += c(x, yy - 8, 6, 'pb'); });
    }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 12, 'af') };
  },
  org(R, T) {
    let o = '';
    const rows = [-66, 0, 66].map((dy, j) => { const a = []; for (let x = T[0] - 336 + (j === 1 ? 0 : 42); x < 380; x += 84) a.push([x, T[1] + dy]); return a; });
    rows.forEach((row, j) => { if (!j) return; row.forEach(([x, y]) => {
      const par = rows[j - 1].reduce((b, q) => (Math.abs(q[0] - x) < Math.abs(b[0] - x) ? q : b));
      o += p(`M${F(x)},${F(y - 11)} V${F(y - 33)} H${F(par[0])} V${F(par[1] + 11)}`, 'ps');
    }); });
    rows.flat().forEach(([x, y]) => o += r(x, y, 34, 22, 5, 'pb'));
    return { o, a: r(T[0], T[1], 34, 22, 5, 'af') };
  },
  bridge(R, T) {
    let o = ''; const pts = [], sp = 96;
    for (const [y, off] of [[62, -20], [140, 28]]) {
      for (let x = off - sp; x < 380; x += sp) { o += p(`M${x},${y} Q${x + sp / 2},${y - 70} ${x + sp},${y}`, 'ps') + c(x + sp / 2, y - 35, 5, 'pf'); pts.push([x + sp / 2, y - 35]); }
      for (let x = off - sp; x < 400; x += sp) o += c(x, y, 10, 'pb');
    }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 8, 'af') };
  },
  dist(R, T) {
    let o = ''; const pts = [];
    for (const y of [26, 74, 122]) {
      let x = -20 + R() * 30;
      while (x < 340) {
        const d = 40 + R() * 60;
        o += l(x + 16, y, x + d - 16, y, 'pt') + l(x + 16, y - 8, x + 16, y + 8, 'pt') + l(x + d - 16, y - 8, x + d - 16, y + 8, 'pt') + c(x, y, 9, 'pf') + c(x + d, y, 9, 'ps');
        pts.push([x, y]); x += d + 40 + R() * 30;
      }
    }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 10, 'af') };
  },
  window(R, T) {
    let o = '', a = ''; const rows = []; for (let y = 14; y < 150; y += 24) rows.push(y);
    const tx = Math.round(T[0] / 16) * 16, sr = nearRow(rows, T[1] + 20);
    rows.forEach(y => {
      const ph = R() * 6, P = []; for (let x = -16; x <= 336; x += 16) P.push([x, y + Math.sin(x / 40 + ph) * 4]);
      if (y !== sr) { o += p(smooth(P), 'ps'); return; }
      const Q = P.map(([x, yy]) => { const dx = x - tx; return [x, dx === 0 ? y - 48 : dx === -16 ? y - 6 : dx === 16 ? y + 18 : yy]; });
      a = poly(Q, 'as', false) + c(tx, y - 48, 7, 'af');
    });
    return { o, a };
  },
  broken(R, T) {
    let o = '', a = ''; const rows = []; for (let y = 16; y < 150; y += 30) rows.push(y);
    const ar = nearRow(rows, T[1] + 8);
    rows.forEach(y => {
      let x = -20 - R() * 30;
      while (x < 330) {
        let L = 40 + R() * 90;
        if (y === ar && !a && x + L >= T[0]) { L = Math.max(L, 70); o += l(x, y, x + L, y, 'pt pdot'); a = l(x, y - 18, x + L, y - 18, 'as w'); }
        else o += l(x, y, x + L, y, 'pw');
        x += L + 14 + R() * 16;
      }
    });
    return { o, a };
  },
  cont(R, T) {
    let o = ''; const pts = [];
    for (let y = -14; y < 150; y += 74) for (let x = -24; x < 340; x += 88) { o += r(x + 36, y + 30, 72, 60, 20, 'ps'); if (R() < 0.2) o += c(x + 36, y + 42, 8, 'pf'); pts.push([x + 36, y + 42]); }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 10, 'af') };
  },
  spiky(R, T) {
    let o = ''; const pts = [], base = 132;
    o += l(-10, base, 330, base, 'ps');
    for (let x = 8; x < 330; x += 18) { const h = 10 + Math.pow(R(), 1.4) * 96; o += l(x, base, x, base - h, 'ps') + c(x, base - h, 4.5, 'pf'); pts.push([x, base - h]); }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 8, 'af') };
  },
  neuro(R, T) {
    let o = ''; const pts = [];
    for (let j = 0, y = 10; y < 160; j++, y += 20) {
      const fast = j % 2, P = [];
      for (let x = -10; x <= 340; x += fast ? 14 : 30) P.push([x, y + (R() - 0.5) * (fast ? 10 : 14)]);
      o += p(smooth(P), fast ? 'ps' : 'pw'); pts.push(...P);
    }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 7, 'af') };
  },
  route(R, T) {
    let o = ''; const D = [];
    for (let i = 0; i < 46; i++) { const q = [R() * 330 - 5, R() * 150 - 5]; D.push(q); o += c(q[0], q[1], 3.6, 'pf'); }
    const S = [16, 30 + R() * 80], way = [];
    for (let k = 0; k <= 5; k++) { const t = k / 5; way.push(k === 5 ? T : near(D, [S[0] + (T[0] - S[0]) * t, S[1] + (T[1] - S[1]) * t + Math.sin(t * Math.PI * 2) * 26])); }
    return { o, a: p(smooth(way), 'as') + way.slice(0, -1).map(q => c(q[0], q[1], 5, 'af')).join('') + c(T[0], T[1], 9, 'af') };
  },
  clock(R, T) {
    let o = ''; const pts = [], C = [T[0] + 30, T[1] + 110];
    for (let rr = 50; rr < 380; rr += 44) {
      o += c(C[0], C[1], rr, 'pt');
      let a = -180;
      while (a < 0) { const s = pol(rr - 9, a), e = pol(rr + 9, a), m = pol(rr, a); o += l(C[0] + s[0], C[1] + s[1], C[0] + e[0], C[1] + e[1], 'ps'); pts.push([C[0] + m[0], C[1] + m[1]]); a += (16 + R() * R() * 90) / rr * 57.3; }
    }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 8, 'af') };
  },
  cycle(R, T) {
    let o = ''; const pts = [];
    for (const [y, off] of [[34, -10], [112, 50]]) for (let x = off; x < 380; x += 120) {
      o += c(x, y, 32, 'ps');
      [-30, 90, 210].forEach(a => { const q = pol(32, a); o += head(x + q[0], y + q[1], a + 90, 9, 'ps'); });
      [-90, 30, 150].forEach((a, i) => { const q = pol(32, a); o += c(x + q[0], y + q[1], 7.5, i === 0 ? 'pf' : 'pb'); if (!i) pts.push([x + q[0], y + q[1]]); });
    }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 9, 'af') };
  },
  bar(R, T) {
    let o = ''; const pts = [];
    for (let y = -10; y < 175; y += 22) {
      let d = ''; for (let x = -20; x <= 340; x += 4) d += (x > -20 ? 'L' : 'M') + x + ',' + F(y + Math.sin((x + y * 1.3) / 38) * 18);
      o += p(d, 'ps');
      for (let k = -3; k < 5; k++) { const x = 38 * (-Math.PI / 2 + 2 * Math.PI * k) - 1.3 * y; if (x > -10 && x < 330) pts.push([x, y - 18]); }
    }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 6, 'af') };
  },
  yerkes(R, T) {
    let o = ''; const pts = [];
    for (const [y, off] of [[86, -40], [170, 30]]) for (let x = off; x < 400; x += 140) {
      [0, 1, 2].forEach(n => { const w = 62 - n * 18, hh = 70 - n * 20; o += p(`M${x - w},${y} C${F(x - w * 0.45)},${F(y - hh * 1.33)} ${F(x + w * 0.45)},${F(y - hh * 1.33)} ${x + w},${y}`, 'ps'); });
      pts.push([x, y - 70]);
    }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 8, 'af') };
  },
  toul(R, T) {
    let o = ''; const N = [], sx = 104, sy = 62;
    for (let j = -2; j <= 2; j++) for (let i = -4; i <= 3; i++) {
      const x = T[0] + i * sx + (Math.abs(j) % 2 ? sx / 2 : 0), y = T[1] + j * sy;
      if (y < -30 || y > 170) continue;
      N.push([x, y]); o += l(x + 20, y, x + sx - 24, y, 'ps') + head(x + sx - 23, y, 0, 9, 'ps');
      if (R() < 0.5) o += l(x + sx / 2, y, x + sx / 2, y + sy - 14, 'pt');
    }
    N.forEach(([x, y]) => o += r(x, y, 34, 22, 4, 'pb'));
    return { o, a: r(T[0], T[1], 34, 22, 4, 'af') };
  },
  story(R, T) {
    let o = ''; for (let y = 12; y < 150; y += 22) o += l(-10, y, 330, y, 'pt');
    const y0 = Math.min(144, 12 + 22 * Math.round((T[1] + 44 - 12) / 22)), x0 = 40 + R() * 30;
    return { o, op: 0.5, a: l(-10, y0, x0, y0, 'as w') + p(`M${F(x0)},${y0} C${F(x0 + 70)},${y0} ${F(T[0] - 80)},${F(T[1])} ${F(T[0])},${F(T[1])}`, 'as') + c(T[0], T[1], 9, 'af') };
  },
  bilat(R, T) {
    let o = ''; const pts = [];
    for (let j = 0, y = 7; y < 150; j++, y += 14) for (let x = 7; x < 330; x += 14) {
      const v = 0.5 + 0.5 * Math.sin(x / 34 - j * 0.5); o += c(x, y, F(0.8 + v * 4), 'pf'); if (v > 0.9) pts.push([x, y]);
    }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 6, 'af') };
  },
  scale(R, T) {
    let o = ''; const pts = [];
    for (const y of [34, 84, 134]) {
      const off = -((y * 7) % 100); o += l(-10, y, 330, y, 'ps');
      for (let x = off, k = 0; x < 340; x += 20, k++) o += l(x, y, x, y - (k % 5 === 0 ? 20 : 9), 'ps');
      const mx = off + 20 * Math.floor(R() * 17); o += c(mx, y, 8, 'pf'); pts.push([mx, y]);
    }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 10, 'af') };
  },
  single(R, T) {
    let o = ''; for (let y = 10; y < 150; y += 18) o += l(-10, y, 330, y, 'pt pdot');
    const y0 = 10 + 18 * Math.round((T[1] - 10) / 18);
    return { o, op: 0.55, a: l(-10, y0, T[0], y0, 'as') + c(T[0], y0, 12, 'af') };
  },
  geno(R, T) {
    let o = ''; const N = [], sx = 64, sy = 70, X = i => T[0] - 4 * sx + i * sx, Y = j => T[1] - sy + j * sy;
    for (let j = 0; j < 3; j++) {
      for (let i = j % 2; i < 10; i += 2) {
        const a = X(i), b = X(i + 1), y = Y(j), m = y + sy / 2;
        o += l(a, y, b, y, 'ps') + l((a + b) / 2, y, (a + b) / 2, m, 'ps') + l(a, m, b, m, 'ps') + l(a, m, a, Y(j + 1) - 12, 'ps') + l(b, m, b, Y(j + 1) - 12, 'ps');
      }
      for (let i = 0; i < 10; i++) N.push([X(i), Y(j), i % 2 === 0]);
    }
    N.forEach(([x, y, sq]) => o += sq ? r(x, y, 24, 24, 3, 'pb') : c(x, y, 12, 'pb'));
    const q = near(N, T); return { o, a: q[2] ? r(q[0], q[1], 24, 24, 3, 'af') : c(q[0], q[1], 12, 'af') };
  },
  ifs(R, T) {
    let o = ''; const B = [[T[0], T[1], 18]];
    for (let t = 0; t < 2000 && B.length < 20; t++) {
      const x = R() * 360 - 20, y = R() * 180 - 20, rr = 6 + Math.pow(R(), 1.5) * 40;
      if (B.every(b => Math.hypot(b[0] - x, b[1] - y) > b[2] + rr + 8)) B.push([x, y, rr]);
    }
    B.slice(1).forEach(b => o += c(b[0], b[1], F(b[2]), b[2] < 10 ? 'pf' : 'ps'));
    return { o, a: c(T[0], T[1], 18, 'af') };
  },
  open(R, T, ctx) {
    let o = ''; const pts = [];
    for (const [y, off] of [[36, -20], [112, 34]]) for (let x = off; x < 380; x += 108) {
      o += p(arcPath(30, -20, 290, x, y), 'ps'); if (ctx.lvl > 1) o += p(arcPath(16, -20, 290, x, y), 'ps');
      const q = pol(42, -45); o += c(x + q[0], y + q[1], 5, 'pf'); pts.push([x + q[0], y + q[1]]);
    }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 8, 'af') };
  },
  calm(R, T) {
    let o = '', a = ''; const rows = []; for (let y = 14; y < 160; y += 26) rows.push(y);
    const ar = nearRow(rows, T[1]);
    rows.forEach(y => {
      const P = []; for (let x = -10; x <= 340; x += 12) { const t = Math.min(1, Math.max(0, (x - 30) / 180)); P.push([x, y + (1 - t) * (R() - 0.5) * 26 + t * Math.sin(x / 26 + y) * 3.5]); }
      o += poly(P, 'ps', false); if (y === ar) { const q = near(P, T); a = c(q[0], q[1], 8, 'af'); }
    });
    return { o, a };
  },
  mind(R, T) {
    let o = ''; const pts = [];
    for (const [y, off] of [[34, -10], [108, 40]]) for (let i = 0, x = off; x < 380; i++, x += 100) { const dir = i % 2 ? -1 : 1; o += c(x, y, 32, 'ps') + c(x + dir * 15, y, 10, i % 2 ? 'pf' : 'pb'); pts.push([x + dir * 15, y]); }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 10, 'af') };
  },
  stairs(R, T) {
    let o = ''; const pts = [];
    for (let x0 = -260; x0 < 330; x0 += 96) { let d = `M${x0},160`, x = x0, y = 160; for (let s = 0; s < 8; s++) { x += 32; d += ` H${x}`; y -= 26; d += ` V${y}`; pts.push([x + 16, y - 9]); } o += p(d, 'ps'); }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 8, 'af') };
  },
  growth(R, T) {
    let o = ''; const pts = [];
    for (const [y, off] of [[62, -40], [150, 60]]) for (let x = off; x < 380; x += 170) {
      [6, 11, 17, 25].forEach((rr, i) => { const cx = x + [0, 22, 52, 94][i], cy = y - [0, 8, 20, 36][i]; o += c(cx, cy, rr, i === 3 ? 'pf' : 'ps'); if (i === 3) pts.push([cx, cy]); });
    }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 25, 'af') };
  },
  three(R, T) {
    let o = ''; const pts = [];
    for (const [y, off] of [[34, -20], [106, 10]]) for (let x = off; x < 380; x += 50) { o += c(x, y, 30, 'ps'); pts.push([x, y]); }
    const q = near(pts, T); return { o, a: c(q[0], q[1], 30, 'as w') };
  },
  radar(R, T) {
    let o = ''; const C = [T[0] - 10, T[1] + 24], ks = [0, 1, 2, 3, 4];
    for (let rr = 34; rr < 400; rr += 34) o += poly(ks.map(k => { const q = pol(rr, -90 + 72 * k); return [C[0] + q[0], C[1] + q[1]]; }), 'pt');
    ks.forEach(k => { const q = pol(420, -90 + 72 * k); o += l(C[0], C[1], C[0] + q[0], C[1] + q[1], 'pt'); });
    const prof = [86, 36, 76, 48, 64].map((rr, k) => { const q = pol(rr, -90 + 72 * k); return [C[0] + q[0], C[1] + q[1]]; });
    return { o, op: 0.5, a: poly(prof, 'as') + prof.map((q, i) => c(q[0], q[1], i ? 4.5 : 8, 'af')).join('') };
  },
  spiral(R, T) {
    let d = '', acc = null; const N = 1400, turns = 12;
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = t * turns * 360, rr = 2 + t * turns * 16, q = pol(rr, a);
      d += (i ? 'L' : 'M') + F(T[0] + q[0]) + ',' + F(T[1] + q[1]);
      if (!acc && rr > 60 && a % 360 > 300) acc = [T[0] + q[0], T[1] + q[1]];
    }
    return { o: p(d, 'ps'), a: c(acc[0], acc[1], 8, 'af') };
  },
  lens(R, T) {
    let o = ''; const L = [[T[0], T[1], 48], [T[0] - 170, T[1] - 30, 34]];
    for (let y = 6; y < 150; y += 16) {
      const P = [];
      for (let x = -10; x <= 340; x += 6) { let dy = 0; L.forEach(([lx, ly, lr]) => { const dd = Math.hypot(x - lx, y - ly); if (dd < lr * 1.8) dy += (y - ly) * 0.35 * Math.exp(-(dd * dd) / (lr * lr)); }); P.push([x, y + dy]); }
      o += poly(P, 'ps', false);
    }
    L.forEach(([lx, ly, lr]) => o += c(lx, ly, lr, 'pt'));
    return { o, a: c(T[0], T[1], 48, 'as') + c(T[0], T[1], 6, 'af') };
  },
  pyr(R, T) {
    let o = ''; const pts = [];
    const shape = (x, y, fc, sc) => {
      const H = 64, W = 36, hw = yy => W * (yy - (y - H)) / H;
      return poly([[x - hw(y - 16), y - 16], [x + hw(y - 16), y - 16], [x + W, y], [x - W, y]], fc) + poly([[x, y - H], [x - W, y], [x + W, y]], sc) + [y - 32, y - 48].map(yy => l(x - hw(yy), yy, x + hw(yy), yy, sc)).join('');
    };
    for (const [y, off] of [[72, -10], [150, 46]]) for (let x = off; x < 380; x += 112) { o += shape(x, y, 'pf', 'ps'); pts.push([x, y - 32]); }
    const q = near(pts, T); return { o, a: shape(q[0], q[1] + 32, 'af', 'as') };
  }
};

const G = {
  criteria() {
    const on = [0, 2, 4, 5, 7]; let o = '';
    for (let i = 0; i < 9; i++) o += c((i % 3 - 1) * 24, (Math.floor(i / 3) - 1) * 24, 8, on.includes(i) ? 'f' : 's');
    return o;
  },
  egan() { return l(-22, 0, -12, 0) + l(12, 0, 22, 0) + c(-34, 0, 12) + c(0, 0, 12) + c(34, 0, 12, 'f'); },
  beck() {
    const A = [0, -34], B = [-38, 30], C = [38, 30];
    return poly([A, B, C]) + c(...A, 7, 'f') + c(...B, 7, 'sb') + c(...C, 7, 'sb');
  },
  flower() {
    let o = '';
    for (let k = 0; k < 5; k++) o += `<ellipse class="s" cx="0" cy="-27" rx="9" ry="14" transform="rotate(${k * 72})"/>`;
    return o + c(0, 0, 10, 'f');
  },
  tri3() { return [-36, 0, 36].map((x, i) => poly([[x, -13], [x - 15, 13], [x + 15, 13]], i === 2 ? 'f' : 's')).join(''); },
  hexa() {
    const V = [0, 1, 2, 3, 4, 5].map(k => pol(38, -90 + 60 * k));
    let o = poly(V) + poly([V[0], V[2], V[4]], 's th') + poly([V[1], V[3], V[5]], 's th');
    V.forEach(v => o += c(v[0], v[1], 4.5, 'sb'));
    return o + c(0, 0, 7, 'f');
  },
  cft() { return c(0, -17, 16) + c(-19, 16, 16) + c(19, 16, 16, 'f'); },
  hold() { return c(-11, -6, 26) + c(21, 12.5, 11, 'f'); },
  fap() {
    return p('M-22,-6 Q0,-34 22,-6') + head(22, -6, 52) + p('M22,6 Q0,34 -22,6') + head(-22, 6, 232) + c(-32, 0, 10) + c(32, 0, 10, 'f');
  },
  rft() {
    const A = [-34, 22], B = [0, -24], C = [34, 22];
    return l(...A, ...B) + l(...B, ...C) + l(A[0], A[1], C[0], C[1], 's dash') + r(...A, 12, 12, 2, 'sb') + r(...B, 12, 12, 2, 'sb') + r(...C, 12, 12, 2, 'f');
  },
  pattern() {
    let o = '';
    [-18, 4, 26].forEach((y, j) => [-36, -12, 12, 36].forEach((x, i) => {
      const d = `M${x - 8},${y} A8,8 0 0 1 ${x + 8},${y}`;
      o += (i === 2 && j === 1) ? p(d + ' Z', 'f') : p(d);
    }));
    return o;
  },
  modes() { return p('M0,0 L0,-34 A34,34 0 0 1 34,0 Z', 'f') + c(0, 0, 34) + l(-34, 0, 34, 0) + l(0, -34, 0, 34); },
  rogers() {
    const R = 27, off = 15, h = F(Math.sqrt(R * R - off * off));
    return p(`M0,-${h} A${R},${R} 0 0 1 0,${h} A${R},${R} 0 0 1 0,-${h} Z`, 'f') + c(-off, 0, R) + c(off, 0, R);
  },
  dual() { return poly([[0, 16], [-9, 32], [9, 32]]) + l(-42, 8, 42, 24) + c(-30, 1.3, 8, 'sb') + c(28, 9.3, 11, 'f'); },
  org() {
    return l(0, -19, 0, -4) + l(-34, -4, 34, -4) + [-34, 0, 34].map(x => l(x, -4, x, 13)).join('')
      + r(0, -26, 22, 14, 3, 'sb') + r(-34, 20, 22, 14, 3, 'sb') + r(0, 20, 22, 14, 3, 'sb') + r(34, 20, 22, 14, 3, 'f');
  },
  bridge() { return p('M-28,4 Q0,-46 28,4') + c(-28, 15, 11) + c(28, 15, 11) + c(0, -21.5, 4.5, 'f'); },
  dist() { return c(-30, -8, 13, 'f') + c(30, -8, 13) + l(-30, 22, 30, 22) + l(-30, 16, -30, 28) + l(30, 16, 30, 28); },
  window() {
    return l(-46, -22, 46, -22, 't') + l(-46, 22, 46, 22, 't')
      + poly([[-46, 2], [-38, -8], [-30, 6], [-22, -12], [-13, -38], [-5, 16], [4, -7], [14, 5], [24, -4], [34, 2], [46, 0]], 's', false)
      + c(-13, -38, 4, 'f');
  },
  broken() { return l(-46, 16, -26, 16) + l(-20, 16, -4, 16) + l(2, 16, 22, 16, 't') + l(28, 16, 46, 16) + l(2, -20, 22, -20, 'sd') + l(12, -14, 12, 10, 't'); },
  cont() { return r(0, 0, 72, 60, 16) + c(0, 14, 9, 'f'); },
  spiky() {
    const H = [38, 12, 50, 20, 8, 44, 26]; let o = l(-44, 28, 44, 28);
    H.forEach((h, i) => { const x = -36 + i * 12; o += l(x, 28, x, 28 - h) + c(x, 28 - h, i === 2 ? 5 : 3, i === 2 ? 'f' : 'k'); });
    return o;
  },
  neuro() {
    const xs = [-42, -28, -14, 0, 14, 28, 42], A = [-12, -30, -6, -34, -18, -36, -8], B = [14, 6, 30, 12, 34, 8, 24];
    return l(-44, 0, 44, 0, 't') + p(smooth(xs.map((x, i) => [x, A[i]]))) + p(smooth(xs.map((x, i) => [x, B[i]])), 'sd');
  },
  route() {
    const D = [[-30, 18], [-6, -30], [2, 24], [26, -24], [-44, 6], [30, 30], [-10, 10], [-28, -32], [44, -8]];
    let o = poly([[-40, -22], [-18, -4], [14, 2], [40, 14]], 's', false);
    [[-40, -22], [-18, -4], [14, 2]].forEach(q => o += c(q[0], q[1], 2.6, 'k'));
    D.forEach(q => o += c(q[0], q[1], 2.6, 'k'));
    return o + c(40, 14, 6, 'f');
  },
  clock() {
    const T = [0, 22, 38, 50, 96, 128, 152, 206, 228, 286, 298, 332]; let o = c(0, 0, 34);
    T.forEach(a => { const s = pol(26, a), e = pol(34, a); o += l(s[0], s[1], e[0], e[1]); });
    const h = pol(20, -55);
    return o + l(0, 0, h[0], h[1]) + c(0, 0, 4.5, 'f');
  },
  cycle() {
    let o = c(0, 0, 30);
    [-30, 90, 210].forEach(a => { const q = pol(30, a); o += head(q[0], q[1], a + 90); });
    [-90, 30, 150].forEach((a, i) => { const q = pol(30, a); o += c(q[0], q[1], 8, i === 0 ? 'f' : 'sb'); });
    return o;
  },
  bar() { return l(-46, 0, 46, 0, 't') + p('M-46,0 C-34,-48 -12,-48 0,0 C12,48 34,48 46,0') + c(-23, -36, 5, 'f') + c(23, 36, 5, 'sb'); },
  yerkes() { return p('M-42,-32 L-42,30 L44,30', 's th') + p('M-36,24 C-14,-48 14,-48 36,24') + c(0, -30, 5, 'f'); },
  toul() {
    return l(-19, -12, 17, -12) + head(18, -12, 0) + l(0, -12, 0, 11)
      + r(-30, -12, 22, 14, 3, 'sb') + r(30, -12, 22, 14, 3, 'f') + r(0, 18, 22, 14, 3, 'sb');
  },
  story() { return l(-46, 16, 46, 16, 's w') + p('M-20,16 C-2,16 8,-20 38,-20') + c(38, -20, 5, 'f'); },
  bilat() {
    let o = p('M-44,-4 Q0,30 44,-4', 't');
    [-36, -18, 0, 18, 36].forEach((x, i) => {
      const t = (x / 44 + 1) / 2, y = -4 * (1 - t) ** 2 + 60 * t * (1 - t) - 4 * t * t;
      const op = [0.22, 0.38, 0.56, 0.78, 1][i];
      o += i === 4 ? c(x, y, 8, 'f') : `<circle class="k" cx="${F(x)}" cy="${F(y)}" r="${3.5 + i}" opacity="${op}"/>`;
    });
    return o;
  },
  scale() {
    let o = l(-45, 6, 45, 6);
    for (let k = 0; k <= 10; k++) { const x = -45 + 9 * k; o += l(x, 6, x, k % 5 === 0 ? -4 : 1); }
    o += `<text class="tx" x="-45" y="22" text-anchor="middle">0</text><text class="tx" x="45" y="22" text-anchor="middle">10</text>`;
    o += p('M11,-6 Q13.5,-15 16,-6', 's th') + c(18, 6, 4, 'sb') + c(9, 6, 6, 'f');
    return o;
  },
  single() { return l(-46, 0, -20, 0) + l(-10, 0, 46, 0, 't') + c(-20, 0, 9, 'f'); },
  geno() {
    return l(-18, -22, 18, -22) + l(0, -22, 0, 0) + l(-22, 0, 22, 0) + l(-22, 0, -22, 12) + l(22, 0, 22, 12)
      + r(-26, -22, 16, 16, 1.5, 'sb') + c(26, -22, 8, 'sb') + c(-22, 20, 8, 'sb') + r(22, 20, 16, 16, 1.5, 'f');
  },
  ifs() { return c(0, 0, 38) + c(-14, -14, 9) + c(16, -8, 6, 'f') + c(-6, 17, 12) + c(21, 18, 4, 'k') + c(-24, 6, 3, 'k') + c(6, -24, 3.5, 'k'); },
  open(lvl = 1) {
    let o = p(arcPath(30, -20, 290));
    if (lvl > 1) o += p(arcPath(18, -20, 290));
    const q = pol(44, -45);
    return o + c(q[0], q[1], 6, 'f');
  },
  calm() { return p('M-46,0 L-40,-20 L-34,16 L-28,-14 L-22,10 L-16,-5 C-6,-12 4,8 14,2 S34,-3 42,0') + c(42, 0, 4.5, 'f'); },
  mind() { return c(-23, 0, 21) + c(23, 0, 21) + c(-11, 0, 7, 'sb') + c(11, 0, 7, 'f'); },
  stairs() { return p('M-44,30 H-22 V12 H0 V-6 H22 V-24 H44') + c(33, -31, 6, 'f'); },
  growth() { return c(-38, 20, 4) + c(-22, 13, 7) + c(0, 2, 10) + c(28, -12, 14, 'f'); },
  three() { return c(0, 0, 18, 'f') + c(-24, 0, 18) + c(24, 0, 18) + c(0, 0, 18); },
  radar() {
    const P = (R, k) => pol(R, -90 + 72 * k), ks = [0, 1, 2, 3, 4];
    const prof = [34, 14, 30, 20, 26].map((R, k) => P(R, k));
    let o = poly(ks.map(k => P(38, k)), 't') + ks.map(k => { const q = P(38, k); return l(0, 0, q[0], q[1], 't'); }).join('') + poly(prof);
    prof.forEach((q, i) => o += c(q[0], q[1], i === 0 ? 5 : 2.6, i === 0 ? 'f' : 'k'));
    return o;
  },
  spiral() {
    let d = '', N = 160, turns = 2.6, end;
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = t * turns * 360 - 90, R = 3 + t * 31, q = pol(R, a);
      d += (i ? 'L' : 'M') + F(q[0]) + ',' + F(q[1]); end = q;
    }
    return p(d) + c(end[0], end[1], 5, 'f');
  },
  lens() {
    let o = [-16, 0, 16].map(y => l(-46, y, 4, y)).join('');
    o += l(15.2, -16, 44, 0) + l(17, 0, 44, 0) + l(15.2, 16, 44, 0);
    return o + p('M8,-36 Q26,0 8,36 Q-10,0 8,-36 Z', 'sb') + c(44, 0, 5, 'f');
  },
  pyr() {
    const hw = y => 42 * (y + 36) / 68;
    let o = poly([[-hw(15), 15], [hw(15), 15], [42, 32], [-42, 32]], 'f') + poly([[0, -36], [-42, 32], [42, 32]]);
    [15, -2, -19].forEach(y => o += l(-hw(y), y, hw(y), y));
    return o;
  }
};

/* ---------- Цвета обложки по режиму фона ---------- */
function colors(slug, tone) {
  const m = M[slug], tt = TINTS[m.t];
  if (tone === 'gray') return { g: '#ECEBEF', d: INK, i: INK };
  if (tone === 'dark') return { g: '#2B2334', d: tt[0], i: '#E6E3EC' };
  return { g: tt[0], d: tt[1], i: INK };
}

/* Генеративный узор: дуги Трюше, у каждого курса свой посев */
function hash(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function truchet(slug) {
  const rnd = rng(hash(slug)), s = [18, 22, 28, 35][Math.floor(rnd() * 4)], h = s / 2; let d = '';
  for (let y = 0; y < 140; y += s) for (let x = 0; x < 320; x += s) {
    if (rnd() < 0.5) d += `M${x + h},${y}A${h},${h} 0 0 1 ${x},${y + h}M${x + s},${y + h}A${h},${h} 0 0 0 ${x + h},${y + s}`;
    else d += `M${x + h},${y}A${h},${h} 0 0 0 ${x + s},${y + h}M${x},${y + h}A${h},${h} 0 0 1 ${x + h},${y + s}`;
  }
  return `<path d="${d}" fill="none" stroke="var(--d)" stroke-width="${F(s / 5)}" opacity="0.38"/>`;
}

/* Обложка целиком. view: 'cover' (16:7) или 'square' (для словаря) */
function glyphSvg(slug, { variant = 'model', tone = 'tint', view = 'cover', cap = false, label = '' } = {}) {
  const m = M[slug], col = colors(slug, tone);
  const vb = view === 'square' ? '90 0 140 140' : '0 0 320 140';
  let inner = '';
  if (variant === 'model') {
    const body = m.g === 'open' ? G.open(m.lvl || 1) : G[m.g]();
    inner = `<g transform="translate(160 70) scale(1.15)"${m.mini ? ' class="mini"' : ''}>${body}</g>`;
    if (cap && view === 'cover') inner += `<text class="cap" x="16" y="128">${GL[m.g].n}</text>`;
  } else if (variant === 'weave') {
    const R = rng(hash(slug + ':w')), T = [185 + R() * 40, 62 + R() * 30];
    const res = PAT[m.g](R, T, { lvl: m.lvl || 1 });
    let mask = '';
    if (m.mini) {
      const id = 'mk' + (++uid);
      inner += `<defs><linearGradient id="${id}g" x1="0" x2="1"><stop offset="0.3" stop-color="#000"/><stop offset="0.62" stop-color="#fff"/></linearGradient><mask id="${id}" maskUnits="userSpaceOnUse" x="-100" y="-100" width="520" height="340"><rect x="-100" y="-100" width="520" height="340" fill="url(#${id}g)"/></mask></defs>`;
      mask = ` mask="url(#${id})"`;
    }
    inner += `<g opacity="${F((res.op || 0.45) * 0.66)}"${mask}>${res.o}</g>${res.a}`;
  } else if (variant === 'code') {
    const len = [...m.c].length, fs = Math.min(64, Math.floor(290 / (len * 0.62)));
    inner = `<text class="code" x="18" y="118" style="font-size:${fs}px">${m.c}</text>`;
  } else if (variant === 'pattern') {
    inner = truchet(slug);
  }
  const title = variant === 'model' || variant === 'weave' ? GL[m.g].n : '';
  return `<svg class="cv" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" style="--g:${col.g};--d:${col.d};--i:${col.i}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}><rect width="320" height="140" fill="var(--g)"/>${title ? `<title>${title}</title>` : ''}${inner}</svg>`;
}



/* Схемы для курсов, которых не было в артефакте. Подобраны в макете, сверить. */
const NEW_IN_MOCK = {
  'cbt-oxford-start': { g: 'flower', t: 'slate', c: 'КПТ', n: 'КПТ, Оксфорд, мини-курс', mini: 1 },
  'rodbt-record': { g: 'open', t: 'mist', c: 'РО ДБТ', n: 'РО ДБТ в записи', lvl: 1 },
  'ro-dbt-2': { g: 'open', t: 'mist', c: 'РО ДБТ', n: 'РО ДБТ, уровень 2', lvl: 2 },
  'child-training-practice': { g: 'growth', t: 'sand', c: 'Дети', n: 'Тренинги для детей' },
  'psychiatry-for-psy': { g: 'criteria', t: 'lilac', c: 'Психиатрия', n: 'Психиатрия для психологов' }
};
Object.assign(M, NEW_IN_MOCK);
/* Вебинар появился в CMS после макета обложек: узор «окно толерантности», как у курсов о травме */
M['webinar-ptsd'] = M['webinar-ptsd'] || { g: 'window', t: 'mist', c: 'ПТСР', n: 'Вебинар о травме' };

/* Бесплатный вход в флагман: «Попробуйте бесплатно» внутри карточки */
const TRY_FREE = {
  clinical_psychology: 'clinical-psychology-start',
  psyeducation: 'put-v-professiyu',
  'cbt-oxford': 'cbt-oxford-start',
  kpt: 'cbt-first-steps',
  act: 'act-base',
  rpp: 'rpp-start',
  sexology: 'sexology-mini-course'
};

/* Флагманы всегда первыми, в этом порядке (правило 12.10) */
const PINNED = ['clinical_psychology', 'psyeducation', 'cbt-oxford', 'kpt', 'act', 'obuchenie-emdr-dpdg-terapii'];

/* Временно: у этих курсов скидка в карточке скрыта, плашка без процента (решение 03.11) */
const PROMO_WITHOUT_DISCOUNT = ['psyeducation', 'couples-therapy', 'narrative-therapy'];

const NBSP = ' ';
const BY_SLUG = Object.fromEntries(CARDS.map(c => [c.slug, c]));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const rub = v => new Intl.NumberFormat('ru-RU').format(Number(v)).replace(/\s/g, NBSP) + NBSP + '₽';
const day = iso => { const p = String(iso || '').split('-'); return p.length === 3 ? Number(p[2]) + NBSP + MONTHS[Number(p[1]) - 1] : null; };
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function dates(card) {
  const list = (card.startDates && card.startDates.length ? card.startDates : [card.startDate]).filter(Boolean).map(day).filter(Boolean);
  if (list.length < 2) return list[0] || '';
  return list.slice(0, -1).join(', ') + ' и' + NBSP + list[list.length - 1];
}
function facts(card) {
  const parts = [];
  if (card.hours) parts.push(card.hours + NBSP + 'ак.ч.');
  const when = dates(card);
  if (when) parts.push(when);
  return parts.join(' / ');
}
/* «профессиональная переподготовка · диплом» → «Диплом, переподготовка» */
function kind(sub) {
  if (!sub) return '';
  const [a, b] = sub.split(' · ');
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  if (b && /^(диплом|удостоверение|сертификат)$/.test(b)) return cap(b) + ', ' + a.replace('профессиональная ', '');
  return cap(sub.replace(' · ', ', '));
}

const PROMO_ICON = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3.21 7.18a3.33 3.33 0 0 1 3.98-3.97 3.33 3.33 0 0 1 5.62 0 3.33 3.33 0 0 1 3.98 3.98 3.33 3.33 0 0 1 0 5.62 3.33 3.33 0 0 1-3.97 3.98 3.33 3.33 0 0 1-5.63 0 3.33 3.33 0 0 1-3.98-3.98 3.33 3.33 0 0 1 0-5.63Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="m12.5 7.5-5 5M7.5 7.5h.01M12.5 12.5h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function priceHtml(card) {
  if (card.mode === 'waitlist') {
    return `<div class="catalog-card_price"><p class="content-heading_component is-compact catalog-card_monthly">${rub(card.booking)}</p><p class="body-text_component is-fine-print catalog-card_terms">бронь места в${NBSP}потоке</p></div>`;
  }
  const hide = card.promo && PROMO_WITHOUT_DISCOUNT.includes(card.slug);
  let p = card.price;
  if (!p) return '';
  if (hide && p.discounted != null) p = { ...p, discounted: null, monthly: p.onePayment ? p.monthly : Math.round(p.full / 24) };
  if (p.free) return `<div class="catalog-card_price"><p class="content-heading_component is-compact catalog-card_monthly">Бесплатно</p></div>`;
  const from = p.from ? 'от' + NBSP : '';
  /* Зачёркиваем полную цену только при настоящей скидке (docs/tilda-pricing-block.md §3.2) */
  const full = p.discounted != null
    ? `<s>${from}${rub(p.full)}</s><b>${from}${rub(p.discounted)}</b>`
    : `${from}${rub(p.full)}`;
  let out = `<div class="catalog-card_price"><p class="body-text_component is-caption catalog-card_full">${full}</p>`;
  if (p.monthly) out += `<p class="content-heading_component is-compact catalog-card_monthly">от${NBSP}${rub(p.monthly)}/мес</p><p class="body-text_component is-fine-print catalog-card_terms">в${NBSP}рассрочку от${NBSP}банка на${NBSP}24${NBSP}мес</p>`;
  return out + '</div>';
}

function tryHtml(card, st) {
  const mini = BY_SLUG[TRY_FREE[card.slug]];
  if (!mini) return '';
  const cover = coverHtml(mini.slug, st, 'square');
  const arrow = '<span class="catalog-card_try-arrow" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  return `<a class="catalog-card_try" href="${esc(mini.url)}" target="_blank" rel="noopener">${cover}<span class="catalog-card_try-text"><span class="body-text_component is-fine-print">Попробуйте бесплатно</span><b>${esc(mini.title)}</b></span>${arrow}</a>`;
}

/* Пробные сгенерированные обложки: { стиль: { slug: картинка } } и описание стилей */
/* Обложки «деревянный предмет»: файлы в img/, по одному на курс */
const RASTER = {"obj": {"abuse-therapy": "/catalog-v1/img/abuse-therapy.webp","act": "/catalog-v1/img/act.webp","addiction-therapy": "/catalog-v1/img/addiction-therapy.webp","adhd-adult": "/catalog-v1/img/adhd-adult.webp","adult-adhd-therapy": "/catalog-v1/img/adult-adhd-therapy.webp","bar": "/catalog-v1/img/bar.webp","battle-trauma-ptsd": "/catalog-v1/img/battle-trauma-ptsd.webp","business-consulting": "/catalog-v1/img/business-consulting.webp","cbt-oxford": "/catalog-v1/img/cbt-oxford.webp","cft": "/catalog-v1/img/cft.webp","child-psy": "/catalog-v1/img/child-psy.webp","child-training-practice": "/catalog-v1/img/child-training-practice.webp","client-centered-therapy": "/catalog-v1/img/client-centered-therapy.webp","clinical_psychology": "/catalog-v1/img/clinical_psychology.webp","couple-requests": "/catalog-v1/img/couple-requests.webp","couples-therapy": "/catalog-v1/img/couples-therapy.webp","course-marketing-data": "/catalog-v1/img/course-marketing-data.webp","course-rl": "/catalog-v1/img/course-rl.webp","fap": "/catalog-v1/img/fap.webp","ifs": "/catalog-v1/img/ifs.webp","kpt": "/catalog-v1/img/kpt.webp","narrative-therapy": "/catalog-v1/img/narrative-therapy.webp","navyki-konsultirovaniya-dlya-psihologov": "/catalog-v1/img/navyki-konsultirovaniya-dlya-psihologov.webp","neurodivergence": "/catalog-v1/img/neurodivergence.webp","obuchenie-emdr-dpdg-terapii": "/catalog-v1/img/obuchenie-emdr-dpdg-terapii.webp","oct": "/catalog-v1/img/oct.webp","orkt": "/catalog-v1/img/orkt.webp","psychiatry-for-psy": "/catalog-v1/img/psychiatry-for-psy.webp","psyeducation": "/catalog-v1/img/psyeducation.webp","rft": "/catalog-v1/img/rft.webp","ro-dbt-2": "/catalog-v1/img/ro-dbt-2.webp","rodbt-live": "/catalog-v1/img/rodbt-live.webp","rodbt-record": "/catalog-v1/img/rodbt-record.webp","rpp": "/catalog-v1/img/rpp.webp","s-risk": "/catalog-v1/img/s-risk.webp","schema-terapiya-neklinicheskie-zaprosy": "/catalog-v1/img/schema-terapiya-neklinicheskie-zaprosy.webp","schema-therapy": "/catalog-v1/img/schema-therapy.webp","sexology": "/catalog-v1/img/sexology.webp","sportivnaya-psihologiya": "/catalog-v1/img/sportivnaya-psihologiya.webp","womens-care": "/catalog-v1/img/womens-care.webp"}};

/* Какая обложка у курса.
   Мини-курс — всегда модель метода из кода (решение 10.11).
   «Сгенерированные» — картинка, если она есть для курса, иначе узор из модели. */
function coverHtml(slug, st, view = 'cover') {
  /* Курс появился в CMS позже макета обложек: берём его обложку из CMS (поле cover) */
  if (!M[slug]) {
    const c = BY_SLUG[slug];
    const url = c && c.cover && c.cover.url;
    return url && view === 'cover' ? `<img src="${esc(url)}" alt="" width="800" height="350" loading="lazy">` : '';
  }
  if (M[slug].mini) return glyphSvg(slug, { variant: 'model', tone: st.tone, view });
  if (st.variant === 'gen') {
    const src = (RASTER[st.style] || {})[slug];
    if (src && view === 'cover') return `<img src="${src}" alt="" width="1000" height="438" loading="lazy">`;
    return glyphSvg(slug, { variant: 'weave', tone: 'tint', view });
  }
  return glyphSvg(slug, { variant: st.variant, tone: st.tone, view });
}

/* Карточка без картинки: плашки, название, описание, плитки, кнопка */
const SECTION_CHIP = { 'Профессии': 'Профессия', 'Методы психотерапии': 'Метод', 'Специализации': 'Специализация', 'Бесплатные мини-курсы': 'Мини-курс' };
function plainCardHtml(card, st) {
  const dark = st.layout === 'dark';
  const doc = (card.subtitle || '').split(' · ')[1];
  const chips = [
    card.promo ? `<span class="catalog-card_promo">${PROMO_ICON}${esc(card.promo.label || 'Курс месяца')}</span>` : '',
    SECTION_CHIP[card.section] ? `<span class="meta-pill_component">${SECTION_CHIP[card.section]}</span>` : '',
    doc ? `<span class="meta-pill_component">${esc(doc.charAt(0).toUpperCase() + doc.slice(1))}</span>` : '',
    `<span class="catalog-card_status${card.mode === 'waitlist' ? ' is-waitlist' : ''}">${esc(card.status)}</span>`
  ].join('');
  const desc = String(card.description || '').split(/(?<=[.!?])\s/)[0];
  const when = card.mode === 'waitlist' ? 'Ждём группу' : (dates(card) || 'В любое время');
  const tiles = [
    card.hours ? `<div class="catalog-card_tile"><span class="catalog-card_tile-label">Учитесь</span><span class="catalog-card_tile-value">${card.hours}${NBSP}ак.ч.</span></div>` : '',
    `<div class="catalog-card_tile${card.hours ? '' : ' is-wide'}"><span class="catalog-card_tile-label">Старт</span><span class="catalog-card_tile-value">${when}</span></div>`,
    plainPrice(card)
  ].join('');
  return `<li><article class="catalog-card_component is-plain${dark ? ' is-dark' : ''}">
    <div class="catalog-card_chips">${chips}</div>
    <div class="content-header_component">
      <h3 class="content-heading_component is-prominent catalog-card_title">${esc(card.title)}</h3>
      ${desc ? `<p class="body-text_component is-caption catalog-card_desc">${esc(desc)}</p>` : ''}
    </div>
    ${tryHtml(card, st)}
    <div class="catalog-card_tiles">${tiles}</div>
    <a class="button_component ${dark ? 'is-light' : 'is-accent'} catalog-card_cta" href="${esc(card.url)}" target="_blank" rel="noopener">Подробнее</a>
  </article></li>`;
}
/* Плитка цены: платёж в месяц крупно, полная цена зачёркнута только при скидке */
function plainPrice(card) {
  const tile = (label, value) => `<div class="catalog-card_tile is-wide is-price"><span class="catalog-card_tile-label">${label}</span><span class="catalog-card_tile-value">${value}</span></div>`;
  const per = `<span class="catalog-card_tile-unit">${NBSP}в${NBSP}месяц</span>`;
  if (card.mode === 'waitlist') return tile('Бронь места в потоке', rub(card.booking));
  let p = card.price;
  if (!p) return '';
  if (p.free) return tile('Стоимость', 'Бесплатно');
  if (card.promo && PROMO_WITHOUT_DISCOUNT.includes(card.slug) && p.discounted != null) p = { ...p, discounted: null, monthly: p.onePayment ? p.monthly : Math.round(p.full / 24) };
  const from = p.from ? 'от' + NBSP : '';
  if (!p.monthly) return tile('Стоимость', from + rub(p.discounted ?? p.full));
  const old = p.discounted != null ? `<s>${from}${rub(p.full)}</s>` : '';
  return tile(`В${NBSP}рассрочку на${NBSP}24${NBSP}месяца`, `${old}от${NBSP}${rub(p.monthly)}${per}`);
}

/* 1 час, 2 часа, 425 часов */
function hoursWord(n) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return 'час';
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'часа';
  return 'часов';
}

/* Текст плашки акции: «−10 % до 30 ноября». Процент и дата — из акции «Курс месяца» в CMS.
   Нет даты — только процент, нет процента — название акции. */
function promoText(card) {
  const p = card.promo || {};
  if (!p.discountPercent) return esc(p.label || 'Курс месяца');
  const until = p.until ? NBSP + 'до' + NBSP + day(p.until) : '';
  return '\u2212' + p.discountPercent + NBSP + '%' + until;
}

/* Картинка и факты: картинка-предмет, плашки, название, факты, цена */
function factsCardHtml(card, st) {
  const doc = (card.subtitle || '').split(' · ')[1];
  const promo = card.promo ? `<span class="catalog-card_promo">${promoText(card)}</span>` : '';
  const chips = [
    doc ? `<span class="meta-pill_component">${esc(doc.charAt(0).toUpperCase() + doc.slice(1))}</span>` : '',
    `<span class="catalog-card_status${card.mode === 'waitlist' ? ' is-waitlist' : ''}">${esc(card.status)}</span>`
  ].join('');
  /* Подписи фактов (11.11): «Программа: 425 академ. часов» вместо «Учитесь: 425 ак.ч.»,
     «Ближайший поток / Ближайшие потоки» вместо «Старт». Месяцев обучения в API нет. */
  const count = (card.startDates || []).length;
  const whenLabel = card.mode === 'waitlist' ? 'Ближайший поток' : count > 1 ? 'Ближайшие потоки' : count === 1 ? 'Ближайший поток' : 'Начало';
  const when = card.mode === 'waitlist' ? 'Собираем группу' : (dates(card) || 'В любое время');
  const fact = (label, value) => `<div><dt class="catalog-card_tile-label">${label}</dt><dd class="catalog-card_tile-value">${value}</dd></div>`;
  return `<li><article class="catalog-card_component is-facts">
    <div class="catalog-card_cover">${coverHtml(card.slug, st)}${promo}</div>
    <div class="catalog-card_body">
      <div class="catalog-card_chips">${chips}</div>
      <h3 class="content-heading_component is-compact catalog-card_title"><a class="catalog-card_link" href="${esc(card.url)}" target="_blank" rel="noopener">${esc(card.title)}</a></h3>
      ${tryHtml(card, st)}
      <dl class="catalog-card_facts-grid">${card.hours ? fact('Программа', card.hours + NBSP + 'академ. ' + hoursWord(card.hours)) : ''}${fact(whenLabel, when)}</dl>
      ${plainPrice(card)}
    </div>
  </article></li>`;
}

function cardHtml(card, st) {
  if (st.layout === 'facts') return factsCardHtml(card, st);
  if (st.layout && st.layout !== 'cover') return plainCardHtml(card, st);
  const promo = card.promo
    ? `<span class="catalog-card_promo">${PROMO_ICON}${esc(card.promo.label || 'Курс месяца')}${PROMO_WITHOUT_DISCOUNT.includes(card.slug) ? '' : `: −${card.promo.discountPercent}${NBSP}%`}</span>`
    : '';
  const info = facts(card);
  const status = `<p class="catalog-card_status${card.mode === 'waitlist' ? ' is-waitlist' : ''}">${esc(card.status)}</p>`;
  return `<li><article class="catalog-card_component">
    <div class="catalog-card_cover">${coverHtml(card.slug, st)}${promo}</div>
    <div class="catalog-card_body">
      <div class="catalog-card_meta">${info ? `<p class="body-text_component is-caption catalog-card_facts">${info}</p>` : ''}${status}</div>
      <div class="content-header_component">
        <h3 class="content-heading_component is-card catalog-card_title"><a class="catalog-card_link" href="${esc(card.url)}" target="_blank" rel="noopener">${esc(card.title)}</a></h3>
        <p class="body-text_component is-caption">${esc(kind(card.subtitle))}</p>
      </div>
      ${tryHtml(card, st)}
      ${priceHtml(card)}
    </div>
  </article></li>`;
}

/* Вид карточки: картинка-предмет и факты (решено 11.11.2026) */
const st = { variant: 'gen', style: 'obj', tone: 'tint', layout: 'facts' };

/* ---------- Фильтры каталога (16.11.2026) ----------
   Всё считается в браузере по данным из CMS, второго запроса нет.
   Внутри группы галочки работают через «или» (Профессия или Метод),
   между группами через «и» (Метод и до 50 000 ₽).
   Выбор сохраняется в адресе страницы (?type=method&price=50000), поэтому
   на готовую подборку можно дать ссылку из рекламы, поиска или рассылки.
   МОЖНО: менять подписи, порядок групп и пороги цены и часов.
   НЕЛЬЗЯ: добавлять фильтр, для которого нет поля в CMS. */
const iso8 = t => [t.getFullYear(), String(t.getMonth() + 1).padStart(2, '0'), String(t.getDate()).padStart(2, '0')].join('-');
const TODAY = iso8(new Date());
const addMonths = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); return iso8(new Date(y, m - 1 + n, d)); };
const MONTHS_IN = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'];
const M0 = TODAY.slice(0, 7);
const M1 = addMonths(M0 + '-01', 1).slice(0, 7);
const monthIn = ym => MONTHS_IN[Number(ym.slice(5, 7)) - 1];
const norm = s => String(s == null ? '' : s).toLowerCase().replace(/ё/g, 'е');
const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many; };
const courses = n => n + NBSP + plural(n, 'курс', 'курса', 'курсов');

/* Ближайшие даты: только сегодня и позже */
const upcoming = c => (c.startDates && c.startDates.length ? c.startDates : [c.startDate]).filter(d => d && d >= TODAY).sort();
/* «В любое время»: набор открыт, а дат нет (мини-курсы, курсы в записи) */
const anytime = c => c.mode !== 'waitlist' && !(c.startDates || []).length && !c.startDate;
/* Цена, которую человек видит в карточке: со скидкой, если она показана */
function shownPrice(c) {
  if (c.mode === 'waitlist' || !c.price) return null;
  const p = c.price;
  if (p.free) return 0;
  if (p.discounted != null && !(c.promo && PROMO_WITHOUT_DISCOUNT.includes(c.slug))) return p.discounted;
  return p.full;
}
/* «С нуля» берём из поисковых слов курса в CMS. Лучше завести отдельное поле «Для кого». */
const BEGINNER_WORDS = ['с нуля', 'без психологического образования', 'начинающим'];
const isBeginner = c => (c.searchWords || []).some(w => BEGINNER_WORDS.includes(norm(w)));
const subOf = c => norm(c.subtitle);
const SECTION_OF = { prof: 'Профессии', method: 'Методы психотерапии', spec: 'Специализации', web: 'Вебинары', mini: 'Бесплатные мини-курсы' };

function slugify(s) {
  const map = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
  return norm(s).split('').map(ch => (ch in map ? map[ch] : ch)).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
/* Что ищет поиск: название, тип, поисковые слова, преподаватели, темы запросов */
const TOPICS_OF = {};
TOPICS.forEach(t => t.courses.forEach(s => (TOPICS_OF[s] = TOPICS_OF[s] || []).push(t)));
const indexCard = c => {
  c._hay = norm([c.title, c.subtitle, ...(c.searchWords || []), ...(c.teachers || []),
    ...(TOPICS_OF[c.slug] || []).flatMap(t => [t.title, ...t.terms])].join(' '));
};
CARDS.forEach(indexCard);

const GROUPS = [
  { id: 'exp', title: 'Опыт', multi: true, open: true, options: [
    { v: 'new', label: 'Без опыта', quick: 'Без опыта', test: isBeginner },
    { v: 'pro', label: 'С опытом', test: c => !isBeginner(c) }
  ] },
  { id: 'type', title: 'Формат', multi: true, open: true, options: [
    { v: 'prof', label: 'Профессия', quick: 'Профессия' },
    { v: 'method', label: 'Метод психотерапии', quick: 'Метод' },
    { v: 'spec', label: 'Специализация', quick: 'Специализация' },
    { v: 'web', label: 'Вебинар' },
    { v: 'mini', label: 'Бесплатный мини-курс' }
  ].map(o => ({ ...o, test: c => c.section === SECTION_OF[o.v] })) },
  /* Старт: галочки, ни одной — значит любой старт */
  { id: 'start', title: 'Старт', multi: true, open: true, options: [
    { v: 'any', label: 'В любое время', test: anytime },
    { v: 'm0', label: 'В' + NBSP + monthIn(M0), quick: 'Старт в' + NBSP + monthIn(M0), test: c => upcoming(c).some(d => d.slice(0, 7) === M0) },
    { v: 'm1', label: 'В' + NBSP + monthIn(M1), test: c => upcoming(c).some(d => d.slice(0, 7) === M1) },
    { v: '3m', label: 'В ближайшие 3' + NBSP + 'месяца', test: c => upcoming(c).some(d => d < addMonths(TODAY, 3)) },
    { v: '6m', label: 'В ближайшие полгода', test: c => upcoming(c).some(d => d < addMonths(TODAY, 6)) }
  ] },
  { id: 'price', title: 'Стоимость', open: true, options: [
    { v: '', label: 'Любая', test: () => true },
    { v: 'free', label: 'Бесплатно', quick: 'Бесплатно', test: c => shownPrice(c) === 0 },
    { v: '30', label: 'До 30' + NBSP + '000' + NBSP + '₽', test: c => shownPrice(c) > 0 && shownPrice(c) <= 30000 },
    { v: '50', label: 'До 50' + NBSP + '000' + NBSP + '₽', quick: 'До 50' + NBSP + '000' + NBSP + '₽', test: c => shownPrice(c) > 0 && shownPrice(c) <= 50000 },
    { v: '100', label: 'До 100' + NBSP + '000' + NBSP + '₽', test: c => shownPrice(c) > 0 && shownPrice(c) <= 100000 },
    { v: 'more', label: 'Дороже 100' + NBSP + '000' + NBSP + '₽', test: c => shownPrice(c) > 100000 }
  ] },
  { id: 'topic', title: 'Запросы клиентов', multi: true, open: true, options: TOPICS.map(t => ({
    v: slugify(t.title), label: t.title, test: c => t.courses.includes(c.slug)
  })) },
  { id: 'doc', title: 'Документ', multi: true, options: [
    { v: 'diploma', label: 'Диплом о' + NBSP + 'переподготовке', test: c => /диплом/.test(subOf(c)) },
    { v: 'pk', label: 'Удостоверение о' + NBSP + 'повышении квалификации', test: c => /удостоверение/.test(subOf(c)) || subOf(c) === 'повышение квалификации' },
    { v: 'cert', label: 'Сертификат', test: c => /сертификат/.test(subOf(c)) }
  ] },
  /* Длительность в академических часах: месяцев обучения в CMS нет */
  { id: 'hours', title: 'Длительность', multi: true, options: [
    { v: 'h50', label: 'До 50' + NBSP + 'академ. часов', test: c => c.hours > 0 && c.hours <= 50 },
    { v: 'h150', label: '51–150' + NBSP + 'академ. часов', test: c => c.hours > 50 && c.hours <= 150 },
    { v: 'h500', label: '151–500' + NBSP + 'академ. часов', test: c => c.hours > 150 && c.hours <= 500 },
    { v: 'h500p', label: 'Больше 500' + NBSP + 'академ. часов', test: c => c.hours > 500 }
  ] }
];
const OPT = (g, v) => g.options.find(o => o.v === v);

/* Выбор человека. Для групп с галочками — список, для кружков — одно значение */
const FILTER = { q: '' };
GROUPS.forEach(g => (FILTER[g.id] = g.multi ? [] : ''));
let sortBy = 'popular';

function passes(c, skip) {
  if (FILTER.q && skip !== 'q') {
    const words = norm(FILTER.q).split(/\s+/).filter(Boolean);
    if (!words.every(w => c._hay.includes(w))) return false;
  }
  for (const g of GROUPS) {
    if (g.id === skip) continue;
    const val = FILTER[g.id];
    if (g.multi) {
      if (!val.length) continue;
      const tests = val.map(v => OPT(g, v)).filter(Boolean);
      if (!(g.and ? tests.every(o => o.test(c)) : tests.some(o => o.test(c)))) return false;
    } else if (val) {
      const o = OPT(g, val);
      if (o && !o.test(c)) return false;
    }
  }
  return true;
}

/* Сортировка. «Популярные» — флагманы первыми, дальше порядок из CMS */
function sorted(list) {
  const pos = c => (PINNED.includes(c.slug) ? PINNED.indexOf(c.slug) : PINNED.length + CARDS.indexOf(c));
  const startKey = c => (c.mode === 'waitlist' ? '9' : upcoming(c)[0] || (anytime(c) ? '8' : '9'));
  const priceKey = (c, dir) => { const p = shownPrice(c); return p == null ? (dir > 0 ? Infinity : -Infinity) : p; };
  const by = {
    popular: (a, b) => pos(a) - pos(b),
    soon: (a, b) => startKey(a).localeCompare(startKey(b)) || pos(a) - pos(b),
    cheap: (a, b) => priceKey(a, 1) - priceKey(b, 1) || pos(a) - pos(b),
    expensive: (a, b) => priceKey(b, -1) - priceKey(a, -1) || pos(a) - pos(b)
  }[sortBy] || ((a, b) => pos(a) - pos(b));
  return list.slice().sort(by);
}

/* ---------- Адрес страницы ↔ фильтры ---------- */
function readURL() {
  let qs;
  try { qs = new URLSearchParams(location.search); } catch (e) { return; }
  FILTER.q = qs.get('q') || '';
  GROUPS.forEach(g => {
    const raw = qs.get(g.id);
    if (!raw) return;
    if (g.multi) FILTER[g.id] = raw.split(',').filter(v => OPT(g, v));
    else if (OPT(g, raw)) FILTER[g.id] = raw;
  });
  if (['popular', 'soon', 'cheap', 'expensive'].includes(qs.get('sort'))) sortBy = qs.get('sort');
}
function writeURL() {
  const qs = new URLSearchParams();
  if (FILTER.q) qs.set('q', FILTER.q);
  GROUPS.forEach(g => { const v = FILTER[g.id]; if (g.multi ? v.length : v) qs.set(g.id, g.multi ? v.join(',') : v); });
  if (sortBy !== 'popular') qs.set('sort', sortBy);
  const s = qs.toString();
  try { history.replaceState(null, '', s ? '?' + s.replace(/%2C/g, ',') : location.pathname); } catch (e) { /* в превью артефакта адрес менять нельзя */ }
}

/* ---------- Разметка фильтров: строится один раз ---------- */
const body = document.getElementById('filters-body');
body.innerHTML = GROUPS.map(g => `<details class="catalog-filter_group" data-group="${g.id}"${g.open ? ' open' : ''}>
  <summary class="catalog-filter_summary"><span class="catalog-filter_title">${g.title}</span><span class="catalog-filter_picked" data-picked hidden></span></summary>
  <div class="catalog-filter_options" role="group" aria-label="${g.title}">${g.options.map(o => `
    <label class="catalog-option_component"><input class="catalog-option_input" type="${g.multi ? 'checkbox' : 'radio'}" name="f-${g.id}" value="${o.v}"><span class="catalog-option_box" aria-hidden="true"></span><span class="catalog-option_label">${o.label}</span><span class="catalog-option_count" data-count></span></label>`).join('')}
  </div>
</details>`).join('');

const QUICK = [];
GROUPS.forEach(g => g.options.forEach(o => { if (o.quick) QUICK.push({ g, o }); }));
document.getElementById('quick').innerHTML = QUICK.map(({ g, o }, i) =>
  `<button type="button" class="catalog-quick_chip" data-quick="${i}" aria-pressed="false">${o.quick}</button>`).join('');

const isOn = (g, v) => (g.multi ? FILTER[g.id].includes(v) : FILTER[g.id] === v);
function toggle(g, v, on) {
  if (g.multi) {
    const list = FILTER[g.id].filter(x => x !== v);
    if (on) list.push(v);
    FILTER[g.id] = list;
  } else FILTER[g.id] = on ? v : '';
}
function resetAll() { FILTER.q = ''; GROUPS.forEach(g => (FILTER[g.id] = g.multi ? [] : '')); document.getElementById('q').value = ''; }

/* ---------- Обновление панели, выбранных фильтров и карточек ---------- */
function renderFilters(found) {
  GROUPS.forEach(g => {
    const box = body.querySelector(`[data-group="${g.id}"]`);
    let picked = 0;
    g.options.forEach(o => {
      const input = box.querySelector(`input[value="${o.v}"]`);
      const label = input.closest('label');
      const on = isOn(g, o.v);
      const n = CARDS.filter(c => passes(c, g.and ? null : g.id) && o.test(c)).length;
      input.checked = on;
      const empty = !on && n === 0;
      input.disabled = empty;
      label.classList.toggle('is-empty', empty);
      label.querySelector('[data-count]').textContent = o.v === '' && !g.multi ? '' : n;
      if (on && o.v !== '') picked++;
    });
    const badge = box.querySelector('[data-picked]');
    badge.hidden = !picked;
    badge.textContent = picked;
    if (picked) box.open = true;
  });
  const total = (FILTER.q ? 1 : 0) + GROUPS.reduce((s, g) => s + (g.multi ? FILTER[g.id].length : FILTER[g.id] ? 1 : 0), 0);
  const badge = document.getElementById('badge');
  badge.hidden = !total;
  badge.textContent = total;
  document.getElementById('open-filters').setAttribute('aria-label', total ? `Фильтры, выбрано ${total}` : 'Фильтры');
  const apply = document.getElementById('apply-filters');
  apply.disabled = found === 0;
  apply.textContent = found === 0 ? 'Ничего не найдено' : 'Показать ' + courses(found);
  document.querySelectorAll('[data-quick]').forEach(b => {
    const { g, o } = QUICK[b.dataset.quick];
    b.setAttribute('aria-pressed', isOn(g, o.v));
  });
  return total;
}

const CROSS = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
function renderActive(total) {
  const items = [];
  if (FILTER.q) items.push({ key: 'q', label: `«${esc(FILTER.q)}»` });
  GROUPS.forEach(g => {
    const vals = g.multi ? FILTER[g.id] : FILTER[g.id] ? [FILTER[g.id]] : [];
    vals.forEach(v => { const o = OPT(g, v); if (o) items.push({ key: g.id + ':' + v, label: (g.id === 'start' ? 'Старт ' + o.label.charAt(0).toLowerCase() + o.label.slice(1) : o.label) }); });
  });
  const box = document.getElementById('active');
  box.hidden = !items.length;
  box.innerHTML = items.map(i => `<button type="button" class="catalog-active_chip" data-remove="${i.key}" aria-label="Убрать фильтр: ${i.label.replace(/<[^>]+>/g, '')}">${i.label}${CROSS}</button>`).join('')
    + (items.length > 1 ? '<button type="button" class="catalog-active_reset" data-reset>Сбросить всё</button>' : '');
}

function renderShop() {
  const list = sorted(CARDS.filter(c => passes(c)));
  const total = renderFilters(list.length);
  renderActive(total);
  document.getElementById('sort').value = sortBy;
  document.getElementById('grid').innerHTML = list.length
    /* Первый ряд виден сразу: его картинки грузим без отложенной загрузки */
    ? list.map((c, i) => (i < 3 ? cardHtml(c, st).replace(' loading="lazy"', ' fetchpriority="high"') : cardHtml(c, st))).join('')
    : `<li class="catalog-grid_empty"><p class="body-text_component">Под эти фильтры курсов нет. Уберите один из${NBSP}фильтров или посмотрите бесплатные мини-курсы.</p><button type="button" class="catalog-active_reset" data-reset>Сбросить фильтры</button></li>`;
  writeURL();
}

/* ---------- События ---------- */
body.addEventListener('change', e => {
  const input = e.target.closest('input');
  if (!input) return;
  const g = GROUPS.find(x => 'f-' + x.id === input.name);
  toggle(g, input.value, input.type === 'radio' ? input.value !== '' : input.checked);
  renderShop();
});
document.getElementById('quick').addEventListener('click', e => {
  const b = e.target.closest('[data-quick]');
  if (!b) return;
  const { g, o } = QUICK[b.dataset.quick];
  toggle(g, o.v, !isOn(g, o.v));
  renderShop();
});
let typing;
document.getElementById('q').addEventListener('input', e => {
  clearTimeout(typing);
  typing = setTimeout(() => { FILTER.q = e.target.value.trim(); renderShop(); }, 200);
});
document.getElementById('sort').addEventListener('change', e => { sortBy = e.target.value; renderShop(); });
document.addEventListener('click', e => {
  const rm = e.target.closest('[data-remove]');
  if (rm) {
    const [id, v] = rm.dataset.remove.split(':');
    if (id === 'q') { FILTER.q = ''; document.getElementById('q').value = ''; }
    else toggle(GROUPS.find(g => g.id === id), v, false);
    renderShop();
    document.getElementById('q').focus({ preventScroll: true });
    return;
  }
  if (e.target.closest('[data-reset]')) { resetAll(); renderShop(); }
});
document.getElementById('reset-filters').addEventListener('click', () => { resetAll(); renderShop(); });

/* ---------- Шторка фильтров до 1024 px ---------- */
const panel = document.getElementById('filters');
const openBtn = document.getElementById('open-filters');
const WIDE = window.matchMedia('(min-width: 64.0625rem)');
function setSheet(open) {
  if (open && WIDE.matches) return;
  if (!open && panel.classList.contains('is-open')) {
    panel.classList.add('is-closing');
    setTimeout(() => panel.classList.remove('is-closing'), 320);
  }
  panel.classList.toggle('is-open', open);
  if (open) { panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'filters-title'); panel.removeAttribute('aria-label'); }
  else { panel.removeAttribute('role'); panel.removeAttribute('aria-modal'); panel.removeAttribute('aria-labelledby'); panel.setAttribute('aria-label', 'Фильтры'); }
  openBtn.setAttribute('aria-expanded', open);
  document.documentElement.classList.toggle('is-sheet-open', open);
  document.querySelectorAll('[data-sheet-inert], .site-header, .site-footer_component').forEach(el => (el.inert = open));
  /* Фокус после того, как шторка стала видимой: скрытый элемент фокус не принимает */
  if (open) { void panel.offsetHeight; document.getElementById('close-filters').focus(); }
}
openBtn.addEventListener('click', () => setSheet(true));
document.getElementById('close-filters').addEventListener('click', () => { setSheet(false); openBtn.focus(); });
document.getElementById('apply-filters').addEventListener('click', () => {
  setSheet(false);
  /* К началу подборки: выбранные фильтры видны сразу под липкой полосой */
  const active = document.getElementById('active');
  const target = active.hidden ? document.getElementById('grid') : active;
  const y = target.getBoundingClientRect().top + window.scrollY - document.getElementById('bar').offsetHeight - 8;
  window.scrollTo({ top: Math.max(0, y) });
  openBtn.focus({ preventScroll: true });
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('is-open')) { setSheet(false); openBtn.focus(); } });
WIDE.addEventListener('change', () => { if (WIDE.matches && panel.classList.contains('is-open')) setSheet(false); });

/* ---------- Фильтры на десктопе: затухание у края, где есть ещё фильтры ---------- */
function fadeFilters() {
  const more = panel.scrollHeight - panel.clientHeight - panel.scrollTop;
  panel.classList.toggle('is-more-top', WIDE.matches && panel.scrollTop > 2);
  panel.classList.toggle('is-more-bottom', WIDE.matches && more > 2);
}
panel.addEventListener('scroll', fadeFilters, { passive: true });
window.addEventListener('resize', fadeFilters);
if ('ResizeObserver' in window) new ResizeObserver(fadeFilters).observe(panel);
body.addEventListener('toggle', fadeFilters, true);

readURL();
document.getElementById('q').value = FILTER.q;

/* ---------- Курсы месяца: один курс крупно (вариант D2, 16.11.2026) ----------
   В баннер попадают курсы с акцией «Курс месяца» в CMS, у которых открыт набор и есть цена со скидкой.
   Цена, дата старта и срок акции — от потока в акции (card.promo). Главный курс — с самой большой
   экономией в рублях, остальные — плитками в порядке старта. Нет курсов в акции — баннера нет. */
const MONTH_COVERS = {
  /* Обложки под баннер: файл img/month/<курс>-hero или -tile и куда смотреть в узкой полосе на телефоне */
  psyeducation: '50% 72%',
  'couples-therapy': '50% 64%',
  'narrative-therapy': '50% 59%'
};
const MONTH_ARROW = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h9.5M8.5 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function monthCover(slug, role) {
  if (slug in MONTH_COVERS) return { src: `/catalog-v1/img/month/${slug}-${role}.webp`, pos: MONTH_COVERS[slug] };
  const c = BY_SLUG[slug];
  return { src: RASTER.obj[slug] || (c && c.cover && c.cover.url) || '', pos: '50% 60%' }; // своей обложки нет — обложка каталога или из CMS
}

function monthCards() {
  return CARDS.filter(c => c.promo && c.mode === 'open' && c.promo.price && c.promo.price.discounted != null)
    .map(c => {
      const p = c.promo.price;
      return { card: c, p, save: p.full - p.discounted, start: c.promo.startDate || c.startDate, until: c.promo.until };
    })
    .filter(m => m.save > 0);
}

function monthCardHtml(m, hero) {
  const c = m.card, p = m.p;
  const from = p.from ? 'от' + NBSP : '';
  const until = m.until ? 'до' + NBSP + day(m.until) : 'в этом месяце';
  const cover = monthCover(c.slug, hero ? 'hero' : 'tile');
  const terms = p.onePayment ? 'При единовременной оплате'
    : p.monthly ? `В${NBSP}рассрочку от${NBSP}${rub(p.monthly)} в${NBSP}месяц` : '';
  const offer = hero
    ? `На <b>${rub(m.save)}</b> дешевле, если оплатить ${until}`
    : `Экономия <b>${rub(m.save)}</b> ${until}`;
  return `<li class="catalog-month_item${hero ? ' is-hero' : ''}"><a class="catalog-month_card${hero ? ' is-hero' : ''}" href="${esc(c.url)}" target="_blank" rel="noopener">
    <span class="catalog-month_media">${cover.src ? `<img src="${cover.src}" alt="" loading="lazy" style="--pos: ${cover.pos}">` : ''}<span class="catalog-month_save">−${rub(m.save)}</span></span>
    <span class="catalog-month_body">
      <span class="catalog-month_titlegroup">${m.start ? `<span class="catalog-month_start">Старт ${day(m.start)}</span>` : ''}<span class="catalog-month_name">${esc(c.title)}</span></span>
      <span class="catalog-month_offer">${offer}</span>
      <span class="catalog-month_pricegroup"><span class="catalog-month_price"><strong>${from}${rub(p.discounted)}</strong><s>${from}${rub(p.full)}</s></span>${terms ? `<span class="catalog-month_terms">${terms}</span>` : ''}</span>
      ${hero ? `<span class="catalog-month_cta">Смотреть программу${MONTH_ARROW}</span>` : `<span class="catalog-month_arrow" aria-hidden="true">${MONTH_ARROW}</span>`}
    </span>
  </a></li>`;
}

function renderMonth() {
  const box = document.querySelector('[data-catalog-month]');
  if (!box) return;
  const list = monthCards();
  box.hidden = !list.length;
  if (!list.length) return;
  const hero = list.reduce((a, b) => (b.save > a.save ? b : a));
  const rest = list.filter(m => m !== hero).sort((a, b) => String(a.start || '9').localeCompare(String(b.start || '9')));
  const ul = box.querySelector('[data-catalog-month-list]');
  ul.classList.toggle('is-single', !rest.length);
  ul.classList.toggle('is-pair', rest.length === 1);
  ul.innerHTML = monthCardHtml(hero, true) + rest.map(m => monthCardHtml(m, false)).join('');
}

function render() { renderMonth(); renderShop(); }
render();

/* ---------- Живые данные из CMS ----------
   Страница сразу рисуется по снимку выше, потом одним запросом берёт свежий каталог
   из Public API и перерисовывается: новые курсы, цены, даты и акции видны без пересборки.
   Нет ответа за 8 секунд или ошибка — остаётся снимок, страница работает.
   Темы запросов клиентов обновляются только у уже известных тем: новая тема появится
   в фильтрах после обновления снимка. */
const CATALOG_API = 'https://modern-psy-asp-prod-8ceb.twc1.net/api/public/catalog';
function applyLive(data) {
  const cards = data && Array.isArray(data.cards) ? data.cards : [];
  if (!cards.length) return; // пустой ответ — оставляем снимок
  (data.topics || []).forEach(t => {
    const known = TOPICS.find(o => o.title === t.title);
    if (known) { known.courses = t.courses || []; known.terms = t.terms || known.terms; }
  });
  Object.keys(TOPICS_OF).forEach(k => delete TOPICS_OF[k]);
  TOPICS.forEach(t => t.courses.forEach(slug => (TOPICS_OF[slug] = TOPICS_OF[slug] || []).push(t)));
  CARDS.splice(0, CARDS.length, ...cards);
  Object.keys(BY_SLUG).forEach(k => delete BY_SLUG[k]);
  CARDS.forEach(c => { BY_SLUG[c.slug] = c; indexCard(c); });
  render();
}
if (window.fetch) {
  const ctrl = 'AbortController' in window ? new AbortController() : null;
  const timer = setTimeout(() => ctrl && ctrl.abort(), 8000);
  fetch(CATALOG_API, { signal: ctrl ? ctrl.signal : undefined })
    .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
    .then(applyLive)
    .catch(err => console.info('[каталог] данные из CMS не загрузились, показан снимок.', err.message))
    .finally(() => clearTimeout(timer));
}

/* ---------- Нужна помощь в выборе курса: форма как на главной ----------
   Код перенесён с главной (apps/preview/glavnaya/page.js, initPick) без изменений логики. */
(function (root) {
  // «Поможем подобрать программу»: вопрос с вариантами и короткая форма.
  // Заявка уходит в скрытую форму Тильды на странице (имя — data-tilda-form-name), как запасная форма
  // на вебинарах: поля Name, Phone, messenger, messenger_contact, form_source, ym_client_id и utm-метки.
  // Полей, которых нет в форме Тильды, скрипт добавляет сам скрытыми.
  var PICK_IS_PRODUCTION = /(^|\.)modern-psy\.ru$/.test(root.location ? root.location.hostname : '');
  var PICK_SOURCE = 'каталог: подбор программы';

  function pickSetValue(input, value) {
    var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (setter && setter.set) setter.set.call(input, value); else input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function pickTildaForm(name) {
    var forms = Array.prototype.slice.call(document.querySelectorAll('form.t-form'));
    var found = forms.filter(function (f) {
      var n = f.querySelector('input[name="tildaspec-formname"]');
      return n && n.value === name;
    })[0];
    return found || (forms.length === 1 ? forms[0] : null);
  }
  function pickTildaField(form, name, value) {
    var input = form.querySelector('input[name="' + name + '"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      form.appendChild(input);
    }
    pickSetValue(input, value);
  }
  // Ответ Тильды приходит событием: ждём его, но не дольше 10 секунд
  function pickWaitTilda(form) {
    return new Promise(function (resolve) {
      var done = false;
      function finish(result) {
        if (done) return;
        done = true;
        document.removeEventListener('tildaform:aftersuccess', ok);
        document.removeEventListener('tildaform:aftererror', fail);
        if (root.jQuery) root.jQuery(document).off('.catalogpick');
        resolve(result);
      }
      function ok() { finish('success'); }
      function fail() { finish('error'); }
      document.addEventListener('tildaform:aftersuccess', ok);
      document.addEventListener('tildaform:aftererror', fail);
      if (root.jQuery) {
        root.jQuery(document).on('tildaform:aftersuccess.catalogpick', ok);
        root.jQuery(document).on('tildaform:aftererror.catalogpick', fail);
      }
      setTimeout(function () { finish('timeout'); }, 10000);
    });
  }
  function pickSend(formName, values) {
    var form = pickTildaForm(formName);
    if (!form) {
      if (PICK_IS_PRODUCTION) {
        console.error('[каталог, подбор программы] Формы Тильды «' + formName + '» на странице нет, заявка не отправлена.');
        return Promise.resolve('error');
      }
      console.info('[каталог, подбор программы] Это превью: формы Тильды нет, заявка не отправлена.', values);
      return Promise.resolve('success');
    }
    var record = form.closest('.t-rec');
    if (record) record.setAttribute('aria-hidden', 'true');
    var utm = new URLSearchParams(root.location.search);
    Object.keys(values).forEach(function (k) {
      if (k === 'Phone' && root.t_form_phonemask__setValue) {
        var group = form.querySelector('.t-input-group_ph');
        if (group) { try { root.t_form_phonemask__setValue(group, values[k], undefined, { noFocus: true }); } catch (e) {} }
      }
      pickTildaField(form, k, values[k]);
    });
    pickTildaField(form, 'ym_client_id', (document.cookie.match(/(?:^|;\s*)_ym_uid=([^;]+)/) || [])[1] || '');
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) { pickTildaField(form, k, utm.get(k) || ''); });
    // Обязательные поля Тильды, которых нет на странице, иначе её проверка не пустит заявку
    Array.prototype.forEach.call(form.querySelectorAll('[required], [data-tilda-req]'), function (f) {
      if (!String(f.value || '').trim()) { f.removeAttribute('required'); f.removeAttribute('data-tilda-req'); f.removeAttribute('data-tilda-rule'); }
    });
    var answer = pickWaitTilda(form);
    var submit = form.querySelector('button[type="submit"]:not(:disabled), input[type="submit"]:not(:disabled)');
    if (submit) form.requestSubmit(submit); else form.requestSubmit();
    return answer;
  }

  // Нативную форму Тильды прячем с глаз сразу при загрузке: видна только наша форма.
  // Не display:none — скриптам Тильды нужно измерять поля. Форма может появиться чуть позже нашего скрипта,
  // поэтому ищем её несколько раз в течение 5 секунд. Запасное правило в page.css прячет её и без скрипта.
  function pickHideTilda(name) {
    var tries = 0;
    (function look() {
      var native = name && pickTildaForm(name);
      var record = native && native.closest('.t-rec');
      if (record) {
        record.setAttribute('aria-hidden', 'true');
        record.setAttribute('data-catalog-native-form-record', '');
        return;
      }
      if (++tries < 10) setTimeout(look, 500);
    })();
  }

  function initPick(section) {
    var form = section.querySelector('[data-pick-form]');
    if (!form) return;
    var chosen = '';
    pickHideTilda(form.getAttribute('data-tilda-form-name') || '');

    // Вариант ответа: подсвечиваем кнопку и показываем ответ на неё
    Array.prototype.forEach.call(section.querySelectorAll('[data-pick-option]'), function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-pick-option');
        chosen = btn.textContent.replace(/\s+/g, ' ').trim();
        Array.prototype.forEach.call(section.querySelectorAll('[data-pick-option]'), function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        Array.prototype.forEach.call(section.querySelectorAll('[data-pick-reply]'), function (r) { r.hidden = r.getAttribute('data-pick-reply') !== key; });
      });
    });

    var name = form.querySelector('[name="name"]');
    var phone = form.querySelector('[name="phone"]');
    var nickBox = form.querySelector('[data-pick-nick]');
    var nick = form.querySelector('[name="telegram"]');
    var submit = form.querySelector('[data-pick-submit]');
    var status = form.querySelector('[data-pick-status]');
    var messenger = function () { var r = form.querySelector('[name="messenger"]:checked'); return r ? r.value : 'telegram'; };
    var nickValue = function () { var v = nick.value.trim().replace(/^@?/, '@'); return /^@[A-Za-z0-9_]{3,32}$/.test(v) ? v : ''; };
    function valid() {
      var digits = phone.value.replace(/\D/g, '').length;
      return name.value.trim().length > 1 && digits >= 10 && digits <= 15 && (messenger() !== 'telegram' || !!nickValue());
    }
    function check() { submit.disabled = !valid(); }
    // Подсказка под полем: появляется, когда человек ввёл что-то и ушёл из поля, а значение не подходит.
    // Пока поле не трогали, ошибку не показываем
    function fieldOk(el) {
      if (el === name) return name.value.trim().length > 1;
      if (el === phone) { var d = phone.value.replace(/\D/g, '').length; return d >= 10 && d <= 15; }
      if (el === nick) return !!nickValue();
      return true;
    }
    function showHint(el) {
      var hint = form.querySelector('[data-pick-hint="' + el.name + '"]');
      if (!hint) return;
      var bad = !!el.getAttribute('data-touched') && !el.disabled && !fieldOk(el);
      hint.hidden = !bad;
      el.setAttribute('aria-invalid', bad ? 'true' : 'false');
    }
    form.addEventListener('focusout', function (e) {
      var el = e.target;
      if (!el.classList || !el.classList.contains('pick-field_input') || !el.value.trim()) return;
      el.setAttribute('data-touched', '1');
      showHint(el);
    });
    form.addEventListener('input', function (e) {
      if (e.target.getAttribute && e.target.getAttribute('data-touched')) showHint(e.target);
      check();
    });
    form.addEventListener('change', function (e) {
      if (e.target.name === 'messenger') {
        var tg = e.target.value === 'telegram';
        nickBox.hidden = !tg;
        nick.disabled = !tg;
        showHint(nick);
        if (tg) nick.focus();
      }
      check();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valid() || submit.getAttribute('aria-busy') === 'true') return;
      var tg = messenger() === 'telegram';
      submit.setAttribute('aria-busy', 'true');
      submit.disabled = true;
      status.textContent = '';
      pickSend(form.getAttribute('data-tilda-form-name') || '', {
        Name: name.value.trim(),
        Phone: phone.value.trim(),
        messenger: tg ? 'Telegram' : 'MAX',
        messenger_contact: tg ? nickValue() : phone.value.trim(),
        form_source: PICK_SOURCE + ' · ' + (chosen || 'без ответа на вопрос')
      }).then(function (result) {
        submit.removeAttribute('aria-busy');
        if (result === 'error') {
          status.innerHTML = 'Не\u00a0получилось отправить заявку. Попробуйте ещё раз или напишите нам в\u00a0<a href="https://t.me/welcometoasp_bot" target="_blank" rel="noopener">Telegram</a>';
          check();
          return;
        }
        // success или timeout: Тильда приняла форму, но не ответила вовремя — заявку обычно всё равно получаем
        var done = section.querySelector('[data-pick-success]');
        form.hidden = true;
        done.hidden = false;
        done.focus();
      });
    });
    check();
  }

  /* Числа курсов в ответах на вопрос берём из тех же данных каталога */
  document.querySelectorAll('[data-catalog-count]').forEach(function (el) {
    el.textContent = courses(CARDS.filter(function (c) { return c.section === el.getAttribute('data-catalog-count'); }).length);
  });
  document.querySelectorAll('[data-catalog-pick]').forEach(initPick);
})(window);
