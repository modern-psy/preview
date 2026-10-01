# Splide

Splide — библиотека для доступных каруселей и слайдеров без зависимости от
фреймворка. Для лендингов Academy используем ветку 4.x и plain JavaScript.

Проверенная при создании документа версия: `4.1.4`.

## Когда использовать

- карточки или спикеры должны перелистываться drag/swipe и кнопками;
- нужен loop, pagination, autoplay или синхронизация основной и thumbnail-карусели;
- полноценная доступная карусель оправдана лучше, чем CSS overflow/scroller.

Не подключать Splide для декоративного горизонтального ряда, который нормально
решается CSS Grid, Flexbox или `overflow-x: auto`.

## Документы в этой директории

- [integration.md](integration.md) — разметка, подключение, конфигурация и
  жизненный цикл.
- [checklist.md](checklist.md) — проверка перед сдачей.

## Ключевые части API

- `new Splide(element, options)` — один экземпляр на один root.
- `.mount()` — монтирует карусель.
- `.on(event, callback)` / `.off(event, callback)` — события.
- `.go(control)` — переход к индексу или по управляющей строке.
- `.refresh()` — перерасчёт после изменения слайдов или геометрии.
- `.destroy(completely)` — удаление поведения и созданной библиотекой разметки.
- `.sync(otherSplide)` — синхронизация основной и навигационной карусели.

Обработчики события `mounted` регистрируются до вызова `.mount()`.

## Основные опции

- `type`: `slide`, `loop` или `fade`;
- `perPage`, `perMove`, `gap`, `padding`;
- `autoWidth` или `fixedWidth` — только когда этого требует дизайн;
- `arrows`, `pagination`, `drag`, `rewind`;
- `autoplay`, `interval`, `pauseOnHover`, `pauseOnFocus`;
- `breakpoints` и `mediaQuery`;
- `reducedMotion`;
- `i18n` для локализованных accessible labels.

Readonly-опции не следует динамически изменять после mount. Для адаптивных
изменений использовать responsive options и `breakpoints`.

## Официальные источники

- [Documents](https://splidejs.com/documents/)
- [Getting Started](https://splidejs.com/guides/getting-started/)
- [Options](https://splidejs.com/guides/options/)
- [Structure](https://splidejs.com/guides/structure/)
- [Accessibility](https://splidejs.com/guides/accessibility/)
- [APIs](https://splidejs.com/guides/apis/)
- [Events](https://splidejs.com/guides/events/)
