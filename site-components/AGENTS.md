# Site components — repository guidance

- Follow `../AGENTS.md` and the component standard at
  `../web-academy/rules/engineering/components.md`.
- Do not add a component until it has two real consumers with the same semantic
  contract and both are verified after promotion.
- One directory owns one public component. Document its markup, CSS API,
  behavior hooks, state/events, accessibility contract, fallbacks, lifecycle,
  tokens, and Tilda placement in that directory's `README.md`.
- Prefer semantic HTML/CSS. A stateful Custom Element must use a hyphenated tag,
  Light DOM by default, progressive enhancement, guarded registration,
  idempotent initialization, and complete cleanup.
- CSS classes are styling API; JavaScript uses `data-js` or the Custom Element
  API. Do not couple behavior or analytics to presentation classes.
- Keep demo and source portable. A delivered landing must contain the required
  implementation and must not import repository-local files at runtime.
- Keep the implementation catalog empty until the first component satisfies the
  promotion rule. Do not add placeholder source files.
