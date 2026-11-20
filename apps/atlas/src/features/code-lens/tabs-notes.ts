import type { ReferenceNote } from './reference-notes';

export const tabsFileOrder = ['tabs.html', 'tabs.css', 'tabs.ts'] as const;

/** Notes on the tabs reference, one per decision a rule rests on. */
export const tabsNotes: readonly ReferenceNote[] = [
  {
    file: 'tabs.html',
    find: 'Roving tabindex',
    span: 1,
    title: 'One Tab stop for the whole list',
    text: 'Only the active tab has tabindex 0, so Tab enters on it and leaves after it.',
  },
  {
    file: 'tabs.html',
    find: 'Every panel is a Tab stop',
    span: 2,
    title: 'Tab reaches the panel',
    text: 'A panel of plain text is a Tab stop, so Tab from its tab does not go past the content.',
  },
  {
    file: 'tabs.ts',
    find: 'each.tabIndex = isActive ? 0 : -1;',
    span: 2,
    title: 'Selection, Tab stop and panel move together',
    text: 'One tab selected, one Tab stop, one panel shown, set in the same pass.',
  },
  {
    file: 'tabs.ts',
    find: 'const tab = parts.tabs[(index + count) % count]!;',
    span: 1,
    title: 'The arrow keys wrap',
    text: 'Past the last tab is the first, and before the first is the last.',
  },
  {
    file: 'tabs.ts',
    find: 'Up and Down Arrow are not handled',
    span: 1,
    title: 'Up and Down Arrow are left to the page',
    text: 'A horizontal list does not take them, so they still scroll.',
  },
];
