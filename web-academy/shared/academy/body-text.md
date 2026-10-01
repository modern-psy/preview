# Body Text

`body-text_component` из `body-text.css` — общая типографика основного текста:
15/16/18/20px при границах 521/768/1025px, вес 444 и line-height 1.2.
Шрифт — `--font-family-body`, цвет — `--body-text-color` с fallback на
`--color-text-secondary-large`. CSS использует rem.

`is-reading` — развёрнутое описание с базовой шкалой 15/16/18/20px,
line-height 1.4 и обычным tracking. Используется в [learning-timeline](learning-timeline.md).

`is-profile` — описание человека; наследует общую шкалу 15/16/18/20px. В сочетании с `is-reading`
сохраняет line-height 1.4; используется в [teacher-card](teacher-card.md).

`is-summary` — вводное описание карточки: 16/18/20/22px, вес 444,
line-height 1.2. Используется в [бесплатных лекциях](trial-lectures.md).
`--body-summary-max` ограничивает верхний размер (по умолчанию 22px);
описания превью лекций ограничены 20px. Шкала остаётся в общем CSS.
`--body-summary-size` задаёт явный размер для иллюстраций с собственной
геометрией: мобильное превью лекций использует 1.125rem. Без токена действует
обычная адаптивная шкала.

`is-showcase` — описание карточки Академии: 16/18/20/24px, вес 400,
line-height 1.1. Включая карточку выпускников на вертикальном мобильном.

`is-detailed` — вариант развёрнутого описания этапа: 15/16/18/20px,
line-height 1.4 и обычный tracking. Размер наследуется от базового Body Text;
компоненты карточек её не копируют. Первый consumer — [program](program.md).

Компоненты карточек не дублируют эту размерную шкалу и не задают отдельные
`font-size`, `font-weight` или `line-height`. Они управляют раскладкой и gap.
Текст foundation и practice-path использует именно этот класс.

`is-regular` задаёт обычный вес 400. `--body-text-max` ограничивает верхнюю
ступень базовой шкалы (например, список тарифов — 18px).
`is-caption` — компактные условия и подписи: 15/16/16/18px, line-height 1.2.

По умолчанию tracking −0.01em. Вариант `is-statement` сохраняет обычный tracking
утверждённых текстов-утверждений; размер, вес и line-height остаются общими.
`body-text_lead` выделяет фрагмент основным цветом без изменения начертания.

```html
<p class="body-text_component">Описание карточки.</p>
<p class="body-text_component is-statement"><span class="body-text_lead">Главная мысль.</span> Продолжение.</p>
```

Подключать после `components.css`; в Tilda встроить CSS в HEAD.
Семантику задаёт HTML-элемент. JavaScript, состояния и lifecycle не нужны.
Legacy-классы других компонентов остаются совместимыми до их отдельного
этапа переработки; один размер сам по себе не означает одинаковую текстовую роль.

`is-emphasis`: weight 600; `is-callout`: weight 500, line-height 1.3;
`is-fine-print`: 14px, line-height 1.4. Семантика p/h3 остаётся у композиции.
