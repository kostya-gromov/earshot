# Proposal: pattern 5, modal dialog (a window over the page, opened by a button)

- Opened: 2026-11-21. **On the site since 2026-11-23**: six systems measured, the page at
  `/patterns/dialog/` after the VoiceOver check. Before that: **opened on 2026-11-21** (decision 1: the work
  starts now, alongside M5). Decisions 2 to 8 were answered the same day, each as
  recommended, with `@atlaskit/modal-dialog` approved in decision 7; decision 9 is deferred.
  Three more answers that day, each as recommended: the harness follows the docs' form example
  where it sets `autoFocus`, with the bare default measured as a variant; `contained` and `wrap`
  say when they are not judged; the trade-off for `wrap` is drafted before any system is
  measured. The rule table below is the proposal as amended that day, kept for the record; once
  the contracts exist, the current rules live there and in `docs/patterns/dialog.md`.
- Amended on 2026-11-21, before approval: `named-dialog` asked for more than APG
  does and is split into `named-dialog` and the recommendation `name-matches-title`; focus
  guards are checked on one system before any evaluator (done, MUI, below); decision 9 waits
  for the preview page.
- Sources, read on 2026-11-21 from the live pages with the snapshot tool's own text extraction
  (`packages/contracts/scripts/sources/page-text.ts`); the hash is the one that tool computes:
  - [Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), hash
    `17a4fee2e15d2e52`
  - [Modal Dialog Example](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/),
    hash `6fdc5df6a55e660f`
  - [Alert Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/), hash
    `9531196cd6545b39`, read for the scope only
  - [Understanding No Keyboard Trap](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html),
    hash `9d478ce291908782`
  - From `docs/sources/`: `ARIA--apg--practices--keyboard-interface.md` ("Persistence of focus"),
    `WCAG22--Understanding--focus-order.md` (its modal dialog example) and
    `WCAG22--Understanding--focus-not-obscured-minimum.md` ("Modal dialogs"). All fourteen
    snapshots that contain "dialog" or "modal" were searched; the other eleven say nothing about
    how a modal dialog behaves.

  Every quote below is word for word from those texts. The four live pages are not in
  `docs/sources/` yet: the tool snapshots only pages a rule cites, so they are snapshotted with
  the contracts, and the rules are re-read against the snapshots then (as for menu button and
  tabs).

## Before the pattern: scope and milestone

`CLAUDE.md` 3 lists four patterns for phase 1 and 7 says the current milestone is M5,
validation. A modal dialog is a fifth pattern. This document is the proposal that section 7 asks
for and nothing more; opening the work itself needs a line in both sections (decision 1).

## Scope

One variant: a **modal dialog opened by a button, with a visible title, one text field and two
buttons (Cancel, Save)**, small enough to need no scrolling. Each system is measured as it ships
by default: where it puts focus on opening, whether it adds its own close button, how it marks
the dialog modal.

Out of scope for this pattern: an alert dialog (role `alertdialog`, its own APG pattern), a
non-modal dialog, a dialog opened from another dialog, a drawer or sheet, a popover, a dialog
with content long enough to scroll, and a dialog whose invoker is gone when it closes.

## Rules

Levels as in the four measured patterns: **rule** when the cited page asks for it,
**recommendation** when it is a note's advice or Atlas goes further and says so.

