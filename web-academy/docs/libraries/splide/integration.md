# Splide integration

## Подключение

Для Academy предпочтителен `splide-core.min.css`: он содержит необходимую
механику без визуальной темы. Стрелки, pagination и состояния оформляются в
системе стилей конкретного проекта.

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide-core.min.css"
>
<script src="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js"></script>
```

Перед использованием в новом проекте проверить текущую версию и release notes,
затем локально протестировать выбранную точную версию.

## Семантическая разметка

Классы `splide__*` являются обязательным API библиотеки. Компонентные
Client-First классы добавляются рядом и отвечают за оформление проекта.

```html
<section
  class="conference_speakers-slider splide"
  aria-labelledby="conference-speakers-heading"
>
  <h2 id="conference-speakers-heading">Спикеры конференции</h2>

  <div class="splide__track">
    <ul class="conference_speakers-list splide__list">
      <li class="conference_speakers-item splide__slide">
        <!-- Содержимое карточки -->
      </li>
    </ul>
  </div>
</section>
```

Если видимого заголовка нет, root получает краткий `aria-label`. Если карусель
декоративная и не является самостоятельным разделом, используется подходящая
обёртка с `role="group"`, а не дополнительный landmark.

## Базовая инициализация

```js
function initConferenceSliders(root = document) {
  if (typeof window.Splide !== 'function') return [];

  return Array.from(root.querySelectorAll('[data-splide-root]')).map((element) => {
    if (element.dataset.splideInitialized === 'true') return null;

    const instance = new window.Splide(element, {
      type: 'slide',
      perPage: 3,
      perMove: 1,
      gap: '1rem',
      arrows: true,
      pagination: true,
      mediaQuery: 'min',
      breakpoints: {
        768: { perPage: 2 },
        1025: { perPage: 3 },
      },
      reducedMotion: {
        speed: 0,
        rewindSpeed: 0,
        autoplay: 'pause',
      },
    });

    instance.on('mounted', () => {
      element.dataset.splideInitialized = 'true';
    });

    instance.on('destroy', () => {
      delete element.dataset.splideInitialized;
    });

    instance.mount();
    return instance;
  }).filter(Boolean);
}
```

Значения в примере демонстрационные. Количество карточек, gaps и breakpoint
options берутся из дизайна конкретной страницы, а не копируются автоматически.

Хранить созданные экземпляры в состоянии страницы, чтобы перед повторной
инициализацией вызвать `destroy(true)`. Не искать все `.splide` одним
конструктором: один экземпляр управляет только одним root.

## Responsive behavior

В проекте CSS mobile-first, поэтому для согласованной логики предпочтителен
`mediaQuery: 'min'`. Splide по умолчанию использует `max-width`.

Если карусель нужна только на части диапазонов, использовать responsive option
`destroy`. Значение `true` сохраняет наблюдение за breakpoint и допускает
повторный mount; `'completely'` уничтожает экземпляр окончательно.

Не задавать `fixedWidth`/`fixedHeight`, если дизайн можно воспроизвести через
fluid layout, `perPage`, `gap`, aspect ratio и content-driven height.

## Autoplay и доступность

По умолчанию избегать autoplay для содержательных карточек. Если он нужен:

- оставить `pauseOnHover: true` и `pauseOnFocus: true`;
- добавить доступную toggle-кнопку play/pause;
- сохранить ручные стрелки или pagination;
- локализовать `i18n` labels;
- проверить, что reduced motion начинает карусель в состоянии pause.

Не полагаться на один swipe: кнопки должны быть клавиатурно доступны, иметь
минимальную touch-area 44×44 px и видимый `:focus-visible`.

## Сочетание с GSAP

Splide отвечает за перемещение и состояния карусели. Не анимировать track
параллельным GSAP tween: две системы будут конкурировать за `transform`.

GSAP можно применять к внутренним элементам активного слайда по событию Splide,
если анимация не меняет геометрию track. Перед `refresh()` или `destroy()` такую
анимацию необходимо очистить.
