# Знакомство с КПТ Оксфордская модель — бесплатный мини-курс

Адрес превью: `preview.modern-psy.ru/cbt-oxford-intro`. Источник контента и
порядка секций — живая страница мини-курса «Первые шаги в КПТ»
(`https://modern-psy.ru/cbt-first-steps`) плюс тексты нового курса от заказчика.

Папка самодостаточна: `style.css` и `script.js` уже содержат общие стили и
скрипты Web Academy (снимок `apps/preview/web-academy/shared/academy/` от
17.09.2026), поэтому runtime-ссылок на `web-academy/` нет. Внешние
зависимости: Google Fonts (Wix Madefor Text 400/444/500/600), intl-tel-input 29.1.2
с jsDelivr для телефонных полей, картинки и иконки на CDN Тильды.

## Файлы

| Файл | Назначение |
| --- | --- |
| `index.html` | контент лендинга, один `<main class="academy-page cbt-oxford-intro-page">` |
| `style.css` | общие CSS Академии в порядке подключения + тема `.cbt-oxford-intro-page` в конце |
| `script.js` | `components.js` (CTA-сетка), `learning-timeline.js`, `lead-form.js` с локальными правками (см. «Форма заявки») |
| `build-tilda.py` | сборка блоков T123 посекционно в `tilda/` |
| `tilda/` | генерируется, руками не правится |

Порядок общих CSS в `style.css`: components → card-spacing → body-text →
icon-card → program → learning-timeline → course-audience → cta-responsive →
button → section-spacing → teacher-card → teachers → lead-form → lead-form-responsive →
academy-showcase-responsive → section-heading → тема. CSS intl-tel-input 29.1.2
подключается с CDN перед `style.css`, его JS — перед `script.js`.
Фон сетки CTA встроен в тему как data URI, в разметке стоит прозрачный gif.
Сетка ведущих: 1 колонка до 520px, 2 колонки от 521px, на desktop карточки
не шире 27rem (локальное правило в теме).

## Тема

Класс страницы `.cbt-oxford-intro-page` переопределяет только переменные:
профиль анимаций `--motion-duration: 150ms`, `--slider-duration: 400ms`,
`--accordion-duration: 300ms`, `--motion-easing: ease-in-out`; фон страницы
`#f5f5f5` берётся из `components.css`; поля страницы 16 → 24 → clamp до 80px
от 1200px; отступ hero от шапки 16/24px; кадрирование фото первого экрана; на desktop
текст первого экрана занимает 50% ширины блока, кнопка во всю ширину этой колонки.
Плюс точечная `!important`-защита цветов кнопок и табов от глобальных
правил Тильды.

## Секции и компоненты

| # | Секция | Компонент Академии | Что взято из источника |
| --- | --- | --- | --- |
| 1 | Первый экран | `hero_component` (одна кнопка, `components.css`) + `meta-pill` | фото `cbt-mini-hero.webp` и иконка плашки с CDN старой страницы; тексты заказчика |
| 2 | Мини-курс подойдёт вам, если вы | `course-audience` (карточки с выделенной вводной фразой + фото) | 4 карточки заказчика; фото — общее `img-asp-for-whom.webp` компонента |
| 3 | После мини-курса вы сможете | сборка из базовых классов: `section-layout` + `card-grid_component.is-paired` + `card_component.is-icon-statement` (`icon-card.css`) | 6 утверждений заказчика обычным абзацем `body-text_component.is-summary` с заглавной буквы, иконка — галочка `icon-circle-check.svg` из блока цен, перекрашена в тёмно-фиолетовый `#644ab2` и встроена data URI |
| 4 | Как устроен мини-курс | сборка из базовых классов: `card-grid_component.is-triple` + `card_component.is-icon-statement.is-described` | тексты старой страницы с двумя правками заказчика, иконки `icon-time/video/send` с CDN старой страницы |
| 5 | Программа | `learning-timeline` вариант `program` + карточки этапов `program.css` | уроки заказчика |
| 6 | Ведущие мини-курса | `teacher-card` в статичной сетке `teachers_list` (по решению заказчика без табов, стрелок и Splide) | записи из общего каталога преподавателей, фото с CDN |
| 7 | Грант | `cta` (`is-responsive`, интерактивная сетка) | текст старой страницы, число уроков 4 |
| 8 | Форма заявки | `lead-form` (`is-responsive`, intl-tel-input 29.1.2) с локальной правкой: три мессенджера Telegram / ВКонтакте / MAX | поля имя, почта, телефон; нативная форма `mini-oxford` |
| 9 | Об Академии | `academy-showcase` (`is-responsive`, четыре карточки) | тексты и фото старой страницы, свечения карточек встроены data URI |

