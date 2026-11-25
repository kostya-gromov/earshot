# Proposal: pattern 6, select (a single-choice field that opens a list, with no text input)

- Opened on 2026-11-24 (work alongside M5, as tabs and the dialog). **Approved the
  same day**: decisions 1 to 3 and the order of work, with three amendments, each written into
  the sections below: `name-and-value` is split as `named-dialog` was, with WCAG 4.1.2 related
  and only APG applied; components on the browser's own select get a marker of their own on the
  page, not "no equivalent component"; typeahead stays recorded and may become a rule later if
  systems differ on it noticeably. Asked of me the same day: how the name and the visible label
  are judged (below, `name-is-label`), and a design note on the native select (below, candidate
  requirement).
- Answered on 2026-11-24, after the first verdict audit: `escape-keeps-value` is a
  recommendation, with the about section and the example cited as rationale (APG says
  comboboxes "can be implemented" that way; the example calls it its own improvement).
  `selected` stays a rule, as for the combobox, and its text names the roles sentence that can be
  read as allowing the other model ("visually indicated as the currently selected value"); a
  draft trade-off for that model, quoting the same sentence, is written before any measurement.
- Sources, read on 2026-11-24 from the live pages with the snapshot tool's own text extraction
  (`packages/contracts/scripts/sources/page-text.ts`); the hash is the one that tool computes:
  - [Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/), hash
    `0c509e20c6e7872c`, **the same as the snapshot of 2026-11-23** in `docs/sources/`, so its
    quotes below are taken from the snapshot with line numbers
  - [Select-Only Combobox Example](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/),
    hash `6b2d9df03b382d76`
  - [Listbox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/), hash
    `8ffca5c351eedce1`, and [(Deprecated) Collapsible Dropdown Listbox Example](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-collapsible/),
    hash `62b645a7fa2f7bc9`, read for the scope only
  - From `docs/sources/`: `WCAG22--Understanding--name-role-value.md`,
    `ARIA--apg--practices--keyboard-interface.md` ("Focus VS Selection"). All 25 snapshots were
    searched for "select"; the others say nothing about how a select behaves.

  Every quote is word for word from those texts. The example page is snapshotted with the
  contracts, and the rules are re-read against it then (as for the four patterns before).

## What APG calls it

APG has no "select" pattern. It is the combobox pattern's **select-only** form: "If a combobox
does not support text input, it is referred to as select-only, meaning the only way users can set
its value is by selecting a value in the popup." (combobox snapshot, line 24). The older
button-and-listbox form is deprecated: "This pattern has been deprecated, and will be removed in
a future version of the ARIA Authoring Practices. The select-only combobox should be used as an
alternative to this pattern." (collapsible listbox example).

ADR 0006 already put select-only controls outside the combobox pattern, and Fluent's Dropdown,
MUI's Select and Primer's Select were read and left out of it. This pattern measures them where
they belong.

## Scope

One variant: a **single-choice select with a visible label, five options and a value already
chosen**, no groups, no search field, no clear button, measured as each system ships it by
default. Out of scope: multiple selection, a select with a search field (that is a combobox), an
option list in a dialog or sheet, grouped options, disabled options, and the browser's own
`<select>` (decision 3).

## Rules

Levels as in the five measured patterns: **rule** when the cited page asks for it,
**recommendation** when it is a note's advice or Earshot goes further and says so. Ids reuse the
combobox ids where the expectation is the same, so a reader comparing the two pages sees one
meaning per id.

