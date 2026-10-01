# Опора в профессии и карточки с описанием

`foundation-render.mjs` возвращает цельную секцию из заголовка, шести карточек
и общего CTA с сеткой. Контент лендинга — `data/foundation.json`.
`renderFoundation(data, {id})` принимает уникальный ID, heading/accent,
listLabel, cards и cta. Все тексты экранируются. Дополнительный runtime не нужен.

Карточки используют тот же `renderIconCard` и `card_component.is-icon-statement`,
что и recognition. Наличие `description` добавляет `is-described`, семантический
H3 и абзац. Без описания statement остаётся абзацем. `--icon-card-copy-gap` —
публичный параметр отступа заголовок/описание: по умолчанию 8px ниже 768px,
12px выше. Внешняя иконка 40px, промежуток иконка/текст 20px, от 1025px — 28px.

Оба варианта карточек используют общий `--card-padding`: 12px ниже 768px,
16px от 768px. `is-described` не переопределяет padding. Заголовок 20px до 520px,
22px на 521–767px, 24px от 768px; описание 15/16/18/20px в четырёх диапазонах. Высота intrinsic,
в каждом ряду карточки растягиваются до самого высокого содержимого.
`card-grid_component.is-triple` даёт одну колонку до 767px и три от 768px.
Gap сетки и до CTA — общий `--card-grid-gap`: 12px на мобильных, 16px выше. `is-paired` у recognition
использует тот же gap, но две колонки от 768px.

Описание карточки — [Body Text](body-text.md), `body-text_component`.
Общая типографика и её адаптивы не дублируются в `icon-card.css`.

Зависимости: `components.css`, `card-spacing.css`, `icon-card.css`, `body-text.css`, `section-heading.css`,
`section-spacing.css`, `cta-responsive.css`, `button.css`, один `components.js` для CTA.
Заголовки и внешний gap — `section-layout_component.is-responsive`.
CTA использует [единый renderer, состояния и fallback](cta.md).
Без JavaScript карточки, заголовок и CTA видимы; сетка остаётся декоративной.
Focus, pointer, reduced motion и cleanup принадлежат общему CTA.

В Tilda HEAD получает встроенные CSS/ассеты, BODY — результат renderer,
FOOTER — общий JS один раз. Проектный сборщик устраняет локальные пути.

Общий источник padding и gap, включая Hero и practice-path: [card-spacing.md](card-spacing.md).
