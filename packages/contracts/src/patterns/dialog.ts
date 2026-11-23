import { Pattern } from '../schema/index.ts';
import { dialogRequirements } from './dialog-requirements.ts';
import { dialogRules } from './dialog-rules.ts';
import { apg } from './dialog-sources.ts';
import { dialogTradeOffs } from './dialog-trade-offs.ts';

/**
 * Pattern 5 (docs/proposals/dialog.md, opened by the owner on 2026-11-21). In progress: six
 * systems measured, six design requirements approved by the owner on 2026-11-23, two draft
 * trade-offs (`wrap`, ahead of the systems, decision 6; `modal`, from React Aria), and no page
 * among the patterns until the manual screen reader check.
 */
export const dialog = Pattern.parse({
  id: 'dialog',
  name: 'Modal dialog',
  aliases: ['Dialog', 'Modal', 'Modal window'],
  description:
    'A window that opens over the page and takes the keyboard: focus moves into it, Tab stays inside, Escape closes it and focus returns to the button that opened it, while the page behind cannot be used.',
  apg: {
    dedicated: true,
    pattern: {
      kind: 'apg',
      title: 'Dialog (Modal) Pattern',
      url: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
      checkedAt: apg.keyboard.checkedAt,
    },
  },
  rules: dialogRules,
  requirements: dialogRequirements,
  tradeOffs: dialogTradeOffs,
});
