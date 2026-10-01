# Production-решения и зафиксированные ошибки

Долговременная ретроспектива завершённого лендинга. Это не session handoff и не
список выполненных шагов: здесь остаются только ошибки и ограничения, которые
могут повториться при изменении страницы или переносе паттерна в другой проект.

## Ошибки контента и семантики

| Ошибка/симптом | Причина | Исправление и guard |
| --- | --- | --- |
| У Сучилиной оказалось описание Романовской | Copy был продублирован при сборке карточек | Карточки исправлены в `index.html`; имена и порядок сверяются со schema в Tilda test |
| Новые описания и порядок преподавателей расходились с JSON-LD | Видимый HTML менялся отдельно от `schema.org` | Менять оба canonical source; тест строит порядок из `CourseInstance.instructor` и сравнивает с DOM |
| После переноса даты visible copy показывал 24 ноября, а schema/test ожидали 23-е | Дата была жёстко повторена в нескольких источниках | Синхронизированы HTML, `CourseInstance.startDate`, identifier, asset note и test expectation |
| Тире продолжало начинать новую строку и наследовало цвет следующей части | Accent `span` имел `display: block` и начинался с тире, поэтому CSS разрывал связь и окрашивал знак в accent | Accent `span` стал inline и начинается после тире; тире связано с предыдущим словом и остаётся primary, короткий предлог связан со следующим словом; regression assertions проверяют markup и computed display |
| Hero-карточки с иконками имели меньший icon-to-copy gap, чем такой же блок challenges | В hero у shared-карточек отсутствовал вариант `is-spacious`, хотя структура с `card_icon` совпадала | Все карточки с `card_icon` используют единый `.card_component.is-spacious`; Tilda test проверяет source и generated BODY |
| Generated Tilda fragment мог устареть после source edit | Source и `tilda/` существуют раздельно | Generated-файлы не редактировать; выполнять две сборки и проверять стабильные hashes |

## Ошибки нативной формы и CRM-моста

| Ошибка/симптом | Причина | Исправление и guard |
| --- | --- | --- |
| Bridge не находил форму после копирования Tilda block | Record/form ID менялся | Discovery только по `tildaspec-formname=trauma-therapy` |
| Поля выглядели настроенными, но отсутствовали в runtime DOM | Tilda label не гарантирует ожидаемый input `name` | Production preflight проверяет `Name`, `email`, `Phone`, `messenger-type`, `messenger-id` |
| Нативная validation отвергала телефон | В result field попадал короткий E.164 вместо полного mask/minlength значения | `fillTildaPhoneGroup()` синхронизирует visible, result и ISO fields |
| При смене messenger в payload оставался старый контакт | Hidden/disabled branch сохранял прежние result fields | Перед mapping очищаются `messenger-id`, phone parts и ISO parts обеих веток |
| MAX уходил как WhatsApp | В native contact-method block использован штатный WhatsApp slot | Slot активируется штатными events, затем согласованное значение меняется на `max`; mapping закреплён в form contract |
| Кастомная форма показывала успех без доказанной доставки | Success связывался с таймером или фактом вызова submit | Success разрешён только после matching `tildaform:aftersuccess` и подтверждается записью в CRM |
| CAPTCHA воспринималась как зависание/ошибка | Между submit и final event есть штатное интерактивное состояние | CAPTCHA остаётся busy; таймер не переводит форму ни в success, ни в error |
| Событие другой формы могло завершить текущую | Document-level event не был привязан к form instance | Bridge хранит submitted native form и нормализует DOM/jQuery event signatures |
| Нативная synchronous validation оставляла custom submit в busy | `aftererror` не обязан возникнуть при client-side validation | После `requestSubmit()` проверяется `.js-error-control-box` и возвращается recoverable error |
| Повторный preview/editor init создавал двойные listeners | Старый controller не очищался | Глобальный cleanup снимает DOM/jQuery listeners, observer и intl-tel-input instances |

Точный контракт находится в [`data/form-contract.json`](data/form-contract.json),
общий стандарт — в
[`../../rules/engineering/tilda-form-bridges.md`](../../rules/engineering/tilda-form-bridges.md).

## Ошибки Tilda delivery и media

| Ошибка/симптом | Причина | Исправление и guard |
| --- | --- | --- |
| SVG выглядел как белый квадрат | Непрозрачный GIF в `img src` перекрывал CSS background | Builder использует проверенный transparent GIF; test декодирует Graphic Control transparency flag и запрещает известный opaque pixel |
| Иконки/сетки пропадали после частичного обновления | BODY placeholders и HEAD background SVG были из разных сборок | HEAD и BODY переносятся и откатываются только парой; manifest фиксирует hashes |
| BODY не помещался в T123 | Повторяющиеся SVG и форматирование раздували character count | SVG вынесены в HEAD CSS, BODY минифицирован в одну строку; builder падает при `body.length > 65000` |
| Production пытался загрузить `assets/`, `shared/` или localhost | Authoring paths попали в final fragment | Builder/test запрещают local runtime dependencies; runtime media используют data URL или Tilda CDN |
| Tilda меняла цвет CTA, кнопки и form states | Глобальные Tilda rules использовали `!important` | Только точечная `.trauma-page` protection boundary со всеми intentional variants |
| Popup «Скачать полную программу» переставал открываться | Общий smooth-scroll handler перехватывал `#form-download` | Ссылки с `data-tilda-popup-link` исключены из anchor scroll; popup остаётся Tilda-owned |
| JS-библиотеки и bridge запускались в неверном порядке | Footer fragments или CDN scripts были переставлены | Splide → intl-tel-input → shared components → anchor logic → form bridge; порядок тестируется |
| Слайдер расходился на границе mobile/desktop | CSS и `matchMedia` использовали соседние, но разные пороги | Единый contract: authored list до 520px, Splide от 521px; проверяются обе стороны 520/521 |
| Tilda editor выглядел исправно, а опубликованная страница — нет | T123 и нативная форма выполняются в editor не полностью | Финальный smoke test всегда проводится на published URL, включая console/network и оба form branches |

Общие правила этих guard-ов находятся в
[`../../rules/engineering/tilda-svg-and-masks.md`](../../rules/engineering/tilda-svg-and-masks.md),
[`../../rules/engineering/components.md`](../../rules/engineering/components.md)
и [`../../rules/product/typography.md`](../../rules/product/typography.md).

## Что не хранить

Standalone handoff, временные deployment notes, промежуточные screenshots и
завершённые checklist сюда не добавляются. Актуальный статус остаётся только в
`STATE.md`, точные контракты — в JSON/source, история — в Git.
