# Первый уровень РО ДБТ — лендинг курса в записи

Адрес превью: `preview.modern-psy.ru/rodbt`. Слаг курса в CMS: `rodbt-lvl1`.
Источник контента: страница `https://modern-psy.ru/rodbt` (макета в Figma нет), тексты
перенесены дословно, неразрывные пробелы расставлены при сборке по правилам типографики.

Папка самодостаточна: `index.html`, `style.css`, `script.js` не ссылаются на `web-academy`
в runtime. Общие компоненты Академии вшиваются в файлы лендинга при сборке.

## Как править и собирать

| Что менять | Где |
| --- | --- |
| Тексты, ссылки, картинки секций | `data/*.json` |
| Тема (`.rodbt-lvl1-page`), проектные блоки | `page.css` |
| Состав и порядок секций, проектные рендереры | `build.mjs` |
| Скрипт табов программы | `page.js` |

Из `apps/preview`:

```sh
node rodbt/build.mjs          # data + page.css + shared/academy -> index.html, style.css, script.js
node rodbt/build-tilda.mjs    # index.html -> tilda/*.html (по одной секции на T123), preview.html, manifest.json
```

`index.html`, `style.css`, `script.js` и `tilda/` генерируются, руками их не правят.
`build.mjs` при сборке запрашивает курс в Public API и обновляет `data/course.json`
(запаска блока цены на случай, если API недоступен в браузере).

Тема: профиль анимаций `150ms / 400ms / 300ms`, `ease-in-out`, фон `#f5f5f5`,
поля страницы 1rem → 1.5rem (768) → 5rem (1200), как у эталона «Психолог-консультант».

## Секции и компоненты

| # | Секция источника | Компонент Академии | Данные |
| --- | --- | --- | --- |
| 01 | Первый экран, плашки «Повышение квалификации» и «В записи», шесть особенностей | `hero` (`is-dual-action`) + `benefits` | `hero.json`, `actions.json`, `assets.json` |
| 02 | Когда нужна другая стратегия | проектный блок `strategy` | `strategy.json` |
| 03 | Кому подходит этот курс | `course-audience` | `audience.json` |
| 04 | Это первый уровень РО ДБТ | проектный блок `feature-split` | `level.json` |
| 05 | Что делает курс особенным | проектный блок `highlights` | `highlights.json` |
| 06 | Ваши навыки после курса | `foundation` (шесть icon-card + CTA) | `skills.json` |
| 07 | Ваш инструктор — доктор Томас Линч | проектный блок `feature-split` | `instructor.json` |
| 08 | Как вы будете учиться | `learning-timeline` + проектная заметка `learning-note` | `learning.json` |
| 09 | Программа курса, литература | проектный блок `program-tabs` + `page.js` (лейаут «Психосоматики») | `program.json` |
| 10 | Документы после окончания обучения | проектный блок `documents` | `documents.json` |
| 11 | Почему выбирают нас | заменён на готовый `academy-showcase` (об Академии) по решению пользователя 17.09.2026 | `academy.json` |
| 12 | Стоимость курса | `pricing-promo` из CMS (`data-course="rodbt-lvl1"`) | `course.json` (запаска) |
| 13 | Форма | `lead-form` | `lead-form.json` |
| 14 | Ответы на популярные вопросы | `faq` | `faq.json` |

Готовые компоненты берутся целиком через их рендереры (`hero-render`, `course-audience-render`,
`foundation-render`, `learning-timeline-render`, `academy-showcase-render`, `lead-form-render`, `faq-render`,
`pricing-promo-render`). Их разметка и стили не меняются; лендинг владеет только данными,
темой и внешними обёртками. Два программных дополнения к generated-разметке описаны в
`build.mjs`: заметка `learning-note` внутри `learning-timeline_component` после кнопки; секция цены
оборачивает промо-блок в общую карточку `pricing-promo_card` из `pricing-promo.css` (колонка формы
`is-content-wide`, поля и скругление контейнера программы; решения пользователя 17.09.2026), поэтому
секция не `is-inset`.

## Проектные блоки (без готового аналога в каталоге)

Все собраны из базовых классов Академии: `section-spacing_component`, `section-layout_component
.is-responsive`, `section-header_component`, `section-title_component`, `card-grid_component
.is-paired / .is-triple`, `card_component`, `content-header_component`, `content-heading_component
.is-card`, `body-text_component`. Стили в `page.css` под корнем `.rodbt-lvl1-page`, токены отступов
(`--card-padding`, `--card-grid-gap`, `--radius-card`) и четыре адаптива (520 / 767 / 1024 / 1025).

