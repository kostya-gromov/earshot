import { Pattern } from '../schema/index.ts';
import { menuButtonRules } from './menu-button-rules.ts';
import { apg } from './menu-button-sources.ts';
import { menuButtonRequirements } from './menu-button-requirements.ts';
import { menuButtonTradeOffs } from './menu-button-trade-offs.ts';

/**
 * Pattern 3 (proposal approved 2026-11-16, docs/proposals/menu-button.md). In progress: the
 * reference and six systems are measured, the trade-offs and the design requirements are written
 * and the page is a preview at /lab/patterns/menu-button/; what is open before it is published
 * is in docs/follow-ups/menu-button.md.
 */
export const menuButton = Pattern.parse({
  id: 'menu-button',
  name: 'Menu button',
  aliases: ['Dropdown menu', 'Action menu', 'Overflow menu'],
  description:
    'A button that opens a menu of actions: Enter or Space opens it, arrow keys move between the items, Enter runs one, and Escape closes the menu and returns to the button.',
  apg: {
    dedicated: true,
    pattern: {
      kind: 'apg',
      title: 'Menu Button Pattern',
      url: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/',
      checkedAt: apg.buttonKeyboard.checkedAt,
    },
  },
  rules: menuButtonRules,
  requirements: menuButtonRequirements,
  tradeOffs: menuButtonTradeOffs,
});
