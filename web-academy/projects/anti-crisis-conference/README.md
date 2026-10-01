# Anti-crisis conference landing

Semantic HTML, CSS, and JavaScript landing prepared for Tilda.

- Final canonical URL: <https://modern-psy.ru/anti-crisis-conference>
- Figma: `qEvfVv94ZE2c7rTJw7MlQG`
- Current rules: `AGENTS.md`

## Files

- `index.html` — canonical page markup.
- `styles.css` — page-scoped responsive styles.
- `script.js` — idempotent interaction and integration logic.
- `assets/` — local SVG sources embedded by the Tilda builder.
- `build-tilda-bundle.mjs` — canonical Tilda transfer generator.
- `tilda/` — generated HEAD, BODY, FOOTER, manifest, and placement guide.
- `tests/` — registration and transfer-package regression checks.

## Implemented page

The page contains the header, floating anchor navigation, hero, audience,
market-shift scene, practice-reality cards, benefits, expert format, speakers,
partners, topics, post-conference understanding, registration, and Academy
footer.

Current dynamic features include:

- native sticky/scroll-linked editorial scenes with reduced-motion fallbacks;
- Splide `4.1.4` speaker carousel with wheel, keyboard, drag, and arrow input;
- continuous partner and recordings marquees;
- independent accessible topic accordions;
- free BotHelp registration and paid native Tilda checkout;
- `intl-tel-input@29.1.2` country selection, formatting, and validation.

Exact content order, responsive invariants, integration contracts, and approved
exceptions are intentionally kept only in `AGENTS.md`.

## Local checks

From the repository root:

```sh
node projects/anti-crisis-conference/build-tilda-bundle.mjs
npm run memory:check
node --test \
  projects/anti-crisis-conference/tests/registration.test.mjs \
  projects/anti-crisis-conference/tests/tilda-bundle.test.mjs
node --check projects/anti-crisis-conference/script.js
git diff --check
```

Serve the repository through a local static server and open
`/projects/anti-crisis-conference/` only when visual review is requested.

## Tilda transfer

1. Regenerate the bundle after every source or local SVG change.
2. Append `tilda/head.html` after existing analytics; keep exactly one site-wide
   BotHelp loader and let Tilda own final structured data.
3. Paste `tilda/body.html` into one T123 block.
4. Keep the native ST100/T706 cart with required Name, Email, and Phone fields.
5. Paste `tilda/footer.html` into the final T123 block below the cart.
6. Publish before testing; T123 code is not operational in the editor.

The generated BODY is self-contained and has no repository-relative assets.
See `tilda/README.md` for the exact current package and checksums.

## Shared component map

- `conference-layout_*` — responsive grid shell.
- `conference-section_*` — standard section-heading system.
- `conference-staggered_*` — staircase lists and cards.
- `conference-editorial_*` — speakers/topics heading-photo scenes.
- `conference-pill` — shared compact pill foundation.
- `conference-replenishment_*` — shared note and badge.
- `conference-body-copy` — standard descriptive typography.
