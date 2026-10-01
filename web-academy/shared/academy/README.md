# Academy — каталог компонентов

Единый перечень доступных общих компонентов. Контракты по ссылкам описывают
публичный API, зависимости, адаптивы, состояния и перенос в Tilda.

Начало работы: [новый лендинг](new-landing.md). Обязательные правила:
[архитектура компонентов](../../rules/engineering/components.md) и
[полное переиспользование компонентов](reuse-rules.md).
Эталон интеграции: [Психолог-консультант](../../projects/psychologist-consultant/COMPONENTS.md).

## Источники общих правил

| Решение | Единственный контракт |
| --- | --- |
| Полный перенос компонентов, анимации и защита от ошибок интеграции | [reuse-rules.md](reuse-rules.md), [motion-contract.mjs](motion-contract.mjs) |
| Диапазоны CSS и JS, проверка сборки | [responsive.md](responsive.md), [responsive.json](responsive.json) |
| Отступы между текстовыми группами, содержимым и кнопками | [spacing.md](spacing.md) |
| Заголовки, подзаголовки и композиция | [section-heading.md](section-heading.md) |
| Размеры, веса и line-height основного текста | [body-text.md](body-text.md) |
| Поля, промежутки и радиусы карточек | [card-spacing.md](card-spacing.md) |
| Внешние поля секций | [section-spacing.md](section-spacing.md) |
| Геометрия основных кнопок | [button.md](button.md) |