Секции 3 и 4 не имеют готовой цельной секции в каталоге (в каталоге такие
карточки живут только внутри `recognition` и `foundation` вместе с CTA).
Они собраны по контракту icon-card: внешний `column-grid_content.is-content-wide`,
`section-layout_component.is-responsive` (шапка → контент 32/36/42/70px),
`section-header_component.is-center`, сетка `is-paired` (1 колонка до 767px,
2 от 768px) или `is-triple` (1 → 3), карточки `is-icon-statement` с плашкой
иконки 40px и общими `--card-padding`/`--card-grid-gap`/`--radius-card`.
Ничего локального, кроме порядка вложения, у них нет.

### Карточка урока в программе

Общая карточка этапа `card_component.is-stage` расширена на уровне лендинга:

- `stage-card_header` — плашка `stage-card_badge` («Урок 1» … «Обзорный урок»)
  и заголовок `content-heading_component.is-card`;
- `stage-card_body` — колонка с gap 12px: абзац «Вы узнаете / научитесь…», абзац
  «План-содержание» и список `ul.stage-card_list` (маркеры цвета акцента,
  отступ 20px, gap 6px), всё в роли `body-text_component.is-detailed`;
- место под тайминг: `span.stage-card_duration.body-text_component.is-caption`
  рядом с плашкой (в `index.html` оставлен закомментированный пример,
  минуты уроков заказчик пришлёт позже).

Стили этих трёх классов лежат в теме в конце `style.css`.

## Действия и форма заявки

Все три кнопки («Начать бесплатно» в первом экране и в программе,
«Посмотреть вебинары» в блоке гранта) ведут якорем на секцию формы
`#application`; отступ до цели под шапку Тильды задаёт `--anchor-scroll-offset`.

Форма — общий компонент `lead-form` (имя, почта, телефон, мессенджер) с одним
локальным отличием от библиотечного контракта, оно внесено в копию
`lead-form.js` внутри `script.js` и помечено комментарием:

- третий мессенджер ВКонтакте: radio `messenger=vk`, поле `vkContact`
  (`data-lead-vk-contact` / `data-lead-vk-field`), принимает ссылку
  `vk.com/…`, короткое имя, `@имя` или `id123`; в нативную форму уходит
  как текстовый `messenger-id`, радио `messenger-type` со значением `vk`,
  если его нет — Telegram-слот.

Порядок мессенджеров: Telegram (по умолчанию, поле «Имя пользователя с @»),
ВКонтакте («Ссылка или id страницы»), MAX («Телефон в MAX», intl-tel-input).
Имя нативной формы по решению заказчика `mini-oxford`
(`data-tilda-form-name="mini-oxford"`); состав нативного блока (Name, email,
Phone, messenger-type с вариантами telegram / vk / max, messenger-id)
и получатели — в Тильде. Доступ к урокам уходит на почту, в мессенджер
Академия не пишет. Ссылки согласия:
`modern-psy.ru/agreement` и `modern-psy.ru/privacy`, как на старой странице.

## Локальная проверка

Из корня репозитория запустить `preview` из `.claude/launch.json`
(или `node scripts/serve.js apps/preview 4174`) и открыть
`/cbt-oxford-intro/`. Проверено 17.09.2026 на 375, 520, 521, 767, 768,
1024, 1025 и 1440px: горизонтального overflow нет, CTA-сетка и линия таймлайна инициализируются, ошибок
в консоли нет.

## Сборка блоков T123

```sh
python3 apps/preview/cbt-oxford-intro/build-tilda.py
```

Сборщик режет `index.html` по `<section>`, каждую секцию оборачивает в
`<div class="main-wrapper academy-page cbt-oxford-intro-page" data-cbt-oxford-intro-part="…">`,
общие стили кладёт в первые блоки (CSS режется по границам правил, каждый
файл меньше 65 000 символов), скрипты — в последний. Инструкция по вставке
и список того, что остаётся в Тильде, — в `tilda/README.md`.
