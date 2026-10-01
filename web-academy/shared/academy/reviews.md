# Reviews

## Короткая цитата без раскрытия

`renderReviewCard(item, prefix, {responsive: true})` принимает `type: 'quote'`:
фото, `quote`, `lead`, `caption` и необязательное `name`. При наличии имени
renderer добавляет над подписью общий `content-heading_component.is-card`
в `content-header_component`; расстояние до подписи задаёт карточка.
Такой вариант возвращает статичный div,
не требует `academy-review` runtime и сохраняет общую геометрию/типографику.
Опциональный `alt` задаёт описание фото; прежний fallback по имени сохраняется.
`--review-caption-color`, `--review-caption-muted`, `--review-quote-surface`
позволяют разместить карточку на другой поверхности без изменения внутренних размеров.
Класс `review-list_component.is-responsive` экспортирует те же
`--review-slide-width` и `--slider-gap`, что основной слайдер.
Первый составной потребитель — [истории изменений в практике](practice-stories.md).

## Новые четыре адаптива

`renderReviews({...data, responsive: true})` включает `reviews-responsive.css`
поверх прежних reviews/review-card/review-panel/review-controls CSS и runtime.
На всех ширинах используется существующий Splide; на обеих мобильных ориентациях
track показывает ровно одну карточку. Все элементы `items` сохраняются в слайдере.
Геометрия и шрифты всех карточек следуют первой карточке каждого Figma-адаптива.

Ширина: до 520px — max 288px; 521–767 — max 326px; 768–1024 — max 384px;
от 1025 — fluid 288–368px. Высота медиа: 300/340/400/450px. Текст: 15/16/18/18px.
Карточки ограничены доступной шириной. Внешние inset: 8/12/16/16px,
внутренние поля панели: 8/12/12/12px. Play, pause, close — квадрат 44px;
«Подробнее» той же высоты, с доступной зоной нажатия минимум 44px.

У данных свои `icons: {play, pause}`, у каждого item свои `width/height`
исходного изображения. `renderReviewCard(item, prefix, {responsive, icons})`
работает отдельно. Уникальный `data.id`/prefix обязателен для второго экземпляра.
Поведение видео, Esc, фокус, вертикальная прокрутка и cleanup сохраняются.
Без JS все отзывы доступны обычным списком, видео имеет нативные controls.

## Общее поведение и вложенные компоненты

Opt-in зависимости: `reviews.css`, `reviews-responsive.css`, CSS карточки,
панели и controls; Splide 4.1.4, `components.js`, `review-card.js`, `review-panel.js`.
Точный порядок — по зависимостям модулей. `AcademySliderControls` обеспечивает
стрелки, drag, горизонтальные жесты и клавиши ←/→ при фокусе внутри секции.
Вертикальное колесо прокручивает страницу; панели текста сохраняют native scroll.

Прежний режим без `responsive: true` оставлен для существующих потребителей:
он включает Splide от 521px, а ниже показывает список. Для новых лендингов
использовать актуальный режим со слайдером на всех ширинах.

The rendered slider sets Splide `focus: 0` and `omitEnd: true` so the final
index is the last distinct position of the tape, not the last card number.
Shared arrows and wheel boundaries use that controller end index, disabling
the next arrow as soon as the last page is reached without redundant clicks.
The shared runtime refreshes geometry once after mount, when `.is-initialized`
has switched the fallback grid to the actual flex track.

Atoms and state ownership:

- `review-controls.css`: arrow/play control and disclosure button; the latter
  switches label/cross through `aria-expanded`. Masks consume `--review-arrow-icon`
  and `--review-close-icon`. All targets are at least 2.75rem.
- `review-panel.css` / `review-panel.js`: `academy-review-panel` owns hidden
  scrollbars, overflow detection and the bottom fade. Full content remains
  keyboard-scrollable and does not drag the surrounding carousel.
- `review-card.css` / `review-card.js`: `academy-review` owns `open`, synchronizes
  ARIA/visibility, animates panel height and button width with the landing's
  `--motion-duration` and `--motion-easing`, and supports Escape/focus return.
  `data-author` supplies the accessible button label. Instances are independent;
  observers/listeners/animations are released on disconnect. Without JavaScript,
  full reviews appear below the photo and the disclosure control stays hidden.
