# Proposal: measure the libraries people actually use

- Status: draft, for decision
- Date: 2026-11-08
- Scope: input-with-chips; research only, no code and no new dependencies yet

## Why

Atlas measures three systems today: Atlassian, Fluent 2 and GitHub Primer (deprecated). They came
from the candidate list in CLAUDE.md 8.6, which holds only corporate design systems; four of its
seven had no chips field. Component libraries that most React teams build on (MUI, shadcn/ui,
React Aria, Chakra) were never considered. A reader comparing "how do the best systems do it"
expects to find them.

## How we chose

A candidate makes the first wave only if all four hold:

1. **The maintainers document a chips field themselves.** A docs page or docs example, not a
   community package.
2. **It is widely used.** npm downloads for the week 2026-11-01 to 2026-11-07, from
   `api.npmjs.org/downloads/point/last-week/<package>`.
3. **It adds a new implementation.** Two libraries built on the same engine mostly measure the same
   code twice, so we take one per lineage.
4. **Its package licence allows it.** We pin a version at least two weeks old (ADR 0005, rule 2).

## Recommended first wave (four)

| System | Component | Package, version (released) | Licence | Downloads/week | Docs |
| --- | --- | --- | --- | --- | --- |
| MUI | `Autocomplete` with `multiple` (chips) | `@mui/material` 9.5.0 (2026-10-09) | MIT | 13.8 M | [Multiple values](https://mui.com/material-ui/react-autocomplete/#multiple-values) |
| shadcn/ui | Combobox "With chips" (Base UI underneath) | `@base-ui/react` 1.9.0 (2026-10-09) | MIT | 28.4 M (Base UI); `shadcn` CLI 17.8 M | [With chips](https://ui.shadcn.com/docs/components/combobox#with-chips) |
| React Aria (Adobe) | `ComboBox` with multiple selection and `TagGroup` | `react-aria-components` 1.22.1 (2026-10-09) | Apache-2.0 | 9.0 M | [ComboBox, TagGroup](https://react-aria.adobe.com/ComboBox) |
| Chakra UI v3 (Ark UI / Zag underneath) | `TagsInput` | `@chakra-ui/react` 3.37.0 (2026-08-28) | MIT | 2.0 M (Ark UI 1.4 M) | [Tags Input](https://chakra-ui.com/docs/components/tags-input) |

Why each one:

- **MUI** is the most downloaded styled React library. Its chips field is `Autocomplete`, so it is
  the combobox approach of a big generalist library.
- **shadcn/ui** is the default starting point for new React projects in 2026. Its Combobox now
  defaults to Base UI (stated on the shadcn docs page), so this one measurement covers Base UI too.
  shadcn is copied source, not a package. The harness would vendor the component as the shadcn CLI
  generates it at a pinned CLI version, with the generated file in the repo and linked from the card.
- **React Aria** is built by Adobe with accessibility as its main goal, and it is the obvious
  "how should it be done" comparison. Note: this is a docs composition (ComboBox plus TagGroup),
  not a single component, so the harness copies the docs example and says so. It also corrects our
  earlier "Adobe Spectrum: no equivalent component": Spectrum has none, React Aria does.
- **Chakra UI v3** is what you named, and it is the most used library on the Ark UI / Zag.js
  lineage: `@chakra-ui/react` 3.37.0 depends on `@ark-ui/react` 5.39.0. Measuring Ark separately
  would mostly repeat Chakra, so Ark is covered through Chakra, and the card says so.

## Considered, not in the first wave

| System | Why not now |
| --- | --- |
| Ant Design, `Select` `mode="tags"` (`antd`, 5.4 M/week, MIT; [docs](https://ant.design/components/select#select-demo-tags)) | A strong second-wave design system. Its newest version (6.7.0) is only 4 days old; 6.6.7 (2026-10-20) qualifies. |
| Mantine, `TagsInput` (`@mantine/core`, 3.7 M/week, MIT; [docs](https://mantine.dev/core/tags-input/)) | Popular, its own implementation. Second wave. |
| Ark UI `TagsInput` alone ([docs](https://ark-ui.com/docs/components/tags-input)) | Covered through Chakra (same engine). |
| Radix UI, Headless UI | Not checked further in this pass; not in the first wave. |

## What changes on the site

- Agreement is counted over more systems, so "X of N" means more.
- The "Across systems" section becomes a **comparison you choose**. Reference is always shown,
  plus up to three measured systems picked in a "Compare with" field (our own chips input). The
  default pick is two widely used ones. The choice is kept in the URL (`?compare=mui,react-aria`).
  You can only pick systems we have measured; nothing runs on demand.

## Cost

- Four harness pages, each with its props listed at the top (ADR 0005, rule 1).
- New harness-only dependencies, each needing your approval: `@mui/material` (with `@emotion/react`
  and `@emotion/styled`), `@base-ui/react`, `react-aria-components`, `@chakra-ui/react` (with
  `@emotion/react`). Their exact peer dependencies get checked when we add them.
- Four adapters (locate and confirm the start state only), 3 runs each, then the comparison UI.

## Decision needed

1. Approve the first wave (MUI, shadcn/ui, React Aria, Chakra), or change it.
2. Approve vendoring the shadcn component as generated source.
