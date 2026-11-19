import type { Rule } from '../schema/index.ts';
import { apg, wcag } from './combobox-sources.ts';

/**
 * The rules and the Atlas recommendation for an editable combobox with a listbox popup and list
 * autocomplete (docs/patterns/combobox.md). Two terms have one meaning in every rule:
 *
 * - **Active option**: the option the combobox names with aria-activedescendant; or the option
 *   that holds DOM focus; or, when neither exists, the one option exposed as selected. Which of
 *   the three it was is charged once, by "Focus stays in the combobox".
 * - **Automatically selected suggestion**: an option that is active, in that same sense, after
 *   typing and before any arrow key. A highlight that only the screen shows is not readable by
 *   the engine; where the first Down Arrow lands on the second option with no such mark before
 *   it, the step is inconclusive, not a difference.
 */
export const comboboxRules: Rule[] = [
  {
    id: 'tab',
    title: 'One Tab stop',
    description:
      'Tab from the combobox, with the popup closed or open, never lands on the popup or on an option, and Shift+Tab back lands on the combobox. APG also keeps the button that opens the popup out of the Tab sequence; the engine knows that button by its expanded state, and a Tab that stops on it differs. A stop on a control with no expanded state, such as a clear button, which APG does not name, is not judged and is shown as recorded. With the popup open, a system that had moved DOM focus onto an option is not judged here: that is charged to “Focus stays in the combobox”.',
    keys: ['Tab', 'Shift+Tab'],
    level: 'rule',
    sources: [apg.keyboard],
  },
  {
    id: 'expanded',
    title: 'Expanded says whether the popup is shown',
    description:
      'The focused combobox is exposed as expanded while its options are in the accessibility tree, and as collapsed once they are gone. Judged after every step of every scenario in which the combobox holds focus; a step that takes focus elsewhere is not judged, because the rule is about the focused combobox. Three things the engine cannot read are not judged either: a listbox with no options, which may be a closed popup kept in the page or an open one with nothing to show; whatever a system shows when the typed text matches nothing; and a combobox whose expanded state sits on a wrapper, not on the focused input. When the popup opens is left to each system, as APG leaves it: on Down Arrow, on focus or on typing.',
    keys: ['ArrowDown', 'Enter', 'Escape'],
    level: 'rule',
    sources: [
      apg.roles,
      {
        ...wcag('4.1.2', 'Name, Role, Value', 'name-role-value'),
        relation: 'related',
        note: 'Related: 4.1.2 asks that states which the user can set can be programmatically set, and that changes to them are notified to assistive technologies; that the state is aria-expanded comes from the APG pattern above.',
      },
    ],
  },
  {
    id: 'down',
    title: 'Down Arrow goes to an option',
    description:
      'When the popup is shown, before the key or because of it, Down Arrow makes an option active: the first one, or the one after a suggestion the combobox selected automatically while the user typed. Both forms of list autocomplete follow. A combobox that does not open on Down Arrow while empty is not judged on that press: APG leaves that to each system. One that opens and makes no option active differs: APG gives opening without moving to Alt+Down Arrow. A combobox that points at an option that does not exist is charged to “Focus stays in the combobox”, not here.',
    keys: ['ArrowDown'],
    level: 'rule',
    sources: [apg.keyboard],
  },
  {
    id: 'focus-stays',
    title: 'Focus stays in the combobox',
    description:
      'While arrow keys move through the options, DOM focus stays on the combobox, and the combobox names the active option with aria-activedescendant that points at an option in the popup. Differs when DOM focus moves onto the options; when an option is marked as selected but aria-activedescendant is not set; or when aria-activedescendant names something that is not an option, an element that does not exist included. Each of these differs here once; arrow keys, selection and Enter are still judged from the active option. Judged only where an arrow key made an option active, moved DOM focus or set the reference; a Down Arrow that reaches no option is charged to “Down Arrow goes to an option”.',
    keys: ['ArrowDown', 'ArrowUp'],
    level: 'rule',
    sources: [apg.keyboard, apg.activeDescendant],
  },
  {
    id: 'arrows',
    title: 'Arrows move through the options',
    description:
      'Down Arrow makes the next option active and Up Arrow the previous one. At the last option, Down Arrow does nothing, returns to the combobox, or moves to the first option, and the same for Up Arrow at the first: the APG pattern names the first two and its own list example does the third, so all three follow. Which one a system takes is recorded. Judged only where an option became active, so a combobox whose Down Arrow reaches no option is charged once, to “Down Arrow goes to an option”. An end of the list that the keys never reached is not judged.',
    keys: ['ArrowDown', 'ArrowUp'],
    level: 'rule',
    sources: [apg.keyboard, apg.listExample],
  },
  {
    id: 'selected',
    title: 'The active option is the selected one',
    description:
      'The active option is exposed as selected, and no other option is. Judged only where an option became active.',
    keys: ['ArrowDown', 'ArrowUp'],
    level: 'rule',
    sources: [
      apg.roles,
      apg.keyboard,
      {
        ...wcag('4.1.2', 'Name, Role, Value', 'name-role-value'),
        relation: 'related',
        note: 'Related: 4.1.2 asks that states which the user can set can be programmatically set, and that changes to them are notified to assistive technologies; that the active option carries aria-selected comes from the APG pattern above.',
      },
    ],
  },
  {
    id: 'enter',
    title: 'Enter accepts the active option',
    description:
      'Enter on an active option closes the popup and accepts the option. Where text stays in the combobox after Enter, it is that option’s value. APG also lets a system act on the value and clear the field, as a recipient field or a command list does: an empty combobox after Enter follows. Differs when the popup stays open, or when the combobox keeps other text. APG also asks for the cursor at the end of the value; the engine does not record the cursor, so that part is not judged. Judged only where an option became active.',
    keys: ['Enter'],
    level: 'rule',
    sources: [apg.keyboard],
  },
  {
    id: 'escape',
    title: 'Escape closes the popup',
    description:
      'Escape with the popup shown closes it, and focus is on the combobox. APG lets a system also clear the text; whether it does is recorded and not judged. Judged only where the popup was shown before the key.',
    keys: ['Escape'],
    level: 'rule',
    sources: [apg.keyboard],
  },
  {
    id: 'say-results',
    title: 'Say that the suggestions changed',
    description:
      'When typing changes the suggestions, a live region says so. An Atlas recommendation: APG does not ask for it. It tells a screen reader user what their typing did before they walk the list. Judged on the first key after which the suggestions changed, by what is announced within the engine’s quiet window; what the message says is the next recommendation. A text counts as that announcement when it does not also appear, in the same form, after a key that left the suggestions as they were; a region that enters the page already holding its text is read the same way. Text that matches nothing is not judged: APG lets the popup simply close. A combobox that writes nothing but whose typed key makes the first match the active option is not judged either: that tells the change another way, a form of autocomplete APG names. One that does both follows.',
    keys: ['a'],
    level: 'recommendation',
    sources: [
      {
        ...wcag('4.1.3', 'Status Messages', 'status-messages'),
        relation: 'related',
        note: 'Related: 4.1.3 asks that a status message can be announced without taking focus, and names “18 results returned” and “No results returned” as status messages. It does not ask a combobox to produce one.',
      },
    ],
  },
  {
    id: 'say-count',
    title: 'Say how many suggestions there are',
    description:
      'The message gives the number of suggestions, or says that there are none. An Atlas recommendation: APG does not ask for it. Judged only where something is announced, so a silent combobox is charged once, to “Say that the suggestions changed”. What a system says for text that matches nothing is recorded and not judged.',
    keys: ['a'],
    level: 'recommendation',
    sources: [
      {
        ...wcag('4.1.3', 'Status Messages', 'status-messages'),
        relation: 'related',
        note: 'Related: the examples of status messages in 4.1.3 carry the count, “18 results returned” and “No results returned”. It does not ask a combobox to produce one.',
      },
    ],
  },
];
