---
name: АСП Практикум
description: "Только суб-бренд АСП Практикум (lk.modern-psy.ru/practicum-asp, GetCourse), не Академия modern-psy.ru с фиолетовой гаммой. Лес, песок, олива и мёд на компонентах Untitled UI."
colors:
  forest: "#2E5D3A"
  forest-hover: "#264E30"
  forest-press: "#1E3D26"
  forest-soft: "#EDF8EF"
  forest-mist: "#DCF0DF"
  forest-ring: "#4A8257"
  forest-night: "#0A1A0E"
  olive-signal: "#B5C952"
  olive-signal-hover: "#C7D977"
  olive-signal-press: "#85AE51"
  olive-highlight: "#61803A"
  honey: "#E6BC63"
  sand-ground: "#F0EBE3"
  sand-paper: "#F9F6F1"
  white-surface: "#FFFFFF"
  sand-sunken: "#E1DED4"
  sand-line: "#D2D2C6"
  ink: "#191C17"
  ink-secondary: "#5C5F54"
  ink-tertiary: "#6F7266"
  ink-disabled: "#A5A69A"
  error-text: "#B42318"
  error-line: "#FDA29B"
typography:
  display-2xl:
    fontFamily: "Wix Madefor Display, Wix Madefor Text, Arial, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  display-xl:
    fontFamily: "Wix Madefor Display, Wix Madefor Text, Arial, sans-serif"
    fontSize: "2rem"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  display-lg:
    fontFamily: "Wix Madefor Display, Wix Madefor Text, Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  display-md:
    fontFamily: "Wix Madefor Display, Wix Madefor Text, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  display-sm:
    fontFamily: "Wix Madefor Display, Wix Madefor Text, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  display-xs:
    fontFamily: "Wix Madefor Display, Wix Madefor Text, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.005em"
  text-xl:
    fontFamily: "Wix Madefor Text, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "-0.005em"
  text-lg:
    fontFamily: "Wix Madefor Text, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
  text-md:
    fontFamily: "Wix Madefor Text, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  text-sm:
    fontFamily: "Wix Madefor Text, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  text-xs:
    fontFamily: "Wix Madefor Text, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
  action:
    fontFamily: "Wix Madefor Text, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.005em"
rounded:
  xs: "0.25rem"
  sm: "0.375rem"
  md: "0.5rem"
  input: "0.625rem"
  button: "0.75rem"
  card: "1rem"
  block: "1.5rem"
  full: "624.9375rem"
spacing:
  xxs: "0.125rem"
  xs: "0.25rem"
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
  2xl: "1.25rem"
  3xl: "1.5rem"
  4xl: "2rem"
  5xl: "2.5rem"
  6xl: "3rem"
  7xl: "4rem"
  8xl: "5rem"
  9xl: "6rem"
  10xl: "8rem"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.white-surface}"
    typography: "{typography.action}"
    rounded: "{rounded.button}"
    padding: "0.5rem 1rem"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "{colors.forest-hover}"
    textColor: "{colors.white-surface}"
  button-primary-active:
    backgroundColor: "{colors.forest-press}"
    textColor: "{colors.white-surface}"
  button-primary-2xl:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.white-surface}"
    rounded: "{rounded.button}"
    padding: "0.5rem 1.375rem"
    height: "3.75rem"
  button-secondary:
    backgroundColor: "{colors.white-surface}"
    textColor: "#464940"
    typography: "{typography.action}"
    rounded: "{rounded.button}"
    padding: "0.5rem 1rem"
    height: "2.75rem"
  button-secondary-hover:
    backgroundColor: "{colors.sand-paper}"
    textColor: "#2C2F28"
  button-tertiary:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.button}"
    padding: "0.5rem 1rem"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.forest}"
    rounded: "{rounded.xs}"
    padding: "0"
  button-inverse:
    backgroundColor: "{colors.olive-signal}"
    textColor: "{colors.forest-night}"
    rounded: "{rounded.button}"
    padding: "0.5rem 1.125rem"
    height: "3rem"
  button-inverse-hover:
    backgroundColor: "{colors.olive-signal-hover}"
    textColor: "{colors.forest-night}"
  button-inverse-active:
    backgroundColor: "{colors.olive-signal-press}"
    textColor: "{colors.forest-night}"
  button-disabled:
    backgroundColor: "{colors.sand-sunken}"
    textColor: "{colors.ink-disabled}"
  input:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.ink}"
    typography: "{typography.text-md}"
    rounded: "{rounded.input}"
    padding: "0.625rem 0.875rem"
    height: "2.75rem"
  badge:
    textColor: "#464940"
    typography: "{typography.text-sm}"
    padding: "0.125rem 0"
  tag:
    backgroundColor: "{colors.sand-sunken}"
    textColor: "#2C2F28"
    rounded: "{rounded.full}"
    padding: "0.25rem 0.75rem"
    height: "2rem"
  tag-pressed:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.white-surface}"
  card:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "1rem"
  card-muted:
    backgroundColor: "{colors.sand-paper}"
    rounded: "{rounded.card}"
  date-tile:
    backgroundColor: "{colors.sand-sunken}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    width: "5rem"
  date-tile-today:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.white-surface}"
  inverse-block:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.white-surface}"
    rounded: "{rounded.block}"
    padding: "2.5rem 1rem"
  media-chip:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "0.5rem 0.75rem"
