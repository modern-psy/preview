# Anti-crisis conference — project rules

These rules apply only to `projects/anti-crisis-conference/`.

## Sources and workflow

- Tilda is the final host; canonical is
  `https://modern-psy.ru/anti-crisis-conference`.
- Figma file `qEvfVv94ZE2c7rTJw7MlQG` is the visual source. User-supplied Tilda
  assets and later explicit corrections override older Figma values.
- Canonical sources are `index.html`, `styles.css`, `script.js`, local assets,
  the builder, and tests. Code and tests own exact current content, dimensions,
  ordering, crop values, and integration constants.
- When the user requests literal sync from complete Tilda source, copy it
  exactly and use static checks unless visual review is separately requested.

## Invariants

- Preserve semantic plain HTML/CSS/JS, Client-First naming, fluid layout,
  idempotent initialization, accessible progressive enhancement, reduced-motion
  fallbacks, and `.anti-crisis-page` scoping.
- Reuse established project components; section classes contain only genuine
  variants.
- Do not silently change the speaker/partner/topic order, registration modes,
  BotHelp flow, native Tilda cart contract, phone validation, Splide version, SEO
  ownership, or complete Academy footer. Their current code and regression tests
  are the contract.
- Preserve unrelated user changes and do not copy values from another landing.

## Tilda package

- `build-tilda-bundle.mjs` exclusively generates `tilda/head.html`, `body.html`,
  `footer.html`, and `manifest.json`; never edit generated fragments directly.
- Generated BODY must contain no repository-relative assets and must retain the
  builder-owned inline SVG protections.
- After source changes regenerate twice, run memory validation, registration and
  bundle tests, `node --check script.js`, and `git diff --check`.