- `strategy` — `ul.card-grid_component.is-triple` из карточек `card_component.strategy_card`:
  фото 537×375 (`strategy_media` с `aspect-ratio`), `content-heading is-card`, `body-text`.
  Одна колонка до 767px, три от 768px.
- `feature-split` — сетка «текст + фото»: `feature-split_copy` (заголовок слева, подзаголовок,
  выделенный абзац `is-emphasis`, абзацы `is-summary`, группы списков в белых карточках
  `feature-split_group`, сноска `is-fine-print`) и `feature-split_media` (фото `object-fit: cover`,
  высота 300 / 350 / 400px, от 1025px растягивается на высоту текста, колонки `1fr : 0.75fr`).
  Группы списков на планшете в две колонки, на desktop друг под другом.
  Списки — общий `feature-list_component` с иконкой-галочкой из CDN Тильды.
- `highlights` — `highlights_layout`: слева `highlights_list` из трёх карточек, справа тёмная
  карточка `highlights_practice` (`--color-surface-dark`) с `feature-list_component`, где у
  каждого пункта заголовок `is-emphasis` и текст. Одна колонка до 767px, две от 768px.
- `program-tabs` — программа по лейауту лендинга «Психосоматика» (`apps/preview/psihosomatika`):
  тёмный контейнер `program-tabs_component` (`--color-surface-dark`, поля `--section-inset-space`),
  слева `program-tabs_nav` с кнопками-табами (метка «Модуль N · длительность» и название),
  справа белая панель `program-tabs_panel`: `content-heading is-profile`, вводные абзацы,
  подпись «Основные темы» и список тем с точкой акцентного цвета. До 1025px колонки друг под
  другом, от 1025px сетка `2fr : 3fr`, колонка табов sticky. Табы переключает `page.js`
  (`[data-program-tabs]`, стрелки, Home/End, cleanup `window.__rodbtProgramTabsCleanup`);
  без скрипта табы скрыты и видны все модули подряд. На desktop белая панель растянута на
  высоту колонки модулей. Ниже табов белая карточка литературы с заметкой о переводе.
  Первый вариант программы (карточки `modules`) снят 17.09.2026 по решению пользователя,
  рендерер `renderModules` и стили `modules_*` оставлены в `build.mjs` и `page.css` на случай возврата.
- `documents` — `ul.card-grid_component.is-paired`: логотип выдающей организации (высота 30px),
  `content-heading is-card`, `body-text is-fine-print`, изображение документа (до 25rem, прижато
  к низу карточки).
- `learning-note` — тёмная заметка (`--color-text-primary`) с эмодзи-иконкой и текстом
  `body-text is-callout` шириной списка форматов (63rem).

## Что остаётся в Тильде

- Нативная форма с `tildaspec-formname=rodbt` (marker с исходной страницы; подтвердить на
  опубликованном DOM новой страницы) и полями `Name`, `email`, `Phone`, `messenger-type`,
  `messenger-id`. Поле `email` обязательно: компонент формы Академии отправляет почту, на
  старой странице этого поля не было.
- Шапка, подвал, cookie-баннер, SEO-настройки страницы.
- Ссылки согласия: `https://modern-psy.ru/agreement`, `https://modern-psy.ru/privacy`.

Попапов на исходной странице нет: кнопки «Купить записи» ведут якорем на блок цены
`#rodbt-lvl1-pricing` (общий `anchor-scroll`).

## Блоки T123

`tilda/` собирает `build-tilda.mjs`: два блока стилей (шрифты, CDN-стили, общий CSS + тема),
14 секций с обёрткой `academy-page rodbt-lvl1-page` и хуком `data-rodbt-lvl1-part`, два блока
скриптов (intl-tel-input, общие компоненты, цена из CMS, форма, таймлайн). У каждого T123
нулевые отступы сверху и снизу. `preview.html` имитирует страницу Тильды, `manifest.json`
хранит размеры и sha256 фрагментов. Каждый файл меньше 65 000 символов.

## Проверено локально

Ширины 375, 768, 1440: без горизонтального скролла, картинки с CDN, консоль чистая, блок
цены получает курс из API (`data-cms-state="ready"`), FAQ раскрывается, форма валидирует
поля и переключает MAX / Telegram, якоря ведут к блоку цены. Доставка заявок и нативная
форма Тильды локально не проверяются.
