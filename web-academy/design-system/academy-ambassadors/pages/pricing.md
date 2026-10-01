# Pricing section override

Figma Dev Mode node `611:1448` defines the section.

- Full shared 1440px container; header-to-card gap: 70px. The heading can use the
  full section width. The description remains capped at 982px for readability.
- Pricing card uses 32px padding and 32px gaps. Document and visual order is
  subscription tag with price first, benefits second, and the separated CTA with
  its subscription note last.
- Background uses shared `bg-4.webp`, 38.5px blur, and 40% multiply grain. Its
  desktop image box follows Dev Mode at about 409% card width, shifted 31% left
  and rotated 180deg to create the long horizontal color transition.
- Price: `9 900 ₽`, 72px Bold with 16px monthly label. The white CTA reads
  “Оформить подписку”, uses a simple light hover, and never the purple radial
  effect.
- Benefits are an 11-item, two-column fluid grid with 16px gaps. Titles are
  22px/28px Semibold; descriptions are 16px/24px. Each benefit uses the approved
  24px white outline sparkle SVG as a decorative, assistive-technology-hidden
  bullet.
- Tablet centers the subscription tag and price while benefit copy remains
  left-aligned for scanning. The CTA stays centered at the bottom. Mobile
  landscape (`<=767px`) changes benefits to one full-width column without
  changing the sequence. All heights remain content-driven.
