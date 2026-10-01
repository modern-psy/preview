# Web Academy memory system

This repository uses layered, source-controlled memory so an agent can recover
the right context without loading every prior session.

## Layers and authority

| Layer | Purpose | Update rule |
| --- | --- | --- |
| Root `AGENTS.md` | Mandatory repository-wide behavior | Only recurring global rules |
| `rules/**/*.md` | Detailed mandatory standards by domain | Narrowest matching rule file |
| Project `AGENTS.md` | Mandatory rules for one landing | Project rules and read routing |
| Project `STATE.md` | Active blockers and next actions | Keep only while action remains |
| `docs/decisions/*.md` | Current repository decisions | Keep only decisions that still govern work |
| Project `data/*.json` | Queryable current decisions/assets/checks | Canonical structured source |
| Design-system files | Exact visual/component source | Update the matching component only |
| Git history | Superseded facts and implementation provenance | Consult only when provenance is required |

The narrowest applicable instruction wins. A current user instruction overrides
repository memory. A project design-system rule overrides generic design advice.

## Reading protocol

For a normal project task:

1. Read the root and nearest project `AGENTS.md` files.
2. Read the project `STATE.md` when that file exists.
3. Read only the thematic rule, design-system page, ADR, or structured records
   related to the component being changed.
4. Consult Git history only when current sources are incomplete or the
   provenance of a decision matters.

Do not preload every ADR, registry, or section file.

Do not aggregate `STATE.md` or project rules across landings. A completed
landing's context remains isolated in its own directory and is not active memory
for the currently selected project.

## Writing protocol

At a meaningful checkpoint:

1. Update `STATE.md` with current blockers and concrete next actions, or remove
   it when no active work remains.
2. If the user established a lasting implementation or product standard, update
   the narrowest matching file under `rules/`.
3. If the user made a lasting project decision, add or update the narrowest
   canonical decision record. Remove obsolete and superseded rows after the
   current fact is consolidated; Git preserves their history.
4. Update the matching design-system page when the decision changes exact UI or
   behavior.
5. Update a structured JSON registry when the fact benefits from filtering or
   tabular retrieval.
6. Update an `AGENTS.md` only if the rule must be followed on every future task in
   its scope.

Avoid repeating full prose. Link to the authoritative file and summarize only
what is necessary for routing.

Active memory must not become a session log. Remove completed implementation
steps, old deployment IDs, superseded values, rejected variants, resolved
blockers, and historical verification narratives once they no longer affect the
next task. Do not retain a standalone handoff when its current rules and state
already exist in authoritative files.

A completed project may keep a narrowly scoped `IMPLEMENTATION.md` only when it
records durable production failure modes, their causes, and regression guards.
It must not repeat current status, next actions, deployment chronology, or a
session narrative; those belong to `STATE.md` or Git history.

## Structured record contract

Project records should use stable IDs and these metadata fields where applicable:

- `id`: immutable identifier;
- `scope`: project/component boundary;
- `status`: normally `active` or `complete`; pending work belongs in `STATE.md`;
- `updated_at`: ISO date;
- `source`: user, Figma node, code, audit, or another traceable origin;
- `canonical_path`: authoritative repository file.

Keep records small and use the same primitive-valued fields across an array when
possible. This makes filtering and compact serialization reliable.

## TOON transport

JSON remains canonical. Generated TOON is a compact read-only representation of
uniform records and must never be edited instead of its JSON source.

The repository pins `@toon-format/cli`. Registered JSON/TOON pairs and their
field/count contracts live in `docs/memory/registries.json`. Regenerate all
compact registries after JSON changes:

```sh
npm ci
npm run memory:toon:all
npm run memory:check
```

Adding or removing a compact registry requires updating the manifest. The
validator discovers registries only through that file; package scripts must not
accumulate project-specific commands.

Keep TOON only where its compactness is useful; do not create copies of prose,
source code, runtime/deployment configuration, manifests, checksums, or irregular
data. A new candidate should be a uniform registry used for retrieval and should
show material measured savings before its generated file is tracked.

## External systems

- GitHub owns code and version history.
- Figma supplies visual design values. Explicit user corrections and approved
  shared component roles take precedence over superseded Figma values; report
  suspected conflicts using `shared/academy/spacing.md`.
- Linear owns task status and priority.
- Notion may own product notes, meeting outcomes, and research.
- Repository files own mandatory implementation rules and project continuation.

Store a fact once and link to it elsewhere. External memory is a retrieval layer,
not a replacement for version-controlled rules.
