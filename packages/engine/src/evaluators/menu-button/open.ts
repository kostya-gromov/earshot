import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  activeItem,
  describeFocus,
  describeItem,
  differs,
  incomplete,
  isShown,
  observedSteps,
  unsupported,
} from './facts.ts';

const scenarios: readonly string[] = ['open-enter', 'open-space'];

/** APG: Enter, and Space, open the menu and place focus on the first menu item. */
export function evaluateOpen(input: EvaluatorInput): VerdictResult {
  if (!scenarios.includes(input.scenarioId)) return unsupported(input.scenarioId);
  const first = observedSteps(input, 1)?.[0];
  if (!first || first.step.action.type !== 'press') return incomplete;
  const { key } = first.step.action;
  const count = first.after.popup.options.length;
  if (!isShown(first.after.popup)) {
    return differs('Menu does not open', `${key} on the button left the menu hidden.`);
  }
  const active = activeItem(first.after);
  if (!active) {
    return differs(
      'No item is active after opening',
      `${key} opened the menu with ${count} items and none was active: focus was on ${describeFocus(first.after.focus)}.`,
    );
  }
  if (active.index !== 0) {
    return differs(
      'Opens on another item',
      `${key} opened the menu on ${describeItem(active, count)}, not on the first item.`,
    );
  }
  return {
    verdict: 'follows',
    summary: 'Opens on the first item',
    reason: `${key} opened the menu and made "${active.name}", the first of ${count} items, active.`,
  };
}
