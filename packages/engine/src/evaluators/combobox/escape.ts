import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  describeFocus,
  incomplete,
  isCombobox,
  isPress,
  isShown,
  notJudged,
  observedSteps,
  unsupported,
} from './facts.ts';

/** APG: Escape closes the popup and returns focus to the combobox. Judged on the first Escape. */
export function evaluateEscape(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'escape') return unsupported(input.scenarioId);
  const steps = observedSteps(input, 1);
  if (!steps) return incomplete;
  const escape = steps.find(({ step }) => isPress(step, 'Escape'));
  if (!escape) return incomplete;
  if (!isShown(escape.before.popup)) {
    return notJudged(
      'Popup not shown',
      'The popup was not shown before Escape, so nothing was judged.',
    );
  }
  if (isShown(escape.after.popup)) {
    return {
      verdict: 'differs',
      summary: 'Popup stays open after Escape',
      reason: `Escape left ${escape.after.popup.options.length} options in the tree.`,
    };
  }
  if (!isCombobox(escape.after.focus, input)) {
    return {
      verdict: 'differs',
      summary: 'Focus leaves the combobox',
      reason: `Escape closed the popup and focus was on ${describeFocus(escape.after.focus)}.`,
    };
  }
  const { value } = escape.after.focus;
  const text = value === '' ? 'cleared the text' : 'kept the text';
  return {
    verdict: 'follows',
    summary: 'Escape closes the popup',
    reason: `Escape closed the popup, focus stayed on the combobox, and it ${text} (recorded, not judged).`,
  };
}
