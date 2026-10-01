# Diploma

Полная статичная секция: `renderDiploma(data, {id: 'diploma'})` из
[diploma-render.mjs](diploma-render.mjs), стили [diploma.css](diploma.css).
Зависимости: components, section-spacing, section-heading, body-text и тема Academy.
Никакого JavaScript в браузере. Уникальный `id` обязателен для второго экземпляра.

Обязательные данные: `heading`, `description`, `image: {src, width, height, alt}`.
`width/height` описывают исходный файл; `alt` описывает документ. Допустимы HTTPS
и проектные `assets/`, которые сборщик должен встроить или заменить CDN URL.
Дополнительные вставки: `requirements: {heading, icon, items: string[]}`,
`note: string`, `license: string[]`. Их можно опускать: пустые wrappers не создаются.
Текст экранируется, raw HTML не поддерживается. Пример данных —
[диплом курса](../../projects/psychologist-consultant/data/diploma.json).

Сетка: одна колонка ниже 1025px, две равные от 1025px; контейнер на все 12 колонок.
Минимальная высота медиа: 300/350/400px по диапазонам ≤520 / 521–767 / ≥768.
Размер текста следует общим компонентам. Изображение можно заменить без правки
разметки; `--diploma-image-fit` и `--diploma-image-position` управляют кадрированием.
Проверять длинный текст, отсутствие каждой вставки, метаданные изображения и Tilda.

Обычная текстовая шапка использует `section-header_component.is-responsive`: отступ
заголовок → подзаголовок 20/20/24/28px из [spacing.md](spacing.md), без
компактного portrait-исключения.
