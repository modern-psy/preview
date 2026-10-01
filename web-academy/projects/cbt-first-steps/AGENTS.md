# «Первые шаги в КПТ» — project guidance

## Scope

- Project root: `projects/cbt-first-steps/`.
- Target landing: бесплатный мини-курс «Первые шаги в КПТ».
- Visual source of truth: Figma file `kIiNhqIays6iWMN0oE6RsF`.
- Current Figma nodes: header/hero mask `330:4909`, hero content `330:5189`,
  audience `330:4919`, outcomes `330:4957`, course format `330:5202`, course
  program `330:4999`, speaker `330:5246`, grant CTA `330:5234`, Academy
  showcase `366:66`.

## Source boundaries

- Follow the repository root rules, Client-First naming, semantic HTML,
  accessibility and Russian typography rules.
- `asp-deploy/apps/preview/vvedenie` is a composition reference only. Do not
  edit that landing or copy its class names, global dependencies or generated
  Tilda fragments. Recreate approved composition with classes owned by this
  project.
- Reuse from other `web-academy` projects only when the user explicitly asks.
  Keep this landing self-contained for its eventual Tilda transfer.
- For every new section, use its Figma Dev Mode node as the visual source of
  truth. Do not infer values from another landing unless the user explicitly
  names that source.

## Current delivery contract

- `index.html`, `styles.css` and `script.js` are the editable source.
- `assets/` holds project-owned source assets. Stable external asset URLs and
  their provenance are recorded in `data/assets.json`.
- The approved section order after `course-format` is: five-card course program,
  speaker, grant CTA, then Academy showcase and footer. Preserve this order
  unless the user supplies a new Figma sequence.
- The course-program cards use CSS sticky positioning; `script.js` only tunes
  their stopping point for short viewports. Content and normal-flow layout must
  remain usable without JavaScript and under reduced motion.
- Approved geometry inherited from `vvedenie`: header bar `max-width: 85rem`
  with its responsive gutters, full desktop hero content `max-width: 80rem`,
  and the hero lead/CTA column `max-width: 30rem`. The implementation keeps
  project-owned class names.
- Keep the desktop hero at its original `46.875rem` height; do not restore the
  rejected viewport-height variant. The hero heading has a desktop-only line
  break after «Первые».
- Keep the desktop gap from the hero to the audience section at `9.375rem`
  (150px), following the Academy layout contract.
- Preserve the current header composition: Academy logo from `web-academy`,
  promo and CTA composition from `vvedenie`. Destinations remain provisional
  until the user supplies production anchors.
- Save project-specific supplied/Figma assets under `assets/`, reference them
  through project URLs, and record source provenance in `data/assets.json`.
  Do not replace the registered astroid URL without a user request.
- Preserve the five course-program cards, their `20px` desktop overlap, exact
  Figma alpha masks and static mobile/reduced-motion fallback. Their composition
  is adapted from `asp-preview/asp-deploy/apps/preview/vvedenie` with classes
  owned by this project.
- Keep the course-program stack sticky from `48rem` upward and static through
  `47.9375rem`. Preserve the five supplied WebP images, source order and their
  matching masks.
- The speaker structure and assets are the user-approved reuse source from
  `projects/what-if-become-a-psychologist`; copy and geometry follow Figma node
  `330:5246` in this project.
- The grant CTA follows Figma node `330:5234`. Its phrase «Посмотрите все 4
  урока…» intentionally differs from the five-card program and remains as
  approved Figma copy until the user explicitly changes it. Its current
  `#programma` destination is provisional until the production anchor is known.
- The Academy showcase follows Figma node `366:66` and adapts the approved
  component from `projects/trauma-therapy` with project-owned CSS. It includes
  «Более 4000 выпускников» and the additional «Более 60 преподавателей» card;
  that card reuses the left hero image from
  `projects/what-if-become-a-psychologist` at the user's request.
- Preserve the Academy showcase type scale while its phone and graduate
  portraits progressively reduce from 1439px down through narrow desktop and
  mobile-landscape widths. Keep the approved media composition unchanged at
  1440px and above and keep mobile portrait through 520px unchanged.
- Within the two-column Academy desktop range from 992px through 1439px, card
  headings and body copy use fluid clamps that start at 24/16px and return to
  the approved 36/20px sizes at 1440px. Do not flatten these values back to the
  desktop maximum at the 992px layout switch.
- The footer adapts the structure from
  `projects/what-if-become-a-psychologist`, uses the header's white surface and
  logo, primary-text links with muted hover states, and `container-content`
  width.
- Bump the `styles.css` query version in `index.html` after visible CSS changes
  so the local review does not use stale styles.
- `build-tilda-bundle.mjs` is the sole generator for `tilda/head.html`,
  `body.html`, `footer.html`, `schema.html`, `README.md` and `manifest.json`.
  Generated files are never edited directly. The package must remain
  self-contained, keep BODY below 65,000 characters and pass
  `node --test tests/tilda-bundle.test.mjs`.
- The production page slug and canonical are `cbt-first-steps` and
  `https://modern-psy.ru/cbt-first-steps`. OG image is intentionally omitted.