- `reviews-render.mjs`: build-time section/card/panel/control functions. Pass a
  unique section `id`, `title` and `items`; each item has a unique `id`, `type`,
  image/position, caption, and text author/role/quote/paragraphs where relevant.

Images and copy belong to the landing. `type: video` uses the same `academy-review`
lifecycle with `data-review-video-card`. Optional `video.src` supplies a direct
video URL; the renderer provides native `<video controls playsinline preload="none">`
and uses `image` as its poster. There is no autoplay. Initialization replaces native
controls with the existing 44px play/pause button; without JS native controls remain.
`data-review-video-toggle` references the video through `aria-controls`. Enter,
Space and click toggle playback. Pause retains the frame for 2.5 seconds, then
reveals the decorative poster overlay without resetting media time. Play hides
the overlay and cancels the pending timer; disconnect clears it too. Native media state
owns playback; media events synchronize `data-playing` and the action label.
Completion restores play, and the next click restarts. Failed playback shows a
`role="status"` message and allows retry; interrupted/stale play promises do not
overwrite later actions. The button remains visible during playback.

Starting another video in the same reviews section pauses the previous video.
Leaving the viewport/carousel, hiding the browser tab or disconnecting the card
pauses media. Disconnect also releases listeners/IntersectionObserver and restores
native controls; reconnect and duplicate script loading are safe. Reduced motion
does not prevent user-requested video playback. No extra custom events or observed
attributes are required: the nested video exposes its native media API. Source and
poster updates belong to project data and the renderer, not a new host attribute.
When `video.src` is missing, `data-video-preview` enables a labelled control preview
without creating an empty video or making a media request. Without JS that preview
control stays hidden. Playback icon assets belong to the landing; the consultant
uses exact Figma play/pause geometry with both icons white per the user correction.
Tilda embeds local posters once in HEAD behind a transparent native poster and
embeds SVG icons in HEAD; the MP4 remains an external CDN URL. Update HEAD/BODY/
FOOTER together. Browser checks: consultant `tests/video-fixture.html`, built by
`tests/build-video-fixture.mjs` (real playback, pause/resume, end, failure/retry,
disconnect/reconnect, delayed poster return and duplicate initialization).
`tests/slider-fixture.html` checks horizontal-only wheel handling, keyboard,
real end positions, shared motion timing and duplicate initialization.
Use existing `section-header_component` and `content-header_component` typography.
Bundle all opt-in CSS/JS into Tilda HEAD/FOOTER; no shared runtime paths.

Base author spacing (responsive size overrides are in `reviews-responsive.css`): `.review-panel_header` scopes
`--content-heading-gap: .125rem`, `--content-heading-size: 1.375rem` and
`--content-heading-line-height: 1.3` to the shared heading composition. The author
and the paragraph group are separated by .75rem; paragraphs have no added gap.
Panel padding in the current responsive variant follows the four-band values above.

The disclosure clips its contents. During the token-driven transition,
width reaches its target at 70%, then the incoming label/cross fades in. This
prevents the label flashing outside the narrow button, including rapid reversals.
The arrow's default asset lives beside the consuming shared stylesheet at
`assets/icons/slider-arrow-light.svg`; bundle that exact SVG into Tilda CSS.


`AcademySliderControls.bind(slider, component, getInstance, previous, next)`
shares arrow, horizontal wheel, focus and keyboard behavior with teachers. Its
`update()` synchronizes real tape boundaries and `destroy()` releases handlers.
`motion(slider)` reads `--slider-duration` before the general `--motion-duration`,
plus shared easing and reduced motion. The marked source region is embedded
by the consultant teacher builder for standalone Tilda delivery.

Радиус обычной карточки/медиа следует `--radius-card`: 12px до 767px,
16px от 768px. Подключать [card-spacing.css](card-spacing.css) после базового
`components.css`, включая самостоятельный экспорт компонента.
