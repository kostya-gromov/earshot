import type { FocusInfo, Step } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';

export function observedSteps(input: EvaluatorInput, count: number): readonly Step[] | undefined {
  const steps = input.steps.slice(0, count);
  if (steps.length !== count || steps.some(({ settle }) => !settle.quiet)) return undefined;
  return steps;
}

export const isOutsideComponent = ({ isBody, isInsideComponent }: FocusInfo): boolean =>
  !isBody && !isInsideComponent;

const textEntryRoles: ReadonlySet<string> = new Set(['combobox', 'textbox', 'searchbox']);

const isTextEntry = ({ role }: FocusInfo) => role !== null && textEntryRoles.has(role);

export interface ChipPosition {
  position: number;
  count: number;
}

/**
 * A chip is recognised by structure, never by its name: a focused element inside the component,
 * not the text entry, that has a place among the chips. That place is the set position the
 * accessibility tree exposes, or else its place among the items the adapter locates (decided
 * 2026-11-09: no rule text asks for "n of m"; a missing set position is a separate observation).
 * Systems name their remove controls differently ("Remove …", "Clear …", the person's name), and
 * some focus the chip itself rather than a button, so neither name nor role may decide it.
 */
export function chipPosition(focus: FocusInfo): ChipPosition | undefined {
  if (!focus.isInsideComponent || focus.isBody || isTextEntry(focus)) return undefined;
  if (focus.posInSet !== undefined && focus.setSize !== undefined && focus.role !== null) {
    return { position: focus.posInSet, count: focus.setSize };
  }
  return focus.item ? { position: focus.item.index, count: focus.item.count } : undefined;
}

export const isChip = (focus: FocusInfo): boolean => chipPosition(focus) !== undefined;

/**
 * Focus moved off the text entry to another element inside the component that is not a
 * recognisable chip: it exposes no set position and is not one of the items the adapter
 * locates, so its order among the chips cannot be read.
 */
export const isUnpositionedItem = (focus: FocusInfo): boolean =>
  focus.isInsideComponent && !focus.isBody && !isTextEntry(focus) && !isChip(focus);

/** The text entry is wherever focus was when the scenario started (initial state: focus in input). */
export const initialFocus = (input: EvaluatorInput): FocusInfo | undefined =>
  input.steps[0]?.focusBefore;

/** Factual wording for reasons: `combobox "To"`, or `the document` when focus fell to body. */
export const describeFocus = ({ isBody, role, name }: FocusInfo): string =>
  isBody ? 'the document' : `${role ?? 'an element without a role'} "${name}"`;

export function describeHeard({ announcements }: Step): string {
  if (announcements.length === 0) return 'Nothing was announced.';
  return `Heard ${announcements.map(({ text }) => `"${text}"`).join(', ')}.`;
}

export const isSameControl = (a: FocusInfo, b: FocusInfo): boolean =>
  a.isInsideComponent === b.isInsideComponent && a.role === b.role && a.name === b.name;

/**
 * Nothing a keyboard or screen reader user could notice after the step: focus stayed where it
 * was, the accessibility tree did not change and nothing was announced. A mark on screen only
 * (a visual highlight) leaves a step like this.
 */
export const showsNothing = (step: Step): boolean =>
  isSameControl(step.focusAfter, step.focusBefore) &&
  step.announcements.length === 0 &&
  step.axDiff.added.length + step.axDiff.removed.length + step.axDiff.changed.length === 0;

export const removedNode = ({ axDiff }: Step): boolean => axDiff.removed.length > 0;

export const removedFocusedNode = ({ axDiff, focusBefore }: Step): boolean =>
  axDiff.removed.some(({ role, name }) => role === focusBefore.role && name === focusBefore.name);

export function removedActionTarget({ action, axDiff }: Step): boolean {
  if (action.type !== 'click') return false;
  // An unnamed target (an aria-hidden icon) cannot be matched by name; then any removal counts.
  if (action.target.role === null && action.target.name === '') return axDiff.removed.length > 0;
  return axDiff.removed.some(
    ({ role, name }) => role === action.target.role && name === action.target.name,
  );
}
