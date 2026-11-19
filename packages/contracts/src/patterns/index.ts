import type { Pattern } from '../schema/index.ts';
import { combobox } from './combobox.ts';
import { inputWithChips } from './input-with-chips.ts';
import { menuButton } from './menu-button.ts';

/** Every pattern with a page on the site, keyed by id, in the order the site lists them. */
export const patterns: Readonly<Record<string, Pattern>> = {
  [inputWithChips.id]: inputWithChips,
  [combobox.id]: combobox,
  [menuButton.id]: menuButton,
};

/**
 * Approved patterns that are still being measured (CLAUDE.md 7, M4): the engine, the data
 * validation and the source snapshots read them, and the site gives them no page. None now:
 * menu button, the last of phase 1, has its page since 2026-11-16.
 */
export const patternsInProgress: Readonly<Record<string, Pattern>> = {};

export { combobox, inputWithChips, menuButton };
