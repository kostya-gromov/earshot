import type { Requirement } from '../schema/index.ts';
import { apg, wcag } from './menu-button-sources.ts';

/**
 * What accessibility asks of the design of a menu button, written on 2026-11-16 and reviewed
 * that day. Each reason follows the cited page as it stands in docs/sources/: `wcag` is
 * used only where the page states the requirement itself.
 * - Focus Visible: "Any keyboard operable user interface has a mode of operation where the
 *   keyboard focus indicator is visible."
 * - Non-text Contrast: "any visual information necessary to indicate state" needs 3:1 against
 *   the adjacent colours, "unless the control is inactive".
 * - Contrast (Minimum): text that is "part of an inactive user interface component" is exempt.
 * - Target Size (Minimum): "The size of the target for pointer inputs is at least 24 by 24 CSS
 *   pixels", or undersized targets are spaced so that 24 px circles do not intersect.
 * - Focus Not Obscured (Minimum): "When a user interface component receives keyboard focus, the
 *   component is not entirely hidden due to author-created content." This is about content that
 *   covers the focused item. A menu that opens past the edge of the window is not covered by
 *   anything, so keeping it on screen is guidance, not this criterion (2026-11-16).
 * - APG, keyboard interface practice: "One benefit of using roving tabindex rather than
 *   aria-activedescendant to manage focus is that the user agent will scroll the newly focused
 *   element into view"; with aria-activedescendant the author is asked to "ensure the active
 *   element is scrolled into view".
 */
export const menuButtonRequirements: Requirement[] = [
  {
    id: 'item-focus-visible',
    title: 'Show which item has focus, at 3:1',
    reason:
      'The arrow keys move focus from item to item, and the item that has it is the only cue to what Enter will run. It needs a focus indicator a person can see, and whatever marks it needs 3:1 against the colours next to it in every theme: an outline or a bar, or a fill that reaches 3:1 against the menu. A faint tint alone may be missed completely by people with low vision.',
    level: 'wcag',
    sources: [
      wcag('2.4.7', 'Focus Visible', 'focus-visible'),
      wcag('1.4.11', 'Non-text Contrast', 'non-text-contrast'),
    ],
  },
  {
    id: 'item-contrast',
    title: 'Item text at least 4.5:1, also on the focused item',
    reason:
      'The focused item changes its background. Text that passes on the plain menu can fail on the highlight, often in one theme only. The text of a disabled item is exempt.',
    level: 'wcag',
    sources: [wcag('1.4.3', 'Contrast (Minimum)', 'contrast-minimum')],
  },
  {
    id: 'item-target',
    title: 'Items at least 24 px tall',
    reason:
      'Items are also chosen with a mouse or a finger, and in a menu the item next to the one you want may delete something. In a dense menu with rows under 24 px, the neighbouring item is easy to hit instead.',
    level: 'wcag',
    sources: [wcag('2.5.8', 'Target Size (Minimum)', 'target-size-minimum')],
  },
  {
    id: 'focused-item-in-view',
    title: 'The focused item is never entirely hidden under other content',
    reason:
      'A bar that stays in place, a banner or another overlay must not cover the item that has focus. An item may be partly covered; one that is entirely hidden leaves a keyboard user with nothing to show where they are.',
    level: 'wcag',
    sources: [wcag('2.4.11', 'Focus Not Obscured (Minimum)', 'focus-not-obscured-minimum')],
  },
  {
    id: 'focused-item-on-screen',
    title: 'The menu opens where it fits, and the focused item scrolls into view',
    reason:
      'A menu that opens past the edge of the window is not covered by anything, so the rule above does not reach it, and the focused item can still be out of sight. The menu opens where it fits in the window, and the focused item scrolls into view when the arrow keys reach it. This matters most where the menu keeps focus and names the item with aria-activedescendant: the browser scrolls to an element that takes focus, and does not scroll to one that is only named, so the design has to ask for it.',
    level: 'guidance',
    sources: [apg.activeDescendant],
  },
];
