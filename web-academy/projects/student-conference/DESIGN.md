---
name: "Студенческая конференция АСП 2.0"
description: "Цельная конференционная страница с читаемым заголовком и живой фотографией"
colors:
  accent: "#644AB2"
  accent-hover: "#4C3888"
  bg-page: "#F7F7FA"
  bg-surface: "#FFFFFF"
  bg-accent-soft: "#EFEDF8"
  bg-inverse: "#35275F"
  text-heading: "#1D1535"
  text-secondary: "#4B5563"
  text-inverse: "#FFFFFF"
  text-on-inverse: "#B5A3EA"
  border-default: "#E8E7EE"
  border-strong: "#CFD1DB"
  border-accent: "#D0C4F2"
  border-focus: "#977EE2"
typography:
  display:
    fontFamily: "Wix Madefor Text, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 400
    lineHeight: 1.06
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Wix Madefor Text, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Wix Madefor Text, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 500
    lineHeight: 1.18
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Wix Madefor Text, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Wix Madefor Text, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0"
  action:
    fontFamily: "Wix Madefor Text, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.015em"
rounded:
  control: "0.75rem"
  panel: "1rem"
spacing:
  small: "0.5rem"
  medium: "1rem"
  large: "1.5rem"
  xlarge: "2rem"
  section-mobile: "4rem"
  section-tablet: "5rem"
  section-desktop: "6rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.text-inverse}"
    typography: "{typography.action}"
    rounded: "{rounded.panel}"
    padding: "1rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-light:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-heading}"
    typography: "{typography.action}"
    rounded: "{rounded.panel}"
    padding: "1rem 1.5rem"
  field:
    backgroundColor: "{colors.bg-page}"
    textColor: "{colors.text-heading}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0.875rem 1rem"
  track-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.control}"
    padding: "1rem"
  review:
    backgroundColor: "{colors.bg-page}"
    textColor: "{colors.text-heading}"
    rounded: "{rounded.panel}"
    padding: "1.5rem"
---

# Design System: Студенческая конференция АСП 2.0

## Overview

**Creative North Star: "Цельная конференционная страница"**

Антикризисная конференция АСП и Osmo — закреплённые пользователем ориентиры. Крупный читаемый набор, живые фотографии и связные цветовые секции ведут к выбору трека и регистрации. Web Academy остаётся технической основой; эта визуальная система действует только внутри студенческой конференции.

**Key Characteristics:**
- Полный H1 одной шкалы, без перекрытия фотографией.
- Обычный регистр подписей и спокойные текстовые отзывы.
- Светлые поверхности и единый тёмно-фиолетовый блок.
- Небольшое движение без скрытия основного контента.

## Colors

Палитра сочетает светлую нейтральную основу, мягкую сирень и фиолетовый акцент. Frontmatter фиксирует текущие значения корневого `design-system/tokens.css`; в коде используются одноимённые семантические CSS-переменные. При изменении источника снимок нужно обновить, а не добавлять локальную палитру.

### Primary

Акцент выделяет действие, выбранный трек и окончание H1. Мягкая сирень объединяет первый экран, бонус и регистрацию; тёмный фиолетовый собирает блок практиков и выбранный тариф. Белый и светло-сиреневый текст используются на тёмном фоне.

### Neutral

Фон страницы и белая поверхность чередуют секции. Тёмный цвет заголовков остаётся основным цветом набора, вторичный серый — цветом пояснений. Разделители и поля используют свои семантические границы; фокус обозначается акцентным контуром.

## Typography

Wix Madefor Text с запасным sans-serif используется во всех ролях. В frontmatter указана мобильная база из текущего CSS. Обычный текст ограничен примерно 65ch. Подписи не переводятся в капс.

Весь H1 сохраняет один размер и начертание: базовые 2.5rem, от 521 px — 3.5rem, от 768 px — `clamp(3rem, 5.8vw, 5.25rem)`, от 1025 px — `clamp(4rem, 5.8vw, 5.25rem)`. Поэтому диапазон составляет 40–84 px при корневом размере 16 px. Цветной фрагмент не создаёт второй типографической ступени.

Заголовки секций растут до 3rem от 768 px и до 3.5rem от 1025 px. Заголовки небольших блоков — до 1.5rem, основной текст — до 1.125rem от 768 px. Отдельные подводки и отзывы имеют локальные размеры из `styles.css`; это не новая общая шкала Академии.

## Layout

Один HTML перестраивается средствами grid и flex. Максимальная ширина контейнера — 80rem. Боковые поля: 1rem, от 521 px — 1.5rem, от 768 px — 2rem, от 1025 px — 3rem. Вертикальные отступы обычных секций соответствуют трём шагам `section-*` в frontmatter. Ниже 375 px rem-композиция пропорционально уменьшается; нижняя проверенная ширина — 340 px.

На узком экране фотография идёт после текста, программа и форма складываются в колонку. От 768 px первый экран, блок практиков, бонус и регистрация становятся многоколоночными. Меню разделов появляется от 1025 px. Это описание реализованных границ, а не изменение общих правил Web Academy.

## Elevation & Depth

Глубину создают цветовые поверхности, фотографии и разделители. Карточки и кнопки плоские. Обложка PDF — единственный заметно приподнятый объект, с существующей тенью `--shadow-overlay`. Фотография первого экрана слегка повёрнута на широком экране; только на десктопе с точным указателем она выравнивается по скроллу. Секции не используют анимацию появления.

## Shapes

Мягкие прямоугольники объединяют кнопки, отзывы и форму. Более мелкое скругление используется у полей, табов и портретов. Строки вопросов, темы программы и результаты разделены тонкими линиями. Обложка сохраняет асимметричное скругление книги и небольшой наклон.

## Components

Основная кнопка — фиолетовая, светлая кнопка используется в шаге мессенджера. Минимальная высота обеих — 3.5rem; сама кнопка не перемещается. Наведение меняет фон, клавиатурный фокус получает видимую обводку.

Поле имеет фон страницы, тонкую границу и подпись сверху. Валидация использует нативные ограничения и проверку телефона; отдельный визуальный дизайн ошибок не установлен. Форма остаётся демонстрационной.

Навигация состоит из обычных текстовых якорей. Табы программы выделяют выбранный трек заливкой; смена панели занимает 300 ms с небольшим сдвигом и изменением прозрачности. FAQ и темы используют native details/summary. Отзывы — прямые текстовые карточки без наклона, реальные и демонстрационные тексты подписаны по происхождению.

Обложка выравнивается на hover, портрет слегка увеличивается внутри своего кадра. Reduced-motion отключает локальные эффекты. Точные переходы и примеры компонентов записаны в `.impeccable/design.json`; логика доступности остаётся в исходном HTML и JavaScript.

## Do's and Don'ts

### Do:
- **Do** сохранять всю фразу H1 одинаково крупной и читаемой.
- **Do** использовать семантические цвета АСП и Wix Madefor Text.
- **Do** сохранять видимый фокус, один DOM и доступность текста без анимации.
- **Do** явно подписывать демонстрационные данные и сценарий регистрации.

### Don't:
- **Don't** возвращать капс, декоративный веер, перекрытие H1 или наклонённые отзывы.
- **Don't** превращать локальные решения конференции в общие правила Web Academy.
- **Don't** выдавать демо-форму за работающую регистрацию или оплату.
