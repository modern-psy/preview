# Посекционная передача лендингов в Tilda

Обязательный стандарт для всех новых и обновляемых лендингов Academy. Он
фиксирует ошибки, обнаруженные при переносе «КПТ Оксфорд», и предотвращает их
повторение в других проектах. Детали формы находятся в
[tilda-form-bridges.md](tilda-form-bridges.md), якорей — в
[anchor-scroll.md](../../shared/academy/anchor-scroll.md), SVG и ограничений
T123 — в [tilda-svg-and-masks.md](tilda-svg-and-masks.md).

## Пространства имён Tilda и проекта

У Tilda и проекта разные пространства имён. Совпадение считается ошибкой
сборки, даже если локальный preview выглядит правильно.

### Якоря и popup hash

- Scroll target получает уникальный project-prefixed ID, например
  `course-slug-form` или `course-slug-program`. Ссылка на него выполняет только
  прокрутку.
- Tilda popup hash (`#form`, `#program`, `#free-oxford` и другие значения,
  настроенные в конкретной странице) принадлежит только popup-ссылке. Такая
  ссылка обязательно получает `data-tilda-popup-link`, чтобы общий scroll
  runtime её не перехватывал.
- На странице запрещён section/component ID, совпадающий с popup hash. Иначе
  один клик одновременно запускает Tilda popup и прокрутку к одноимённой цели.
- Нельзя использовать один `href` и для popup, и для прокрутки. Назначение
  действия хранится в project actions data и генерируется renderer, а не
  исправляется вручную в готовом Tilda-фрагменте.
- Внутренние ID компонентов также получают project/instance prefix. Все `id`,
  `for`, `aria-controls`, `aria-describedby` и `aria-labelledby` должны
  разрешаться внутри одного документа и не дублироваться между BODY-файлами.

### CSS-классы и JavaScript hooks

- Все authored styles ограничиваются уникальным корнем страницы, например
  `.course-slug-page`. Не создавать свои классы с префиксами Tilda `t-`, `tn-`
  или `js-tilda-` и не назначать кастомным элементам системные классы `.t-rec`,
  `.t-form`, `.t-submit`, `.t-input-group*`, `.js-successbox`.
- Системные классы Tilda разрешены только в точечных bridge selectors для чтения
  или управления настоящим нативным блоком. Они не являются API наших
  компонентов.
- JavaScript использует project/shared `data-*` hooks. CSS-класс не служит
  единственным runtime hook, если его может добавить или переопределить Tilda.
- Глобальные правила Tilda для `a`, `button` и controls проверяются в fixture.
  Нужная защита цвета задаётся точечно под корнем страницы; широкий
  `!important` для всех ссылок и кнопок запрещён.

## Нативная форма Tilda

Каждая отправляемая кастомная форма получает собственный
`projects/<slug>/data/form-contract.json`. Marker формы является данными проекта,
а не значением shared-компонента или соседнего курса.

1. Для нового проекта создать уникальный marker, обычно `<slug>-lead`, и задать
   это же значение в hidden input нативного блока Tilda
   `tildaspec-formname`.
2. Опубликовать страницу и прочитать marker из фактического DOM. Название блока,
   label в редакторе, record ID и form ID не являются подтверждением.
3. Записать подтверждённое значение в `form-contract.json`. Renderer обязан
   получить `data-tilda-form-name` только из этого контракта; hard-coded fallback
   и перенос marker из другого проекта запрещены.
4. Build test сравнивает generated `data-tilda-form-name` с `nativeMarker` из
   JSON. Production inspection подтверждает, что существует ровно одна
   `form.t-form` с таким `tildaspec-formname`.
5. Bridge сначала находит точную native form по marker, затем скрывает только
   `nativeForm.closest('.t-rec')`. Запись получает `hidden`,
   `aria-hidden="true"` и явный project/shared marker скрытой записи.
6. Native form остаётся в DOM и не получает `disabled`: через неё продолжают
   работать validation, CAPTCHA, receivers, CRM и success/error events.
7. Запрещены fallback на первую `.t-form`, поиск по позиции, record ID,
   глобальное `.t-form { display:none }` и скрытие всех `.t-rec`.
8. Native block располагается после BODY кастомной формы и до FOOTER bridge.
   Позднее добавление Tilda отслеживается ограниченным `MutationObserver`.
9. Если точная форма не найдена, отправка блокируется с ошибкой конфигурации.
   Нельзя выбирать другую форму или показывать фиктивный success.

Marker и получатели — разные части контракта. Совпавший marker не доказывает,
что у блока настроены правильные receivers. После публикации обязательно
проверяется получение заявки у конечного получателя.

## Один T123 — одна секция

