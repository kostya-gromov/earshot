# Proposal: pattern 2, combobox (editable, list autocomplete)

- Opened: 2026-11-14. Status: **approved 2026-11-14**, all seven decisions as
  recommended: one variant with both autocomplete forms; `up-opens` is not a rule (its scenario
  stays as recorded evidence); `say-results` is an Atlas recommendation; the engine gains the
  value after a step and an unresolved active descendant; the wiring rule comes later; Fluent 2,
  MUI, React Aria and Chakra UI first; the command palette is a target, shown apart. The current
  rules live in contracts and in [docs/patterns/combobox.md](../patterns/combobox.md). After two
  `verdict-auditor` rounds the same day these were also approved: wrapping at the ends and an empty
  field after Enter follow; "active option" has a third form (the one selected option);
  `expanded` judges less; `say-results` is split into `say-results` and `say-count`. The rule
  table below is the proposal as first written, kept for the record. Decision 7 was reversed the same day:
  the command palette is not a target; it is held to the applicable rules by browser tests
  (docs/patterns/combobox.md, "Atlas's own command palette").
- Source: `docs/sources/ARIA--apg--patterns--combobox.md`, snapshot of 2026-11-11. `pnpm
  sources:check` on 2026-11-14 reports the live page unchanged. Every quote below is from the
  snapshot.

## Scope

One variant: an **editable** combobox with a **listbox** popup and **list autocomplete**. APG
names two forms of it, "manual selection" and "automatic selection" (the first suggestion is
highlighted as the user types); both are in scope and the evaluators accept either where APG
describes both. Out of scope for this pattern: select-only, inline completion (`both`), grid,
tree and dialog popups, multi-select (that is input with chips).

## Rules

Levels as in input with chips: **rule** when the cited page asks for it, **recommendation** when
Atlas goes further and says so.

| id (draft) | Level | Expectation | Quote |
| --- | --- | --- | --- |
| `tab` | rule (APG) | Tab from the combobox leaves it; Shift+Tab back lands on the combobox. No open button, popup or option is a Tab stop. | "The combobox is in the page Tab sequence. Note: The popup indicator icon or button (if present), the popup, and the popup descendants are excluded from the page Tab sequence." |
| `expanded` | rule (APG) | The combobox's `expanded` state is false while the popup is hidden and true while it is shown, in every step of every scenario. | "When the combobox popup is not visible, the element with role combobox has aria-expanded set to false. When the popup element is visible, aria-expanded is set to true." |
| `down` | rule (APG) | With suggestions available, ↓ makes an option active: the first one, or the one after an automatically selected suggestion. | "Down Arrow: If the popup is available, moves focus into the popup: If the autocomplete behavior automatically selected a suggestion before Down Arrow was pressed, focus is placed on the suggestion following the automatically selected suggestion. Otherwise, places focus on the first focusable element in the popup." |
| `focus-stays` | rule (APG) | While ↓ and ↑ move through the options, DOM focus stays on the combobox and its active descendant is an option that exists in the popup. | "DOM Focus is maintained on the combobox and the assistive technology focus is moved within the listbox using aria-activedescendant" |
| `arrows` | rule (APG) | ↓ moves to the next option and ↑ to the previous. At the last (first) option, ↓ (↑) either does nothing or returns to the combobox; both follow. | "Down Arrow: Moves focus to and selects the next option. If focus is on the last option, either returns focus to the combobox or does nothing." (and the same for Up Arrow and the first option) |
| `selected` | rule (APG) | The active option has `selected` true, and only one option has it. | "when a suggested value is visually indicated as the currently selected value, the option, gridcell, row, or treeitem containing that value has aria-selected set to true"; "the listbox allows only one suggested value to be selected at a time" |
| `enter` | rule (APG) | Enter on an active option closes the popup and puts that option's value in the combobox. | "Enter: Accepts the focused option in the listbox by closing the popup, placing the accepted value in the combobox, and if the combobox is editable, placing the input cursor at the end of the value." |
| `escape` | rule (APG) | Escape with the popup open closes it; focus is on the combobox. Whether the text is cleared is recorded, not judged. | "Escape: Closes the popup and returns focus to the combobox. Optionally, if the combobox is editable, clears the contents of the combobox." |
| `up-opens` | APG optional | From the combobox, ↑ makes the last option active. | "Up Arrow (Optional): If the popup is available, places focus on the last focusable element in the popup." |
| `say-results` | recommendation | When the suggestions change, a live region says how many there are, or that there are none. | WCAG 4.1.3 Understanding: "brief text messages displayed about the completion or status of the search, such as "Searching...", "18 results returned" or "No results returned" would be status updates" |

Not proposed as rules, with the reason:

- **Caret at the end after Enter.** APG asks for it; the engine does not record the caret
  (`docs/proposals/engine-text-editing-model.md`). `enter` would say so in its description.
- **Wrapping from the last option to the first.** APG lists two outcomes at the ends and wrapping
  is not one of them. A system that wraps would read `differs` on `arrows`; that needs a
  hand-written trade-off, since wrapping is a common and defensible choice.
