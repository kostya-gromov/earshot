import type { AccessibleNode, FocusInfo, PopupState, Step } from '@earshot/contracts';
import type { EvaluatorInput } from '../../../src/model/evaluator.ts';

export const fruit = ['Apple', 'Apricot', 'Banana', 'Cherry', 'Date'];

/** A moment as the engine records it: focus, and the list with the select as its opener. */
export interface Moment {
  focus: FocusInfo;
  popup: PopupState;
}

interface SelectParts {
  value?: string;
  expanded?: boolean;
  name?: string;
  role?: string;
}

export function selectNode({
  value = 'Banana',
  expanded = false,
  name = 'Fruit',
  role = 'combobox',
}: SelectParts = {}): AccessibleNode {
  return {
    role,
    name,
    ...(value === '' ? {} : { treeValue: value }),
    states: { expanded },
  };
}

const onElement = (node: AccessibleNode, extra: Partial<FocusInfo> = {}): FocusInfo => ({
  ...node,
  isBody: false,
  isInsideComponent: true,
  ...extra,
});

export function options(selected: readonly string[] = []): PopupState['options'] {
  return fruit.map((name) => ({
    role: 'option',
    name,
    states: { selected: selected.includes(name) },
  }));
}

export const closed = (parts: SelectParts = {}): Moment => {
  const select = selectNode(parts);
  return { focus: onElement(select), popup: { present: false, options: [], opener: select } };
};

/** Open, the option named by aria-activedescendant; `selected` defaults to that option alone. */
export function active(
  name: string,
  { value = 'Banana', selected = [name] }: { value?: string; selected?: readonly string[] } = {},
): Moment {
  const select = selectNode({ value, expanded: true });
  return {
    focus: onElement(select, {
      activeDescendant: { role: 'option', name, states: { selected: selected.includes(name) } },
    }),
    popup: { present: true, options: options(selected), opener: select },
  };
}

/** Open, DOM focus on the option itself. */
export function focusedOption(name: string): Moment {
  const select = selectNode({ expanded: true });
  return {
    focus: {
      role: 'option',
      name,
      states: { selected: true },
      isBody: false,
      isInsideComponent: false,
      isInsidePopup: true,
      item: { index: fruit.indexOf(name) + 1, count: fruit.length },
    },
    popup: { present: true, options: options([name]), opener: select },
  };
}

/** Open, DOM focus on the listbox itself, which names the active option (Chakra UI, 2026-11-24). */
export function focusedList(name: string): Moment {
  const select = selectNode({ expanded: true });
  return {
    focus: {
      role: 'listbox',
      name: 'Fruit',
      states: {},
      isBody: false,
      isInsideComponent: false,
      isInsidePopup: true,
      activeDescendant: { role: 'option', name, states: { selected: true } },
    },
    popup: { present: true, options: options([name]), opener: select },
  };
}

export const elsewhere = (name = 'Notes', parts: SelectParts = {}): Moment => ({
  focus: { role: 'textbox', name, states: {}, isBody: false, isInsideComponent: false },
  popup: { present: false, options: [], opener: selectNode(parts) },
});

type Action = Step['action'];
export const press = (key: string): Action => ({ type: 'press', key });

function step({
  action,
  before,
  after,
  label,
}: {
  action: Action;
  before: Moment;
  after: Moment;
  label: string;
}): Step {
  return {
    action,
    focusBefore: before.focus,
    focusAfter: after.focus,
    announcements: [],
    axDiff: { added: [], removed: [], changed: [] },
    settle: { ms: 400, quiet: true },
    popup: { before: before.popup, after: after.popup },
    label: { before: label, after: label },
    speech: [],
  };
}

/** Steps that walk through moments in order: each step ends where the next one starts. */
export function walk(
  scenarioId: string,
  start: Moment,
  moves: readonly (readonly [string, Moment])[],
): EvaluatorInput {
  return walkWithLabel({ scenarioId, start, moves, label: 'Fruit' });
}

/** As walk, with the visible label the page shows. */
export function walkWithLabel({
  scenarioId,
  start,
  moves,
  label,
}: {
  scenarioId: string;
  start: Moment;
  moves: readonly (readonly [string, Moment])[];
  label: string;
}): EvaluatorInput {
  const steps: Step[] = [];
  let before = start;
  for (const [key, after] of moves) {
    steps.push(step({ action: press(key), before, after, label }));
    before = after;
  }
  return { scenarioId, steps };
}
