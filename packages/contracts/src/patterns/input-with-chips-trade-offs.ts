import type { TradeOff } from '../schema/index.ts';

/**
 * Hand-written trade-offs for input-with-chips (docs/patterns/input-with-chips.md). Drafts until
 * The owner reviews them; the site labels them "Draft, pending review". The two models (Chakra UI's
 * highlight, React Aria's separate grid) were reviewed on 2026-11-15; the alternatives are drafts.
 *
 * Edited 2026-11-13 after an editorial pass checked against the measurements of 2026-11-11 and two
 * verdict-auditor rounds (docs/proposals/trade-off-editorial-pass.md). After the
 * re-measurement of 2026-11-13 (engine 0.11.0) one verdict changed, Chakra UI's bsp, by a change
 * of principle (ADR 0009); a model entry for Chakra UI was added the same day. Rules for these texts:
 * say what the recordings show, never a system's intent; no claim about a screen reader; a
 * "reasonable when" is a condition, not a statement that the listed systems meet it.
 */

export const inputWithChipsTradeOffs: TradeOff[] = [
  {
    kind: 'alternative',
    // Under tab since 2026-11-11 (ADR 0009): separate buttons are not one widget, so chip-stop
    // does not apply to them; their extra stops are charged by the tab recommendation.
    ruleId: 'tab',
    seenIn: ['atlassian'],
    alternative: 'A Tab stop on every remove button',
    gain: 'Tab alone reaches every remove button; nobody has to know another key.',
    cost: 'One more Tab stop for every selected value on the way past the field.',
    reasonableWhen: 'The field rarely holds more than two or three values.',
    status: 'draft',
  },
  {
    kind: 'alternative',
    ruleId: 'chip-stop',
    seenIn: ['react-aria'],
    alternative: 'The remove button as its own Tab stop inside each chip',
    gain: 'Tab reaches the remove button; nobody has to know another key.',
    cost: 'A second Tab stop inside the chips. In the APG pill list, the name and the remove icon are two cells of one grid, reached with the arrow keys.',
    reasonableWhen: 'People are not expected to know a key that removes the focused chip.',
    status: 'draft',
  },
  {
    kind: 'alternative',
    ruleId: 'tab',
    seenIn: ['fluent'],
    alternative: 'One more Tab stop for the group of chips',
    gain: 'Tab alone reaches the chips; nobody has to know the arrow keys to get there.',
    cost: 'One more Tab stop in each direction on the way past the field.',
    reasonableWhen: 'People often act on the chips, and the extra stop is named as a group.',
    status: 'draft',
  },
  {
    kind: 'alternative',
    ruleId: 'bsp',
    // Not Primer: there the first Backspace puts the removed value back into the input as text
    // (recorded, all three runs), which is a different behaviour with its own entry below.
    seenIn: ['atlassian', 'mui'],
    alternative: 'Remove on the first Backspace',
    gain: 'One key removes the last value.',
    cost: 'A Backspace meant for text removes a value as soon as the input is empty, with no step in between.',
    reasonableWhen: 'The removal is announced, and the value is easy to add back.',
    status: 'draft',
  },
  {
    kind: 'alternative',
    ruleId: 'bsp',
    // Written 2026-11-13: under "Other measured differences" Primer carried the same summary as
    // the entry above and read as an oversight (design review). What the recordings show, in all
    // three runs: the first Backspace removes the token and its name appears in the input as
    // text; the second Backspace empties that text in one press and opens the suggestions, with
    // the same name as the active option. Nothing recorded edits the text, so no text here says
    // it can be edited (verdict audit of the same day).
    seenIn: ['primer'],
    alternative: 'The first Backspace turns the last chip back into text',
    gain: 'The name of the last value comes back as text in the input; the next Backspace clears it and opens the suggestions at that name.',
    cost: 'A Backspace meant for text removes the chip at once, with no step in between.',
    reasonableWhen: 'A removed value is usually replaced by another from the suggestions.',
    status: 'draft',
  },
  {
    // Not an alternative: since 2026-11-11 (ADR 0009) chips with no arrow keys are where the rule
    // stops applying, and no judged system differs on it.
    kind: 'none',
    ruleId: 'chip-arrows',
    note: 'No alternative within this rule. Where chips have no arrow keys and each is a control in the Tab order, the rule does not apply; that design is described under “One stop for the whole field”.',
    status: 'draft',
  },
  {
    // No written alternative. Atlassian differs and is not a model: a model needs a mechanism on
    // record with an effect a person can perceive (ADR 0009, 2026-11-15). Its mechanism is on
    // record (its own description says the arrow keys navigate the selected items, and they set
    // aria-activedescendant, to an id no element has), but nothing changes on screen, in the tree
    // or in an announcement. What is recorded and what was seen is given as observations with
    // the system (targets.yaml), without a judgement. React Aria and Chakra UI are explained by
    // the models below.
    kind: 'none',
    ruleId: 'arrows',
    note: 'No alternative is written for this rule. A difference here that is not a model of its own changes nothing a person can perceive when the arrow keys are pressed: nothing on screen, in the accessibility tree or in an announcement. What the component says about these keys is with its evidence, under “Worth knowing about this component”.',
    status: 'draft',
  },
  {
    kind: 'none',
    ruleId: 'keep-focus',
    note: 'No reasonable alternative found. When focus falls to the page, a keyboard user has lost their place in the field.',
    status: 'draft',
  },
  {
    kind: 'alternative',
    ruleId: 'say',
    seenIn: ['fluent', 'mui', 'react-aria', 'primer'],
    alternative: 'No announcement on removal',
    gain: 'No extra speech. Where focus moves to a neighbouring chip, that chip is announced by name.',
    // Not "silent": where focus stays in the input, its description changes ("3 selected" to
    // "2 selected" in MUI), and whether a screen reader speaks that is not measured.
    cost: 'Nothing names the value that was removed.',
    reasonableWhen: 'Every removal moves focus to a neighbouring chip whose name is spoken.',
    status: 'draft',
  },
  {
    kind: 'alternative',
    ruleId: 'count',
    seenIn: ['atlassian', 'chakra'],
    alternative: 'Name the removed value without the count',
    gain: 'A shorter message on every removal.',
    cost: 'A person who cannot see the field learns how many values remain only by moving through every chip.',
    reasonableWhen: 'The field holds one or two values, or the count can be heard another way.',
    status: 'draft',
  },
  {
    // Chakra UI differs on arrows, and since 2026-11-13 on bsp (ADR 0009: one principle for a
    // marked chip). One design explains both, so it is written once, like React Aria's grid
    // (verdict audit of the same day). What the recordings show: focus stays in the input, and
    // from the scenarios' starting state nothing changes in the tree and nothing is announced.
    kind: 'model',
    ruleIds: ['arrows', 'bsp'],
    seenIn: ['chakra'],
    model: 'A highlight that moves over the tags while focus stays in the input',
    howItWorks:
      'Keyboard focus never leaves the input. Backspace or Left Arrow in the empty input ' +
      'highlights the last tag; arrow keys move the highlight, and Backspace or Delete removes ' +
      'the highlighted tag.',
    // Only what the recording shows (verdict audit 2026-11-15): two presses are recorded for the
    // first removal alone; after it the next tag is already highlighted.
    gain: 'From an untouched field, the first Backspace only highlights the last tag; it removes nothing.',
    cost:
      'The highlight is not in the accessibility tree. In the recorded starting state, three ' +
      'values and an untouched input, the first Backspace or Left Arrow is not announced either, ' +
      'so nothing says which tag the next press will remove.',
    reasonableWhen:
      'Every highlight is announced with the tag’s name, whatever came before, or is exposed ' +
      'with aria-activedescendant.',
    basis:
      'Measured: focus stays in the input, nothing is announced from the starting state, the ' +
      'second Backspace removes the tag and names the one highlighted next, and Delete after ' +
      'one Left Arrow removes the last tag. Seen by hand on the measured page, 13 and 15 Nov ' +
      '2026: the highlight itself, that Delete removes the tag the highlight was moved to, and ' +
      'that the highlight is not announced in an untouched field or after a tag is added.',
    status: 'reviewed',
  },
  {
    kind: 'model',
    ruleIds: ['tab', 'arrows', 'bsp'],
    seenIn: ['react-aria'],
    model: 'The selected values as a separate grid after the input',
    howItWorks:
      'The input and the tags are two widgets. Tab moves from the input into a grid of tags; ' +
      'there, arrow keys move between tags, and Delete or Backspace removes the focused tag. ' +
      'Backspace and Left Arrow in the input do not reach the tags.',
    gain: 'Each part is a standard ARIA widget: a combobox, then a grid.',
    cost:
      'One more Tab stop on the way past the field, for the grid, and in this composition a ' +
      'further one on the remove button inside the tag. Backspace and Left Arrow in the input ' +
      'do nothing to the tags.',
    reasonableWhen:
      'A library of primitives, where the same tag group also stands alone (filters, ' +
      'categories) and teams compose the field themselves.',
    // 2026-11-13: an earlier text cited a hand check that no observation records. The removal
    // keys are now read from the library's source at the measured version (targets.yaml notes).
    // 2026-11-15, before review: the extra stop on the remove button is the library's, not our
    // page's. useTag (react-aria 3.53.1) returns removeButtonProps without excludeFromTabOrder,
    // TagGroup (react-aria-components 1.22.1) hands them to the "remove" slot unchanged, and the
    // page renders <Button slot="remove"> as the docs example does.
    basis:
      'Arrow keys and Tab inside the grid are measured, the stop on the remove button with ' +
      'them (Tab from a tag lands on “Remove …”). That stop is the library’s, not this page’s: ' +
      'in the measured version the remove button’s props do not take it out of the Tab ' +
      'order, and the page renders the button as the docs example does. That Delete and ' +
      'Backspace remove the focused tag is read from the library’s source, not measured.',
    status: 'reviewed',
  },
];
