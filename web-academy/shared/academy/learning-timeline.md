# Learning timeline

Цельная композиция форматов обучения: `renderLearningTimeline(data, {id})`
из `learning-timeline-render.mjs`, стили `learning-timeline.css`, поведение
`learning-timeline.js`. Первый consumer — «Психолог-консультант».

Данные лендинга: `heading.text/accent`, `listLabel`, непустой `steps` с
`label/heading/description` и опциональным `expert`, `expertIcon` — локальный SVG,
`action.label/href` — существующий якорь либо alias popup Tilda. Для popup
задаётся `action.tildaManaged: true`: renderer добавляет
`data-tilda-popup-link`, и общий anchor-scroll оставляет событие Tilda. У каждой
композиции уникальный `id`.
Тексты экранируются; номера декоративные, порядок передаёт семантический `ol`.
Один набор текстов используется на всех адаптивах.

Подключить `components.css`, `card-spacing.css`, `body-text.css`, `button.css`,
`section-spacing.css`, `learning-timeline.css`; `section-heading.css` — после них.
Карточка использует `card_component.is-learning` и вложенный `content-header_component`:
заголовок 20/22/24/24px, Body Text `is-reading` — 15/16/18/20px,
padding 12/12/16/16px, gap 12/8/12/12px, radius 12/12/16/16px через `--radius-card`. Границы 521/768/1025px.
`is-expert` на карточке и маркере меняет цвета через токены лендинга.

Сетка сохранена по последнему уточнению пользователя: до 768px подпись над
карточкой, круг слева с центром на первой строке подписи; от 768px подпись слева
от круга. На 768–1024px колонка подписей 14–16.375rem; от 1025px длинная подпись
Expert расширяется влево до 16.375rem. Список максимум 63rem, gap шагов 20px,
кнопка максимум 22.5rem, gap перед ней 24px. Высота карточек определяется текстом.

Публичные настройки: `--learning-timeline-max-width` и
`--learning-timeline-line` (CSS URL исходного SVG лендинга). Без URL есть простой
градиент. «Психолог-консультант» использует этот CSS-градиент без загрузки
отдельного SVG. Линия находится в слое 0, шаги и маркеры — в слое 1;
отрицательный z-index не используется. Шрифты, цвета, отступ карточки наследуются от Academy-токенов.

JS инициализирует все `[data-learning-timeline]`, а повторный запуск вызывает
`window.__academyLearningTimelineCleanup()`. Только декоративная линия меняет
`scaleY`; её конец следует 90% высоты viewport. Текст и маркеры статичны.
Cleanup снимает обработчики, observers, rAF и inline progress. Reduced motion
и отсутствие JS показывают полную линию. Custom Element не требуется.

Для Tilda renderer работает при сборке; CSS и SVG встраиваются в HEAD,
HTML — в BODY, общий JS — один раз в FOOTER. Итоговый комплект не зависит от
файлов `shared/` или локальных SVG. Не редактировать generated HTML вручную.

Шапка → этапы: общий `section-layout_component.is-responsive`,
32/36/42/70px из [spacing.md](spacing.md). Старый fluid gap не используется.

## Вариант программы

`variant: "program"` сохраняет общую линию, маркеры и поведение, а карточки
берёт целиком из `renderStageCard` (program-render.mjs), с `tag: "div"` внутри
нумерованного шага. Подключить дополнительно `program.css`. Label шага становится
плашкой длительности внутри карточки, внешней колонки labels нет на всех ширинах.
Опциональный `description` — общий подзаголовок. `expertIcon` не нужен.
Все описания видны, раскрытия и плюсов нет (поручение пользователя для КПТ).
`action.href: null` в этом варианте выводит preview-button с `aria-disabled`,
`data-action` из `action.id`; cursor/focus остаются общими. Остальные варианты
сохраняют прежний same-page action contract. Готовый файл/получатель — данные курса.
