import type { Requirement } from '../schema/index.ts';
import { apg, wcag } from './dialog-sources.ts';

/**
 * What accessibility asks of the design of a modal dialog, proposed on 2026-11-23 and approved
 * by the owner that day with the levels below. Each reason follows the cited page as it stands
 * in docs/sources/: `wcag` only where the page states the requirement itself.
 * - APG roles: the dialog's name is "A value set for the aria-labelledby property that refers to
 *   a visible dialog title", or a value for aria-label.
 * - APG keyboard notes: "It is strongly recommended that the tab sequence of all dialogs include
 *   a visible element with role button that closes the dialog, such as a close icon or cancel
 *   button."
 * - APG about: "Inert content outside an active dialog is typically visually obscured or dimmed
 *   so it is difficult to discern". APG roles, on marking a dialog modal: "mark a dialog modal
 *   only when both: Application code prevents all users from interacting in any way with
 *   content outside of it. Visual styling obscures the content outside of it."
 * - Focus Visible: "Any keyboard operable user interface has a mode of operation where the
 *   keyboard focus indicator is visible." Non-text Contrast: "any visual information necessary
 *   to indicate state, such as whether a component is selected or focused must also ensure that
 *   the information used to identify the control in that state has a minimum 3:1 contrast
 *   ratio".
 * - APG keyboard notes: "Generally, focus is initially set on the first focusable element.
 *   However, the most appropriate focus placement will depend on the nature and size of the
 *   content", with the cases the reason below gives in its own words.
 * - Target Size (Minimum): "The size of the target for pointer inputs is at least 24 by 24 CSS
 *   pixels, except when" one of five exceptions holds. Spacing: undersized targets "are
 *   positioned so that if a 24 CSS pixel diameter circle is centered on the bounding box of
 *   each, the circles do not intersect another target or the circle for another undersized
 *   target". Equivalent: "The function can be achieved through a different control on the same
 *   page that meets this criterion". And of spacing: "It is still possible to have very small,
 *   and difficult to activate, targets and meet the requirements of this success criterion".
 */
export const dialogRequirements: Requirement[] = [
  {
    id: 'visible-title',
    title: 'The dialog has a visible title, and the title is its name',
    reason:
      'A title at the top says what the window is for, and when the dialog is named by that title a screen reader says the same words a person sees. A dialog with no visible title can still be named, but then what is heard and what is seen are two different things.',
    level: 'guidance',
    sources: [
      {
        ...apg.roles,
        relation: 'rationale',
        note: 'Cited as rationale: the first of the two ways APG gives to name a dialog refers to a visible dialog title; APG also allows a name given with aria-label.',
      },
    ],
  },
  {
    id: 'visible-close',
    title: 'A visible button closes the dialog',
    reason:
      'Escape closes a dialog, but not everyone knows that or has a keyboard. APG strongly recommends a visible button that closes it, such as a close icon or a Cancel button, in the Tab sequence with the rest.',
    level: 'guidance',
    sources: [apg.keyboard],
  },
  {
    id: 'page-behind-dimmed',
    title: 'The page behind is visibly dimmed',
    reason:
      'While the dialog is open the page behind it cannot be used. Dimming it shows that: a person sees that the dialog is what takes input now, and does not try a control that will not answer. APG asks that a dialog be marked modal only when its styling obscures what is outside it.',
    level: 'guidance',
    sources: [apg.about, apg.roles],
  },
  {
    id: 'dialog-focus-visible',
    title: 'Show focus inside the dialog, at 3:1',
    reason:
      'Tab moves through the dialog’s fields and buttons and wraps at the ends, so focus is the only cue to where typing or Enter will act. Each control needs a focus indicator a person can see, and whatever marks it needs 3:1 against the colours next to it in every theme, also over the dialog’s own surface and its dimmed backdrop.',
    level: 'wcag',
    sources: [
      wcag('2.4.7', 'Focus Visible', 'focus-visible'),
      wcag('1.4.11', 'Non-text Contrast', 'non-text-contrast'),
    ],
  },
  {
    id: 'initial-focus-decided',
    title: 'Decide where focus goes when the dialog opens',
    reason:
      'Focus has to move into the dialog, and where it lands is a design decision. APG gives the first focusable element as the usual place, and other places by content: a static element at the top, such as the title, where the content is long or has structure to read first; the least destructive action where the step is hard to undo; the most used button where the dialog only informs or continues.',
    level: 'guidance',
    sources: [apg.keyboard],
  },
  {
    id: 'close-target',
    title: 'The close button is at least 24 by 24 px',
    reason:
      'A close icon in a corner is often the smallest thing in the dialog, and it is pressed with a mouse or a finger as well as by keyboard. Under 24 by 24 CSS pixels it is easy to miss. The criterion is also met by a smaller target whose 24 px circle touches no other target, or where another control that meets it does the same thing, such as a Cancel button; a small target is no easier to hit for that.',
    level: 'wcag',
    sources: [wcag('2.5.8', 'Target Size (Minimum)', 'target-size-minimum')],
  },
];
