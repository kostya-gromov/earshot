# Proposal: measure React Aria on TokenField

- Opened: 2026-11-13. Status: **for decision**. Nothing is re-measured by this file.
- Why now: a review note said React Aria ships a component for this pattern, so measuring a
  composition of ComboBox and TagGroup may not be what its maintainers would call their chips
  input. Checked the same day; the facts below are from the installed packages and the live docs.

## Verified

1. **TokenField is in the measured version.** `react-aria-components` 1.22.1 exports `TokenField`,
   `TokenInput` and `Token` under plain names (`dist/types/exports/index.d.ts`, line 61).
2. **Its docs name this pattern.** https://react-aria.adobe.com/TokenField opens: "A token field
   allows users to enter text with inline tokens. Use it to build AI prompt fields, tag inputs,
   structured search fields, mention inputs, and multi-select comboboxes." It has a "ComboBox"
   section: "Use `TokenField` as the input for a ComboBox to build a multi-select field with
   tokens", and a "Tag field" section.
3. **The composition we measured is still documented.** https://react-aria.adobe.com/ComboBox has
   "### TagGroup": "Use the `ComboBoxValue` render prop function to display the selected items as a
   TagGroup."
4. **The Tab stop on the remove button is not a harness artefact.** In `react-aria` 3.53.1,
   `dist/private/tag/useTag.mjs`, `removeButtonProps` has `aria-label`, `aria-labelledby`,
   `isDisabled`, `id` and `onPress`, and no `excludeFromTabOrder`. The harness renders the button
   as `<Button slot="remove">`, as the docs do. The `chip-stop` verdict stands for this version.
5. **Delete and Backspace both remove the focused tag** (same file, the tag's `shortcuts`).

## Not verified

- Whether the docs label TokenField alpha: the fetched page had no navigation, and the package
  types carry no such mark.
- TokenField's keyboard behaviour and roles: the docs page read so far does not describe them.
  They would come from the measurement.

## What this means under ADR 0006

A system is measured "when its maintainers ship a component for it, or document it as a
composition of their own published components". React Aria now does both. The composition was the
right target while it was the only one; with a shipped component that the docs name for tag inputs
and multi-select comboboxes, the component is the fairer target, and the composition's verdicts
(and the "separate grid" model trade-off built on them) describe a second, older way to build it.

## Proposed

1. Build a second harness page from the TokenField docs example. Which example is the decision:
   - (a) **"ComboBox"**: TokenField as the input of a ComboBox. Closest to the other systems
     (suggestions, people from a list). Its docs code uses a local `ComboBoxTokenFieldValue` class
     and starter wrappers, which the harness would have to write out, as it does today.
   - (b) **"Tag field"**: TokenField alone, free text. Simpler and wholly the component, but
     without suggestions, like Chakra's.
   I recommend (a), because the pattern on Atlas is a people field with suggestions.
2. Measure it with the engine as a new target (`react-aria-token-field`), three runs.
3. Decide from the result which one the page counts. Proposed: count TokenField, keep the
   composition as "shown, not counted" with its date, the way a superseded demo is kept, and
   rewrite or drop the model trade-off according to what TokenField does.
4. If the docs do label it alpha, say so beside every one of its verdicts.

Until then the site says, beside every React Aria verdict, that this version also ships
TokenField and that it is not measured yet (`composition` in `data/targets.yaml`).

Cost: one harness page, likely an adapter change for how chips are found, one engine run, a
verdict-auditor pass. No rule or evaluator changes are expected.
