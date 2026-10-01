# Motion integration

## Tilda-ready import

Использовать официальный ESM CDN import с точной протестированной версией:

```html
<script type="module">
  import {
    animate,
    inView,
    stagger,
  } from "https://cdn.jsdelivr.net/npm/motion@12.42.2/+esm";

  // Инициализация после доступности markup.
</script>
```

Не использовать `@latest` в deliverable. Перед подключением к новому проекту
проверить текущую версию и upgrade guide.

## Progressive enhancement and cleanup

Essential content виден в исходном HTML/CSS. JavaScript устанавливает начальное
состояние только после успешного import.

```js
const cleanup = [];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion) {
  const stopObserving = inView('[data-motion="reveal"]', (element) => {
    const controls = animate(
      element,
      { opacity: [0, 1], transform: ['translateY(1.5rem)', 'translateY(0)'] },
      { duration: 0.6, ease: 'easeOut' }
    );

    return () => controls.stop();
  }, { amount: 0.2 });

  cleanup.push(stopObserving);
}

function destroyMotion() {
  cleanup.splice(0).forEach((stop) => stop());
}
```

Конкретный controls API проверять по версии при реализации. Cleanup функции
хранятся в state страницы и вызываются перед повторной инициализацией Tilda.

## Reduced motion

- отключать parallax, large translate, scale и scroll-linked motion;
- не запускать autoplay/background movement;
- оставлять контент сразу видимым;
- при необходимости использовать мгновенное состояние или короткий opacity fade;
- следить за изменением media query, если страница живёт долго.

## `inView()`

Использовать для scroll-triggered reveal и запуска/остановки media. Функция
построена на Intersection Observer и возвращает cleanup function.

- `amount` определяет необходимую видимую долю элемента;
- `margin` сдвигает viewport boundary;
- `root` задаёт custom scroll container;
- не создавать отдельный observer вручную для каждого одинакового элемента.

## `scroll()`

Использовать только когда значение реально связано со scroll progress.
Для pinning предпочтителен CSS `position: sticky`. `scroll()` возвращает cleanup.

Если content size динамически меняется, оценить `trackContentSize: true`; не
включать его без необходимости из-за дополнительного overhead.

## Performance

- анимировать `transform` и `opacity`;
- не смешивать layout reads/writes внутри каждого frame;
- ограничивать количество одновременно движущихся элементов;
- stagger для landing lists обычно держать коротким;
- не блокировать input до завершения animation;
- не добавлять декоративный motion без информационной роли.