---

Область: этот файл описывает только суб-бренд АСП Практикум (lk.modern-psy.ru/practicum-asp, GetCourse) и не относится к Академии (modern-psy.ru), у которой фиолетовая гамма.

# Design System: АСП Практикум

## Overview

**Creative North Star: "Рабочая среда коллег"**

Практикум выглядит как спокойное место, где психологи встречаются по делу, а не как промо-витрина Академии. Тёплый песочный фон несёт почти весь макет, белые карточки лежат на нём тонким слоем, лесной зелёный отвечает за действие и за тёмные блоки. Олива выделяет слово в заголовке (олива-700 на светлом, олива-300 на тёмном) и становится кнопкой на лесе. Мёд работает в метках и предупреждениях.

Компоненты взяты из Untitled UI и перекрашены в гамму Практикума: плоские кнопки с едва заметной внутренней тенью по нижней кромке, бейджи точкой и текстом без подложки, теги песочной заливкой без обводки, плоские поля с мягкой рамкой и кольцом фокуса. Адаптив и профиль движения взяты из web-academy: три перелома ширины, кегли растут по полосам, движение короткое и тихое. Всё живёт внутри класса `.practicum-page` и изолировано от Bootstrap 3 платформы GetCourse; кит возвращает корневой кегль к 100%, потому что GetCourse ставит `html { font-size: 10px }`.

Отвергнуто осознанно: фиолетовая гамма Академии, блоб-декор и россыпь украшений, точка в конце заголовка, надзаголовки, текст заглавными, сетки одинаковых карточек «значок, заголовок, текст» как структура страницы.

**Key Characteristics:**
- Песочный фон (`--color-bg-page`), белые карточки с границей sand-200 и тенью xs.
- Лес как единственный акцент на светлом фоне; тёмные блоки тоже лесные, не серые.
- Заголовки Wix Madefor Display 500 с отрицательным трекингом, текст Wix Madefor Text 400.
- Кегли и отступы растут ступенями на 521, 768 и 1025px.
- Кнопки, поля и табы плоские, как во всех проектах Академии; тени с лесным подтоном остаются только у карточек и плашек. Кнопки не поднимаются и не увеличиваются.
- Фото в первом экране обязательно, текст в картинку не впечатывается.

## Colors

Тёплая нейтральная гамма с оливковым подтоном и одним лесным акцентом; олива выделяет слово в заголовке, мёд работает в метках.