| id (draft) | Level | Expectation | Quote |
| --- | --- | --- | --- |
| `open-focus` | rule (APG) | After the button opens the dialog, focus is on an element inside the dialog. Which element is recorded and shown, not judged. | "When a dialog opens, focus moves to an element inside the dialog." |
| `contained` | rule (APG) | While the dialog is open, Tab and Shift+Tab never put focus on an element of the page outside the dialog. | "Like non-modal dialogs, modal dialogs contain their tab sequence. That is, Tab and Shift + Tab do not move focus outside the dialog." |
| `wrap` | rule (APG) | Tab on the last tabbable element inside the dialog moves focus to the first one, and Shift+Tab on the first moves it to the last. | "If focus is on the last tabbable element inside the dialog, moves focus to the first tabbable element inside the dialog." "If focus is on the first tabbable element inside the dialog, moves focus to the last tabbable element inside the dialog." |
| `escape` | rule (APG) | Escape closes the dialog, also when focus is in the text field with text typed. | "Escape: Closes the dialog." |
| `return-focus` | rule (APG) | When the dialog closes, by Escape or by Cancel, focus is on the button that opened it. | "When a dialog closes, focus returns to the element that invoked the dialog unless either: The invoking element no longer exists. […] The work flow design includes the following conditions that can occasionally make focusing a different element a more logical choice" |
| `named-dialog` | rule (APG) | The open dialog is in the accessibility tree with the role `dialog` and an accessible name that is not empty. | "The element that serves as the dialog container has a role of dialog." "The dialog has either: A value set for the aria-labelledby property that refers to a visible dialog title. A label specified by aria-label." |
| `name-matches-title` | recommendation | The dialog's accessible name is the same as its visible title. Otherwise a person hears one title and sees another. APG allows a name from `aria-label` too, so this goes further than the page and says so. | Cited as rationale: "A value set for the aria-labelledby property that refers to a visible dialog title." |
| `modal` | rule (APG), how it is judged is decision 4 | The open dialog says it is modal in the accessibility tree. | "The dialog container element has aria-modal set to true." |
| `outside-inert` | rule (APG), decision 5 | A click on a text field of the page outside the open dialog does not put focus in that field while the dialog stays open. The dialog closing on that click follows as well. | "Windows under a modal dialog are inert. That is, users cannot interact with content outside an active dialog window." "…in some implementations, attempts to interact with the inert content cause the dialog to close." |
| `focus-not-on-dialog` | recommendation, decision 3 | On opening, focus is on an element inside the dialog and not on the dialog container itself. | Example page: "Please DO NOT make the element with role dialog focusable!" with its two reasons: "The larger a focusable element is, the more difficult it is to visually identify the location of focus" and "Screen readers read the label and content of focusable elements. […] If a dialog like this one has focus, the actual focus is difficult to comprehend." |

Three terms, one meaning in every rule:

- **The dialog.** The element with role `dialog` in the accessibility tree, wherever on the page
  the system renders it. **Open** means such an element is in the tree; **closed** means none is.
- **Inside the dialog.** Focus is on that element or on a descendant of it.
- **The invoker.** The button that opened the dialog in this scenario.
- **The visible title.** The name of the first heading inside the dialog, as the tree exposes
  it. A dialog with no heading in the tree leaves `name-matches-title` `inconclusive`, with that
  reason.

**Where focus lands on opening is recorded, not judged**, apart from `focus-not-on-dialog`. APG
gives a default and then four cases that override it: "Generally, focus is initially set on the
first focusable element. However, the most appropriate focus placement will depend on the nature
and size of the content." The page then shows each system's choice (the first field, its own
close button, the title, the container) as a fact, with a hand-written trade-off.

Not proposed as rules, with the reason:

- **A visible close button.** "It is strongly recommended that the tab sequence of all dialogs
  include a visible element with role button that closes the dialog, such as a close icon or
  cancel button." Every target gets a Cancel button from our own setup, so the rule would judge
  the scenario, not the system. Whether a system adds a close button of its own is recorded; the
  sentence is a candidate design requirement for the pattern page.
- **`aria-describedby`.** APG makes it optional and advises against it for structured content.
- **What is hidden from a screen reader outside the dialog.** `modal` judges what the dialog
  says about itself. Whether the page behind it is also removed from the accessibility tree
  (the legacy `aria-hidden` technique APG describes) is recorded if the engine can see it, and
  not judged in the first version.
- **Scroll locking, the dimmed backdrop, focus visibility.** The engine does not judge pixels.
  "Visual styling obscures the content outside of it" is a candidate design requirement.
- **An announcement.** Focus moves into the dialog, and WCAG "Status Messages" says of a dialog:
  "As a result of taking focus, the new change of context is already announced by the screen
  reader". Nothing here is silent the way a removal is, so no "say" rule is proposed.

### One defect, one rule

| What a system does | Charged to | Not charged to |
| --- | --- | --- |
| The dialog opens and focus stays on the invoker | `open-focus` | `contained` (judged only once focus is inside) |
| Focus lands on the dialog container | `focus-not-on-dialog` | `open-focus` (the container is inside) |
| Tab from the last element lands on a page element behind the dialog | `contained` | `wrap` (not judged when focus left the dialog) |
| Tab from the last element leaves the page for the browser's own controls and then comes back to the first | `wrap` | `contained` (focus never landed on the page outside) |
| Escape does nothing | `escape` | `return-focus` (not judged when the dialog did not close) |
| The dialog closes and focus falls to the page's body | `return-focus` | `escape` |
| Role `dialog` with an empty name | `named-dialog` | `name-matches-title` (not judged without a name), `modal` |
| A name that is not the visible title | `name-matches-title` | `named-dialog` (the name is there) |
| A click outside puts focus in the outside field, dialog still open | `outside-inert` | `contained` (keyboard only) |

