# Pattern 2: Combobox (in progress)

An editable combobox with a listbox popup and list autocomplete, in both forms APG names: manual
selection, and automatic selection of the first suggestion. APG has a dedicated pattern. Out of
scope: select-only, inline completion, grid, tree and dialog popups, multi-select.

The source of truth for rule text and sources is `packages/contracts/src/patterns/combobox*.ts`.
The pattern is in `patternsInProgress`, not in `patterns`: the site builds no page for it until
the pattern page is written and the manual screen reader check is done. Approval and the reasons for the scope:
[the proposal](../proposals/combobox.md).

## Rules

| id | Level | Expectation |
| --- | --- | --- |
| `tab` | rule (APG) | Tab, popup closed or open, never lands on the popup, an option or the button that opens the popup (known by its expanded state); Shift+Tab returns to the combobox. A stop on a control with no expanded state, such as a clear button, is not judged. |
| `expanded` | rule (APG) | Expanded while the options are in the accessibility tree, collapsed once they are gone; judged after every step. Not judged: a listbox with no options, anything shown for text that matches nothing, an expanded state on a wrapper. |
| `down` | rule (APG) | With the popup shown before or because of the key, ↓ makes an option active: the first, or the one after an automatically selected suggestion. Not judged on a press that opens nothing in an empty combobox; a press that opens and makes no option active differs (APG gives that to Alt+↓). |
| `focus-stays` | rule (APG) | DOM focus stays on the combobox while arrows move; `aria-activedescendant` points at an option in the popup. Judged only where an arrow key made an option active, moved DOM focus or set the reference. |
| `arrows` | rule (APG) | ↓ next, ↑ previous; at the ends, doing nothing, returning to the combobox and wrapping all follow (the pattern names two, APG's list example does the third); which one is recorded. |
| `selected` | rule (APG) | The active option is exposed as selected, and only it. |
| `enter` | rule (APG) | Enter closes the popup; text left in the combobox is the option's value, and an empty combobox (a default action) follows too. The cursor is not judged. |
| `escape` | rule (APG) | Escape closes the shown popup; focus is on the combobox. Clearing the text is recorded, not judged. |
| `say-results` | recommendation | When typing changes the suggestions, a live region says so within the quiet window; judged on the first key that changed them. Not judged: a combobox that writes nothing but whose typed key makes the first match active (that tells the change another way). One that does both follows. |
| `say-count` | recommendation | That message gives the number of suggestions. Judged only where the change is announced, so silence is charged once, to `say-results`. |

**Active option** means one thing in every rule: the option named by `aria-activedescendant`; or
the option holding DOM focus; or, when neither exists, the one option exposed as selected.
**Automatically selected suggestion**: an option that is active in that sense after typing and
before any arrow key. A highlight only the screen shows cannot be read: where the first ↓ lands
on the second option with no such mark before it, the step is inconclusive.

Who is charged when ↓ goes wrong, each once:

| What the recording shows | Charged to |
| --- | --- |
| Nothing happens at all | `down` |
| The popup opens, no option becomes active | `down` |
| DOM focus moves onto an option | `focus-stays` |
| An option becomes selected, `aria-activedescendant` is not set | `focus-stays` |
| `aria-activedescendant` names something that is not an option, or nothing | `focus-stays` |

`arrows`, `selected` and `enter` are judged from the active option in all but the first row.

## Scenarios

Start for all: six options, **Apple, Apricot, Avocado, Cherry, Kiwi, Plum**, set through the
component's documented props; empty input, popup closed, focus in the input. The letter "a"
matches the same three options whether a system filters by prefix or by substring, and "z"
matches none in both, so the filter a system uses does not change what is judged.

`expanded` is judged after every step of every scenario below, the recorded-only ones too.

1. `tab-out`: Tab, then Shift+Tab, popup closed. Judges `tab`.
2. `tab-open`: type "a", ↓, Tab. Judges `tab` with the popup shown, unless ↓ moved DOM focus
   onto an option (charged to `focus-stays`, not here).
3. `open-down`: ↓ in the empty combobox. Judges `down` and `focus-stays` only if the popup is
   shown after the key; otherwise recorded only.
4. `type-then-move`: type "a", ↓, ↓, ↑. Judges `down`, `arrows`, `selected`, `focus-stays`,
   `say-results`, `say-count`.
5. `ends`: type "a", ↓ four times, ↑ four times. Judges `arrows` at the ends by what was
   observed, not by key count: the first ↓ pressed while the last option is active, and the first
   ↑ pressed while the first option is active. An end the keys never reached is not judged; the
   rule still stands on `type-then-move`.
6. `accept`: type "a", ↓, Enter. Judges `enter`.
7. `escape`: type "a", ↓, Escape, Escape. Judges `escape` on the first Escape, if the popup was
   shown before it; the second Escape is recorded only.
8. `open-up`: ↑. Recorded only (APG optional), no rule besides `expanded`.
9. `no-match`: type "z", one key. Recorded only: APG lets the popup close, and what a system says
   for text that matches nothing carries neither announcement rule (third audit, 2026-11-14: a
   "no results" message alone had carried `say-count`).
10. `reopen`: type "a", ↓, Enter, ↓, ↓. Recorded only: which option is exposed as selected when
    the list is shown again after a value was chosen, and whether it stays selected once another
    option is active. The `selected` trade-off rests on it.

## Carried over from input with chips

Each line is a mistake made once there (ADR 0009, ADR 0004, the audits of 2026-11-11 and
2026-11-13) and where this pattern answers it.

**Rules**

- *A standards-level rule judged a system where the standard did not ask.* Every `rule` here
  quotes the APG sentence that asks for it; where APG lists two outcomes (the ends of the list,
  both autocomplete forms, when the popup opens), both follow, written into the rule text.
- *A WCAG criterion cited as if it asked for the behaviour.* WCAG sources are notes starting
  "Related:", and a test checks it.
- *One design counted in several rows.* A system that moves DOM focus onto its options differs
  on `focus-stays` only; `arrows`, `selected` and `enter` judge it from the focused option. A
  combobox whose ↓ does nothing is charged to `down` once, and one whose reference does not
  resolve to `focus-stays` once; the table under the rules says who owns what (suite
  `preconditions`).
- *A rule judged where the standard leaves the choice to the system* (the first audit of these
  rules, 2026-11-14). ↓ in an empty combobox need not open it, and a popup may stay shown with
  no options: neither is judged against a system.
- *A shared clause read differently in two rules* (the "marked chip"). "Active option" is
  defined once, above and in `combobox-rules.ts`, and every evaluator uses the same predicate.
- *Rule text promising what the engine cannot see.* The cursor after Enter and the speaking
  order of an announcement are named as not judged.
- *A scenario judging the wrong step* (the second Backspace). Each rule names the step it
  judges: `enter` the Enter step, `escape` the first Escape, `say-results` the first key that
  changed the suggestions.
- *A rule stricter than APG's own example* (second audit of these rules, 2026-11-14). The list
  autocomplete example wraps at the ends and the pattern lets Enter perform a default action;
  both follow. An example page is read and snapshotted before a rule narrows what it does.
- *An optional behaviour forced into the two levels.* `up-opens` is recorded, not a rule.

**Scenarios and the engine**

- *Different fixtures per system.* One option list for all, chosen so prefix and substring
  filters agree.
- *The engine could not see a finding that a script saw* (Atlassian's dangling
  `aria-activedescendant`). The engine records an active descendant that does not resolve, and
  the combobox's value, before any target is measured.
- *An announcement written after the quiet window read as "not announced"* (Chakra UI, 400 ms
  amendment to ADR 0003). Before a target is measured, read its package for a delay or debounce
  on the result message and note it in `data/targets.yaml`; one longer than the window makes
  `say-results` inconclusive for that target, not differs.
- *A scenario assuming where the first key lands.* `ends` judges by the observed active option,
  so automatic selection does not shift what is tested.
- *Majority picked among runs.* Unchanged: three runs, disagreement is `inconclusive`.

**Targets** (`packages/engine/CLAUDE.md`, "Choosing what to measure")

- *A docs example measured while the package shipped a dedicated component.* Before any harness
  page: list each package's exports at the pinned version for combo, autocomplete, select,
  search, typeahead, with the date in `data/targets.yaml`. A dedicated component wins.
- *A harness header claiming a docs example it did not follow.* The page header names the
  example followed and the ones not followed, and lists every prop it sets.
- *A deprecated component counted in agreement.* Each candidate's status is read from its docs
  before measuring; deprecated ones are shown, not counted.
- *Observations made by hand or by script printed next to measured ones.* Anything the engine
  did not record is an observation with its date and method, never a verdict.

**Site and copy**

- *Agreement read as "N systems do not follow" when some could not be judged.* Agreement counts
  judged systems only, as now.
- *Trade-offs filed under a behaviour a system does not have.* A trade-off is written only after
  the measurement shows the difference, with `seenIn`, as `draft` until reviewed.
- *Publishing before the manual check.* The NVDA and VoiceOver check stays the gate.

## Which systems are counted

One test for every candidate (ADR 0006, amendment of 2026-11-15): by default or in the documented
example, a text input with the combobox role whose list narrows as the user types. The name a
system gives its component does not decide. All six measured systems pass by their own
recordings, Atlassian's Select included, so all six are counted; the dated line for each is in
`data/targets.yaml`.

## Reference implementation

`packages/reference/combobox/`, framework-free, manual selection. It must measure `follows` on
every rule; if it does not, fix the reference, not the evaluator, unless the evaluator is wrong.

## Earshot's own command palette

Decided 2026-11-14, replacing decision 7 of the proposal: the ⌘K palette is **not** a
combobox target. It is a combobox inside a modal dialog whose list is always shown, the kind of
component React Aria's docs give Autocomplete for ("command palettes, searchable menus"), which
Earshot does not measure under this pattern either. Measuring ours would apply to Earshot a yardstick
React Aria was spared.

"The product passes its own contracts" (CLAUDE.md 2.4) is met by browser tests named by rule id,
`apps/atlas/test/command-palette.spec.ts`, "combobox rules":

| Rule | Held to it | How |
| --- | --- | --- |
| `focus-stays`, `selected`, `expanded`, `down`, `enter` | yes | one test each |
| `arrows` | yes | in the browser with the one selectable pattern; next, previous and wrapping in `test/unit/palette-model.test.ts` |
| `say-results`, `say-count` | yes | the count is written into a status region that is already in the dialog |
| `tab` | does not apply | a modal dialog keeps Tab inside it |
| `escape` | does not apply | Escape closes the dialog and returns focus to its trigger, which the dialog pattern asks for |

## Order of work

1. Contracts: rules and sources. **Done 2026-11-14.**
2. Engine 0.12.0: the value after a step, an unresolved active descendant, the popup recorded
   wherever it is rendered; scenarios, evaluators (each with follows, differs and inconclusive),
   the suite. **Done 2026-11-14.**
3. The reference, measured to `follows` on every rule. **Done 2026-11-14**: ten of ten, three
   consistent runs.
4. Targets: the exports audit, then harness pages and adapters. **Done 2026-11-14** for Fluent 2,
   MUI, React Aria, Chakra UI, GitHub Primer and Atlassian (`data/targets.yaml`). The command
   palette is not a target (see above).
5. Measurements on engine 0.13.0 and trade-offs. **Done 2026-11-14**, with three `verdict-auditor`
   rounds. The four trade-offs are reviewed (2026-11-14).
6. The page. A preview on measured data is at `/lab/patterns/combobox/`, linked from nowhere:
   the matrix, the compare grid and the rule panels, with the combobox replay. Still to do: the
   playground and tour, the design requirements and both lenses, then publishing after the
   manual screen reader check.
