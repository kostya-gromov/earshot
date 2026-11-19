# Manual screen reader checks

The engine's speech lines are a semantic model, not screen reader output (packages/engine/CLAUDE.md, Capture). These
notes record what real screen readers say, so the model can be checked against them.

One file per check: `YYYY-MM-DD-<target>-<screen-reader>.md`, with the browser and screen reader
versions, the steps taken, and what was heard at each step.

## Pending

### M2 spot-check (deferred by the owner on 2026-11-07)

M2 was accepted with this check deferred. **It must be done before any measured finding is
published (the post after M2, or the M3 release).**

**First pass on 2026-11-19 with VoiceOver** (`2026-11-19-third-party-voiceover.md`): no difference
was noted, but results were not written down per item, and the expected values listed for
Atlassian then ("Canberra") came from an earlier recording, not the current harness files (verdict
audit, 2026-11-19). **To repeat item by item** against the current values below, writing down what
was heard for each. NVDA with Firefox is also still open (`apps/atlas/CLAUDE.md`, Quality bar).

Current expected values, from the measurement files of the harness recordings:

- Atlassian, from the empty field: Left Arrow, focus stays on the combobox "To" and nothing is
  announced; Backspace removes a chip and announces "option Hiroshi Matsui, deselected"; Shift+Tab
  moves focus to button "Remove Hiroshi Matsui", inside the component.
- Fluent 2, Primer, MUI: no announcement of the removal, after Backspace, Delete or a click on a
  remove button.
- React Aria: a removal by click inserts a live region that already holds "Irene OhGreg
  FisherHiroshi Matsui" (the same appears after Tab with no removal, so it is not counted as an
  announcement). What does VoiceOver say there, if anything?
- MUI and Primer: is the field's changed description spoken after a removal?
- The reference: the third remove button is "Remove Hiroshi Matsui, button, 3 of 3".

How the list came about, for the record (the values to check against are the current ones above;
those below include the docs-demo values the first pass used):

- 2026-11-19: The owner checked the reference implementations in the playground with VoiceOver
  (`2026-11-19-reference-playground-voiceover.md`), then the third-party items below.
  Harness pages for them: from `packages/harness`, `node ../reference/scripts/serve.ts --port 4240
  --root dist --home /`, then `http://localhost:4240/<system>/index.html`.
- Target: Atlassian Select (`data/measurements/input-with-chips/atlassian.json`), with VoiceOver +
  Safari or NVDA + Firefox.
- Check against the recorded verdicts:
  - Left Arrow from the empty input: is anything said or does focus move? (measured: nothing)
  - Backspace in the empty input: what is said? (measured on the docs demo: "option Canberra,
    deselected"; on the harness: "option Hiroshi Matsui, deselected")
  - Shift+Tab from the input: where does focus land? (measured on the docs demo: "Remove
    Canberra"; on the harness: "Remove Hiroshi Matsui")
- Also check the reference for ADR 0003: does the screen reader say "3 of 3" for the third remove
  button? The engine derives it from the list structure.
- Before publishing a "no announcement" finding (Fluent 2, Primer), confirm with a screen reader
  that nothing is spoken on removal.
- Added 2026-11-13 (verdict audit of the trade-offs): the "no announcement" trade-off now lists
  MUI and React Aria too, so check them as well. In MUI and Primer the focused input's description
  changes on removal ("3 selected…" to "2 selected…"; "Selected: …" one name shorter): is that
  spoken? Until then no text says a removal is "silent".
- Added 2026-11-13: Atlassian's combobox describes itself with "Use left or right arrow keys to
  navigate selected items", while the engine recorded no focus move and no announcement on Left
  Arrow. What does a screen reader user get? The `arrows` verdict for Atlassian waits for this.
  Found the same day with a script on 23.1.3: Left Arrow sets `aria-activedescendant` to an id
  ending in `-remove` that no element on the page has (the values' ids lack that ending), so the
  reference dangles. The question for the screen reader check is now narrower: is anything
  spoken at all? Worth reporting to the maintainers before publishing, with the raw file.
