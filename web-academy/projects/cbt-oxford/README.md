# КПТ Оксфорд

[Превью Vercel](https://cbt-oxford-preview.vercel.app) · production — Tilda.
Публикация этого preview разрешена пользователем 2026-09-15.

Начало следующей сессии: [AGENTS.md](AGENTS.md) → [STATE.md](STATE.md) →
[COMPONENTS.md](COMPONENTS.md) и контракт нужного компонента. Точные значения
и поведение хранятся в Shared; не восстанавливать их по скриншотам старых версий.

## Исходники

- `index.html` — страница с generated-областями секций курса.
- `styles.css` — тема и внешние поля/колонки; `tab-media.css` — интерфейсы внутри табов.
- `data/` — контент, assets/actions и источники Figma.
- `teachers/data.html` — редактируемый состав преподавателей для Tilda.
- `render-page.mjs` и `render-lower-sections.mjs` — адаптеры общих renderer; generated-разметку вручную не менять.
- [COMPONENTS.md](COMPONENTS.md) — состав и зависимости.
- [tilda/README.md](tilda/README.md) — перенос автономной сборки.

## Локальная работа

Из корня репозитория:

```sh
python3 -m http.server 8766 --bind 127.0.0.1
node projects/cbt-oxford/render-page.mjs
node projects/cbt-oxford/build-tilda-bundle.mjs   # без флага останавливается, если в index.html остались локальные webp
node --test shared/academy/tests/course-audience.test.mjs
node --test shared/academy/tests/motion-contract.test.mjs
node --test shared/academy/tests/practice-stories.test.mjs shared/academy/tests/showcase-tabs.test.mjs shared/academy/tests/teachers-catalog.test.mjs projects/cbt-oxford/tests/tilda-bundle.test.mjs
```

Открыть `http://127.0.0.1:8766/projects/cbt-oxford/`.
Комплект: `http://127.0.0.1:8766/projects/cbt-oxford/tilda/preview.html`.
Проверка табов, преподавателей, no-JS и reduced motion в браузере:
`http://127.0.0.1:8766/projects/cbt-oxford/tests/browser-components.html`.
Тест использует iframe с текущими Tilda-фрагментами; reduced motion моделируется
через matchMedia только внутри тестового iframe. В production этот код не входит.
Фреймворка и сборочных зависимостей нет; внешние библиотеки закреплены в index.html.

## Обновление Vercel

Собрать Tilda, затем скопировать только `tilda/preview.html` как `index.html`
в отдельную директорию preview и выполнить там `vercel deploy --prod` для
проекта `gleb-projects-work/cbt-oxford-preview`. Не запускать deploy из корня
репозитория: его существующая Vercel-привязка относится к другой странице.
Текущая рабочая директория preview: `/private/tmp/cbt-oxford-preview`.
Если временный каталог не сохранился, создать новый изолированный каталог
с одним `index.html` из автономной сборки, статической конфигурацией Vercel
(`framework: null`, `buildCommand: null`, `outputDirectory: "."`) и заново
связать его с указанным preview-проектом через `vercel link`.
Preview закрыт от индексации. По готовности курса SEO финализируется для Tilda.
