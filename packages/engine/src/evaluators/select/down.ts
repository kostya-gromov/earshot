import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  activeOption,
  incomplete,
  isPress,
  isShown,
  observedSteps,
  pointsAwayFromOptions,
  unsupported,
} from './facts.ts';

const howActive = {
  'active-descendant': 'named by aria-activedescendant',
  'dom-focus': 'holding DOM focus',
  selected: 'the one option exposed as selected',
} as const;

/**
 * APG: Down Arrow on the closed select shows the list and makes an option active. Which option
 * is recorded in the reason, not judged. A reference to no option is charged to focus-stays.
 */
export function evaluateDown(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'open') return unsupported(input.scenarioId);
  const step = observedSteps(input, 1)?.[0];
  if (!step || !isPress(step.step, 'ArrowDown')) return incomplete;
  const { after } = step;
  if (!isShown(after.popup)) {
    return {
      verdict: 'differs',
      summary: 'Down Arrow does not open the list',
      reason: 'After Down Arrow on the closed select, no option was in the accessibility tree.',
    };
  }
  const active = activeOption(after);
  if (active) {
    return {
      verdict: 'follows',
      summary: 'Down Arrow opens the list on an option',
      reason: `Down Arrow showed ${after.popup.options.length} options, with "${active.name}" active, ${howActive[active.via]}.`,
    };
  }
  if (pointsAwayFromOptions(after)) {
    return {
      verdict: 'inconclusive',
      summary: 'Charged to focus staying on the select',
      reason:
        'The list opened and aria-activedescendant led to no option; that is charged to "Focus stays on the select".',
    };
  }
  return {
    verdict: 'differs',
    summary: 'The list opens with no active option',
    reason: `Down Arrow showed ${after.popup.options.length} options, and none was active.`,
  };
}
