# Target audit: is each system measured on the right component?

- Date: 2026-11-13. Status: **for the owner's decision**. Nothing is re-measured or changed in
  `data/` by this audit (two earlier notes on React Aria in `data/targets.yaml` are from the same
  day and are listed in `react-aria-token-field.md`).
- Why: React Aria turned out to ship a component for this pattern (TokenField) in the very version
  we measured, while we measured a composition. Every target was chosen the same way: open the
  docs, find an example, write the date. The package's own list of exports was never checked. So
  the same gap could be anywhere.
- Scope: the eleven systems in `data/targets.yaml` for input with chips: six measured, four
  "no equivalent component", one planned.

## How it was checked

1. **Exports.** For each measured system, the type declarations of the installed package at the
   measured version, searched for tag, token, chip, pill, multi, picker, combo, autocomplete.
2. **Docs, read today.** Each system's docs pages for the component we measure and for any
   alternative, by four fetch runs that quote the pages and say "not stated" where a page is
   silent. Pages that returned only a JavaScript shell are listed under "Not checked".
3. **Harness against docs.** What each `packages/harness/<system>/src/main.tsx` says it builds,
   against the docs example it names.
4. **Versions.** `npm view <package> version` against the measured version.

## Result per system

| System | Measured | Right target? | Finding |
| --- | --- | --- | --- |
| React Aria 1.22.1 | ComboBox + TagGroup, docs composition | **No** | TokenField is exported by this version and its docs name tag inputs and multi-select comboboxes. See F1. |
| Chakra UI 3.37.0 | TagsInput, "Basic" example | Yes, with a gap | TagsInput is the dedicated component. Its docs also have a "Combobox" example with suggestions, closer to a people field; we measured the free-text one. See F3. |
| Atlassian select 23.1.3 | Select with `isMulti` | Open question | The docs' "Multi select" example sets `isSearchable={false}`: no text input. Our page keeps the default (searchable) and says it is built "as the examples show it". See F2. |
| Fluent 2 9.74.10 | TagPicker, "Default" story | Yes | The dedicated component. The docs still say Backspace "will remove the last tag"; measured, the first press focuses it. Already an observation. |
| MUI 9.5.0 | Autocomplete with `multiple` | Yes | No chips or tags input among MUI's components; Autocomplete is the documented multi-value input. The harness keeps the example's `aria-description` texts, which the docs ask for. |
| GitHub Primer 38.42.0 | Autocomplete + TextInputWithTokens | Yes | Still deprecated ("will be removed in PRC's next major release"), no replacement named, the accessibility page still says "should not be used until the issues are resolved". Shown, not counted: correct. |
| IBM Carbon | not applicable | Confirmed | Multiselect shows "a tag ... containing the total number of selected options"; single values are unselected by checkbox, not by a tag. |
| Material Web | not applicable | Confirmed | Input chips exist as a primitive (`md-input-chip`); no example or component puts them in a text field. The README says the project "is in maintenance mode pending new maintainers". |
| GOV.UK | not applicable | Confirmed, wording to fix | No multi-select, tags or autocomplete component. See F4 on our reason text. |
| Adobe Spectrum | not applicable | Partly confirmed | A "Tag field" page exists under `web/design-only/`; React Spectrum v3 lists no TagField or TokenField. Spectrum 2 could not be read. See F5. |
| shadcn/ui | planned | Still right | Combobox "With chips" exists ("Multi-select with `multiple`, chips, and a chips input"). Not measured because its dependencies are not approved. |

## Findings, most important first

### F1. React Aria: a shipped component exists and is not the one measured (major)

Already written up in `react-aria-token-field.md`. New from this audit: two separate reads of
https://react-aria.adobe.com/TokenField found **no alpha, beta or preview label** on or near the
title, and no stability or version note. The claim that it is alpha stays unconfirmed; do not
print it. Decision needed: re-measure on TokenField, and which docs example.

### F2. Atlassian: our page is not the docs' multi-select example (major, needs a decision)

- Docs, "Multi select": "Allows the user to select multiple items from a dropdown list of
  options." Props in its code: `options`, `isMulti`, `isSearchable={false}`, `placeholder=""`.
- Our harness: `isMulti`, `inputId`, `options`, `defaultValue`, everything else default, so the
  select is searchable and has a text input. Its header says "as
  https://atlassian.design/components/select/examples shows it". That sentence is not accurate.
- Why it matters: with `isSearchable={false}` there is no text input, and the component is a
  multi-select dropdown, not an input with chips. A maintainer could say we measured a
  configuration their multi-select example does not show. Searchable is the component's default
  and other examples on the page use it, so the configuration is legitimate; the claim about which
  example we follow is what is wrong.
- It also bears on the open `arrows` question: the component describes itself with "Use left or
  right arrow keys to navigate selected items" while the engine saw no focus move.
- Options: (a) keep the configuration, correct the harness header and the site's wording to
  "Select with isMulti, searchable (the component's default)"; (b) decide that Atlassian's
  multi-select is not an input with chips and move it to "no equivalent component". I recommend
  (a) now and the manual screen reader check before publishing any Atlassian verdict.
