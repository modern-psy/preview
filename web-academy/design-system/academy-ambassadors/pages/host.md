# Host section override

Figma Dev Mode node `611:1335` defines the section.

- Centered 1200px maximum container, 28px padding, 32px gap, `#DFDFDF` surface,
  0.5px border, and 16px radius. Height is content-driven.
- Desktop columns use the fluid Figma ratio `232fr / 880fr`; the portrait keeps
  the `232 / 330` frame ratio instead of a fixed width or height.
- Identity content: 16px gap from eyebrow to name, then 8px to metadata. Main
  content gap: 24px.
- Name: 48px/54px Bold, tracking -1.2px. Metadata: 16px/24px, `#827F8B`.
  Description: max-width 754px, 18px/26px. All wrapping is width-driven.
- Film button links to the supplied YouTube timestamp, uses a 42px play circle,
  and has a simple dark hover with no purple radial effect.
- Tablet (`768–991px`) keeps a fluid two-column composition with the portrait on
  the left and the complete text block on the right. Mobile landscape
  (`521–767px`) stacks the portrait above the copy. Regular mobile (`<=520px`)
  tightens padding/type and makes the film button full width.
