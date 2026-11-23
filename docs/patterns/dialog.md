# Modal dialog

The fifth pattern, on the site at `/patterns/dialog/` since 2026-11-23
([docs/proposals/dialog.md](../proposals/dialog.md); the owner's VoiceOver check that day,
`docs/a11y-checks/2026-11-23-dialog-voiceover.md`). The rules live in
`packages/contracts/src/patterns/dialog-rules.ts`; this brief says how they are judged.

## Scope

A modal dialog opened by a button, titled "Edit profile", with one text field "Name" and the
buttons Cancel and Save, small enough to need no scrolling. A text field before the button and
one after it. Each system is measured as it ships by default; a close button it adds stays.

**Where the docs' form example sets `autoFocus` on the first field, the harness sets it too**
(owner, 2026-11-21): MUI's "Form dialogs" demo and the first example on React Aria's Modal page
both do. The prop is listed in the page file's header with that reason. The same dialog without
it is measured as a variant (`variant-of`): its own page, adapter and file, shown and never
counted. A system whose form example sets no initial focus is measured without one, and has no
variant.

Out: alert dialogs, non-modal dialogs, a dialog opened from a dialog, drawers, popovers.

## Terms

- **The dialog**: the element with role `dialog` in the accessibility tree. Open means one is in
  the tree.
- **Inside the dialog**: focus is on that element or on a descendant of it.
- **The invoker**: the button that opened the dialog; setup puts focus on it, so it is the
  element focus was on before Enter.
- **The visible title**: the name of the first heading inside the dialog.

Where focus lands on opening is recorded and never judged, apart from the dialog container.

## One defect, one rule

| What a system does | Charged to | Not charged to |
| --- | --- | --- |
| The dialog opens and focus stays on the invoker | `open-focus` | `contained` (judged from the first Tab pressed with focus inside) |
| Focus lands on the dialog container | `focus-not-on-dialog` | `open-focus` |
| Tab lands on a page element behind the dialog, or focus falls to the document | `contained` | `wrap` |
| Tab leaves the page for the browser's own controls, then comes back | `wrap` | `contained` |
| Tab stays on the last element | `wrap` | `contained` |
| Escape does nothing | `escape` | `return-focus` |
| The dialog closes and focus is not on the invoker | `return-focus` | `escape` |
| Role `dialog` with an empty name | `named-dialog` | `name-matches-title` |
| A name that is not the visible title | `name-matches-title` | `named-dialog` |
| A click outside puts focus on the page behind, dialog still open | `outside-inert` | `contained` |

## How `contained` and `wrap` are read

From the elements focus rested on after each of six presses, by the number the engine gives each
focused element, never from a list of "tabbable elements". Systems keep focus in with invisible
tabbable guards beside the dialog; MUI's take focus for under a millisecond and the engine reads
the element focus rests on (checked 2026-11-21, in the proposal). `wrap` follows when a press
moves focus to an element the run had already rested on: going one way, that can only happen by
going round the end. The element focus starts on need not be in the cycle. Neither rule is
judged when focus never moved into the dialog: that is `open-focus`'s.

A draft trade-off for `wrap` is written ahead of the measurements
(`packages/contracts/src/patterns/dialog-trade-offs.ts`): Tab that passes through the browser's
controls is what the native element does, and WCAG's page on focus order describes it without
objection. It names no system until a measurement file does.

## The engine additions (0.18.0, ADR 0003, amendment of 2026-11-21)

The dialog record on each step, `states.modal`, `focus.isInsideDialog`, `focus.leftPage`, a click
at a point, and a quiet window that a change of focus restarts.

Since 0.19.0 the point of that click is checked first: when the dialog's own box covers it, the
run ends with that reason and `outside-inert` is not judged. So every page for the dialog keeps
the field "Notes" at the left edge, clear of a centred dialog.

## The reference

`packages/reference/dialog/`: the native `<dialog>` opened with `showModal()`, with a key
handler that wraps Tab at the ends. It follows all ten rules in its measurement file. On a click
on the backdrop, the dialog stays open and focus moves to the dialog element itself; the recording shows
it, and no rule judges where inside the dialog focus is after a click.