- Not checked: whether Atlassian publishes a people or user picker for outside use. The npm page
  for `@atlaskit/user-picker` returned 403, and the design system's component index lists no user
  picker, people picker, token or combobox.

### F3. Chakra UI: a documented variant with suggestions exists (minor, worth a note)

- TagsInput is the right component: "Used to enter multiple values as tags with features like tag
  creation, deletion, and keyboard navigation."
- Its docs have a "Combobox" example: "composes the `TagsInput` component with the `Combobox`
  component to create a tags input that allows users to select from a list of predefined tags."
  Our harness header already says this exists and that the measured rules do not depend on
  suggestions. That holds for the eight rules; it does mean Chakra is the only counted system
  measured without a suggestion list.
- Options: leave as is and say so on the card (it is in `setup` already, which the site no longer
  shows); or measure the Combobox example as well. I recommend adding the sentence to what the
  site shows beside Chakra, and not re-measuring: the dedicated component is measured.

### F4. GOV.UK: our reason says more than the evidence (minor, text)

- `targets.yaml` says "maintainers recommend the "add another" pattern instead". The source is one
  reply by a contributor in a 2021 issue ("you'd be better off using a 'add another' pattern to
  reveal a second autocomplete"). No GOV.UK pattern page for it exists (the patterns index lists
  none; a guessed URL returned 404).
- Proposed text: "No multi-select or chips component. In a 2021 issue a contributor to its
  autocomplete suggested an "add another" pattern instead."

### F5. Adobe Spectrum: Spectrum 2 not verified (minor, gap in the evidence)

- Confirmed: a "Tag field" page under `spectrum.adobe.com/web/design-only/`, with no description
  text in what loaded; React Spectrum v3's navigation lists TagGroup, ComboBox, Picker,
  SearchAutocomplete and no TagField or TokenField; v3 ComboBox documents single selection.
- Not confirmed: Spectrum 2 (S2). Both S2 pages returned only page metadata. Until someone opens
  the S2 component list in a browser, "no coded tag field" is confirmed for v3 only.
- Our reason text also says "Adobe's React Aria documents one and is measured above". After F1
  that sentence should name TokenField, not the composition.

### F6. Three measured versions are behind the latest release (information)

| Package | Measured | Latest on 2026-11-13 |
| --- | --- | --- |
| @atlaskit/select | 23.1.3 | 23.2.1 |
| @chakra-ui/react | 3.37.0 | 3.38.0 |
| @primer/react | 38.42.0 | 38.45.0 |
| @fluentui/react-components | 9.74.10 | 9.75.2 |
| @mui/material | 9.5.0 | 9.5.0 |
| react-aria-components | 1.22.1 | 1.22.1 |

