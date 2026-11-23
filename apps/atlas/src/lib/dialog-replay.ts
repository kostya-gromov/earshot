import type { DialogState, FocusInfo, Step } from '@earshot/contracts';

/**
 * A dialog recording in the terms a replay draws: whether the dialog is in the tree, by what
 * name, and where focus is. Every field is what the engine recorded (engine 0.18.0, `Step.dialog`).
 */
export type DialogFocus =
  /** On the button that opens the dialog. */
  | { kind: 'opener' }
  /** On the dialog container itself. */
  | { kind: 'dialog' }
  /** On a control inside the dialog, by its place among the dialog's fields and buttons. */
  | { kind: 'inside'; index: number | undefined; role: string | null; name: string }
  /** On an element of the page that is not the opener and not in the dialog. */
  | { kind: 'outside'; role: string | null; name: string }
  /** The document no longer has focus. */
  | { kind: 'away' }
  /** Focus fell to the document. */
  | { kind: 'body' };

export interface DialogMoment {
  isOpen: boolean;
  /** The dialog's accessible name; empty when it has none or is closed. */
  name: string;
  /**
   * What the accessibility tree reports about the open dialog being modal: true, false, or
   * undefined where the tree states nothing (and when the dialog is closed). A fact about the
   * tree, not about how the dialog behaves.
   */
  isModal: boolean | undefined;
  focus: DialogFocus;
}

export interface DialogStep {
  key: string;
  /**
   * How many fields and buttons the dialog holds, as the engine counted them when focus was on
   * one in this recording; undefined when focus was never on any.
   */
  controlCount: number | undefined;
  /** Set for a click at a point: the element at whose place the click was made. */
  clickedAt?: string;
  /** Set for a click on an element itself: its recorded name. */
  clicked?: string;
  /** Set for a step that types: the text typed. */
  typed?: string;
  /** The opener's name as recorded where the recording starts, with focus on it. */
  openerName: string;
  before: DialogMoment;
  after: DialogMoment;
}

/** A control inside the dialog that a recording has focus on, by its place among the controls. */
export interface DialogControl {
  index: number;
  role: string | null;
  name: string;
}

function dialogFocus(focus: FocusInfo): DialogFocus {
  // The document no longer has focus: carried out of the page, which is not a loss.
  if (focus.leftPage) return { kind: 'away' };
  if (focus.isBody) return { kind: 'body' };
  if (focus.isInsideDialog && focus.role === 'dialog') return { kind: 'dialog' };
  if (focus.isInsideDialog) {
    return { kind: 'inside', index: focus.item?.index, role: focus.role, name: focus.name };
  }
  // The adapter's root holds the opener and nothing else of the page.
  if (focus.isInsideComponent) return { kind: 'opener' };
  return { kind: 'outside', role: focus.role, name: focus.name };
}

const moment = (focus: FocusInfo, state: DialogState): DialogMoment => ({
  isOpen: state.dialog !== undefined,
  name: state.dialog?.name ?? '',
  isModal: state.dialog?.states.modal,
  focus: dialogFocus(focus),
});

function keyOf({ action }: Step): string {
  switch (action.type) {
    case 'press':
      return action.key;
    case 'type':
      return `“${action.text}”`;
    case 'click':
      return 'Click';
  }
}

/** What the action itself was, beyond its key: where a click went, or what was typed. */
function actionFacts({ action }: Step): Pick<DialogStep, 'clickedAt' | 'clicked' | 'typed'> {
  if (action.type === 'type') return { typed: action.text };
  if (action.type !== 'click') return {};
  return action.at === 'point'
    ? { clickedAt: action.target.name }
    : { clicked: action.target.name };
}

/** One run's steps as a dialog replay; empty unless every step recorded the dialog. */
export function dialogSteps(steps: readonly Step[]): DialogStep[] {
  if (!steps.every(({ dialog }) => dialog)) return [];
  const controlCount = dialogControlCount(steps);
  // Every scenario starts with focus on the button that opens the dialog (the adapter's setup).
  const openerName = steps[0]?.focusBefore.name ?? '';
  return steps.flatMap((step) => {
    if (!step.dialog) return [];
    return [
      {
        key: keyOf(step),
        controlCount,
        openerName,
        ...actionFacts(step),
        before: moment(step.focusBefore, step.dialog.before),
        after: moment(step.focusAfter, step.dialog.after),
      },
    ];
  });
}

