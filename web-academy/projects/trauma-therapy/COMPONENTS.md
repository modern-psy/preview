# Компоненты «Терапии травмы»

Канонический component catalog завершённого лендинга. Он фиксирует границу
между общей Academy-библиотекой и project-owned композицией, публичные hooks и
Tilda placement. Точные визуальные значения остаются в `styles.css`, общая
реализация — в `../../shared/academy/`, а generated `tilda/` не редактируется.

## Общие Academy-компоненты

Лендинг использует без форка API из
[`../../shared/academy/README.md`](../../shared/academy/README.md):

- page foundation, global padding и container;
- 12-column layout;
- [Hero](../../shared/academy/hero.md), metadata pills и statistic card;
- button variants;
- card/card-grid и media-card-list;
- price panel и price list;
- section intro/heading;
- native-details accordion и FAQ composition;
- [Academy showcase](../../shared/academy/academy-showcase.md);
- [animated CTA grid](../../shared/academy/cta.md);
- responsive Splide enhancement.

Тема задаётся на `.trauma-page`. Copy, изображения, Tilda CDN URLs, секционные
отступы и project exceptions не входят в shared API.

Hero features, challenges и payment options используют один shared contract для
карточек с иконкой: `.card_component.is-spacious` + `.card_icon` +
`.card_content`. Секционные сетки меняют только размещение карточек, но не их
внутренние отступы.

## Project-owned компоненты

| Компонент | Root и основные части | Поведение | Почему остаётся локальным |
| --- | --- | --- | --- |
| Challenges composition | `.challenges_component`, `.challenges_body` | shared cards + CTA | секционная композиция текущего курса |
| Decision path | `.decision-path_*`, `.decision-before_*`, `.graduation_*`, `.decision-card_grid` | shared cards + tall CTA artwork | уникальная before/after история и media |
| Skill outcomes | `.skill-outcomes_*` | semantic card list | layout и изображение этого курса |
| Program overview | `.program-layout_component`, `.program-overview_*` | anchor/download action | расписание, badge и popup hook принадлежат странице |
| Program modules | `.program-modules_component`, `.program-module_*` | shared accordion, multi-open | структура учебных модулей проекта |
| Teachers | `.teachers_component`, `.teachers_*`, `.teacher-card_*` | shared slider hooks, Splide from 521px | карточки, media crop и порядок преподавателей |
| Education | `.education_component`, `.education_*` | none | удостоверение, лицензия и media проекта |
| Payment options | `.payment-options_component`, `.payment-options_grid` | shared cards | секционная композиция и copy |
| Lead form | `.lead-form_component`, `.lead-form_*` | shared lead-form.js + intl-tel-input | field contract, mapping и lifecycle специфичны для страницы |

Локальный компонент переносится в shared только после второго реального
consumer с тем же semantic contract. Завершение этого лендинга само по себе не
является основанием для extraction.

## Lead form

Общий opt-in компонент: [lead-form.md](../../shared/academy/lead-form.md).
Source CSS/JS — `shared/academy/lead-form.css` и `lead-form.js`; проект хранит
семантическую разметку, контент и [контракт формы](data/form-contract.json).
Якоря используют общие `anchor-scroll.css` и `anchor-scroll.js` по
[контракту](../../shared/academy/anchor-scroll.md); `script.js` оставлен для проектного поведения. Внедрение в Tilda,
обязательные hooks, состояния, CAPTCHA, cleanup и проверки описаны в общем guide.
Сборщик встраивает shared CSS/JS, сохраняя исходные native marker и mapping.

## Cross-cutting contracts

- semantic HTML и focus: `../../rules/product/semantic-accessibility.md`;
- управляемые переносы: `../../rules/product/typography.md`;
- SVG/masks и T123 budget: `../../rules/engineering/tilda-svg-and-masks.md`;
- exact shared APIs: `../../shared/academy/README.md`.

После изменения shared API проверяется этот лендинг на 375, 520, 521, 767, 768,
1024 и 1440px и дважды пересобирается Tilda package.

После курса: весь `graduation_*` извлечён в `shared/academy/graduation.css`;
карточки используют общий `card_component is-on-media`. Исходники и сборщик
подключают один компонент с лендингом «Психолог-консультант».
