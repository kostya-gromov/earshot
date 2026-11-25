import { Pattern } from '../schema/index.ts';
import { selectRequirements } from './select-requirements.ts';
import { selectRules } from './select-rules.ts';
import { apg } from './select-sources.ts';
import { selectTradeOffs } from './select-trade-offs.ts';

/**
 * Pattern 6 (docs/proposals/select.md, opened and approved on 2026-11-24). In
 * progress: five systems and the reference measured, seven requirements and three trade-offs
 * reviewed on 2026-11-25 (the fourth trade-off, on arrows, dropped on 2026-11-24),
 * and no page among the patterns until the manual screen reader check.
 */
export const select = Pattern.parse({
  id: 'select',
  name: 'Select',
  aliases: ['Select-only combobox', 'Dropdown', 'Picker'],
  description:
    'A field that shows one chosen option and opens a list to choose another: arrows move through the list while focus stays on the field, Enter chooses, and Escape closes the list.',
  apg: {
    dedicated: true,
    pattern: {
      kind: 'apg',
      title: 'Combobox Pattern, select-only',
      url: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
      checkedAt: apg.keyboard.checkedAt,
    },
  },
  rules: selectRules,
  requirements: selectRequirements,
  tradeOffs: selectTradeOffs,
});
