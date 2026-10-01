# Терапия травмы: ПТСР и кПТСР

Завершённый лендинг Академии. Локально хранится содержимое `<main>`; production
header, footer, нативная форма, её получатели и popup загрузки программы
остаются в Tilda.

Текущий статус находится в [`STATE.md`](STATE.md), обязательные правила и карта
всего проектного контекста — в [`AGENTS.md`](AGENTS.md).

## Быстрый старт

Из корня репозитория:

```sh
python3 -m http.server 8000
```

Откройте `http://localhost:8000/projects/trauma-therapy/`.

Стенд формы:

- MAX: `http://localhost:8000/projects/trauma-therapy/tests/form-bridge-fixture.html`;
- Telegram: `http://localhost:8000/projects/trauma-therapy/tests/form-bridge-fixture.html?messenger=telegram`.

Сборка и проверка:

```sh
npm run tilda:trauma-therapy
npm run test:tilda:trauma-therapy
node --check projects/trauma-therapy/script.js
git diff --check
```

Сборку запускайте дважды: hashes в `tilda/manifest.json` после второго запуска
не должны измениться.

## Канонические файлы

| Файл | Назначение |
| --- | --- |
| `index.html` | Семантическая разметка и видимый контент |
| `styles.css` | Тема и варианты этого лендинга |
| `../../shared/academy/anchor-scroll.js`, `anchor-scroll.css` | Общая [якорная навигация](../../shared/academy/anchor-scroll.md) |
| `../../shared/academy/lead-form.css`, `lead-form.js` | Общая форма и мост к Tilda |
| `schema.org` | Единственный source JSON-LD |
| `data/design-source.json` | Актуальные Figma-файлы и node ID |
| `data/form-contract.json` | Поля, validation, mapping, consent и CRM lifecycle |
| `data/assets.json` | Локальные ассеты, размеры, alt-семантика и Tilda URL |
| `../../shared/academy/` | Общие authoring-компоненты Академии |
| `COMPONENTS.md` | Общие и project-owned компоненты, их API и связь формы с Tilda |
| `IMPLEMENTATION.md` | Долговременные production-решения и regression guards |
| `build-tilda-bundle.mjs` | Единственный генератор Tilda package |

## Tilda package

Готовые фрагменты находятся в [`tilda/`](tilda/):

1. `head.html` и `schema.html` вставляются в page-specific HEAD.
2. `body.html` вставляется без форматирования в один T123.
3. Нативная форма с `tildaspec-formname=trauma-therapy` и настроенными
   получателями остаётся на той же странице.
4. `footer.html` вставляется последним T123 ниже нативной формы.
5. Header, footer и `#form-download` остаются штатными блоками Tilda.

Полный операторский порядок, SEO-поля и post-publish checklist генерируются в
[`tilda/README.md`](tilda/README.md). Эти файлы не редактируются вручную:
изменения вносятся в source или `build-tilda-bundle.mjs`, затем пакет собирается
заново.

BODY минифицирован и проверяется по лимиту 65 000 символов. Повторяющиеся SVG
вынесены в CSS HEAD, поэтому `head.html` и `body.html` всегда обновляются одной
парой. Production не зависит от локальных `assets/` или `shared/` URL.

## Форма и данные

Точный перечень собираемых данных, правила validation и mapping в нативную
Tilda-форму находятся только в
[`data/form-contract.json`](data/form-contract.json). Общий lifecycle моста
описан в
[`../../rules/engineering/tilda-form-bridges.md`](../../rules/engineering/tilda-form-bridges.md).
Публичный UI-контракт и связь уровней описаны в
[`COMPONENTS.md`](COMPONENTS.md).

Ключевой production-контракт:

- служебная форма определяется по `tildaspec-formname=trauma-therapy`, а не по
  изменяемому record/form ID;
- видимые значения попадают в `Name`, `email`, `Phone`, `messenger-type` и
  `messenger-id`, а неактивный contact предварительно очищается;
- success view появляется только после matching `tildaform:aftersuccess`;
- CAPTCHA остаётся промежуточным loading-state;
- end-to-end результат подтверждается записью тестовой заявки в CRM.

Любое изменение поля, messenger type, mask или receiver требует проверки
опубликованного DOM, повторной публикации и обоих production-сценариев с заранее
согласованными тестовыми данными.

## Проверка интерфейса

Проверяйте через локальный сервер на 375, 520, 521, 767, 768, 1024 и 1440px:
overflow, console/network, изображения, heading order, keyboard, focus/hover,
reduced motion, FAQ, программу, slider, CTA, форму и все якоря. Ссылка
«Скачать полную программу» должна открывать Tilda-popup `#form-download` и не
перехватываться плавным scroll handler.

Для видимого русского copy дополнительно проверяйте
[`../../rules/product/typography.md`](../../rules/product/typography.md): тире,
короткие служебные слова, даты, величины и цены не должны оставаться на строке
отдельно или создавать overflow.

Для продолжения работы достаточно прочитать корневой `AGENTS.md`, затем
проектные [`AGENTS.md`](AGENTS.md) и [`STATE.md`](STATE.md). История сессий и
отдельный handoff не нужны.

Готовая форма теперь подключена из `shared/academy/lead-form.css` и `lead-form.js`.
Правила внедрения — [общая инструкция](../../shared/academy/lead-form.md);
контракт и получатели этой страницы остаются в `data/form-contract.json`.
