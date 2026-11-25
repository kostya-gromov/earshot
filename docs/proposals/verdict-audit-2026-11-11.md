# Proposal: two findings of the first verdict-auditor run (2026-11-11)

- Status: accepted 2026-11-11. B1 with one change: "one widget" is read from
  behaviour (arrow keys between the chips), not from ARIA roles, which would have dropped the
  rule for the reference itself. M1 as recommended. Recorded in ADR 0009. Quotes were checked
  against `docs/sources/` snapshots.
- Source: the first real `verdict-auditor` run on this repo (report in the session log;
  findings B1 and M1).

## B1 (blocker). `chip-stop` judges Atlassian against APG where APG does not ask it

**Evidence.**
- Rule `chip-stop` is a standards-level rule: "The chips are one composite widget with roving
  focus." Its 2.1.1 note says the one stop "comes from the APG practice above".
- APG Keyboard Interface asks for one stop *inside a composite widget*: "the tab sequence should
  include only one focusable element of a composite UI component"
  (`docs/sources/ARIA--apg--practices--keyboard-interface.md:151`), and allows components in the
  tab sequence: "This is best achieved by either including them in the tab sequence or by making
  them accessible from a component that is in the tab sequence"
  (same file, line 126).
- Atlassian's chips are plain "Remove …" buttons with no composite role
  (`atlassian.json#/target/itemsFoundBy`). Its own `chip-arrows` reason says so: "the chips are
  separate Tab stops, not one composite widget".
- The same reasoning already moved `tab` to a recommendation on 2026-11-10.

**Options.**
1. **Recommended: `chip-stop` applies to chips exposed as a composite widget** (grid, listbox,
   toolbar). Plain-button chips get `not-applicable` with that reason. Atlassian's separate stops
   are still charged, once, by `tab` (a recommendation), where they already differ. `chip-arrows`
   for Atlassian becomes `not-applicable` for the same reason instead of `inconclusive`.
   Needs: evaluator change (engine minor version), re-measure all targets, ADR 0009 entry.
2. Make `chip-stop` a recommendation for every system. Simpler, but understates APG for systems
   that do declare a composite (Fluent's listbox, React Aria's grid), where APG does ask it.
3. Keep as is, and add a note that Atlas reads plain-button chips as one widget. Leaves a
   standards-level Differs that the cited standard does not support.

## M1 (major). One React Aria design is counted in three rows

**Evidence.** React Aria `tab`, `arrows` and `bsp` all differ; the model trade-off
(`input-with-chips-trade-offs.ts`, `ruleIds: ['tab', 'arrows', 'bsp']`) names one cause. The
matrix labels these cells "Explained by a different model", but agreement counts them as three
plain differences (`apps/atlas/src/lib/agreement.ts`).

**Assessment.** The three verdicts are each factual: Tab, Left Arrow and Backspace each behave
differently, and each rule is about its own key. What misleads is the count read without
context. Chakra UI's case differs on purpose: its first Backspace is inconclusive because the
`bsp` rule text names the visual-only mark explicitly.

**Options.**
1. **Recommended: keep the verdicts; say it next to the count.** Where model-explained verdicts
   are among the differences, the agreement line adds "React Aria's differences here come from
   one design (a separate grid)". Copy only; no re-measure.
2. Leave model-explained cells out of agreement. Hides three real key behaviours from the count.

## Minor, not proposed for change

- The methodology says compositions are marked in the system's column; they are marked on the
  evidence card only. Either wording or a label in the matrix header.
- React Aria's `remove-click` also shows "let the new focus tell the change" (a `say`
  alternative) but `seenIn` lists only Fluent 2.
- The `keep-focus` evaluator checks "inside the field", not "on a neighbouring chip or the
  input"; no verdict changes today.
