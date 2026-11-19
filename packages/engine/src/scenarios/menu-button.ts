import type { ScenarioDefinition } from './types.ts';

export interface MenuButtonState {
  /** How many items every target's menu is given; the third of the four is disabled. */
  itemCount: number;
}

/** No scenario clicks anything yet. */
export type MenuButtonInteraction = never;

type Scenario = ScenarioDefinition<MenuButtonState, MenuButtonInteraction>;
type Steps = Scenario['steps'];

const initialState: MenuButtonState = { itemCount: 4 };
const requestedStateDescription = 'button focused, menu closed, 4 items (the third disabled)';

const press = (...keys: string[]): Steps => keys.map((key) => ({ type: 'press', key }));

const scenario = (id: string, rules: readonly string[], steps: Steps): Scenario => ({
  id,
  // `expanded` is judged after every step of every scenario (docs/patterns/menu-button.md).
  rules: ['expanded', ...rules],
  requestedStateDescription,
  initialState,
  steps,
});

export const menuButtonScenarios: readonly Scenario[] = [
  scenario('open-enter', ['open'], press('Enter')),
  scenario('open-space', ['open'], press('Space')),
  // Recorded only: APG marks both keys optional on the button.
  scenario('open-down', [], press('ArrowDown')),
  scenario('open-up', [], press('ArrowUp')),
  scenario('move', ['arrows'], press('Enter', 'ArrowDown', 'ArrowUp')),
  // Up at the first item, then down past the last one whichever way the first press went and
  // whether or not the disabled item is a stop: both ends, wrapping or staying.
  scenario(
    'ends',
    ['arrows'],
    press('Enter', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown'),
  ),
  // The Up Arrow at the first item shows whether the arrows wrap: Home and End are asked for
  // only where they do not. Home, End, Home shows each key move whichever end Up Arrow left.
  scenario('home-end', ['home-end'], press('Enter', 'ArrowUp', 'Home', 'End', 'Home')),
  // Two presses down from the first item is the place of the disabled third one.
  scenario('disabled', ['disabled'], press('Enter', 'ArrowDown', 'ArrowDown', 'Enter')),
  scenario('escape', ['escape'], press('Enter', 'ArrowDown', 'Escape')),
  scenario('activate', ['activate', 'focus-returns'], press('Enter', 'ArrowDown', 'Enter')),
  scenario('tab-open', ['tab'], press('Enter', 'Tab')),
  // Recorded only: moving to an item by its first letter is optional in APG.
  scenario('typeahead', [], [...press('Enter'), { type: 'type', text: 'd' }]),
];
