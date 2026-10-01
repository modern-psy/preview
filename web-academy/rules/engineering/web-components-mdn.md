# Web Components — стандарт на основе MDN

Обязательная база платформенных решений для компонентов Web Academy по прямому
поручению пользователя. Применяется вместе с [архитектурой компонентов](components.md).
Проверено по документации 2026-09-09. Совместимость конкретного API повторно
проверять перед его внедрением: дата этого документа не гарантирует поддержку.

Область изучения — раздел [MDN Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components):
все три руководства, концепции и связанные справочники раздела. Это собственный
конспект и правила применения, а не дословная копия MDN и не энциклопедия всего
сайта HTML/CSS/JavaScript. Ссылки сохраняют доступ к полному синтаксису, примерам,
исключениям и таблицам совместимости. Требования Academy ниже — наши инженерные
решения на основе платформы, а не утверждение, что MDN предписывает Tilda,
Client-First, конкретный layout или организацию файлов.

## 1. Карта концепций и руководств

| Технология | Что предоставляет | Основное руководство |
| --- | --- | --- |
| Custom Elements | Собственный HTML-тег, класс, регистрация, lifecycle и реакция на атрибуты | [Using custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) |
| Shadow DOM | Отдельное дерево DOM и граница CSS-селекторов; управляемые точки взаимодействия | [Using shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) |
| Templates и slots | Повторяемая разметка и композиция с содержимым, переданным потребителем | [Using templates and slots](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots) |

Технологии сочетаются по необходимости. Custom Element может использовать Light
DOM, а Shadow DOM может принадлежать разрешённому стандартному HTML-элементу.
`<template>` полезен и без Custom Element. Для распределения содержимого через
`<slot>` требуется shadow tree; обычный placeholder в HTML не создаёт эту механику.

Решение Academy: каждая секция имеет самостоятельный контракт композиции,
адаптива и поведения. Уровень реализации выбирается по `components.md`:
семантический HTML/CSS для статичной структуры, Custom Element для оправданного
состояния/lifecycle. Основной контент лендинга по умолчанию остаётся в Light DOM.
Shadow DOM добавляется при документированной потребности в изоляции.

## 2. Определение и регистрация

- Автономный элемент наследуется от `HTMLElement`; constructor начинается с
  `super()`. Регистрируется соответствие имени и класса, затем элемент можно
  использовать в HTML или создать через `document.createElement(name)`.
- Имя начинается с ASCII-строчной буквы, содержит дефис, не содержит ASCII
  прописных букв и запрещённых символов. В Academy использовать `academy-*`.
  Зарезервированные имена из спецификации недопустимы.
- Customized built-in наследует конкретный native-интерфейс, регистрируется с
  `extends` и используется через `is`. В Academy этот путь не применять:
  поддержка отличается между браузерами, включая Safari.
- Регистрацию выполнять один раз. `customElements.get(name)` защищает от
  повторного `define()`, но не доказывает совместимость уже загруженной версии.
  Сборщик должен исключать конфликтующие реализации под одним именем.
- Не пытаться переопределять существующее имя или повторно регистрировать тот же
  constructor под другим именем в одном registry; `define()` может выбросить
  `NotSupportedError`, неверное имя — `SyntaxError`.

Источники: [define()](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define),
[is](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/is),
[createElement()](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement).

| Registry API | Назначение и правило |
| --- | --- |
| `window.customElements` | Глобальный registry окна; базовый путь Academy |
| `define(name, Class)` | Зарегистрировать определение |
| `get(name)` | Получить constructor или `undefined` |
| `getName(Class)` | Получить зарегистрированное имя или `null`; поддержку проверять отдельно |
| `whenDefined(name)` | Promise определения, разрешается constructor; это не сигнал готовности контента, медиа или асинхронного render |
| `upgrade(root)` | Обновить подходящие элементы поддерева до зарегистрированных классов, в том числе до вставки в документ; это не подключение к DOM |
| `new CustomElementRegistry()` | Отдельный scoped registry для разрешения конфликтов имён |
| `initialize(root)` | Назначить registry узлам с `null` registry и попытаться выполнить upgrade; существующее назначение не заменяется |

