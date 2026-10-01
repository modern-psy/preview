---
name: css-components
description: Build, extract, refactor, or review reusable plain HTML/CSS components and stateful Web Components for Web Academy landings. Use for component APIs, CSS architecture, tokens, variants, cascade isolation, container queries, progressive enhancement, or MDN compatibility checks in Tilda-ready frontend work.
---

# CSS components

Build the smallest reusable abstraction that satisfies the current landing.

## Load context

1. Read the root and nearest project `AGENTS.md` plus project `STATE.md`.
2. Read `rules/engineering/components.md` completely.
   Follow its MDN platform standard in `rules/engineering/web-components-mdn.md`:
   read the concept map and section workflow, then the relevant API sections.
3. Read only the relevant accessibility, Client-First, design-system, or library
   file routed by those instructions.
4. Inspect existing markup, styles, behavior hooks, tokens, and repeated patterns
   before proposing a new abstraction.
5. Confirm the target landing and whether reuse is local to one page, one project,
   or intentionally repository-wide; never infer cross-project reuse.

## Choose the component level

Prefer, in order:

1. semantic HTML with project-owned CSS;
2. a token, global style, or small utility;
3. a reusable HTML/CSS component;
4. an autonomous Custom Element only when shared state, lifecycle, events, API,
   or justified isolation requires JavaScript.

Use Light DOM by default for Tilda content. Use Shadow DOM only when documented
isolation outweighs editing, SEO, integration, and styling costs.

## Implement

- Preserve native semantics and content without JavaScript.
- Use Client-First purpose-based classes and separate `data-js` behavior hooks.
- Consume project tokens; expose only component-prefixed custom properties that
  callers genuinely need.
- Keep layout intrinsic and container-friendly. Use container queries only when
  the component must respond to its containing block rather than the viewport.
- Keep selectors shallow and page/component scoped. Do not use `!important`
  except an existing documented Tilda-protection boundary.
- Make initialization idempotent and release listeners, observers, timers,
  media, and animation instances on disconnect or teardown.
- Document the public contract and Tilda placement next to the implementation.

## Verify platform behavior

Use current MDN documentation when implementation depends on browser API syntax,
support, accessibility behavior, or an unfamiliar CSS feature. Prefer the
narrowest relevant MDN page, including:

- Web Components: <https://developer.mozilla.org/en-US/docs/Web/API/Web_components>
- Custom elements: <https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements>
- Custom properties: <https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties>
- Container queries: <https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries>
- Cascade layers: <https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40layer>
- CSS scoping: <https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40scope>

Do not copy general MDN documentation into the repository. Record only the
project decision or compatibility fallback that must remain durable.

Run the project checks and the repository viewport/accessibility matrix. Confirm
multiple instances, no-JavaScript behavior, reduced motion, reconnect/cleanup,
and self-contained Tilda transfer.
