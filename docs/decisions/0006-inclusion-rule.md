# 0006. Which systems Atlas measures: a component or a documented composition

- Status: accepted (2026-11-09)
- Scope: every pattern; `data/targets.yaml`

## Context

React Aria has no single "input with chips" component. Its ComboBox docs show one built from
ComboBox and TagGroup, and Atlas measured that. At the same time Adobe Spectrum sat under "no
equivalent component". Two systems from one company, judged by different criteria.

## Decision

A system is a target for a pattern when its maintainers either

1. ship a component for the pattern, or
2. document the pattern as a composition of their own published components (a docs example).

Otherwise it is `not-applicable`, with the evidence. The same check applies to every candidate.

A composition is measured as the docs write it. Its `targets.yaml` entry has a `composition` line
(what it combines, what Atlas did to assemble it), and the site shows it next to every verdict
for that system, so a reader knows we measured our assembly of their example.

Not counted: community packages, third-party wrappers, or compositions we design ourselves.

## Consequences

- React Aria stays a target and says "Docs composition, assembled by Atlas".
- Re-checked 2026-11-09 under this rule: Adobe Spectrum (React Spectrum's ComboBox picks one
  option, TagGroup has no input), Material Web (input chips only in a chip set), IBM Carbon (one
  count tag) stay not-applicable. GOV.UK recommends a different pattern.
- Headless libraries are measured the way teams actually use them, through composition.

## Amendment (2026-11-15): one test for "a component for the pattern", applied to every system

Decided on 2026-11-15, after the audit of the combobox measurements found that Atlassian's Select had been taken on a different ground than the other five systems.

- **What happened.** Five systems were chosen by what their docs call the component. Atlassian's docs call theirs a select, so it was first taken on the element's role and then set aside as "shown, not counted", without the same question being put to the others.
- **Decision.** Whether a system "ships a component for the pattern" is decided by what the component is, not by its name: for combobox, by default or in the documented example it is a text input with the combobox role whose list narrows as the user types. A select-only control (a button or a non-editable element that opens a list) and a list in a dialog are outside this pattern. The test is put to every select-like export of every candidate, each with a dated line in `data/targets.yaml`. A component that passes is counted.
- **Result for combobox.** The six measured components pass, each by its own recording. Atlassian's Select passes and is counted. Fluent's Dropdown, MUI's Select and Primer's Select and SelectPanel were read in source and do not pass; React Aria's and Chakra UI's selects were not read down to their elements and are left out on what their docs say they are.
- **What stays from the decision above.** A composition still needs the maintainers' own documentation; a component its maintainers deprecated is still shown and not counted.
