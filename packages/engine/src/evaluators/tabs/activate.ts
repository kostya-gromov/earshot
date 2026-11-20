import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  activeTab,
  differs,
  focusedTab,
  follows,
  incomplete,
  notJudged,
  observedSteps,
  unsupported,
  type ObservedStep,
} from './facts.ts';

const keyOf: Record<string, string> = { 'activate-enter': 'Enter', 'activate-space': 'Space' };

/** The arrow key made the tab it moved to the active one: selection follows focus. */
function arrowActivated({ before, after }: ObservedStep): boolean {
  const landed = focusedTab(after);
  return (
    landed !== undefined && landed !== focusedTab(before) && activeTab(after.tabSet) === landed
  );
}

/** What the key did with focus on a tab that was not the active one. */
function judgePress(press: ObservedStep, key: string): VerdictResult {
  const focused = focusedTab(press.before);
  const active = activeTab(press.before.tabSet);
  if (active === undefined) {
    return notJudged('No single active tab', `No single tab was selected before ${key}.`);
  }
  if (focused === undefined || focused === active) {
    return notJudged(
      'Focus did not reach another tab',
      `Before ${key}, focus was not on a tab other than the active "${active}".`,
    );
  }
  const selectionMoved = activeTab(press.after.tabSet) === focused;
  const panelMoved = press.after.tabSet.panels.some(({ name }) => name === focused);
  if (!selectionMoved && !panelMoved) {
    return differs(
      `${key} does not activate the tab`,
      `${key} on "${focused}" left "${active}" active and did not show the panel of "${focused}".`,
    );
  }
  return follows(
    `${key} activates the focused tab`,
    `${key} on "${focused}" ${whatMoved(selectionMoved, panelMoved)}.`,
  );
}

const whatMoved = (selectionMoved: boolean, panelMoved: boolean): string => {
  if (selectionMoved && panelMoved) return 'made it the active tab and showed its panel';
  return selectionMoved ? 'made it the active tab' : 'showed its panel';
};

/**
 * APG: Space or Enter "Activates the tab if it was not activated automatically on focus". Not
 * applicable where the arrow already activated it; judged only where focus reached a tab other
 * than the single active one. A selection and a panel that disagree are `panel`'s.
 */
export function evaluateActivate(input: EvaluatorInput): VerdictResult {
  const key = keyOf[input.scenarioId];
  if (!key) return unsupported(input.scenarioId);
  const [arrow, press] = observedSteps(input) ?? [];
  if (!arrow || !press) return incomplete;
  if (arrowActivated(arrow)) {
    return {
      verdict: 'not-applicable',
      summary: 'Arrow keys activate the tab',
      reason: `Right Arrow moved focus to "${focusedTab(arrow.after)}" and made it the active tab, so ${key} had nothing left to do.`,
    };
  }
  return judgePress(press, key);
}
