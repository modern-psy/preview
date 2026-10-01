# Web Academy landings

Локальная мастерская лендингов проекта «Академия». Здесь страницы собираются и
тестируются до переноса кода в Tilda. Production-публикация остаётся в Tilda.

Изолированные проекты, сохранённые как исходники:

- [`trauma-therapy`](./projects/trauma-therapy/) — «Терапия травмы: ПТСР и
  кПТСР»;
- [`content-workshop`](./projects/content-workshop/) — «Мастерская
  профессионального контента»;
- [`what-if-become-a-psychologist`](./projects/what-if-become-a-psychologist/) —
  «А что, если стать психологом»;
- [`anti-crisis-conference`](./projects/anti-crisis-conference/) — антикризисная
  конференция для психологов;
- [`ast-shrek-in-psychologists-office`](./projects/ast-shrek-in-psychologists-office/) —
  вебинар о первом знакомстве с ACT;
- [`cbt-first-steps`](./projects/cbt-first-steps/) — вводный курс по КПТ;
- [`cbt-oxford`](./projects/cbt-oxford/) — «КПТ Оксфорд»;
- [`psychologist-consultant`](./projects/psychologist-consultant/) —
  «Психолог-консультант».

## Базовые договорённости

- Основной стек: HTML, CSS и JavaScript.
- Именование CSS-классов: Client-First от Finsweet.
- Анимации: Motion, когда они действительно улучшают интерфейс.
- React и сборщик подключаются только для задач, где без них есть заметные
  ограничения; финальный способ переноса в Tilda должен быть описан отдельно.
- Постоянные правила для Codex находятся в [`AGENTS.md`](./AGENTS.md), а
  многоуровневая память описана в
  [`docs/memory/README.md`](./docs/memory/README.md).

## Структура

Каждый лендинг хранится независимо:

```text
projects/
  project-slug/
    index.html
    styles.css
    script.js
    assets/
    AGENTS.md        # обязательные правила только этого лендинга
    STATE.md         # только при наличии активного блокера или следующего шага
    data/            # при необходимости: текущие решения и ассеты в JSON
    README.md        # при необходимости: инструкция переноса в Tilda
shared/              # только осознанно переиспользуемые исходники
```

Для нового проекта используйте короткий slug в нижнем регистре, например
`projects/course-launch/`.

## Локальный просмотр

Из корня репозитория можно запустить любой простой статический сервер, например:

```bash
python3 -m http.server 8000
```

После этого страница проекта будет доступна по адресу
`http://localhost:8000/projects/project-slug/`.

## Полезные источники

- [Локальная frontend-база знаний](./docs/libraries/README.md)
- [Motion](https://motion.dev/)
- [Client-First](https://finsweet.com/client-first)
- [UI UX Pro Max skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
