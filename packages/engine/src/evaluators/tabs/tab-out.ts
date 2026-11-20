import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
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

const scenarios = new Set(['tab-out-text', 'tab-out-link']);

/** The Tab pressed from a tab, or undefined when focus was not on one: the start was not reached. */
export function tabFromTab(input: EvaluatorInput): ObservedStep | VerdictResult {
  if (!scenarios.has(input.scenarioId)) return unsupported(input.scenarioId);
  const step = observedSteps(input)?.[0];
  if (!step) return incomplete;
  if (focusedTab(step.before) === undefined) {
    return notJudged('Focus was not on a tab', 'Focus was not on a tab before Tab.');
  }
  return step;
}

export const isStep = (value: ObservedStep | VerdictResult): value is ObservedStep =>
  'step' in value;

/** APG: when the tab list contains focus, Tab moves focus out of it. The tabs are one stop. */
export function evaluateTabOut(input: EvaluatorInput): VerdictResult {
  const tab = tabFromTab(input);
  if (!isStep(tab)) return tab;
  const from = focusedTab(tab.before)!;
  const to = focusedTab(tab.after);
  if (to === from) return differs('Tab stays on the tab', `Tab left focus on "${from}".`);
  if (to !== undefined) {
    return differs('Tab moves to another tab', `Tab moved focus from "${from}" to "${to}".`);
  }
  if (tab.after.focus.isBody) {
    return differs('Focus falls to the document', `Tab from "${from}" left focus on the document.`);
  }
  return follows(
    'Tab leaves the tab list',
    `Tab moved focus from "${from}" out of the tab list, to ${describeFocus(tab.after.focus)}.`,
  );
}
