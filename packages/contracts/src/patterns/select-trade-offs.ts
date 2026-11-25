import type { TradeOff } from '../schema/index.ts';

/**
 * Trade-offs for the select, hand-written, reviewed on the preview page on
 * 2026-11-25 (O4); `selected` stays an alternative, not a model: the rule's level was set from
 * the APG text before anything was measured, and "every system does it" is no mechanism
 * (ADR 0009).
 * `selected` was drafted on 2026-11-24, before any system is measured, as asked: the
 * difference is between two readings of the APG combobox page, both quoted from the snapshot of
 * 2026-11-24. Keyboard section: "Selection follows focus in the listbox". Roles section: "when a
 * suggested value is visually indicated as the currently selected value, the option […] has
 * aria-selected set to true." The same roles section, in a note: "a combobox is a single-select
 * widget where selection follows focus in the popup." `seenIn` comes from the measurement files
 * of 2026-11-24, never from this text: all five systems keep the chosen value selected; MUI and
 * React Aria carry the active option by DOM focus, the other three by aria-activedescendant.
 */
export const selectTradeOffs: TradeOff[] = [
  {
    kind: 'alternative',
    ruleId: 'selected',
    seenIn: ['mui', 'react-aria', 'chakra', 'fluent', 'atlassian'],
    alternative:
      'The chosen value stays selected while the active option is shown apart. One sentence of APG’s roles section allows this reading: aria-selected goes on the option “visually indicated as the currently selected value”.',
    gain: 'Selected means one thing, the value that is chosen, and the list can show it with a check mark while the user walks the other options.',
    cost: 'Which option is active is carried by DOM focus or aria-activedescendant alone; whatever reads the selected state is told the value chosen before, not the option the user is on. The rest of the APG pattern reads the other way: its keyboard section says “Selection follows focus in the listbox” and, for Down Arrow, “Moves focus to and selects the next option”, and a note in the roles section calls a combobox “a single-select widget where selection follows focus in the popup”.',
    reasonableWhen:
      'After every arrow key the active option holds DOM focus or is named by aria-activedescendant, and it looks different from the chosen one.',
    status: 'reviewed',
  },
  {
    // Drafted 2026-11-24 from the measurements: MUI and React Aria move DOM focus onto each
    // option; Chakra UI onto the listbox, which names the active option with
    // aria-activedescendant. In all three Escape and Enter put focus back on the select.
    kind: 'alternative',
    ruleId: 'focus-stays',
    seenIn: ['mui', 'react-aria', 'chakra'],
    alternative:
      'DOM focus moves into the open list: onto each option in turn, or onto the list itself, which names the active option.',
    gain: 'The active option, or the list that names it, is the focused element, so nothing that follows focus has to rely on aria-activedescendant to find it.',
    cost: 'While the list is open the select is not the focused element, so its name and value are not where focus is. APG keeps DOM focus on the combobox.',
    reasonableWhen:
      'Escape and Enter put focus back on the select, and the list, while it holds focus, has a name.',
    status: 'reviewed',
  },
  {
    // Drafted 2026-11-24 from the measurements: React Aria's select is a button named
    // "Banana Fruit" with no value; Atlassian's, without search, is a read-only input named
    // "Fruit" with no value, the chosen option shown in an element it names with
    // aria-describedby.
    kind: 'alternative',
    ruleId: 'name-and-value',
    seenIn: ['react-aria', 'atlassian'],
    alternative:
      'The chosen option is not exposed as the select’s value: it is part of the name, or a description of the field.',
    gain: 'The chosen option is still in what the accessibility tree gives the field, in its name or its description.',
    cost: 'There is no value to read, and when the option is in the name, the name changes with every choice. APG describes comboboxes as having “an accessible name that is distinct from their value”. When the option is only in the description, APG notes that descriptions “are presented last, sometimes after a slight delay”, and that “some screen readers do not announce descriptions by default”.',
    reasonableWhen: 'The name or the description gives the chosen option each time it changes.',
    status: 'reviewed',
  },
];
