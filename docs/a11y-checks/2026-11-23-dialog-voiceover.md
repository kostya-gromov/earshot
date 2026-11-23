# 2026-11-23: modal dialog, VoiceOver

- **Who:** the owner, by hand.
- **Screen reader:** VoiceOver on macOS 27.2.1 (read from the machine afterwards, the same day).
- **Browser:** not recorded.
- **Target:** the modal dialog page on its preview route, `/lab/patterns/dialog/`, served
  locally, with the reference in its playground (reference 0.1.8, engine 0.20.0).

## Outcome

The owner reported that the check with VoiceOver on macOS went fine ("все нормально"). The report
covers the page as a whole; nothing was written down per item, so what was heard at each step is
not on record here.

## What it means for the page

- The check that the preview waited for is done (`docs/proposals/dialog.md`, order of work;
  `CLAUDE.md` 7, M5), and the page moved out of `/lab` to the patterns the same day. The owner
  reported the check and did not say "move it" in so many words; the move follows the order
  of work he approved, and is local until he pushes.
- Not covered by this check, by how the page is built: the box "You would hear" shown over the
  open dialog is inert and is not in the accessibility tree, so a screen reader does not read
  it; the transcript it repeats is read once the dialog is closed.
- NVDA with Firefox is still due before the next release (`apps/atlas/CLAUDE.md`, Quality bar),
  as for the other patterns.
