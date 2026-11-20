import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  activeTab,
  describeFocus,
  differs,
  focusedTab,
  follows,
  incomplete,
  notJudged,
  observedSteps,
  unsupported,
  type ObservedStep,
} from './facts.ts';

const keyOf: Record<string, string> = { 'tab-in': 'Tab', 'tab-in-back': 'Shift+Tab' };

/** The step that brought focus into the tab list: the first after which focus is on a tab. */
const entering = (steps: readonly ObservedStep[]) =>
  steps.find(({ before, after }) => !focusedTab(before) && focusedTab(after) !== undefined);

/**
 * APG: "When focus moves into the tab list, places focus on the active tab element." The active
 * tab is the one before the key: landing on another tab and activating it is still the defect.
 */
export function evaluateTabIn(input: EvaluatorInput): VerdictResult {
  const key = keyOf[input.scenarioId];
  if (!key) return unsupported(input.scenarioId);
  const steps = observedSteps(input);
  if (!steps) return incomplete;
  const step = entering(steps);
  if (!step) {
    const landed = steps.map(({ after }) => describeFocus(after.focus)).join(', then ');
    if (key === 'Tab') return differs('Tab skips the tab list', `Tab moved focus to ${landed}.`);
    return notJudged(
      'Focus did not reach the tab list',
      `${steps.length} presses of ${key} moved focus to ${landed}, never to a tab.`,
    );
  }
  const expected = activeTab(step.before.tabSet);
  if (expected === undefined) {
    return notJudged('No single active tab', `No single tab was selected before ${key}.`);
  }
  const landed = focusedTab(step.after)!;
  if (landed !== expected) {
    return differs(
      `${key} lands on a tab that was not active`,
      `${key} put focus on "${landed}" while "${expected}" was the active tab.`,
    );
  }
  return follows(
    `${key} lands on the active tab`,
    `${key} put focus on "${expected}", the active tab.`,
  );
}
