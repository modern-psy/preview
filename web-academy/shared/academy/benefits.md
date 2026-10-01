# Преимущества обучения

Общая композиция пяти карточек в [benefits.css](benefits.css), полный пример —
[hero.html](hero.html). Подключать после `components.css`; внутри Hero наследует
его адаптивные токены. Самостоятельный экземпляр использует документированные
fallback-значения и может переопределить токены на `benefits_component`.

`ul.card-grid_component.benefits_component` содержит `li.card_component.benefits_card`.
Карточка использует `card_content`, `card_heading` и `card_description`.
Варианты: `is-diploma` для обрезанной декоративной иллюстрации `benefits_diploma`,
`is-wide` для широкой desktop-карточки, `is-dark` для программ. Практика использует
`benefits_practice` и общий `card_icon.benefits_icon`.

`avatar-group_list`, `avatar-group_item`, `avatar-group_avatar` — список портретов
с alt, перекрытием 1.125rem и размером из `--hero-avatar-size` (fallback 4rem).
`program-tags_list`, `program-tags_tag`, `program-tags_more` — список направлений,
обычный информационный текст, не кнопки. `benefits_link` — доступная ссылка или
preview-кнопка, min-height 2.75rem, underline, pointer, hover и видимый focus.

Токены композиции: `--benefits-padding`, `--benefits-gap`, `--benefits-radius`,
`--benefits-height`; наследуют соответствующие `--hero-card-*`, `--hero-gap`,
`--radius-card` из [card-spacing.md](card-spacing.md). Внутренняя типографика использует общий API `card_*` и значения
`--hero-card-title-size`, `--hero-card-body-size`, `--hero-title-gap`.
При подключении общего [модуля заголовков](section-heading.md) заголовки
карточек до 520px получают 1.25rem; остальные размеры Hero остаются прежними.
Цвета берутся из темы Academy; тёмная поверхность меняет только локальные цвета.

До 767px одна колонка, 768–1024 — две и программы на всю строку, от 1025 — шесть
равных долей: карточки 2+2+2, затем 3+3. Минимальная высота не обрезает контент.
Диплом — единственная обрезаемая декорация. Дополнительные переносы текста
определяются шириной и шрифтом, без набора жёстких координат.

Контент, состав, изображения и действия принадлежат лендингу. Нет собственного JS,
событий или lifecycle. Всё видно без JS, reduced motion отключает переход ссылки.
В Tilda CSS встраивается в HEAD, HTML — BODY; общие файлы не нужны на сервере.

Padding карточек и gap списка используют [общие токены](card-spacing.md)
из `card-spacing.css`. Внутри Hero больше нет отдельной шкалы этих отступов.
Нижний резерв карточки с дипломом сохраняет место под абсолютную иллюстрацию.
