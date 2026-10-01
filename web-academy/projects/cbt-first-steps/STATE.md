# Current state

## Ready

- Header, eight content sections and footer are implemented locally: hero,
  audience, introductory outcomes, course format, five-card course program,
  speaker, grant CTA, Academy showcase and the adapted legal/contact footer.
- The user approved the current course-program, speaker and grant-CTA sequence
  and visual implementation for continued work on the landing.
- Figma nodes and source boundaries are recorded in `AGENTS.md`; asset
  provenance is canonical in `data/assets.json`.
- Local preview command and URL are recorded in `README.md`.
- The program masks, desktop sticky overlay and static mobile fallback were
  checked locally at the required responsive boundaries; speaker and grant CTA
  were checked at desktop and mobile sizes.
- The final Browser matrix passes at 375, 520/521, 767/768, 991/992, 1024 and
  1440px with no horizontal overflow or broken images. On mobile the program
  WebP containers are square and borderless, so their masks no longer expose a
  rectangular image boundary.
- The Academy showcase now matches the published `trauma-therapy` component at
  1440px, with the Figma-approved 4000-graduate copy and added teachers card.
  The footer uses the header surface/logo, project-width content, text-color
  links without underlines and background-only hover on social icons.
- A reproducible, self-contained Tilda transfer package is generated under
  `tilda/`, including HEAD, BODY, footer script, JSON-LD schema, insertion
  instructions and manifest hashes. Its approved canonical is
  `https://modern-psy.ru/cbt-first-steps`; OG image is intentionally omitted.

## Active blockers

- The post-course grant/lead destination is still provisional; current CTA
  links intentionally return to `#programma` until the destination is supplied.
- The current Academy responsive pass appears to work, but remains an open
  design decision for later user review. The test version combines reduced
  phone/graduate portraits on 521–1439px with heading/body clamps on the
  two-column 992–1439px layout (24/16px at 992px through 36/20px at 1440px).
  Mobile portrait through 520px and the composition from 1440px are unchanged.
  Before treating this as final, compare the combined solution with an
  alternative that changes only the desktop body-text size.

## Next-agent checklist

1. Read the root `AGENTS.md`, this project's `AGENTS.md`, this file and only the
   rule files relevant to the next requested component.
2. Start the local server using `README.md` and connect the in-app Browser
   before any visual edit. Report an unavailable backend immediately.
3. Take the next section only from the Figma node supplied by the user. Reuse
   `vvedenie` or another Academy component only when the user explicitly says
   what to borrow.
4. Preserve the approved header/hero widths, original hero height, desktop
   heading break, 150px section gap and project-owned class naming. Preserve the
   post-format order (program → speaker → grant CTA), the five-card stack,
   masks, `48rem` sticky boundary, static mobile fallback, intentional grant
   copy «все 4 урока», production-matched Academy typography at 1440/1680 and
   the footer's text-color/no-underline link states.
5. Save every newly supplied/Figma asset under `assets/`, reference it from the
   markup and update `data/assets.json` with its stable source and Figma node.
6. Keep semantic heading/list structure, Russian non-breaking typography,
   visible focus states and decorative `alt=""` treatment.
7. After visible CSS changes, bump the stylesheet query version. Run
   `git diff --check`, rebuild the Tilda package, run
   `node --test tests/tilda-bundle.test.mjs`, validate JSON/assets and follow the
   root responsive, overflow, keyboard, motion, console and network matrix.
8. Keep the current Academy responsive combination as a review candidate. When
   the user returns to this decision, compare it with a version that changes
   only the desktop body-text clamp; do not finalize or remove the heading and
   media scaling without that explicit review.
9. Update `README.md` only for durable component/preview documentation;
   replace this state with the next current blocker/action rather than adding a
   session history.

Next action: continue the landing work while keeping the Academy responsive
combination pending for explicit later review before the next production
update.
