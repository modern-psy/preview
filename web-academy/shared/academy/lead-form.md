# Форма заявки Academy

Готовый opt-in HTML/CSS/JS-компонент с интеграцией в нативную форму Tilda.
Используется в `psychologist-consultant` и `trauma-therapy`. Новые лендинги
подключают эти исходники, а не копируют обработчик или стили из проекта.

## Файлы и границы

| Файл | Назначение |
| --- | --- |
| [lead-form.html](lead-form.html) | Шаблон семантической разметки для копирования в лендинг |
| [lead-form.css](lead-form.css) | Поля, ошибки, состояния кнопки, success, адаптив и выбор страны |
| [lead-form.js](lead-form.js) | Валидация, телефонные виджеты, синхронизация с Tilda и lifecycle |
| [tests/lead-form-fixture.html](tests/lead-form-fixture.html) | Общий локальный стенд без внешней отправки |

Проект владеет текстами, ID, размещением секции, consent-ссылками, именем
нативной формы и `data/form-contract.json`. Нативный блок Tilda владеет
CAPTCHA, получателями, CRM и транспортом. Общий компонент не выполняет
собственный сетевой запрос заявки и не сохраняет персональные данные в storage.

Обязательные правила моста и production-проверки:
[tilda-form-bridges.md](../../rules/engineering/tilda-form-bridges.md).
Этот документ описывает подключение конкретного компонента и не заменяет
проектный контракт формы.

## Подключение в исходниках

1. Скопировать разметку `lead-form.html` внутрь `.academy-page`. Внешний section
   и сетка принадлежат лендингу. Для центральных 10/12 колонок использовать
   `column-grid_content.is-content-wide`.
2. Заменить `YOUR_FORM_MARKER` на точное значение `tildaspec-formname` нативного
   блока, подтверждённое в DOM опубликованной страницы. Значение берётся из
   project `data/form-contract.json`; в общем JS нет default, fallback на первую
   форму или привязки к какому-либо курсу.
3. Заменить тексты и legal URL, проверить их по проектному контракту. Задать
   уникальные ID и одновременно обновить `for`, `aria-describedby` и
   `aria-labelledby`. Имена `name` полей сохранять согласно таблице ниже.
4. Подключить закреплённые зависимости в указанном порядке:

```html
<!-- HEAD: Academy reset/theme, затем зависимости формы и её стили -->
<link rel="stylesheet" href="../../shared/academy/components.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/css/intlTelInput.css">
<link rel="stylesheet" href="../../shared/academy/lead-form.css">

<!-- После разметки или с defer; библиотека раньше компонента -->
<script src="https://cdn.jsdelivr.net/npm/intl-tel-input@29.1.2/dist/js/intlTelInput.min.js" defer></script>
<script src="../../shared/academy/lead-form.js" defer></script>
```

Utils той же версии `29.1.2` загружаются компонентом. CSS библиотеки загружает
собственные изображения флагов с закреплённого CDN. Для формы не нужны Splide,
Motion или `components.js`; они подключаются только другим компонентам страницы.
В production не оставлять пути `../../shared/`.

## Контракт HTML и полей

Корень: `<form class="lead-form_component" data-academy-lead-form
data-tilda-form-name="…" novalidate>`. Hook является явным включением компонента.

| Видимое поле `name` | Условие | Поле Tilda |
| --- | --- | --- |
| `name` | обязательно | `Name` |
| `email` | обязательно, ASCII e-mail с доменом | `email` |
| `phone` | обязательно, валидный международный телефон | `Phone` |
| `messenger` | radio: `max` или `telegram` | `messenger-type` |
| `maxContact` | активно только для MAX | телефонный `messenger-id` |
| `telegramContact` | активно только для Telegram, `@` + 3–32 буквы/цифры/`_` | текстовый `messenger-id` |

Поддерживается штатная структура Tilda: основной `.t-input-group_ph` и
`.t-input-group_contact_method` с телефонными result/ISO полями. MAX использует
WhatsApp slot: сначала штатно активируется `whatsapp`, затем перед отправкой
значение типа меняется на `max`. Telegram использует `telegram` slot. Перед
заполнением контакта очищаются result/ISO/visible поля всех messenger-веток;
затем заполняется только активная. Телефонный result содержит полную маску
Tilda, а не сокращённый E.164. Произвольные переименования native fields или
иная структура блока требуют отдельного адаптера и проверки контракта.

Не удалять hooks из шаблона:

- `[data-lead-field]`, `[data-lead-input]`, `[data-lead-error]` — состояние поля;
- `[data-lead-phone]`, `[data-lead-max-contact]`, `[data-lead-telegram-contact]`,
  `[data-lead-telegram-field]` — условные контакты;
