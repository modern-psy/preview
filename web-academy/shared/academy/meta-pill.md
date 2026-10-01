# Metadata pill

`meta-pill_component` в `components.css` — существующий тег Hero, доступный
вне Hero через `meta-pill-render.mjs`. Семантическая метка, не кнопка и не ссылка.

`renderMetaPill({text, accent?, icon?}, {tag = 'span', responsive = true})`:
`tag` — span, li внутри списка или p; icon — `{src, width, height}` с пустым alt.
Текст экранируется, поддерживает Unicode NBSP и прежнее `&nbsp;` в данных Hero.
Иконка получает `meta-pill_icon`, который сохраняет размер и после Tilda span conversion.
`is-accent` меняет только цвета; `is-responsive` включает утверждённую fluid-шкалу
Hero: текст 14→16px, иконка 18→20px, поля 5→6px по вертикали,
6→9px слева и 9→12px справа на 375–991px. От 991px значения постоянны.
Это уточнение существующего тега имеет приоритет над отдельными размерами
тега в макетах команды. Legacy-теги без `is-responsive` сохраняют прежний вид.

Локальные tokens: `--meta-pill-size`, `--meta-pill-icon-size`,
`--meta-pill-padding-y`, `--meta-pill-padding-start`, `--meta-pill-padding-end`.
Цвета — общие semantic tokens темы. Hero владеет лишь размещением списка и
порядком плашек; команда — положением тега над текстовой группой.
Контент может переноситься, ширина ограничена контейнером.

Нет JS, focus, keyboard handlers, events или lifecycle. Не добавлять tabindex
и hover-кнопку. Несколько экземпляров независимы и не создают ID.
Для Tilda общий `components.css` встраивается в STYLE, разметка — в BODY.
SVG принадлежит данным потребителя и встраивается его сборщиком.