Палитра двухслойная. Слой 1: шкалы 25–950 в духе Untitled UI (`--forest-*`, `--olive-*`, `--honey-*`, `--sand-*`) и короткая шкала `--error-*`. Слой 2: назначение (`--color-bg-*`, `--color-text-*`, `--color-border-*`, `--color-accent*`, `--color-focus-ring*`). В стилях блоков используется только слой 2; слой 1 читают лишь компоненты самого кита.

### Primary
- **Лес** (forest-600): кнопки, ссылки, активная вкладка, нажатый тег, плашка ближайшей даты, фон тёмного блока (`--color-accent`, `--color-bg-brand`, `--color-bg-inverse`). Наведение темнеет до forest-700, нажатие до forest-800.
- **Лесная дымка** (forest-50 / forest-100): кольцо фокуса поля, аватар с инициалами, вторичный текст на лесе (forest-100, 6.4:1).
- **Кольцо фокуса** (forest-500): обводка `:focus-visible` на светлом фоне, 3.8:1 к песку.

### Secondary
- **Олива-выделение** (olive-700 на светлом, olive-300 на тёмном): выделенное слово в заголовке (`--color-text-highlight`, `--color-text-highlight-on-inverse`). Олива-700 даёт 3.8:1 к песку и 4.5:1 к белому, олива-300 даёт 5:1 к лесу; только заголовки от 24px.
- **Олива-сигнал** (olive-400): основная кнопка на тёмном лесном блоке (`--color-accent-on-inverse`), текст на ней forest-950. Наведение olive-300, нажатие olive-500. Олива-300 также служит кольцом фокуса на тёмном. Выделение текста мышью: olive-200 под forest-950.

### Tertiary
- **Мёд** (honey-100 / honey-500 / honey-800): точка бейджа «Супервизия», уведомление-предупреждение, аватар `is-honey`. Для выделения в заголовках не используется.

### Neutral
- **Песок-основа** (sand-100): фон страницы (`--color-bg-page`); дублируется на `body`, потому что тело страницы живёт вне кита.
- **Белая поверхность**: карточки, поля, вторичные кнопки, плашка на фото (`--color-bg-surface`).
- **Песочная бумага** (sand-50): приглушённая карточка, прошедшая встреча, наведение (`--color-bg-surface-muted`, `--color-bg-hover`).
- **Утопленный песок** (sand-200): дорожка табов, плашка даты, отключённая кнопка, граница карточек (`--color-bg-sunken`, `--color-border-secondary`).
- **Линия** (sand-300): мягкие границы полей, вторичных кнопок, разделители аккордеона (`--color-border-primary`), 1.5:1 к белому.
- **Чернила** (sand-900): основной текст, 14.5:1 на песке.
- **Чернила второго плана** (sand-600): подписи и абзацы второго плана, 5.5:1.
- **Третичные чернила** (sand-500): 4.1:1 на песке, поэтому только от 18px или на белом (4.9:1); плейсхолдеры полей.
- **Ошибка** (error-700 для текста, error-300 для границы): только для ошибок, error-600 для текста не годится (4.1:1).

### Named Rules
**The Sand Carries Rule.** Песок и белый несут около 80% любого экрана. Лес появляется там, где нужно действие или акцентный блок, и нигде больше.

**The Forest Not Gray Rule.** Тёмный блок на этом бренде лесной (`--color-bg-inverse`), никогда не серый и никогда не фиолетовый.

**The Olive Highlight Rule.** Слово в заголовке выделяется оливой: olive-700 на светлом фоне, olive-300 на лесе. Только в заголовках от 24px. Олива-400 как заливка допустима лишь кнопкой на лесе.

**The Layer Two Rule.** В стилях блока пишем `var(--color-accent)`, а не `var(--forest-600)`. Нужного назначения нет: добавить его в токены осознанно, а не брать оттенок из шкалы.

## Typography

**Display Font:** Wix Madefor Display (с фолбэком Wix Madefor Text, Arial)
**Body Font:** Wix Madefor Text (с фолбэком Arial)

