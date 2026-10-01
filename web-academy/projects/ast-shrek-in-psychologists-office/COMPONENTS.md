# Компоненты лендинга

## Общие контракты Academy

- `.academy-page`, `.padding-global`, `.container-xlarge` — основа страницы;
- `.column-grid_component`, `.column-grid_content.is-content-wide` — контент
  шириной 10 из 12 колонок от 992px;
- `.column-grid_content.is-content-medium` — контент шириной 8 из 12 колонок
  от 992px;
- `.column-grid_content.is-content-narrow` — контент шириной 6 из 12 колонок
  от 992px;
- `.section_hero`, `.hero_*`, `.meta-pill_*` — hero-контракт;
- `.section-intro_*` — центрированный секционный заголовок;
- `.media-card-list_*` и `.card_*` — список карточек с поддерживающим медиа;
- `.button.is-light` и `.is-full-width` — нативные CTA-ссылки.

CSS продублирован в проекте намеренно: Tilda-версия должна оставаться
самодостаточной и не зависеть от `shared/academy/` во время выполнения.

## Project-owned композиция

`.method-intro_*` объединяет фоновое изображение, нижний градиент и статичную
полупрозрачную карточку. Компонент не требует JavaScript; текст и CTA сохраняют
семантику без CSS. Изображение декоративное, а вся смысловая информация находится
в HTML.

Секция аудитории использует общий `.media-card-list_component`: семантический
список карточек располагается перед поддерживающим изображением в DOM, на
desktop образует две равные колонки, а ниже 768px возвращается к одной колонке.

`.webinar-timeline_*` переиспользует card API и scroll-progress алгоритм
«Мастерской контента». JavaScript меняет только длину линии через CSS custom
property; карточки и номера не анимируются и всегда остаются видимыми. CTA
расположена по центру на расстоянии `2rem` от списка и ведёт к `#registration`.

Секция результатов повторно использует `media-card-list` и `statement-card_*`.
`.speaker_*` перенесён из «А что, если стать психологом» вместе с декоративной
пульсацией `REC`; при reduced motion пульсация отключается.

`.academy-showcase_*` — self-contained перенос информационной композиции
«Терапии травмы» по Figma node `385:1847`. `.faq_*` и `.accordion_*` сохраняют
нативную семантику `<details>/<summary>`, single-open поведение и Web Animations
переходы исходного компонента; без JavaScript ответы остаются доступны нативно.

`[data-form-handoff]` — невидимый source-marker места будущей формы. Он находится
между `.section_speaker` и `.section_academy-showcase`; обязательный контракт
для следующего агента описан в `tilda/AGENTS.md`.
