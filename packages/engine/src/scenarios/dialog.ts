import type { ScenarioDefinition } from './types.ts';

/** Every dialog scenario starts the same way (docs/proposals/dialog.md, Scenarios). */
export interface DialogStart {
  start: 'dialog closed, focus on the button';
}

/** What a scenario clicks. Each adapter says where these are on its page. */
export type DialogInteraction = 'name-field' | 'cancel' | 'field-after';

type Scenario = ScenarioDefinition<DialogStart, DialogInteraction>;
type Steps = Scenario['steps'];

const press = (...keys: string[]): Steps => keys.map((key) => ({ type: 'press', key }));
const click = (target: DialogInteraction): Steps => [{ type: 'click', target }];
const times = (key: string, count: number): Steps => press(...Array<string>(count).fill(key));

const initialState: DialogStart = { start: 'dialog closed, focus on the button' };

const scenario = (id: string, rules: readonly string[], steps: Steps): Scenario => ({
  id,
  rules,
  requestedStateDescription: 'Dialog closed, focus on the button that opens it',
  initialState,
  steps,
});

/** Enter on the button opens the dialog: every scenario begins with it. */
const open = press('Enter');

/**
 * Six presses: more than any measured dialog has Tab stops, so the step from the last to the
 * first falls inside the run whatever a system adds (a close button of its own).
 */
const PRESSES = 6;

export const dialogScenarios: readonly Scenario[] = [
  scenario(
    'open',
    ['open-focus', 'focus-not-on-dialog', 'named-dialog', 'name-matches-title', 'modal'],
    open,
  ),
  scenario('tab-forward', ['contained', 'wrap'], [...open, ...times('Tab', PRESSES)]),
  scenario('tab-backward', ['contained', 'wrap'], [...open, ...times('Shift+Tab', PRESSES)]),
  scenario('escape', ['escape', 'return-focus'], [...open, ...press('Escape')]),
  // Escape with text typed into the field: some fields take the first Escape for themselves.
  scenario(
    'escape-typing',
    ['escape', 'return-focus'],
    [...open, ...click('name-field'), { type: 'type', text: 'Ada' }, ...press('Escape')],
  ),
  scenario('cancel', ['return-focus'], [...open, ...click('cancel')]),
  // The field after the button is behind the dialog: the click goes to its centre point.
  scenario('outside-click', ['outside-inert'], [...open, ...click('field-after')]),
];