The fourth row needs a note from the standards. WCAG says of a modal dialog, twice: "depending
on implementation, the focus cycle might still include user agent controls" (Focus Order, and
the same words in No Keyboard Trap). APG's `wrap` wording does not mention this. A system built
on the browser's own `<dialog>` may therefore differ on `wrap` for a reason WCAG names; that is
the hand-written trade-off for `wrap`. What the engine sees in that case was checked and is
written below.

## Scenarios

Start for all: a page with a text field "Email", a button "Edit profile" and a text field
"Notes" (the names the reference uses; a harness page keeps its own two fields). The button opens a dialog titled "Edit profile" holding a text field "Name", then
Cancel and Save. Whatever a system adds by default (a close button) stays. Focus on the button;
the dialog closed.

1. `open`: Enter. Judges `open-focus`, `focus-not-on-dialog`, `named-dialog`,
   `name-matches-title`, `modal`; records
   where focus landed.
2. `tab-forward`: Enter, then Tab six times. Judges `contained`, `wrap`. Six is more than any
   candidate dialog's tabbable elements, so the last-to-first step falls inside the run whatever
   a system adds.
3. `tab-backward`: Enter, then Shift+Tab six times. Judges `contained`, `wrap`.
4. `escape`: Enter, Escape. Judges `escape`, `return-focus`.
5. `escape-typing`: Enter, click the Name field, type "Ada", Escape. Judges `escape`,
   `return-focus`.
6. `cancel`: Enter, click Cancel. Judges `return-focus`.
7. `outside-click`: Enter, click the field after the button. Judges `outside-inert`; records whether the
   dialog closed.

`contained` and `wrap` are judged from the elements focus rested on, step by step, using the
number the engine already gives each focused element (`element`), not from a list of tabbable
elements. `wrap` follows when the run comes back to an element it has already rested on, with
every step between inside the dialog and the page keeping focus. A list would have to decide
what counts as tabbable, and systems put focus guards beside the dialog that are tabbable and
are not content (see the MUI check below). The element focus starts on need not be in the cycle:
MUI opened on the dialog container, which Tab leaves and never returns to.

## What the engine has and lacks

Has (checked in `packages/contracts/src/schema/observation.ts` and
`packages/engine/src/runner/observe-step.ts`, engine 0.17.0): `press`, `type` and `click`;
`item` on focus; `isBody` and `isInsideComponent`; `isInsidePopup` with a popup record that
knows its opener; the accessibility diff after each step.

Lacks, each a change to propose with the contracts:

- **The dialog at each step**: whether one is in the tree, its role, name, description, whether
  it says it is modal, and the name of its first heading. Proposed: a record of its own, as tabs
  got `TabSetState`, rather than stretching "popup". `AccessibleStates` has no `modal` today.
- **Whether focus is inside the dialog.** The same idea as `isInsidePopup` and `isInsidePanel`.
- **A click on an element a backdrop covers.** `click` is Playwright's `locator.click()`, which
  waits for the element to receive the pointer and would time out on a covered field.
  `outside-click` needs a click at the element's centre point, recorded as such.
- **Whether the page itself has focus.** See the first check below: without it, Tab leaving a
  native dialog for the browser's own controls reads as focus lost to the page.
- **Focus at rest.** Settle waits for the DOM and animations, not for focus. See the MUI check
  below: proposed, a step is not quiet while focus is still changing.

### Checked on a throwaway page, 2026-11-21

A page with a native `<dialog>` (three tabbable elements, opened with `showModal()`, no
`aria-modal` attribute) and, for comparison, a `div` with `role="dialog"` and
`aria-modal="true"`, in headless Chromium 156.0.8078.4 as Playwright 1.64.1 launches it for the
engine, read with CDP's `Accessibility.getFullAXTree`. One run, by hand, not an engine
measurement.

- **The tree reports the native dialog as modal.** Its node has role `dialog`, the name of its
  title and the property `modal: true`, the same property the `aria-modal` div gets. So `modal`
  can be judged from the tree (decision 4).
- **Tab on the last element leaves the page, and the next Tab comes back to the first.** After
  the third Tab `document.activeElement` is the body and `document.hasFocus()` is false; the
  fourth Tab is on the first field. Shift+Tab does the same the other way. The engine records
  `isBody` but not whether the document has focus, so today this step is indistinguishable from
  focus lost to the page. With that one field recorded, the case is told apart and `wrap` is
  judged `differs` with the factual reason "Tab leaves the page for the browser's controls
  before returning to the first element", never as a loss.
