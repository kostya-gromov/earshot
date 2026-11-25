import type { TradeOff } from '../schema/index.ts';

/**
 * Trade-offs for the menu button, hand-written; each is a draft until it is reviewed. Reviewed
 * on 2026-11-16: skipped disabled items, the modal open menu, Tab that does nothing. Written
 * before the measurements where a system's own documentation already says what it does, and
 * given `seenIn` only once a recording shows it.
 */
export const menuButtonTradeOffs: TradeOff[] = [
  {
    // Prepared on 2026-11-16, before any system is measured. React Aria's docs say of
    // `disabledKeys` that such items "cannot be selected, focused, or otherwise interacted with":
    // a deliberate choice. No `seenIn` until a recording shows a system doing it. The gain, the
    // cost and the condition are the ones APG itself gives in its practice on disabled controls
    // (docs/sources/ARIA--apg--practices--keyboard-interface.md, "Focusability of disabled
    // controls"): "Allowing keyboard users to skip disabled elements usually reduces the number
    // of key presses required to complete a task"; "screen reader users are far less likely to
    // discover disabled elements that are not focusable because moving focus is one of their
    // primary methods of discovery"; "When users can reasonably infer the presence of a disabled
    // element from nearby focusable elements, it is removed from the keyboard focus order".
    // The cost keeps to APG's own measure, "far less likely to discover": in Chakra UI and
    // Atlassian the skipped item stays in the tree as disabled (verdict audit, 2026-11-16).
    // Recorded on 2026-11-16 for the four systems in `seenIn`: Down Arrow from "Duplicate" made
    // "Delete" active. Fluent 2, GitHub Primer and the reference reach the disabled item.
    kind: 'alternative',
    ruleId: 'disabled',
    seenIn: ['mui', 'react-aria', 'chakra', 'atlassian'],
    alternative: 'The arrow keys skip disabled items',
    gain: 'Fewer key presses: the arrows land only on items that can be used.',
    cost: 'A person who finds the items by moving focus through them, as screen reader users mostly do, is far less likely to find out that the item exists.',
    reasonableWhen:
      'The missing action can be inferred from the items around it, or is said somewhere else on the screen.',
    status: 'reviewed',
  },
  {
    // Checked on 2026-11-16, as asked: is "the button leaves the tree while the menu
    // is shown" (React Aria, MUI) the same design as "Tab does nothing in the menu" (React Aria,
    // Chakra UI)? No: three mechanisms. React Aria and MUI hide the page; of those two only
    // React Aria keeps Tab in the menu; Chakra UI holds Tab without hiding anything, which is the
    // alternative below. So the model is "the open menu is modal", in two systems, and its
    // effect on `tab` is said per system.
    kind: 'model',
    ruleIds: ['expanded', 'tab'],
    seenIn: ['react-aria', 'mui'],
    model: 'The open menu is modal',
    howItWorks:
      'While the menu is shown, everything else on the page is hidden from assistive ' +
      'technology: React Aria marks the rest of the page inert, MUI sets aria-hidden on it. ' +
      'The button that opened the menu is part of what is hidden, so its expanded state ' +
      'cannot be read until the menu closes. Tab is handled by the menu: in React Aria it ' +
      'leaves focus on the same item and the menu stays shown; in MUI it closes the menu and ' +
      'returns focus to the button.',
    gain: 'A screen reader cannot wander out of the open menu into the page behind it.',
    cost:
      'While the menu is shown nothing says that the button is expanded, because the button ' +
      'is not exposed at all. In React Aria, Tab does not leave the menu: Escape or choosing ' +
      'an item is the way out.',
    reasonableWhen:
      'Escape closes the menu and returns focus to the button, and the button is exposed as ' +
      'collapsed again once the menu is gone.',
    basis:
      'Recorded for both: after every step with the menu shown the button was not in the ' +
      'accessibility tree, and it was exposed as collapsed after every step with the menu ' +
      'hidden; Escape closed the menu and returned focus to the button. Recorded for React ' +
      'Aria only: Tab left focus on the same item with the menu shown. Recorded for MUI: Tab ' +
      'closed the menu with focus on the button. Seen with a script on the measured pages, ' +
      '16 Nov 2026: with the menu open, the page’s main element had the inert attribute in ' +
      'React Aria and aria-hidden="true" in MUI. Read in the packages’ source: react-aria ' +
      '3.53.1, usePopover, hides everything outside a popover that is not non-modal, with ' +
      'inert; @mui/material 9.5.0, ModalManager, sets aria-hidden on the siblings of an open ' +
      'modal, and Menu closes on Tab (“tabKeyDown”). On the MUI page the button’s expanded ' +
      'state is written by the docs demo’s own wiring, which the page repeats; the package ' +
      'has no menu button of its own.',
    status: 'reviewed',
  },
  {
    // Chakra UI's menu comes from Zag (@zag-js/menu 1.47.0, menu.connect: a Tab that is not a
    // move between tabbable elements inside the menu is prevented). The rest of the page stays
    // exposed and the button stays expanded in the tree, so this is not the modal model above.
    // The gain is what the recording shows, not a motive read from documentation.
    kind: 'alternative',
    ruleId: 'tab',
    seenIn: ['chakra'],
    alternative: 'Tab does nothing while the menu is shown',
    gain: 'A Tab pressed by mistake does not close the menu or lose the place in it.',
    cost: 'The next field cannot be reached with Tab until the menu is closed with Escape or by choosing an item.',
    reasonableWhen: 'Escape closes the menu and returns focus to the button.',
    status: 'reviewed',
  },
];
