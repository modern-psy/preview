# Узнаёте себя — цельная секция

`renderRecognition(data, {id, columns: 2 | 3, width: 'wide' | 'full'})`
поддерживает две или три колонки через готовые общие grid variants.
Defaults — 2 / wide, существующие потребители сохраняют разметку и адаптив.
`width: 'full'` занимает все внешние колонки. Первый consumer варианта 3/full —
КПТ Оксфорд, Figma 23:1719. Карточки с описаниями используют существующий
icon-card API; CTA и маркер секции остаются частью цельной композиции.

Разметка всей секции — [recognition-render.mjs](recognition-render.mjs), композиция —
[recognition.css](recognition.css). Карточка `card_component.is-icon-statement`
и сетка `card-grid_component.is-paired` — самостоятельные общие HTML/CSS-компоненты
из [icon-card.css](icon-card.css), пригодные для других секций и лендингов.
CTA использует общий компонент с вариантом `is-described is-responsive`,
[cta-responsive.css](cta-responsive.css) и общую [сетку](cta-grid.html).

`renderRecognition(data, {id: 'audience'})` принимает heading, mark (иконка),
listLabel, cards (icon/text), cta (heading/description — массивы строк, button,
action, gridSource). Контент эталона —
[recognition.json](../../projects/psychologist-consultant/data/recognition.json).
Для второго экземпляра передать другой `id`; назначения действий подключает
лендинг через его существующий `data/actions.json`. Не добавлять runtime-render.

| Значение, px | ≤520 | 521–767 | 768–1024 | ≥1025 |
| --- | --- | --- | --- | --- |
| Метка / gap до заголовка | 50 / 12 | 50 / 12 | 60 / 16 | 60 / 16 |
| H2 / line-height | 32 / 1 | 36 / 1 | 44 / 1 | 52 / 1 |
| Заголовок → контент | 32 | 36 | 42 | 70 |
| Колонки карточек | 1 | 1 | 2 | 2 |
| Gap карточек и gap до CTA | 12 | 12 | 16 | 16 |
| Padding карточки | 12 | 12 | 16 | 16 |
| Иконка / плашка | 20 / 40 | 20 / 40 | 20 / 40 | 20 / 40 |
| Иконка → текст | 20 | 20 | 20 | 28 |
| Текст карточки / line-height | 20 / 1.1 | 22 / 1.1 | 24 / 1.1 | 24 / 1.1 |
| Padding CTA, вертикаль / бока | 20 / 16 | 24 / 20 | 36 / 36 | 48 / 40 |
| CTA H3 / описание | 32 / 16 | 36 / 18 | 44 / 20 | 52 / 22 |
| H3 → описание → кнопка | 16 / 24 | 16 / 24 | 20 / 32 | 28 / 36 |

Карточки — белые, общий radius 12px до 767px / 16px от 768px, без фиксированной высоты; две карточки строки
растягиваются до высоты большей. Плашка иконки — radius 12px, исходная акцентная
граница 0.25px. Общие `--card-padding` и `--card-grid-gap` из
`card-spacing.css` задают padding, gap карточек и промежуток до CTA: 12px ниже
768px, 16px от 768px. Вариант с описанием использует те же значения.
Кнопка следует актуальному [общему компоненту](button.md); на мобильных
занимает полную ширину контента. H3 line-height 1.1, описание 1.2;
tracking заголовков −0.06em.
Явные переносы H3 и desktop-подписи соответствуют Figma; длинный текст может
переноситься дополнительно. Геометрия колонок — fluid, 10/12 от 1200px в эталоне.

Заголовки остаются общими `section-title_component`/`section-subtitle_component`.
Компоненты задают их семантические tokens, не копируют типографику в тему лендинга.
Обновлённые мобильные макеты от 2026-09-11 задают именно gap карточек 12px;
внутренний отступ между иконкой и текстом остаётся 20px.

Подключать `components.css`, `card-spacing.css`, `icon-card.css`, `recognition.css`,
`cta-responsive.css`, `button.css`, `section-spacing.css`, затем `section-heading.css`.
Весь контент присутствует в HTML без JS. Общий `components.js` улучшает CTA:
pointer/touch, reduced motion, несколько экземпляров и cleanup — по [cta.md](cta.md).
Карточки информационные, не имеют Tab stop. CTA — нативная кнопка, видимый
focus и hover без движения; preview сохраняет pointer и `aria-disabled`.

Для Tilda сборщик встраивает все перечисленные CSS и общий JS; SVG переносит
в HEAD один раз. Generated область `recognition:start/end` принадлежит renderer.
Самостоятельный потребитель должен включить свою тему, данные и назначения;
ссылок на репозиторий в конечном HTML не оставлять.

Общий источник padding и gap, включая Hero и practice-path: [card-spacing.md](card-spacing.md).
