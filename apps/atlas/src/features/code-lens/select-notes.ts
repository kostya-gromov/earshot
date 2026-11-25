import type { ReferenceNote } from './reference-notes';

export const selectFileOrder = [
  'select.html',
  'select.css',
  'select.ts',
  'listbox.ts',
  'typeahead.ts',
] as const;

/**
 * Notes on the select reference, one per decision a rule rests on. The first is the draft
 * requirement native-select-first as it reads to an engineer (2026-11-24): in "For code"
 * a note on the reference, not a requirement of its own.
 */
export const selectNotes: readonly ReferenceNote[] = [
  {
    file: 'select.html',
    find: '<div class="select" data-select>',
    span: 1,
    title: 'Try the browser’s select first',
    text: 'A <select> brings its keys and its name and value in the accessibility tree with no script, and in Chrome its look can be styled. Build one like this only for what a customizable select cannot give.',
  },
  {
    file: 'select.html',
    find: 'role="combobox"',
    span: 4,
    title: 'Named by its label, its value apart',
    text: 'The name comes from the label alone and the text is the chosen option, so the tree gives the field’s name and its value as two things.',
  },
  {
    file: 'listbox.ts',
    find: "if (!isOpen) return select.removeAttribute('aria-activedescendant');",
    span: 2,
    title: 'Focus stays on the select',
    text: 'DOM focus never enters the list; the select points at the active option with aria-activedescendant, and at nothing while the list is closed.',
  },
  {
    file: 'select.css',
    find: '--sl-border: var(--line-2, #858c98);',
    span: 1,
    title: 'A border that can be seen',
    text: 'The field’s and the list’s edge keep 3:1 or more against the panel, so the field is found without a fill.',
  },
  {
    file: 'select.css',
    find: '.select__field::after {',
    span: 9,
    title: 'A chevron drawn in CSS',
    text: 'It says the field opens a list, and it is not text, so it is never read as part of the name or the value.',
  },
  {
    file: 'select.css',
    find: 'min-block-size: 24px; /* WCAG 2.5.8 */',
    span: 1,
    title: '24 px options',
    text: 'Each option is a target of at least 24 px, as WCAG 2.5.8 asks.',
  },
  {
    file: 'select.css',
    find: ".select__popup [role='option'][aria-selected='true'] {",
    span: 4,
    title: 'Active option: outline and tint',
    text: 'The active option is shown by an outline as well as a tint, not by colour alone, and in forced colours by Highlight.',
  },
  {
    file: 'listbox.ts',
    find: 'elements.forEach((element, index) => {',
    span: 3,
    title: 'Selection follows the active option',
    text: 'Only the active option is selected while the list is open, as APG’s keyboard section asks.',
  },
  {
    file: 'listbox.ts',
    find: 'moveBy: (delta: number) => moveTo(active + delta),',
    span: 1,
    title: 'The arrows stop at the ends',
    text: 'APG names returning focus or doing nothing at an end. Its list example moves on to the other end, because there Home and End move the editing cursor; in a select they go to the first and last option, so this one stops.',
  },
  {
    file: 'select.ts',
    find: 'Escape: (list) => list.close(),',
    span: 1,
    title: 'Escape keeps the value',
    text: 'The list closes and the chosen option stays what it was.',
  },
];