Every card shows its version and date, so this is not an error. What the release notes that
loaded say: Chakra 3.38.0 has nothing on TagsInput or Tag (one Field fix: "helper and error text
not being announced on Select, Tags Input"); Primer 38.43.0 to 38.45.0 touch Token only for
rendering performance. Atlassian's and Fluent's notes for the newer versions were not found.
A re-measurement round (F1) is the natural moment to move every system to its latest version.

## Not checked

- Fluent's Storybook pages and Carbon's Storybook pages (JavaScript shells); Fluent's 9.75.x
  release notes (the releases page showed v8 only).
- Spectrum 2 component list; the Material 3 chips guidelines page (title only).
- Atlassian's user picker (npm 403).
- The harness pages line by line against the docs' example source: only React Aria's was checked
  against the library's source today. The others were compared by their own header notes and the
  docs text, which found F2.
- Firefox, WebKit and real screen readers, as everywhere else.

## Proposed process change

The gap came from how targets are chosen, so the fix is a step, not a one-off:

1. Before a system is measured or declared "no equivalent", list the package's exports at the
   pinned version for the pattern's vocabulary and record the list's date in `targets.yaml`.
2. Record which docs example the harness follows **and which it does not** when the docs show
   more than one way.
3. Re-run this audit before every publication and whenever a measured package releases a minor
   version.

This belongs in `packages/engine/CLAUDE.md` (Adapters and targets) if you agree.

## Decisions needed

1. F1: re-measure React Aria on TokenField? Which example (ComboBox or Tag field)?
2. F2: Atlassian, option (a) or (b)?
3. F3: add the "no suggestion list" sentence beside Chakra's verdicts?
4. F4 and F5: apply the two text corrections in `targets.yaml`?
5. F6: move all systems to their latest versions in the same re-measurement round?
6. The process change above: add it to the engine's rules?

## Outcome, 2026-11-13 (after "do all six")

Done:

- **F2 Atlassian**, option (a): the harness header no longer claims to follow the docs' example;
  `targets.yaml` says "Select with isMulti, searchable", and a new `variant` field puts the
  sentence beside every Atlassian verdict on the site.
- **F3 Chakra UI**: `variant` says "Measured without a suggestion list" beside its verdicts.
- **F4, F5**: both `reason` texts corrected.
- **F6**: Atlassian 23.2.1, Fluent 9.75.2 and Primer 38.45.0 measured; every system re-measured
  the same day. No verdict, summary or reason changed for any system.
- **Process**: the three steps are in `packages/engine/CLAUDE.md` (Targets and conduct).

Not done, and why:

- **Chakra UI stays on 3.37.0.** On 3.38.0 the engine reported "Removal is not announced" for the
  click removal, three runs agreeing. It is false: a separate script saw "Tag Greg Fisher deleted"
  104 ms after the click. Cause: `@zag-js/live-region` 1.47.0 has `MIN_DELAY = 100` before it
  writes an announcement (1.43.3 wrote it after 0 ms), and the engine's quiet window is 100 ms
  (ADR 0003, section 5). The step closes a few milliseconds before the text arrives. A trial with
  a 400 ms window (output to a temporary folder, constant restored) gave "follows" for Chakra and
  changed no verdict of any other system; no step hit the 1000 ms cap.
  **Decision needed:** widen the quiet window in ADR 0003 (I recommend 400 ms: four times the
  delay seen, and the trial shows nothing else moves), then move Chakra to 3.38.0.
- **F1 React Aria TokenField is not in the data.** The page (`packages/harness/react-aria-token-field`,
  the docs' "ComboBox" example) and an adapter exist; the adapter is not registered in the suite.
  A trial run gave 0 follows, 2 differs, 6 inconclusive, and the result is not a fair picture:
  - TokenField is one editable element with the role combobox. Tokens are text inside it; they
    have no role and never take focus. Arrow keys move a text caret across a token, and an
    assertive live region names the token. The engine sees focus only, so `arrows` reads
    "focus was on combobox, not on chip 3" although the token is announced.
  - `chip-stop`, `chip-arrows`: starting state unreachable (no chip can take focus).
    `keep-focus`, `say`, `count`: inconclusive because tokens have no remove button.
  - Focus alone leaves the caret before the first token, where Backspace does nothing; the
    adapter presses End to start after the last token. The token announced on focus then lands
    in the first step's recording ("Irene Oh" on a Backspace that removed Hiroshi Matsui).
  - React Aria's announcer appends to its region, so the recorder stores "Irene OhGreg Fisher"
    where a listener hears "Greg Fisher".
  - Solid from the trial: one Backspace removes the last token at once, with no announcement.
  **Decision needed:** (a) keep React Aria on the composition, with the sentence that TokenField
  ships and is not measured (as now); (b) teach the engine a text-editing model (caret position,
  appended live regions) as a proposal, then measure; (c) publish the trial as is. I recommend
  (a) now and (b) as a proposal: (c) would print verdicts the engine cannot stand behind.

## Decisions, 2026-11-13 (the owner: "yes, go")

- **Quiet window 400 ms.** ADR 0003 amended, engine 0.11.0. Chakra UI moved to 3.38.0 and every
  system measured again. Against the committed files no verdict changed; one reason did
  (Atlassian `count`, see below). Chakra's first Backspace and its arrow keys record no
  announcement with the wider window too, so that silence is the component's.
- **`backspace-twice` judges the first step that removes a chip** (verdict audit, same day).
  Atlassian's `count` reason now quotes the first removal ("option Hiroshi Matsui, deselected")
  with the right count; Primer's second step, which deletes text, is no longer called a removal.
- **React Aria stays on the composition.** The text-editing model for TokenField is proposed in
  `engine-text-editing-model.md`. The trial page and adapter stay in the tree, unregistered.


## Later the same day: three more decisions (the owner: "fix these too, the way you think is right")

- **React Aria is shown, not counted.** New field `not-counted` in `data/targets.yaml` carries
  the reason; the site prints it beside the system wherever "deprecated" was printed for Primer
  (rules section, matrix, verdict list, methodology table, evidence card). Counts now rest on
  four systems. ADR 0009.
- **One principle for a marked chip** in `bsp` and `arrows`: focus, the accessibility tree or an
  announcement must show it. Chakra UI's `bsp` changed from inconclusive to differs; a draft
  trade-off entry describes it. No other verdict changed. ADR 0009.
- **Spectrum 2 checked** in the package itself: `@react-spectrum/s2` 1.8.2 has no tag or token
  field, its ComboBox picks one option. `not-applicable` stands, with a dated exports note.
- Also from the second verdict-auditor round: the quiet window is counted from the action
  (ADR 0003 amendment); before, a step that changed nothing at once closed after two frames.

## Correction, same day: Atlassian stays on 23.1.3

`@atlaskit/select` 23.2.1 was published on 2026-11-13, hours before the run. Installing it made
pnpm add four `minimumReleaseAgeExclude` lines to `pnpm-workspace.yaml`, which nobody approved.
Rolled back: the exclusions are gone, the lockfile is back on 23.1.3, and Atlassian was measured
again on it with the same verdicts. "F6: Atlassian 23.2.1" above no longer holds; Fluent 9.75.2,
Primer 38.45.0 and Chakra UI 3.38.0 (all at least three days old) stay. Move Atlassian when the
release is old enough for the policy.
