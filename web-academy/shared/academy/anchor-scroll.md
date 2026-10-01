# Якорные переходы Academy

Обязательное поведение новых лендингов: общие `anchor-scroll.css` и
`anchor-scroll.js`, без проектных копий. Источник движения — «Терапия травмы»:
Длительность в миллисекундах — `min(900, max(480, abs(distancePx) × 0.28))`;
easing — cubic ease-out, `1 − (1 − progress)³`.
Это отдельный контракт навигации, не длительность hover/FAQ/слайдеров.

```html
<link rel="stylesheet" href="../../shared/academy/anchor-scroll.css">
<main class="academy-page" data-academy-anchor-scroll>
  <a href="#program">Программа</a>
  <section id="program" aria-labelledby="program-heading">
    <h2 id="program-heading">Программа обучения</h2>
  </section>
</main>
<script src="../../shared/academy/anchor-scroll.js" defer></script>
```

- Opt-in: `data-academy-anchor-scroll` на контейнере ссылок. Допускаются
  несколько контейнеров, включая отдельную навигацию. ID уникальны в документе.
- Ссылки — нативные `a[href="#id"]`; цель может находиться вне контейнера.
  Без JS сохраняется нативная навигация. Общий CSS-отступ действует на цели
  внутри opt-in контейнера; для цели вне него задавать `scroll-margin-top`
  в её компоненте. Ссылки сохраняют видимый hover/focus и `cursor: pointer`.
- Общий отступ до якорной цели — `50px` на мобильных и `100px`, начиная с
  `48rem`. Он задан публичным token `--anchor-scroll-offset`, чтобы фиксированный
  хедер Tilda не перекрывал начало секции. Проект может переопределить token,
  только когда его подтверждённая высота хедера требует другого значения.
  Индивидуальный `scroll-margin-top` цели имеет приоритет.
- `data-anchor-scroll-ignore`, `.skip-link`, `data-tilda-popup-link`,
  `aria-disabled="true"`, download, чужой target, внешние/пустые/несуществующие
  якоря и клики с модификаторами не перехватываются. Попапы остаются у Tilda.
  Уже обработанные события (`defaultPrevented`), в том числе навигация
  слайдеров/табов, не перехватываются; скрытые цели не запускают движение.
- Scroll ID и Tilda popup hash образуют непересекающиеся множества. Для scroll
  использовать project-prefixed цели вроде `course-slug-program`; `#program`,
  `#form` и другие настроенные popup hash не назначать секциям. Наличие
  `data-tilda-popup-link` обязательно для каждой Tilda popup-ссылки и не заменяет
  проверку отсутствия одноимённого DOM ID.
- URL получает hash без мгновенного скачка. Повторный hash не добавляет историю;
  существующий `history.state` сохраняется. Back/Forward остаются нативными.
- После завершения цель получает focus без повторного scroll. Временный
  `tabindex="-1"` снимается при blur/cleanup; авторский tabindex не меняется.
  Enter работает как обычный click, следующие Tab идут от целевого раздела.
- Wheel, touchstart, pointerdown, keydown, смена history/hash и новый переход
  останавливают текущую анимацию. Прерывание не переносит focus.
- Reduced motion выполняет переход сразу; включение настройки во время
  движения сразу завершает переход. Скрипт не меняет глобальный scroll-behavior.
- Делегированный обработчик поддерживает динамически вставленные ссылки и
  контейнеры без observer. Удаление источника/цели отменяет движение на следующем
  кадре. Повторная загрузка сначала вызывает `window.__academyAnchorScrollCleanup()`;
  cleanup отменяет RAF, снимает listeners и временный tabindex. Внешние события
  компонент не создаёт; Custom Element и новые зависимости не нужны.

## Tilda и проверка

Сборщик встраивает CSS в HEAD, JS один раз в FOOTER после BODY. Сохранять
opt-in атрибут в экспортированном HTML; не оставлять runtime-ссылки на shared.
Consumers: `psychologist-consultant` и `trauma-therapy`.

Проверки: `node --test shared/academy/tests/anchor-scroll.test.mjs`; обе сборки;
375/768/1024/1440px, промежуточный кадр и конец, повторный клик, прерывание,
Enter/Tab/focus, reduced motion, no-JS, несколько контейнеров и повторный init.
Проверять текущий автономный preview, а не сохранённый старый Tilda FOOTER.

Платформенный контракт: [scrollTo](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo),
[focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus),
[pushState](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState).
