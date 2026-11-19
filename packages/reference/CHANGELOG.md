# Changelog: reference implementations

One version for the package: both references are published together, and every measurement of a
reference records this version in its provenance. A change that a reader of the site could
notice gets an entry, with whether behavior or verdicts changed.

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
