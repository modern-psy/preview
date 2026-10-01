# Content Workshop structured memory

The JSON file in this directory is canonical, queryable current project data:

- `assets.json` — important asset URLs, roles, and atomic replacement groups;

Decisions already enforced by source, tests, or project rules are not duplicated
here. Superseded records and verification runs belong to Git history.

Run the repository validator after editing:

```sh
node scripts/memory-check.mjs
```

`assets.toon` is generated from `assets.json` with the pinned CLI. Never edit it
directly. Regenerate all registered TOON files from the repository root after
JSON changes:

```sh
npm run memory:toon:all
npm run memory:check
```

Query only the records needed for the current task.
