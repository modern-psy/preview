# Hero Academy

Цельный компонент: фотография, дата и формат, H1, подзаголовок, описание, две
кнопки, примечание, карточка часов и [преимущества](benefits.md).
[hero.html](hero.html) — полный пример с контентом «Психолога-консультанта».
Заменять данные курса и действия при повторном использовании.

## Renderer и данные

Для текущего Hero использовать `renderHeroSection(data, {assets, actions})` из
[hero-render.mjs](hero-render.mjs). Он создаёт всю секцию и вложенные компоненты;
`renderHero` создаёт внутреннюю композицию. Данные — отдельный JSON курса,
реестры assets/actions передаются явно. Пример схемы —
[hero.json](../../projects/psychologist-consultant/data/hero.json).
Project adapter обновляет только свою пару маркеров через `replaceHeroRegion`.
Не редактировать generated Hero вручную. `hero.html` — пример структуры;
текущий renderer и этот контракт определяют новое подключение.

## Подключение и структура

`components.css` → `card-spacing.css` → `hero.css` → `benefits.css` → `button.css` → тема страницы. Разметку поместить
в `.academy-page`, `.section_hero`, `.padding-global` и `.container-xlarge`.
Секция ссылается через `aria-labelledby` на уникальный ID единственного H1.

- `hero_component.is-dual-action` содержит `hero_visual` и `benefits_component`.
- `hero_visual`: `hero_media` и `stat-card_component` в порядке чтения.
- `hero_media`: `hero_image`, `meta-pill_list`, `hero_content`.
- `hero_content`: `hero_copy` и `hero_actions`.
- `hero_copy`: `hero_title` (H1 `hero_heading`, `hero_subtitle`) и `hero_description`.
- `hero_actions`: `hero_buttons` и `hero_start-note` с `hero_separator`.
- Иконки плашек получают `meta-pill_icon`; класс сохраняется при замене img на
  декоративный span в Tilda-сборщике.

Все имена — Client-First: компонентная папка отделена `_`, модификаторы — `is-*`.
Типографика, интервалы, радиусы и размеры иконок являются CSS-токенами.
`--hero-radius` потребляет общий `--radius-card`: 12px до 767px и 16px от 768px;
радиус больше не интерполируется между мобильными фреймами.
Статичная секция использует семантический Light DOM; отдельные Custom Elements,
Shadow DOM и JavaScript ей не требуются. Обычный `hero_component` с одной кнопкой
сохраняет прежний контракт в `components.css` и не подключает `hero.css`.

## Четыре адаптива

Эталон — четыре пользовательских Figma-узла и измерения в
[design-source.json](../../projects/psychologist-consultant/data/design-source.json),
поле `hero_responsive`. Они заменяют прежний адаптив этой версии Hero.

| Диапазон viewport | Компоновка |
| --- | --- |
| До 520px | Центрированный текст, вертикальные плашки (онлайн первым), кнопки одна под другой, часы под фото, преимущества в одну колонку |
| 521–767px | Та же композиция; диплом смещается вправо от текста |
| 768–1024px | Текст слева, плашки и кнопки в ряд; часы под фото; преимущества в две колонки, программы на всю строку |
| От 1025px | Часы справа поверх фото; преимущества 3 + 2 |

Карточка часов всегда выровнена влево. Фото имеет минимальную высоту 43.75rem;
текст может увеличить блок. Карточки растут при длинном тексте или увеличении
шрифта. Текст остаётся в потоке, декоративный диплом обрезается карточкой.
Колонки используют `fr`, ширины — доступное пространство и `max-width`.

## Токены и непрерывный масштаб

В `hero.css` объявлены `--hero-heading-size`, `--hero-subtitle-size`,
`--hero-description-size`,
`--hero-meta-size` (примечание),
`--hero-stat-size`, `--hero-stat-label-size`, `--hero-stat-gap`, `--hero-link-size`,
`--hero-padding`, `--hero-gap`, `--hero-radius`, `--hero-title-gap`,
`--hero-copy-gap`, `--hero-content-gap`, `--hero-card-*`, `--hero-avatar-size`,
`--hero-tag-size`, `--hero-tag-gap`.

