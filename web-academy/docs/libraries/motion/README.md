# Motion

Motion — основной JavaScript-инструмент анимации в Web Academy, когда CSS
transitions недостаточно. Он подходит для небольших progressive-enhancement
анимаций, spring motion, viewport detection и scroll-linked effects.

Проверенная при создании документа версия: `12.42.2`.

## Выбор инструмента

- CSS transition — простые hover/focus/state changes.
- Motion — default для reveal, sequence, spring, `inView()` и умеренного `scroll()`.
- GSAP — сложные timelines, ScrollTrigger, pin/scrub или точная оркестрация.
- Splide — carousel movement; Motion не конкурирует с его track transform.

Подключать Motion и GSAP на одной странице можно только при чётком разделении
ownership. Две библиотеки не управляют одним свойством одного элемента.

## Основные API

- `animate()` — tween, spring, keyframes и sequences;
- `stagger()` — задержка для группы элементов;
- `inView()` — viewport detection на Intersection Observer;
- `scroll()` — связь animation/progress со scroll position;
- animation controls — pause, play, cancel/stop и completion;
- cleanup function из `inView()`/`scroll()` — остановка observers/listeners.

`animate()` имеет mini и hybrid варианты. Mini подходит для HTML/SVG styles через
browser APIs; hybrid добавляет independent transforms, sequences, complex values,
SVG paths и objects. Выбирать минимально достаточный вариант.

## Официальные источники

- [Quick start](https://motion.dev/docs/quick-start)
- [animate()](https://motion.dev/docs/animate)
- [inView()](https://motion.dev/docs/inview)
- [scroll()](https://motion.dev/docs/scroll)
- [Upgrade guide](https://motion.dev/docs/upgrade-guide)
