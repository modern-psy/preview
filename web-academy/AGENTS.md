# Web Academy — repository guidance

## Scope and delivery

- Build and verify Academy landing pages locally; Tilda is the production host.
- Do not deploy elsewhere unless the user or the nearest project `AGENTS.md`
  explicitly authorizes that preview or workflow.
- Keep each landing isolated in `projects/<slug>/` with semantic plain HTML,
  CSS, JavaScript, assets, a short README, and its own project context.
- Do not add a framework, build runtime, or dependency without a demonstrated
  need, user approval, and a documented Tilda transfer path.
- Final Tilda markup must be self-contained; it must not silently depend on
  repository-local `shared/` files.

## Context routing

Read only what the task needs, in this order:

1. This file.
2. The selected project's `AGENTS.md` and its `STATE.md` when that file exists.
3. The matching file under `rules/`.
4. The relevant design-system page, decision record, registry row, or library
   integration guide.

Do not transfer content, values, assets, grids, or exceptions between projects
unless a shared rule or the current user explicitly requires it.

Canonical routes:

- Memory lifecycle: `docs/memory/README.md`.
- Component architecture: `rules/engineering/components.md` and the repo skill
  `$css-components`.
- New Academy landing or component reuse: read
  `shared/academy/new-landing.md`, the catalog `shared/academy/README.md`, and
  the selected components' contracts. Follow
  `rules/engineering/components.md#новый-лендинг-из-общих-компонентов`.
- Web Components platform standard and MDN guide/API map:
  `rules/engineering/web-components-mdn.md`. Follow it for component design;
  read the relevant API sections before using Custom Elements, Shadow DOM or slots.
- Tilda section packaging, identifier isolation, spacing, popups, and release
  gates: `rules/engineering/tilda-delivery.md`. SVG, masks, transparent
  placeholders, and fragment limits: `rules/engineering/tilda-svg-and-masks.md`.
- Ready FAQ, animations and states: `shared/academy/faq.md`.
  Reuse the existing `faq_*` + accordion implementation in shared Academy.
- Complete Hero, Academy showcase and CTA blocks: `shared/academy/hero.md`,
  `shared/academy/academy-showcase.md`, `shared/academy/cta.md`.
  Reuse whole compositions and shared behavior; copy, media and action destinations
  remain owned by the landing.
- Ready Academy lead form and its integration: `shared/academy/lead-form.md`.
  Reuse its opt-in CSS/JS; keep project fields/destinations in `data/form-contract.json`.
- Custom-form bridges to native Tilda forms, CAPTCHA, success events, and CRM
  verification: `rules/engineering/tilda-form-bridges.md`.
- Animated same-page anchors: `shared/academy/anchor-scroll.md` and
  `rules/engineering/components.md#якорная-навигация`. New landings must use
  this shared behavior; do not copy project scroll handlers.
- Semantic accessibility: `rules/product/semantic-accessibility.md`.
- Russian typography and non-breaking line contracts:
  `rules/product/typography.md`.
- SEO and media semantics: `rules/product/seo.md`.
- Client-First implementation: `docs/libraries/client-first/implementation.md`
  and its checklist.

## Implementation

- Reuse the complete matching sections and nested components from the catalog
  `shared/academy/README.md`, including responsive layouts, states and behavior. Follow
  `rules/engineering/components.md`; do not fork their CSS/JS into landings.
- Hero reuse includes every nested component. For the reference dual-action
  Hero, use `shared/academy/hero-render.mjs` and project data; do not hand-edit
  generated Hero regions. Follow `shared/academy/hero-checklist.md` when changing
  or handing off the section.
- Treat structured Figma Dev Mode data as the visual source of truth. Request
  context without screenshots when supported; do not trace or rasterize a
  screenshot as implementation.
- Compare Figma values with the approved shared system in `shared/academy/spacing.md`.
  Report suspected design inconsistencies explicitly: section, responsive band,
  role, Figma value, and component value. Use the approved shared role by default;
  never silently introduce a local exception for a likely design mistake.
- Translate generated React/Tailwind references into semantic HTML, CSS, and
  JavaScript with project-owned Client-First naming.
- Use fluid flex/grid ratios, intrinsic sizing, `max-width`, and `clamp()`.
  Fixed geometry needs an intrinsic or functional reason.
- Use readable purpose-based classes: underscore folders for custom classes,
  hyphenated reusable utilities, and meaningful `is-*` variants. Avoid BEM,
  generated names, deep selector chains, empty spacers, and broad global styles.
- Prefer semantic elements, parent `gap`, single-class selectors, CSS custom
  properties, `rem` sizing, and exact pixels for 1px device strokes.
- Dark sections, including pricing, use the shared
  `section-spacing_component.is-inset` contract in `shared/academy/section-spacing.md`.
  Their internal top/bottom padding uses `--section-inset-space`; never substitute
  the external inter-section rhythm `--section-space` for this role.
- Use `shared/academy/responsive.md` for current and future Academy components;
  its JSON owns all four bands and keeps CSS/JS consistent. Shared typography,
  spacing and radii are routed by `shared/academy/README.md`. Explicit older
  project exceptions do not become defaults for a new landing.
- Keep JavaScript initialization idempotent for Tilda editor/preview reloads.

## Accessibility, media, and motion

- Preserve landmarks, heading order, reading order, visible focus, keyboard
  operation, native/ARIA state synchronization, contrast, zoom, and 44px targets.
- Authored links need a clear hover/focus treatment; buttons never translate,
  lift, or scale on hover.
- All authored buttons and links must show `cursor: pointer` on hover, including
  preview controls awaiting their destination. Apply this to CTA components too;
  do not override their cursor with `default` for `aria-disabled` preview states.
- Images are non-draggable without blocking links, focus, clicks, or the context
  menu. Meaningful images need contextual `alt`; decoration uses empty `alt`.
- Prefer native HTML and CSS transitions. Motion is the default JavaScript
  animation library; use GSAP only for a justified complex timeline or pin/scrub.
- Pin delivered CDN versions, animate transform/opacity where possible, respect
  reduced motion, and keep essential content visible if JavaScript fails.
- Simplify or remove non-essential scroll, pointer, continuous, and
  compositor-heavy motion on touch/mobile layouts.

## Verification and change discipline

- For substantive UI work, use the installed `ui-ux-pro-max` skill without
  overriding project or Figma sources.
- At the start of every visual implementation or responsive review, start a
  local static server and connect the in-app Browser before editing. Report an
  unavailable Browser backend immediately.
- Verify through a local server at 375, 768, 1024, and 1440px plus focus/hover,
  keyboard use, reduced motion, overflow, console/network errors, assets, image
  metadata, and the Tilda copy/paste path. When responsive rules change, also
  verify both sides of every affected boundary (for example 520/521 and
  767/768px).
- Preserve unrelated user changes. Do not commit secrets or private customer
  data. Do not edit generated Tilda fragments directly when a project builder
  owns them.

## Active memory

- `AGENTS.md` stores mandatory behavior; `STATE.md` stores only current status,
  blockers, and next action; Git stores history.
- Remove `STATE.md` when a completed project has no current blocker or next
  action; its README, rules, source, and Git history remain authoritative.
- Replace stale facts. Remove resolved blockers, old deployments, completed
  steps, superseded decisions, and verification narratives once they no longer
  affect the next task.
- JSON is canonical for structured records. Keep generated TOON for uniform
  registries when it is materially smaller; regenerate it after JSON changes.
  Do not create TOON copies of runtime configs, manifests, source, or prose.
- Put lasting knowledge in the narrowest authoritative file and avoid copying it
  into multiple active documents.
