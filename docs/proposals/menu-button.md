# Proposal: pattern 3, menu button (a button that opens a menu of actions)

- Opened: 2026-11-15. Status: **approved by the owner, 2026-11-16**, all eight decisions, with one
  amendment to decision 4. The rule table below is the proposal as first written, kept for the
  record; the current rules live in contracts and in
  [docs/patterns/menu-button.md](../patterns/menu-button.md).
  - **Amendment to `disabled` and `activate`.** As proposed, "Enter on the disabled item does
    nothing" was read from the menu staying open. APG asks only that the item cannot be
    activated; a system may close the menu without running anything, and would have differed for
    something APG does not forbid. Activation is measured itself: the reference and every harness
    page write "Last action: <item>" when an item's own handler runs, and the engine reads that
    line. `disabled` judges "not activated" by it, and whether the menu closed is recorded, not
    judged; `activate` judges both that the action ran and that the menu closed.
  - **Decision 8.** `@atlaskit/dropdown-menu` may be added. For Primer's ActionMenu, whether it is
    current or deprecated is checked and written to `data/targets.yaml` before any harness work.
  - The three APG pages were snapshotted on 2026-11-16 and every quote below was found in the
    snapshots.
- Sources, read on 2026-11-15 from the live pages with the snapshot tool's own text extraction
  (`packages/contracts/scripts/sources/page-text.ts`):
  - [Menu Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
  - [Menu and Menubar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/), which the
    first hands the open menu to ("The keyboard behaviors needed after the menu is open are
    described in the Menu and Menubar Pattern")
  - [Action Menu Button Example Using aria-activedescendant](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-actions-active-descendant/)
  - `docs/sources/ARIA--apg--practices--keyboard-interface.md`, snapshot of 2026-11-15, for
    disabled items.

  Every quote below is word for word from those texts. The three pages are not in `docs/sources/`
  yet: the tool snapshots only pages a rule cites, so they are snapshotted with the contracts,
  and the rules are re-read against the snapshots then.

## Scope

One variant: a **button that opens a menu of actions**. Items are plain `menuitem`s that do
something and close the menu. One of them is disabled, in every target.

Out of scope for this pattern: submenus, `menuitemcheckbox` and `menuitemradio`, a menubar, a
context menu (opened by right click or a shortcut), a navigation menu whose items are links
(APG's third example), and a "dropdown" that is a listbox: that is a select, not a menu.

## Rules

Levels as in the two measured patterns: **rule** when the cited page asks for it,
**recommendation** when Atlas goes further and says so.

| id (draft) | Level | Expectation | Quote |
| --- | --- | --- | --- |
| `open` | rule (APG) | Enter on the button opens the menu and makes its first item the active one. Space does the same. | "Enter: opens the menu and places focus on the first menu item." "Space: Opens the menu and places focus on the first menu item." |
| `expanded` | rule (APG) | The button's `expanded` state is false while the menu is hidden and true while it is shown, in every step of every scenario. | "When the menu is displayed, the element with role button has aria-expanded set to true. When the menu is hidden, aria-expanded is set to false." |
| `arrows` | rule (APG) | ↓ moves to the next item and ↑ to the previous one. At the last (first) item, ↓ (↑) wraps or stays; both follow. | "Down Arrow: … When focus is in a menu, moves focus to the next item, optionally wrapping from the last to the first." "Up Arrow: When focus is in a menu, moves focus to the previous item, optionally wrapping from the first to the last." |
| `home-end` | rule (APG), conditional | Where the arrows do not wrap, Home moves to the first item and End to the last. Where they wrap, not applicable. | "Home: If arrow key wrapping is not supported, moves focus to the first item in the current menu or menubar." "End: If arrow key wrapping is not supported, moves focus to the last item in the current menu or menubar." |
| `tab` | rule (APG) | With the menu open, Tab moves focus out of the menu and the menu closes. (As first proposed: “to the next control of the page”. APG says only that focus moves out; the rule in contracts was written without those words, and where focus lands is recorded, not judged. Noted 2026-11-16.) Items are never Tab stops. | "Tab and Shift + Tab do not move focus among the items in the menu." "When focus is on a menuitem in a menu or menubar, move focus out of the menu or menubar, and close all menus and submenus." |
| `escape` | rule (APG) | Escape closes the menu and focus is on the button. | "Escape: Close the menu that contains focus and return focus to the element or context, e.g., menu button or parent menuitem, from which the menu was opened." |
| `activate` | rule (APG) | Enter on an item closes the menu. | "Enter: … Otherwise, activates the item and closes the menu." |
| `focus-returns` | recommendation | After an item is activated, focus is on the button. Focus that falls to the document differs. | The pattern text says where focus goes after Escape and is silent after activation. The APG example does it: "Activates the menu item, causing the Last Action textbox to be updated. Closes the menu. Sets focus on the menu button". Related: WCAG 2.4.3 Focus Order, to be quoted from its snapshot with the contracts. |
| `disabled` | recommendation | The disabled item can be reached with the arrow keys, is exposed as disabled, and Enter on it does nothing: the menu stays open. | Menu pattern, note: "Disabled menu items are focusable but cannot be activated." Practice: "disabled items are focusable when navigating through a menu with the arrow keys", and, on the trade-off, "screen reader users are far less likely to discover disabled elements that are not focusable because moving focus is one of their primary methods of discovery." |

Two terms, one meaning in every rule (the lesson of combobox's "active option"):

- **Active item.** APG allows two ways to move focus in a menu: "The menu container has tabindex
  set to -1 or 0 and aria-activedescendant set to the ID of the focused item", or "Each item in
  the menu has tabindex set to -1". So the active item is the item that holds DOM focus, or the
  item the focused menu names with `aria-activedescendant`. Both follow; which one a system uses
  is recorded and shown, not judged.
- **Shown.** The menu is in the accessibility tree with at least one item, wherever on the page
  it is rendered (ADR 0003, amendment of 2026-11-14 on popups).

Not proposed as rules, with the reason:

- **↓ and ↑ on the button.** APG marks both optional: "(Optional) Down Arrow: opens the menu and
  moves focus to the first menu item", "(Optional) Up Arrow: opens the menu and moves focus to the
  last menu item". CLAUDE.md's draft listed ↓ with Enter and Space. The combobox decision was
  that an optional APG behavior is not a rule and its scenario stays as recorded evidence; the
  same is proposed here (decision 2).
- **Typing a letter.** "Any key that corresponds to a printable character (Optional)". Recorded.
- **Roles and wiring** (`aria-haspopup` on the button, `role="menu"`, `aria-labelledby` or
  `aria-label` on the menu, `aria-controls`). The engine records the role and states of each
  item, not `aria-haspopup` and not the menu container. As with combobox, a later rule
  (decision 6).
- **Space on an item.** "(Optional): When focus is on a menuitem that does not have a submenu,
  activates the menuitem and closes the menu." Recorded.
- **That the action happened.** The engine sees the menu close, not what the item did. The
  reference and the harness pages give every item a visible effect for people who try them; no
  rule reads it.
- **An announcement.** Focus moves to the items, so each is spoken when it becomes active.
  Nothing here is silent the way a removal or a changed list is, so no "say" rule is proposed.

### One defect, one rule

Written before the evaluators, so a system is charged once (the ownership table of combobox):

| What a system does | Charged to | Not charged to |
| --- | --- | --- |
| Enter opens the menu and no item is active | `open` | `arrows` (judged from wherever the first arrow lands) |
| The button says `expanded` wrongly | `expanded` | `open`, `escape`, `activate`, `tab` (they read whether the menu is shown) |
| Tab moves to the next item | `tab` | `arrows` |
| Tab leaves and the menu stays shown | `tab` | `expanded` (it is true and the menu is shown) |
| Escape closes and focus falls to the document | `escape` | `focus-returns` (judged after activation only) |
| The disabled item is skipped by the arrows | `disabled` | `arrows` (judged between the enabled items), `home-end` |
| Enter on the disabled item closes the menu | `disabled` | `activate` (judged on an enabled item) |

## Scenarios

Start for all: a button named "Actions" with four items in every target, **Rename, Duplicate,
Archive (disabled), Delete**; a text field before the button and one after it; the menu closed;
focus on the button.

1. `open-enter`: Enter. Judges `open`, `expanded`.
2. `open-space`: Space. Judges `open`, `expanded`.
3. `open-down`: ↓. Recorded only.
4. `open-up`: ↑. Recorded only.
5. `move`: Enter, ↓, ↑. Judges `arrows`, `expanded`.
6. `ends`: Enter, ↑ at the first item; then ↓ until the last item, ↓ once more. Judges `arrows` at
   the ends and records whether they wrap.
7. `home-end`: Enter, End, Home. Judges `home-end`, with what `ends` recorded.
8. `disabled`: Enter, ↓, ↓ (the third item is the disabled one), Enter. Judges `disabled`.
9. `escape`: Enter, ↓, Escape. Judges `escape`, `expanded`.
10. `activate`: Enter, ↓, Enter. Judges `activate`, `focus-returns`, `expanded`.
11. `tab-open`: Enter, Tab. Judges `tab`, `expanded`.
12. `typeahead`: Enter, "d". Recorded only.

## What the engine has and lacks

Has (checked in `packages/contracts/src/schema/observation.ts`): `press`, `type` and `click`;
`expanded` and `disabled` among the states; the resolved `activeDescendant` on focus and the
mark for one that names nothing; the popup before and after every step, with each item's role,
name and states, wherever it is rendered; `item` on focus whenever focus is on one of the
adapter's items, also outside the component root.

Lacks, each a small change to propose with the contracts:

- **Whether focus is in the pattern's popup.** `isInsideComponent` describes the adapter's root.
  A menu rendered at the end of the page is outside it, so DOM focus on a menu item reads as
  "focus left the component", and the behavior contract and the replays would say so. Proposed:
  a field on focus, `isInsidePopup`, true when focus is on or inside the popup the adapter
  declares. Combobox does not need it (focus never leaves the input); a menu that focuses its
  items does.
- **`aria-haspopup` and the role of the popup container**, only if the wiring rule is wanted.

The shared rule for announcements (engine 0.14.1) is not used: no rule here judges one.

## Reference

`packages/reference/menu-button/`, framework-free. Proposed: a `<button>` and a `role="menu"`
list whose items take DOM focus with `tabindex="-1"` (APG's `element.focus()` example), arrows
that wrap, Home and End, a disabled item that stays focusable with `aria-disabled="true"`, focus
back on the button after Escape and after activation. It must measure `follows` on every rule,
and it is the third reference, so what the three share is extracted now if anything is (rule of
three; the announcer is the candidate, and this pattern does not need one).

## Candidate targets

Checked on 2026-11-15 in the packages already installed for `packages/harness`, the versions of
the current measurements. "Exported" means the name is in the installed package's type
declarations. The docs pages and the behavior were **not** read for this proposal.

| System | Candidate | Checked |
| --- | --- | --- |
| Fluent 2 | `Menu` with `MenuTrigger`, `MenuPopover`, `MenuList`, `MenuItem`; also `MenuButton` | `Menu`, `MenuButton`, `MenuItem` exported by `@fluentui/react-components` 9.75.2 |
| MUI | `Menu` and `MenuItem` opened from a `Button` | `Menu`, `MenuItem`, `MenuList` folders in `@mui/material` 9.5.0; MUI ships no single menu button component there, so this would be a docs composition (ADR 0006) |
| React Aria | `MenuTrigger`, `Menu`, `MenuItem` | `MenuTrigger` is in `react-aria-components` 1.22.1 (`dist/types/exports/Menu.d.ts`) |
| Chakra UI | `Menu` | `components/menu` is in `@chakra-ui/react` 3.38.0 |
| GitHub Primer | `ActionMenu` | present in `@primer/react` 38.45.0; its types recommend "`ActionMenu.Button` or `ActionMenu.Anchor` with `ActionMenu.Overlay`"; current or deprecated not checked |
| Atlassian | `@atlaskit/dropdown-menu` | **not installed**; the harness has only `@atlaskit/select`. A new dependency, so it waits for a yes (decision 8) |

Before any harness work, for every system (engine CLAUDE.md, "Choosing what to measure"):

1. List the package's exports for the pattern's vocabulary (menu, dropdown, action, overflow,
   popover, context) at the pinned version, with the date. A dedicated component wins over a
   composition.
2. Apply the inclusion test by what the component is (ADR 0006, amendment of 2026-11-15): a
   button that opens an element with role `menu` whose items are actions. A "dropdown" that opens
   a listbox is a select and is not measured here.
3. Where the docs show more than one way (a menu button component and a trigger composition),
   record which the harness follows and which it does not.

## Carried over from the first two patterns

What went wrong before and is settled before any code here:

- **The inclusion test comes first**, written into `data/targets.yaml` per system with its date,
  not after the measurements (Atlassian's select, combobox).
- **One meaning per term** ("active item", "shown") and **the ownership table above**, written
  with the rules, not after the first audit.
- **An optional APG behavior is not a rule.** Its scenario is recorded.
- **Levels follow the cited page.** `rule` only where the page asks for it; what an example does
  or a note advises is a recommendation (the design requirements of combobox, two audit rounds).
- **A model needs a mechanism on record with an effect a person can perceive** (ADR 0009). A
  system that keeps DOM focus on the button and moves a highlight over the items would be judged
  by that criterion, not by a new one.
- **Observations say where they come from**: seen by hand with a date and a method, or from the
  engine's recording.
- **The reference is versioned.** A change a reader could notice is a new version, a changelog
  entry and a new measurement.
- **Everything on one engine version.** If the engine changes for this pattern, the other two
  are measured again in the same pass.
- **The page is built on a preview route** from the first measurement, and is published only
  after the manual screen reader check.

## Decisions for the owner

1. **Scope**: an action menu button with one disabled item; submenus, checkable items, links
   and context menus out. Recommended.
2. **↓ and ↑ on the button**: recorded, not judged, as APG marks them optional. Recommended;
   this departs from the draft in CLAUDE.md, which listed ↓ with Enter and Space.
3. **`focus-returns`** as an Atlas recommendation, apart from `activate`. Recommended: the
   pattern text asks only that the menu closes; the example returns focus, and focus that falls to
   the page is the loss Atlas was built to show.
4. **`disabled`** as a recommendation, with one disabled item in every target. Recommended. It
   is the one place where good systems are likely to differ on purpose, and APG states both the
   convention and its cost; it needs a hand-written trade-off from the start.
5. **`home-end`** as a conditional rule, not applicable where the arrows wrap. Recommended.
6. **The wiring rule** (`aria-haspopup`, the menu's role and name): later, as for combobox.
   Recommended.
7. **Engine addition**: `isInsidePopup` on focus, in one engine version, with both measured
   patterns measured again on it. Recommended.
8. **Targets**: the five systems whose package is installed first; Atlassian after a yes to
   adding `@atlaskit/dropdown-menu` (one line: its menu is a separate package from the select
   already measured).

## Order of work once approved

Snapshots of the three APG pages and the rules re-read against them; contracts (rules, sources,
scenarios) and the engine addition; the reference, measured to `follows` on every rule; the
export check and inclusion test per system in `data/targets.yaml`; harness pages and adapters;
measurements; trade-offs for every rule where systems differ, for review; the preview page with
its playground, tour, requirements and notes; `verdict-auditor` and `design-reviewer`. The manual
screen reader check stays the gate before anything is published.
