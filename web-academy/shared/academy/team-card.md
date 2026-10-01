# Карточка команды

Статичный самостоятельный компонент: `team-card-render.mjs` + `team-card.css`.
Первый consumer — секция [support-team](support-team.md).

`renderTeamCard({title, description, image, tag?, featured?}, options)`:
image — `{src, width, height, alt}`, обязательны положительные intrinsic размеры
и контекстный alt. tag — данные [meta-pill](meta-pill.md), полностью необязателен.
`options.tag` — article по умолчанию или li в списке; `headingLevel` — 3 по
умолчанию, допускаются 2–6. Текст экранируется; содержание и медиа принадлежат
лендингу. `featured` выставляет `is-featured`, которым внешняя композиция
управляет порядком и размещением, а не оформлением карточки.

Публичные части: `team-card_component`, `team-card_copy`, `team-card_title`,
`team-card_image`. Заголовок — общий `content-heading_component.is-card`,
описание — `body-text_component`, их группа — `content-header_component`.

| Интервал | ≤520px | 521–767px | 768–1024px | ≥1025px |
| --- | --- | --- | --- | --- |
| Текст → фото | 16px | 16px | 20px | 28px |
| Заголовок → описание; тег → группа | 8px | 8px | 12px | 12px |

Tokens: `--team-card-media-gap`, `--team-card-copy-gap`, `--team-card-radius`
(default `--radius-card`). Фотографии занимают доступную ширину, высота auto: предварительная
обрезка пользователя сохранена без повторного crop и растяжения. Нет фиксированной
высоты текста или media; карточка растёт при переводе и увеличении шрифта.

Карточка не интерактивна: нет tabindex, событий, hover-анимации или JS. Контент
одинаково доступен без JS, при reduced motion и в нескольких экземплярах.
Нужны компоненты базовой темы, метки, заголовков и Body Text. В Tilda CSS
встраивается в STYLE, карточка — в BODY; локальные пути не остаются в runtime.

## Обновлённые отступы

Фото → текст: 16/16/20/28px по четырём диапазонам. Для карточки одногруппников
`spacing: "spaced-portrait"` даёт 20px до 520px. Исходное соотношение фото сохраняется.

Радиус обычной карточки/медиа следует `--radius-card`: 12px до 767px,
16px от 768px. Подключать [card-spacing.css](card-spacing.css) после базового
`components.css`, включая самостоятельный экспорт компонента.
