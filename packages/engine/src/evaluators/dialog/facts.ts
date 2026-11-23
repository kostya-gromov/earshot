import type { DialogState, FocusInfo, Step, VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';

/** Focus and the dialog before or after a step. */
export interface Moment {
  focus: FocusInfo;
  dialog: DialogState;
}

export interface ObservedStep {
  step: Step;
  before: Moment;
  after: Moment;
}

/** The scenario's steps with everything a dialog rule reads, or undefined when any part is missing. */
export function observedSteps(input: EvaluatorInput): readonly ObservedStep[] | undefined {
  if (input.steps.length === 0) return undefined;
  const observed: ObservedStep[] = [];
  for (const step of input.steps) {
    if (!step.dialog || !step.settle.quiet) return undefined;
    observed.push({
      step,
      before: { focus: step.focusBefore, dialog: step.dialog.before },
      after: { focus: step.focusAfter, dialog: step.dialog.after },
    });
  }
  return observed;
}

/** A scenario this evaluator was not written for: a registration bug made visible, not a finding. */
export const unsupported = (scenarioId: string): VerdictResult => ({
  verdict: 'inconclusive',
  summary: 'Scenario not supported',
  reason: `Unsupported scenario "${scenarioId}".`,
});

export const incomplete: VerdictResult = {
  verdict: 'inconclusive',
  summary: 'Observations incomplete',
  reason: 'A step did not settle, or the dialog was not recorded.',
};

export const notJudged = (summary: string, reason: string): VerdictResult => ({
  verdict: 'inconclusive',
  summary,
  reason,
});

export const differs = (summary: string, reason: string): VerdictResult => ({
  verdict: 'differs',
  summary,
  reason,
});

export const follows = (summary: string, reason: string): VerdictResult => ({
  verdict: 'follows',
  summary,
  reason,
});

/** Open means a dialog is in the accessibility tree. */
export const isOpen = ({ dialog }: Moment): boolean => dialog.dialog !== undefined;

export const isInside = ({ focus }: Moment): boolean => focus.isInsideDialog === true;

/** Focus is on the element with the dialog role itself, not on something in it. */
export const isOnContainer = (moment: Moment): boolean =>
  isInside(moment) && (moment.focus.role === 'dialog' || moment.focus.role === 'alertdialog');

export function describeFocus({ isBody, leftPage, role, name }: FocusInfo): string {
  if (leftPage) return 'the browser’s own controls, outside the page';
  if (isBody) return 'the document';
  return `${role ?? 'an element without a role'} "${name}"`;
}

export const keyOf = ({ action }: Step): string =>
  action.type === 'press' ? action.key : action.type;

export const didNotOpen = notJudged(
  'The dialog did not open',
  'No dialog was in the accessibility tree after Enter on the button.',
);

/**
 * The scenario's first step, Enter on the button, once it has opened the dialog; otherwise the
 * verdict that says why nothing can be judged.
 */
export function opening(
  input: EvaluatorInput,
  scenarios: ReadonlySet<string>,
): { steps: readonly ObservedStep[]; opened: ObservedStep } | VerdictResult {
  if (!scenarios.has(input.scenarioId)) return unsupported(input.scenarioId);
  const steps = observedSteps(input);
  const opened = steps?.[0];
  if (!steps || !opened) return incomplete;
  if (!isOpen(opened.after)) return didNotOpen;
  return { steps, opened };
}

export const isVerdict = (value: object): value is VerdictResult => 'verdict' in value;
