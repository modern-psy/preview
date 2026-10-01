# Client-First

Client-First v2 от Finsweet — основа организации HTML и CSS в Web Academy.
Оригинальная система создана для Webflow; в этом репозитории она адаптирована
для hand-written HTML/CSS и последующего переноса в Tilda.

Обязательные проектные правила находятся в [`AGENTS.md`](../../../AGENTS.md).
Если этот документ или официальная документация расходятся с `AGENTS.md`,
использовать `AGENTS.md` до явного решения пользователя.

## Цели

- понятные человеку названия без знания конкретного макета;
- предсказуемый поиск всех классов компонента по общему префиксу;
- независимое управление глобальными utilities и локальными компонентами;
- безопасная передача страницы другому разработчику или в Tilda;
- масштабирование без presentation-only имён и случайного cascade.

## Типы классов

### Custom classes

Описывают компонент, страницу, группу или элемент. Используют underscore для
отношений и виртуальных folders:

```text
nav_component
nav_logo-wrapper
conference_speakers_card
form_input
```

Один underscore создаёт один уровень: `nav_logo-wrapper`. Второй — осознанное
вложение: `conference_speakers_card`. Глубина должна оставаться минимальной.

### Utility classes

Описывают одну переиспользуемую ответственность. Содержат hyphens, но не
underscore:

```text
padding-global
container-large
text-size-small
text-color-secondary
```

Utility не получает несвязанные свойства. Например, `padding-global` управляет
только горизонтальным page gutter.

### Global classes

Общие для сайта компоненты или стили: `nav_component`, `footer_component`,
`button`, `form_input`. Все utilities являются global, но не каждый custom class
должен становиться global.

### Combo and state classes

Вариант добавляется после реального base class и начинается с `is-`:

```html
<a class="button is-secondary" href="#tickets">Купить билет</a>
<button class="nav_menu-button is-open" aria-expanded="true">...</button>
```

`is-` класс не работает самостоятельно. JavaScript state синхронизируется с
нативным/ARIA-состоянием.

## Core structure

Использовать только слои с реальной ролью:

```text
page-wrapper
└── main-wrapper
    └── section_conference-hero
        └── padding-global + padding-section-large
            └── container-large
                └── conference_hero_component
```

Navigation и footer остаются снаружи `main-wrapper`. Не добавлять wrapper только
ради соответствия схеме.

## Официальные источники

- [Client-First documentation](https://finsweet.com/client-first/docs)
- [Intro](https://finsweet.com/client-first/docs/intro)
- [Classes strategy](https://finsweet.com/client-first/docs/classes-strategy-1)
- [Core Structure strategy](https://finsweet.com/client-first/docs/core-structure-strategy)
- [Folders](https://finsweet.com/client-first/docs/folders)
- [Variables](https://finsweet.com/client-first/docs/variables)
