# Карточка преподавателя

Самостоятельная HTML/CSS-композиция `teacher-card.js` + `teacher-card.css`.
`AcademyTeacherCard.render(record, {headingLevel = 3})` возвращает article с
медиарамкой, необязательным тегом должности, именем и описанием.
`validate(records)` проверяет данные перед рендером и обновлением секции.

Поля: `id`, `name`, `description`, `tag?`, `photo` (HTTPS или null),
intrinsic `width`/`height`, необязательный `crop` `[width%, height%, left%, top%]`.
Для автономной Tilda-сборки также поддерживается `teacher:<id>` с внешним
asset map. Без photo отображаются инициалы, без tag нет пустой плашки.
Copy экранируется; изображения non-draggable, alt образуется из имени.
Данные и назначение любого будущего видео принадлежат лендингу: декоративный
play в Figma не создаёт неработающую кнопку без реального видео.

Публичные части — `teacher-card_component`, `teacher-card_media`,
`teacher-card_image`, `teacher-card_initials`, `teacher-card_tag`,
`teacher-card_copy`, `teacher-card_name`, `teacher-card_description`.
Имя — общий `content-heading_component.is-profile`; описание —
`body-text_component.is-reading.is-profile`.

| Параметр | ≤520px | 521–767px | 768–1024px | ≥1025px |
| --- | --- | --- | --- | --- |
| Имя | 22px | 24px | 28px | 32px |
| Описание | 15px | 16px | 18px | 20px |
| Фото → текст | 12px | 12px | 16px | 20px |
| Имя → описание | 8px | 8px | 12px | 12px |
| Тег: шрифт / поля | 12 / 8px | 14 / 10px | 14 / 10px | 14 / 10px |
| Рамка фото | 24:25 | 163:170 | 24:25 | 9:10 |

Ширина задаётся контейнером; высота фото следует aspect ratio, текст растёт
естественно. Tokens: `--teacher-card-media-gap`, `--teacher-card-copy-gap`,
`--teacher-card-ratio`, `--teacher-card-tag-inset`, `--teacher-card-tag-padding`,
`--teacher-card-tag-size`; crop — существующие `--teacher-image-*`.
Одна карточка используется на всех адаптивах, включая явно подтверждённые
пользователем tablet/mobile, где в макете показан только образец.

Нет собственных событий, focus, JS lifecycle и motion: карточка статична.
Слайдер и видимость соседних карточек принадлежат [teachers](teachers.md).
Без JS карточка полностью видна. В Tilda renderer включается до teachers-template
в FOOTER, static HTML — BODY, CSS и общая типографика — STYLE.

Радиус обычной карточки/медиа следует `--radius-card`: 12px до 767px,
16px от 768px. Подключать [card-spacing.css](card-spacing.css) после базового
`components.css`, включая самостоятельный экспорт компонента.
