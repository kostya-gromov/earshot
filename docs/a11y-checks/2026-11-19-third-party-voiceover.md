# 2026-11-19: measured third-party systems and the reference, VoiceOver

- **Who:** the owner, by hand.
- **Screen reader:** VoiceOver on macOS 27.2 (read from the machine afterwards, the same day).
- **Browser:** not recorded; Safari 27.2 is installed on the machine.
- **Target:** the harness pages of the measured systems (`packages/harness/dist`, served locally as `README.md` describes) and the reference in the Atlas playground.

## Items checked

These are the M2 spot-check items from `README.md`, as that file listed them on the day.

1. **Atlassian Select, from the empty input:**
   - Left Arrow. Recorded: nothing is said and focus does not move. This also covers whether anything is spoken for the dangling `aria-activedescendant`.
   - Backspace. Recorded: "option Canberra, deselected".
   - Shift+Tab. Recorded: focus on "Remove Canberra".
2. **Removing a chip** in Fluent 2, Primer, MUI and React Aria. Recorded: nothing is announced.
3. **MUI and Primer, after a removal:** whether the input's changed description is spoken.
4. **The reference:** the third remove button is announced with "3 of 3" (ADR 0003).

## Outcome

The owner reported that what VoiceOver said matched the recordings on every item, with no differences. The report covers all items together; nothing was written down per item.

## What the verdict audit found the same day

- The expected values given for Atlassian ("option Canberra, deselected", "Remove Canberra") came from an earlier recording of the docs demo. The published harness recording has "option Hiroshi Matsui, deselected" and "Remove Hiroshi Matsui". A match with the published recording therefore cannot be read from this note.
- For React Aria, the recording is not "nothing": a removal by click inserts a live region that already holds all three names. The engine does not count it as an announcement of the removal. The note does not say whether VoiceOver read it.
- Item 3, the changed descriptions in MUI and Primer, has no result of its own.

So this is a first pass. The check is to be repeated item by item against the current values in `README.md`, with what was heard written down for each item.

## Not covered

- NVDA with Firefox.
- The combobox and menu button patterns, which are not in the spot-check list.

The quality bar asks for both screen readers before each release (`apps/atlas/CLAUDE.md`, Quality bar).
