# Кому подойдёт курс

Цельный общий HTML/CSS-компонент по прямому поручению пользователя: заголовок,
список карточек с выделенной вводной фразой и фотография. Первый потребитель —
`projects/cbt-oxford/`. Figma: `J3wFdAABIUMjR1Zwv6ruVx`, узлы
`23:1837`, `92:4113`, `92:4145`, `92:4169`.

## API и владение

`renderCourseAudience(data, {id = 'course-audience'})` из `course-audience-render.mjs`.
Данные: `heading`, `cards: [{lead, text}]`, необязательное
`image: {src, width, height, alt}`. Ожидаются 3–6 карточек; renderer допускает
1–6 для коротких списков. Строки экранируются, Unicode NBSP сохраняются как
`&nbsp;`. `text` может быть пустым. Порядок массива — порядок DOM.
У каждого экземпляра свой уникальный `id`.

По умолчанию — предоставленное пользователем общее изображение
`img-asp-for-whom.webp`, CDN и метаданные экспортируются как `courseAudienceImage`.
Оригинал сохранён в `assets/course-audience.webp` (1280×853). Copy и количество
карточек принадлежат лендингу; image можно заменить явными данными. Renderer
создаёт section/H2, ul/li/p и img. Custom Element, Shadow DOM, события,
состояния и JavaScript в браузере не требуются.

## Адаптив и тема

- Внешний контейнер — `column-grid_content.is-content-medium`: 8/12 колонок
  на desktop, полная ширина ниже. По общей сетке desktop начинается от 1025px;
  дополнительные внешние границы задаются отдельно в лендинге.
- Ниже 768px список над фото; от 768px две равные колонки.
- Карточки без фиксированной высоты: общие padding/gap 12px ниже 768px,
  16px выше; радиус — `--radius-card` из [card-spacing.md](card-spacing.md). Фото растягивается по высоте списка.
- Мобильная рамка: 300px до 520px, 350px от 521px. Это высота обрезки фото,
  не текста. На tablet/desktop высоту задаёт список; картинка использует cover.
- Заголовок, Body Text и отступы — общие компоненты: 32/36/44/52px,
  15/16/18/20px и интервалы 32/36/42/70px.
- `--course-audience-muted` задаёт вторичный текст. Default — доступный
  `--color-text-secondary`; #a8a7ad из Figma не проходит контраст обычного текста.
- Кадрирование: `--course-audience-image-position` и
  `--course-audience-image-position-landscape`.

## Подключение и проверка

CSS: components → card-spacing → body-text → course-audience → section-spacing →
section-heading; тема управляет публичными токенами. Весь контент сохраняется
без JS и при reduced motion; изображения non-draggable, lazy, с intrinsic размерами.
Карточки информационные, без Tab stop и hover-анимаций. Cleanup отсутствует.

В Tilda встроить CSS в STYLE, результат renderer — в BODY. Фото использует
постоянный CDN; локальные shared-пути в runtime запрещены.
Проверки: 375/768/1024/1440, 520/521, 767/768, 1024/1025, 3/5/6 карточек,
длинный текст и 200%, два экземпляра, overflow и автономный preview.
Стенд — `tests/course-audience-fixture.html`; генератор и тесты расположены рядом.
