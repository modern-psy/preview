# Заголовки и композиция секции

Общий opt-in модуль [section-heading.css](section-heading.css). Подключать после
CSS потребляющих компонентов и с учётом публичных токенов темы. Пример структуры —
[section-heading.html](section-heading.html); для новых подключений добавлять
актуальные responsive-варианты ниже. JS не нужен.

## Публичные роли

Значения в px при корневом размере 16px; CSS использует rem. Четыре диапазона —
[responsive.md](responsive.md). Отступы имеют отдельный источник: [spacing.md](spacing.md).

| API | Назначение и типографика |
| --- | --- |
| `section-title_component.is-responsive` | Заголовок секции 32/36/44/52, вес 400, line-height 1; не меняет внешний layout |
| `section-title_component` внутри responsive layout | Та же шкала через наследуемые токены; особый line-height задаёт контракт композиции |
| `section-subtitle_component` внутри responsive header | Подзаголовок 16/18/20/22, вес 400, line-height 1.2 |
| `section-header_component.is-responsive` | Заголовок и необязательная группа подзаголовков |
| `section-subtitles_component` | Один или несколько параграфов с отдельным gap между ними |
| `section-header_title` | Необязательная декоративная метка и заголовок |
| `section-layout_component.is-responsive` | Шапка и содержимое секции с общей шкалой gap |
| `content-heading_component.is-card` | Обычная карточка / вопрос FAQ: 20/22/24/24, вес 500, line-height 1.1 |
| `content-heading_component.is-profile` | Имя в крупном профиле: 22/24/28/32, вес 400, line-height 1.1 |
| `content-heading_component.is-prominent` | Крупный подчинённый заголовок; размер через `--content-prominent-size`, вес 444, tracking −0.03em; конкретная шкала в контракте карточки |
| `content-header_component` | Подчинённый заголовок и описание с `--content-heading-gap` своей роли |

`is-left`, `is-center`, `is-right` меняют выравнивание заголовка/header.
`section-title_accent` меняет только цвет inline-фрагмента. HTML-уровень следует
иерархии страницы: CTA внутри секции может иметь H3 с визуальной ролью заголовка секции.
Hero H1 сохраняет собственную шкалу по [hero.md](hero.md). Карточки преимуществ
Hero до 520px используют общий заголовочный размер 20px; от 521px — свой fluid-контракт.

## Токены и композиция

- Header получает `--section-heading-gap`, `--section-subtitles-gap`,
  `--section-heading-mark-gap` из общей [системы отступов](spacing.md).
- Layout получает `--section-layout-gap` из той же системы. Его gap не заменяет
  промежутки внутренней сетки. `is-split` раскладывает части рядом от 1025px;
  колонки задаёт `--section-layout-columns`, базовая пропорция 0.75fr/1fr.
  Специальные композиции, например форма, владеют своей внутренней сеткой.
- Заголовок принимает `--section-title-size`, `--section-title-weight`,
  `--section-title-line-height`, `--section-title-tracking`, `--section-title-wrap`.
- Подзаголовок принимает `--section-heading-description-size`,
  `--section-subtitle-line-height`, `--section-subtitle-tracking`, `--section-subtitle-color`.
- Подчинённый заголовок: `--content-heading-size`, `--content-heading-line-height`;
  крупный: `--content-prominent-size`. Особые роли, например автор отзыва,
  описываются своим shared-компонентом. Не создавать локальную шкалу для той же роли.

Ширину текстовой группы задаёт wrapper; семантику и текст — лендинг.
Не складывать parent gap с margin параграфов для одного расстояния.
Наличие или отсутствие описания не создаёт отдельный вариант padding карточки.

## Совместимость

Базовые классы без `is-responsive` сохраняют defaults для прежних потребителей.
Они не задают стандарт нового лендинга. В новых renderers использовать responsive
header/layout; не возвращать удалённые варианты `is-carousel`,
`is-expanded-portrait`, `is-compact-portrait`.
Не совмещать старые `cta_heading`, `faq_heading`, `section-intro_heading` и
другие самостоятельные typography-классы с новой ролью на одном элементе.
Оболочки секций, ID, ARIA и behavior hooks сохраняются.

## Доступность, проверка и Tilda

Тексты доступны без JS и при reduced motion; заголовок не создаёт Tab stop.
Скрытое состояние success принадлежит форме — CSS заголовков не раскрывает его.
Проверить computed font-size/weight/line-height, выравнивания, группы из двух
подзаголовков, gap до содержимого, zoom, overflow и границы адаптивов.

Встроить CSS в слой стилей Tilda после потребляющих стилей; разметку — в BODY
с уникальными ID. Размещение HEAD/STYLE определяется сборщиком и manifest.
