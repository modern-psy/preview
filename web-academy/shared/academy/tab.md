# Плашка таба

`tab_component` в `components.css` — общая плашка, извлечённая из Teachers.
`teachers_tab` поддерживается тем же селектором как совместимое имя; отдельной
копии размеров и состояний в Teachers и Showcase tabs нет.

Шрифт 15/16/18/20px, line-height 1; padding 10×12px на мобильных,
12×14px от 768px. Высота по содержимому, без height/min-height: одиночная
строка даёт 35/36/42/44px. Прозрачный псевдоэлемент расширяет цель до 44px.
Длинный текст переносится; родительская flex-навигация выравнивает плашки по start.
Радиус 8px, цвета и переходы — из темы; selected использует aria-selected,
есть hover, pointer, focus-visible и reduced motion, без hover-transform.

Для новой навигации: `<button class="tab_component" type="button">…</button>`.
Раскладкой списка, role/ARIA, клавиатурой и выбранной панелью владеет компонент
навигации (Teachers / Showcase tabs), не плашка. Teachers сохраняет якорь без JS.
Публичные цвета: `--tabs-idle-surface`; прежние `--teachers-tab-background` и
`--teachers-tab-size` сохранены для совместимости. В Tilda встраивается components.css.
