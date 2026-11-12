# Мастерская контента

Финальная Tilda-ready реализация лендинга «Мастерская профессионального
контента» на семантических HTML, CSS и JavaScript.

- Текущие правила: `AGENTS.md`.
- Точные правила секций: `../../design-system/academy-ambassadors/`.
- Canonical:
  <https://modern-psy.ru/masterskaya-professionalnogo-kontenta>.

## Файлы

- `index.html`, `styles.css`, `script.js` — канонические исходники страницы.
  С 12.11.2026 в них перенесена пересборка клуба из черновика
  `hero-variants.html`; сам черновик теперь только переадресует на `index.html`.
- `schema.org` — единственный JSON-LD для Tilda HEAD.
- `assets/` — фото участников и poster сравнения видео. Для Тильды у каждого
  файла должна быть ссылка на CDN в `assetUrls` сборщика.
- `build-tilda-files.mjs` — генератор пакета переноса.
- `tilda/` — HEAD, блоки T123 по секциям, `preview.html`, инструкция и manifest.
- `tests/tilda-bundle.test.mjs` — регрессия маршрутов и пакета.
- `data/` — реестр значимых runtime-ассетов.

## Перенос в Tilda

Из корня репозитория:

```bash
npm run tilda:content-workshop
npm run test:tilda:content-workshop
```

Затем:

1. добавить `tilda/head.html` в page-specific HEAD (шрифт и JSON-LD);
2. вставить блоки T123 по порядку из `tilda/README.md`: стили, 14 секций,
   скрипты;
3. опубликовать страницу и пройти smoke-test из `tilda/README.md`.

Маршрут CTA зафиксирован тестом: шапка, первый экран и блок рилсов ведут к
`#price`, «Получить пробные дни» — к `#trial` с формой GetCourse, кнопки в цене
и FAQ открывают `#popup:getcourse`.

Страница не требует React или runtime-сборщика. Motion `12.42.2` загружается как
закреплённый ESM-модуль, а все runtime-медиа используют Tilda CDN или встроенную
разметку.
