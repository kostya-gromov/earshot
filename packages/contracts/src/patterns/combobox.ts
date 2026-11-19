import { Pattern } from '../schema/index.ts';
import { comboboxRequirements } from './combobox-requirements.ts';
import { comboboxRules } from './combobox-rules.ts';
import { apg } from './combobox-sources.ts';
import { comboboxTradeOffs } from './combobox-trade-offs.ts';

/**
 * Pattern 2 (proposal approved 2026-11-14, docs/proposals/combobox.md). In `patterns` since
 * 2026-11-15, on the owner's word. The manual screen reader check is still to come and still gates
 * the first release of the site (CLAUDE.md 7), as it does for input with chips.
 */
export const combobox = Pattern.parse({
  id: 'combobox',
  name: 'Combobox',
  aliases: ['Autocomplete', 'Autosuggest', 'Typeahead'],
  description:
    'A text input with a list of suggestions: typing filters the list, arrow keys move through it, Enter accepts an option and Escape closes it.',
  apg: {
    dedicated: true,
    pattern: {
      kind: 'apg',
      title: 'Combobox Pattern',
      url: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
      checkedAt: apg.keyboard.checkedAt,
    },
  },
  rules: comboboxRules,
  requirements: comboboxRequirements,
  tradeOffs: comboboxTradeOffs,
});