| id (draft) | Level | Expectation | Quote |
| --- | --- | --- | --- |
| `tab` | rule (APG) | Tab from the field before puts focus on the select. With the list open, Tab does not put focus on the list or an option. | "Tab: The combobox is in the page Tab sequence." "Note: The popup indicator icon or button (if present), the popup, and the popup descendants are excluded from the page Tab sequence." (77–78) |
| `name-and-value` | rule (APG); WCAG 4.1.2 related | The focused select has role `combobox`, a name that is not empty, and a value that is the chosen option's text; the name does not contain that text. | "Comboboxes and listboxes can be marked as required with aria-required="true", and they have an accessible name that is distinct from their value. Thus, when assistive technology users focus either a combobox or listbox in its default state, they can perceive both a name and value for the widget." (66–67) Related, not applied: WCAG 4.1.2, "the name and role can be programmatically determined; states, properties, and values that can be set by the user can be programmatically set" |
| `name-is-label` | recommendation | The select's name is its visible label, "Fruit", and nothing else. Earshot goes further than APG and says so. | Cited as rationale: "Otherwise, if it has a visible label, the combobox element has aria-labelledby set to a value that refers to the labelling element." (275) |
| `down` | rule (APG) | ↓ on the closed select shows the list and makes an option active. Which option is recorded, not judged (decision 2). | "Down Arrow: If the popup is available, moves focus into the popup" (82) |
| `expanded` | rule (APG) | The select says `expanded` false while the list is hidden and true while it is shown. | "When the combobox popup is not visible, the element with role combobox has aria-expanded set to false. When the popup element is visible, aria-expanded is set to true." |
| `focus-stays` | rule (APG) | While an option is active, DOM focus stays on the select and `aria-activedescendant` names that option. | "When a descendant of a listbox, grid, or tree popup is focused, DOM focus remains on the combobox and the combobox has aria-activedescendant set to a value that refers to the focused element within the popup." |
| `arrows` | rule (APG) | ↓ makes the next option active and ↑ the previous. At the last (first) option, ↓ (↑) does nothing or returns to the select; both follow. | "Down Arrow: Moves focus to and selects the next option. If focus is on the last option, either returns focus to the combobox or does nothing." (117–118, and 120–121 for Up Arrow) |
| `selected` | rule (APG) | The active option is exposed as selected, and only it. | "Selection follows focus in the listbox; the listbox allows only one suggested value to be selected at a time for the combobox value." (140) |
| `enter` | rule (APG) | Enter on an active option closes the list, the select's value becomes that option, and focus is on the select. | "Enter: Accepts the focused option in the listbox by closing the popup, placing the accepted value in the combobox" (112) |
| `escape` | rule (APG) | Escape with the list open closes it and focus is on the select. | "Escape: Closes the popup and returns focus to the combobox." (114) |
| `escape-keeps-value` | recommendation (2026-11-24, after the audit; first proposed as a rule) | After moving through options and pressing Escape, the select's value is the one it had before the list opened. | "Comboboxes and menu buttons can be implemented so users can explore the set of allowed choices without losing a previously made choice. That is, users can navigate the set of available choices in a combobox popup or menu and then press escape, which closes the popup or menu without changing previous input. In contrast, navigating among options in a single-select listbox immediately changes its value, and Escape does not provide an undo mechanism." (63–65). **Corrected on 2026-11-24 after the verdict audit**: the first version of this table began at "That is", leaving out "can be implemented", and the level was approved on that shortened quote; the level goes back for review. |

**Why `name-is-label` is a recommendation, not a rule and not left out** (asked on
2026-11-24). APG asks, for a combobox with a visible label, that `aria-labelledby` "refers to the
labelling element". It does not say "only to it": a name made of the label and a hint, or the
label and an icon's text, still refers to the labelling element. Judging the name to be exactly
the label therefore asks more than APG, so it cannot be a rule. Leaving it out would hide a
difference a person hears on every visit: a name that says something other than what is
written beside the field. A recommendation with that reason is the honest level, the same
reasoning as `name-matches-title` for the dialog. It is not judged when `name-and-value` already
differs because the name contains the value (one defect, one rule). WCAG 2.5.3 Label in Name asks
only that the name *contain* the visible label; it is not in `docs/sources/` yet, so it is read
from its live page and snapshotted with the contracts before it is cited as related.

Two terms, one meaning in every rule:

- **The select.** The element that holds focus when the list is closed. Its role, name and value
  are read from the accessibility tree.
- **The active option.** As in the combobox brief: the option `aria-activedescendant` names, or
  the option holding DOM focus, or, when neither exists, the one option exposed as selected.

**Recorded, not judged** (each is optional on the pattern page or only in the example, and the
carried-over rule says an optional behavior is not a rule):

- **Which option is active when the list opens.** The pattern page says the first; the example
  keeps the current value: "Opens the listbox if it is not already displayed without moving
  focus or changing selection." Both are reasonable; the page shows each system's choice with a
  trade-off.
- **↑ on the closed select**, **Alt+↓ and Alt+↑**, **Home and End**: all "(Optional)" on the
  pattern page (85, 99, 101, 128–129).
