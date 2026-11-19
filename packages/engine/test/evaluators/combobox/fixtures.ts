import type { FocusInfo, PopupState, Step } from '@earshot/contracts';
import type { EvaluatorInput } from '../../../src/model/evaluator.ts';

export const fruit = ['Apple', 'Apricot', 'Avocado'];

/** A moment as the engine records it: where focus is and what the popup holds. */
export interface Moment {
  focus: FocusInfo;
  popup: PopupState;
}

const closedPopup: PopupState = { present: false, options: [] };

export function popup(names: readonly string[], selected?: string | readonly string[]): PopupState {
  const marked = selected === undefined ? [] : [selected].flat();
  return {
    present: true,
    options: names.map((name) => ({
      role: 'option',
      name,
      states: { selected: marked.includes(name) },
    })),
  };
}

export function combobox(overrides: Partial<FocusInfo> = {}): FocusInfo {
  return {
    role: 'combobox',
    name: 'Fruit',
    states: { expanded: false },
    isBody: false,
    isInsideComponent: true,
    value: '',
    ...overrides,
  };
}

export const closed = (value = ''): Moment => ({ focus: combobox({ value }), popup: closedPopup });

/** Open, with no option active: list autocomplete with manual selection after typing. */
export const open = (names: readonly string[] = fruit, value = 'a'): Moment => ({
  focus: combobox({ value, states: { expanded: true } }),
  popup: popup(names),
});

/** Open, with one option named by aria-activedescendant and exposed as selected. */
export const active = (name: string, names: readonly string[] = fruit): Moment => ({
  focus: combobox({
    value: 'a',
    states: { expanded: true },
    activeDescendant: { role: 'option', name, states: { selected: true } },
  }),
  popup: popup(names, name),
});

/** A system that moves DOM focus onto the option itself. */
export const focusedOption = (name: string, names: readonly string[] = fruit): Moment => ({
  focus: {
    role: 'option',
    name,
    states: { selected: true },
    isBody: false,
    isInsideComponent: false,
    item: { index: names.indexOf(name) + 1, count: names.length },
  },
  popup: popup(names, name),
});

export const elsewhere = (name = 'Note'): Moment => ({
  focus: { role: 'textbox', name, states: {}, isBody: false, isInsideComponent: false, value: '' },
  popup: closedPopup,
});

type Action = Step['action'];
export const press = (key: string): Action => ({ type: 'press', key });
export const type = (text: string): Action => ({ type: 'type', text });

interface StepParts {
  action: Action;
  before: Moment;
  after: Moment;
  heard?: readonly string[] | undefined;
}

export function step({ action, before, after, heard = [] }: StepParts): Step {
  return {
    action,
    focusBefore: before.focus,
    focusAfter: after.focus,
    announcements: heard.map((text) => ({
      text,
      politeness: 'polite',
      at: 1,
      insertedLate: false,
    })),
    axDiff: { added: [], removed: [], changed: [] },
    settle: { ms: 400, quiet: true },
    popup: { before: before.popup, after: after.popup },
    speech: [],
  };
}

export const scenario = (scenarioId: string, steps: readonly Step[]): EvaluatorInput => ({
  scenarioId,
  steps,
});

/** Steps that walk through moments in order: each step ends where the next one starts. */
export function walk(
  scenarioId: string,
  start: Moment,
  moves: readonly (readonly [Action, Moment, (readonly string[])?])[],
): EvaluatorInput {
  const steps: Step[] = [];
  let before = start;
  for (const [action, after, heard] of moves) {
    steps.push(step({ action, before, after, heard }));
    before = after;
  }
  return scenario(scenarioId, steps);
}
