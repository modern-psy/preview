# Вопросы на небе

Цельная секция: заголовок, подводка, фото неба с репликами-пузырями и общий
[CTA](cta.md) под ним. Сделана на «Клиническом психологе» (Figma `34:399`),
вынесена в общие 12.10.2026, когда появился второй потребитель —
`apps/preview/treningi-dlya-detey` (блок «Когда упражнения есть, а тренинга не получается»).

«Клинический психолог» пока подключает свою прежнюю копию
(`projects/clinical-psychologist/client-questions.*`). При следующей правке
переключить его на эти файлы: данные `sky` перевести в объект `{src, width, height}`,
классы `professional-role_header/intro` в этой секции станут `client-questions_header/intro`.

## API

`renderClientQuestions(data, {id})` из `client-questions-render.mjs`.

| Поле | Обязательно | Что это |
| --- | --- | --- |
| `heading` | да | H2 секции |
| `description` | нет | подводка под заголовком |
| `sky` | да | фото `{src, width, height}`: HTTPS или `assets/` лендинга (для Тильды — только CDN) |
| `stage_heading` | нет | H3 поверх неба («И появляются вопросы»); без него реплики начинаются сверху |
| `listLabel` | нет | подпись списка реплик для скринридера |
| `questions` | да | `[{text, x, y}]`: `x` — отступ слева в % ширины неба, `y` — сверху в rem; только для desktop |
| `cta` | нет | данные общего CTA: `heading`, `button`, `action`, `href` (якорь) или без него — preview-кнопка, `gridSource` |

## Поведение и адаптив

- До 1025px реплики идут в потоке, чётные прижаты вправо; от 1025px — по координатам
  из данных. Высоту неба на desktop задаёт `--client-questions-min-height`
  (по умолчанию 42.875rem под пять реплик); при шести и больше её поднимает лендинг.
- `client-questions.js`: каждая реплика появляется при 25 % видимости (400ms, ease-in-out),
  на desktop с точным указателем фон сдвигается ±24px. На телефонах и при reduced motion
  фон статичен, без JS всё видно. Повторный запуск снимает прежние наблюдатели
  (`window.__academyClientQuestionsCleanup`).
- Публичные токены: `--client-questions-min-height`, `--client-questions-image-position`,
  `--client-questions-bubble-background`.

## Подключение

CSS: `components.css`, `card-spacing.css`, `section-spacing.css`, `button.css`,
`cta-responsive.css`, `client-questions.css`, затем `section-heading.css` и тема.
JS: `components.js` (CTA) и `client-questions.js`, каждый один раз.
Сетка CTA — SVG лендинга в `cta.gridSource`; для Тильды встроить или дать CDN.
