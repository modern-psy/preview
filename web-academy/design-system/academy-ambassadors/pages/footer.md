# Footer override

Figma Dev Mode node `700:338` defines the footer.

- FAQ-to-footer spacing is 100px on desktop/tablet and 80px on mobile.
- Footer uses a full-width black surface with the existing fluid page gutters.
  Desktop padding is 60px top and 25px bottom; internal groups use a 32px gap.
- Desktop content is a three-column fluid grid. Identity/contact content occupies
  the first column, legal links the second, and company details align to the
  bottom of the third. Tablet uses two columns with company details below; mobile
  landscape and smaller stack all groups in one column. Responsive legal links
  use adjacent 44px rows with no extra inter-row gap, preserving touch targets
  without the oversized visual spacing.
- The ASP logo reuses the permanent supplied Tilda SVG at its intrinsic 84×30px
  size. Do not use the temporary seven-day Figma asset URL.
- Contact typography follows the node: 18px/1.45 semibold for phone/email and a
  12px Montserrat label for “Отдел продаж”.
- Social links are YouTube, Telegram, and VK. Their 32px pale-lilac circles and
  inline 24px outline SVGs are permanent markup, not remote Figma assets.
- Legal, social, phone, email, registration, and address content mirror
  `modern-psy.ru/footer`. Copyright keeps 2026 as the no-script HTML fallback and
  replaces it with the browser's current year through `[data-current-year]`.
  External social/licence links open in a new tab with `rel="noopener"`.
- Hover uses only a restrained opacity/surface shift; keyboard focus remains
  visible and no link moves or scales.
