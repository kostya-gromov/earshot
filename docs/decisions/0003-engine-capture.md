# 0003. Engine capture: focus, live regions, accessibility tree, speech line, settle

- Status: accepted (2026-10-31). Open question resolved: CDP is the primary source in phase 1.
- Date: 2026-10-31
- Scope: M1, Chromium only

## Context

For every step of a scenario the engine records what changed for a keyboard and screen reader user: where focus went, what was announced, how the accessibility tree changed, and a "what a screen reader would say" line (CLAUDE.md 8.2). Two constraints shape every choice:

1. **Deterministic.** The same page and steps give the same observations.
2. **Honest.** We record what the browser exposes to assistive technology, not what the DOM looks like. Where we approximate (the speech line), the UI says so.

The structure follows `docs/engineering-standards.md`: the **shell** talks to the browser and produces plain data; the **core** (diff, speech, verdicts) is pure functions over that data.

## Evidence gathered before writing this

Short spike against Playwright 1.64.1 and Chrome Headless Shell 156 (scripts not kept):

| Question | Result |
| --- | --- |
| Can CDP `Accessibility.getPartialAXTree({ objectId, fetchRelatives: false })` return role, name and states for the focused element? | Yes, for a plain button, a combobox (`expanded`, `hasPopup`, `controls`), a button in a **closed** shadow root and a button in a same-origin iframe. |
| Does `aria-activedescendant` resolve through CDP? | Yes. The `activedescendant` property carries `relatedNodes[].backendDOMNodeId`; a second `getPartialAXTree` gives `option "Two"`, `selected`. |
| Does CDP expose `posinset` / `setsize`? | **No.** They are not in `AXPropertyName` (checked in `playwright-core/types/protocol.d.ts`). "3 of 3" must be derived; see "Position in set". |
| Can an init script see closed shadow roots? | Yes, by wrapping `Element.prototype.attachShadow` before page scripts run. `document.activeElement` stops at the host, while the patched walk reached the inner button. |
| Can Playwright locators reach into closed shadow roots? | No (`getByRole` timed out). Adapters for such systems need another way in; recorded per adapter in `notes`. |
| Is `dom-accessibility-api` (0.7.1) injectable as an init script? | Not as-is: it is several ESM files, so injecting it needs a bundler. See the open question. |

## Decisions

### 1. Focus (`capture/focus.ts`, shell)

