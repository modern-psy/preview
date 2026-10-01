# Секция преподавателей

Полный shared-компонент: `teachers-render.mjs` (section/header/controls),
`teachers-template.js` (список имён и карточек), `teachers.css`, `teachers.js`.
Карточка — отдельный [teacher-card](teacher-card.md); стрелки и жесты —
`review-controls.css` и `AcademySliderControls`, Splide 4.1.4.

`renderTeachersSection(copy, records, {id = 'teachers', instanceId = 'academy-teachers',
configId, assetsId})` принимает project-owned heading, headingAccent, description,
tabsLabel, sliderLabel, previousLabel, nextLabel. Все ID уникальны в документе.
Конфигурация состава — отдельный script[type=application/json] с configId.

`<academy-teachers>` — автономный Light DOM Custom Element. `data-config` ссылается
на модуль данных, `data-assets` — на необязательный Tilda image map. `refresh()`
явно перечитывает данные после их правки и сохраняет выбранный ID, если он есть.
Некорректные данные сохраняют предыдущий контент. Атрибуты динамически не наблюдаются:
после изменения вызвать refresh. Нет Shadow DOM, slots или публичных custom events.

Поведение: синхронные табы/стрелки/drag/горизонтальные свайпы, Home/End и стрелки
по ориентации списка; одна Tab-позиция и native href fallback. Состояния
aria-selected, aria-controls, tabpanel и disabled отражают выбор и реальные границы.
Вертикальное колесо сохраняет прокрутку страницы. Навигация скроллится сама,
не вызывает scrollIntoView всей страницы. Карточки видны на всех экранах.

Ниже 768px controls под intro; от 768px справа. Заголовки/intro — общая
responsive типографика; расстояние до содержимого 32/36/42/70px по четырём
диапазонам. Desktop-навигация слева intrinsic width по самому длинному имени,
с высотой фото; ниже 1025px — сверху, общий горизонтальный scroller с двумя
рядами на планшете и тремя на мобильных для >8 преподавателей.
Табы используют общий [tab_component](tab.md) из `components.css`;
`teachers_tab` — совместимое имя. Шрифт 15/16/18/20px, поля 10×12px mobile, 12×14px от 768px;
Высота плашки определяется строкой и padding, без height/min-height:
35/36/42/44px при корневом 16px. Прозрачный псевдоэлемент расширяет только
область нажатия до 44px. Navigation padding — 12/12/16/16px.

Сохранённый slider sizing: 85% до 520px, около 1.75 карточек на 521–767px,
две на 768–1024px, 1.65 на 1025–1199px, 2.7 от 1200px. Лента выходит до края
viewport; последняя карточка останавливается у границы секции. Tokens:
`--teachers-slide-gap`, `--teachers-tab-size`, `--teachers-media-height` (runtime).

Инициализация idempotent, guarded registration. Disconnect освобождает Splide,
ResizeObserver, AbortController/listeners и общий slider controller. Reconnect
восстанавливает выбор. Без JS/CDN весь список и якоря видны, стрелки скрыты.
Reduced motion сохраняет выбор без анимации; обычно скорость 400ms.

Tilda: общие CSS, project theme и photo map в HEAD/STYLE, секция в BODY,
редактируемый config в отдельном T123, Splide → AcademySliderControls →
teacher-card.js → teachers-template.js → teachers.js в FOOTER один раз.
Все пути встраивает проектный builder. Требуются проверки двух экземпляров,
refresh, reconnect, ошибочных данных, no-JS/reduced motion, всех адаптивов,
клавиатуры, hover/focus, конечной позиции и текущего автономного комплекта.

Радиус обычной карточки/медиа следует `--radius-card`: 12px до 767px,
16px от 768px. Подключать [card-spacing.css](card-spacing.css) после базового
`components.css`, включая самостоятельный экспорт компонента.

Данные известных преподавателей и спикеров — [общий каталог](teachers-catalog.md).
Он предоставляет записи для готовых карточек, не меняя составы существующих курсов.
