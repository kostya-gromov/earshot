# Proposal: pattern 4, tabs (a horizontal tab list with one panel shown at a time)

- Opened: 2026-11-19. Status: **approved by the owner, 2026-11-19**, all nine decisions as
  recommended. Decision 1: the work starts now, alongside M5. Decision 8: `@atlaskit/tabs` may be
  added. The rule table below is the proposal as first written, kept for the record; once the
  contracts exist, the current rules live there and in `docs/patterns/tabs.md`.
- Sources, read on 2026-11-19 from the live pages with the snapshot tool's own text extraction
  (`packages/contracts/scripts/sources/page-text.ts`); the hash is the one that tool computes:
  - [Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), hash `3ef777444901e23c`
  - [Example of Tabs with Automatic Activation](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-automatic/),
    hash `c8966183e9dec8ba`
  - [Example of Tabs with Manual Activation](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-manual/),
    hash `a28230bbfa23c07b`
  - `docs/sources/ARIA--apg--practices--keyboard-interface.md`, snapshot of 2026-11-17, for
    "Deciding When to Make Selection Automatically Follow Focus" and "Focusability of disabled
    controls".

  Every quote below is word for word from those texts. The three tabs pages are not in
  `docs/sources/` yet: the tool snapshots only pages a rule cites, so they are snapshotted with
  the contracts, and the rules are re-read against the snapshots then (as for menu button).

## Before the pattern: scope and milestone

`CLAUDE.md` 3 lists three patterns for phase 1 and 7 says the current milestone is M5,
validation. Tabs is a fourth pattern. This document is the proposal that section 7 asks for and
nothing more; opening the work itself needs a line in both sections (decision 1).

## Scope

One variant: a **horizontal tab list of four tabs, each with its own panel, one panel shown at a
time**, all panel content present in the page. Each system is measured as it ships by default,
whichever way it activates a tab.

Out of scope for this pattern: a vertical tab list, tabs that can be deleted (Delete), a tab with
a popup menu (Shift + F10), a tab list that scrolls or overflows into a menu, panels loaded on
demand, and **tabs that are links to other pages**: that is navigation, not this pattern, and is
excluded by the inclusion test below. A disabled tab is also left out of the first version
(decision 7).

## Rules

Levels as in the three measured patterns: **rule** when the cited page asks for it,
**recommendation** when it is a note's advice or Atlas goes further and says so.

| id (draft) | Level | Expectation | Quote |
| --- | --- | --- | --- |
| `tab-in` | rule (APG) | Tab from the control before the tab list puts focus on the active tab, also when the active tab is not the first one. Shift+Tab from the control after the tabs widget comes back the same way. | "When focus moves into the tab list, places focus on the active tab element." |
| `tab-out` | rule (APG) | With focus on a tab, Tab moves focus out of the tab list. The tabs are one Tab stop: Tab never lands on another tab. Where focus lands is recorded here and judged by `panel-reachable`. | "When the tab list contains the focus, moves focus to the next element in the page tab sequence outside the tablist" |
| `panel-reachable` | rule (APG), level is decision 4 | When the shown panel starts with content that is not focusable, Tab from the tab list lands on the panel itself. When its first content is focusable, landing on that element follows as well. | "…which is the tabpanel unless the first element containing meaningful content inside the tabpanel is focusable." Note: "When the tabpanel does not contain any focusable elements or the first element with content is not focusable, the tabpanel should set tabindex="0" to include it in the tab sequence of the page." |
| `arrows` | rule (APG) | → moves focus to the next tab and ← to the previous one. | "Left Arrow: moves focus to the previous tab." "Right Arrow: Moves focus to the next tab." |
| `wrap` | rule (APG) | → on the last tab moves focus to the first, ← on the first to the last. Unlike the menu, APG does not mark wrapping optional here. | "If focus is on the first tab, moves focus to the last tab." "If focus is on the last tab element, moves focus to the first tab." |
| `activate` | rule (APG), conditional | Where the arrows move focus without activating, Enter on the focused tab activates it, and so does Space. Where the arrows activate, not applicable. | "Space or Enter: Activates the tab if it was not activated automatically on focus." |
| `selected` | rule (APG) | In every step of every scenario exactly one tab says it is selected, and the others say they are not. | "The active tab element has the state aria-selected set to true and all other tab elements have it set to false." |
| `panel` | rule (APG) | In every step exactly one tab panel is exposed, and its accessible name is the name of the selected tab. | "Tabs are a set of layered sections of content, known as tab panels, that display one panel of content at a time." "Each element with role tabpanel has the property aria-labelledby referring to its associated tab element." |
| `vertical-keys-free` | recommendation | In a horizontal tab list ↓ and ↑ move neither focus nor selection. | Note: "If the tab list is horizontal, it does not listen for Down Arrow or Up Arrow so those keys can provide their normal browser scrolling functions even when focus is inside the tab list." |

