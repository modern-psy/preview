# Команда поддержки

Цельная статичная секция `support-team-render.mjs` + `support-team.css`,
составленная из [team-card](team-card.md), [meta-pill](meta-pill.md) и общих
заголовков/Body Text. Эталон — «Психолог-консультант», Figma 118:790,
309:1482, 309:1484, 309:1486. Измерения и исключения — JSON лендинга.

`renderSupportTeam(data, {id = 'support-team'})` создаёт section/H2, intro,
список specialists и список community. Данные: heading, headingAccent,
description, specialistsLabel, communityLabel и два непустых массива карточек.
Один featured specialist; порядок данных — куратор, супервизор, преподаватель.
Каждый экземпляр получает уникальный id от потребителя; H2 ID производный.
Массивы содержат готовые данные карточек, без project imports в библиотеке.

| Диапазон | Специалисты | Сообщество | Между группами / колонками |
| --- | --- | --- | --- |
| ≤520px | одна колонка, featured первым | одна колонка | 28 / — px |
| 521–767px | две колонки, featured третьим по центру, ширина одной колонки | две колонки | 24 / 12px |
| 768–1024px | три колонки, featured в середине | две колонки на всю ширину | 32 / 16px |
| ≥1025px | три колонки, featured в середине | две колонки в 67.1941% ширины | 48 / 32px (сообщество 28px) |

Текстовая группа — `section-header_component.is-responsive.is-center`;
секция — `section-layout_component.is-responsive`:
32/36/42/70px до карточек. Внешнюю ширину 10/12 от 1200px, поля и тему
определяет лендинг. Фотографии сохраняют natural ratio по прямому прежнему
уточнению пользователя; фиксированные media heights Figma не применяются.

Публичные классы: `support-team_component`, `support-team_grid` с `is-community`,
`support-team_title`, `support-team_intro`. Сетка управляет только расположением
карточек через их публичный `is-featured`. Tokens — `--support-team-column-gap`,
`--support-team-row-gap`, `--support-team-group-gap`.

Семантика: section с H2, два подписанных ul, карточки li с H3. Это не
последовательность шагов: CSS переставляет независимые статичные роли; DOM
сохраняет один логичный порядок без дублирования контента и без focus-переходов.
Нет runtime JS, событий, состояний или lifecycle; no-JS/reduced-motion одинаковы.

Для Tilda встроить components.css, team-card.css, support-team.css, Body Text,
section-heading.css и section-spacing.css в STYLE; generated HTML — в BODY.
Проверять узкий контейнер, все четыре диапазона и границы 520/521, 767/768,
1024/1025, внешнюю границу 1199/1200, несколько экземпляров и карточку вне секции.
Проверять tag icon после SVG/span conversion и регрессию тегов Hero.

Радиус обычной карточки/медиа следует `--radius-card`: 12px до 767px,
16px от 768px. Подключать [card-spacing.css](card-spacing.css) после базового
`components.css`, включая самостоятельный экспорт компонента.
