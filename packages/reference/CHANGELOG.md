# Changelog: reference implementations

One version for the package: both references are published together, and every measurement of a
reference records this version in its provenance. A change that a reader of the site could
notice gets an entry, with whether behavior or verdicts changed.

## 0.1.8 (2026-11-23)

- **tabs, fixed:** on a page 320 px wide the four tabs side by side were wider than the page, and
  the whole page scrolled sideways (WCAG 1.4.10 Reflow; found on 2026-11-22 by a test that
  chooses every scenario at 320 and 390). The row of tabs now wraps to a second row when it does
  not fit. First tried as a row that scrolls inside itself: it cut the focus ring of the tab at
  its edge, and the page test for that ring caught it. At the width the engine measures in,
  nothing changes: the row fits. Behaviour and verdicts are unchanged; every
  reference is measured again on this version.

## 0.1.7 (2026-11-21)

- **dialog, the page around it:** the fields "Email" and "Notes" and the button sit at the left
  edge of the page instead of its centre. Centred, the open dialog lay over the field "Notes",
  so the engine's click "outside the dialog" landed on the dialog itself and showed nothing
  about the page behind (found on 2026-11-21, before any system was measured). The dialog and
  its script are unchanged. The verdict on "The page behind cannot be used" is measured again
  with the click on the backdrop; what it records is in the measurement file.

## 0.1.6 (2026-11-21)

- **dialog, added:** the fifth reference, a modal dialog opened by a button (`dialog/`). It is the
  browser's own `<dialog>` opened with `showModal()`: the browser reports it as modal, makes the
  page behind inert, puts focus on the first field, closes it on Escape and returns focus to the
  button. The script adds one thing the native element does not do as APG describes: Tab and
  Shift+Tab wrap at the ends instead of leaving the page for the browser's own controls first.
- The four existing references are unchanged; they are measured again on this version with the
  engine that adds what the dialog needs.

## 0.1.5 (2026-11-19)

- **tabs, fixed:** the focus ring on a tab was drawn inside it, over the selected tab's bar, so a
  tab that was both focused and selected showed "selected" by weight alone. That broke the
  pattern's own requirement "Selected and focused look different" (APG: "The selected state must
  be visually distinct from the focus indicator"). The ring is now outside the tab with a 2 px
  gap. In forced colours the unselected tabs' transparent bottom border showed as white
  segments under them; it is painted as the background now, and the selected tab's bar and the
  focus ring take different system colours (`tabs.css`). The ring fix has a test that failed first, in `test/tabs.spec.ts`;
  the forced-colours fix was checked on screenshots in both themes.
- Styles only. Behavior, the accessibility tree and every verdict are unchanged; all four
  references were measured again on this version, each recording the same as before step for
  step.

## 0.1.4 (2026-11-19)

- **tabs, added:** the fourth reference, a horizontal tab list of four tabs with one panel shown
  at a time (`tabs/`). Tabs activate as they receive focus (every panel is already in the page),
  the arrow keys wrap, Home and End go to the ends, and every panel is a Tab stop named by its tab.
- The three existing references are unchanged; they are measured again on this version with the
  engine that adds what tabs need.

## 0.1.3 (2026-11-16)

- **menu button, added:** the third reference, a button that opens a menu of four actions, one
  of them disabled (`menu-button/`). Its page writes "Last action: <item>" when an item's action
  runs, as plain text, so the engine can tell an activated item from a menu that only closed.
- The two existing references are unchanged; they were measured again on this version with the
  engine that added what the menu needs.

## 0.1.2 (2026-11-15)

- **input-with-chips, fixed:** the active suggestion in the list was marked by a faint tint
  alone, about 1.2:1 against the list (WCAG 1.4.11, and the combobox page's own requirement
  "Active option marked at 3:1, not by a faint tint"). It now has a 2 px outline as well, as
  the combobox reference has had from the start (`chip-field.css`). Found by the design review
  of 2026-11-15; the test that failed first is in `test/chip-field.spec.ts`.
- Styles only. Behavior, the accessibility tree and every verdict are unchanged; both
  references were measured again on this version.

## 0.1.1 (2026-11-15)

- **input-with-chips, fixed:** in forced colours the focused input had no visible focus
  indicator (WCAG 2.4.7). The box showed focus with a border colour and a shadow, and forced
  colours remove both, so only the caret showed. It now gets a 2 px outline in that mode
  (`chip-field.css`). Found by the design review of 2026-11-15; the test that failed first is in
  `test/chip-field.spec.ts`.
- Styles only. Behavior, the accessibility tree and every verdict are unchanged; the reference
  was measured again on this version so its provenance says so.

## 0.1.0

- input-with-chips (M0, extracted from the prototype) and combobox (2026-11-14).
