# Proposal: editorial pass over the input-with-chips trade-offs

- Opened: 2026-11-13. Status: **recommendations accepted by the owner on 2026-11-13 and applied** to
  `input-with-chips-trade-offs.ts` the same day, with the three round-2 majors of part 4 (Primer
  out of the `bsp` entry, no "silent", the model narrowed to what is recorded: option 1.6 b).
  Every entry is still `status: 'draft'`: the final read and `reviewed` are the owner's.
- Scope: `packages/contracts/src/patterns/input-with-chips-trade-offs.ts` (10 entries, all
  `status: 'draft'`, shown on the site under "Why systems differ" with "Draft, pending review").
- Goal: bring the block to an editorially ready state before the public launch. A trade-off is
  where Atlas speaks in its own voice about other teams' systems (CLAUDE.md 2.5), so it is checked
  hardest.
- Checked against: the measurement files of 2026-11-11 (engine 0.10.0, every verdict, summary and
  reason per rule and system), the rule texts in `input-with-chips-rules.ts`, and the snapshots in
  `docs/sources/` fetched 2026-11-11.

- Audited: `verdict-auditor`, round 1, 2026-11-13: one blocker (`arrows`, Atlassian), three
  majors, three minors. All are folded in below and marked "audit".

How to use it: decide the six questions in part 1, then accept, edit or reject each text in
part 2. Changing `status` to `reviewed` is yours; the "Draft" label disappears when no entry is a
draft.

## 1. Six decisions the texts depend on

These are mismatches between the entries and the measured data, not wording.

### 1.1 `say`: three differing systems have no trade-off

Measured: the removal is not announced in Fluent 2, MUI, React Aria and GitHub Primer. The one
alternative ("Let the new focus tell the change") names only Fluent 2, so the page lists MUI,
React Aria and Primer under "Other measured differences" with no explanation.

The alternative also describes Fluent 2 only in part: it holds when focus moves to a neighbouring
chip. Measured in MUI, the first Backspace removes the chip and focus stays in the input, and
nothing is said, which is the entry's own "cost".

**Proposed:** one alternative for all four, named for what is measured, not for an intent:
"No announcement on removal", `seenIn: ['fluent', 'mui', 'react-aria', 'primer']`. Text in 2.8.

### 1.2 `arrows`: Chakra UI differs with no trade-off

Measured: Left Arrow does not move focus to a chip in Atlassian, Chakra UI and React Aria. Atlassian
has an alternative, React Aria is covered by the model, Chakra UI falls under "Other measured
differences". By our own observation (targets.yaml, seen by hand on 2026-11-09) Chakra highlights
a tag on screen while focus stays in the input and the accessibility tree shows nothing.

**Options:** (a) leave Chakra under "Other measured differences", as now: honest, and says
nothing we did not measure; (b) add an alternative "Highlight a chip while focus stays in the
input". I recommend (a): the highlight is a hand observation, and a trade-off built on it would
present an unmeasured behaviour as the reason for a measured verdict. The observation already
shows beside Chakra's recording.

### 1.3 `chip-arrows`: an alternative no judged system takes

"No arrow navigation" has no `seenIn`, and no system differs on `chip-arrows`: four follow
(Fluent 2, MUI, React Aria, and Primer, which is shown but not counted), Atlassian is not
applicable, Chakra is inconclusive. The page shows it as "Not seen in the
measured systems". Since ADR 0009 (2026-11-11) chips with no arrow keys are exactly the case where
the rule does not apply, so this is not an alternative to the rule, it is the rule's boundary, and
that design is already described under `tab` ("A Tab stop on every remove button").

**Proposed:** replace it with a `kind: 'none'` note that says where the rule stops applying and
points to the other rule. Text in 2.5.

### 1.4 "Reasonable when" next to systems that do not meet it

Two entries state a condition that the systems listed beside them do not all meet, and a reader
can take the list as "these systems are in the reasonable case":

- `bsp`, "The removal is announced and can be undone": of Atlassian, MUI and Primer, only
  Atlassian announces the removal (measured, rule `say`). Undo was not measured in any.
- `arrows`, "The chips are their own group with a single Tab stop": Atlassian's remove buttons
  are each a Tab stop (measured, rule `tab`).

Audit: the same holds for `say` once it lists four systems (1.1): in the recordings only Fluent 2
moves focus to a neighbouring chip on every removal; MUI and Primer leave focus in the input after
Backspace with nothing said. And for `chip-stop`: "people are not expected to know a key" sits
beside React Aria, whose tag row carries the description "Press Delete to remove tag."

