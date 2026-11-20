import { Pattern } from '../schema/index.ts';
import { tabsRequirements } from './tabs-requirements.ts';
import { tabsRules } from './tabs-rules.ts';
import { apg } from './tabs-sources.ts';
import { tabsTradeOffs } from './tabs-trade-offs.ts';

/**
 * Pattern 4 (proposal approved 2026-11-19, docs/proposals/tabs.md). On the site since 2026-11-19,
 * on the owner's word after his VoiceOver check: the reference and five systems measured, one
 * trade-off and four design requirements approved (docs/follow-ups/tabs.md).
 */
export const tabs = Pattern.parse({
  id: 'tabs',
  name: 'Tabs',
  aliases: ['Tab list', 'Tabbed interface', 'Tab bar'],
  description:
    'A row of tabs, each showing its own panel of content, one panel at a time: the tab list is a single Tab stop, arrow keys move between the tabs, and a tab is activated either as it receives focus or with Enter or Space.',
  apg: {
    dedicated: true,
    pattern: {
      kind: 'apg',
      title: 'Tabs Pattern',
      url: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/',
      checkedAt: apg.keyboard.checkedAt,
    },
  },
  rules: tabsRules,
  requirements: tabsRequirements,
  tradeOffs: tabsTradeOffs,
});
