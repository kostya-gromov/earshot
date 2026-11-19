# 2026-11-19: measured third-party systems and the reference, VoiceOver

- **Who:** the owner, by hand.
- **Screen reader:** VoiceOver on macOS. Version not recorded.
- **Browser:** not recorded.
- **Target:** the harness pages of the measured systems (`packages/harness/dist`, served locally as `README.md` describes) and the reference in the Atlas playground.

## Items checked

These are the M2 spot-check items from `README.md`. Each one was compared with what the engine recorded.

1. **Atlassian Select, from the empty input:**
   - Left Arrow. Recorded: nothing is said and focus does not move. This also covers whether anything is spoken for the dangling `aria-activedescendant`.
   - Backspace. Recorded: "option Canberra, deselected".
   - Shift+Tab. Recorded: focus on "Remove Canberra".
2. **Removing a chip** in Fluent 2, Primer, MUI and React Aria. Recorded: nothing is announced.
3. **MUI and Primer, after a removal:** whether the input's changed description is spoken.
4. **The reference:** the third remove button is announced with "3 of 3" (ADR 0003).

## Outcome

The owner reported that what VoiceOver said matched the recordings on every item, with no differences. The report covers all items together; nothing was written down per item.

On that basis, the M2 spot-check is done and the publishing gate is cleared.

## Not covered

- NVDA with Firefox.
- The combobox and menu button patterns, which are not in the spot-check list.

The quality bar asks for both screen readers before each release (`apps/atlas/CLAUDE.md`, Quality bar).
