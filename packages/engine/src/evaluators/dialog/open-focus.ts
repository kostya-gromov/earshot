import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { isSameElement } from '../../model/same-element.ts';
import { describeFocus, differs, follows, isInside, isVerdict, opening } from './facts.ts';

const scenarios = new Set(['open']);

/** APG: "When a dialog opens, focus moves to an element inside the dialog." */
export function evaluateOpenFocus(input: EvaluatorInput): VerdictResult {
  const start = opening(input, scenarios);
  if (isVerdict(start)) return start;
  const { before, after } = start.opened;
  if (isInside(after)) {
    return follows(
      'Opening moves focus into the dialog',
      `Enter opened the dialog and focus moved to ${describeFocus(after.focus)}, inside it.`,
    );
  }
  if (isSameElement(before.focus, after.focus)) {
    return differs(
      'Focus stays on the button',
      `Enter opened the dialog and focus stayed on ${describeFocus(after.focus)}.`,
    );
  }
  return differs(
    'Focus lands outside the dialog',
    `Enter opened the dialog and focus was on ${describeFocus(after.focus)}, outside it.`,
  );
}
