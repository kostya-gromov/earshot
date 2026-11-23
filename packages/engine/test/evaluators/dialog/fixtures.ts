import type { Action, DialogState, FocusInfo, Step } from '@earshot/contracts';
import type { EvaluatorInput } from '../../../src/model/evaluator.ts';

/** A moment as the engine records it: focus and the dialog. */
export interface Moment {
  focus: FocusInfo;
  dialog: DialogState;
}

/** The same element keeps its number, as the engine gives it: derived from the key, no state. */
const element = (key: string): number =>
  [...key].reduce((number, char) => (number * 31 + char.charCodeAt(0)) % 65_521, 7) + 1;

const opener = { role: 'button', name: 'Edit profile', states: {} };

/** The dialog closed: nothing with the dialog role in the tree, the button exposed. */
export const closedDialog: DialogState = { opener };

/** The dialog open as the reference renders it; override what a case is about. */
export const openDialog = (
  parts: { role?: string; name?: string; modal?: boolean; heading?: string | null } = {},
): DialogState => ({
  dialog: {
    role: parts.role ?? 'dialog',
    name: parts.name ?? 'Edit profile',
    states: parts.modal === false ? {} : { modal: true },
  },
  ...(parts.heading === null ? {} : { heading: parts.heading ?? 'Edit profile' }),
});

const focusOn = (role: string, name: string, isInsideDialog: boolean): FocusInfo => ({
  role,
  name,
  states: {},
  isBody: false,
  isInsideComponent: true,
  isInsideDialog,
  element: element(`${role}:${name}`),
});

const lost: FocusInfo = {
  role: null,
  name: '',
  states: {},
  isBody: true,
  isInsideComponent: false,
  isInsideDialog: false,
};

/** Focus on an element inside the open dialog. */
export const inside = (role: string, name: string, dialog = openDialog()): Moment => ({
  focus: focusOn(role, name, true),
  dialog,
});

/** Focus on the element with the dialog role itself. */
export const onContainer = (dialog = openDialog()): Moment => ({
  focus: focusOn('dialog', dialog.dialog!.name, true),
  dialog,
});

/** Focus on an element of the page, with the dialog open or closed. */
export const outside = (role: string, name: string, dialog: DialogState): Moment => ({
  focus: focusOn(role, name, false),
  dialog,
});

export const onButton = (dialog: DialogState = closedDialog): Moment =>
  outside('button', 'Edit profile', dialog);

/** Focus fell to the document. */
export const onDocument = (dialog: DialogState): Moment => ({ focus: lost, dialog });

/** Focus is in the browser's own controls: the page has none. */
export const leftPage = (dialog = openDialog()): Moment => ({
  focus: { ...lost, leftPage: true },
  dialog,
});

export const name = inside('textbox', 'Name');
export const cancel = inside('button', 'Cancel');
export const save = inside('button', 'Save');

type Act = string | Action;

const actionOf = (act: Act): Action =>
  typeof act === 'string' ? { type: 'press', key: act } : act;

export const clickOn = (role: string, target: string, atPoint = false): Action => ({
  type: 'click',
  target: { role, name: target },
  ...(atPoint ? { at: 'point' as const } : {}),
});

/** A scenario from the button, closed, and the actions with the moment each led to. */
export function walk(
  scenarioId: string,
  actions: readonly (readonly [Act, Moment])[],
  options: { quiet?: boolean } = {},
): EvaluatorInput {
  let before = onButton();
  const steps: Step[] = actions.map(([act, after]) => {
    const step: Step = {
      action: actionOf(act),
      focusBefore: before.focus,
      focusAfter: after.focus,
      announcements: [],
      axDiff: { added: [], removed: [], changed: [] },
      settle: { ms: 410, quiet: options.quiet ?? true },
      dialog: { before: before.dialog, after: after.dialog },
      speech: ['line'],
    };
    before = after;
    return step;
  });
  return { scenarioId, steps };
}