Источники: [CustomElementRegistry](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry),
[whenDefined()](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/whenDefined),
[upgrade()](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/upgrade),
[initialize()](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/initialize).

Scoped registries не являются базовой зависимостью Academy: конструктор и связанные
возможности имеют ограниченную доступность на дату проверки. При обоснованном
применении документировать registry конкретного дерева, порядок создания и
fallback с уникальными именами. `extends` в scoped registry не поддерживается.
`customElementRegistry` доступен у `Document`, `Element`, `ShadowRoot`; значение
может быть `null`. Привязанный registry нельзя произвольно заменить переносом узла.

Источники: [scoped constructor](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/CustomElementRegistry),
[Document registry](https://developer.mozilla.org/en-US/docs/Web/API/Document/customElementRegistry),
[Element registry](https://developer.mozilla.org/en-US/docs/Web/API/Element/customElementRegistry),
[ShadowRoot registry](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/customElementRegistry).

## 3. Жизненный цикл

| Точка | Обязательное поведение Academy |
| --- | --- |
| `constructor()` | Инициализировать поля; при необходимости создать shadow root/internals. Не читать children/атрибуты host и не менять его Light DOM/атрибуты |
| `connectedCallback()` | Подключать поведение с защитой от повторов; читать конфигурацию и доступную разметку |
| `disconnectedCallback()` | Освобождать listeners, observers, timers, media и animation instances; отменять устаревшие async-операции |
| `connectedMoveCallback()` | При использовании `moveBefore()` обрабатывать смену окружения без лишнего teardown; только при поддержке API |
| `adoptedCallback(oldDocument, newDocument)` | При поддерживаемом переносе между документами перепривязывать ресурсы документа/окна |
| `attributeChangedCallback(name, oldValue, newValue)` | Обрабатывать только объявленные `observedAttributes`; учитывать первый вызов и удаление атрибута |

`connectedCallback()` может выполниться, когда HTML-парсер ещё не добавил детей.
Для статичного Tilda HTML загружать регистрацию после разметки или через внешний
`defer`/module script. Для динамической вставки определить явный договор готовности
детей; случайный `setTimeout` не является таким договором. Начальный callback
атрибутов может предшествовать подключению: renderer не должен требовать ещё
несуществующие узлы. Источник: [lifecycle и attributes](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements).

Перемещение через обычные DOM-операции может вызвать disconnect/connect.
`moveBefore()` сохраняет больше браузерного состояния, но требует совместимого
контекста подключения и того же документа. Fallback через `insertBefore()`
не равноценен по сохранению focus, iframe, dialog и анимаций. Источник:
[moveBefore()](https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore).

Практика Academy: держать отдельно «структура создана» и «ресурсы подключены».
При повторном подключении сохранять пользовательское состояние и заново
подключать ресурсы. Проверять `isConnected` перед отложенным изменением DOM,
а также актуальность операции: одного `isConnected` недостаточно после
disconnect/reconnect. Источник свойства:
[Node.isConnected](https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected).

## 4. Входные данные, свойства и состояния

- Контракт перечисляет атрибуты, типы, defaults, допустимые значения, удаление,
  ошибки и динамические обновления. Атрибуты — сериализуемая конфигурация;
  properties/methods — программный API. Не предполагать автоматическую синхронизацию
  собственных свойств с атрибутами.
- Для собственного boolean-атрибута принять семантику присутствия; строка
  `"false"` не должна неявно становиться способом выключения. Числа и enum
  нормализовать до применения; неправильные значения не должны ломать страницу.
- Reflection реализовать явно, сравнивая старое и новое значения; setter и
  callback не должны зацикливаться. Не перезаписывать переданную конфигурацию
  defaults при каждом подключении.
- Если разрешена установка property до upgrade, обработать собственное свойство,
  которое иначе затенит setter прототипа. Этот сценарий включать в контракт и проверку.
- Приоритет native/ARIA состояния определён в `components.md`. `is-*` — вариант
  или визуальное отражение, а не независимая копия истины.

Это требования к API Academy; платформенная реакция на атрибуты описана в
[Using custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements).

`ElementInternals.states` предоставляет `CustomStateSet`: наличие идентификатора
означает true. Доступны `add`, `delete`, `has`, `clear`, `size`, обход через
`entries`, `keys`, `values`, `forEach` и iterator. Для enum обеспечить
взаимоисключение состояний. CSS читает их через `:state(name)`, в shadow CSS —
через `:host(:state(name))`; возможна стилизация состояния экспортированного part.
Custom states сами по себе не предоставляют ARIA и keyboard behavior.

Источники: [CustomStateSet](https://developer.mozilla.org/en-US/docs/Web/API/CustomStateSet),
[:state()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:state).

Для старых браузеров выбрать синхронизированный fallback `data-state`/ARIA и
изолировать неподдерживаемые селекторы. Не добавлять устаревший `:--state` в новую
реализацию без конкретной необходимости поддержки старого consumer.

## 5. Shadow DOM и границы доступа

- Различать host, shadow root, shadow tree, boundary и Light DOM. Обычный
  `document.querySelector()` не проходит внутрь shadow tree.
- `open` предоставляет `host.shadowRoot`; `closed` скрывает этот путь доступа.
  Это инкапсуляция, не песочница безопасности: JavaScript компонента не изолирован
  от страницы. Выбор `closed` не защищает секреты.
- `lang` и `dir` наследуются через host; назначение в slot не меняет DOM-родителя.
  Для локализации проверять отдельно DOM-наследование языка/направления и CSS
  наследование через отображаемое дерево.

Источник: [Using shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM).

`attachShadow({ mode })` вызывается на разрешённом host. Не все native-элементы
подходят. Опции `delegatesFocus`, `slotAssignment`, `clonable`, `serializable`,
`customElementRegistry`, `referenceTarget` проверять отдельно от базового метода.
Не вызывать `attachShadow()` повторно на каждом connect. При существующем
declarative root повторный вызов с тем же mode очищает его содержимое; с другим
mode возникает ошибка. Использовать существующий root при enhancement.
`static disabledFeatures` может запрещать `shadow` и/или `internals`.

Источник: [attachShadow()](https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow).

| API дерева | Когда нужен |
| --- | --- |
| `host.shadowRoot`, `ShadowRoot.host`, `mode` | Найти доступный root/host и определить режим |
| `node.getRootNode()` | Определить ближайший root, включая detached tree |
| `node.getRootNode({ composed: true })` | Получить root за shadow-границами; detached дерево не превращается в document |
| `ShadowRoot.activeElement`, `delegatesFocus` | Проверить фактический focus внутри компонента |
| `fullscreenElement`, `pictureInPictureElement`, `pointerLockElement` | Управлять соответствующими медиа/интерактивными состояниями |
| `styleSheets`, `adoptedStyleSheets` | Проверить обычные и созданные программно таблицы стилей |
| `slotAssignment`, `clonable`, `serializable`, `customElementRegistry`, `referenceTarget` | Проверить выбранные возможности root; поддержка опций различается |
| `getAnimations()` | Найти анимации дерева для управления/cleanup |
| `getSelection()`, `elementFromPoint()`, `elementsFromPoint()` | Задачи выделения и hit-testing; поддержку проверять у конкретного метода |
| `innerHTML`, `getHTML()`, `setHTML()`, `setHTMLUnsafe()` | Разбор/сериализация; различать поддержку shadow roots и очистку HTML |

Источники: [ShadowRoot](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot),
[shadowRoot](https://developer.mozilla.org/en-US/docs/Web/API/Element/shadowRoot),
[getRootNode()](https://developer.mozilla.org/en-US/docs/Web/API/Node/getRootNode).

## 6. CSS-изоляция и публичная тема

Shadow CSS ограничен деревом селекторов. Наследуемые свойства и CSS custom
properties могут поступать через host, а slotted nodes остаются Light DOM.
Поэтому Shadow DOM не заменяет явный контракт темы. Наши component-prefixed
tokens, Client-First классы и правила внешнего layout сохраняются.

Источник границ: [CSS scoping](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scoping).

| Механизм | Правило применения |
| --- | --- |
| `:host` | Стили host из его shadow CSS; снаружи не работает |
| `:host(selector)` | Один compound selector для варианта самого host; specificity включает псевдокласс и аргумент |
| `:host-context()` | Устарел на дату проверки; не использовать в новых компонентах. Тему передавать tokens или явным вариантом host |
| `::slotted(selector)` | Стили непосредственно назначенных элементов; не текстовых узлов и не произвольных descendants |
| `part="a b"` + `::part(a)` | Открыть именованную внутреннюю часть для внешнего CSS; это публичный API |
| `exportparts="inner:outer"` | Явно переэкспортировать/переименовать parts вложенного shadow-компонента |
| `:defined` | Проверить наличие определения; не означает готовность экземпляра. Не скрывать essential content до регистрации |
| `:state(name)` | Визуализировать документированное custom state |

Источники: [:host](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:host),
[:host()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:host_function),
[:host-context()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:host-context),
[::slotted()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::slotted),
[part](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/part),
[::part()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::part),
[exportparts](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/exportparts),
[:defined](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:defined).

Не строить цепочки `::part(a)::part(b)` и селекторы внутренних descendants через
part. Разрешённые состояния вроде `:hover` не открывают всю структуру дерева.
В Light DOM `<style>` внутри компонента или template не создаёт автоматической
изоляции. `:scope` — точка отсчёта селектора, не аналог shadow boundary.

Для shadow CSS доступны встроенный `<style>`, внешний `<link>` и constructed
stylesheet. Последний создаётся через `new CSSStyleSheet()`, заполняется
`replace()`/`replaceSync()` и подключается через `adoptedStyleSheets`. Общая sheet
меняет все использующие её экземпляры: индивидуальную тему задавать tokens.
Adoption ограничено контекстом того же документа. Внешний `<link>` может дать
вспышку неоформленного shadow content. Для Tilda критический CSS должен
попадать в самодостаточный пакет.

Источники: [adoptedStyleSheets](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/adoptedStyleSheets),
[стили shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM),
[внешние стили Custom Element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#referencing_external_styles).

## 7. Templates, клонирование и declarative Shadow DOM

- Обычный `<template>` не отображает содержимое. Оно находится в `.content`
  (`DocumentFragment`), а не в обычных children элемента.
- Для экземпляров импортировать копию: `document.importNode(template.content, true)`.
  Вставка исходного fragment переносит его детей и опустошает заготовку.
- Контекст документа важен для определения вложенных Custom Elements.
  `cloneNode(true)` не переносит listeners, добавленные через `addEventListener`,
  и может дублировать ID. В Light DOM пересоздавать уникальные ID и ссылки на них;
  поведение подключать к экземпляру, а не к исчезающему fragment-контейнеру.
- Стили template изолированы лишь после вставки в shadow tree.

Источники: [HTMLTemplateElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLTemplateElement),
[templates guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots),
[cloneNode()](https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode).

`<template shadowrootmode="open">` позволяет HTML-парсеру создать root у родителя
без клиентского построения дерева. Атрибуты `shadowrootdelegatesfocus`,
`shadowrootclonable`, `shadowrootserializable`, `shadowrootslotassignment`,
`shadowrootcustomelementregistry`, `shadowrootreferencetarget` настраивают
соответствующие возможности; проверять поддержку каждого.
Старый `shadowroot` не использовать. Установка `shadowrootmode` после обычного
парсинга не превращает template в root. Обычный `innerHTML` не равнозначен
парсеру declarative shadow roots.

`<template for>` и processing-instruction markers для out-of-order patching
изучены как новая возможность справочника; на дату проверки это экспериментальная
функция с ограниченной поддержкой. Она не входит в базовый Tilda-путь.

Источник: [template: attributes и usage](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/template).

Решение Academy: template не должен быть единственным местом essential content
при зависимости от JS. Для declarative root отдельно доказать сохранность после
вставки в Tilda; DOM-сериализация не должна незаметно потерять shadow content.
Динамический текст передавать через `textContent`. Для HTML-вставки определить
доверенный источник и очистку; Shadow DOM не устраняет XSS.

## 8. Slots и композиция

Именованный `<slot name="title">` принимает верхнеуровневых детей host с
`slot="title"`. Несколько детей могут иметь одно имя; несколько слотов одного
имени направят их в первый. Default slot принимает содержимое без имени.
Fallback внутри slot виден, когда назначенного содержимого нет. Неподходящее
имя slot может оставить Light DOM контент вне отображаемой композиции.

Источники: [slot element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/slot),
[slot attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/slot).

| API | Контракт |
| --- | --- |
| `HTMLSlotElement.name` | Имя точки композиции |
| `assignedNodes()` | Назначенные узлы, включая Text |
| `assignedElements()` | Только элементы |
| `{ flatten: true }` | Раскрыть вложенное распределение слотов; учитывать fallback |
| `assign(...nodes)` | Задать порядок Element/Text в manual slot; требует `slotAssignment: "manual"` |
| `Element.slot` | Имя, задаваемое атрибутом `slot` |
| `Element.assignedSlot`, `Text.assignedSlot` | Фактическая доступная связь со slot или `null` |
| `slotchange` | Изменился набор назначенных узлов; не наблюдение всех mutations внутри них |

Источники: [HTMLSlotElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement),
[assignedNodes()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/assignedNodes),
[assign()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/assign),
[Element.slot](https://developer.mozilla.org/en-US/docs/Web/API/Element/slot),
[Element.assignedSlot](https://developer.mozilla.org/en-US/docs/Web/API/Element/assignedSlot),
[Text.assignedSlot](https://developer.mozilla.org/en-US/docs/Web/API/Text/assignedSlot),
[slotchange](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/slotchange_event).

Решение Academy: default — named assignment. Manual assignment применять только
для нужного поведения и с проверенным fallback; внутри одного root не смешивать
его с автоматическим распределением. Контракт каждого slot определяет допустимую
семантику, кратность и пустое состояние. Сохранять логичный reading/focus order.
Изменения внутри slotted content при необходимости наблюдать отдельно с cleanup.

## 9. События через границы

`bubbles` управляет всплытием, `composed` — пересечением shadow boundary. Это
разные флаги; non-bubbling composed event всё ещё имеет особенности capture/host.
Синтетическое событие не становится composed автоматически. `composedPath()`
показывает путь с учётом границ; закрытое дерево скрывает внутренние узлы от
внешнего наблюдателя. Внешний `event.target` может быть переназначен на host.

Источники: [Event.composed](https://developer.mozilla.org/en-US/docs/Web/API/Event/composed),
[composedPath()](https://developer.mozilla.org/en-US/docs/Web/API/Event/composedPath).

Публичное событие Academy именовать `academy-component:action`; документировать
момент отправки, `detail`, `bubbles`, `composed`, `cancelable`. Для уведомления
страницы из вложенных компонентов явно выбирать `bubbles: true, composed: true`.
Отменяемое событие намерения отправлять до действия и уважать отмену;
уведомление о совершённом изменении отправлять после синхронизации состояния.
Не раскрывать внутренние DOM-узлы в `detail` без необходимости и не строить
интеграцию на чужой внутренней разметке. Не глушить native events без причины.

Источник механизма: [CustomEvent()](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent).

## 10. ElementInternals, доступность и формы

`attachInternals()` возвращает `ElementInternals`, не вызывается повторно на том
же элементе и может быть запрещён `disabledFeatures`. Он доступен автономным
Custom Elements; Shadow DOM для него не обязателен. Через internals доступны
default `role`/ARIA, custom states и возможности form-associated control.
Авторские ARIA-атрибуты могут переопределять default semantics.

Источники: [attachInternals()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/attachInternals),
[ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals).

Решение Academy: native controls сохраняют приоритет. Custom tag не получает
автоматически семантику кнопки или поля; ARIA не реализует клавиатуру.
Проверять accessible name, focus, labels и references внутри/снаружи shadow
boundary. Не рассчитывать на произвольные строковые ID-ссылки между деревьями;
новые ARIA element-reference API и `referenceTarget` требуют проверки поддержки.
`delegatesFocus` не заменяет keyboard contract. Применять
[semantic accessibility](../product/semantic-accessibility.md).

Для оправданного form-associated control:

| Возможность | Обязанность компонента |
| --- | --- |
| `static formAssociated = true` | Объявить участие в форме |
| `internals.form`, `labels` | Использовать фактическую форму и связанные labels |
| `setFormValue(value, state)` | Разделять отправляемое значение и состояние восстановления; поддерживаются string/File/FormData, `null` исключает значение из отправки |
| `setValidity(flags, message, anchor)` | Выставлять причину ошибки и текст; `{}` очищает ошибки; anchor принадлежит компоненту |
| `validity`, `validationMessage`, `willValidate` | Отражать действительную доступность/валидность проверки |
| `checkValidity()`, `reportValidity()` | Различать проверку и запрос показа ошибки браузером |
| `formAssociatedCallback(form)` | Обработать смену формы, включая `null` |
| `formDisabledCallback(disabled)` | Синхронизировать доступность UI и поведение |
| `formResetCallback()` | Восстановить оговорённые начальные значения |
| `formStateRestoreCallback(state, reason)` | Обработать восстановление и autocomplete при поддержке браузера |

Источники: [setFormValue()](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals/setFormValue),
[setValidity()](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals/setValidity),
[form lifecycle в HTML Standard](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-element-reactions).

Это UI/form API браузера. В Academy нативная Tilda-форма остаётся владельцем
CAPTCHA, доставки и CRM по [правилам bridge](tilda-form-bridges.md).
Не отправлять одинаковые данные одновременно через FACE и hidden mirrors.
Проверять фактический `FormData`, reset, disabled, validation и доставку отдельно.

## 11. Совместимость и качество источников

- Проверять точный метод, опцию и CSS selector, а не только зелёный статус
  родительского интерфейса. Особое внимание scoped registry, `moveBefore`,
  declarative options, serialization, ARIA references и новым HTML parsers.
- Feature detection должен проверять используемую возможность. Наличие
  `attachShadow` не доказывает поддержку всех его опций; наличие `customElements`
  не доказывает поддержку scoped constructor.
- Документировать fallback без существенной потери контента/действий. Polyfill,
  фреймворк и новый runtime не добавлять автоматически.
- Учебные примеры MDN демонстрируют API. Их фиксированные размеры, `!important`,
  интерактивные span, отсутствие teardown или повторный `attachShadow()` не
  становятся production-паттернами Academy.
- При расхождении overview и method reference сверять точный метод и связанную
  спецификацию. Не копировать противоречие в правило: например, результат
  `whenDefined()` уточнять по его странице, semantics `null` registry — по
  `initialize()` и спецификации.

## 12. Применение к каждой секции Academy

Перед реализацией заполнить контракт в каталоге общей библиотеки; конкретные
имена классов и пути не выводятся из учебных названий MDN.

1. Назначение, граница секции и вложенные компоненты; обязательные/optional части.
2. Семантический HTML; слот/область для контента, media и actions потребителя.
3. Публичные variants, tokens, attributes/properties/methods и defaults.
4. Адаптив по переданным макетам, intrinsic sizing и поведение между точками.
5. Состояния, события, focus/keyboard и режим без JS/reduced motion.
6. Инициализация, обновление, disconnect/reconnect и владение ресурсами.
7. Shared source, зависимости и сборка в самодостаточные Tilda HEAD/BODY/footer.
8. Критерии проверки и список затронутых consumers при изменении общего API.

Секцию считать готовой после viewport-матрицы из корневого `AGENTS.md`, проверки
двух сторон изменённых breakpoints, keyboard/hover/focus, overflow, ошибок и
Tilda-переноса. Для Custom Element дополнительно проверять несколько экземпляров
и вложенность, регистрацию после разметки, удаление/повторную вставку, изменение
и удаление атрибутов, пустые optional parts, delayed/failed JS, cleanup и события.
Для slots — распределение и изменение контента; для формы — её отдельный контракт.

Эталон извлечения — «Психолог-консультант» по `components.md`. MDN определяет
платформенные механизмы; пользовательские адаптивы и Figma определяют визуальные
требования секции. Обновление этой базы не означает автоматической миграции
существующих секций на Custom Elements или Shadow DOM.