- **Typing a letter.** "If the combobox is not editable, optionally moves focus to a value that
  starts with the typed characters." (97). The browser's own select does it; designers will ask.
  Decided 2026-11-24: recorded for now; if the systems differ on it noticeably, it is brought
  back as a proposed rule, since a person used to the native select expects it.
- **Space on the closed select** and **Tab with the list open**: only the example page describes
  them, and it says of Tab that it chose differently from the native element on purpose: "Note:
  the native <select> element closes the listbox but does not move focus on tab. This pattern
  matches the behavior of the other comboboxes rather than the native element in this case."
  Whether Tab sets the value is recorded; that focus leaves to the next field is `tab`.

### One defect, one rule

| What a system does | Charged to | Not charged to |
| --- | --- | --- |
| The select's name is "Fruit Banana" and it has no value (a button) | `name-and-value` | `name-is-label` (not judged), `expanded` |
| The name is "Choose a fruit" beside the label "Fruit", the value is there | `name-is-label` | `name-and-value` |
| ↓ does nothing on the closed select | `down` | `expanded`, `arrows` (not judged without an open list) |
| The list opens and DOM focus moves onto an option | `focus-stays` | `arrows`, `selected` (judged from the focused option) |
| The active option is not exposed as selected; the old value still is | `selected` | `arrows` |
| Enter closes the list and the value does not change | `enter` | `escape-keeps-value` |
| Escape closes the list and focus falls to the body | `escape` | `escape-keeps-value` (still judged: the value is read from the select by its position in the page) |
| Escape keeps the option moved to as the value | `escape-keeps-value` | `escape` |
| The select exposes no value at all | `name-and-value` | `enter`, `escape-keeps-value` (not judged) |
| Enter closes the list and the value stays as it was | `enter` | `name-and-value` (judges only that a value exists, apart from the name) |
| The select's name is empty | `name-and-value` | `name-is-label` (not judged) |
| Tab with the list open puts focus on an option | `tab` | `focus-stays` |

## Checked on a throwaway page, 2026-11-24

A page with a native `<select>`, a `div` with role `combobox` built as in the APG example, and a
button with `aria-haspopup="listbox"` labelled by its label and its value, in headless Chromium
156.0.8078.4 as Playwright 1.64.1 launches it, read with CDP's `Accessibility.getFullAXTree`.
One run, by hand, not an engine measurement.

- **The tree gives a select-only combobox a value.** The native select and the APG-style `div`
  both read as role `combobox`, name "Fruit …", value "Banana". The button reads as role
  `button`, name "Fruit button Banana", no value: the defect `name-and-value` is about is
  visible in the tree, and the engine can tell the two apart.
- **The browser's own list cannot be driven.** On the native select, ↓ opened the list
  (`expanded` true, the popup and its options in the tree). After that, ↓, ↑, Enter, Escape and
  Space changed nothing in the tree or in the DOM value, and the list stayed open; typing "c"
  changed the value to "Cherry"; Tab closed the list and moved focus to the next field. The list
  is drawn by the browser, not the page, and the keys Playwright sends do not reach it. So the
  engine cannot measure a component that renders a native `<select>` (decision 3).

## What the engine has and lacks

Has (checked in `packages/contracts/src/schema/observation.ts`, engine 0.20.0): `expanded` and
`selected` states, `hasPopup`, the resolved `activeDescendant` and `activeDescendantUnresolved`
on focus, `item`, `isInsidePopup`, a popup record with its options in DOM order, `press` and
`type`.

Lacks two things, both in engine 0.21.0, before any measurement on it:

- **The select's value.** `FocusInfo.value` is "The text in the focused text field. Absent for
  other elements". Done on 2026-11-24: `treeValue`, the value the tree gives every node with
  role `combobox`, wherever a node is read. The select's adapter declares the popup's `opener`,
  so the value is read from the select itself even when focus has left it (`escape-keeps-value`).
- **The visible label**, for `name-is-label`: the text of the element the adapter locates as the
  label, recorded on each step as the dialog records its heading, so a verdict's reason quotes
  what is in the measurement file and not the harness's configuration. Not started.

The five measured patterns are measured again on this version, as before.

## Scenarios

Start for all: a text field "Email", a select labelled "Fruit" with the options Apple, Apricot,
Banana, Cherry, Date and the value Banana, and a text field "Notes" after it. Focus on the
select, the list closed, except where a step says otherwise. Two options start with "a" so that
typing records cycling.

