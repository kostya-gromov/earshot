import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { isInside, isVerdict, keyOf, notJudged, opening, type ObservedStep } from './facts.ts';

const scenarios = new Set(['tab-forward', 'tab-backward']);

const isTab = (observed: ObservedStep) => ['Tab', 'Shift+Tab'].includes(keyOf(observed.step));

/** "Tab" or "Shift+Tab": the key a run presses. */
export const runKey = (run: readonly ObservedStep[]): string =>
  run[0] ? keyOf(run[0].step) : 'Tab';

/**
 * The presses of Tab or Shift+Tab made while the dialog was open, starting from the first one
 * pressed with focus inside the dialog. The rules read where focus rested after each: no list
 * of "tabbable elements" is consulted, so a focus guard beside the dialog is never counted
 * (docs/proposals/dialog.md, the MUI check).
 */
export function tabRun(input: EvaluatorInput): readonly ObservedStep[] | VerdictResult {
  const start = opening(input, scenarios);
  if (isVerdict(start)) return start;
  const presses = start.steps.filter(isTab);
  const first = presses.findIndex((observed) => isInside(observed.before));
  if (first === -1) {
    return notJudged(
      'Focus was never inside the dialog',
      'No Tab was pressed with focus inside the dialog; that is the question of “Opening moves focus into the dialog”.',
    );
  }
  return presses.slice(first);
}