- **What stays in the tree outside the dialog differs, and the engine can see it.** With the
  native dialog open, the page's two fields and the button are gone from the tree; with the
  `aria-modal` div shown, they are all still there. Recordable, as proposed above, not judged.
- Escape closed the native dialog and focus was back on the button, with no script for either.

### Checked on one system, 2026-11-21: focus guards (MUI)

Many systems keep focus in with invisible tabbable elements at the dialog's edges. Asked before
any evaluator: does the engine read focus after it has come to rest, and is a guard
counted neither as leaving the dialog nor as an element inside it?

A throwaway page (not a harness page: MUI's `Dialog` from `@mui/material` 9.5.0 with its
defaults, a title, one field, Cancel and Save), driven with the engine's own session, page
scripts, `settle` and `readFocus` (engine 0.17.0), with every `focusin` event logged beside what
the engine read. One run, by hand, not a measurement.

- **MUI has two guards**, `div tabindex="0"` with `data-testid` `sentinelStart` and
  `sentinelEnd`. They are siblings of the dialog's container, **outside** the element with role
  `dialog`.
- **Focus does pass through a guard, and the engine does not see it.** Tab on Save: `focusin` on
  `sentinelEnd` and, in the same millisecond, on the Name field. Shift+Tab on Name: `sentinelStart`
  and then Save, the same way. The engine reads focus after two frames and at least 400 ms of a
  still page (`SETTLE_OPTIONS`); in all eleven steps it read the element focus rested on, inside
  the dialog, with the page keeping focus. So a guard is not counted as leaving the dialog.
- **A guard is not counted as an element inside** as long as the rules read the rested sequence
  and not a list of tabbable elements, which is why the scenarios section says so. A locator for
  "tabbable elements" scoped to MUI's modal root would have found five, two of them guards.
- **The limit.** Settle waited for the DOM and animations to be still, not for focus. MUI hands
  focus on at once, so nothing was missed. Added in engine 0.18.0: a change of focus restarts
  the quiet window, as a change in the DOM does, so focus handed on in several hops, each within
  400 ms of the last, is followed to where it rests. What it does not catch, and nothing based on
  a quiet window can: one hand-on that comes more than 400 ms after a page that was completely
  still. The same has always been true of a late DOM change (ADR 0003, section 5).
- Seen in the same run, for the adapter and the scenarios: MUI opened with focus on the element
  with role `dialog` itself (`tabindex="-1"`), the case `focus-not-on-dialog` is about; and its
  buttons' accessible names were "CANCEL" and "SAVE", so a click target found by exact name needs
  the name the tree gives, not the text in the source.

## Reference

`packages/reference/dialog/`, framework-free. Proposed: the native `<dialog>` element opened
with `showModal()`, a visible `<h2>` title that names it, initial focus on the Name field (the
first focusable element, APG's general case for small content), a key handler that wraps Tab and
Shift+Tab at the ends, Escape and Cancel closing it, and focus back on the button. It must
measure `follows` on every rule. The check above shows what the native element gives for free
(the modal state, Escape, focus back on the button, the page behind removed from the tree) and
the one thing it does not: Tab at the ends leaves the page first, which is why the reference
adds the key handler.

## Candidate targets

Checked on 2026-11-21 in the packages already installed for `packages/harness`. "Exported" means
the name is in the installed package's type declarations or folders. The docs pages and the
behavior were **not** read for this proposal.

| System | Candidate | Checked |
| --- | --- | --- |
| Fluent 2 | `Dialog` with `DialogSurface`, `DialogBody`, `DialogTitle`, `DialogContent`, `DialogActions` | exported by `@fluentui/react-components` 9.75.2. In `@fluentui/react-dialog` 9.18.6 the `modalType` prop is `'modal' \| 'non-modal' \| 'alert'` with `@default modal`; its comment says of modal: "The tab sequence is kept within the dialog and moving the focus outside the dialog will imply closing it." |
| MUI | `Dialog` with `DialogTitle`, `DialogContent`, `DialogActions` | folders in `@mui/material` 9.5.0, beside `Modal`. `Modal` declares `disableAutoFocus`, `disableEnforceFocus` and `disableRestoreFocus`; their defaults were not read |
| React Aria | `DialogTrigger`, `Modal`, `Dialog`, `Heading` | exported by `react-aria-components` 1.22.1 (`dist/types/exports/Dialog.d.ts`, `Modal.d.ts`); `ModalOverlay` is there too |
| Chakra UI | `Dialog` | `components/dialog` is in `@chakra-ui/react` 3.38.0, beside `drawer`. `@ark-ui/react` 5.40.0 and `@zag-js/dialog` 1.47.0 are installed under it; their options were not read |
| GitHub Primer | `Dialog` | exported from the main entry of `@primer/react` 38.45.0; no `@deprecated` in `dist/Dialog/Dialog.d.ts`. It declares `role?: 'dialog' \| 'alertdialog'` ("Default: "dialog""), `initialFocusRef` and `returnFocusRef`. `ConfirmationDialog` is a separate export and is not this pattern |
| Atlassian | `@atlaskit/modal-dialog` | **not installed**. On npm on 2026-11-21: version 17.3.0, "A modal dialog displays content that requires user interaction, in a layer above the page.", last modified 2026-11-20, so pnpm's minimum release age may hold it back. A new dependency (decision 7) |

Before any harness work, for every system: the export list for the pattern's vocabulary (dialog,
modal, drawer, sheet, overlay, popover, confirm) at the pinned version with its date; the
inclusion test by what the component is (a window with role `dialog` that the system presents as
modal, opened over the page; a drawer, a popover, a non-modal dialog and an alert or confirmation
dialog are not measured here); and, where the docs show more than one way to compose it, which
the harness follows.