1. `tab-in`: focus on Email, Tab. Judges `tab`, `name-and-value`, `name-is-label`.
2. `open`: ↓. Judges `down`, `expanded`, `focus-stays`; records which option is active.
3. `move`: ↓, then ↓ six times, then ↑ six times. Judges `arrows`, `selected`, `focus-stays`.
   Six covers both ends whichever option the list opened on.
4. `enter`: ↓, ↓, Enter. Judges `enter`, `expanded`, `name-and-value`.
5. `escape`: ↓, ↓, Escape. Judges `escape`, `escape-keeps-value`, `expanded`.
6. `tab-open`: ↓, ↓, Tab. Judges `tab`; records whether the value changed.
7. `optional-keys`: ↑ on the closed select, Escape, Alt+↓, Alt+↑, ↓, End, Home, Escape.
   Recorded only.
8. `typeahead`: type "c" on the closed select, Escape, then ↓ and type "a", "a". Recorded only.
9. `space`: Space on the closed select. Recorded only.

## Reference

`packages/reference/select/`, framework-free, built as the APG example: a focusable element with
role `combobox`, labelled by a visible label, its text the chosen option; a listbox popup with
`aria-activedescendant`; the list opening on the current value; Escape keeping the value. It
must measure `follows` on every rule. Not the native `<select>`: the engine cannot drive its list
(above), and it differs from the example on Tab by APG's own note.

## Candidate targets

Checked on 2026-11-24 in the packages already installed for `packages/harness`. "Renders" means
read in the installed source. Docs pages and behavior were **not** read for this proposal.

| System | Candidate | Checked |
| --- | --- | --- |
| Fluent 2 | `Dropdown` | exported by `@fluentui/react-components` 9.75.2, from `@fluentui/react-combobox` 9.17.9; its trigger gets `role: 'combobox'` (`useTriggerSlot.js`). Fluent's `Select` renders a native `select` (`@fluentui/react-select` 9.5.8) |
| MUI | `Select` | `@mui/material` 9.5.0; `SelectInput.js` sets `role: "combobox"`, `'listbox'` and `'option'`. `NativeSelect` is a separate folder |
| React Aria | `Select` | exported by `react-aria-components` 1.22.1 (`dist/types/exports/Select.d.ts`); its elements not read |
| Chakra UI | `Select` | `components/select` in `@chakra-ui/react` 3.38.0, on `@zag-js/select` 1.47.0, which sets `role: "combobox"` and `"option"`. `native-select` is a separate component |
| GitHub Primer | none found yet | `Select` in `@primer/react` 38.45.0 renders a native `select` (`dist/Select/Select.js`). `SelectPanel` and `ActionMenu` exist and were not read; one is a panel with a filter, the other a menu, so likely neither passes |
| Atlassian | `@atlaskit/select` 23.1.3, not searchable | installed, measured as the combobox with search on; whether it renders a select-only control with search off was not read |

No new dependency is needed. Before any harness work, for every system: the export list at the
pinned version for select, dropdown, picker, listbox, native; the inclusion test by what the
component is (a focusable element that shows one chosen value, has no text input, and opens a
list of options); a dated line in `data/targets.yaml` for each select-like export, passing or
not.

### The browser's own select on the page (amendment 2, 2026-11-24)

A system whose select renders the browser's `<select>` did not leave the pattern out: it chose
the native element. The page says so and does not show it as "no equivalent component".

- **In the data**: a fourth target status, `browser-native`, beside `measured`, `planned` and
  `not-applicable`, with the export's name, the line in the installed source that renders
  `select`, and the date. A typed field, so the page counts and sorts by it, never by its text.
  It is never counted as measured and never as missing.
- **On the page**, where the system's column or row would be (wording within the copy rules,
  checked with `atlas-content`): "Uses the browser's own select. Not measured: the browser draws
  its list." For Primer, if no select that is not native passes the inclusion test, that line is
  its only entry, stated as its choice.
- A system with both (Fluent `Dropdown` and `Select`, MUI `Select` and `NativeSelect`, Chakra
  `Select` and `NativeSelect`) is measured on the custom one. Decided 2026-11-24: the page
  says in one line, with that system, that it ships a native select too, so a reader does not
  take the custom one for the system's only offer. Read from the same `browser-native` entry,
  never from text.

