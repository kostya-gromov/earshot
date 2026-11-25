import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  activeOption,
  describeFocus,
  hasValue,
  incomplete,
  isOnSelect,
  isPress,
  isShown,
  noOpener,
  noValue,
  notJudged,
  observedSteps,
  selectNode,
  unsupported,
  type ObservedStep,
} from './facts.ts';

/** The first way the step after Enter falls short, or undefined when it follows. */
function shortfall({ after }: ObservedStep, chosen: string): string | undefined {
  const select = selectNode(after);
  if (isShown(after.popup)) return 'the list stayed open';
  if (select?.treeValue !== chosen) {
    return `the select's value was "${select?.treeValue ?? ''}", not "${chosen}"`;
  }
  if (!isOnSelect(after.focus, select)) return `focus was on ${describeFocus(after.focus)}`;
  return undefined;
}

/**
 * The value cannot be compared: no select recorded before the list opened or after Enter, or one
 * with no value (name-and-value's). Not the step before Enter: some selects leave the tree while
 * their list is open (MUI, 2026-11-24).
 */
function unreadableValue(first: ObservedStep, enter: ObservedStep): VerdictResult | undefined {
  const [was, is] = [selectNode(first.before), selectNode(enter.after)];
  if (!was || !is) return noOpener;
  return hasValue(was) && hasValue(is) ? undefined : noValue;
}

/** APG: Enter accepts the active option: the list closes and the value becomes that option. */
export function evaluateEnter(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'enter') return unsupported(input.scenarioId);
  const steps = observedSteps(input, 1);
  const [first, enter] = [steps?.[0], steps?.at(-1)];
  if (!first || !enter || !isPress(enter.step, 'Enter')) return incomplete;
  const active = activeOption(enter.before);
  if (!active) {
    return notJudged('No option was active', 'No option was active when Enter was pressed.');
  }
  const unreadable = unreadableValue(first, enter);
  if (unreadable) return unreadable;
  const problem = shortfall(enter, active.name);
  if (problem) {
    return {
      verdict: 'differs',
      summary: 'Enter does not choose the active option',
      reason: `Enter on the active option "${active.name}": ${problem}.`,
    };
  }
  return {
    verdict: 'follows',
    summary: 'Enter chooses the active option',
    reason: `Enter closed the list, the value became "${active.name}", and focus was on the select.`,
  };
}