**Character:** одна семья в двух оптических размерах: Display плотнее и собраннее в крупных кеглях, Text спокойный и ровный в интерфейсе. Начертания: 400 текст, 500 заголовки и надписи кнопок, 600 только выделение в тексте, имя в персоне и заголовок уведомления. Цифры подключены как `lnum` и `pnum`; в расписании `text-tabular`.

### Hierarchy
Значения во frontmatter даны для телефона; кегли растут на трёх переломах (521 / 768 / 1025px):

| Ступень | Кегль, px | Межстрочное | Трекинг | Где |
|---|---|---|---|---|
| `display-2xl` | 36 → 44 → 56 → 64 | 1.04 | −0.035em | заголовок первого экрана, один на страницу |
| `display-xl` | 32 → 36 → 44 → 52 | 1.08 | −0.03em | заголовок секции |
| `display-lg` | 28 → 30 → 36 → 40 | 1.1 | −0.025em | тёмный блок, крупная плашка |
| `display-md` | 24 → 26 → 28 → 32 | 1.15 | −0.02em | крупная карточка |
| `display-sm` | 20 → 22 → 24 → 24 | 1.2 | −0.01em | карточка, название встречи |
| `display-xs` | 18 → 20 → 20 → 20 | 1.25 | −0.005em | плотный список, вопрос аккордеона, пустое состояние |
| `text-xl` | 18 → 18 → 20 → 22 | 1.35 | −0.005em | подводка, текст шапки секции и первого экрана |
| `text-lg` | 15 → 16 → 18 → 20 | 1.45 | 0 | основной текст, тело аккордеона |
| `text-md` | 16 | 1.5 | 0 | интерфейс, поля, кнопки |
| `text-sm` | 14 | 1.45 | 0 | подписи, бейджи, метки полей |
| `text-xs` | 12 | 1.4 | 0 | метки маленьких бейджей, счётчики |

- **Display** (500, `display-2xl`): в первом экране кегль ограничен шириной колонки, `min(var(--text-display-2xl), 11.5cqi)`, чтобы на 1025–1280px длинное слово не рвалось.
- **Body** (400, `text-lg`): абзацы держатся в 65ch (`text-measure`, тело аккордеона, описание встречи).
- **Action** (500, 16px, у `is-sm` / `is-md` 14px, у `is-2xl` 18px): надписи кнопок, вшиты в `.button_component`.

### Named Rules
**The Medium Heading Rule.** Все заголовки Display 500. Жирный в заголовках не используется; выделенное слово красится `text-highlight` (олива-700 на светлом, олива-300 на тёмном), а не утяжеляется.

**The Class-Only Size Rule.** Кегль задаётся только классами `text-size-*`; `font-size` в стилях блока не пишем. Размер, начертание и цвет: три отдельных класса.

**The Bare Heading Rule.** Заголовок стоит сам: без точки в конце, без надзаголовка над ним, без текста заглавными.

## Layout

Мобильная разметка базовая, дальше `min-width` на трёх переломах из web-academy: 32.5625rem (521px), 48rem (768px), 64.0625rem (1025px). Единственный осознанный `max-width: 32.5rem` стоит в карточке встречи, где на телефоне другая композиция, и он прокомментирован.

Каркас: `.practicum-page` → `section_<имя>` → `padding-global` → `container-large` → `<имя>_component`. Боковые поля `--page-padding: clamp(1rem, 4.7619vw, 5rem)`, минимум 16px. Контейнер 80rem (1280px). Шапка секции `section-header_component` не шире 48rem, вариант `is-center`.

Две шкалы отступов. Шкала Untitled UI с шагом 4px (`--spacing-xxs` … `--spacing-10xl`) для внутренностей компонентов. Ролевые токены растут по полосам и задают ритм страницы:

| Токен | 0–520 | 521–767 | 768–1024 | от 1025 |
|---|---|---|---|---|
| `--section-space` | 60 | 80 | 100 | 150 |
| `--section-inset-space` | 40 | 40 | 50 | 70 |
| `--space-heading-copy` | 20 | 20 | 24 | 28 |
| `--space-section-content` | 32 | 36 | 42 | 64 |
| `--card-padding` | 16 | 16 | 20 | 24 |
| `--grid-gap` | 12 | 12 | 16 | 20 |

