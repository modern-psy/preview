# CTA Academy

Каждый CTA-блок — экземпляр общего компонента, включая фон, сетку, контент,
кнопку, анимации и состояния. Исходники: [cta.html](cta.html), `cta_*` в
[components.css](components.css), обработчик `data-cta-grid*` в
[components.js](components.js). Не создавать отдельный runtime на каждый CTA.

## Варианты и подключение

Для новых секций использовать `renderCta` по API ниже, общий `components.css`,
`cta-responsive.css`, `button.css`, `section-heading.css` и тему; `components.js`
подключить один раз. Заголовок и описание используют общие текстовые роли.
Наличие описания задаёт `is-described`, новый текст или action не создаёт компонент.

`cta.html` и прежние `cta_heading.is-wide` / `is-statement` сохраняются как
примеры совместимости старых подключений, не как основа новой типографики.
Отдельный вариант `is-comparison` с высокой сценой остаётся у композиции сравнения;
её содержимое принадлежит лендингу. Внешние колонки выбирает проект, вертикальный
ритм — [section-spacing.md](section-spacing.md). Уровень H2/H3 следует иерархии страницы.

## Контракт разметки

Корень `.cta_component[data-cta-grid]`. Внутри:

- `.cta_grid[aria-hidden="true"]` → `.cta_grid-scene[data-cta-grid-stage]`;
- `.cta_grid-image` — исходный SVG;
- `.cta_grid-reset-layer` и `.cta_grid-cross-layer` — коррекция фоновых ячеек
  и декоративные кресты; сохранять их координаты вместе с соответствующим SVG;
- `.cta_grid-highlights[data-cta-grid-highlights]` — обязательный слой подсветки;
- `.cta_comet-layer[data-cta-comet-layer]` — необязательные движущиеся линии;
- `.cta_content` → `.cta_copy.section-header_component.is-responsive` с общим
  заголовком и необязательным подзаголовком, затем `.cta_button.button_component`.

Кнопка и тексты находятся вне `aria-hidden` декорации. SVG 1264×328 дан в
[assets/cta-grid.svg](assets/cta-grid.svg) как исходник обычной сцены. При копировании
в проект перенести SVG в его assets и обновить путь. Высокая сцена требует своего
SVG 1198×492; не растягивать обычный фон для неё.

Геометрию нестандартного SVG согласовать с атрибутами сцены: `data-grid-cell-size`
(по умолчанию 100), `data-grid-origin-x/y` (82/64), `data-grid-column-min/max`
(−1/11), `data-grid-row-min/max` (−1/2). Это координаты artwork, не ширина блока.

## Анимации и состояния

| Режим | Поведение |
| --- | --- |
| Без JS | SVG, текст и нативное действие остаются доступны |
| Fine pointer | Текущая ячейка и два соседа подсвечиваются; задержки соседей 70/130ms |
| Уход указателя | Подсветка сбрасывается |
| Touch/coarse | Четыре статичных акцента, без зависимости от hover |
| Reduced motion | Базовый SVG, без динамической подсветки и комет |
| Повторная инициализация | Старые listeners, observers, таймеры и анимационные узлы освобождаются |

Кометы — необязательная фоновая декорация. Их работа зависит от видимости блока
и режима ввода; на мобильном проект может скрывать слой. Общий cleanup —
`window.__academyComponentsCleanup()`, он относится ко всей Academy-библиотеке.
Несколько CTA внутри одного `.academy-page` обслуживаются независимо.
`data-interactive-grid-initialized` — диагностическая отметка, не ручное состояние.
Публичных событий CTA нет; JS сетки не назначает бизнес-действия кнопкам.

Кнопки имеют hover/focus-visible, cursor pointer и не перемещаются/масштабируются.
Enter активирует ссылку; Enter/Space — нативную кнопку. Для переходов выбирать
`a[href]`, для popup/локальных действий — `button[type=button]` и проектный handler.
Примеры намеренно содержат неактивные preview-кнопки `aria-disabled="true"` без
назначения: до публикации задать действие и убрать атрибут. `aria-disabled`
сам по себе не блокирует обработчик, поэтому проект обязан уважать это состояние.

## Тема и Tilda

Используются role tokens `--color-surface-dark`, `--color-surface-primary`,
`--color-text-on-dark-muted`, `--radius-card`, `--transition-site` и
`--color-cta-grid-muted/medium/bright`. Контент, предложение, цены, сроки,
ссылки/попапы, аналитика и точечная защита цветов от Tilda принадлежат странице.

HEAD: CSS + фон SVG один раз (inline data URI или стабильный CDN URL).
BODY: выбранная композиция и действие. FOOTER: `components.js` один раз.
Не копировать JS для каждого CTA и не оставлять `shared/`/`assets/` runtime-пути
в Tilda. Сборщик проекта управляет встраиванием, размером T123 и фрагментами.
См. [правила SVG и масок](../../rules/engineering/tilda-svg-and-masks.md).

Проверить все экземпляры, hover/focus, клавиатуру, touch, reduced motion,
no-JS, повторную инициализацию и отсутствие overflow на обязательных ширинах.
[Стенд](tests/landing-components-fixture.html) принимает `?input=touch`,
`?motion=reduce`, `?js=off` и `?init=twice`; эти параметры проверяют ветки JS,
а CSS media-query проверяется отдельно реальной настройкой браузера.

## Адаптивный CTA с описанием

`is-described is-responsive` плюс `cta-responsive.css` — четыре адаптива из
[recognition.md](recognition.md). Публичные tokens: `--cta-padding`,
`--cta-content-gap`, `--cta-copy-gap`, `--cta-button-width`. Размеры кнопки —
общий `button.css`. Без адаптивного варианта сохраняются прежние
defaults. Сетка остаётся общей; build-time шаблон `cta-grid.html` используется
`recognition-render.mjs`. Existing `data-cta-grid*` hooks и runtime не меняются.
## Единый renderer адаптивной композиции

`renderCta(data, {headingLevel: 2 | 3, headingId?})` из `cta-render.mjs` создаёт
полный CTA, включая `cta-grid.html`, заголовок, необязательное описание и кнопку.
Поля данных: heading (строка или строки), description (необязательно), button,
action, необязательный same-page `href` и gridSource. При наличии `href`
renderer создаёт нативную ссылку; без него — preview-кнопку `aria-disabled`.
Тексты экранируются; ID должен быть уникальным.
Массив строк сохраняет перенос на планшете/desktop, на мобильных текст течёт
по ширине. Кнопка получает `data-action`, назначение подключает лендинг.

Экземпляры в психологе-консультанте: recognition, foundation, grant.
Боковые поля общей адаптивной композиции: 16px до 520px, 20px на 521–767px,
36px на 768–1024px, 40px от 1025px. Вертикальные поля: 20/24/36/48px.
С описанием и без него gap до кнопки одинаков: 32px ниже 1025px и 36px выше.
Заголовок → описание — общая шкала 20/20/24/28px из [spacing.md](spacing.md).
Остальные поля и размеры одинаковы;
существующий общий JS сетки подключается один раз и обслуживает все экземпляры.

Адаптивный `cta-render.mjs` использует общий [button_component](button.md).
`cta-responsive.css` задаёт только ширину кнопки по диапазонам; высота, текст,
padding и радиус следуют актуальному Hero через `button.css`. Подключать его
вместе с адаптивной композицией; старые секционные размеры не возвращать.
