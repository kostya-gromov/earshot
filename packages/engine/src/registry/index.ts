import { comboboxSuite } from '../suites/combobox.ts';
import { inputWithChipsSuite } from '../suites/input-with-chips.ts';
import { menuButtonSuite } from '../suites/menu-button.ts';
import { registerPattern, type RegisteredPattern } from './register-pattern.ts';

const inputWithChips = registerPattern(inputWithChipsSuite);
const combobox = registerPattern(comboboxSuite);
const menuButton = registerPattern(menuButtonSuite);

export const registeredPatterns: ReadonlyMap<string, RegisteredPattern> = new Map([
  [inputWithChips.pattern.id, inputWithChips],
  [combobox.pattern.id, combobox],
  [menuButton.pattern.id, menuButton],
]);
