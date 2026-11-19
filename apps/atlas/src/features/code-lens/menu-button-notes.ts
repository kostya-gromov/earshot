import type { ReferenceNote } from './reference-notes';

export const menuButtonFileOrder = [
  'menu-button.html',
  'menu-button.css',
  'menu-button.ts',
  'menu-list.ts',
] as const;

/** Notes on the menu button reference, one per decision a rule rests on. */
export const menuButtonNotes: readonly ReferenceNote[] = [
  {
    file: 'menu-button.html',
    find: 'aria-haspopup="menu"',
    span: 3,
    title: 'The button says what it opens',
    text: 'That it opens a menu, whether the menu is shown, and which element it is.',
  },
  {
    file: 'menu-button.html',
    find: 'Hidden while closed',
    span: 8,
    title: 'A closed menu is out of the tree',
    text: 'So what aria-expanded says and what the tree holds agree.',
  },
  {
    file: 'menu-button.ts',
    find: 'A disabled item is focusable and cannot be activated',
    span: 2,
    title: 'Enter on a disabled item runs nothing',
    text: 'The menu stays open, so the person still knows where they are.',
  },
  {
    file: 'menu-button.ts',
    find: 'parts.onAction(item.name);',
    span: 1,
    title: 'The action runs with focus back on the button',
    text: 'The menu closes and focus moves first, on the two lines above.',
  },
  {
    file: 'menu-button.ts',
    find: 'Enter, Space and Down Arrow open on the first item',
    span: 2,
    title: 'Opening puts focus on an item',
    text: 'Enter and Space are the rule; the two arrows are optional in APG.',
  },
  {
    file: 'menu-button.ts',
    find: 'Escape: () => {',
    span: 4,
    title: 'Escape closes and returns focus',
    text: 'Focus never falls to the page.',
  },
  {
    file: 'menu-button.ts',
    find: 'Tab is left to the browser',
    span: 1,
    title: 'Tab is not handled',
    text: 'Focus moves on by itself, and the menu closes when focus has left.',
  },
  {
    file: 'menu-button.ts',
    find: 'Focus that leaves the button and the menu closes it',
    span: 7,
    title: 'Leaving closes the menu',
    text: 'One rule for Tab and for a click elsewhere.',
  },
  {
    file: 'menu-list.ts',
    find: 'disabled ones included; past either end it wraps',
    span: 4,
    title: 'Arrows reach every item and wrap',
    text: 'A disabled item is not skipped, so it can be found.',
  },
  {
    file: 'menu-list.ts',
    find: 'item.tabIndex = -1;',
    span: 1,
    title: 'Items take focus, and are not Tab stops',
    text: 'The browser scrolls to the focused item and a screen reader reads it.',
  },
  {
    file: 'menu-list.ts',
    find: 'aria-disabled, not removal from focus',
    span: 2,
    title: 'Disabled, and still in the menu',
    text: 'The item keeps its place in the arrow order and says that it is disabled.',
  },
  {
    file: 'menu-button.css',
    find: 'The focused item is shown without colour alone',
    span: 5,
    title: 'Focus is an outline as well as a tint',
    text: 'A tint alone would not show focus to someone who cannot tell it apart.',
  },
];