Three terms, one meaning in every rule:

- **Focused tab.** The tab that holds DOM focus, or the tab a focused tab list names with
  `aria-activedescendant`. Both APG examples use a roving `tabindex`; the pattern page names
  neither mechanism, so which one a system uses is recorded and shown, not judged.
- **Active tab.** The tab whose `selected` state is true in the accessibility tree. "Activate"
  means: make that tab the active one and show its panel.
- **Shown panel.** An element with role `tabpanel` that is in the accessibility tree.

**Activation mode is recorded, not judged.** APG allows both: "Optionally, activates the newly
focused tab". Its advice depends on something the engine cannot see from a preloaded page: "It is
recommended that tabs activate automatically when they receive focus as long as their associated
tab panels are displayed without noticeable latency." The practice page gives the cost of the
other case: "if displaying a new panel causes a network request and possibly a page refresh, the
effect of having selection automatically follow focus can be devastating to the experience for
keyboard and screen reader users." So the page shows each system's mode as a fact with this as
the hand-written trade-off, and no verdict.

Not proposed as rules, with the reason:

- **Home and End.** "Home (Optional): Moves focus to the first tab." "End (Optional): Moves
  focus to the last tab." An optional APG behavior is not a rule (combobox, menu button); the
  scenario is recorded.
- **Roles and wiring** (`aria-controls` on each tab, the tab list's own name,
  `aria-orientation`). `panel` reads the panel's name because that is what a screen reader user
  hears on entering it; the rest is a later rule, as for the other patterns.
- **How selection and focus look.** The practice page says "The selected state must be visually
  distinct from the focus indicator." The engine does not judge pixels; this is a candidate
  design requirement for the pattern page, not a measured rule.
- **An announcement.** Focus moves to each tab, so it is spoken with its selected state. Nothing
  here is silent the way a removal is, so no "say" rule is proposed.

### One defect, one rule

| What a system does | Charged to | Not charged to |
| --- | --- | --- |
| Tab into the list lands on the first tab while another is active | `tab-in` | `selected` |
| Tab from a tab moves to the next tab | `tab-out` | `arrows`, `panel-reachable` (not judged when focus never left the list) |
| Tab leaves the list and skips a panel of plain text | `panel-reachable` | `tab-out` (focus did leave) |
| → moves between neighbours and stops at the last tab | `wrap` | `arrows` (judged between neighbours only) |
| Arrows move focus, and Enter does not activate | `activate` | `selected`, `panel` (the old tab and panel still agree) |
| Two tabs selected, or none | `selected` | `panel` when one panel is shown and named by one of them |
| The selected tab changes and the old panel stays | `panel` | `selected`, `activate` |
| ↓ moves focus to the next tab | `vertical-keys-free` | `arrows` |

## Scenarios

Start for all: a tab list named "Project" with four tabs in every target, **Overview, Activity,
Members, Settings**; a text field before the tabs widget and one after it; Overview active. The
Overview, Activity and Settings panels hold a paragraph of plain text; the Members panel starts
with a link. Focus on the Overview tab unless a scenario says otherwise.

