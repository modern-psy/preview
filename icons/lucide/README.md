# Lucide Icons (SVG)

Источник: https://lucide.dev/icons/ — пакет `lucide-static` v1.40.0, лицензия ISC (см. LICENSE).

- Все иконки лежат отдельными файлами: `<имя>.svg`, имя совпадает с именем на lucide.dev (например `arrow-right.svg`, `circle-check.svg`).
- Каждая иконка 24×24, `stroke="currentColor"`, `stroke-width="2"` — цвет задаётся через CSS `color`.
- `sprite.svg` — все иконки одним спрайтом: `<svg><use href="sprite.svg#check"/></svg>`.

После заливки на сервер использовать так:

```html
<img src="/icons/lucide/check.svg" alt="" width="24" height="24">
```

или инлайном / через CSS `mask-image`, если нужен цвет из темы.
