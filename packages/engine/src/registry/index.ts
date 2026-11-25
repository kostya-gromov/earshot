import { comboboxSuite } from '../suites/combobox.ts';
import { dialogSuite } from '../suites/dialog.ts';
import { inputWithChipsSuite } from '../suites/input-with-chips.ts';
import { menuButtonSuite } from '../suites/menu-button.ts';
import { selectSuite } from '../suites/select.ts';
import { tabsSuite } from '../suites/tabs.ts';
import { registerPattern, type RegisteredPattern } from './register-pattern.ts';

const inputWithChips = registerPattern(inputWithChipsSuite);
const combobox = registerPattern(comboboxSuite);
const menuButton = registerPattern(menuButtonSuite);
const tabs = registerPattern(tabsSuite);
const dialog = registerPattern(dialogSuite);
const select = registerPattern(selectSuite);

export const registeredPatterns: ReadonlyMap<string, RegisteredPattern> = new Map([
  [inputWithChips.pattern.id, inputWithChips],
  [combobox.pattern.id, combobox],
  [menuButton.pattern.id, menuButton],
  [tabs.pattern.id, tabs],
  [dialog.pattern.id, dialog],
  [select.pattern.id, select],
]);