Первый экран: на телефоне текст, затем фото; от 1025px две колонки `1fr / 1.1fr` с промежутком 48px. На телефоне главная кнопка первого экрана во всю ширину, от 521px по размеру надписи.

**The One Vertical Owner Rule.** Вертикаль между секциями задаёт только `section-spacing_component` (`padding-bottom`, у первой секции ещё `is-first` сверху). Второй gap поверх не добавляем.

**The Bands Not Queries Rule.** Отступы и кегли уже растут внутри токенов; отдельные медиазапросы под размеры в блоках не пишем.

## Elevation & Depth

Гибрид: поверхность отделяется от песка в первую очередь белым цветом и тонкой границей, тень только подкрепляет. Все тени Untitled UI перекрашены в лесной тон `rgb(10 26 14 / …)` вместо холодного синего. Глубина появляется как ответ на состояние: карточка встречи при наведении переходит с xs на md.

### Shadow Vocabulary
- **xs** (`box-shadow: 0 1px 2px rgb(10 26 14 / 0.05)`): карточки, уведомления.
- **sm** (`box-shadow: 0 1px 3px rgb(10 26 14 / 0.1), 0 1px 2px -1px rgb(10 26 14 / 0.1)`): бегунок переключателя.
- **md** (`box-shadow: 0 4px 6px -1px rgb(10 26 14 / 0.1), 0 2px 4px -2px rgb(10 26 14 / 0.06)`): карточка встречи при наведении.
- **lg** (`box-shadow: 0 12px 16px -4px rgb(10 26 14 / 0.08), 0 4px 6px -2px rgb(10 26 14 / 0.03)`): плашка с фактом поверх фото.
- **button** (`box-shadow: inset 0 -1px 0 rgb(10 26 14 / 0.14)`): залитые кнопки, едва заметная внутренняя тень по нижней кромке.
- **button-secondary** (`none`): вторичная кнопка и значок `is-modern` плоские, их держит рамка.

### Named Rules
**The Forest Shadow Rule.** Тень всегда в тоне forest-950. Чёрная, синяя или цветная светящаяся тень в кит не входит.

**The Still Button Rule.** Кнопка не поднимается, не сдвигается и не увеличивается. Наведение меняет только цвет, нажатие делает его ещё темнее. Отключённая кнопка совсем плоская.

## Shapes

Мягкие, но собранные углы, растущие с масштабом элемента: поле 10px (`--radius-input`), кнопка 12px (`--radius-button`), карточка 16px (`--radius-card`), тёмный блок и фото 24px (`--radius-block`). Теги, счётчики и дорожка переключателя полностью скруглены (`--radius-full`); у бейджа формы нет, только точка; значок `is-modern` 10px. Аватар и значок в кругах круглые.

Границы 1px: sand-200 у карточек и разделителей, sand-300 у полей, кнопок и аккордеона. Пустое состояние обведено пунктиром sand-300. Подчёркивание активной вкладки 2px лесом. Иконки: инлайн-svg 24×24, линия 2px со скруглёнными концами, `stroke="currentColor"`, размеры 16 / 20 / 24 / 32px.

## Components