/** A recording's moments in order: before the first key, then after each step. */
const momentsOf = (steps: readonly DialogStep[]): DialogMoment[] =>
  steps[0] ? [steps[0].before, ...steps.map(({ after }) => after)] : [];

/**
 * How many fields and buttons the dialog holds, as the engine counted them when focus was on
 * one; undefined when focus was never on any.
 */
export function dialogControlCount(steps: readonly Step[]): number | undefined {
  const counted = steps.flatMap(({ focusBefore, focusAfter }) =>
    [focusBefore, focusAfter].flatMap((focus) =>
      focus.isInsideDialog && focus.item ? [focus.item.count] : [],
    ),
  );
  return counted.length > 0 ? Math.max(...counted) : undefined;
}

/**
 * The controls inside the dialog that the recording names: those focus was on, by their place.
 * The others are known to exist, by the count, and not by name: the drawing leaves them blank.
 */
export function dialogControls(steps: readonly DialogStep[]): DialogControl[] {
  const known = new Map<number, DialogControl>();
  for (const { focus } of momentsOf(steps)) {
    if (focus.kind !== 'inside' || focus.index === undefined) continue;
    known.set(focus.index, { index: focus.index, role: focus.role, name: focus.name });
  }
  return [...known.values()].sort((a, b) => a.index - b.index);
}

/** The way focus left the page, from the key that took it out; undefined when it never did. */
export function dialogAwaySide(steps: readonly DialogStep[]): 'before' | 'after' | undefined {
  const left = steps.find(({ after }) => after.focus.kind === 'away');
  if (!left) return undefined;
  return left.key.startsWith('Shift+') ? 'before' : 'after';
}

function focusWords(focus: DialogFocus): string {
  switch (focus.kind) {
    case 'opener':
      return 'Focus on the button that opens the dialog.';
    case 'dialog':
      return 'Focus on the dialog itself.';
    case 'inside':
      return `Focus in the dialog: ${focus.role ?? 'an element'} “${focus.name}”.`;
    case 'outside':
      return `Focus on the page behind: ${focus.role ?? 'an element'} “${focus.name}”.`;
    case 'away':
      return 'Focus left the page.';
    case 'body':
      return 'Focus lost to the page.';
  }
}

/** What the tree reports about the dialog being modal, in words; nothing where it states nothing. */
function modalWords(isModal: boolean | undefined): string[] {
  if (isModal === undefined) return [];
  return [isModal ? 'The tree reports it as modal.' : 'The tree does not report it as modal.'];
}

function openChange(before: DialogMoment, after: DialogMoment): string[] {
  if (before.isOpen === after.isOpen) return [];
  if (!after.isOpen) return ['The dialog closes.'];
  const opens = after.name ? `The dialog “${after.name}” opens.` : 'A dialog with no name opens.';
  return [opens, ...modalWords(after.isModal)];
}

/** What was done, where the key alone does not say it: a click's place or target, typed text. */
function actionWords({ clickedAt, clicked, typed }: DialogStep): string[] {
  if (clickedAt !== undefined) return [`A click where “${clickedAt}” is, behind the dialog.`];
  if (clicked !== undefined) return [`A click on “${clicked}”.`];
  return typed === undefined ? [] : [`“${typed}” typed.`];
}

/**
 * What a step did and changed, in words, beside the schematic. A step that changed neither focus
 * nor the dialog says so only when nothing else is known of it: a click on the page behind an
 * open dialog that leaves everything as it was is what was asked for.
 */
export function describeDialogChange(step: DialogStep): string {
  const { before, after } = step;
  const moved = JSON.stringify(before.focus) !== JSON.stringify(after.focus);
  const changes = [...openChange(before, after), ...(moved ? [focusWords(after.focus)] : [])];
  const done = actionWords(step);
  // Typed text is itself the change; a click that changed nothing is said to have changed nothing.
  const still = step.typed === undefined ? ['Nothing changes.'] : [];
  return [...done, ...(changes.length > 0 ? changes : still)].join(' ');
}

/**
 * The control of the page behind that a recording touches: the one clicked at, or one focus
 * lands on. Undefined where the recording never leaves the button and the dialog.
 */
export function dialogBehind(steps: readonly DialogStep[]): string | undefined {
  const clicked = steps.find(({ clickedAt }) => clickedAt !== undefined)?.clickedAt;
  if (clicked !== undefined) return clicked;
  const reached = momentsOf(steps).flatMap(({ focus }) =>
    focus.kind === 'outside' ? [focus.name || focus.role || ''] : [],
  );
  return reached[0];
}
