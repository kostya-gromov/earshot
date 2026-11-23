import type { Rule } from '../schema/index.ts';
import { apg, wcag } from './dialog-sources.ts';

/**
 * The rules and the two Atlas recommendations for a modal dialog opened by a button
 * (docs/proposals/dialog.md, opened 2026-11-21; every decision answered by the owner that day).
 * Four terms have one meaning in every rule:
 *
 * - **The dialog**: the element with role dialog in the accessibility tree, wherever on the page
 *   the system renders it. Open means such an element is in the tree; closed means none is.
 * - **Inside the dialog**: focus is on that element or on a descendant of it.
 * - **The invoker**: the button that opened the dialog.
 * - **The visible title**: the name of the first heading inside the dialog, as the tree exposes it.
 *
 * One defect, one rule: focus that stays on the invoker belongs to `open-focus`; focus on the
 * dialog container to `focus-not-on-dialog`, not `open-focus`; Tab that lands on the page behind
 * to `contained`, not `wrap`; Tab that leaves the page for the browser's own controls before it
 * comes back to `wrap`, not `contained`; Escape that does nothing to `escape`, not
 * `return-focus`; focus lost when the dialog closes to `return-focus`; an empty name to
 * `named-dialog`, a name that is not the title to `name-matches-title`; a click that reaches the
 * page behind to `outside-inert`.
 *
 * Where focus lands on opening is recorded, not judged, apart from the container: APG's advice
 * depends on the nature and size of the content.
 */
export const dialogRules: Rule[] = [
  {
    id: 'open-focus',
    title: 'Opening moves focus into the dialog',
    description:
      'After the button opens the dialog, focus is on an element inside the dialog. Which element is recorded and shown, not judged. Differs when focus stays on the button or lands anywhere else outside the dialog.',
    keys: ['Enter'],
    level: 'rule',
    sources: [apg.keyboard],
  },
  {
    id: 'focus-not-on-dialog',
    title: 'Focus is not put on the dialog itself',
    description:
      'On opening, focus is on an element inside the dialog and not on the dialog container. With the whole dialog focused, the focus indicator is as large as the dialog and a screen reader reads its label and content together, so where focus is becomes hard to tell. An Atlas recommendation: APG says it on its example page, about a dialog with a lot of text. Not judged when focus did not move into the dialog.',
    keys: ['Enter'],
    level: 'recommendation',
    sources: [
      {
        ...apg.example,
        relation: 'rationale',
        note: 'Cited as rationale: the text of the example’s Verification Result dialog asks not to make the element with role dialog focusable, and says why.',
      },
    ],
  },
  {
    id: 'contained',
    title: 'Tab stays inside the dialog',
    description:
      'While the dialog is open, Tab and Shift+Tab never put focus on an element of the page outside the dialog or let it fall to the document. Tab that leaves the page for the browser’s own controls and comes back is the question of “Tab wraps at the ends”, not of this rule. Not judged when focus never moved into the dialog.',
    keys: ['Tab', 'Shift+Tab'],
    level: 'rule',
    sources: [apg.about, apg.keyboard],
  },
  {
    id: 'wrap',
    title: 'Tab wraps at the ends',
    description:
      'Tab on the last element inside the dialog that Tab stops on moves focus to the first, and Shift+Tab on the first moves it to the last. Differs when Tab at an end leaves the page for the browser’s own controls before it comes back. Not judged when focus never moved into the dialog, or left it for the page behind it.',
    keys: ['Tab', 'Shift+Tab'],
    level: 'rule',
    sources: [
      apg.keyboard,
      {
        ...wcag('2.4.3', 'Focus Order', 'focus-order'),
        relation: 'related',
        note: 'Related: its modal dialog example says that, depending on implementation, the focus cycle might still include user agent controls.',
      },
    ],
  },
  {
    id: 'escape',
    title: 'Escape closes the dialog',
    description:
      'Escape closes the dialog, also when focus is in a text field with text typed into it.',
    keys: ['Escape'],
    level: 'rule',
    sources: [apg.keyboard],
  },
  {
    id: 'return-focus',
    title: 'Closing returns focus to the button',
    description:
      'When the dialog closes, by Escape or by its Cancel button, focus is on the button that opened it. Differs when focus falls to the document or lands on another element. A close by a click outside is recorded and not judged: only some systems close on that click, so it cannot be compared across all of them. Not judged when the dialog did not close.',
    keys: ['Escape'],
    level: 'rule',
    sources: [
      { ...apg.keyboard, note: 'The note under the keyboard section, on where focus returns.' },
    ],
  },
  {
    id: 'named-dialog',
    title: 'The dialog has a role and a name',
    description:
      'The open dialog is in the accessibility tree with the role dialog and an accessible name that is not empty.',
    keys: ['Enter'],
    level: 'rule',
    sources: [apg.roles],
  },
  {
    id: 'name-matches-title',
    title: 'The name is the visible title',
    description:
      'The dialog’s accessible name is the same as its visible title. Otherwise a person hears one title and sees another. An Atlas recommendation: APG also allows a name given with aria-label, so this goes further than the page. Not judged when the dialog has no name, or no heading to compare it with.',
    keys: ['Enter'],
    level: 'recommendation',
    sources: [
      {
        ...apg.roles,
        relation: 'rationale',
        note: 'Cited as rationale: the first of the two ways APG gives to name a dialog refers to a visible dialog title.',
      },
    ],
  },
  {
    id: 'modal',
    title: 'The dialog says it is modal',
    description:
      'The open dialog is exposed as modal in the accessibility tree. Judged from the tree, so the browser’s own dialog element opened as modal counts as much as one with aria-modal="true".',
    keys: ['Enter'],
    level: 'rule',
    sources: [apg.roles],
  },
  {
    id: 'outside-inert',
    title: 'The page behind cannot be used',
    description:
      'A click on a text field of the page outside the open dialog does not put focus in that field while the dialog stays open. The dialog closing on that click follows as well.',
    keys: ['Enter'],
    level: 'rule',
    sources: [apg.about],
  },
];
