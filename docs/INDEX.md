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

## Patterns

- [input-with-chips](patterns/input-with-chips.md): rules, scenarios, reference, design requirements, trade-offs.
- [combobox](patterns/combobox.md): in progress; rules, scenarios, and what is carried over from input with chips so the same mistakes are not made twice.
- [menu-button](patterns/menu-button.md): in progress; the three terms, rules and where each is judged, one defect one rule, what every measured page holds.

## Proposals

- [menu-button](proposals/menu-button.md): pattern 3, approved 2026-11-16 with one amendment (activation is measured, not inferred from the menu closing): nine draft rules quoted from the live APG pages, twelve scenarios, one engine addition, candidate targets, eight decisions.
- [more-systems](proposals/more-systems.md): MUI, React Aria, Chakra UI, shadcn/ui.
- [own-harness](proposals/own-harness.md): the harness behind ADR 0005.
- [verdict-audit-2026-11-11](proposals/verdict-audit-2026-11-11.md): two findings of the first verdict-auditor run, for decision.
- [run-it-setup](proposals/run-it-setup.md): how "Run it on your component" reaches the starting state.
- [trade-off-editorial-pass](proposals/trade-off-editorial-pass.md): the ten input-with-chips trade-offs, current and proposed text, checked against the measurements; four decisions for the owner.
- [react-aria-token-field](proposals/react-aria-token-field.md): React Aria ships TokenField in the measured version; verified facts and the plan to measure it.
- [target-audit-2026-11-13](proposals/target-audit-2026-11-13.md): is each of the eleven systems measured on the right component; six findings, six decisions and their outcome.
- [engine-text-editing-model](proposals/engine-text-editing-model.md): what the engine lacks to measure token fields (caret, appended live regions), from the TokenField trial; proposed, not started.
- [combobox](proposals/combobox.md): pattern 2; rules quoted from the APG snapshot, scenarios, engine gaps, candidate targets; approved 2026-11-14.



## Other

- [engineering-standards](engineering-standards.md): architecture, size limits, style, types, tests (imported by CLAUDE.md).
- [a11y-checks/](a11y-checks/): manual screen reader checks.


