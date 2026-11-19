# 0007. Recognising a chip: set position, or the adapter's items

- Status: accepted (2026-11-09)
- Scope: engine capture and the input-with-chips evaluators; engine 0.4.0

## Context

Until 0.3.0 a chip was a focused element inside the component, other than the text entry, that
exposed a set position ("2 of 3") in the accessibility tree. MUI and Primer chips expose none, so
their arrows and Tab-from-chip verdicts were inconclusive, although focus visibly moved chip to
chip. No rule's text asks for a set position; the verdict answered a question the rule does not ask.

## Decision

- Each adapter declares `items`: a locator for the pattern's items in DOM order, and a plain
  description of how they are found. The engine records on every focus reading which item holds
  focus (`item: { index, count }`).
- A chip is a focused element inside the component, not the text entry, with a place among the
  chips: the set position the accessibility tree exposes when there is one, otherwise its place
  among the adapter's items. Still never decided by name.
- A missing set position is shown as its own observation on the evidence card ("a screen reader
  does not hear 2 of 3"), not folded into a verdict. How the items were found is shown too.

## Consequences

- MUI and Primer: tab and arrows now judged (both follow). Chakra stays inconclusive on Tab from
  a chip, because its arrow keys never move focus onto a tag.
- Adapters now carry a little more knowledge of each system. It is visible on the card and in
  the measurement (`target.itemsFoundBy`), so it can be checked and corrected.