## Carried over from the first four patterns

- The inclusion test comes first, written into `data/targets.yaml` per system with its date.
- One meaning per term and the ownership table, written with the rules.
- An optional APG behavior is not a rule; its scenario is recorded.
- Levels follow the cited page.
- Observations say where they come from: seen by hand with a date and a method, or recorded.
- The reference is versioned; everything is measured on one engine version, so if the engine
  changes for the dialog the four measured patterns are measured again in the same pass.
- The page is built on a preview route and is published only after the manual screen reader
  check.

## Decisions

1. **Open a fifth pattern now.** `CLAUDE.md` 3 lists four patterns and 7 has M5 as current.
   Recommended: approve the proposal and start alongside M5, as for tabs; I then add the dialog
   to both sections in the same change as the approval.
2. **Scope**: one modal dialog opened by a button, small, with a field and two buttons; alert
   dialogs, non-modal dialogs, nested dialogs, drawers and popovers out. Recommended.
3. **Initial focus recorded, not judged, with `focus-not-on-dialog` as a recommendation.** APG's
   placement advice depends on the content. The sentence against focusing the container is on
   the example page, about a dialog with a lot of text. Recommended: recommendation, with a
   trade-off from the start. The alternative is to record it only.
4. **`modal` judged by what the accessibility tree says**, not by the `aria-modal` attribute, so
   a native modal `<dialog>` is not charged for lacking an attribute it does not need (ADR 0003
   reads names, roles and states from the tree). Recommended: checked on 2026-11-21, the tree
   reports `modal: true` for the native element and for the `aria-modal` div alike.
5. **`outside-inert` as a rule, measured with one click.** The about section states it as what a
   modal dialog is. Recommended: rule. It needs the new kind of click; without it the rule is
   dropped from the first version, and `contained` still covers the keyboard.
6. **`wrap` apart from `contained`**, both rules, with the WCAG sentence about user agent
   controls as the trade-off for `wrap`. Recommended: a system on the native element is then
   charged once, on the rule where the standards themselves allow the difference.
7. **Targets**: React Aria, Chakra, Fluent, MUI and Primer from the installed packages;
   Atlassian after a yes to adding `@atlaskit/modal-dialog` (one line: its modal dialog is a
   separate package from the three already installed). Recommended.
8. **Engine additions**: a dialog record on each step (with its first heading, for
   `name-matches-title`), "focus is inside the dialog", the `modal` state, whether the page has
   focus, a step that is not quiet while focus is still changing, and a click at a point, in one
   engine version, with the four measured patterns measured again on it. Recommended.
9. **The home page's list** is about 2000 px tall at 1440 with four patterns (the design
   reviewer's number, `docs/follow-ups/tabs.md`). A fifth makes it longer. A layout question for
   when the preview page is ready, not for this approval. **Deferred, 2026-11-21.**

## Order of work once approved

Snapshots of the APG and WCAG pages and the rules re-read against them; contracts (rules,
sources, scenarios) and the engine additions; the reference, measured to `follows` on every rule; the export check and inclusion
test per system in `data/targets.yaml`; harness pages and adapters; measurements; trade-offs for
every rule where systems differ, for review; the preview page; `verdict-auditor` and
`design-reviewer`. The manual screen reader check stays the gate before anything is published.
