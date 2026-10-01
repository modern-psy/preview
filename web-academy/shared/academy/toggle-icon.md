# Плюс / крест

Самостоятельный декоративный компонент `toggle-icon_component` из
`toggle-icon.css` и build-time helper `renderToggleIcon({className?, open?})`.
Внутри — `toggle-icon_glyph`. Используется точный Figma SVG
`assets/disclosure-cross.svg` как CSS mask с `currentColor`; отдельной отрисовки
линий нет. Исходник 33×33, отображение — 1.75rem (28px) ниже 768px и
2rem (32px) от 768px. Размер задаётся `--toggle-icon-size`.

Закрытое состояние — плюс, `is-open` поворачивает контейнер на −45° в крест.
При интеграции с общим accordion добавить `accordion_icon`: его существующие
селекторы `[open]` / `opening` / `closing` управляют поворотом. Старые CSS-линии
подавляются только на экземпляре с `toggle-icon_component`.

Иконка имеет `aria-hidden="true"`, не принимает фокус и не обрабатывает клики.
Кнопка или summary вокруг неё владеет доступным именем, состоянием и областью
нажатия не меньше 44px. В других компонентах владелец синхронизирует `is-open`
со своим native/ARIA состоянием. Не добавлять независимое состояние в иконку.

Transition наследует общие `--motion-duration` / `--motion-easing`, при reduced
motion отключён. Runtime, listeners и cleanup отсутствуют. Без JS иконка FAQ
реагирует на нативный `details.open` через существующий CSS accordion.

Для Tilda CSS и оба mask URL встраиваются сборщиком в STYLE, span — в BODY.
Сохранять `-webkit-mask` вместе с `mask`. В итоговом пакете SVG — data URL,
без ссылки на локальный `shared/`. Пример подключения — [FAQ](faq.md).
