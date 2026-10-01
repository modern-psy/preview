# Impact CTA override

Figma Dev Mode node `611:1273` defines the section.

- The component fills the shared 1440px maximum container and keeps the standard
  16px radius. Its height is content-driven; no fixed block height is used.
- Desktop horizontal inset starts at 32px. The user-adjusted vertical insets are
  equal at 56px, centering the copy optically and removing the oversized empty
  area below it. The text area reserves proportional space for the layered
  Instagram artwork instead of using a fixed grid column width.
- Background `bg-3.webp` is decorative, oversized toward the right, and blurred
  by 38.5px over a black base. This preserves a wider dark field behind the left
  copy. The shared 500px grain texture overlays it at 40% multiply.
- Eyebrow: white, 12px uppercase, 28px intrinsic minimum height, 48px radius.
- Heading: 48px/54px Bold, tracking -1.2px, max-width 991px. Text wraps naturally
  by width; no `<br>` is used.
- Description: max-width 794px, 22px/28px Medium. Note: intrinsic width up to
  896px, 16px padding, 14px radius, 18px/26px text.
- The supplied Instagram artwork keeps its native `750 / 1152` ratio. The rear
  copy rotates -6.72deg with 1px blur and a pale gradient; the front rotates
  2.54deg and uses the Dev Mode shadow stack.
- At tablet/mobile widths, the complete copy group (eyebrow, heading,
  description, and note) is centered. The absolute desktop artwork returns to
  normal flow below the copy so it cannot overlap or create horizontal scrolling.