- `[data-lead-submit]`, `[data-lead-submit-label]`, `[data-lead-status]` — submit;
- `[data-lead-content]` — редактируемые части;
- `[data-lead-success]` с `hidden`, `tabindex="-1"` и вложенным заголовком
  `[data-lead-success-heading]` с уникальным ID — результат отправки.

## Состояния, доступность и lifecycle

Submit начинается с `disabled` и включается только при валидных активных полях.
Ошибки показываются после редактирования и blur, submit валидирует все активные
поля. Неактивный контакт скрыт и отключён; он не участвует в валидации/mapping.
Native `disabled`, `hidden`, `checked`, `aria-invalid`, `aria-disabled` и
`aria-busy` отражают фактическое состояние; `data-state` отвечает за оформление.
В idle скрыты оба status icon; invalid показывает только error, valid — только
success. SVG-конверсия сборщика обязана сохранять этот контракт; общий generated
`display` не должен переопределять видимость иконок.

Busy начинается перед передачей данных. Ошибка возвращает форму к редактированию
и сохраняет введённые значения. Только matching `tildaform:aftersuccess` от
идентифицированной отправленной формы открывает success и переводит туда focus.
Поддерживаются DOM и jQuery события. Чужое или неидентифицированное событие
игнорируется. Ожидание CAPTCHA сохраняет busy; таймера ложного успеха нет.

Событие `academy-lead-form:validated` всплывает от custom form и содержит
`detail.formData`. Оно означает только завершение локальной валидации, не
доставку. Не использовать его для показа успеха и не логировать payload с
персональными данными.

Повторное выполнение JS сначала вызывает `window.__academyLeadFormCleanup()`.
Cleanup освобождает listeners, jQuery handlers, observer, таймер discovery и
телефонные виджеты; завершение старой асинхронной валидации игнорируется.
При программном удалении компонента вызвать этот cleanup; после вставки снова
выполнить shared script. Автопоиск поздно добавленного native блока ограничен
10 секундами и прекращается раньше, если все блоки найдены; submit также
проверяет наличие блока непосредственно перед отправкой.

Несколько экземпляров: уникальные ID и отдельный native marker для каждой
самостоятельно отправляемой формы. Не назначать двум параллельным custom forms
один native block. Состояние и focus определяются внутри конкретного экземпляра.

Без JS текст и поля доступны, submit отключён. Reduced motion убирает переходы;
кнопки не двигаются на hover и сохраняют pointer. Диалог страны поддерживает
клавиатуру, поиск и Escape; его стили вынесены в portal на `body`, чтобы избежать
обрезки родительской карточкой.

## Тема и адаптив

Для новых подключений использовать renderer и `lead-form-responsive.css` по
API renderer ниже: одна колонка до 768px, две на планшете и desktop.
Актуальная размерная шкала приведена вместе с API renderer в конце руководства.
Базовый CSS без responsive-модуля остаётся совместимым с прежними страницами;
его старые размеры не задают стандарт нового лендинга. Публичные токены:
`--lead-form-padding`, `--lead-form-control-font-size`, `--color-form-muted`,
`--color-form-error`, `--color-form-error-text` на `.lead-form_component` для
осознанных вариантов. Остальные цвета наследуют Academy role tokens.
Для переопределения component defaults подключать проектную тему после shared CSS.
Кнопка страны intl-tel-input явно защищает цвет `--color-form-muted` от Tilda
`button { color: … !important }`, чтобы код страны не наследовал чужой цвет.

Иконка поиска встроена в shared CSS из исходного SVG; шаблон содержит оригинальные
встроенные status icons. Лендинг может использовать зарегистрированные оригиналы
из своих assets. Сборщик обязан встроить локальные SVG по
[правилам Tilda](../../rules/engineering/tilda-svg-and-masks.md).

## Передача в Tilda

1. Зафиксировать контракт в `projects/<slug>/data/form-contract.json`:
   marker, custom/native fields, masks, messenger slots, consent и получатели.
   Marker создать для текущего проекта, задать в native Tilda block, опубликовать
   и подтвердить по hidden input `tildaspec-formname`. Не копировать marker
   проекта-примера.
2. На целевой странице сохранить или скопировать готовый native form block
   с настроенными получателями/CRM. Не переносить production URL другого курса
   в качестве адреса отправки и не экспортировать его transport scripts вручную.
3. HEAD: закреплённый CSS intl-tel-input, Academy CSS, `lead-form.css` и тема.
   BODY: семантическая разметка, минифицированная в пределах лимита T123.
