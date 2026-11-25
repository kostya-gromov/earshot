import type { ScenarioDefinition } from './types.ts';

/**
 * Every select scenario starts with the list closed and the value Banana, chosen among Apple,
 * Apricot, Banana, Cherry and Date (docs/proposals/select.md, Scenarios). Focus starts on the
 * select, or on the field before it for the scenario that arrives by Tab.
 */
export interface SelectStart {
  focus: 'select' | 'field-before';
}

/** No scenario clicks anything. */
export type SelectInteraction = never;

type Scenario = ScenarioDefinition<SelectStart, SelectInteraction>;
type Steps = Scenario['steps'];

const press = (...keys: string[]): Steps => keys.map((key) => ({ type: 'press', key }));
const times = (key: string, count: number): Steps => press(...Array<string>(count).fill(key));

const onSelect: SelectStart = { focus: 'select' };

/** `expanded` is judged after every step in which the select holds focus. */
const scenario = (id: string, rules: readonly string[], steps: Steps): Scenario => ({
  id,
  rules: ['expanded', ...rules],
  requestedStateDescription: 'Value Banana, list closed, focus on the select',
  initialState: onSelect,
  steps,
});

/** Six presses each way cover both ends whichever option the list opened on. */
const PRESSES = 6;

export const selectScenarios: readonly Scenario[] = [
  {
    id: 'tab-in',
    rules: ['tab', 'name-and-value', 'name-is-label'],
    requestedStateDescription: 'Value Banana, list closed, focus on the field before the select',
    initialState: { focus: 'field-before' },
    steps: press('Tab'),
  },
  scenario('open', ['down', 'focus-stays'], press('ArrowDown')),
  scenario(
    'move',
    ['focus-stays', 'arrows', 'selected'],
    [...press('ArrowDown'), ...times('ArrowDown', PRESSES), ...times('ArrowUp', PRESSES)],
  ),
  scenario('enter', ['enter', 'name-and-value'], press('ArrowDown', 'ArrowDown', 'Enter')),
  scenario('escape', ['escape', 'escape-keeps-value'], press('ArrowDown', 'ArrowDown', 'Escape')),
  // Whether this Tab also sets the value is recorded, not judged.
  scenario('tab-open', ['tab'], press('ArrowDown', 'ArrowDown', 'Tab')),
  // Recorded only: keys the APG pattern makes optional.
  scenario(
    'optional-keys',
    [],
    press(
      'ArrowUp',
      'Escape',
      'Alt+ArrowDown',
      'Alt+ArrowUp',
      'ArrowDown',
      'End',
      'Home',
      'Escape',
    ),
  ),
  // Recorded only: typing to reach an option; "aa" is typed in quick succession.
  scenario(
    'typeahead',
    [],
    [{ type: 'type', text: 'c' }, ...press('Escape', 'ArrowDown'), { type: 'type', text: 'aa' }],
  ),
  // Recorded only: Space on the closed select is in the APG example, not the pattern.
  scenario('space', [], press('Space')),
  // Recorded only: one letter typed on the closed select. The APG example opens the list; the
  // browser's own select changes its value and stays closed (2026-11-25). Last: the first
  // scenario that decides a rule gives its summary, and this one judges no list shown.
  scenario('type-closed', [], [{ type: 'type', text: 'c' }]),
];
