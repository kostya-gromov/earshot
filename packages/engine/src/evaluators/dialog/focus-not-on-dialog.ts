import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  describeFocus,
  differs,
  follows,
  isInside,
  isOnContainer,
  isVerdict,
  notJudged,
  opening,
} from './facts.ts';

const scenarios = new Set(['open']);

/** APG's example page: "Please DO NOT make the element with role dialog focusable!" */
export function evaluateFocusNotOnDialog(input: EvaluatorInput): VerdictResult {
  const start = opening(input, scenarios);
  if (isVerdict(start)) return start;
  const { after } = start.opened;
  if (!isInside(after)) {
    return notJudged(
      'Focus did not move into the dialog',
      'Focus was not inside the dialog after it opened; that is the question of “Opening moves focus into the dialog”.',
    );
  }
  if (isOnContainer(after)) {
    return differs(
      'Focus is on the dialog itself',
      `After opening, focus was on the dialog container, ${describeFocus(after.focus)}.`,
    );
  }
  return follows(
    'Focus is on an element in the dialog',
    `After opening, focus was on ${describeFocus(after.focus)}, not on the dialog container.`,
  );
}
