# Proposal: a text-editing model, so the engine can measure token fields

- Date: 2026-11-13. Status: **proposed, not started**. Nothing here is built.
- Why: React Aria ships TokenField for this pattern (`target-audit-2026-11-13.md`, F1). A trial
  measurement ran, and its verdicts are not ones Atlas can stand behind. The same shape (one
  editable element, values as text inside it) exists elsewhere, for example mention inputs.

## What the trial showed

Page: `packages/harness/react-aria-token-field` (the docs' "ComboBox" example, react-aria-components
1.22.1). Adapter: `packages/engine/src/adapters/react-aria-token-field`, not registered in the suite.
Result: 0 follows, 2 differs, 6 inconclusive.

- One element with the role combobox and `contenteditable`. Tokens are text inside it: no role,
  no name, never focused.
- Arrow keys move the caret across a token as one unit; an assertive live region names the token.
- One Backspace after the last token removes it at once. Nothing is announced.
- Focus alone leaves the caret before the first token, where Backspace does nothing.
- Tokens have no remove control.

## Where the engine falls short

| Gap | Effect in the trial |
| --- | --- |
| Focus is the only position the engine reads; the caret is invisible to it | `arrows` says "focus was on combobox, not on chip 3" although the token is named aloud |
| Rules `chip-stop`, `chip-arrows` start "on the last chip" by focus | Starting state unreachable |
| The announcement made on entering the field is recorded in the first step | "Irene Oh" appears on a Backspace that removed Hiroshi Matsui |
| The recorder stores a region's whole text; React Aria's announcer appends | "Irene OhGreg Fisher" is stored where a listener hears "Greg Fisher" |
| Scenarios with a remove button have no equivalent | `keep-focus`, `say`, `count` inconclusive on one scenario out of three |

## What it would take

1. **Capture the caret**: for an editable focus, the selection's place among the adapter's items
   (before item n, inside item n, after the last). Shell, `capture/focus.ts`; one new optional
   field in the observation schema.
2. **Record what was added to a live region**, not its whole text, when the region only grew.
3. **Drain announcements after setup**, so what the field says on focus is its own observation.
4. **Rule wording.** "Arrows move between chips" and "Backspace focuses the last chip first" speak
   of focus. Decide whether a caret on a token that is named aloud meets the rule, is a named
   alternative with a trade-off, or is not applicable. This is the real question, and it is
   decided separately: it changes what the rules mean, with APG and WCAG quoted from `docs/sources/`.
5. **A remove-click equivalent or none**: a scenario cannot be judged where the control does not
   exist; aggregation (ADR 0004) should then rest on the scenarios that apply.

Steps 2 and 3 are small and worth doing whatever is decided on 4: they fix how announcements are
recorded for every system.

## Open questions

- Does the caret count as "where the user is" for these rules? Evidence needed from a real screen
  reader (phase 2, or the manual check in `docs/a11y-checks/`).
- If TokenField is measured, does it replace the composition or stand beside it as a second React
  Aria entry? The site counts one entry per system today.
