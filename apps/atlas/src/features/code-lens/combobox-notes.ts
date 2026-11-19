import type { ReferenceNote } from './reference-notes';

export const comboboxFileOrder = [
  'combobox.html',
  'combobox.css',
  'combobox.ts',
  'option-list.ts',
  'announcer.ts',
] as const;

/** Notes on the combobox reference, one per decision a rule or a requirement rests on. */
export const comboboxNotes: readonly ReferenceNote[] = [
  {
    file: 'combobox.html',
    find: 'role="combobox"',
    span: 4,
    title: 'The input is the combobox',
    text: 'The role, the popup state and the list it controls sit on the input itself.',
  },
  {
    file: 'combobox.html',
    find: 'Hidden while closed',
    span: 2,
    title: 'A closed list is out of the tree',
    text: 'So what aria-expanded says and what the tree holds agree.',
  },
  {
    file: 'combobox.html',
    find: 'Live region exists from the start',
    span: 2,
    title: 'The live region exists from load',
    text: 'Regions inserted later are often missed by screen readers.',
  },
  {
    file: 'combobox.ts',
    find: 'the caret stays where it is',
    span: 2,
    title: 'Arrows open the list, then move',
    text: 'Down Arrow in a closed field goes straight to an option.',
  },
  {
    file: 'combobox.ts',
    find: 'Open: close and keep the text',
    span: 3,
    title: 'Escape closes and keeps the text',
    text: 'A second Escape, with the list closed, clears the field.',
  },
  {
    file: 'combobox.ts',
    find: 'parts.announce(countMessage',
    span: 1,
    title: 'Say how many suggestions',
    text: 'After every change of the list, also when nothing matches.',
  },
  {
    file: 'option-list.ts',
    find: "'aria-activedescendant', optionId",
    span: 2,
    title: 'Focus stays in the input',
    text: 'The active option is named by reference; DOM focus never moves.',
  },
  {
    file: 'option-list.ts',
    find: 'Shows these options with none active',
    span: 6,
    title: 'Typing selects nothing',
    text: 'Manual selection: the first arrow key picks an option.',
  },
  {
    file: 'option-list.ts',
    find: "'aria-selected'",
    span: 1,
    title: 'The active option is the selected one',
    text: 'Exactly one option is selected: the one the arrows reached.',
  },
  {
    file: 'announcer.ts',
    find: 'Clear first',
    span: 4,
    title: 'Repeated messages still speak',
    text: 'Clearing first makes the same text a new change.',
  },
  {
    file: 'combobox.css',
    find: 'without colour alone',
    span: 6,
    title: 'Active option: outline and tint',
    text: 'The outline carries the state where a tint is too faint.',
  },
  {
    file: 'combobox.css',
    find: 'WCAG 2.5.8',
    span: 1,
    title: '24 px option height',
    text: 'Padding comes on top of the minimum.',
  },
];
