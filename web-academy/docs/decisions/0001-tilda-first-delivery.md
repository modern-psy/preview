# ADR-0001: Tilda-first delivery

- Status: accepted
- Date: 2026-07-16
- Scope: repository
- Source: user

## Context

Academy landings are developed and tested locally, while production publishing
is performed through Tilda HTML blocks.

## Decision

Deliver semantic, self-contained HTML, CSS, and JavaScript without a required
runtime framework or bundler. Tilda remains the production target. Deployment to
another platform requires explicit authorization for that project and purpose.

## Consequences

- Dependencies must have a documented Tilda loading path.
- Local verification does not imply deployment.
- Preview/archive authorization does not change the production architecture.
