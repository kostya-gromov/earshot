import type { FocusInfo, PopupState, Step } from '@earshot/contracts';
import type { EvaluatorInput } from '../../../src/model/evaluator.ts';

export const names = ['Rename', 'Duplicate', 'Archive', 'Delete'];
/** The third item is the disabled one, as on every measured page. */
const disabledName = 'Archive';
export const none = 'Last action: none';

/** A moment as the engine records it: focus, the menu, and what the page says was last done. */
export interface Moment {
  focus: FocusInfo;
  popup: PopupState;
  effect: string;
}

const opener = (isExpanded: boolean) => ({
  role: 'button',
  name: 'Actions',
  states: { expanded: isExpanded },
});

function menu(items: readonly string[]): PopupState {
  return {
    present: true,
    opener: opener(true),
    options: items.map((name) => ({
      role: 'menuitem',
      name,
      states: name === disabledName ? { disabled: true } : {},
    })),
  };
}

const closedMenu: PopupState = { present: false, options: [], opener: opener(false) };

const button: FocusInfo = {
  role: 'button',
  name: 'Actions',
  states: { expanded: false },
  isBody: false,
  isInsideComponent: true,
  isInsidePopup: false,
};

/** Closed, focus on the button: where every scenario starts, and where Escape should end. */
export const closed = (effect = none): Moment => ({ focus: button, popup: closedMenu, effect });

/** Open with DOM focus on one item, as the reference does it. */
export const on = (name: string, items: readonly string[] = names, effect = none): Moment => ({
  focus: {
    role: 'menuitem',
    name,
    states: name === disabledName ? { disabled: true } : {},
    isBody: false,
    isInsideComponent: false,
    isInsidePopup: true,
    item: { index: items.indexOf(name) + 1, count: items.length },
  },
  popup: menu(items),
  effect,
});

/** Open with focus on the menu itself and the item named by aria-activedescendant. */
export const pointingAt = (name: string): Moment => ({
  focus: {
    role: 'menu',
    name: 'Actions',
    states: {},
    isBody: false,
    isInsideComponent: false,
    isInsidePopup: true,
    activeDescendant: { role: 'menuitem', name, states: {} },
  },
  popup: menu(names),
  effect: none,
});

/** Open, and nothing in the menu is active: focus is still on the button. */
export const openUnfocused = (): Moment => ({
  focus: { ...button, states: { expanded: true } },
  popup: menu(names),
  effect: none,
});

export const elsewhere = (name = 'Note', popup: PopupState = closedMenu): Moment => ({
  focus: {
    role: 'textbox',
    name,
    states: {},
    isBody: false,
    isInsideComponent: false,
    isInsidePopup: false,
    value: '',
  },
  popup,
  effect: none,
});

export const onDocument = (effect = none): Moment => ({
  focus: { role: null, name: '', states: {}, isBody: true, isInsideComponent: false },
  popup: closedMenu,
  effect,
});

/** The same moment with other parts: a menu left open, a button that says the wrong state. */
export const withMenu = (moment: Moment, popup: PopupState): Moment => ({ ...moment, popup });
export const openMenu = (isExpanded = true): PopupState => ({
  ...menu(names),
  opener: opener(isExpanded),
});
export const hiddenMenu = (isExpanded = false): PopupState => ({
  ...closedMenu,
  opener: opener(isExpanded),
});

type Action = Step['action'];
export const press = (key: string): Action => ({ type: 'press', key });

function step(action: Action, before: Moment, after: Moment): Step {
  return {
    action,
    focusBefore: before.focus,
    focusAfter: after.focus,
    announcements: [],
    axDiff: { added: [], removed: [], changed: [] },
    settle: { ms: 400, quiet: true },
    popup: { before: before.popup, after: after.popup },
    effect: { before: before.effect, after: after.effect },
    speech: [],
  };
}

/** Steps that walk through moments in order: each step ends where the next one starts. */
export function walk(
  scenarioId: string,
  moves: readonly (readonly [string, Moment])[],
  start: Moment = closed(),
): EvaluatorInput {
  const steps: Step[] = [];
  let before = start;
  for (const [key, after] of moves) {
    steps.push(step(press(key), before, after));
    before = after;
  }
  return { scenarioId, steps };
}