1. An init script defines a non-enumerable `__earshot.deepActiveElement()`. It walks from `document.activeElement` into open shadow roots, closed shadow roots (through the `attachShadow` wrapper's `WeakMap`) and same-origin iframes.
2. The engine calls it through CDP `Runtime.evaluate`, which returns an `objectId`, then calls `Accessibility.getPartialAXTree({ objectId, fetchRelatives: false })`. **Role, name, description and states come from Chromium's accessibility tree**, the same data the platform accessibility APIs receive. We do not compute them in JS.
3. States are mapped from AX properties: `expanded`, `selected`, `checked` (true/false/mixed), `disabled`, `invalid`.
4. `isBody`: the deep active element is `document.body` or null. `isInsideComponent`: the adapter's root contains it, walking up through shadow hosts.
5. `activeDescendant`: resolved from the `activedescendant` relation as described above.
6. `path`: a short CSS-like path for debugging, never shown in the UI.

**Position in set.** CDP does not expose it, so the engine derives it deterministically:
- if the focused element has `aria-posinset` / `aria-setsize`, use them;
- otherwise find the nearest AX ancestor (or the element itself) with a set-item role (`listitem`, `option`, `menuitem*`, `treeitem`, `tab`, `row`, `radio`) and count its non-ignored siblings with the same role.

The shell fetches the nodes; the counting is a pure core function (`model/set-position.ts`). Found while implementing: `getPartialAXTree({ fetchRelatives: true })` returns ancestors and children, but siblings only as ids in the parent's `childIds`, despite the protocol docs. The shell therefore reads the parent's children with `Accessibility.getChildAXNodes`. This gives the "3 of 3" of a remove button inside the third of three list items. Whether real screen readers say it is checked in the M2 manual spot-check, and the result goes into this ADR.

### 2. Live regions (`capture/page/live-region-recorder.js` + `capture/live-regions.ts`)

The in-page recorder is plain JS with JSDoc and `// @ts-check` (like the reference), self-contained, and loaded with `page.addInitScript({ path })`. It needs no bundler.

1. A `MutationObserver` on `document` (childList, subtree, characterData, attributes `aria-live`, `role`, `hidden`, `aria-hidden`). The same `attachShadow` wrapper attaches an observer to every new shadow root, because document observers do not see inside shadow trees. Many design systems render in shadow DOM.
2. **A live region** is an element with `aria-live="polite" | "assertive"`, or role `status`, `log` (polite) or `alert` (assertive), or an `<output>` element (implicit `status`). `aria-live="off"` is excluded.
3. **When the text of a region changes** to a non-empty value (whitespace collapsed), the recorder stores `{ text, politeness, t: performance.now(), regionInsertedAt }`. The empty write that many components use to reset a region is not an announcement.
4. A change inside a region that is not rendered (`checkVisibility()` false) or sits under `aria-hidden="true"` is skipped, because screen readers do not announce it. Visually hidden regions (the `sr-only` technique) still count.
5. **`insertedLate`** is true when the region was inserted **after the step's action started**. "After page load" would flag every region in a client-rendered Storybook. The real failure is a region created together with its message.
6. The engine drains the buffer after each step. Announcements whose `t` lies between the action start and the end of settling belong to that step, and `at` is relative to the action start.

Simplification, stated in the methodology page: we announce the full region text, ignoring `aria-atomic` and `aria-relevant`. That is what most screen readers do for short status messages, but not always.

### 3. Accessibility tree snapshot and diff

1. **Shell (`capture/ax-tree.ts`).** `Accessibility.getFullAXTree`, then the subtree under the adapter root's `backendDOMNodeId`, with ignored nodes dropped. Each node is normalised to `{ role, name, depth, props }`, where `props` holds expanded, selected, checked, disabled, invalid, pressed and level.
2. **Core (`diff/ax-diff.ts`).** Flatten both trees in pre-order and match them with a longest common subsequence on `depth|role|name`.
   - Unmatched before = **removed**, unmatched after = **added**.
   - Matched pairs with different `props` = **changed**.
   - Between two matched anchors, an unmatched removed and added node with the same role and depth are paired as a **rename** (`changed`, property `name`).

   We match by meaning, not by DOM identity, because components like the reference re-render every chip. Matching by `backendNodeId` would report "all chips removed and added".
3. `locator.ariaSnapshot()` (YAML) is saved only as a human-readable artifact next to the trace, for debugging. It is not part of the measurement.
4. The "before" tree of step n is the "after" tree of step n − 1, so it is captured once.

The diff gets **property-based tests** (fast-check): `diff(a, a)` is empty, and applying added and removed to `a` reproduces the multiset of `b`.

### 4. Speech line (`speech/`, core, pure)

Input: the step's focus before and after, plus its announcements. Output: ordered lines. This is a **semantic model**, labelled as such everywhere (CLAUDE.md 8.2).

- Focus line when focus identity changed (path or role/name): `"{name}, {role}, {pos} of {size}"`. Missing parts are omitted, then state words follow in a fixed order: `expanded`/`collapsed`, `selected`, `checked`/`not checked`/`mixed`, `unavailable` (disabled), `invalid entry`. Roles are ARIA role names verbatim; no screen reader vocabulary is invented.
- Focus on the body: `"{document title}, document"`. The UI also shows it as a loss (red).
- An active descendant change with no DOM focus change produces a line for the active option in the same format.
- Order: **assertive announcements, then the focus line, then polite announcements**. This models the usual behaviour: assertive interrupts, polite waits for the focus speech.

### 5. Settle (`runner/settle.ts`, shell)

After each action:

1. Wait two animation frames.
2. Wait until the page is quiet: no DOM mutation seen by the recorder for **400 ms** (100 ms until 2026-11-13, see the amendment below) and no running finite `document.getAnimations()`.
3. Stop at a hard cap of **1000 ms** total.

The step records `settle: { ms, quiet }`. `quiet: false` means the cap was hit, and the evaluator treats observations from that step as less certain: a verdict relying on them becomes `inconclusive` unless the observation is unambiguous.

The fixed context (CLAUDE.md 8.1: viewport, locale, `reducedMotion: 'reduce'`, UTC) removes most timing variance before it starts.

### 6. Comparing runs (core)

Three runs are equal when their observations are equal after removing timing fields (`at`, `settle.ms`) and debug fields (`path`). Any other difference makes the affected verdicts `inconclusive` with reason `flaky: …`, and all runs are kept (CLAUDE.md 8.7, enforced by the schema already).

## Schema changes this implies

Additive, in `packages/contracts/src/schema/observation.ts`:
- `Step.settle: { ms: number, quiet: boolean }`.
- `FocusInfo.activeDescendant` gains optional `posInSet`, `setSize`, `states`, so combobox steps (M4) can say "Two, option, 2 of 2, selected".

## Module plan (M1)

| Layer | Module | Does |
| --- | --- | --- |
| shell | `capture/page/live-region-recorder.js`, `capture/page/deep-focus.js` | In-page recorders (init scripts) |
| shell | `capture/cdp.ts` | One CDP session per page, typed helpers |
| shell | `capture/focus.ts`, `capture/live-regions.ts`, `capture/ax-tree.ts` | Read the browser, return plain data |
| shell | `runner/settle.ts`, `runner/run-scenario.ts`, `adapters/reference.ts`, `cli/` | Drive steps, orchestrate runs |
| core | `model/set-position.ts`, `diff/ax-diff.ts`, `speech/speech-line.ts`, `model/compare-runs.ts` | Pure, unit and property tested |
| core | `evaluators/input-with-chips/{tab,bsp,arrows,say}.ts` | One evaluator per rule (Strategy) |

Suggested PR order: (1) capture modules and settle, with a debug command that prints the observations for one scenario; (2) core diff, speech and set position, with tests; (3) runner, reference adapter, CLI, evaluators and the measurement file; (4) the broken reference copy that must yield `differs`.

## Resolved question (2026-10-31)

Accepted: CDP is the primary source in phase 1, and CLAUDE.md 7 says so. Kept for the reasoning.

**CDP instead of `dom-accessibility-api` for names and roles in phase 1?**

CLAUDE.md 7 says to bundle `dom-accessibility-api` into an init script and cross-check it with CDP.

- **Recommendation:** in Chromium-only phase 1, CDP is the primary source, because it is the browser's own computation, exactly what assistive technology receives. Bundling the library needs `esbuild`, a new dependency, and adds a second, less authoritative answer we would have to reconcile.
- **When to revisit:** when Firefox and WebKit are added (no CDP there). At that point bring in `dom-accessibility-api` with `esbuild`, and its cross-check becomes useful.

CLAUDE.md 7 was updated accordingly.

## Implementation notes (M1, PR 1)

- `pnpm engine debug --keys …` on the reference reproduces the behavior contract from CLAUDE.md 9. Backspace moves focus to "Remove Hiroshi Matsui, 3 of 3". A second Backspace removes it, announces "Hiroshi Matsui removed. 2 selected" (polite, about 1 ms after the key), and moves focus to "Remove Greg Fisher, 2 of 2". The combobox reports `expanded` and the active option through `aria-activedescendant`.
- Determinism: three runs of an 8-step sequence (Backspace, Backspace, ArrowLeft, Delete, a, ArrowDown, Enter, Tab) were byte-identical once timing fields (`at`, `ms`) were removed. Every step went quiet before the cap.
- Observation for the `tab` rule (resolved 2026-10-31: Tab from a chip must leave the field; the reference was fixed, scenario `tab-from-chip` added): **Tab from a focused chip landed on the input**, not outside the field, because the input follows the chips in DOM order. Leaving the field from a chip therefore takes two Tabs. The `tab-out` scenario starts in the input, so it still passes, but whether "one stop for the whole field" should also hold from a chip is a rule question.

## Amendment (2026-11-13): the quiet window is 400 ms

Accepted by the owner on 2026-11-13. Engine 0.11.0.

- **What happened.** Chakra UI 3.38.0 brings `@zag-js/live-region` 1.47.0, which waits at least 100 ms before it writes an announcement (`MIN_DELAY = 100`; 1.43.3 wrote it at once). The engine's quiet window was also 100 ms, so the click-removal step closed a few milliseconds before the text arrived. Three runs agreed on "Removal is not announced", which is false: a separate script saw "Tag Greg Fisher deleted" 104 ms after the click. Agreement between runs does not catch an error that every run makes.
- **Decision.** 400 ms: four times the delay seen. The cap stays at 1000 ms.
- **Counted from the action.** The window used to be counted from the last change on the page, even one before the action, so a step that changed nothing at once closed after two frames (7 to 34 ms in the recordings; found by the verdict audit the same day). It is now counted from the action or the last change, whichever is later: every step lasts at least 400 ms.
- **Evidence.** A trial with 400 ms on all seven targets changed one verdict (Chakra UI `say`, back to follows) and no other; no step hit the cap.
- **What it does not solve.** An announcement written more than 400 ms after the last change is still missed. "Not announced" therefore means "nothing within 400 ms of the page going quiet", and the methodology page says so.
- **Cost.** Each step takes at least 400 ms.


## Amendment (2026-11-14): the field's value and an unresolved active descendant

Approved by the owner on 2026-11-14 with the combobox proposal. Engine 0.12.0.

- **What is added to focus.** `value`: the text in the focused text field, read from the DOM (`input` of a text type, `textarea`); absent for anything else, and never read from a password field. `activeDescendantUnresolved: true`: `aria-activedescendant` is set but names no element in the accessibility tree.
- **Why.** Combobox rules judge what Enter puts in the field and whether the active option exists. On 2026-11-13 a measured system's `aria-activedescendant` named an id no element had; the engine recorded nothing, and only a separate script saw it.
- **Existing measurements.** Both fields are optional, so the files measured on 0.11.0 stay valid and are not rewritten. A re-measurement on 0.12.0 will add `value` to their steps; no input-with-chips evaluator reads either field.

## Amendment (2026-11-14): a pattern's popup is recorded where it is rendered

Approved by the owner on 2026-11-14. Engine 0.12.0, same version as the amendment above; nothing was measured between them.

- **What happened.** The tree diff covers the adapter's component root. Component libraries usually render a combobox popup at the end of the page, outside that root, so the engine would have recorded "nothing changed in the tree" when a list opened, and `expanded` and `selected` could not be judged for any real system.
- **Options.** (1) The adapter says where the popup is and the engine records it. (2) Each harness page forces the popup inside the root with a library prop. The second measures a configuration teams do not ship and needs a justified prop per system.
- **Decision.** Option 1. An adapter may declare `popup` (the element that holds the options); its options are the adapter's `items`. Around every step the engine records `popup.before` and `popup.after`: whether the popup is in the accessibility tree, and its options in DOM order with their role, name and states. Elements the tree leaves out (hidden, `display: none`) are not recorded.
- **What does not change.** `isInsideComponent` and `axDiff` still describe the component root only. `item` on focus is now set whenever focus is on one of the adapter's items, also outside the root, so an option that holds DOM focus in a popup is recognised.
- **Existing measurements.** The field is optional and no input-with-chips adapter declares a popup, so those files are unaffected.
- **Limit.** The engine sees what the adapter's locators find. A popup the adapter does not locate is not recorded, and the evidence card says how the popup and options are found.

## Amendment (2026-11-14): a live region that arrives with its text is recorded, apart from announcements

Approved by the owner on 2026-11-14 as a follow-up to the first combobox measurements. Engine 0.12.4.

- **What happened.** When no option matches, MUI's Autocomplete puts a `role="status"` region with "No options" into the page. The recorder counts text written into a live region that is already there, so the step read "nothing announced", and the only trace of the region was a note written by hand.
- **Decision.** A step now carries `insertedRegions`: each live region that entered the page during the step already holding text, with that text and its politeness. It is kept apart from `announcements`, because screen readers often do not speak a region inserted together with its text; the engine does not claim it was heard or that it was not.
- **How it is used.** The combobox announcement evaluators do not judge such a step and quote the text in the reason. No input-with-chips evaluator reads the field.
- **Existing measurements.** The field is absent when nothing was inserted, so the files measured before stay valid. A re-measurement may add it to steps of input with chips; their verdicts do not depend on it.
- **Limit that stays.** For a region whose messages accumulate (React Aria's announcer appends each message), an announcement holds the region's whole text, not the part added in that step.

## Amendment (2026-11-14): a region that keeps its messages is recorded by what was added

Engine 0.13.0. Closes the limit left by the amendment above.

- **What happened.** React Aria's announcer appends each message to one log region. The recorder stored the region's whole text at every change, so a step read "3 options available.AppleApricot" where only "Apricot" was new; the first place this was drawn, the combobox preview page, showed it as a spoken line.
- **Decision.** When a region's new text begins with its previous text, only the added part is recorded. A region that is read whole is still recorded whole: `aria-atomic="true"`, and `role="status"` or `role="alert"` unless they say `aria-atomic="false"`. Text that was replaced is recorded whole, as before.
- **Existing measurements.** Not rewritten. A re-measurement of input with chips may shorten announcements of a system that appends to a log; its verdicts read the announcement of the step they judge, which this makes more exact, not less.

## Amendment (2026-11-15): one rule for when a live region's text announces a change

Decided by the owner on 2026-11-15 after the verdict audit of the input-with-chips re-measurement. Engine 0.14.0. Replaces "How it is used" in the amendment of 2026-11-14 on regions that arrive with their text.

- **What happened.** React Aria's removal by click brings in a polite region holding "Irene OhGreg FisherHiroshi Matsui". The chips evaluator read only `announcements` and said "The removal was not announced" without a word about the region. The combobox evaluators did the opposite with the same kind of step: they did not judge it and quoted the text. Two patterns, two policies.
- **Decision.** One rule for every pattern (`model/change-announcement.ts`). The text a live region holds in the judged step counts as the announcement of the change **only if it names the change and does not appear in the same form in a step without it**, anywhere in the recording.
  - It names the change and appears nowhere without it: **follows**.
  - It does not name the change, or the same text also appears without it: **not announced** (differs), with the text quoted and the reason it is not counted.
  - The recording does not show what changed, so neither can be told: **inconclusive**, with the text quoted.
- **What names a change.** Input with chips: the text holds the label of a node that left the accessibility tree in the step. Combobox, "Say that the suggestions changed": any text, because what the message says is the next rule's question; "without the change" is a step that left the list of options as it was.
- **A region that arrives with its text is read like any other.** It was not judged before, because screen readers often do not speak such a region. The reason now says how each text arrived (written into a region that was there, into one that entered during the step, or arriving with the region), so a reader sees what a verdict rests on; whether a screen reader speaks it is what the manual check is for.
- **Evaluators see the whole recording.** Scenarios are recorded first and judged afterwards; an evaluator receives every scenario's first completed run as `recorded`.
- **What changed in the verdicts.** Nothing in either pattern. No judged combobox step had an inserted region, and no text that counts as an announcement appears in a step without the change. One text is ruled out by the rule: React Aria's region on input with chips, which holds all three names and arrives the same way on Tab with nothing removed. Its `say` keeps its verdict; the reason now quotes the region and gives that ground.
- **One ground in the reason (0.14.1, verdict audit of the same day).** When the same text appears without the change, the reason says only that. "Does not name the change" is given only where a text is not repeated: for a text that lists every value, names run together, whether it names the removed one is arguable, and the verdict does not need it. A text recorded both as arriving with its region and as written into it in the same step is one text.
- **Also in 0.14.0.** Two reasons say one step in the singular ("the 1 step judged", "In 1 arrow key step").

## Amendment (2026-11-16): what a menu needs, the opener, focus in the popup, and what an action did

Approved by the owner on 2026-11-16 with the menu button proposal and its amendment. Engine 0.15.0.

- **Focus in the popup.** A step's focus carries `isInsidePopup` for adapters that declare a popup. A menu is usually rendered at the end of the page, outside the component root, so `isInsideComponent` alone read DOM focus on a menu item as focus that left the component. Combobox did not need it: its focus never leaves the input.
- **The opener.** `popup.before` and `popup.after` carry `opener`, the element that opens the popup as the tree exposes it, for adapters that say where it is. A menu button's expanded state is read there: once focus is in the menu, the focused element says nothing about the button.
- **What an action did.** An adapter may declare `effect`, an element the page's own handlers write to; its text is recorded before and after every step. The reference and every harness page write "Last action: <item>" there from the item's own handler, as plain text and not as a live region, so it is never an announcement. A rule can then tell an item that was activated from a menu that only closed. As first proposed, "Enter on a disabled item does nothing" was read from the menu staying open; APG asks only that the item cannot be activated, and a system may close the menu without running anything.
- **Limit.** `effect` shows that the item's handler ran on our page. It says nothing about what a product would do in that handler.
- **Existing measurements.** Both patterns were measured again on 0.15.0 the same day, so every file is on one engine. No verdict and no reason changed. Combobox steps now carry `isInsidePopup: false`; input with chips declares no popup and no effect, so its steps are as before.

## Amendment (2026-11-16): `expanded` for a menu button, and speech when focus lands on an active descendant

Approved by the owner on 2026-11-16. Engine 0.15.2.

- **The opener, three cases.** Not in the accessibility tree after a step: nothing was said, the step is not judged. In the tree with no expanded state: the rule differs (APG: "When the menu is hidden, aria-expanded is set to false"; no state is not false). In the tree with a state: compared with whether the menu is shown.
- **Both states or inconclusive.** The rule follows only when the button was read at least once with the menu shown and once with it hidden, anywhere in the measurement. A system that hides the button while its menu is shown can only be read in one state, and one state does not show that the button tells the two apart.
- **Speech.** When focus lands on an element that already names an active descendant, the line for the element is followed by a line for the item it points at. Before, the item was said only when the active descendant changed with DOM focus in place, so a menu that takes focus itself read as "Actions, menu" and nothing else.

## Amendment (2026-11-16): the popup an element says it has

Decided by the owner on 2026-11-16, after the design review of the menu button page. Engine 0.16.0.

- **Why.** A menu button's focus line read "Actions, button, collapsed": nothing in it said that the button opens a menu, on a page about menu buttons. Screen readers do say it.
- **What is recorded.** `states.hasPopup` on the focused element: `menu`, `listbox`, `tree`, `grid` or `dialog`, read from the element's own `aria-haspopup` attribute ("true" is a menu; "false", an empty value and unknown tokens are none). It is read from the DOM attribute and not from the accessibility tree, because the tree gives some roles an implicit value the author never wrote: a combobox that does not write the attribute records none.
- **How it is said.** `has popup <kind>`, after the role and before position and states, in the same words for every system: "Actions, button, has popup menu, collapsed". The playground's model of the live reference uses the same words.
- **What it does not touch.** No rule reads it; verdicts and reasons do not depend on speech. The opener recorded with a popup, and nodes in the tree diff, carry no `hasPopup`: only focus does.

## Amendment (2026-11-16): engine 0.16.1, three corrections in one measurement

Engine 0.16.1, measured once for all three patterns. The first was found by the verdict audit of 2026-11-16; the other two were decided by the owner that day.

### Which element has focus is not read from its path

- **What was wrong.** Whether focus moved in a step was decided by comparing the two debug paths of the focused element. A path holds each ancestor's place among its siblings, so it changes when a sibling is added or removed while the element stays where it is. Atlassian's Select re-renders around its input: every typed letter and every removed chip changed the input's path, the model read that as focus arriving on the field again, and the replay said "Fruit, combobox, expanded" on steps where the same input kept focus. Other systems showed only the announcement on the same kind of step.
- **What is recorded now.** `focus.element`: a number the page script gives an element the first time it holds focus, kept in a WeakMap for as long as the page lives. The same number means the same element. The speech model and the menu button's Tab rule read "the same element" from it; the path remains a debugging aid and a fallback for recordings made before this.
- **Left out of the comparison of runs**, like the path: it is bookkeeping, not an observation.
- **A new element is a new number.** A system that replaces the focused element with another one, even with the same id, is recorded as focus moving. That is what the browser reports.

### A popup is said only beyond the default of the role

- **What was wrong in 0.16.0.** "Only when the attribute is written" turned a way of writing markup into something heard. A combobox has a listbox by default (WAI-ARIA), so `aria-haspopup="listbox"` on a combobox changes nothing for assistive technology; yet Atlassian and GitHub Primer, which write it, read "Fruit, combobox, has popup listbox" while five systems with the same role did not. That was a difference made by the model, not by the components.
- **The rule now.** `states.hasPopup` is recorded, and said as `has popup <kind>`, when the element's own `aria-haspopup` names a kind that is not the default of its role. A button has no default, so "Actions, button, has popup menu, collapsed" stays. A combobox with `listbox` records nothing; a combobox with `dialog`, `grid`, `tree` or `menu` ("true") is said.

### How many steps a scenario's verdict rests on, as data

- **`judgedSteps`** on one scenario's result and on its entry in a rule's `basis`: the count an evaluator that judges several steps already states in its reason ("after each of the 3 steps judged"). Written by the two `expanded` evaluators and the menu button's `arrows`, on a result that follows or could not be judged. Absent everywhere else: on rules judged on one step, on other rules that count steps in their reason (combobox `focus-stays`, for one), and on a result that differs, whose reason names the step.
- **Why.** The site folds scenarios that say the same and sums this number for the fold's label. It must be the quantity the reasons state, and it must come from the file, not from reading a sentence.

### Engine 0.16.2, the same day: one step is written "the one step"

Wording only, in the two `expanded` evaluators: "after the 1 step judged" became "after the one step judged", and "after any of the 1 step here" became "after the one step here". Measured again for all three patterns: no verdict changed, no spoken line changed, and reasons changed in these words alone.
