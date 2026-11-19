import type { Step, VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { incomplete, unsupported } from './common-verdicts.ts';
import {
  describeFocus,
  isChip,
  isOutsideComponent,
  isUnpositionedItem,
  observedSteps,
} from './facts.ts';

interface TabScenario {
  stepCount: number;
  /** Index of the Tab or Shift+Tab step that must leave the component. */
  leavingStep: number;
  direction: 'after' | 'before';
}

const tabScenarios: Readonly<Record<string, TabScenario>> = {
  'tab-out': { stepCount: 2, leavingStep: 0, direction: 'after' },
  'tab-from-chip': { stepCount: 2, leavingStep: 1, direction: 'after' },
  'shift-tab-out': { stepCount: 1, leavingStep: 0, direction: 'before' },
};

const keyName = (step: Step): string =>
  step.action.type === 'press' ? step.action.key : step.action.type;

function leavingDifference(step: Step, { direction }: TabScenario): VerdictResult | undefined {
  if (step.focusAfter.isBody) {
    // Chromium reports body both when focus is lost and when Tab passes the page's first or last
    // focusable element into the browser UI, as on demo pages with nothing around the component.
    return {
      verdict: 'inconclusive',
      summary: `${keyName(step)} reached the document`,
      reason: `${keyName(step)} moved focus to the document. The page has no focusable element ${direction} the component, so leaving cannot be told apart from focus loss.`,
    };
  }
  if (isOutsideComponent(step.focusAfter)) return undefined;
  return {
    verdict: 'differs',
    summary: `${keyName(step)} stops on ${step.focusAfter.role ?? 'an element'} inside the field`,
    reason: `${keyName(step)} moved focus to ${describeFocus(step.focusAfter)} inside the component.`,
  };
}

/**
 * Tab from a chip needs a focused chip first. Reaching one is the arrows rule, and the same chip
 * test applies here, so an unmet precondition is inconclusive and a defect counts only once.
 */
function chipPrecondition(arrival: Step): VerdictResult | undefined {
  if (isChip(arrival.focusAfter)) return undefined;
  if (isUnpositionedItem(arrival.focusAfter)) {
    return {
      verdict: 'inconclusive',
      summary: 'Focused item is not a recognisable chip',
      reason: `ArrowLeft focused ${describeFocus(arrival.focusAfter)}, which exposes no set position and is not one of the chips the adapter locates, so it cannot be read as a chip and Tab from a chip could not be tested.`,
    };
  }
  return {
    verdict: 'inconclusive',
    summary: 'No chip to Tab from',
    reason: 'ArrowLeft did not focus a chip, so Tab from a chip could not be tested.',
  };
}

export function evaluateTab(input: EvaluatorInput): VerdictResult {
  const scenario = tabScenarios[input.scenarioId];
  if (!scenario) {
    return unsupported(input.scenarioId);
  }
  const steps = observedSteps(input, scenario.stepCount);
  if (!steps) return incomplete('Required Tab observations are missing.');

  if (input.scenarioId === 'tab-from-chip') {
    const precondition = chipPrecondition(steps[0]!);
    if (precondition) return precondition;
  }
  const difference = leavingDifference(steps[scenario.leavingStep]!, scenario);
  if (difference) return difference;
  if (input.scenarioId === 'tab-out' && !steps[1]!.focusAfter.isInsideComponent) {
    return {
      verdict: 'differs',
      summary: 'Shift+Tab does not return to the field',
      reason: 'Shift+Tab did not return focus to the field.',
    };
  }
  return {
    verdict: 'follows',
    summary: 'Leaves the field in one step',
    reason: `${keyName(steps[scenario.leavingStep]!)} left the component in one step.`,
  };
}
