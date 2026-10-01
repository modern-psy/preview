# CTA section override

Figma Dev Mode node `611:1217` is the source of truth.

- CTA is centered, `width: 100%`, and `max-width: 1200px`; it shrinks inside the
  shared page padding on narrower screens.
- The block is content-driven. Do not set a fixed width or height.
- Outer background is white with 16px radius and clipped decorative layers.
- Background uses the shared `bg-4.webp`, rotated 180 degrees, oversized,
  blurred `38.5px`, and slightly scaled to avoid exposed edges.
- Grain reuses the shared Tilda asset at 40% opacity, multiply blend, with a
  `500px × 500px` background tile.
- Content starts 50px from the top. Copy-to-button gap is 32px; heading-to-body
  gap is 16px. This compact CTA rhythm stays consistent across breakpoints.
- Heading max-width: 954px, Wix Madefor Text Bold, `48px/54px`, tracking `-1.2px`,
  white.
- Description max-width: 794px, medium `22px/28px`, tracking `-0.22px`,
  `#F5F5F5`. It wraps naturally without `<br>`.
- CTA button: 17px 33px padding, white background/border, 16px radius,
  `#332F41`, semibold `18px/26px`, tracking `-0.18px`.
- Tablet/mobile sizes preserve content hierarchy, reduce type, and make the CTA
  full-width only on narrow mobile.
