import type { Pattern } from '../schema/index.ts';
import { combobox } from './combobox.ts';
import { dialog } from './dialog.ts';
import { inputWithChips } from './input-with-chips.ts';
import { menuButton } from './menu-button.ts';
import { select } from './select.ts';
import { tabs } from './tabs.ts';

/** Every pattern with a page on the site, keyed by id, in the order the site lists them. */
export const patterns: Readonly<Record<string, Pattern>> = {
  [inputWithChips.id]: inputWithChips,
  [combobox.id]: combobox,
  [menuButton.id]: menuButton,
  [tabs.id]: tabs,
  [dialog.id]: dialog,
  [select.id]: select,
};

/**
 * Approved patterns that are still being measured (CLAUDE.md 7): the engine, the data validation
 * and the source snapshots read them, and the site gives them no page. None now: the select, the
 * sixth, has its page since 2026-11-25.
 */
export const patternsInProgress: Readonly<Record<string, Pattern>> = {};

export { combobox, dialog, inputWithChips, menuButton, select, tabs };
