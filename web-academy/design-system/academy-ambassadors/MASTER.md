# Academy Ambassadors design source of truth

The implemented Figma Dev Mode values, user decisions, `AGENTS.md`, and section
files under `pages/` are authoritative. Generic skill output must never override
them.

## Foundations

- Technology: semantic plain HTML, CSS, and JavaScript, ready to copy into Tilda.
- Naming: Finsweet Client-First conventions documented in `AGENTS.md`.
- Typeface: Wix Madefor Text, weights 400, 500, 600, and 700.
- Page background: `#EEEEEF`; main dark text: `#332F41`; body dark text:
  `#1D1D33`; highlight: `#BEACF4`; black: `#000000`; black CTA hover:
  `#18181A`.
- Shared large container: fluid `width: 100%`, maximum 1440px, centered.
- Shared narrower feature/CTA container: fluid `width: 100%`, maximum 1200px,
  centered and protected by page gutters.
- Desktop first-section offset from the header is 70px. Standard section spacing
  is 150px on desktop, 100px on tablet, and 80px on mobile. The FAQ-to-footer
  spacing is a user-defined exception: 100px on desktop/tablet and 80px on mobile.
- Main radii are 16px. Use exact Figma gaps and padding as tokens, but never
  freeze content blocks to Figma frame widths or heights.
- Project responsive bands are user-defined: tablet `768–991px`, mobile
  landscape `521–767px`, and regular/mobile portrait `<=520px`. These override
  the repository defaults for this landing.
- Across all responsive bands (`<=991px`), the vertical gap between an eyebrow
  tag and its section heading is 24px. Spacing to descriptions and actions stays
  independent.
- Responsive section headers use 16px between the completed heading group and
  its supporting description on tablet, then 12px on mobile landscape and
  smaller. The 24px eyebrow-to-heading gap remains independent inside the group.
- Text wraps through `width` and `max-width`. Never insert `<br>` for ordinary
  paragraphs or headings.
- Authored headings use `&nbsp;` selectively between short Russian prepositions or
  conjunctions and the word they govern, so those particles never remain alone
  at a line ending. Do not replace all ordinary spaces or use non-breaking chains
  long enough to cause mobile overflow.
- At mobile portrait (`<=520px`), the hero heading uses
  `clamp(2.125rem, 10vw, 2.75rem)` with `line-height: 1.05`. Main section headings
  use `clamp(1.9375rem, 8.5vw, 2.5rem)` with `line-height: 1.08`.

## Media and decorative system

- Shared grain: Tilda `grain.webp`, stretched/tiled as specified per section,
  usually 40% opacity with multiply blend.
- Shared blurred background for the first hero: `bg-1.webp`; impact section:
  `bg-3.webp`; subsequent decorative cards: `bg-4.webp` (also replaces the
  originally supplied `bg-2.webp` in the first CTA).
- Decorative blur and grain layers use empty alt and are hidden from assistive
  technology. Meaningful images follow `rules/product/seo.md`.
- Images are non-draggable within `.page-wrapper`, including images inserted
  later, without disabling links, focus, or the context menu.

## Interaction system

- Motion `12.42.2` from a pinned ESM CDN is used only for meaningful scroll and
  reveal motion. CSS transitions handle simple hover/focus states.
- Do not move buttons on hover. Do not implement radial/circle hover effects.
- Main black CTA hover: a subtle `#18181A` surface and border change. FAQ black
  CTA hover: white surface and border with `#332F41` text. The host film and
  pricing buttons keep their own restrained surface changes.
- Authored links have no underline. Every interactive element retains visible
  keyboard focus, a usable touch target, and reduced-motion behavior.
- Same-page anchors scroll smoothly and stop 80px below the viewport top;
  reduced-motion preference switches the transition back to instant.
- The hero reveals copy, actions, and media as three groups. Remaining page
  content reveals by major component, never by individual CTA button; the footer
  is excluded. The live-calls line grows with scroll and activates complete steps
  as it reaches their numbered markers.
- Touch devices must not depend on hover.

## Section routing

Read the matching file before changing a section:

- `pages/header.md` — `662:268`
- `pages/hero.md` — `611:1161`, `611:1162`
- `pages/problem.md` — `611:1188`, `611:1189`, `611:1213`, `611:1215`
- `pages/cta.md` — `611:1217`
- `pages/tabs.md` — `611:1227` plus five state nodes
- `pages/impact-cta.md` — `611:1273`
- `pages/bot.md` — `611:1288`; compare handle `611:1308`
- `pages/host.md` — `611:1335`
- `pages/calls.md` — `611:1355`
- `pages/outcomes.md` — `611:1402`
- `pages/pricing.md` — `611:1448`
- `pages/faq.md` — `611:1504`
- `pages/footer.md` — `700:338`
- `pages/interactions.md` — project hover rules

Current rules and status are in `projects/content-workshop/AGENTS.md` and
`projects/content-workshop/STATE.md`. Git history contains implementation
provenance.