1. `tab-in`: activate Members (by click), focus the field before, Tab. Judges `tab-in`.
2. `tab-in-back`: activate Members, focus the field after, Shift+Tab until focus is in the tab
   list. Judges `tab-in`.
3. `tab-out-text`: Tab from the Overview tab. Judges `tab-out`, `panel-reachable`.
4. `tab-out-link`: activate Members, focus its tab, Tab. Judges `tab-out`, `panel-reachable`.
5. `move`: →, →, ←. Judges `arrows`, `selected`, `panel`; records the activation mode.
6. `ends`: ← on the first tab; → on the last. Judges `wrap`, `selected`, `panel`.
7. `activate-enter`: →, Enter. Judges `activate`, `selected`, `panel`.
8. `activate-space`: →, Space. Judges `activate`, `selected`, `panel`.
9. `vertical-keys`: ↓, ↑. Judges `vertical-keys-free`.
10. `home-end`: End, Home. Recorded only.

## What the engine has and lacks

Has (checked in `packages/contracts/src/schema/observation.ts`): `press`, `type` and `click`;
`selected` among the states; `item` on focus when focus is on one of the adapter's items; the
resolved `activeDescendant`; the accessibility diff of the component root after each step.

Lacks, each a change to propose with the contracts:

- **The whole tab set at each step.** `selected` and `panel` judge all four tabs and the shown
  panels, not only the focused element. `Step.popup` holds exactly this kind of record
  (`before` and `after`, each item's role, name and states) but for a popup with an opener.
  Proposed: a record of the same shape for tabs, with the tabs and the exposed tab panels,
  rather than stretching the meaning of "popup".
- **Whether focus is inside the shown panel**, for `tab-out-link`, where focus lands on a link.
  The same idea as `isInsidePopup`.
- **Scrolling** is not recorded, so `vertical-keys-free` judges only that focus and selection do
  not move, not that the page scrolled.

## Reference

`packages/reference/tabs/`, framework-free. Proposed: `<button role="tab">` elements with a
roving `tabindex` in a `role="tablist"`, automatic activation (all panels are in the page, the
case APG recommends it for), arrows that wrap, Home and End, every `tabpanel` named by its tab
and given `tabindex="0"` (the automatic example: "It is recommended that all tabpanel elements
in a tab set are focusable if there are any panels in the set that contain content where the
first element in the panel is not focusable"). It measures `follows` on every rule and
`not-applicable` on `activate`, which is conditional.

## Candidate targets

Checked on 2026-11-19 in the packages already installed for `packages/harness`. "Exported" means
the name is in the installed package's type declarations. The docs pages and the behavior were
**not** read for this proposal.

| System | Candidate | Checked |
| --- | --- | --- |
| Fluent 2 | `TabList` with `Tab` | both exported by `@fluentui/react-components` 9.75.2; `TabPanel` does not occur in its `dist/index.d.ts`, so the panels would be the page's own elements: a docs composition if the docs show one (ADR 0006) |
| MUI | `Tabs` with `Tab` | `Tabs` and `Tab` folders in `@mui/material` 9.5.0; no `TabPanel`, `TabContext` or `TabList` folder there and `@mui/lab` is not installed, so again a composition. `Tabs` has a `selectionFollowsFocus` prop ("If `true` the selected tab changes on focus. Otherwise it only changes on activation."); its default was not checked |
| React Aria | `Tabs`, `TabList`, `Tab`, `TabPanels`, `TabPanel` | exported by `react-aria-components` 1.22.1 (`dist/types/exports/Tabs.d.ts`) |
| Chakra UI | `Tabs` | `components/tabs` is in `@chakra-ui/react` 3.38.0 |
| GitHub Primer | `Tabs` and `UnderlinePanels`, both under `@primer/react/experimental` | 38.45.0: roles `tab`, `tablist`, `tabpanel` are in `dist/experimental/Tabs/`; `TabNav` in the main entry is marked `@deprecated` in its types; `UnderlineNav` is in the main entry and was not inspected. Whether an experimental export is measured is decision 8 |
| Atlassian | `@atlaskit/tabs` | **not installed**. On npm on 2026-11-19: version 21.3.1, "Tabs are used to organize content by grouping similar information on the same page.", last modified that day, so pnpm's minimum release age may hold it back. A new dependency (decision 8) |

Before any harness work, for every system: the export list for the pattern's vocabulary (tab,
tabs, tablist, panel, segmented, underline, nav) at the pinned version with its date; the
inclusion test by what the component is (a `tablist` whose tabs show `tabpanel`s on the same
page; a row of links or a segmented control of radio buttons is not measured here); and, where
the docs show more than one way, which the harness follows.

## Carried over from the first three patterns

- The inclusion test comes first, written into `data/targets.yaml` per system with its date.
- One meaning per term and the ownership table, written with the rules.
- An optional APG behavior is not a rule; its scenario is recorded.
- Levels follow the cited page.
- Observations say where they come from: seen by hand with a date and a method, or recorded.
- The reference is versioned; everything is measured on one engine version, so if the engine
  changes for tabs the three measured patterns are measured again in the same pass.
- The page is built on a preview route and is published only after the manual screen reader
  check.

## Decisions for the owner

1. **Open a fourth pattern now.** `CLAUDE.md` 3 lists three patterns and 7 has M5 as current.
   Recommended: approve the proposal now and name when the work starts (alongside M5 or after
   it); I then add tabs to both sections in the same change as the approval.
2. **Scope**: horizontal, four tabs, preloaded panels, each system's default activation; vertical
   lists, deletable tabs, tab menus, overflow and link tabs out. Recommended.
3. **Activation mode recorded, not judged**, with `activate` conditional on manual activation.
   Recommended: APG makes it optional, and its advice hangs on latency, which a preloaded page
   does not have. Measuring a system's other mode as a variant (ADR 0005, `variant-of`) can
   follow where a system documents a switch; not in the first pass.
4. **`panel-reachable` as a rule.** The keyboard section states it as behavior; the note that
   says how uses "should". Recommended: rule, with a hand-written trade-off from the start (the
   extra Tab stop against reaching the panel's start). The alternative is a recommendation.
5. **`wrap` apart from `arrows`**, both rules. Recommended: APG does not mark wrapping optional
   for tabs, and a system that stops at the end is charged once.
6. **`vertical-keys-free` as a recommendation.** Recommended: it is a note, and the engine can
   judge only half of it (nothing moved), not the scrolling it exists to protect.
7. **No disabled tab in the first version.** The tabs page does not contain the word
   "disabled"; of the snapshots in `docs/sources/` only the keyboard practice page and WCAG
   "Status Messages" mention a tab list at all, and the practice page's section on disabled
   controls gives the menu as its example and says "Authors are encouraged to adopt consistent
   pattern-based conventions". Recommended: leave it out now and return to it as a
   recommendation once the pattern is measured.
8. **Targets**: React Aria and Chakra first (dedicated components with panels), then Fluent and
   MUI as compositions if their docs show one. Primer only if an `experimental` export passes
   the inclusion rule: recommended no for now, recorded in `data/targets.yaml` with the
   evidence. Atlassian after a yes to adding `@atlaskit/tabs` (one line: its tabs are a separate
   package from the two already installed).
9. **Engine addition**: a tab-set record on each step and "focus is inside the shown panel", in
   one engine version, with the three measured patterns measured again on it. Recommended.

## Order of work once approved

Snapshots of the three APG pages and the rules re-read against them; contracts (rules, sources,
scenarios) and the engine addition; the reference, measured to `follows` on every rule; the
export check and inclusion test per system in `data/targets.yaml`; harness pages and adapters;
measurements; trade-offs for every rule where systems differ, for review; the preview page;
`verdict-auditor` and `design-reviewer`. The manual screen reader check stays the gate before
anything is published.
