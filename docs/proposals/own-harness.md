# Proposal: measure components in our own harness, not in documentation demos

Status: accepted by the owner on 2026-11-08 (raised in his review the same day).

## Problem

Today each target is a public demo or Storybook story. That has three costs:

1. **We measure the demo, not the component.** A demo is someone else's choice of props and
   surroundings (Atlassian's docs example sets `isSearchable={false}`, so we use another example;
   demo pages often have nothing focusable after the component, which makes the Tab rule
   inconclusive).
2. **Versions are unknown for Fluent 2 and Primer.** Their Storybooks build from the monorepo, so
   "every measured value has provenance" has a hole exactly where it matters.
3. **Setup differs per target.** Each adapter types different names to reach "3 chips, empty
   input", because each demo has its own data.

## Proposal

A small harness app (one per system, Vite, not part of the Atlas site) that installs each
system's **published npm package at a pinned version**, renders the component with the props a
team would use by default, the same three people, a focusable element before and after it, and the
system's own theme provider. The engine measures that page.

- Version comes from the lockfile: exact, verifiable, no "unknown".
- Same initial state everywhere: the adapters shrink to locators.
- Before and after elements make the Tab rule judgeable for every system.

## Costs and risks

- **Fairness:** "default props" is still our choice. Each harness file must say which props it
  sets and why, linked from the evidence card; maintainers can correct it.
- **Licences:** Atlaskit, Fluent and Primer are MIT or Apache 2.0, so rendering them locally is
  fine. Check each before adding it.
- **Maintenance:** one small app per system, updated when we bump a pinned version. Renovate or
  a monthly bump.
- **Dependencies:** Vite and each system's packages, harness only (never in the site bundle).
  Needs approval per CLAUDE.md 7.

## Recommendation

Do it before publishing: it removes "version unknown" and the demo-specific inconclusive results.
Keep the demo URL on each card as "Docs example" for context. Record the decision as ADR 0005.
