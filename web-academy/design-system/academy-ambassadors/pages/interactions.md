# Interaction overrides

## Tilda link and list protection

- Every authored anchor inside `.page-wrapper` resolves a component-owned
  `--link-color` through one page-scoped important color rule and never gains an
  injected underline.
- Tilda-facing `ul`, `ol`, and `li` defaults keep zero margin, zero padding, and
  no marker with deliberate important protection.
- Component hover states that change link color update `--link-color` rather
  than trying to override the protected anchor color directly.

## Same-page anchor scrolling

- Same-page links animate with the interruptible conference-style ease-out
  routine rather than relying only on native smooth scrolling.
- The header registration button, hero CTA, centered CTA, and results-tabs CTA
  use the `#price` same-page target. The pricing and FAQ registration buttons use
  Tilda's `#popup:getcourse` pseudo-anchor; it opens the published GetCourse
  widget and must not be treated as a same-page element ID or smooth-scroll
  target.
- Duration scales with distance from 480ms to 900ms. The target's computed
  `scroll-margin-top` owns the fixed-header offset; do not duplicate an 80px
  constant in JavaScript.
- Wheel, touchstart, or keyboard input cancels the current animation immediately.
  Repeated initialization removes the prior listener and animation first so
  Tilda preview reloads cannot attach duplicates.
- Reduced-motion preference and sub-pixel travel use an immediate native scroll.

## Black CTA hover

- Main black CTA buttons use a restrained background and border transition from
  `#000000` to `#18181A`.
- Do not add a pointer-origin circle, radial layer, hover lift, translation, or
  Motion-driven hover animation.
- Hover is progressive enhancement for fine pointers; the controls remain fully
  usable on touch devices without it.

## Host film button

- Its hover only changes the dark surface from `#1A1A1C` to `#2B2B2F`; it does
  not move, lift, or use the purple CTA effect.

## FAQ registration button

- Uses a simple white background and border hover with a `#332F41` label.
- Do not add a radial layer or move the button.

## Section reveals

- The hero keeps its three-part page-load reveal: copy, actions, and media.
- Below the hero, major content groups reveal once with the same restrained
  12px fade-up treatment as they enter the viewport. Cards and CTA buttons are
  not animated independently; each CTA surface reveals as one complete block.
- The complete `.bot_media-grid` is an explicit static exception. Never apply
  reveal initialization, inline `opacity: 0`, or a reveal transform to it: real
  mobile Safari or Chrome may fail to reveal this tall stacked group and would
  otherwise hide both the Telegram card and comparison video permanently. Clear
  stale reveal inline styles on initialization and `pageshow` for mobile
  back-forward-cache restores.
- The footer is always static and excluded from reveal motion.
- Reduced-motion users see every group immediately, and a failed Motion import
  restores static content rather than leaving it hidden.

## Calls timeline

- The timeline line grows down the list in direct response to section scroll.
- Growth begins as the first marker crosses 90% of the viewport and follows
  document travel pixel-for-pixel. A step activates at the exact pixel where the
  line front reaches its numbered marker; its copy fades in while the fully opaque
  marker stays above the line so the track cannot show through the circle.
- Reached steps and line progress are monotonic: scrolling upward does not hide or
  replay them. The reveal sequence runs once for each page load.
- Reduced motion keeps the original complete static timeline.
