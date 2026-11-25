import type { TradeOff } from '../schema/index.ts';

/**
 * Hand-written trade-offs for combobox (docs/patterns/combobox.md), from the measurements of
 * 2026-11-14 (engine 0.12.8). All four were read that day and are reviewed. On
 * 2026-11-25 the model below gained the sentence of APG's roles section it rests on, quoted from
 * docs/sources/ARIA--apg--patterns--combobox.md (line 272), as the reviewed select trade-off does;
 * made by Claude as asked ("do as you think right"), after a verdict audit. Rules for
 * these texts, as for input with chips: say what the recordings show, never a system's intent;
 * no claim about a screen reader; a "reasonable when" is a condition, not a statement that the
 * listed systems meet it.
 */
export const comboboxTradeOffs: TradeOff[] = [
  {
    kind: 'model',
    ruleIds: ['selected'],
    seenIn: ['mui', 'react-aria', 'chakra', 'fluent', 'atlassian'],
    model: 'Selected marks the chosen value, not the active option',
    howItWorks:
      'While the user walks the list, arrow keys move aria-activedescendant and the option it ' +
      'names is not exposed as selected. Once a value is chosen and the list is shown again, ' +
      'that value is the selected option, and in MUI, React Aria and Atlassian it stays ' +
      'selected when the arrow keys move on to another option. The APG ' +
      'pattern asks for aria-selected on the active option (“Selection follows focus in the ' +
      'listbox”, Listbox Popup Keyboard Interaction), and its list example does the same. One ' +
      'sentence of its roles section allows the other reading: aria-selected goes on the option ' +
      '“visually indicated as the currently selected value”.',
    gain: 'Selected means one thing, the value that was chosen.',
    cost:
      'Which option is current is carried by aria-activedescendant alone. Whatever reads the ' +
      'selected state instead is told nothing while the user walks the list.',
    reasonableWhen: 'aria-activedescendant names the active option after every arrow key.',
    basis:
      'Recorded for all five: an active option with no selected option (type-then-move), and ' +
      'the chosen value as the selected option when the list is shown again (reopen). Recorded ' +
      'for MUI, React Aria and Atlassian only: the chosen value still selected while another ' +
      'option is active (the last step of reopen). In Chakra UI and Fluent 2 the reopened list ' +
      'holds the chosen value alone, so that step shows nothing more. GitHub Primer marks the ' +
      'active option as selected, as the APG pattern asks.',
    status: 'reviewed',
  },
  {
    kind: 'alternative',
    ruleId: 'down',
    seenIn: ['mui'],
    alternative: 'In an empty field, the first Down Arrow only opens the popup',
    gain: 'Opening the list changes nothing else: no option is active until the user moves.',
    cost: 'The press that opens the list reaches no option; the first one takes at least one more key.',
    reasonableWhen: 'The next Down Arrow goes to the first option.',
    status: 'reviewed',
  },
  {
    kind: 'alternative',
    ruleId: 'tab',
    seenIn: ['fluent'],
    alternative: 'The button that opens the popup is a Tab stop',
    gain: 'Tab alone reaches a way to open the list; nobody has to know an arrow key.',
    cost: 'One more Tab stop on the way past the field. APG keeps that button out of the Tab sequence.',
    reasonableWhen: 'The list can also be opened from the input with the keyboard.',
    status: 'reviewed',
  },
  {
    kind: 'alternative',
    ruleId: 'say-results',
    // Not Fluent 2: there the typed key makes the first match active, which the rule does not judge.
    seenIn: ['mui', 'chakra'],
    alternative: 'No message when the suggestions change',
    gain: 'No extra speech while the user is typing.',
    cost: 'Nothing says that the list changed, or how long it now is, until the user moves into it.',
    reasonableWhen: 'The first arrow key names the option and its place in the list.',
    status: 'reviewed',
  },
];
