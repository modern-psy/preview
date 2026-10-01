# FAQ section override

Figma Dev Mode node `611:1504` defines the section.

- Centered 1200px maximum container with fluid `595fr / 591fr` columns and a
  16px gap.
- Left intro uses shared `bg-4.webp`, 38.5px blur, grain, 20px padding, and 16px
  radius. The background is not rotated: Dev Mode places its oversized box about
  157% left and 30% down, keeping the top dark and the color field lower. The
  grain layer is rotated 180deg independently. The card height is content-driven
  via spacing, not fixed at 457px.
- The registration button uses a simple white hover with a dark final label.
  The secondary outlined button has only a subtle white surface hover; neither
  button uses radial motion or lift.
- FAQ uses real question buttons, labelled answer regions, and 40px plus/minus
  controls. The entire card is clickable, while keyboard control stays on the
  button. Answers animate with a content-driven CSS Grid row, never fixed height.
- Multi-paragraph answers use a 12px paragraph gap on desktop and 8px on tablet
  and mobile, independent of the answer's bottom padding.
- All items start closed. Opening one item smoothly closes any previously open
  item; clicking the open card closes it.
- The final copy contains four objection-based questions supplied by the user.
- Tablet/mobile stacks intro above the list and centers the eyebrow, heading,
  and action group. The heading group-to-actions gap is a content-driven 32px;
  the desktop `clamp()` spacing does not carry into responsive layouts. Narrow
  mobile makes both actions full width.
