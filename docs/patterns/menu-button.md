# Pattern brief: menu button

A button that opens a menu of actions. Proposal: [docs/proposals/menu-button.md](../proposals/menu-button.md),
approved 2026-11-16 with one amendment. Rules: `packages/contracts/src/patterns/menu-button-rules.ts`.
Engine additions: ADR 0003, amendment of 2026-11-16.

## Scope

Items are plain `menuitem`s that do something and close the menu; one of the four is disabled.
Out: submenus, checkable items, a menubar, a context menu, a menu of links, and a "dropdown" that
opens a listbox (that is a select).

## Three terms, one meaning each

- **Active item**: the item that holds DOM focus, or the item the focused menu names with
  `aria-activedescendant`. Both are in APG; which one a system uses is recorded, never judged.
- **Shown**: the menu is in the accessibility tree with at least one item, wherever it is rendered.
- **Activated**: the item's own handler ran. Every measured page writes "Last action: <item>"
  from that handler and the engine reads the line. The menu closing is not a sign of activation,
  in either direction.

## Rules

| id | Level | Judged in |
| --- | --- | --- |
| `open` | rule | `open-enter`, `open-space` |
| `expanded` | rule | every step in which the button is in the accessibility tree |
| `arrows` | rule | `move`, `ends` |
| `home-end` | rule, conditional | `home-end` |
| `tab` | rule | `tab-open` |
| `escape` | rule | `escape` |
| `activate` | rule | `activate` |
| `focus-returns` | recommendation | `activate` |
| `disabled` | recommendation | `disabled` |

`home-end`: APG asks for the two keys only where the arrows do not wrap. Without wrapping they
are judged. With wrapping the rule is not applicable, whatever the keys do: optional behavior is
recorded and shown as an observation, not judged, or a system that does more than the source
asks would follow while one that does exactly what it asks would drop out of the count. The
reference wraps and has both keys, as the APG example does, so it is not applicable here; a
reference must differ on no rule (ADR 0004, amendment of 2026-11-16).

`expanded`: a step after which the button is not in the accessibility tree is not judged; a
button that is there with no expanded state differs; the rule follows only when both states were
read somewhere in the measurement, and is inconclusive where one of them never could be.

Recorded, not judged: Down Arrow and Up Arrow on the button (`open-down`, `open-up`) and typing
a letter in the menu (`typeahead`); APG marks all three optional.

## One defect, one rule

| What a system does | Charged to | Not charged to |
| --- | --- | --- |
| Enter opens the menu and no item is active | `open` | `arrows` (judged only from an active item) |
| The button says `expanded` wrongly | `expanded` | `open`, `escape`, `activate`, `tab` (they read whether the menu is shown) |
| Tab moves to another item | `tab` | `arrows` |
| Tab leaves and the menu stays shown | `tab` | `expanded` |
| Escape closes and focus falls to the document | `escape` | `focus-returns` (judged after an action only) |
| The arrows skip the disabled item | `disabled` | `arrows` (a skip over a disabled item follows there), `home-end` |
| Enter on the disabled item runs its action | `disabled` | `activate` (judged on an item that can be activated) |
| Enter closes the menu and the action did not run | `activate` | `focus-returns` (judged only after an action that ran) |

## Every measured page

A button named "Actions" (MUI's default style upper-cases it, and the tree exposes "ACTIONS"); four items, **Rename, Duplicate, Archive (disabled), Delete**, set
through the component's own props; a text field before the button and one after it; a paragraph
with the id `last-action` that starts as "Last action: none" and is written by each item's own
handler. Not a live region.

## Order of work

Done: contracts, sources, engine 0.15.2, scenarios, evaluators, the reference, harness pages and
measurements for six systems, draft trade-offs. Open: `docs/follow-ups/menu-button.md`.