**Options:** (a) keep the conditions and add one line under the block's heading: "A condition
describes when the alternative is reasonable; a system listed beside it does not necessarily meet
it." (b) reword each condition so it cannot be read as a statement about the listed systems.
I recommend (a): the condition is the useful part, and the block should not grade systems.
**2.2, 2.4 and 2.8 are publishable only together with (a)**; accept or reject them with it.

### 1.5 `arrows`, Atlassian: the alternative says more than the recording shows (audit blocker)

The current entry says "Arrow keys in the input only move the caret". Atlassian's own recording
contradicts it: on every step the focused combobox has the description ", multiple selections
available, Use left or right arrow keys to navigate selected items" (`atlassian.json`). What the
engine measured is narrower: after Left Arrow, DOM focus stayed on the combobox, the
accessibility tree did not change, and nothing was announced. That is the same picture as Chakra
(1.2): the component may move a highlight the tree does not show.

**Proposed:** remove the Atlassian alternative under `arrows`. Atlassian then stands beside
Chakra under "Other measured differences", in the evaluator's words only. No text should say what
Atlassian's arrow keys do beyond "focus did not move and nothing was announced" until a dated hand
observation says more.

This also touches the verdict, not only the text. The verdict holds as the rule is written (focus
did not move to a chip), but a maintainer may say the component does navigate, in its own way.
The pending screen reader check already asks this exact question for Atlassian
(`docs/a11y-checks/README.md`: "Left Arrow from the empty input: is anything said or does focus
move?"). That check should be done before this verdict is published.

### 1.6 Model, React Aria: the hand check behind "one key" is not recorded (audit major)

The model says "Delete or Backspace removes the focused tag at once, moving focus to a neighbour"
and its basis says this was "checked by hand on 2026-11-09". No observation in `targets.yaml`
records that check. The recordings support part of it: the tag row's description is "Press Delete
to remove tag.", and after a click removal focus is on a neighbouring row. Nothing recorded shows
Backspace inside the grid.

**Options:** (a) if you did that check on 2026-11-09, record it as a dated observation for React
Aria in `targets.yaml`, and the text stands; (b) narrow the text to what is recorded: "Delete
removes the focused tag" (from the description) and drop "or Backspace" and "moving focus to a
neighbour". I cannot tell which is true; the check was not mine.

## 2. The ten entries

Each: current text, proposed text, what it rests on.

### 2.1 `tab`, Atlassian: a Tab stop on every remove button

| | Current | Proposed |
|---|---|---|
| Alternative | A Tab stop on every remove button | (keep) |
| You gain | Discoverability: Tab alone reaches every chip. | Tab alone reaches every remove button; nobody has to know another key. |
| You pay | One extra Tab per chip to get past the field. | One more Tab stop for every selected value on the way past the field. |
| Reasonable when | There are only two or three chips, as in filter bars. | The field rarely holds more than two or three values. |

Rests on: Atlassian `tab` differs, "[shift-tab-out] Shift+Tab moved focus to button "Remove
Hiroshi Matsui" inside the component". Dropped "as in filter bars": an example we did not measure.

### 2.2 `chip-stop`, React Aria: the remove button as its own Tab stop inside each chip

| | Current | Proposed |
|---|---|---|
| Alternative | The remove button as its own Tab stop inside each chip | (keep) |
| You gain | Tab reaches the remove control without knowing that Delete removes a chip. | Tab reaches the remove button, so nobody has to know that Delete removes the focused chip. |
| You pay | One more Tab stop in the chips; APG's grid pattern and its pill list keep one stop and reach the remove control with the arrow keys. | A second Tab stop inside the chips. In the APG pill list, the name and the remove icon are two cells of one grid, reached with the arrow keys. |
| Reasonable when | Users are not expected to know a key that removes the focused chip. | People are not expected to know a key that removes the focused chip. |

Rests on: React Aria `chip-stop` differs, "[chip-tab] From chip 3, Tab moved focus to button
"Remove Hiroshi Matsui" inside the same chip". APG snapshot
`ARIA--apg--patterns--grid--examples--layout-grids.md`, Example 2 notes: "Each logical row has two
cells: one containing a recipient name link and one containing the remove icon for that
recipient."

### 2.3 `tab`, Fluent 2: one more Tab stop for the group of chips

| | Current | Proposed |
|---|---|---|
| Alternative | One more Tab stop for the group of chips | (keep) |
| You gain | Tab alone reaches the chips, without knowing the arrow keys. | Tab alone reaches the chips; nobody has to know the arrow keys to get there. |
| You pay | One extra Tab each way to get past the field. | One more Tab stop in each direction on the way past the field. |
| Reasonable when | The chips are a group users often act on, and the extra stop is announced as a group. | People often act on the chips, and the extra stop is named as a group. |

Rests on: Fluent 2 `tab` differs, "[shift-tab-out] Shift+Tab moved focus to option "Hiroshi
Matsui" inside the component. [tab-from-chip] Tab moved focus to combobox "To" inside the
component."

### 2.4 `bsp`, Atlassian, MUI, Primer: remove on the first Backspace

| | Current | Proposed |
|---|---|---|
| Alternative | Remove on the first Backspace | (keep) |
| You gain | Speed. | One key removes the last value. |
| You pay | Accidental deletion. | A Backspace meant for text removes a value as soon as the input is empty, with no step in between. |
| Reasonable when | The removal is announced and can be undone. | The removal is announced, and the value is easy to add back. |

Rests on: `bsp` differs in all three, "[backspace-twice] The first Backspace removed a chip
immediately." "Can be undone" replaced: no system was measured for undo. See 1.4.

### 2.5 `chip-arrows`: no arrow navigation (see 1.3)

Current: an alternative with no systems ("Simplicity." / "Chips then need their own Tab stops." /
"Lists are very short.").

Proposed, as a note (`kind: 'none'`):

> No alternative within this rule. Where chips have no arrow keys and each is a control in the
> Tab order, the rule does not apply; that design is described under "One stop for the whole
> field".

### 2.6 `arrows`, Atlassian: reach the chips by Tab, not from the input (see 1.5)

Current: "Arrow keys in the input only move the caret." / "One more Tab stop, and no quick way
from the text to the chips." / "The chips are their own group with a single Tab stop."

Proposed: **remove the entry.** Its gain is contradicted by the description Atlassian's own
component exposes, and nothing measured supports a statement about what its arrow keys do. My
first rewording made the cost stronger still ("no way from the text to the chips without leaving
the input") and is withdrawn.

### 2.7 `keep-focus`: no alternative

| | Current | Proposed |
|---|---|---|
| Note | No reasonable alternative found: focus lost to the page leaves keyboard users nowhere. | No reasonable alternative found. When focus falls to the page, a keyboard user has lost their place in the field. |

Rests on: all six systems follow. "Nowhere" replaced with what the engine can see (focus on the
page body); where the next Tab starts differs by browser and was not measured.

### 2.8 `say`: no announcement on removal (see 1.1)

| | Current (Fluent 2 only) | Proposed (Fluent 2, MUI, React Aria, Primer) |
|---|---|---|
| Alternative | Let the new focus tell the change | No announcement on removal |
| You gain | No extra speech: after a removal, the chip that takes focus is announced by name. | No extra speech. Where focus moves to a neighbouring chip, that chip is announced by name. |
| You pay | Nothing says what was removed, and a removal that leaves focus in the input is silent. | Nothing says what was removed. Where focus stays in the input, the removal is silent. |
| Reasonable when | Every removal moves focus to a neighbouring chip whose name is spoken. | Every removal moves focus to a neighbouring chip whose name is spoken. |

Rests on: `say` differs in all four, "The removal was not announced" (React Aria judged on the
click removal only). Recorded: Fluent 2 after the second Backspace, focus on chip 2, "Greg Fisher,
option, 2 of 2, selected"; MUI after the first Backspace, focus in the input, nothing said.

### 2.9 `count`, Atlassian, Chakra UI: name the removed value without the count

| | Current | Proposed |
|---|---|---|
| Alternative | Name the removed value without the count | (keep) |
| You gain | A shorter message on every removal. | (keep) |
| You pay | Without sight there is no quick way to know how many values remain. | A person who cannot see the field learns how many values remain only by moving through every chip. |
| Reasonable when | The field holds one or two values, or the count is announced elsewhere on request. | The field holds one or two values, or the count can be heard another way. |

Rests on: `count` differs in both, for example Atlassian "Removal was announced as "option Greg
Fisher, deselected" without the new count of 2". The cost now uses the rule's own words.

### 2.10 Model, React Aria: the selected values as a separate grid after the input

| | Current | Proposed |
|---|---|---|
| Model | The selected values as a separate grid after the input | (keep) |
| How it works | (three sentences) | (keep) |
| You gain | Each part is a widget screen readers already know, a combobox and then a grid. The tag group works the same with or without an input, and removing a tag takes one key. | Each part is a standard ARIA widget: a combobox, then a grid. The tag group works the same with or without an input, and removing a tag takes one key. |
| You pay | One more Tab stop to get past the field, for the grid. From the input nothing reaches the last chip, so Backspace and Left Arrow do nothing there. | One more Tab stop on the way past the field, for the grid. Backspace and Left Arrow in the input do nothing to the tags. |
| Reasonable when | A library of primitives, where the same tag group also stands alone (filters, categories) and teams compose the field themselves. | (keep) |
| Basis | Arrow keys and Tab inside the grid are measured (chip-arrows, chip-tab). Delete and Backspace inside the grid were checked by hand on the harness page on 2026-11-09. | Arrow keys and Tab inside the grid are measured. Delete and Backspace inside the grid were checked by hand on the measured page on 9 Nov 2026. |

Rests on: React Aria differs on `tab` ("Tab moved focus to row "Irene Oh" inside the component"),
`arrows` and `bsp` ("The first Backspace did not focus the last chip"). "Screen readers already
know" replaced: a claim about screen readers we have not measured. Scenario ids and "harness page"
removed from the basis: internal words. "How it works", "one key" and the basis line depend on
decision 1.6. Audit: "Nothing in the input reaches the tags" read against the entry's own "Tab
moves from the input into a grid of tags"; the cost now names the two keys only.

## 3. After the decisions

1. Apply the accepted texts in `input-with-chips-trade-offs.ts` (and the `seenIn`, `kind` and
   removal changes of 1.1, 1.3 and 1.5; the observation or narrowing of 1.6).
2. If 1.4 (a): add the one line under "Why systems differ" in
   `apps/atlas/src/features/evidence/rule-trade-offs.tsx`.
3. Run the `verdict-auditor` agent, at most two rounds (CLAUDE.md 8).
4. The owner sets `status: 'reviewed'` per entry.

## 4. Left after two audit rounds (2026-11-13)

Round 2 of `verdict-auditor` found no blocker in the proposed state (with 1.1, 1.2a, 1.3, 1.4a and
1.5 taken, and 1.6 decided) and three majors. They are not folded into part 2: two rounds is the
limit (CLAUDE.md 8), so they come to you as they are.

1. **`bsp`, Primer is not a plain "remove on the first Backspace" (2.4, 1.4).** In Primer's
   recording the first Backspace takes the token out and puts its name into the input as text
   (combobox value null to "Hiroshi Matsui", all three runs); the second Backspace removes no
   second token. MUI and Atlassian do not do this. So "undo was not measured in any" in 1.4 is
   wrong for Primer, and the cost and condition of 2.4 read differently for it. Options: list
   Primer apart from Atlassian and MUI, or word the entry to cover a value that returns to the
   input as text. The verdict reason itself matches the recording.
2. **`say`, "the removal is silent" says more than the model shows (2.8, 1.1).** Measured: no live
   region announcement. But where focus stays in the input, the focused input itself changes: in
   MUI its description goes from "3 selected. …" to "2 selected. …", in Primer from "Selected:
   Irene Oh, Greg Fisher, Hiroshi Matsui" to "Selected: Irene Oh, Greg Fisher". Whether a screen
   reader speaks that is not recorded. The cost should stop at "nothing names the removed value";
   "silent" waits for the manual check. That check lists Fluent 2 and Primer; with four systems
   in 2.8 it should also cover MUI and React Aria.
3. **Model and `chip-stop`, React Aria: the Delete claim has no findable basis (2.10, 2.2, 1.6).**
   Under 1.6 (b) the basis line needs its own text, saying the Delete claim comes from the
   description the component exposes ("Press Delete to remove tag."), not from a hand check or a
   measurement. The gain of 2.2 rests on the same description and depends on 1.6 too.

Minors: 1.4 says only Fluent 2 moves focus to a neighbour on every recorded removal, but React
Aria's one recorded removal (the click) does too; 2.10 "How it works" keeps "Keys pressed in the
input never reach the tags" one sentence after "Tab moves from the input into a grid of tags"
(only Backspace and Left Arrow are measured); 2.10 gain "works the same with or without an input"
is unmeasured.

Publish gate outside the texts: Atlassian's `arrows` verdict (1.5) and every "not announced"
finding wait for the manual screen reader check in `docs/a11y-checks/README.md`.
