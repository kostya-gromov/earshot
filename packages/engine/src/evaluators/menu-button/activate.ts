import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  activeItem,
  differs,
  enterOnItem,
  incomplete,
  isShown,
  notJudged,
  observedSteps,
  ranAnAction,
  unsupported,
} from './facts.ts';

/**
 * APG: Enter on an item activates it and closes the menu. That it was activated is read from
 * the page (the item's own handler writes its name there), not taken from the menu closing.
 */
export function evaluateActivate(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'activate') return unsupported(input.scenarioId);
  const steps = observedSteps(input, 2);
  if (!steps) return incomplete;
  const enter = enterOnItem(steps);
  const item = enter && activeItem(enter.before);
  if (!enter || !item || item.isDisabled) {
    return notJudged(
      'No item to activate',
      'No item that can be activated was active before Enter, so nothing was judged.',
    );
  }
  if (!ranAnAction(enter)) {
    return differs(
      'Enter does not run the action',
      `Enter on "${item.name}" left the page at "${enter.before.effect}": its action did not run.`,
    );
  }
  if (!enter.after.effect.includes(item.name)) {
    return differs(
      'Another action ran',
      `Enter on "${item.name}" changed the page to "${enter.after.effect}".`,
    );
  }
  if (isShown(enter.after.popup)) {
    return differs(
      'Menu stays open after the action',
      `Enter on "${item.name}" ran its action and left the menu shown with ${enter.after.popup.options.length} items.`,
    );
  }
  return {
    verdict: 'follows',
    summary: 'Enter runs the action and closes',
    reason: `Enter on "${item.name}" ran its action (the page says "${enter.after.effect}") and the menu closed.`,
  };
}
