# Preview contour — repository guidance

## Scope

- These rules apply to everything under `apps/preview/` and supplement the root
  `AGENTS.md`.
- Existing landing directories are colleague-owned legacy work. Do not modify,
  rename, migrate, or reformat them unless the current task names them.
- `web-academy/` is the authoring foundation for new Academy work: project
  sources, rules, tokens, design-system decisions, and verification tools.
- `site-components/` is the promoted cross-site component library.
- The existing `design-system/` is a generated copy of the repository's legacy
  root design system. Never overwrite it with Web Academy files.

## Context routing

Before changing a landing, read in order:

1. the root `AGENTS.md` and this file;
2. the landing's own `AGENTS.md` and current `STATE.md`, when present;
3. the matching rule under `web-academy/rules/`;
4. the relevant design-system page, component contract, or data registry.

Fetch `origin/main` before beginning a new landing task and inspect the selected
remote directory: its source context may have been added by another collaborator
and may not exist in an older local checkout.

## Delivery boundary

- A deployable preview remains a self-contained sibling directory
  `apps/preview/<slug>/` with its own HTML, CSS, JavaScript, and assets.
- Final Tilda markup must not depend at runtime on `web-academy/shared/`,
  `site-components/`, a local build step, or repository-only URLs.
- Do not mass-migrate existing landings. Reuse is introduced project by project
  through an explicit task and a verified transfer path.

## Components and memory

- Build a component within its first project. Promote it to `site-components/`
  only for a second real consumer with the same semantic contract.
- Prefer semantic HTML and CSS. Use a Custom Element only for justified state or
  lifecycle; Light DOM and progressive enhancement are the defaults.
- JavaScript hooks use `data-js`; initialization must be idempotent and cleanup
  must release listeners, observers, timers, media, and animation instances.
- JSON is canonical for structured registries. Generate TOON only for uniform
  registries when it is materially smaller; never use TOON as a second source of
  truth.
- Run memory commands from `apps/preview/web-academy/` and update its registry
  manifest whenever a promoted component registry is introduced.
