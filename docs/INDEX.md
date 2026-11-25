# Docs index

One line per document: what it answers. Search here first, then open the one you need.

## Decisions (ADRs): why things are the way they are

- [0001](decisions/0001-site-framework.md): site framework, Next.js App Router with static export.
- [0002](decisions/0002-monorepo-tooling.md): TypeScript run directly by Node, erasable syntax only, no build step.
- [0003](decisions/0003-engine-capture.md): how focus, live regions, the AX tree, speech and settle are captured.
- [0004](decisions/0004-pattern-suites.md): pattern suites keep the runner pattern-independent; preconditions.
- [0005](decisions/0005-own-harness.md): measure published npm packages in our own harness, not docs demos. Amended 2026-11-16: variants of a system (`variant-of`), and a measurement file behind every recorded note.
- [0006](decisions/0006-inclusion-rule.md): which systems are measured; docs compositions.
- [0007](decisions/0007-chip-recognition.md): a chip is recognised by set position or the adapter's items.
- [0009](decisions/0009-input-with-chips-rule-history.md): dated history of the input-with-chips rules and counting.
- [0010](decisions/0010-home-motion-and-figures.md): home page motion: Illustration and Arrival tiers, figures inside the method.
- [0011](decisions/0011-product-name.md): the product is called Earshot; internal names and dated records stay.

## Patterns

- [input-with-chips](patterns/input-with-chips.md): rules, scenarios, reference, design requirements, trade-offs.
- [combobox](patterns/combobox.md): in progress; rules, scenarios, and what is carried over from input with chips so the same mistakes are not made twice.
- [tabs](patterns/tabs.md): on the site since 2026-11-19; scope, terms, one defect one rule, the engine addition, the reference.
- [dialog](patterns/dialog.md): in progress since 2026-11-21; scope, terms, one defect one rule, how the Tab rules are read, the engine additions, the reference.
- [menu-button](patterns/menu-button.md): in progress; the three terms, rules and where each is judged, one defect one rule, what every measured page holds.

## Proposals (need or had approval)

- [menu-button](proposals/menu-button.md): pattern 3, approved 2026-11-16 with one amendment (activation is measured, not inferred from the menu closing): nine draft rules quoted from the live APG pages, twelve scenarios, one engine addition, candidate targets, eight decisions.
- [more-systems](proposals/more-systems.md): MUI, React Aria, Chakra UI, shadcn/ui.
- [own-harness](proposals/own-harness.md): the harness behind ADR 0005.
- [verdict-audit-2026-11-11](proposals/verdict-audit-2026-11-11.md): two findings of the first verdict-auditor run, for decision.
- [run-it-setup](proposals/run-it-setup.md): how "Run it on your component" reaches the starting state.
- [trade-off-editorial-pass](proposals/trade-off-editorial-pass.md): the ten input-with-chips trade-offs, current and proposed text, checked against the measurements; four decisions for review.
- [react-aria-token-field](proposals/react-aria-token-field.md): React Aria ships TokenField in the measured version; verified facts and the plan to measure it.
- [target-audit-2026-11-13](proposals/target-audit-2026-11-13.md): is each of the eleven systems measured on the right component; six findings, six decisions and their outcome.
- [engine-text-editing-model](proposals/engine-text-editing-model.md): what the engine lacks to measure token fields (caret, appended live regions), from the TokenField trial; proposed, not started.
- [combobox](proposals/combobox.md): pattern 2; rules quoted from the APG snapshot, scenarios, engine gaps, candidate targets; approved 2026-11-14.
- [tabs](proposals/tabs.md): pattern 4, approved 2026-11-19 with every decision as recommended, work alongside M5: nine draft rules quoted from the live APG pages, ten scenarios, two engine additions, candidate targets, nine decisions.
- [figma-annotated-elements](proposals/figma-annotated-elements.md): a pattern's element with its requirements as annotations, downloadable for Figma; Figma's docs read 2026-11-21, four options, five decisions; opened on 2026-11-21 for the trial and one pattern, alongside M5.
- [figma-plugin](proposals/figma-plugin.md): a published Earshot plugin that draws a pattern with its requirements in the designer's own file; opened on 2026-11-21; submitted to Figma's review from a personal account on 2026-11-22; the link on the site (step 4) waits for the answer.
- [dialog](proposals/dialog.md): pattern 5, modal dialog; opened on 2026-11-21 (work alongside M5), with amendments the same day: ten draft rules quoted from the live APG pages, seven scenarios, six engine additions, the native element and MUI's focus guards checked in the browser, candidate targets, nine decisions.

- [select](proposals/select.md): pattern 6, the select-only combobox; opened and approved on 2026-11-24 with three amendments: eleven draft rules quoted from the APG combobox page and its select-only example (`name-and-value` split, `name-is-label` a recommendation), nine scenarios, one engine addition (the select's value), the browser's own `<select>` not drivable in headless Chromium and shown on the page as the system's choice (`browser-native`), a candidate requirement on the native select.



## Other

- [engineering-standards](engineering-standards.md): architecture, size limits, style, types, tests (imported by CLAUDE.md).
- [a11y-checks/](a11y-checks/): manual screen reader checks.