### Candidate requirement: the native select (asked for on 2026-11-24)

New requirement text is decided separately (O3). Draft, level `guidance`, for review on the preview page:

- **Title**: "Use the browser's own select unless the list needs a look it cannot have"
- **Reason**: "The browser's `<select>` brings its keyboard, its typing to jump to an option and
  what screen readers say about it, with no script of your own, and it follows the platform a
  person is used to. A custom select has to build all of that and keep it working. The price is
  the list: its look is the browser's and differs between browsers and systems, and its keys
  are the platform's, not the ones APG's example chose (Tab, for one). Choose a custom select
  when the options need more than text, and measure it."
- **Sources**: the select-only example, as rationale: "Robust accessibility can be further
  optimized by choosing implementation patterns that maximize use of semantic HTML and heeding
  the warning that No ARIA is better than Bad ARIA." And, for the fairness of the second half,
  the same page: "the following differences in behavior are implemented to improve both
  accessibility and general usability."

**Where it goes** (asked for on 2026-11-24, decided while building): in **For design** as the
requirement, and in **For code** as a note on the reference's root element pointing to it, not
as a second copy. The choice it describes is made twice: a designer decides whether the list
needs a look the browser cannot give, and an engineer decides what to build. But For code holds
the reference with notes and the behavior contract, not a list of requirements; a requirement
block there would change what the tab contains (O5). The note does the same job where an
engineer reads: "This reference is a custom select because Earshot measures custom selects. If
your list needs no custom look, the browser's `<select>` gives you this behavior without
script." Its text is drafted with the requirement and approved with it on the preview page.

What is checked behind it, and what is not: the throwaway page above saw typing a letter change
the value and Tab leave the native select, in headless Chromium on macOS, once. How the native
select behaves in other browsers and on other systems is not measured, and the reason does not
claim it. "Differs between browsers and systems" is a claim about the look; it needs a source or
a check before it is published, or it is cut.

## Carried over from the first five patterns

- The inclusion test first, per system, with its date (ADR 0006).
- One meaning per term and the ownership table, written with the rules.
- An optional APG behavior is not a rule; its scenario is recorded.
- Everything is measured on one engine version; the reference is versioned.
- The page is built on a preview route and published only after the manual screen reader check.

## Decisions

All three approved on 2026-11-24, with the amendments in the header; kept as asked.

1. **Scope and a page of its own** (O1, O6): one single-choice select with a preset value; its
   own pattern and page "Select", with rules quoted from APG's combobox page and the ids it
   shares with combobox. Recommended: designers ask for "select", not "select-only combobox",
   and ADR 0006 already keeps these controls out of the combobox page.
2. **The rule set** (O3): ten rules as first proposed, eleven after the split of
   `name-and-value`. Three choices in it, each recommended:
   - which option is active on opening is **recorded, not judged** (the pattern page and its own
     example disagree);
   - `escape-keeps-value` is a **rule**, from the about section, as `outside-inert` was for the
     dialog; it is the difference APG draws between a combobox and a listbox;
   - `name-and-value` is a **rule**: APG and WCAG 4.1.2 both ask for it, and the check above shows
     the tree tells a combobox with a value from a button whose name carries it.
3. **Components that render the browser's own `<select>` are not measured** (O1): Fluent
   `Select`, Primer `Select`, MUI `NativeSelect`, Chakra `NativeSelect`. The engine cannot drive
   the browser's list (checked above). Each gets a dated line in `data/targets.yaml` with that
   reason, and the page says that a native select is the browser's behavior, not the system's.
   Recommended. The cost: Primer may have no measured select, so the page could have five systems.

Decided while building, recorded here: the engine addition (the select's value,
C3), the scenarios (C3), the order of measuring (C6), the `browser-native` target status and the
marker's wording within the copy rules (C3, C5).

Still for review, once visible on the preview page: the text of `name-is-label` and of
the candidate requirement (O3).

## Order of work once approved

Snapshots of the example page and the rules re-read against it; contracts (rules, sources,
scenarios) and the engine addition; the reference, measured to `follows` on every rule; the
export check and inclusion test per system in `data/targets.yaml`; harness pages and adapters;
measurements; trade-offs for every rule where systems differ, for review; the preview page;
`verdict-auditor` and `design-reviewer`. The manual screen reader check stays the gate before
anything is published.
