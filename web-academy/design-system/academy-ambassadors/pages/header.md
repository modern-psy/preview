# Header override

The Figma node `662:268` is the source of truth for this component and overrides
generic recommendations in `../MASTER.md`.

- Header background: `#000000`.
- Landing page background outside the header: `#EEEEEF`.
- Bottom border: `1px solid rgba(232, 226, 249, 0.08)`.
- Desktop frame: `1680px` wide with `120px` side padding and a `1440px` maximum
  inner container.
- Header row is fluid. The Figma `80px` result is reproduced through content and
  vertical padding, not a fixed block height.
- Logo: supplied ASP SVG, rendered at `84px × 30px`.
- Typeface: Wix Madefor Text.
- Navigation: `15px`, regular, `1.45` line-height, `24px` gap.
- Authored link order is exactly “Что внутри”, “Результаты”, “Куратор”,
  “Стоимость”.
- Navigation-to-CTA gap: `32px`.
- CTA: white background, `#332f41` text, `16px` semibold, `20px` line-height,
  `-0.01em` tracking, `16px 32px` padding, `16px` radius.
- Mobile behavior is an implementation inference because the selected Figma node
  only provides the desktop state: use an accessible 44px menu button, stacked
  links, a full-width CTA, Escape/outside-click close, and reduced motion support.
- Do not use a screenshot as an implementation source. Read Dev Mode properties
  and CSS/variables from the node. Do not rasterize the Figma frame into the page.
- Avoid fixed block width/height. Allowed exceptions here are the logo's intrinsic
  aspect/dimensions, a 1px border, the 44px accessible menu target, and a viewport
  safety cap for the open mobile menu.
