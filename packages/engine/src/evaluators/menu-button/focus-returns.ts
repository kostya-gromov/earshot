import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  describeFocus,
  differs,
  enterOnItem,
  incomplete,
  isButton,
  isShown,
  notJudged,
  observedSteps,
  ranAnAction,
  unsupported,
} from './facts.ts';

/**
 * Atlas recommendation: after an action, focus is on the button. Judged only where the item was
 * activated and the menu closed, so a menu that does neither is charged once, to "activate".
 */
export function evaluateFocusReturns(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'activate') return unsupported(input.scenarioId);
  const steps = observedSteps(input, 2);
  if (!steps) return incomplete;
  const enter = enterOnItem(steps);
  if (!enter || !ranAnAction(enter) || isShown(enter.after.popup)) {
    return notJudged(
      'No completed action to judge',
      'Judged only where Enter ran an item’s action and the menu closed; “Enter activates the item and closes the menu” covers the rest.',
    );
  }
  if (isButton(enter.after.focus, input)) {
    return {
      verdict: 'follows',
      summary: 'Focus returns to the button',
      reason: 'After the action ran and the menu closed, focus was on the button.',
    };
  }
  const where = describeFocus(enter.after.focus);
  return differs(
    enter.after.focus.isBody ? 'Focus falls to the document' : 'Focus is not on the button',
    `After the action ran and the menu closed, focus was on ${where}.`,
  );
}
