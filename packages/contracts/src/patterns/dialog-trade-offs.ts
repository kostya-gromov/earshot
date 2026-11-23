import type { TradeOff } from '../schema/index.ts';

/**
 * Trade-offs for the modal dialog, hand-written; each is a draft until the owner reviews it.
 * Reviewed on 2026-11-23: both. For `wrap` the owner took "to the browser's own controls" out of
 * the alternative: the engine records that the document lost focus, not where focus went.
 * The same day he took out its last sentence, "No measured system does this yet.": the site
 * derives that from the data ("Not seen in the measured systems"), and a sentence written by
 * hand would be wrong the day a system differs on `wrap`.
 */
export const dialogTradeOffs: TradeOff[] = [
  {
    // Drafted on 2026-11-21, before any system is measured (decision 6 of the proposal), so no
    // `seenIn` yet: it is added from the measurement files, never from this text.
    // The alternative is what the browser's own element does. Seen by hand that day, not an
    // engine measurement (docs/proposals/dialog.md, "Checked on a throwaway page"): a native
    // dialog opened with showModal() and no key handler, in headless Chromium; after Tab on the
    // last element `document.activeElement` was the body and `document.hasFocus()` false, the
    // next Tab was on the first field, and Shift+Tab did the same the other way. Headless
    // Chromium has no controls of its own to stop on, so how many presses the way round takes
    // in a browser a person uses was not seen, and the text gives no count.
    // The standards allow it: WCAG's Understanding 2.4.3 snapshot says of a modal dialog that
    // content outside it "becomes inert and cannot receive focus (though, depending on
    // implementation, the focus cycle might still include user agent controls)", and lists
    // "H102: Creating modal dialogs with the HTML dialog element" among its techniques. The rule
    // itself is APG's: "If focus is on the last tabbable element inside the dialog, moves focus
    // to the first tabbable element inside the dialog."
    kind: 'alternative',
    ruleId: 'wrap',
    alternative:
      'Tab on the last element takes focus off the page before it comes back to the first element, and Shift+Tab does the same the other way.',
    gain: 'No script of the page’s own decides where Tab goes: the browser keeps focus out of the page behind.',
    cost: 'The first element does not follow the last directly: at each end focus is off the page before it returns. How many presses that takes depends on the browser and was not measured.',
    reasonableWhen:
      'The dialog is built on the browser’s dialog element. WCAG’s page on focus order says that, depending on implementation, a modal dialog’s focus cycle might still include user agent controls, and lists that element among its techniques.',
    status: 'reviewed',
  },
  {
    // Written on 2026-11-21 from React Aria's recording (react-aria-components 1.22.1): the open
    // dialog has the role and its title's name and is not reported as modal. Not an alternative
    // with a gain: in the step that opens the dialog the button "Edit profile" leaves the
    // accessibility tree in React Aria's file and equally in the reference's, Chakra's, Fluent's
    // and MUI's, whose dialogs are reported as modal (verdict audit, 2026-11-21; in Primer's
    // and Atlassian's, also modal, the button stays in the tree), so hiding the
    // outside is not something leaving the property out buys. In the package source (react-aria 3.53.1, read
    // 2026-11-22): useModalOverlay calls ariaHideOutside with shouldUseInert: true, and
    // ariaHideOutside sets element.inert where the browser has it, aria-hidden="true" otherwise.
    // So in the browser measured the outside is inert, and APG's conditions for the aria-hidden
    // technique are not what applies.
    kind: 'none',
    ruleId: 'modal',
    note: 'React Aria’s open dialog is not reported as modal. In its recording the button that opened the dialog leaves the accessibility tree while the dialog is open. Among the systems whose dialog is reported as modal, the button leaves the tree in the recordings of Chakra UI, Fluent 2 and MUI and stays in it in those of GitHub Primer and Atlassian. What leaving the property out gains is not on record.',
    status: 'reviewed',
  },
];
