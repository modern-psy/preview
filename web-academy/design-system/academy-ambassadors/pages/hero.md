# Hero override

Figma Dev Mode nodes `611:1161` and `611:1162` are the source of truth. The
second node is the content group nested inside the complete first node.

- First-section spacing from header: `70px` on desktop.
- Standard spacing after a desktop section: `150px`.
- Content-to-media gap: `70px`; content-to-actions gap: `40px`.
- Copy group gap: `28px`. The gray eyebrow sticker above the heading reads
  “Мастерская профессионального контента” without an emoji. Its desktop gap to
  the heading is `16px`; the shared responsive `24px` gap applies at `<=991px`.
- Heading max-width: `1018px`, not a fixed width. Wix Madefor Text Bold,
  `72px/76px`, tracking `-2.52px`, color `#332F41`.
- Heading lines wrap naturally from the max-width. Do not use `<br>` or separate
  block spans to reproduce the desktop line break.
- Highlight: `#BEACF4`, `12px` radius, `-0.45deg`; it sizes from the highlighted
  text rather than using the Figma rectangle's fixed dimensions. The user-adjusted
  highlight covers only “готовым контентом”; the preceding “с” remains plain.
- Supporting copy: `22px/32px`, tracking `-0.11px`, color `#1D1D33`.
- Actions: `8px` gap, `17px 33px` padding, 1px black border, `16px` radius,
  `18px/26px` semibold.
- Media columns use an equal fluid grid and the Figma `713:593` aspect ratio.
  They must not use fixed card width or height.
- Media gap and radius: `16px`.
- Blur layer uses the supplied `bg-1.webp`, `blur(38.5px)`, overscan, and a small
  scale to prevent exposed edges.
- Grain uses the supplied `grain.webp`, stretched to cover, multiply blend, 40%
  opacity.
- Reel and photo placement preserve Figma proportions using percentage geometry.
- The supplied five-layer reel shadow is kept verbatim.
- Tablet/mobile layouts are responsive inferences because only desktop Dev Mode
  geometry was supplied: stack the media cards, reduce type, and stack CTAs on
  narrow mobile screens. On tablet, stacked media cards use a shorter `16:10`
  ratio so the image blocks do not dominate the viewport; narrow mobile restores
  the taller card treatment needed for the layered content.
- On page load, the hero reveals in three restrained top-to-bottom groups: the
  complete text block, the actions block, then the media grid. Each group fades
  upward from 12px over 0.48s with a 75ms step and ease-out timing. Do not split
  individual text elements into separate stagger steps.
- Motion `12.42.2`: the text note fades upward over `0.6s` once when 35% visible; the reel is
  linked to card scroll progress. Upward travel is measured from the computed
  `top` inset, capped at 24px, and always leaves at least 6px before the top edge.
- All hero effects are disabled for `prefers-reduced-motion`, and the static state
  is restored if the CDN import fails.
