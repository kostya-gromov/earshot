import type { TradeOff } from '../schema/index.ts';

/**
 * Trade-offs for tabs, hand-written; each is a draft until it is reviewed. Reviewed on
 * 2026-11-19: the panel that is not a Tab stop.
 */
export const tabsTradeOffs: TradeOff[] = [
  {
    // Written on 2026-11-19 from the recording: in Fluent 2, Tab from "Overview", whose panel holds
    // plain text, went on to the field after the tabs; from "Members", whose panel starts with a
    // link, it landed on the link. The panel is the With Panels story's own div, with no
    // tabIndex: the difference is the docs composition's wiring, not TabList's (data/targets.yaml).
    // Gain, cost and condition follow the APG tabs snapshot: Tab moves to "the tabpanel unless the
    // first element containing meaningful content inside the tabpanel is focusable", and the
    // automatic example gives every panel tabindex="0" "To make it easy for screen reader users
    // to navigate from a tab to the beginning of content in the active tabpanel".
    kind: 'alternative',
    ruleId: 'panel-reachable',
    seenIn: ['fluent'],
    alternative:
      'The panel is not a Tab stop of its own. In Fluent 2 the panel is not part of the package: TabList ships none, and the docs story that adds panels gives them no tabIndex.',
    gain: 'One Tab stop fewer on the way past the tabs, and no focus ring around a block of text.',
    cost: 'Where a panel starts with text, Tab from its tab goes past the content it just showed, so a keyboard or screen reader user has to look for that content another way.',
    reasonableWhen:
      'Every panel starts with something that takes focus, such as a link or a field: then Tab reaches the panel’s content anyway.',
    status: 'reviewed',
  },
];
