import type { Pattern } from '../schema/index.ts';
import { combobox } from './combobox.ts';
import { inputWithChips } from './input-with-chips.ts';
import { menuButton } from './menu-button.ts';
import { tabs } from './tabs.ts';

/** Every pattern with a page on the site, keyed by id, in the order the site lists them. */
export const patterns: Readonly<Record<string, Pattern>> = {
  [inputWithChips.id]: inputWithChips,
  [combobox.id]: combobox,
  [menuButton.id]: menuButton,
  [tabs.id]: tabs,
};

/**
 * Approved patterns that are still being measured (CLAUDE.md 7): the engine, the data validation
 * and the source snapshots read them, and the site gives them no page. None now: tabs, the
 * fourth, has its page since 2026-11-19.
 */
export const patternsInProgress: Readonly<Record<string, Pattern>> = {};

export { combobox, inputWithChips, menuButton, tabs };
