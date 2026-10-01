# «А что, если стать психологом»

Завершённый semantic HTML/CSS/JavaScript лендинг бесплатного онлайн-разбора,
подготовленный для Tilda.

- Canonical: <https://modern-psy.ru/how-to-enter-psy>.
- Текущие правила: `AGENTS.md`.

## Файлы

- `index.html`, `styles.css`, `script.js` — канонические исходники.
- `schema.org` — единственный JSON-LD.
- `assets/hero/grid.svg`, `assets/cta/grid.svg`, `assets/icons/` — локальные SVG,
  которые сборщик встраивает в Tilda package.
- `assets/video/` — два утверждённых 10-секундных ролика hero.
- `tilda-assets.json` — абсолютные Tilda CDN URL пары видео.
- `build-tilda-bundle.mjs` — генератор transfer package.
- `tilda/` — HEAD, BODY, FOOTER, schema, asset map, README и manifest.
- `tests/tilda-bundle.test.mjs` — SEO, mobile fallback и bundle regression.

## Реализация

Страница содержит header/floating navigation, hero, внутренний диалог, сомнения,
agenda, ведущего, блок об Академии, два экземпляра общего CTA-компонента и footer.
FAQ сохранён в source, но исключён из текущего Tilda BODY.

Ключевые progressive-enhancement features:

- interruptible same-page anchor scrolling;
- последовательное hero-видео Бабурин → Саранчева;
- sticky dialogue lane на подходящих tablet/desktop и normal-flow mobile;
- общий interactive grid engine для hero и CTA;
- static touch и reduced-motion fallbacks;
- idempotent initialization и защита изображений от drag.

## Сборка и проверка

Из корня репозитория:

```bash
npm run tilda:what-if-psychologist
npm run test:tilda:what-if-psychologist
node --check projects/what-if-become-a-psychologist/script.js
git diff --check
```

Повторная сборка должна быть воспроизводимой. Generated files не редактируются
вручную. Точные инструкции вставки и smoke-test находятся в `tilda/README.md`.
