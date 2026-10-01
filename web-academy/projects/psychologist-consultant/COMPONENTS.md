# Компоненты лендинга

## Готовность к переиспользованию

Все секции этой страницы используют общую библиотеку. Исходники и публичные API —
[shared/academy](../../shared/academy/README.md); порядок нового подключения —
[new-landing.md](../../shared/academy/new-landing.md). Наличие renderer не означает
закрытую визуальную приёмку: оставшиеся проверки находятся в [STATE.md](STATE.md).

Проектные adapters и `build-tilda-bundle.mjs` привязаны к этому курсу; не импортировать
их для генерации другого лендинга. Тема, внешние поля/колонки, Tilda color overrides,
контент, назначения и медиа остаются проектными. Готовый ZIP — пакет этой страницы,
не источник новой реализации компонента.

## Карта секций и данных

| Секция | Shared-контракт | Данные проекта | Adapter проекта |
| --- | --- | --- | --- |
| Hero и преимущества | [hero](../../shared/academy/hero.md) | [data/hero.json](data/hero.json) | [render-hero.mjs](render-hero.mjs) |
| Узнаёте себя + CTA | [recognition](../../shared/academy/recognition.md) | [data/recognition.json](data/recognition.json) | [render-recognition.mjs](render-recognition.mjs) |
| Рейтинги | [ratings](../../shared/academy/ratings.md) | [data/ratings.json](data/ratings.json) | [render-ratings.mjs](render-ratings.mjs) |
| Путь к практике | [practice-path](../../shared/academy/practice-path.md) | [data/practice-path.json](data/practice-path.json) | [render-adaptive-sections.mjs](render-adaptive-sections.mjs) |
| Опора в профессии + CTA | [foundation](../../shared/academy/foundation.md) | [data/foundation.json](data/foundation.json) | [render-adaptive-sections.mjs](render-adaptive-sections.mjs) |
| Программа | [program](../../shared/academy/program.md) | [data/program.json](data/program.json) | [render-program.mjs](render-program.mjs) |
| Таймлайн | [learning-timeline](../../shared/academy/learning-timeline.md) | [data/learning-timeline.json](data/learning-timeline.json) | [render-learning-timeline.mjs](render-learning-timeline.mjs) |
| Бесплатные лекции | [trial-lectures](../../shared/academy/trial-lectures.md) | [data/trial-lectures.json](data/trial-lectures.json) | [render-trial-lectures.mjs](render-trial-lectures.mjs) |
| Команда | [support-team](../../shared/academy/support-team.md) | [data/support-team.json](data/support-team.json) | [render-support-team.mjs](render-support-team.mjs) |
| Преподаватели | [teachers](../../shared/academy/teachers.md) | [data/teachers-section.json](data/teachers-section.json) | [render-teachers.mjs](render-teachers.mjs) |
| Диплом | [diploma](../../shared/academy/diploma.md) | [data/diploma.json](data/diploma.json) | [render-diploma.mjs](render-diploma.mjs) |
| После выпуска | [graduation](../../shared/academy/graduation.md) | [data/graduation.json](data/graduation.json) | [render-graduation.mjs](render-graduation.mjs) |
| Отзывы | [reviews](../../shared/academy/reviews.md) | [data/reviews.json](data/reviews.json) | [render-reviews.mjs](render-reviews.mjs) |
| Тарифы | [pricing](../../shared/academy/pricing.md) | [data/pricing.json](data/pricing.json) | [render-pricing.mjs](render-pricing.mjs) |
| Условия поступления | [admission](../../shared/academy/admission.md) | [data/admission.json](data/admission.json) | [render-admission.mjs](render-admission.mjs) |
| CTA гранта | [cta](../../shared/academy/cta.md) | [data/grant-cta.json](data/grant-cta.json) | [render-adaptive-sections.mjs](render-adaptive-sections.mjs) |
| Форма | [lead-form](../../shared/academy/lead-form.md) | [data/lead-form.json](data/lead-form.json) | [render-lead-form.mjs](render-lead-form.mjs) |
| Академия | [academy-showcase](../../shared/academy/academy-showcase.md) | [data/academy-showcase.json](data/academy-showcase.json) | [render-academy-showcase.mjs](render-academy-showcase.mjs) |
| FAQ | [faq](../../shared/academy/faq.md) | [data/faq.json](data/faq.json) | [render-faq.mjs](render-faq.mjs) |

