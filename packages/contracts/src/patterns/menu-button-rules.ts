import type { Rule } from '../schema/index.ts';
import { apg, wcag } from './menu-button-sources.ts';

/**
 * The rules and the Earshot recommendations for a button that opens a menu of actions
 * (docs/patterns/menu-button.md; proposal approved 2026-11-16). Three terms have one meaning in
 * every rule:
 *
 * - **Active item**: the menu item that holds DOM focus, or the item the focused menu names with
 *   aria-activedescendant. APG gives both ways of moving focus in a menu; which one a system
 *   uses is recorded and shown, never judged.
 * - **Shown**: the menu is in the accessibility tree with at least one item, wherever on the page
 *   it is rendered.
 * - **Activated**: the item did what it is for. Every measured page writes "Last action: <item>"
 *   when an item's own handler runs, and the engine reads that line; the menu closing is not
 *   taken as a sign of it, in either direction.
 */
export const menuButtonRules: Rule[] = [
  {
    id: 'open',
    title: 'Enter and Space open the menu on its first item',
    description:
      'With focus on the button, Enter opens the menu and makes its first item the active one; Space does the same. Differs when the menu is not shown after the key, or is shown with no active item or with another item active. Down Arrow and Up Arrow on the button are optional in APG, so they are recorded and not judged.',
    keys: ['Enter', 'Space'],
    level: 'rule',
    sources: [apg.buttonKeyboard],
  },
  {
    id: 'expanded',
    title: 'Expanded says whether the menu is shown',
    description:
      'The button is exposed as expanded while the menu is shown and as collapsed while it is hidden. Judged after every step in which the button is in the accessibility tree; a step after which it is not there is not judged. A button that is there with no expanded state differs: APG asks for false while the menu is hidden, and no state is not false. The rule follows only when both states were read somewhere in the measurement; where one of them never could be, it is inconclusive.',
    keys: ['Enter', 'Escape'],
    level: 'rule',
    sources: [
      apg.buttonRoles,
      {
        ...wcag('4.1.2', 'Name, Role, Value', 'name-role-value'),
        relation: 'related',
        note: 'Related: 4.1.2 asks that states the user can set can be programmatically set; that the state is aria-expanded on the button comes from the APG pattern above.',
      },
    ],
  },
  {
    id: 'arrows',
    title: 'Arrows move through the items',
    description:
      'With the menu shown, Down Arrow makes the next item active and Up Arrow the previous one. At the last item Down Arrow either wraps to the first or stays; at the first item Up Arrow either wraps to the last or stays. Both follow: APG makes wrapping optional. Judged between items that can be activated; whether a disabled item is reached on the way is the question of “A disabled item can be reached”.',
    keys: ['ArrowDown', 'ArrowUp'],
    level: 'rule',
    sources: [apg.menuKeyboard],
  },
  {
    id: 'home-end',
    title: 'Home and End, where arrows do not wrap',
    description:
      'Where the arrow keys do not wrap from the last item to the first, Home makes the first item active and End the last. APG asks for these keys only in that case, so a menu whose arrows wrap is not applicable here: what its Home and End do is optional behavior, recorded and shown, not judged.',
    keys: ['Home', 'End'],
    level: 'rule',
    sources: [apg.menuKeyboard],
  },
  {
    id: 'tab',
    title: 'Tab leaves the menu and closes it',
    description:
      'With the menu shown, Tab moves focus out of the menu and the menu is no longer shown. Menu items are never Tab stops: a Tab that lands on another item differs. Where focus goes after it left the menu is recorded, not judged: APG says only that it moves out.',
    keys: ['Tab'],
    level: 'rule',
    sources: [apg.menuKeyboard],
  },
  {
    id: 'escape',
    title: 'Escape closes the menu and returns to the button',
    description:
      'With the menu shown, Escape closes it and focus is on the button that opened it. Differs when the menu stays shown, or when it closes and focus is anywhere else, the document included.',
    keys: ['Escape'],
    level: 'rule',
    sources: [apg.menuKeyboard],
  },
  {
    id: 'activate',
    title: 'Enter activates the item and closes the menu',
    description:
      'With an item active, Enter activates it and the menu is no longer shown. Activation is read from the page: the item’s own handler writes “Last action” with the item’s name. Differs when the action did not run, or when it ran and the menu stays shown. Where focus goes afterwards is the next recommendation.',
    keys: ['Enter'],
    level: 'rule',
    sources: [apg.menuKeyboard],
  },
  {
    id: 'focus-returns',
    title: 'Focus returns to the button after an action',
    description:
      'After an item is activated and the menu closes, focus is on the button. An Earshot recommendation: the APG pattern says where focus goes after Escape and is silent after an action, while its own example sets focus on the menu button. Judged only where the item was activated and the menu closed. Differs when focus is anywhere else; when it falls to the document, a keyboard user has lost their place.',
    keys: ['Enter'],
    level: 'recommendation',
    sources: [
      { ...apg.actionsExample, note: 'The example’s keyboard table for Enter in the menu.' },
      {
        ...wcag('2.4.3', 'Focus Order', 'focus-order'),
        relation: 'related',
        note: 'Related: 2.4.3 asks that focus order preserves meaning and operability; it does not say where focus goes when a menu closes.',
      },
    ],
  },
  {
    id: 'disabled',
    title: 'A disabled item can be reached and cannot be activated',
    description:
      'The disabled item becomes the active item when the arrow keys reach its place, is exposed as disabled, and Enter on it does not activate it. An Earshot recommendation: APG states this as a note to the menu pattern and, in its practice on disabled controls, as a convention with a cost on each side. Differs when the arrows skip the item, when Enter runs its action, or when no item is exposed as disabled (APG: “When a menu item is disabled, aria-disabled is set to true”). Whether the menu closes on that Enter is recorded and not judged: APG says only that the item cannot be activated.',
    keys: ['ArrowDown', 'Enter'],
    level: 'recommendation',
    sources: [apg.menuKeyboard, apg.menuRoles, apg.disabledControls],
  },
];
