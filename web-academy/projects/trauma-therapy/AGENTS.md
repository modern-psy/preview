# «Терапия травмы: ПТСР и кПТСР» — правила проекта

Инструкции относятся только к `projects/trauma-therapy/`. Правила других
лендингов не являются источником значений, контента или исключений для этого
проекта.

## Единая карта контекста

После корневого `AGENTS.md` прочитайте этот файл и `STATE.md`. Затем открывайте
только источник, соответствующий задаче:

| Область | Канонический источник |
| --- | --- |
| Текущий статус и следующий шаг | `STATE.md` |
| Локальная работа и перенос в Tilda | `README.md` |
| Figma-файлы и node ID | `data/design-source.json` |
| Собираемые формой данные и маршрут в CRM | `data/form-contract.json` |
| Медиа, размеры, семантика и Tilda CDN | `data/assets.json` |
| Общие Academy-компоненты | `../../shared/academy/README.md` |
| Архитектура компонентов | `../../rules/engineering/components.md` |
| Мост кастомной формы к Tilda | `../../rules/engineering/tilda-form-bridges.md` |
| SVG, masks и парный HEAD/BODY | `../../rules/engineering/tilda-svg-and-masks.md` |
| Доступность и SEO | `../../rules/product/semantic-accessibility.md`, `../../rules/product/seo.md` |
| Типографика и управляемые переносы | `../../rules/product/typography.md` |
| Компоненты этого лендинга | `COMPONENTS.md` |
| Production-решения и ошибки | `IMPLEMENTATION.md` |
| Инструкция готового пакета | generated `tilda/README.md` |

Не копируйте сведения между этими файлами. Меняйте факт в его каноническом
источнике и обновляйте зависящий от него код или тест.

## Источники и границы

- Production и canonical находятся в Tilda:
  `https://modern-psy.ru/trauma-therapy`. Не публикуйте проект на другом хосте
  без прямого запроса пользователя.
- Header, footer, получатели нативной формы и popup `#form-download` принадлежат
  Tilda. Не добавляйте их в исходный `<main>` и не подменяйте локальными копиями.
- Канонические исходники интерфейса: `index.html`, `styles.css`, `script.js`,
  `schema.org`, `assets/`, shared Academy-компоненты и записи в `data/`.
- Структурированный Figma-контекст из `data/design-source.json` — визуальный
  источник. Скриншоты не трассировать и не растрировать как реализацию.
- Текущий Figma-файл имеет приоритет над старыми лендингами. Старый проект может
  дать только явно разрешённый responsive-паттерн или переиспользуемый компонент,
  но не свои copy, цвета, размеры, цены или ассеты.

## Обязательные инварианты

- Используйте semantic plain HTML/CSS/JavaScript, Client-First naming, fluid
  grid/flex, intrinsic height и mobile-first каскад.
- Общие компоненты живут в `../../shared/academy/` под `.academy-page`.
  `.trauma-page` хранит только тему и настоящие варианты этого лендинга.
  Секционный класс управляет размещением секции, но не создаёт копию общего
  card/grid/accordion API.
- Сохраняйте один `<main>`, один H1, логичный heading/DOM order, видимый focus,
  keyboard/touch operation, 44px targets и полезный контент без JavaScript.
- Видимый русский copy следует `../../rules/product/typography.md`: короткие
  служебные слова, тире, даты, величины и цены получают осмысленные `&nbsp;`
  без длинных nowrap-цепочек.
- Кнопки не двигаются и не масштабируются на hover. Motion не должен скрывать
  essential content; reduced motion отключает необязательную анимацию.
- Якоря используют общие `anchor-scroll.css` и `anchor-scroll.js` по
  `../../shared/academy/anchor-scroll.md`; не возвращать обработчик в `script.js`.
  Сохранять `data-academy-anchor-scroll` на main в исходнике и Tilda BODY;
  проектный `--anchor-scroll-offset` остаётся в теме, popup — во владении Tilda.
- Runtime-медиа используют только постоянные URL из `data/assets.json` или
  встроенные data URL. В production-фрагментах запрещены `localhost`,
  repository-relative `assets/` и `shared/`.
- Splide закреплён на `4.1.4` и включается от 521px; `intl-tel-input` закреплён
  на `29.1.2`. Смена версии требует повторной локальной и Tilda-проверки.
- `build-tilda-bundle.mjs` единолично генерирует `tilda/head.html`, `body.html`,
  `footer.html`, `schema.html`, `README.md` и `manifest.json`. Generated-файлы
  вручную не редактировать.
- HEAD и BODY с вынесенными SVG являются одной версией и переносятся парой.
  BODY остаётся одной минифицированной строкой в пределах защитного бюджета
  65 000 символов.

## Форма и сбор данных

- `data/form-contract.json` — единственный проектный реестр полей, каналов,
  валидации, consent-ссылок, нативного mapping и условий end-to-end успеха.
- Видимая форма собирает только перечисленные там данные: имя, e-mail, основной
  телефон, выбранный канал связи и активный контакт MAX либо Telegram.
- На опубликованной странице должна оставаться нативная Tilda-форма с
  `tildaspec-formname=trauma-therapy` и всеми полями из реестра. Находите её по
  marker, скрывайте только содержащий её `.t-rec` и отправляйте через
  `requestSubmit()`, сохраняя Tilda validation, CAPTCHA и receivers.
- Перед mapping очищайте неактивный messenger contact. Телефонные result-поля
  передавайте в полном формате Tilda mask, а не в сокращённом E.164.
- Кастомный success разрешён только после matching
  `tildaform:aftersuccess` от отправленной нативной формы. CAPTCHA — продолжение
  loading-state; таймер, spinner и вызов submit не доказывают успех.
- Производственная проверка завершена только после отдельных MAX и Telegram
  сценариев и появления обеих согласованных тестовых заявок в CRM. Не отправляйте
  внешние тестовые данные и не публикуйте страницу без разрешения пользователя.

## Сборка и проверка

- Для визуальной задачи сначала запустите локальный static server и подключите
  in-app Browser до редактирования. Если backend недоступен, сразу сообщите об
  этом пользователю.
- После source/shared/schema/asset change дважды выполните
  `npm run tilda:trauma-therapy`, затем `npm run test:tilda:trauma-therapy`,
  `node --check projects/trauma-therapy/script.js` и `git diff --check`.
- Второй build обязан оставить те же manifest hashes.
- Проверяйте 375, 520, 521, 767, 768, 1024 и 1440px; для desktop-контейнера при
  необходимости также 1680px. Проверяйте overflow, console/network, assets,
  keyboard, focus/hover, reduced motion, форму, popup hook и Tilda copy/paste.
- Любое изменение нативных полей, masks, messenger types или receivers требует
  повторной публикации и полного production preflight из
  `data/form-contract.json`.