- **Alt+↓, Alt+↑, Home, End, ←, →, printable characters in the popup.** Optional or caret
  behaviour; record in the steps, judge later if they prove interesting.
- **Role and wiring** (`role="combobox"`, `aria-controls` to a `listbox`, `aria-autocomplete`).
  Worth a rule, but the engine records neither `aria-controls` nor `aria-autocomplete` today.

## Scenarios

Start for all: the same six options in every target, empty input, popup closed, focus in the
input.

1. `tab-out`: Tab, then Shift+Tab. Judges `tab`.
2. `open-down`: ↓. Judges `down`, `expanded`, `focus-stays`.
3. `type-then-move`: type one letter that matches three options, ↓, ↓, ↑. Judges `down` (both
   autocomplete forms), `arrows`, `selected`, `focus-stays`, `say-results`.
4. `ends`: open, ↑ at the first option; ↓ to the last option, ↓ again. Judges `arrows` at the ends.
5. `accept`: type the letter, ↓, Enter. Judges `enter`, `expanded`.
6. `escape`: ↓, Escape; then Escape again (clearing is recorded only). Judges `escape`, `expanded`.
7. `open-up`: ↑. Judges `up-opens`.
8. `no-match`: type text that matches nothing. Judges `say-results`; records whether the popup
   closes (APG: "the popup may close").

## What the engine has and lacks

Has (checked in `packages/contracts/src/schema/observation.ts`): `press`, `type` and `click`
actions; `expanded` and `selected` states; the resolved `activeDescendant` on focus; live region
announcements; the accessibility tree diff.

Lacks, each a small engine change to propose with the contracts:

- the combobox's **value** after a step (needed by `enter` and to record what Escape clears);
- whether the active descendant's id **resolves to an element** (today an unresolved one is just
  absent; the Atlassian finding of 2026-11-13 was seen by script, not by the engine);
- `aria-controls` and `aria-autocomplete`, if the wiring rule is wanted.

## Reference

`packages/reference/combobox/`, framework-free, manual selection, must measure `follows` on
every rule. The input-with-chips reference already has a suggestion list (`suggestions.js`); the
reference package imports nothing from the repo, and this is the second use, so it is written
again rather than shared (rule of three).

Atlas's own command palette is described as an APG combobox (`apps/atlas/CLAUDE.md`). Principle 4
says the product passes its own contracts: measure it as a target too, shown apart from the
design systems and never counted in agreement.

## Candidate targets

Checked on 2026-11-14 in the packages already installed for `packages/harness` (same versions as
the input-with-chips measurements). "Exports" means the name is in the installed package; the
docs pages and the behaviour were **not** read for this proposal.

| System | Candidate | Checked |
| --- | --- | --- |
| Fluent 2 | `Combobox` | exported by `@fluentui/react-components` 9.75.2 |
| MUI | `Autocomplete` (single value) | present in `@mui/material` 9.5.0 |
| React Aria | `ComboBox` | exported by `react-aria-components` 1.22.1 |
| Chakra UI | `Combobox` | `components/combobox` is in `@chakra-ui/react` 3.38.0 |
| GitHub Primer | `Autocomplete` | present in `@primer/react` 38.45.0; its status (current or deprecated) not checked |
| Atlassian | `Select`, searchable, single | `@atlaskit/select` 23.1.3 is installed; whether Atlassian presents it as a combobox not checked |

To check before any harness work, under ADR 0006 (a shipped component or a documented
composition): Adobe Spectrum 2, IBM Carbon, Material Web, GOV.UK, shadcn/ui (still waiting on the
dependencies in `docs/proposals/more-systems.md`).

## Decisions

1. **Scope**: one variant as above, with both autocomplete forms accepted. Recommended.
2. **A third level, "APG optional"**, for `up-opens`, or drop the rule. The schema has `rule` and
   `recommendation` only; an optional APG behaviour is neither ours nor required. Recommended:
   drop it from the rules and keep the scenario as recorded evidence.
3. **`say-results`** as an Atlas recommendation. Recommended: yes; it is the one place the
   pattern can be silent for a screen reader user, and 4.1.3 names this message.
4. **Engine additions**: value after a step and an unresolved active descendant. Recommended:
   both, in one engine version, before the reference is measured.
5. **The wiring rule**: now (with `aria-controls` and `aria-autocomplete` captured) or later.
   Recommended: later; the eight behaviour rules are enough for a first measured page.
6. **Targets**: start with Fluent 2, MUI, React Aria and Chakra UI, then Primer and Atlassian once
   their status is checked.
7. **The command palette as a target.** Recommended: yes, shown apart.

## Order of work once approved

Contracts (rules, sources, scenarios) and the engine additions; the reference, measured to
`follows` on every rule; harness pages and adapters for the first four systems; measurements;
trade-offs for every rule where systems differ, for review; the pattern page; `verdict-auditor`.
The manual screen reader check stays the gate before anything is published.
