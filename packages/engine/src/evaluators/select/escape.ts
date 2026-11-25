import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  describeFocus,
  incomplete,
  isOnSelect,
  isPress,
  isShown,
  notJudged,
  observedSteps,
  selectNode,
  unsupported,
} from './facts.ts';

/** APG: Escape closes the list and focus is on the select. The value is another rule's. */
export function evaluateEscape(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'escape') return unsupported(input.scenarioId);
  const escape = observedSteps(input, 1)?.at(-1);
  if (!escape || !isPress(escape.step, 'Escape')) return incomplete;
  if (!isShown(escape.before.popup)) {
    return notJudged('The list was not open', 'The list was not shown when Escape was pressed.');
  }
  const { after } = escape;
  if (isShown(after.popup)) {
    return {
      verdict: 'differs',
      summary: 'Escape does not close the list',
      reason: `After Escape, ${after.popup.options.length} options were still in the tree.`,
    };
  }
  if (!isOnSelect(after.focus, selectNode(after))) {
    return {
      verdict: 'differs',
      summary: 'Focus leaves the select',
      reason: `Escape closed the list and focus was on ${describeFocus(after.focus)}.`,
    };
  }
  return {
    verdict: 'follows',
    summary: 'Escape closes the list',
    reason: 'Escape closed the list and focus was on the select.',
  };
}
