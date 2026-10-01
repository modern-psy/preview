# Outcomes section override

Figma Dev Mode node `611:1402` defines the section.

- Full shared 1440px container; header-to-grid gap: 70px. Header max-width: 982px.
- Desktop cards use three equal fluid columns with 16px gaps. Large cards keep
  `469 / 452`; middle cards keep `470 / 218`. No fixed heights.
- Wide support card keeps the desktop `1440 / 218` proportion but may grow with
  content. It uses the supplied large, medium, and small SVG orbit assets with
  Tilda avatars. Their centers are percentage-anchored directly on the respective
  orbit paths, so the geometry scales with the card. All are decorative and use
  empty alt.
- The three orbit/avatar pairs move together with the support card's scroll
  progress, so their centers remain locked. The left pair travels 84px downward,
  the middle pair travels 100px upward, and the right pair travels 24px downward.
  Motion uses only transforms and restores the static composition for reduced
  motion or if the Motion CDN fails.
- Card padding: 20px; radius: 16px. Headings: 28px/34px; copy: 18px/26px.
- At narrow desktop/tablet widths, the first four cards form one full-width 2×2
  grid and the fifth support card occupies the complete row below. The nested
  desktop grid and stack become `display: contents` so all five cards participate
  in one responsive grid. Equal content-derived `1fr` rows make the support card
  exactly as tall as the preceding tablet cards without a fixed height. Its
  icon-to-copy gap is the shared responsive 20px. Mobile resets rows to `auto`
  and stacks the same cards into one full-width, content-driven column. All
  desktop aspect ratios remain disabled on responsive cards.
- At narrow-desktop/tablet widths, avatar diameters increase proportionally while
  their center coordinates stay unchanged on the orbit paths: left `8.75%`,
  middle `6.75%`, and right `9%` of the support-card width. The existing narrow
  mobile rule still hides the decorative orbit composition at `520px` and below.
