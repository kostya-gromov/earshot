import type { ScenarioDefinition } from './types.ts';

export interface ComboboxState {
  /** How many options the target is given; the same six for every target. */
  optionCount: number;
}

/** No scenario clicks anything yet. */
export type ComboboxInteraction = never;

type Scenario = ScenarioDefinition<ComboboxState, ComboboxInteraction>;
type Steps = Scenario['steps'];

const initialState: ComboboxState = { optionCount: 6 };
const requestedStateDescription = '6 options, empty combobox focused, popup closed';

const press = (...keys: string[]): Steps => keys.map((key) => ({ type: 'press', key }));
/** One key that matches three of the six options, by prefix and by substring alike. */
const typeA: Steps = [{ type: 'type', text: 'a' }];

const scenario = (id: string, rules: readonly string[], steps: Steps): Scenario => ({
  id,
  // `expanded` is judged after every step of every scenario (docs/patterns/combobox.md).
  rules: ['expanded', ...rules],
  requestedStateDescription,
  initialState,
  steps,
});

export const comboboxScenarios: readonly Scenario[] = [
  scenario('tab-out', ['tab'], press('Tab', 'Shift+Tab')),
  scenario('tab-open', ['tab'], [...typeA, ...press('ArrowDown', 'Tab')]),
  // Judges `down` and `focus-stays` only if the popup is shown after the key.
  scenario('open-down', ['down', 'focus-stays'], press('ArrowDown')),
  scenario(
    'type-then-move',
    ['down', 'focus-stays', 'arrows', 'selected', 'say-results', 'say-count'],
    [...typeA, ...press('ArrowDown', 'ArrowDown', 'ArrowUp')],
  ),
  // Four presses each way reach both ends whichever option the first Down Arrow lands on.
  scenario(
    'ends',
    ['arrows'],
    [
      ...typeA,
      ...press('ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown'),
      ...press('ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp'),
    ],
  ),
  scenario('accept', ['enter'], [...typeA, ...press('ArrowDown', 'Enter')]),
  // The second Escape is recorded only: APG lets it clear the text.
  scenario('escape', ['escape'], [...typeA, ...press('ArrowDown', 'Escape', 'Escape')]),
  // Recorded only: which option is exposed as selected when the list is shown again after a
  // value was chosen, and whether it stays selected once another option is active. The
  // `selected` trade-off rests on it.
  scenario('reopen', [], [...typeA, ...press('ArrowDown', 'Enter', 'ArrowDown', 'ArrowDown')]),
  // Recorded only: opening on Up Arrow is optional in APG.
  scenario('open-up', [], press('ArrowUp')),
  // Recorded only: one key that matches nothing. APG lets the popup close, and neither
  // announcement rule rests on what a system says then.
  scenario('no-match', [], [{ type: 'type', text: 'z' }]),
];