Не копировать числовые шкалы в инструкции каждого лендинга. Новый контент,
цвет или название секции не создаёт новую роль. Расхождения Figma с утверждённой
ролью сообщать пользователю по [правилу проверки дизайна](spacing.md#проверка-дизайна).

## Canonical component inventory

| Component | Root/API | JavaScript | No-JS contract | Consumer owns |
| --- | --- | --- | --- | --- |
| Адаптивы | [responsive.json](responsive.json), [контракт](responsive.md); планшет до 1024px, desktop от 1025px | только проверка локальной сборки `responsive.mjs` | native CSS media queries | контент, дополнительные внешние колонки |
| Радиусы и отступы карточек | `--radius-card`, `--card-padding`, `--card-grid-gap`; [card-spacing.md](card-spacing.md) | none | CSS tokens: radius 12px mobile / 16px tablet+ | согласованные варианты |
| Anchor navigation | `data-academy-anchor-scroll`; [contract](anchor-scroll.md) | `anchor-scroll.js`, opt-in `anchor-scroll.css` | native fragment links and target offset | unique IDs, destinations, header offset |
| Page foundation | `.academy-page`, `.main-wrapper`, `.padding-global`, `.container-xlarge` | none | full layout and content | page theme tokens and section order |
| Кому подойдёт курс | `course-audience-render.mjs`, `course-audience_*`; [contract](course-audience.md) | none | cards and photograph remain visible | heading, 1–6 cards, optional image, outer grid |
| 12-column layout | `.column-grid_component`, `.column-grid_content` | none | fluid single-column fallback | selected width variant |
| Преимущества | `benefits_*`, `avatar-group_*`, `program-tags_*`; [контракт](benefits.md) | none | shared `benefits.css`, cards and fluid Hero tokens | состав, copy, медиа и действия |
| Команда поддержки | `support-team_*`; [guide](support-team.md), renderer и opt-in CSS | none | обе группы карточек видны | copy, media, ID, внешние колонки |
| Карточка команды | `team-card_*`; [guide](team-card.md), renderer и opt-in CSS | none | текст и фото, необязательный тег | copy, media, heading level |
| Плашка таба | `tab_component`, совместимый `teachers_tab`; [tab.md](tab.md), components.css | none | intrinsic размер и native действие | подпись, состояние и навигация родителя |
| Тег | `meta-pill_*`; [guide](meta-pill.md), renderer и components.css | none | семантическая метка | text, icon, accent |
| Hero | `.section_hero`, `.hero_*`, `.meta-pill_*`, `.stat-card_*`; [template and guide](hero.md) | none | complete primary content; optional `hero.css` for `is-dual-action` | copy, image, metadata and CTA |
| Button | `button_component`; [contract](button.md), `button.css` | none | native link/button behavior | destination, placement, color variant |
| Card and card grid | `.card_component`, `.card-grid_component` and documented variants | none | semantic article/list remains readable | copy, icon and parent placement |
| Price panel | `.price-panel_*`, `.price-list_*` | none | native `dl` remains complete | price facts and current item |
| Course pricing | `academy-pricing.pricing_component`, opt-in `pricing.css` + [whole component contract](pricing.md) | `pricing.js`: optional cohort tabs, responsive plan order | all cohort prices visible, featured first, tabs hidden | 1–3 plans, 1–2 cohorts, dates/prices/copy/icons/actions in project JSON |
| Промо-блок цены из CMS | `pricing-promo_component`, `[data-price-block]`; [contract](pricing-promo.md), `pricing-promo-render.js` (Node и браузер), `pricing-promo.css`, `pricing-promo-tilda.mjs` | `pricing-promo.js` + `pricing.js` (табы потоков); раскладка выбирается по данным Public API: одна цена, строки потоков, строки тарифов, табы, лист ожидания | запаска из снимка API остаётся целиком, табы скрыты | слаг курса, адрес API, внешняя секция и ширина; тексты и цены в CMS |
| Преподаватели | `teachers-render.mjs`, `academy-teachers`; [guide](teachers.md), [каталог людей](teachers-catalog.md) | opt-in CSS/JS, Splide 4.1.4, AcademySliderControls | все карточки и якоря без JS | copy, editable roster, IDs, theme |
| Карточка преподавателя | `teacher-card.js`, `teacher-card.css`; [guide](teacher-card.md) | none | фото/инициалы, имя, описание, необязательный тег | record, media, heading level |
| Unified headings and section layout | `.section-title_component`, `.section-subtitle_component`, `.section-header_component`, `.section-layout_component`, `.content-heading_component`, `.content-header_component`; opt-in [section-heading.css](section-heading.md) | none | semantic heading/text groups remain complete | copy, IDs, alignment, surface colors and wrapper widths |
| Body Text | `body-text_component`, `body-text_lead`; [contract](body-text.md) | none | semantic text is always present | text, color and statement variant |
| Course program | `program-render.mjs`, `program_component`, `card_component.is-stage`; [contract](program.md) | shared anchor scrolling only | six static stages in the reference, no disclosure | headings, subtitles, stage copy, mark assets and action |
| Practice path | `practice-path-render.mjs`, `practice-path_*`; [contract](practice-path.md) | none | whole section is static HTML | copy, media, action and unique ID |
| Trial lectures | `trial-lectures-render.mjs`, `renderTrialLectures`, standalone `renderLecturePreview`, `trial-lectures_*`, `lecture-preview_*`; [contract](trial-lectures.md) | none | card, benefits and editable lecture previews remain HTML | text, icons, action and unique ID |
| Foundation | `foundation-render.mjs`, common icon-card, triple grid, CTA; [contract](foundation.md) | shared CTA grid | full content remains visible | copy, icons, CTA and unique ID |
| Recognition section | `recognition-render.mjs`, `recognition_component`, `card_component.is-icon-statement`, `card-grid_component.is-paired`; [contract](recognition.md) | shared CTA grid only | full section is rendered HTML | copy, icons, CTA and unique ID |
| Section spacing | `section-spacing_component`; [contract](section-spacing.md) | none | identical rhythm without JS | opt-in stylesheet |
| Compatibility: section intro/heading | `.section-intro_*`, `.section-heading_*` | none | heading order and copy unchanged | alignment, copy and section placement |
| Media card list | `.media-card-list_*` | none | list precedes supporting media | list content, image and alt |
| Accordion | `.accordion_*`, `data-accordion*` | optional enhancement | native `details/summary` | single/multiple-open policy |
| FAQ | `.faq_*` + accordion; [template and guide](faq.md) | animated open/close in `components.js` | native details remain operable | questions, answers and support link |
| Toggle icon | `toggle-icon_component`, `toggle-icon_glyph`, `is-open`; [contract](toggle-icon.md) | none; host owns state | decorative plus/cross follows native accordion state | control semantics and currentColor |
| Academy showcase | `academy-showcase-render.mjs`, opt-in `academy-showcase-responsive.css`; [whole block and guide](academy-showcase.md) | none | heading, three cards and optional teachers card remain complete | media, copy and project accent |
| CTA grid | `.cta_*`, `data-cta-grid*`; [templates and guide](cta.md) | shared grid highlights/comets | base SVG and CTA remain visible | SVG source, copy and destination |
| Responsive slider | `data-slider-component`, `data-academy-slider` and controls | Splide; current reviews/teachers on all widths | all authored cards remain readable without JS | pinned library, slide size, copy and media |
| Lead form | `.lead-form_component`, `data-academy-lead-form`, optional `lead-form.css` | `lead-form.js` + intl-tel-input 29.1.2 | visible fields/copy, submit disabled | copy, IDs, native marker, consent and project form contract |
| Admission requirements | `admission-render.mjs`, `.admission_component`, `admission.css`; [guide](admission.md) | none | heading and document list remain visible | copy, media, heading IDs and outer column width |
| Ratings | `.ratings_component`, optional `ratings.css` | none | summary, tags, logos and scores are semantic HTML | current values, copy, assets and outer column width |

| Табы с интерфейсами | `showcase-tabs-render.mjs`, `academy-showcase-tabs`; [контракт](showcase-tabs.md) | showcase-tabs.js; opt-in demo-motion.js → typewriter.js / demo-sequence.js | все панели и полный текст видны | тексты, интерфейсы через renderMedia, медиа, анимации, IDs |
| Learning timeline | `learning-timeline-render.mjs`; [contract](learning-timeline.md) | `learning-timeline.js` | steps and labels remain visible | data, marks, action, outer grid |
| Diploma | `diploma-render.mjs`, `diploma.css`; [contract](diploma.md) | none | document and conditions remain HTML | image, text, optional inserts, ID |
| Graduation | `graduation-render.mjs`, base + responsive CSS; [contract](graduation.md) | none | image and one semantic card list | image, heading, cards, mark |
| Reviews | `reviews-render.mjs`, `responsive: true`; [contract](reviews.md) | Splide, components.js, review-card.js, review-panel.js | all reviews and native video controls | unique authors, copy, media, icons, IDs |
| Истории изменений в практике | `practice-stories-render.mjs`, `academy-practice-stories`; [contract](practice-stories.md) | practice-stories.js; shared review cards | native horizontal strip, visible quotes and captions | course copy, photos, IDs and theme |
| Review card / panel / controls | `academy-review`, `academy-review-panel`, `review-control_*`, `review-toggle_*`; [contract](reviews.md) | independent state and cleanup | full text, native media | author data, video source, icons |

## Владение и подключение

- Библиотека владеет внутренней композицией, вложенными компонентами, общими
  токенами, состояниями и поведением. Лендинг владеет темой, внешними колонками,
  контентом, медиа, уникальными ID, назначениями действий и контрактом формы.
- Где существует renderer, вызывать его с данными страницы. Project adapter
  обновляет только свою область HTML. Адаптеры, пишущие один `index.html`,
  запускать последовательно. Generated HTML и Tilda-фрагменты вручную не менять.
- Основа — semantic Light DOM; статичные секции не требуют Custom Element.
  `components.js` подключать один раз: он обслуживает CTA, accordion и общее
  управление слайдерами во всех внешних `.academy-page` и освобождает ресурсы
  перед повторной инициализацией. Прочие JS-модули подключать по контракту блока.
- Общие API `card_component`, `card-grid_component`, `column-grid_*`,
  `stat-card_*`, `price-panel_*`, `price-list_*` и `media-card-list_*` остаются
  в [components.css](components.css). Для готовой секции брать её renderer и
  вложенные варианты; не собирать её заново из базовых классов.
- Файлы без `is-responsive` и прежние HTML-примеры могут сохраняться для
  совместимости существующих страниц. Это не правила для новых лендингов.
  Не удалять их CSS/JS без поиска потребителей и проверки миграции.

## Ratings component

Цельная секция и её layout contract — [ratings.md](ratings.md).
Данные, media URL и ID принадлежат лендингу; JavaScript не нужен.

## Tilda placement

Shared CSS/JS — исходники для локальной сборки, не production URL. Встраивать
их в автономный пакет по [new-landing.md](new-landing.md#сборка-и-передача).
Обозначение «CSS в HEAD» в частных контрактах означает слой стилей: при лимите
HEAD сборщик выносит его в STYLE T123 перед BODY, сохраняя порядок зависимостей.
Конкретные файлы, порядок и hashes определяет manifest выбранного лендинга.
Каждый файл, включая HEAD, должен быть меньше 65 000 символов.

Splide 4.1.4 загружается перед компонентами слайдеров; intl-tel-input 29.1.2 —
перед `lead-form.js`. Форма требует собственного [form contract](lead-form.md)
и нативного блока Tilda; локальный success не подтверждает доставку заявки.
Не оставлять в итоговом HTML ссылки на файлы репозитория.

## Проверка

Матрица ширин — [responsive.json](responsive.json); добавить границы внешней
сетки проекта. Проверить новый контент, длинные строки, zoom, focus/hover,
клавиатуру, touch, no-JS, reduced motion, несколько экземпляров, повторную
инициализацию и Tilda-пакет. Для Hero — [hero-checklist.md](hero-checklist.md).
Изменение общего кода требует проверки затронутых потребителей. Наличие
компонента в каталоге не означает завершённую визуальную приёмку проекта.
