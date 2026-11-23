import type { ReferenceNote } from './reference-notes';

export const dialogFileOrder = ['dialog.html', 'dialog.css', 'dialog.ts'] as const;

/** Notes on the dialog reference, one per decision a rule rests on. */
export const dialogNotes: readonly ReferenceNote[] = [
  {
    file: 'dialog.html',
    find: 'The native element: showModal()',
    span: 2,
    title: 'The browser’s own dialog',
    text: 'Opened as modal, it is reported as modal, the page behind is inert, Escape closes it and focus returns to the button.',
  },
  {
    file: 'dialog.html',
    find: 'aria-labelledby="dialog-title"',
    span: 1,
    title: 'Named by its visible title',
    text: 'The name a screen reader says is the title a person sees.',
  },
  {
    file: 'dialog.ts',
    find: 'opener.addEventListener',
    span: 1,
    title: 'showModal(), not show()',
    text: 'Only a dialog opened as modal makes the page behind inert.',
  },
  {
    file: 'dialog.ts',
    find: 'const edge = event.shiftKey ? first : last;',
    span: 4,
    title: 'Tab wraps at the ends',
    text: 'Tab on the last element goes to the first and Shift+Tab on the first to the last, as APG asks; the native element is given this handler for it.',
  },
];
