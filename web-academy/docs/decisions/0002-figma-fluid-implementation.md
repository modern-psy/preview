# ADR-0002: Figma values with fluid implementation

- Status: accepted
- Date: 2026-07-16
- Scope: repository
- Source: user

## Context

Figma is the visual source of truth, but desktop frame measurements cannot be
copied as rigid page geometry without breaking responsive behavior.

## Decision

Read structured Figma Dev Mode context without using screenshots as the
implementation method. Preserve authored values while expressing layout through
fluid grid/flex ratios, intrinsic sizing, page gutters, `max-width`, `clamp()`,
and content-driven height. Fixed dimensions require an intrinsic or functional
reason.

## Consequences

- Generated React/Tailwind references are translated to semantic plain code.
- Column measurements become ratios rather than frozen pixel tracks.
- Responsive behavior and accessibility are verified independently of the Figma
  desktop frame.
