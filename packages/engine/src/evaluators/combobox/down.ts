import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  activeOption,
  incomplete,
  isPress,
  isShown,
  notJudged,
  observedSteps,
  pointsAwayFromOptions,
  unsupported,
  type ActiveOption,
  type ObservedStep,
} from './facts.ts';

const judgedScenarios: ReadonlySet<string> = new Set(['open-down', 'type-then-move']);

function judgeLanding(active: ActiveOption, automatic: ActiveOption | undefined): VerdictResult {
  const expected = automatic ? automatic.index + 1 : 0;
  if (active.index === expected) {
    return {
      verdict: 'follows',
      summary: automatic
        ? 'Down Arrow goes past the automatic choice'
        : 'Down Arrow goes to the first option',
      reason: automatic
        ? `"${automatic.name}" was selected automatically; Down Arrow made the next option, "${active.name}", active.`
        : `Down Arrow made the first option, "${active.name}", active.`,
    };
  }
  if (!automatic && active.index === 1) {
    return notJudged(
      'Second option, no readable mark before',
      `Down Arrow made the second option, "${active.name}", active. That follows if the first was selected automatically, but nothing the engine can read marked it before the key.`,
    );
  }
  return {
    verdict: 'differs',
    summary: 'Down Arrow goes to another option',
    reason: `Down Arrow made option ${active.index + 1}, "${active.name}", active; option ${expected + 1} was expected.`,
  };
}

function judgeDown({ before, after }: ObservedStep, scenarioId: string): VerdictResult {
  if (!isShown(after.popup)) {
    if (scenarioId === 'open-down') {
      return notJudged(
        'Does not open on Down Arrow while empty',
        'Down Arrow in the empty combobox showed no popup. APG leaves when the popup opens to each system.',
      );
    }
    return {
      verdict: 'differs',
      summary: 'Down Arrow reaches no option',
      reason:
        'After typing text that matches options, Down Arrow showed no popup and made no option active.',
    };
  }
  const active = activeOption(after);
  if (active) return judgeLanding(active, activeOption(before));
  if (pointsAwayFromOptions(after)) {
    return notJudged(
      'Points at no option',
      'After Down Arrow, aria-activedescendant did not lead to an option of the popup. "Focus stays in the combobox" covers it.',
    );
  }
  const count = after.popup.options.length;
  if (!isShown(before.popup)) {
    return {
      verdict: 'differs',
      summary: 'Down Arrow opens, no option active',
      reason: `Down Arrow showed the popup with ${count} options and made none of them active.`,
    };
  }
  return {
    verdict: 'differs',
    summary: 'Down Arrow reaches no option',
    reason: `With ${count} options shown, Down Arrow made none of them active.`,
  };
}

/** APG: with the popup available, Down Arrow moves into it. Judged on the first Down Arrow. */
export function evaluateDown(input: EvaluatorInput): VerdictResult {
  if (!judgedScenarios.has(input.scenarioId)) return unsupported(input.scenarioId);
  const steps = observedSteps(input, 1);
  if (!steps) return incomplete;
  const first = steps.find(({ step }) => isPress(step, 'ArrowDown'));
  return first ? judgeDown(first, input.scenarioId) : incomplete;
}
