# Graduation

Для новых страниц использовать `renderGraduation(data, {id: 'graduation'})` из
[graduation-render.mjs](graduation-render.mjs), `graduation.css` и
[graduation-responsive.css](graduation-responsive.css). Renderer включает
`is-responsive`; старые подключения без него сохраняют прежнюю геометрию.
Зависимости: components, section-heading, section-spacing, card-spacing и тема.

Данные: `heading`, `items: string[]`, `image: {src, width, height, alt}`;
необязательный `mark: {base, detail}` — два декоративных SVG. Текст экранируется.
Все пути принадлежат лендингу. Передать уникальный `id` для второго экземпляра.
Пример — [graduation.json](../../projects/psychologist-consultant/data/graduation.json).

Новая композиция занимает 12 колонок. Ниже 768px карточки находятся под фото:
одна колонка до 520px, две с 521px, gap/padding 12px. От 768px — два столбца
поверх фото, gap 16px, padding 16×24px, максимальная ширина списка 1008px.
Высота фото по четырём диапазонам: 300/450/700/800px; отступ заголовка до фото
32/36/42/70px. Карточки растут от текста, используют общие заголовки.
Один семантический список сохраняется на всех ширинах, JS не требуется.
На touch/reduced-motion отключён декоративный blur. Проверять zoom и длинные строки.

## Совместимость и границы

`graduation.css` также обслуживает прежний вариант «Терапии травмы» без
`is-responsive`. Его правила не переносятся в новый renderer. Перед удалением
базовых стилей искать потребителей и проверять миграцию.

В текущем responsive CSS карточка наследует базовый радиус 12px на планшете;
это известное несогласованное отклонение от обычного карточного токена 16px,
а не утверждённый новый стандарт. Вопрос A2 — в
[открытом аудите эталона](../../projects/psychologist-consultant/reports/typography-audit.md).

Внешний ритм — [section-spacing.md](section-spacing.md), шапка → содержимое —
[spacing.md](spacing.md). CSS встраивается в слой стилей Tilda, разметка — BODY.
Проверить несколько экземпляров, реальные размеры изображений, обе стороны
границ, длинный текст и отсутствие пересечения текста с медиа.
