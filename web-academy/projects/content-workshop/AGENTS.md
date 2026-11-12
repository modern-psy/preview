# Content Workshop — project rules

These rules apply only to `projects/content-workshop/`.

## Sources and workflow

- Tilda is production; the canonical URL is
  `https://modern-psy.ru/masterskaya-professionalnogo-kontenta`.
- Canonical sources are `index.html`, `styles.css`, `script.js`, and `schema.org`.
- The visual/component source is
  `../../design-system/academy-ambassadors/MASTER.md` plus only the matching
  file under `pages/`. Figma values and later user corrections remain
  authoritative.

## Invariants

- Keep semantic plain HTML/CSS/JS, Client-First naming, fluid layout, accessible
  progressive enhancement, idempotent initialization, and page-scoped Tilda
  protection.
- Do not transfer values from another landing. Preserve unrelated user changes.
- Treat the two comparison videos in `data/assets.json` as one atomic pair.
- Preserve the current CTA routing, visible FAQ/schema agreement, and pricing
  contract unless the user requests a content change.

## Tilda package

- Since 12.11.2026 the page is delivered section by section
  (`../../rules/engineering/tilda-delivery.md`): `build-tilda-files.mjs`
  exclusively generates `tilda/head.html` (font + JSON-LD), `styles-N.html`,
  `NN-body-<section>.html` (one T123 per section), `scripts.html`,
  `preview.html`, `README.md`, and `manifest.json`; never edit them directly.
  Every T123 file stays under 65 000 characters.
- Local images need CDN URLs in `assetUrls` inside the builder; the build stops
  and lists the files that still have no URL.
- `hero-variants.html` is only a redirect to `index.html`; edit the canonical
  sources, not the draft.
- After source changes run the builder twice, the Tilda test, `node --check` on
  `script.js`, `npm run memory:check`, and `git diff --check`.
- Generated BODY must have no repository-relative runtime assets.