Состав преподавателей, порядок и crop — отдельный редактируемый
[teachers/data.html](teachers/data.html), общий для табов и карточек.
Интеграция формы — [data/form-contract.json](data/form-contract.json) и
[FORM-TILDA.md](FORM-TILDA.md). Действия всех секций — [data/actions.json](data/actions.json),
применяются [render-actions.mjs](render-actions.mjs) после секционных renderers.
Медиа — [data/assets.json](data/assets.json); измерения Figma и уточнения —
[data/design-source.json](data/design-source.json).

## Вложенные компоненты

- Hero включает [benefits](../../shared/academy/benefits.md), аватары,
  метки программ, stat-card, [meta-pill](../../shared/academy/meta-pill.md)
  и [общие кнопки](../../shared/academy/button.md).
- Recognition и foundation используют одну icon-card. Команда — отдельную
  [team-card](../../shared/academy/team-card.md) и meta-pill.
- Преподаватели используют [teacher-card](../../shared/academy/teacher-card.md).
  Отзывы — отдельные review card, panel и controls по [reviews.md](../../shared/academy/reviews.md).
- FAQ использует native accordion и [toggle-icon](../../shared/academy/toggle-icon.md).
  Программа остаётся статичным списком, не использует accordion.
- Текстовые роли — [section-heading](../../shared/academy/section-heading.md) и
  [Body Text](../../shared/academy/body-text.md). Шапки и layouts используют
  актуальный `is-responsive`; отступы — [spacing.md](../../shared/academy/spacing.md).
- Межсекционный ритм, поля и радиусы карточек подключаются общими CSS-модулями
  из каталога. Специальные композиции имеют собственные документированные варианты.

## Подключение и поведение

`index.html` и [build-tilda-bundle.mjs](build-tilda-bundle.mjs) задают фактический
состав и порядок зависимостей. `section-heading.css` идёт после потребляющих
стилей, общие токены карточек — после `components.css`. Не поддерживать второй
ручной список CSS внутри этой инструкции.

`components.js` подключается один раз для CTA, FAQ и `AcademySliderControls`.
Отдельные JS-модули нужны якорям, таймлайну, преподавателям, отзывам, тарифам
и форме по их контрактам. Слайдеры сохраняют все элементы на всех ширинах;
на мобильных отзывах видна одна карточка. Вертикальное колесо прокручивает страницу.
Без JS остаются тексты, native details и native video; submit формы отключён.

Внешняя сетка и пользовательские исключения — [AGENTS.md](AGENTS.md).
Не переносить числовые шкалы из старых отчётов измерений в компоненты.

## Перенос и проверка

[README.md](README.md#перенос-в-tilda) описывает полный пакет, а
[tilda/manifest.json](tilda/manifest.json) — актуальные имена, порядок и hashes.
Короткий HEAD содержит подключения; общие CSS и встроенные изображения —
STYLE T123 перед BODY; JS — FOOTER. Runtime-ссылок на репозиторий не остаётся.
Сборщик владеет всеми generated-фрагментами.

Отдельные пакеты [преподавателей](teachers/README.md) и рейтингов
(`build-ratings-bundle.mjs`) нужны для самостоятельной вставки. В полном
лендинге эти секции уже присутствуют: не добавлять их ещё раз.

Проверять затронутые сценарии по [CHECKLIST.md](CHECKLIST.md): новые данные,
адаптивные границы, состояния, no-JS, reduced motion, несколько экземпляров,
автономный Tilda-пакет. Прежние измерения в `reports/*-audit.json` — свидетельства
аудита, а не действующие дизайн-правила.
