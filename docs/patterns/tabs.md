# Tabs

On the site since 2026-11-19 (proposal approved the same day, [docs/proposals/tabs.md](../proposals/tabs.md)). The
rules live in `packages/contracts/src/patterns/tabs-rules.ts`; this brief says how they are
judged and what is settled before any system is measured.

## Scope

A horizontal tab list of four tabs, **Overview, Activity, Members, Settings**, each with its own
panel, one panel shown at a time, all panel content in the page. Overview, Activity and Settings
hold plain text; Members starts with a link, the only element in any panel that takes focus. A
text field "Project name" before the tabs and one "Notes" after them. Each system is measured in
its default activation mode.

## Terms

- **Focused tab**: the tab with DOM focus, or the tab the focused element names with
  `aria-activedescendant`.
- **Active tab**: the one tab exposed as selected. With none or several selected there is no
  active tab, and that moment is charged to `selected` alone.
- **Shown panel**: an element with role `tabpanel` that is in the accessibility tree.

Activation mode (whether the arrow keys activate) is recorded and never judged.

## One defect, one rule

| What a system does | Charged to | Not charged to |
| --- | --- | --- |
| Tab into the list lands on a tab that was not active, even if it then activates it | `tab-in` | `selected` |
| Tab from a tab moves to the next tab | `tab-out` | `panel-reachable` (not judged while focus is in the list) |
| Tab from a tab falls to the document | `tab-out` | `panel-reachable` (not judged) |
| Tab leaves the list and skips a panel | `panel-reachable` | `tab-out` |
| The arrow keys move between neighbours and stop at the end | `wrap` | `arrows` |
| The arrow keys do nothing at all | `arrows` | `wrap` (not judged), `activate` (not judged) |
| Enter or Space moves neither the selection nor the panel | `activate` | `selected`, `panel` |
| Enter moves the panel and not the selection, or the reverse | `panel` | `activate` |
| No tab, or two tabs, selected | `selected` | `panel` (any of them may name the panel), `tab-in`, `activate` (not judged) |
| Down Arrow moves to the next tab | `vertical-keys-free` | `arrows` |

One exception, decided on 2026-11-19: where every tab is a Tab stop, `tab-in` and `tab-out`
both differ. APG asks for the two separately and a system can fail one without the other.

## Engine

Engine 0.17.0 records, for adapters that declare `panels`: every tab and every shown panel
before and after each step (`Step.tabSet`), and whether focus is inside a shown panel
(`FocusInfo.isInsidePanel`). Chromium gives a tab without `aria-selected` no selected state and
does not infer one from focus; `test/capture/tab-set.test.ts` keeps that true.

## Reference

`packages/reference/tabs/`, 0.1.4: roving tabindex, automatic activation, wrapping arrows, Home
and End, every panel a Tab stop named by its tab. Measured 2026-11-19 on engine 0.17.0, three
consistent runs: `follows` on eight rules, `not-applicable` on `activate`.

## Systems

Measured on 2026-11-19, engine 0.17.0, three consistent runs each: React Aria, Chakra UI, Fluent
2 (docs composition), MUI (docs composition), Atlassian. Primer is recorded as planned
(experimental exports only). Each page's own source says how it was built; `data/targets.yaml`
holds the export check and the inclusion test.
