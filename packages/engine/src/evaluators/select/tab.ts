import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  describeFocus,
  incomplete,
  isOnSelect,
  isShown,
  notJudged,
  observedSteps,
  selectNode,
  unsupported,
  type ObservedStep,
} from './facts.ts';

const follows = (reason: string): VerdictResult => ({
  verdict: 'follows',
  summary: 'One Tab stop',
  reason,
});

/** tab-in: Tab from the field before puts focus on the select. */
function judgeTabIn([step]: readonly ObservedStep[]): VerdictResult {
  if (!step) return incomplete;
  if (isOnSelect(step.after.focus, selectNode(step.after))) {
    return follows('Tab from the field before put focus on the select.');
  }
  return {
    verdict: 'differs',
    summary: 'Tab does not reach the select',
    reason: `Tab from the field before put focus on ${describeFocus(step.after.focus)}.`,
  };
}

/** tab-open: with the list open, Tab does not put focus on the list or an option. */
function judgeTabOpen(steps: readonly ObservedStep[]): VerdictResult {
  const tab = steps.at(-1);
  if (!tab) return incomplete;
  if (!isShown(tab.before.popup)) {
    return notJudged('The list was not open', 'The list was not shown when Tab was pressed.');
  }
  const select = selectNode(tab.before) ?? steps[0]?.before.popup.opener;
  if (!isOnSelect(tab.before.focus, select)) {
    return notJudged(
      'Focus had already left the select',
      `Before Tab, DOM focus was on ${describeFocus(tab.before.focus)}; that is charged to "Focus stays on the select".`,
    );
  }
  const { focus } = tab.after;
  if (focus.item || focus.isInsidePopup) {
    return {
      verdict: 'differs',
      summary: 'Tab stops in the list',
      reason: `With the list open, Tab put focus on ${describeFocus(focus)}.`,
    };
  }
  return follows(`With the list open, Tab put focus on ${describeFocus(focus)}, not in the list.`);
}

export function evaluateTab(input: EvaluatorInput): VerdictResult {
  const steps = observedSteps(input, 1);
  if (input.scenarioId === 'tab-in') return steps ? judgeTabIn(steps) : incomplete;
  if (input.scenarioId === 'tab-open') return steps ? judgeTabOpen(steps) : incomplete;
  return unsupported(input.scenarioId);
}