- Каждая содержательная секция переносится отдельным BODY-файлом и отдельным
  T123. Только BODY-файлы получают последовательные префиксы `01-`, `02-`, … .
  Каждый файл начинается с комментария
  `<!-- Секция 01: Понятное название -->` и содержит читаемую разметку.
- У каждого T123 в редакторе устанавливаются нулевые внешние верхнее и нижнее
  поля. Вертикальный ритм принадлежит самой секции через shared spacing contract.
- Экспортный wrapper BODY получает project data-hook, например
  `[data-course-slug-part]`, и обязательное правило `min-height: 0; height: auto`.
  Page-level `min-height: 100vh` нельзя переносить на каждый секционный wrapper.
- Один уровень владеет верхним и нижним spacing. Запрещено одновременно добавлять
  внешний T123 padding, padding экспортного page wrapper, пустой spacer и section
  padding: их сумма создаёт двойные, тройные и четверные пустые экраны.
- Для inset/dark section используется её внутренний `--section-inset-space`.
  Межсекционный `--section-space` не подставляется вместо inset padding.
- Фиксированные `height`/`min-height` разрешены только при функциональной причине
  внутри конкретного компонента. Они не используются как способ выровнять
  секции или имитировать расстояние между ними.
- Локальный preview обязан собираться из тех же отдельных generated BODY, что и
  Tilda. Проверка исходной монолитной страницы не обнаруживает ошибку повторённого
  `100vh` и не считается достаточной.

## Обязательные проверки сборщика

Каждый новый project Tilda test блокирует передачу, если не выполняется хотя бы
одно условие:

1. BODY-файлы идут последовательно, содержат ровно одну целую секцию и правильный
   начальный комментарий; HEAD, STYLE, data и FOOTER не имеют BODY-нумерации.
2. Финальные fragments меньше лимита T123, автономны и совпадают с manifest
   hashes; повторная сборка детерминирована.
3. Каждый popup `href` отмечен `data-tilda-popup-link`; ни один popup hash не
   существует как section/component ID; scroll targets существуют ровно один раз.
4. Anchor offset равен общему контракту или документированному project override.
5. Section wrappers явно сбрасывают page-level `min-height`; сборка не содержит
   второго владельца внешнего вертикального spacing.
6. Generated marker кастомной формы равен `nativeMarker` project contract;
   delivery содержит exact-form lookup, `closest('.t-rec')`, безопасное скрытие
   и late discovery.
7. Page-scoped fixture выдерживает конфликтующие Tilda styles для authored
   button/link variants.

## Проверки опубликованной страницы

Автотесты не видят конфигурацию редактора и настоящий native form block. После
публикации обязательно проверить:

- только одну видимую кастомную форму; точная native form остаётся в DOM, а её
  ближайшая `.t-rec` скрыта;
- popup-кнопки только открывают popup, scroll-кнопки только прокручивают;
- фиксированный header не перекрывает цель якоря;
- между всеми соседними T123 нет дополнительных viewport-height промежутков;
- варианты кнопок сохраняют утверждённые цвета и состояния;
- каждая ветка формы проходит native validation/CAPTCHA, получает matching
  success/error event и создаёт заявку у правильного получателя.

Изменение marker, native fields, popup hooks, ID, секционного wrapper, T123
spacing или порядка fragments полностью сбрасывает соответствующую проверку.

## Зафиксированные ошибки и обязательный guard

| Ошибка | Причина | Guard для всех следующих лендингов |
| --- | --- | --- |
| Нативная форма видна рядом с кастомной | Generated marker не совпал с опубликованным `tildaspec-formname` | JSON contract → renderer → build assertion → inspection опубликованного DOM |
| Скрылась не та форма | Широкий selector или fallback на первую форму | Точный marker, затем только `nativeForm.closest('.t-rec')` |
| Scroll-кнопка открывает popup | Scroll target использовал Tilda popup hash | Project-prefixed scroll ID; popup hash только с `data-tilda-popup-link` |
| Popup одновременно прокручивает страницу | На странице есть ID, равный popup hash | Build test запрещает пересечение множеств popup hashes и DOM IDs |
| Между секциями несколько пустых экранов | `min-height:100vh` повторился в каждом T123 и сложился с несколькими spacing слоями | Section wrapper `min-height:0; height:auto`; нулевые T123-поля; один spacing owner |
| Цвет кнопки изменился в Tilda | Глобальный Tilda selector оказался сильнее | Точечная page-scoped защита semantic variant и fixture с конфликтующим правилом |
| Локально всё работает, production — нет | Проверялась монолитная страница без native Tilda runtime | Preview из generated fragments плюс обязательный smoke test опубликованного URL |