### Buttons
Плоские, как во всех проектах Академии: ровная заливка и едва заметная внутренняя тень по нижней кромке, без свечения и без движения.
- **Shape:** скругление 12px (`--radius-button`), у `is-link` 4px.
- **Primary:** лес, белый текст Medium; высоты `is-sm` 36, `is-md` 40, `is-lg` 44 (по умолчанию), `is-xl` 48, `is-2xl` 60px. У `is-sm` и `is-md` невидимая зона касания добирает до 44px.
- **Hover / Focus:** наведение только внутри `@media (hover: hover) and (pointer: fine)`, цвет forest-700; фокус: обводка 2px forest-500 со смещением 2px. Замыкающая иконка `button_icon is-trailing` при наведении сдвигается на 2px, сама кнопка стоит.
- **Secondary / Tertiary / Link:** `is-secondary` белая с границей sand-300 и текстом sand-700; `is-tertiary` без фона и рамки, при наведении полупрозрачный sand-200; `is-link` без полей, лесная, подчёркивается при наведении.
- **На тёмном:** `is-inverse` оливковая с текстом forest-950; `is-inverse is-secondary` полупрозрачная белая с рамкой `rgb(255 255 255 / 0.28)`; кольцо фокуса olive-300.
- **Прочее:** надпись переносится, а не вылезает (`white-space: normal`); `is-full` во всю ширину; `is-icon-only` квадратная с обязательным `aria-label`; `is-loading` показывает вращающийся `button_spinner` (800ms) без изменения ширины. `<a>` для перехода, `<button>` для действия.

### Badges and Tags
- **Бейдж** (`badge_component`): цветная точка 6px и текст sand-700, без подложки и обводки (выбор Дарьи 22.10.2026). Точка рисуется псевдоэлементом, отдельный элемент не нужен. Цвет точки берётся из токенов `--color-marker-brand / -olive / -honey / -gray / -error` (они же красят точки пунктов в плитках «Что меняется»): `is-gray` (sand-500, по умолчанию), `is-brand` (forest-500), `is-olive` (olive-600), `is-honey` (honey-500), `is-error` (error-500). Вместо точки можно поставить иконку `badge_icon`. Размеры `is-sm` 12px, `is-md` 14px, `is-lg` 16px с точкой 8px. На лесе `is-inverse`, текст forest-100. Бейдж в карточке встречи называет формат («Лекция и практика», «Онлайн»), а не служит надзаголовком.
- **Тег** (`tag-list_component`, `tag_component`): крупнее бейджа (32px), без обводки, заливка sand-200, при наведении sand-300 (работает и на песке, и на белом; выбор Дарьи 22.10.2026). Может нести иконку `tag_icon` и счётчик `tag_count`. Как фильтр это `<button aria-pressed>`: нажатый тег лесной с белым текстом. На тёмном `is-inverse` с полупрозрачной белой заливкой.

### Cards / Containers
- **Corner Style:** 16px (`--radius-card`).
- **Background:** белый; `is-muted` песочная бумага без тени.
- **Shadow Strategy:** xs в покое (см. Elevation & Depth).
- **Border:** 1px sand-200.
- **Internal Padding:** `--card-padding`, 16 → 24px по полосам.
- Карточку в карточку не вкладываем.

### Inputs / Fields
- **Style:** `field_component` = `field_label` (14px Medium sand-700) + поле + `field_hint`. Поле `input_component` белое, рамка sand-300, радиус 10px, высота 44px, кегль 16px (меньше нельзя: iPhone увеличивает страницу), без тени. Варианты: иконка слева (`input_wrapper has-leading-icon`), приставка `input_addon` (+7), `is-textarea`, `is-select` с собственной стрелкой.
- **Focus:** рамка лесом и мягкое кольцо 4px forest-100; outline не дублируется.
- **Error / Disabled:** ошибка (`is-error` или `aria-invalid`) рамка error-300, в фокусе error-500 с кольцом error-100, подсказка error-700; отключённое поле на песочной бумаге без тени.
- **Выбор:** `choice_component` с флажком, радио и переключателем 36×20; отмеченное состояние лесом, галочка рисуется маской.

### Navigation
- **Табы** (`tabs_component`, разметка `role="tablist"`, стрелки, Home и End в `practicum-kit.js`): `is-segmented` активный сегмент белый на дорожке sand-200, без тени; `is-underline` черта 2px лесом под активной вкладкой, текст лесом. Лента вкладок прокручивается по горизонтали без полосы. Счётчик `tabs_count` у активной вкладки окрашивается в forest-50.
- **Раскрытие** (`disclosure_panel`, `accordion_component`): высота через `grid-template-rows 0fr → 1fr` за 300ms, значок поворачивается (плюс в крестик на 45°). Вопрос аккордеона Display 500 `display-xs`, ответ `text-lg` sand-600 в 65ch.