4. Между BODY и FOOTER оставить native Tilda block. Скрывается только найденный
   блок с указанным marker, но он остаётся в DOM.
5. FOOTER: закреплённый JS intl-tel-input, затем встроенный `lead-form.js`.
   Общий файл не загружать с локального пути. Не оставлять старую копию bridge.
6. HEAD/BODY/FOOTER собирать одной версией. Проверить отсутствие локальных
   runtime-путей, правильный порядок библиотек и стабильность manifest hashes.
7. На опубликованной странице подтвердить поля и получателей, пройти обе ветки,
   CAPTCHA и проверить заявки в CRM по общему стандарту моста. Локальный success
   на fixture не является production-проверкой доставки.
8. Project build test сравнивает generated `data-tilda-form-name` с
   `nativeMarker` JSON, проверяет exact-form lookup, скрытие только ближайшей
   `.t-rec` и late discovery. Общий release gate описан в
   [tilda-delivery.md](../../rules/engineering/tilda-delivery.md).

## Локальная проверка

Запустить сервер из корня и открыть `shared/academy/tests/lead-form-fixture.html`.
Стенд использует реальную разметку и скрипты выбранного лендинга, добавляя только
локальный native fixture. Нажать «Проверить форму»; результат появляется рядом.

Параметры: `project=psychologist-consultant|trauma-therapy`, `messenger=telegram`
(по умолчанию MAX), `init=twice`, `forms=two` (дополнительно `target=second` для второй формы),
`event=success|error|unrelated|unscoped|captcha|validation|missing`.
Проверять mapping, один native submit, отсутствие контактов неактивной ветки,
сохранение значений при ошибке, игнорирование чужого успеха и независимость форм.
Дополнительно — widths 375/520/521/767/768/1024/1025/1440, keyboard/focus,
поиск страны, reduced motion, no-JS и реальные self-contained Tilda-фрагменты
обоих потребителей.
В собранном preview отдельно проверить idle → invalid → valid, взаимоисключение
иконок, неверные и корректные email/телефоны/Telegram, включение submit и скрытую
ветку контакта под конфликтующим правилом цвета. Проектный стенд для этой границы:
`projects/psychologist-consultant/tests/form-preview-fixture.html`; он использует
текущий полный preview и не отправляет заявку.


## Полный renderer и новые адаптивы

Для новых интеграций использовать `renderLeadForm(data, {id})` либо
`renderLeadFormSection(data, {id, formId})` из [lead-form-render.mjs](lead-form-render.mjs).
Разметка [lead-form-template.mjs](lead-form-template.mjs) принадлежит компоненту:
не копировать её в лендинг. Подключить `lead-form.css`, затем
[lead-form-responsive.css](lead-form-responsive.css), общие button, section-heading,
section-spacing, body-text, компоненты сетки и тему Academy; JS и intl-tel-input
подключаются в прежнем порядке этого руководства. Renderer не заменяет bridge.

`data` содержит строки заголовков/подписей/успеха, `errorIcon`, `successIcon`,
HTTPS `agreementUrl`, `privacyUrl`, явный `nativeMarker`. Полный пример copy —
[lead-form.json](../../projects/psychologist-consultant/data/lead-form.json).
Проектный adapter берёт marker и ссылки из `data/form-contract.json`.
Все строки экранируются. Каждый экземпляр получает уникальные form/section ID
и отдельный marker, если должен отправляться в другую нативную форму.
Количество и машинные имена полей не являются свободным контентом: изменение
требует согласованной правки form contract и mapping, а не только подписи.

Сетка: одна колонка до 767px; две равные 768–1024px; 1.25fr/1fr от 1025px.
Поля 50/60/70/70px; внутренние поля карточки 16/20/24/24px; общие H2 и кнопка.
Ошибки и success увеличивают секцию по содержимому. Одинаковая высота обычных
и телефонных полей сохраняется после инициализации intl-tel-input.

Инструкция оператору с конкретными полями и порядком переноса:
[FORM-TILDA.md](../../projects/psychologist-consultant/FORM-TILDA.md).
В новом лендинге составить собственную инструкцию из его form contract.

Обычная текстовая шапка использует `section-header_component.is-responsive`: отступ
заголовок → подзаголовок 20/20/24/28px из [spacing.md](spacing.md), без
компактного portrait-исключения.

`lead-form.css` сам скрывает `.screen-reader-only` внутри формы, включая legend
и подписи телефонных полей; проектная utility для этого не требуется.
Цвет подзаголовка на тёмной поверхности берётся из `--color-form-muted`.
