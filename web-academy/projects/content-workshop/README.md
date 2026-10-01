# Мастерская контента

Финальная Tilda-ready реализация лендинга «Мастерская профессионального
контента» на семантических HTML, CSS и JavaScript.

- Текущие правила: `AGENTS.md`.
- Точные правила секций: `../../design-system/academy-ambassadors/`.
- Canonical:
  <https://modern-psy.ru/masterskaya-professionalnogo-kontenta>.

## Файлы

- `index.html`, `styles.css`, `script.js` — канонические исходники страницы.
- `schema.org` — единственный JSON-LD для Tilda HEAD.
- `assets/content-video-poster.png` — локальный poster сравнения видео.
- `build-tilda-files.mjs` — генератор пакета переноса.
- `tilda/` — готовые HEAD, BODY, FOOTER, инструкция и SHA-256 manifest.
- `tests/tilda-bundle.test.mjs` — регрессия маршрутов и пакета.
- `data/` — реестр значимых runtime-ассетов.

## Перенос в Tilda

Из корня репозитория:

```bash
npm run tilda:content-workshop
npm run test:tilda:content-workshop
```

Затем:

1. добавить `tilda/head.html` в page-specific HEAD;
2. вставить `tilda/body.html` в один T123;
3. вставить `tilda/footer.html` в последний T123;
4. опубликовать страницу и пройти smoke-test из `tilda/README.md`.

Финальный маршрут CTA зафиксирован тестом: header, hero, центральный CTA и CTA
результатов ведут к `#price`; кнопки в цене и FAQ открывают
`#popup:getcourse`.

Страница не требует React или runtime-сборщика. Motion `12.42.2` загружается как
закреплённый ESM-модуль, а все runtime-медиа используют Tilda CDN или встроенную
разметку.