Размеры — `rem` плюс сумма ограниченных линейных `clamp()`-участков в `vw`.
Опорные ширины viewport 420/600/991/1680 соответствуют фреймам 388/568/943/1520
с пользовательскими полями 16/16/24/80. Это измерения для интерполяции,
а не фиксированные ширины блоков. H1 проходит через 32/40/48/56, подзаголовок
18/22/24/32, описание 16/18/20/22. Учёт полей в viewport-опорах предотвращает
скачок шрифта при смене полей на границах диапазонов. Вне опор размеры ограничены.

Тема владеет `--page-padding`, `--hero-section-offset`, `--hero-section-end`,
`--hero-section-end-desktop`, `--hero-panel-min-height`, `--hero-image-position`,
`--hero-image-position-desktop`, `--hero-subtitle-color` и `--hero-note-color`.
Поля страницы и отступ от хедера задаются в проекте; геометрия компонента общая.

Кнопки используют общий [button_component](button.md). Их размерная шкала
вынесена в `button.css`; Hero владеет только раскладкой `hero_buttons`.

## Медиа, состояния и Tilda

Для КПТ и следующих лендингов с текстом слева и главным объектом фото справа
использовать `image.composition: "subject-right"` в данных Hero. Общий вариант
`hero_image.is-subject-right` сохраняет главный объект при сужении кадра:
85% center до 520px, 92% center на 521–767px, right center на 768–1024px,
right center от 1025px. Когда фото помещается целиком, исходная композиция сохраняется. Это отправная точка, а не универсальная
координата лица: кадрирование каждого фото проверять визуально.
По необходимости задавать проектные `--hero-subject-position-portrait`,
`--hero-subject-position-landscape`, `--hero-subject-position-tablet` и
`--hero-subject-position-desktop`. Не возвращать принудительный `center` на
планшете, скрывающий человека за краем. Уточнение пользователя от 2026-09-15.
Прежние потребители без `image.composition` сохраняют своё кадрирование.

Изображения — существующие URL сайта, зафиксированные в проектном asset registry.
`width`/`height` у img описывают исходный файл и его пропорции; визуальный размер
задаётся CSS. Hero-фото декоративное: пустой alt, `fetchpriority="high"`,
`draggable="false"`, без lazy loading. Портреты имеют осмысленный alt.

Переход — `<a href>`, локальное действие — `<button type="button">`.
`data-action` связывается с проектными назначениями. Preview-кнопки без назначения
имеют `aria-disabled="true"`, сохраняют Tab/focus и pointer, не выполняют действие.
Для ссылки, которой управляет popup Tilda, action registry задаёт
`tilda_managed: true`; renderer добавляет `data-tilda-popup-link`, поэтому общий
anchor-scroll не перехватывает её.
Hover не сдвигает кнопки; переходы используют токены страницы и отключаются при
reduced motion. JS/lifecycle/cleanup у Hero отсутствуют.

Сборщик встраивает общий CSS в HEAD, разметку в BODY. Никаких repository-local
ссылок в production. Цвета CTA защищены от Tilda только внутри page scope.
HEAD и BODY переносить одной сборкой. [Независимый стенд](tests/landing-components-fixture.html)
использует общий HTML/CSS, без проектных стилей.

Проверять 375/420/520/521/600/767/768/991/1024/1025/1440/1680, промежуточный
масштаб текста, focus/hover/Tab, изображения, отсутствие пересечений и overflow,
no-JS и Tilda-превью. Автоматическая геометрия не заменяет визуальную проверку.

Карточки преимуществ и часов используют общий `--card-padding`; список
преимуществ — `--card-grid-gap`. Контракт — [card-spacing.md](card-spacing.md).

Теги используют общий [meta-pill](meta-pill.md), `renderHeroPill` делегирует
разметку в `renderMetaPill`. Fluid-размеры тегов теперь находятся в
`components.css` под `is-responsive`; Hero управляет только размещением.

Примечание `note` принимает прежний массив строк либо `{text, icon?}`.
`icon` — ссылка `{asset, alt: ''}` в переданном asset registry.
Второй вариант создаёт `hero_start-note.is-with-icon`: одна текстовая группа
с декоративной иконкой 22×22, обычным весом и gap 8px. Старый массив и его
разделители сохраняются без изменений. Цвет примечания задаёт тема.