### Event Card (signature)
Главный компонент расписания, одна разметка на все ширины. `event-card_component` = плашка даты `date-tile_component` + `event-card_main` (бейджи, `event-card_title` Display `display-sm`, спикер) + `event-card_actions` + раскрывающиеся `event-card_details`. На десктопе от 768px дата слева, действия справа; до 520px плашка даты превращается в пилюлю над заголовком, кнопки во всю ширину. Ближайшая встреча: плашка `is-today` на лесе. Прошедшая: `is-past` на песочной бумаге без тени. Маркеры списка в описании: точки olive-500.

### Inverse Block
`inverse-block_component`: лесная секция с радиусом 24px и полями `--section-inset-space`; внутри заголовок с оливковым (olive-300) `text-highlight`, текст `inverse-block_text` forest-100, теги и кнопки `is-inverse`.

### Hero
`hero_component` (`hero_content`, `hero_lead`, `hero_actions`, `hero_media`): один h1, одно главное действие (в образце `is-2xl` с замыкающей стрелкой), фото в рамке `media_component` (радиус 24px, пропорции `is-4x3`, `is-4x5`, `is-16x9`) и одна белая плашка-факт `media_chip` с тенью lg.

### Прочее
`avatar_component` (24–64px, инициалы на forest-100, варианты `is-olive`, `is-honey`), `avatar-group_component`, `person_component`; `featured-icon_component` (`is-light` по умолчанию, `is-outline` с кольцами, `is-modern`); `alert_component` без цветной полосы слева, цвет несёт значок; `empty-state_component` с пунктирной рамкой; `skeleton_component` на sand-200 с бликом 1400ms; `divider_component`; `text-link` всегда подчёркнута тонкой линией forest-300.

### Motion
Профиль web-academy: 150ms на наведение, фокус и смену цвета (`--transition-site`, ease-in-out), 300ms раскрытие, 400ms ленты, 600ms появление при прокрутке (`data-reveal`, подъём на 24px, `cubic-bezier(0.22, 1, 0.36, 1)`). При `prefers-reduced-motion: reduce` все анимации и переходы обнуляются, блоки видны сразу, блик скелетона убирается. Без JS всё видно.

## Do's and Don'ts

### Do:
- **Do** заворачивать всю вёрстку в `.practicum-page` и подключать кит целиком: он возвращает корневой кегль GetCourse с 10px к 100%.
- **Do** держать песок `#F0EBE3` фоном страницы и ставить фото в первый экран.
- **Do** брать в стилях блоков только токены слоя 2 (`--color-*`) и ролевые отступы (`--section-space`, `--card-padding`, `--grid-gap`).
- **Do** писать заголовки Wix Madefor Display 500 с трекингом своей ступени и выделять слово цветом через `text-highlight`.
- **Do** ставить `:hover` только внутри `@media (hover: hover) and (pointer: fine)`.
- **Do** собирать перечни форматов и преимуществ списком или тегами.
- **Do** держать мелкий текст на sand-600 и выше; sand-500 только от 18px или на белом.

### Don't:
- **Don't** использовать фиолетовую гамму Академии и токены корневой `design-system/` на страницах Практикума.
- **Don't** ставить точку в конце заголовка.
- **Don't** ставить надзаголовки над заголовками секций.
- **Don't** писать текст заглавными (`text-transform: uppercase` и капс в разметке).
- **Don't** ставить длинное тире в текстах для посетителей.
- **Don't** строить структуру страницы сеткой одинаковых карточек «значок, заголовок, текст».
- **Don't** впечатывать текст в фотографии; факт поверх фото кладётся плашкой `media_chip`.
- **Don't** добавлять блоб-декор, свечение кнопок и россыпь украшений.
- **Don't** поднимать, сдвигать или увеличивать кнопку при наведении и нажатии.
- **Don't** писать `font-size` и hex в стилях блоков.
