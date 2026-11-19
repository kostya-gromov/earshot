import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  describeFocus,
  differs,
  firstInMenu,
  incomplete,
  isButton,
  isShown,
  notJudged,
  observedSteps,
  unsupported,
} from './facts.ts';

/** APG: Escape closes the menu that contains focus and returns focus to the menu button. */
export function evaluateEscape(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'escape') return unsupported(input.scenarioId);
  const steps = observedSteps(input, 2);
  if (!steps) return incomplete;
  const escape = firstInMenu(steps, 'Escape');
  if (!escape) {
    return notJudged(
      'Menu not shown',
      'The menu was not shown before Escape, so nothing was judged.',
    );
  }
  if (isShown(escape.after.popup)) {
    return differs(
      'Menu stays open after Escape',
      `Escape left the menu shown with ${escape.after.popup.options.length} items.`,
    );
  }
  if (!isButton(escape.after.focus, input)) {
    return differs(
      'Focus does not return to the button',
      `Escape closed the menu and focus was on ${describeFocus(escape.after.focus)}.`,
    );
  }
  return {
    verdict: 'follows',
    summary: 'Escape closes and returns to the button',
    reason: 'Escape closed the menu and focus was on the button that opened it.',
  };
}
