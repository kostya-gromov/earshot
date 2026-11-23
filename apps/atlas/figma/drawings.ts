import { drawCombobox } from './combobox.ts';
import { drawDialog } from './dialog.ts';
import { drawInputWithChips } from './input-with-chips.ts';
import { drawMenuButton } from './menu-button.ts';
import { drawTabs } from './tabs.ts';

/** The element of each pattern that has a drawing, by pattern id. */
export const drawings: Readonly<Record<string, () => FrameNode>> = {
  'input-with-chips': drawInputWithChips,
  combobox: drawCombobox,
  'menu-button': drawMenuButton,
  tabs: drawTabs,
  dialog: drawDialog,
};
