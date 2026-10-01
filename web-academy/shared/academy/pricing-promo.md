# Промо-блок «Цена обучения» (pricing-promo)

Самоопределяющийся блок цены курса: одна функция строит разметку и при
сборке (запаска), и в браузере из ответа Public API, а раскладку выбирает по
данным CMS. Файлы: [pricing-promo-render.js](pricing-promo-render.js)
(`PricingPromo.fromApi`, `PricingPromo.render`, без зависимостей, Node и
браузер), [pricing-promo.css](pricing-promo.css), [pricing-promo.js](pricing-promo.js)
(запрос к API и перерисовка), [pricing-promo-tilda.mjs](pricing-promo-tilda.mjs)
(сборка одного блока T123). Табы потоков это общий [pricing.js](pricing.js)
без изменений. Первый потребитель: витрина `apps/preview/pricing-variants/`,
готовые блоки для Тильды в `apps/tilda/pricing-block/`. Правила цен: ТЗ
`docs/tilda-pricing-block.md`.

Подключать после `components.css` (нужны токены `.academy-page`, meta-pill,
`padding-global`), вместе с `card-spacing.css`, `section-spacing.css`,
`body-text.css`, `section-heading.css`, перед темой. Тема лендинга обязана
задать профиль анимаций (`--motion-duration` и остальные в `ms`).

## Владение

Компонент владеет всей композицией: заголовком блока, меткой даты старта,
названием и описанием курса, табами потоков, ячейками цен, строками потоков
и тарифов, режимом листа ожидания, адаптивами и состояниями загрузки.
Лендинг владеет внешней секцией (`section_pricing.section-spacing_component` без `is-inset`),
слагом курса и адресом API. Внешняя оболочка общая (решение пользователя 17.09.2026): колонка
формы заявки `column-grid_content.is-content-wide` и тёмная карточка `pricing-promo_card` из
`pricing-promo.css` с полями `--section-inset-space` / 0.75 → 1.5 → 2.5rem и скруглением
`--radius-card`, как у контейнера программы курса.
Тексты и цены живут в CMS, руками в разметке не правятся.

## Режимы (выбираются в `render` по данным)

| Данные курса | `data-mode` | Что справа |
| --- | --- | --- |
| открытых потоков нет, есть «Лист ожидания» | `waitlist` | H2 «Запишитесь в лист ожидания», без дат и потоков, строка «Забронировать место» с `bookingPrice` или «Цена откроется позже» |
| один поток без тарифов | `single` | одна цена на подсвеченном фоне |
| два потока без тарифов | `streams` | строки потоков: название, старт, цена; без табов |
| тарифы в потоке | `plans` | строки тарифов в порядке CMS, рекомендуемый (самый дорогой по цене продажи) с фоном; табы потоков при двух и более потоках |
| три и более потока без тарифов | `tabs-single` | табы потоков, одна цена на выбранный поток |

Открытые потоки (`Идет набор`, `Последний шанс`, `Старт в любое время`)
отменяют лист ожидания. Если открытых нет и листа ожидания нет, берётся
`nearestStream`. Слева всегда: H2 «Стоимость обучения» над обеими колонками,
метка `meta-pill` со стартом (кроме `waitlist` и `streams`), название курса
(`title`) и описание для каталога (`description`, пустое не выводится).

Ячейка цены по ТЗ: крупно цена продажи (`fullPaymentPrice`, иначе
`currentPrice`/`price`), зачёркнутая только при акции (`*BeforeDiscount`),
строка «или … ₽/мес в рассрочку (N мес.)» при `installmentPerMonth`, одна
строка «Цена с {дата} — {цена}» из `nextPriceChange` (дата в московском
времени). Ноль это «Бесплатно», нет цены это «Стоимость уточняется».
Описание тарифа берётся из `tariffs[].description` (поле CMS с 17.09.2026).

## Public API

- `PricingPromo.fromApi(course, {id})` превращает ответ `/api/public/course/:slug`
  в конфиг `{id, course, promo, streams[{id, label, startDate, pricing}], waitlist}`.
- `PricingPromo.render(config)` возвращает HTML: `<academy-pricing class="pricing-promo_component is-tabbed">`
  при табах, иначе `<div class="pricing-promo_component">`; `data-mode` на корне.
- Корень блока на странице: `[data-price-block][data-course][data-api][data-block-id]`,
  внутри запаска. `pricing-promo.js` при загрузке ставит `data-cms-state="loading|ready|error"`,
  по ответу заменяет содержимое корня новой разметкой; при ошибке остаётся запаска.
  Один запрос на слаг для всех блоков страницы, таймаут 8 с, повторный запуск идемпотентен.
- `render.clockIcon` это CDN-ссылка иконки часов метки; переопределяется до вызова.
- Tilda: `buildPricingPromoBlock({slug, course, api})` из `pricing-promo-tilda.mjs`
  собирает один файл T123 (комментарий-паспорт, `<style>`, разметка, `<script>`).
  Обёртка `.academy-page.pricing-block_wrapper`, правило `body:has(.academy-page)`
  и `min-height: 100vh` из базы вырезаны, сброс отступов тегов со специфичностью
  выше `.t123 p`.

## Визуальные и адаптивные правила

- Токены: `--pricing-promo-text`, `--pricing-promo-muted`, `--pricing-promo-faint`,
  `--pricing-promo-line`, `--pricing-promo-featured-surface`, `--pricing-promo-tabs-surface`,
  `--pricing-promo-tab-active`, размеры суммы `--pricing-promo-number-size`
  (40/44/44/48px), в строках `--pricing-promo-row-number-size` (28/32/32/36px).
- До 767px одна колонка: табы, заголовок, метка, курс, описание, цены. От 768px
  сам компонент становится сеткой `1fr 1.2fr`: заголовок на обе колонки, табы
  в правой колонке над строками, панель через subgrid, левая колонка выровнена
  по верху с первой строкой цен. Колонки: 2.5rem на планшете, 4rem на desktop.
- Строка тарифа/потока: от 521px две колонки `1fr 1fr`, цена справа. Фон
  рекомендуемой строки выходит наружу на величину полей (0.75rem до 767px,
  1.25rem выше), текст всех строк остаётся на одной вертикали.
- Название курса `content-heading_component.is-profile` (22/24/28/32px),
  описание `body-text_component.is-regular.is-reading` (15/16/18/20px),
  переводы строк из CMS сохраняются (`white-space: pre-line`).
- Табы меняют только цвета; fade значений по `--motion-duration`; при
  `prefers-reduced-motion` переходы отключены. Пока идёт запрос, колонка цен
  полупрозрачная, высота не прыгает.

## Доступность и проверка

WAI-ARIA Tabs от `pricing.js`: Left/Right, Home/End, `aria-selected`,
`hidden` у значений неактивного потока, `academy-pricing:change`. Без JS видна
запаска целиком, табы скрыты. Метка даты это `<time datetime>`.

Проверка: `node --test shared/academy/tests/pricing-promo.test.mjs` (все пять
режимов, рекомендуемый тариф, лист ожидания, форматирование), витрина
`apps/preview/pricing-variants/` на живом API, `apps/tilda/pricing-block/preview-<slug>.html`
и `preview-<slug>-offline.html`. Ширины 375, 520, 521, 767, 768, 1024, 1025, 1440.
