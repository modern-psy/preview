# ADR-0003: Current-state project memory and TOON transport

- Status: accepted
- Date: 2026-08-04
- Scope: repository
- Source: user

## Context

Repeated rules, session narratives, resolved blockers, and superseded values make
the next task harder to recover accurately. Git already preserves that history.

## Decision

Use a layered memory model:

- small scoped `AGENTS.md` files for mandatory behavior;
- concise `STATE.md` files only while a project has a current blocker or next
  action;
- ADR and JSON records for decisions that still govern work;
- design-system pages for exact component rules;
- Git history for superseded facts and provenance.

Standalone session handoffs are removed after their current facts are
consolidated. Active memory does not retain old deployment IDs, completed build
steps, rejected variants, resolved verification narratives, or superseded rows.

JSON remains canonical for structured data. Generated TOON may be tracked for
uniform registries when it provides a smaller read representation; it is never
edited as a source.

## Consequences

- Agents read only the layer relevant to a task.
- Facts receive scope, status, date, and source metadata where useful.
- Memory updates target one canonical file instead of duplicating prose.
- Current files are periodically consolidated; Git remains the historical record.
- Consumers retrieve only the relevant scope and may use current generated TOON
  for compact decision rows.
