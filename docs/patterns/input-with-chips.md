# Pattern 1: Input with chips

Also called tag input, token field, people picker, multi-select. There is **no dedicated APG
pattern**. The reference builds it from an APG combobox (typing and suggestions) plus a list of
remove buttons with roving focus. It deliberately does **not** use listbox/option for the chips,
because an option cannot contain an interactive button.

The source of truth for rule text, sources, requirements and trade-offs is
`packages/contracts/src/patterns/input-with-chips*.ts`. This page is the brief; history and
reasons are in [ADR 0009](../decisions/0009-input-with-chips-rule-history.md).

## Rules

Each rule has a level. **Rule**: what a cited WCAG criterion or APG practice asks; a criterion
that does not itself ask for it is cited as related, with a note. **Recommendation**: advice Atlas
adds beyond them, labelled as ours on the site, with the reason in its description.

| id | Level | Title | Expectation | Sources |
| --- | --- | --- | --- | --- |
| `chip-stop` | rule (APG) | The chips are one Tab stop | From a chip, Tab and Shift+Tab leave the chips (to the input or out), never to another chip or a control inside the chip. Measured from the last chip, which the engine focuses directly (`startOn: 'last-item'`); a chip that cannot take focus makes it inconclusive. Applies when arrow keys move between the chips; separate controls with no arrow keys are not applicable (APG allows them), and their extra stops count under `tab`. | APG roving tabindex, APG layout grid pill list; WCAG 2.1.1 related |
| `chip-arrows` | recommendation | Arrows move between chips | From a chip, ← moves to the previous chip and → to the next. Measured from the last chip. Not judged when `chip-tab`/`chip-shift-tab` show each chip is its own Tab stop: that design is charged once, to `chip-stop` (suite `preconditions`). Not applicable to separate controls with no arrow keys. | APG roving tabindex related, APG layout grid pill list related; WCAG 2.4.3 related |
| `tab` | recommendation | One stop for the whole field | The input and its chips share one Tab stop: Tab and Shift+Tab from the input leave the field, and so does Tab from a chip. Treating input and chips as one widget is Atlas's design, not APG's. | APG roving tabindex related |
| `arrows` | recommendation | Arrows join the input and the chips | From caret position 0, ← moves to the last chip; → past the last chip returns to the input. Movement between chips is `chip-arrows`; a failure there leaves this rule inconclusive. | APG roving tabindex related |
| `bsp` | recommendation | Backspace twice to remove | In an empty input, first Backspace moves focus to the last chip; second removes it. If the first press moves focus nowhere the tree shows and the second removes a chip, the verdict is inconclusive (a visual-only mark, as in Chakra UI). | WCAG 3.3.4 as rationale |
| `keep-focus` | recommendation | Keep focus in the field after a removal | After a removal by key or click, focus stays in the field, on a neighbouring chip or the input; never on body, never outside. | APG keyboard practice (persistence of focus) related; WCAG 2.4.3 related |
| `say` | recommendation | Announce the removal | A removal is announced via a live region and names the removed value. Atlas reads a disappearing chip as a status message; WCAG 4.1.3 centres on messages added to the page. The semantic model does not claim the speaking order of announcement and focus. | WCAG 4.1.3 related |
| `count` | recommendation | Say how many remain | The removal announcement also gives the new count ("2 selected"). Judged only where the removal is announced, so a silent removal is charged to `say` once. | WCAG 4.1.3 related |

Agreement on the site counts the systems a rule could be judged on (follows or differs);
inconclusive ones are shown as "not judged". Verify every link against the live APG and WCAG 2.2
Understanding pages when you add it (`https://www.w3.org/WAI/ARIA/apg/`,
`https://www.w3.org/WAI/WCAG22/Understanding/`).

## Scenarios

Initial state for all: three chips (Irene Oh, Greg Fisher, Hiroshi Matsui, or the target's
equivalent), empty input, focus in input.

0. `chip-tab`, `chip-shift-tab`, `chip-arrows`: start on the last chip (the engine focuses it
   directly), then Tab; Shift+Tab; ←, →. They judge the chips as one APG composite widget.
1. `tab-out`: Tab. Expect focus outside the component. Then Shift+Tab. Expect focus in the input.
2. `shift-tab-out`: Shift+Tab. Expect focus outside the component.
3. `tab-from-chip`: ArrowLeft, Tab. Expect focus outside the component after one Tab.
4. `backspace-twice`: Backspace, Backspace.
5. `arrows`: ArrowLeft, ArrowLeft, ArrowRight, ArrowRight.
6. `delete-focused`: ArrowLeft, Delete. Expect announcement and focus on a neighbouring chip or
   the input.
7. `remove-click`: click the remove control of the second chip. Expect focus in input and
   announcement.

## Reference implementation

`packages/reference/input-with-chips/`, extracted from `docs/prototype/earshot-atlas-v5.html`.
Framework-free; `index.html` is a standalone page the engine opens. It must measure `follows` on
every rule. If it does not, fix the reference, not the evaluator, unless the evaluator is wrong
(say which in the PR).

## Design requirements ("For design" lens)

Each with reason and source, written in contracts: focus ring on every chip (2.4.7, 1.4.11);
remove target at least 24×24 (2.5.8); chip text at least 4.5:1 in every theme (1.4.3); invalid
chips explained in text, not colour only (1.4.1, 3.3.1); visible label and keyboard hint (3.3.2);
max height then scroll (2.4.11); prefer read-only over disabled (guidance).

## Trade-offs (hand-written, the owner reviews)

An alternative may name the measured systems that take it (`seenIn`); a difference no alternative
describes is listed as "Other measured differences", never filed under a behavior the system
does not have.

- `chip-stop`: "the remove button as its own Tab stop inside each chip" (React Aria): gain the
  remove control without knowing Delete; pay one more stop, where APG's grid and pill list keep
  one.
- `chip-arrows`: no alternative within the rule. Chips with no arrow keys, each a control in the
  Tab order, are where the rule stops applying (ADR 0009); that design is described under `tab`.
- `tab`: "one more Tab stop for the group of chips" (Fluent 2): gain Tab reaches the chips
  without arrow keys; pay one extra stop each way. "A Tab stop on every remove button"
  (Atlassian; under `tab` since 2026-11-11, ADR 0009): gain discoverability; pay one Tab per
  chip; reasonable for two or three chips, like filter bars.
- `arrows`: "reach the chips by Tab, not from the input" (Atlassian): gain arrow keys in the input
  only move the caret; pay one more stop. Chakra UI is not filed here: its tags cannot take focus
  at all (a visual highlight only), so its difference is listed apart.
- `bsp`: "remove on first Backspace": gain speed; pay accidental deletion; reasonable with
  announcement plus undo.
- `keep-focus`: no reasonable alternative found.
- `say`: "let the new focus tell the change" (Fluent 2): gain no extra speech; pay nothing says
  what was removed, and a removal that leaves focus in the input is silent.
- `count`: "name the removed value without the count": gain a shorter message; pay no quick way
  to know how many remain.
- Model (tab, arrows, bsp; React Aria; not `chip-stop`, since APG's grid itself asks for one
  stop): "the selected values as a separate grid after the input", written once and shown on each
  rule; its cells say "Explained by a different model" (draft).
