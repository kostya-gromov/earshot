import type { Pattern } from '../schema/index.ts';
import { combobox } from './combobox.ts';
import { dialog } from './dialog.ts';
import { inputWithChips } from './input-with-chips.ts';
import { menuButton } from './menu-button.ts';
import { tabs } from './tabs.ts';

/** Every pattern with a page on the site, keyed by id, in the order the site lists them. */
export const patterns: Readonly<Record<string, Pattern>> = {
  [inputWithChips.id]: inputWithChips,
  [combobox.id]: combobox,
  [menuButton.id]: menuButton,
  [tabs.id]: tabs,
  [dialog.id]: dialog,
};

/**
 * Approved patterns that are still being measured (CLAUDE.md 7): the engine, the data validation
 * and the source snapshots read them, and the site gives them no page. None now: the modal
 * dialog, the fifth, was here from 2026-11-21 until it moved to the patterns.
 */
export const patternsInProgress: Readonly<Record<string, Pattern>> = {};

export { combobox, dialog, inputWithChips, menuButton, tabs };
