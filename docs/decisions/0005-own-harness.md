# 0005. Measure published packages in our own harness, not documentation demos

- Status: accepted (2026-11-08), from `docs/proposals/own-harness.md`
- Scope: every third-party target from now on; supersedes the "official public demo" preference
  in CLAUDE.md 8.5 for systems that publish an npm package

## Context

M2 measured each system's public demo or Storybook story. Review on 2026-11-08 showed the cost:

- A demo is someone else's choice of props and surroundings. Demo pages often have nothing
  focusable after the component, so the Tab rule came out inconclusive for reasons that have
  nothing to do with the component.
- Fluent 2 and Primer Storybooks build from their monorepos and expose no package version, so two
  of three systems carried "version unknown".
- Each adapter had to type different values to reach the shared starting state.

## Decision

`packages/harness` is a small Vite app with one page per system. Each page renders the system's
**published npm package at an exact pinned version** (no ranges), inside the system's own
provider or theme, with:

- the same three selected people as the reference (Irene Oh, Greg Fisher, Hiroshi Matsui), set
  through the component's documented props, and the reference's directory as options;
- a labelled text field before the component ("From") and after it ("Subject"), as on the
  reference page, so leaving the field in either direction is observable;
- a `<meta name="earshot-package">` with the package name and the version read from the
  installed package at build time.

Adapters for these targets only locate the component and confirm the starting state. The docs demo
URL stays in `data/targets.yaml` as `docs-example` and on the evidence card.

## Rules for harness pages

1. Use the component as its docs show it. Every prop we set is listed in a comment at the top of
   the page file with the reason; the evidence card links that file. Maintainers can correct it.
2. Pick versions at least two weeks old (supply-chain caution) and bump them on purpose, with a
   re-measure.
3. Check each package's licence before adding it (Atlaskit Apache-2.0, Fluent and Primer MIT).
4. The harness never ships with the Atlas site.

## Consequences

- Versions are exact and verifiable (`packages/harness/package.json` and `pnpm-lock.yaml`).
- The Tab rule is judgeable for every system.
- "Default props" is still a choice we make; rule 1 keeps it visible and correctable.
- New dependencies, harness only: Vite, `@vitejs/plugin-react`, and each system's packages.

## Amendment (2026-11-16): variants of a system, and a file behind every recorded note

Decided on 2026-11-16, after the verdict audit of the menu button.

- **What went wrong.** Fluent 2's menu button was first measured as the Default story of Menu, with a plain Button, and then as MenuButton, its own component for this. The first recording was worth keeping: it is the first example a reader of the Menu docs sees. It was kept as a note labelled "recorded" whose measurement file no longer existed, so the site would have printed "Recorded by the engine" beside a statement no reader could check.
- **`variant-of`** on a measured entry of `data/targets.yaml`: the adapter of the counted entry of the same system. A variant has its own harness page, its own adapter and its own measurement file, written by the engine like any other. It is never a column of the matrix and never counted: the site attaches it to the system it belongs to. It must say why in `not-counted`.
- **`measurement`** on an observation whose source is `recorded`: the adapter whose file the note was read from. Left out, it is the system's own measurement. Data validation requires, for every recorded note, that the file exists, that it is the system's own or one of its variants, and that the note's date is the day of that measurement. A note with any other source may not name a measurement.
- **Where a variant is shown.** In the evidence of the system it belongs to, beside the note that cites it, with its own provenance (version, engine, date) and a link to its raw JSON. Nowhere else.
- **Not done.** No naming convention for adapters carries this meaning: a rule that validation cannot check is not a rule.
- **What it is for besides this case.** Ways to build a pattern that are already named as "not measured" in a `variant` line (Atlassian's Select with isSearchable off, MUI's freeSolo, Chakra UI's TagsInput with Combobox) can become evidence the same way if one is ever needed.
- **First use.** `fluent-default-story`, a variant of `fluent` for the menu button, measured on 2026-11-16 on engine 0.15.2: it differs on `expanded`, and every other verdict is as on the MenuButton page.
