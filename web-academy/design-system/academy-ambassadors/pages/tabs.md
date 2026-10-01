# Results tabs override

Figma Dev Mode node `611:1227` defines the section. Nodes `611:1235`,
`623:1787`, `623:1825`, `623:1863`, and `623:1901` define the five active states.

- Section header-to-tabs gap: 72px. Header max-width: 982px; copy gap: 28px.
- Eyebrow uses the shared 12px uppercase pill treatment.
- Heading: 48px/54px Bold, tracking -1.2px, max-width 982px. Purple highlight is
  `#BEACF4`, 12px radius, rotated 0.63deg, and applies only to “держит в работе”.
  On desktop, the two phrases are art-directed block lines; narrow mobile restores
  natural inline wrapping. The split uses semantic spans, never `<br>`.
- Description max-width: 926px, 22px/32px regular, `#1D1D33`.
- Desktop layout uses the Figma ratio `591fr / 833fr` with a 16px gap. These are
  fluid tracks within the 1440px max container, never fixed pixel widths.
- Tab triggers: minimum 80px height, 16px padding, 12px gap, 16px radius,
  18px/26px. Number badge is an intrinsic 40px circle.
- Inactive: `#DFDFDF` background, `#827F8B` text, `#EAEAEA` badge. Active:
  `#18181A`, `#F5F5F5`, white badge with black number.
- Navigation-to-CTA gap: 32px. CTA max-width: 348px with the standard black
  18px/26px treatment.
- Panel: `#FCFCFA`, 0.5px border, 28px padding, 16px radius, 32px internal gap.
- Panel heading: 28px/34px Bold. Content gap: 16px. Cards use 16px padding,
  12px radius, and 12px text gap.
- Reason card background: rgba(255, 200, 60, 0.2). Feature cards use `#EAEAE7`
  and `#18181A` in a two-column 16px-gap grid.
- Tabs use semantic tab roles and support click, Arrow keys, Home, and End.
- Tablet/mobile tab triggers become a horizontally scrollable, snap-aligned row.
  The scroll viewport extends through both page gutters so cards are clipped only
  by the viewport edges while moving in either direction. Matching inline padding
  keeps the first and last cards aligned to the shared gutters at their resting
  positions; `scroll-padding` preserves that alignment for snapping. Each trigger
  stacks its number above the label. Panels move below and feature cards stack on
  narrow mobile. The panel follows the tab lane directly; the CTA moves below the
  active panel so it never separates navigation from its content.
- All text wraps naturally from max-width; no `<br>` tags.
