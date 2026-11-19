import type { Step, VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { incomplete, unsupported } from './common-verdicts.ts';
import {
  describeFocus,
  describeHeard,
  initialFocus,
  chipPosition,
  isSameControl,
  isUnpositionedItem,
  observedSteps,
  showsNothing,
} from './facts.ts';

/** ←, ←, → from the input with three chips: last chip, middle chip, last chip, then the input. */
const expectedChipPositions = [3, 2, 3] as const;

const actionLabel = (step: Step, index: number): string =>
  `step ${index + 1} (${step.action.type === 'press' ? step.action.key : step.action.type})`;

function chipNavigationDifference(steps: readonly Step[]): VerdictResult | undefined {
  const index = expectedChipPositions.findIndex(
    (position, at) => chipPosition(steps[at]!.focusAfter)?.position !== position,
  );
  if (index === -1) return undefined;
  const step = steps[index]!;
  // Moving between chips is the APG rule "chip-arrows"; this rule judges crossing between the
  // input and the chips, so a failure after the first step is not charged twice (2026-11-10).
  if (index > 0) {
    return {
      verdict: 'inconclusive',
      summary: 'Arrows do not move between chips',
      reason:
        'Left Arrow reached the last chip, but the arrows did not then move between chips, so the way back to the input could not be tested. Moving between chips is judged by "Arrows move between chips".',
    };
  }
  if (isUnpositionedItem(step.focusAfter)) {
    return {
      verdict: 'inconclusive',
      summary: 'Focus moves, but chips expose no position',
      reason:
        `After ${actionLabel(step, index)}, focus was on ${describeFocus(step.focusAfter)}, ` +
        `which exposes no set position and is not one of the chips the adapter locates, so ` +
        `whether it is chip ${expectedChipPositions[index]} cannot be read.`,
    };
  }
  // Focus stayed but the tree changed or something was said: a mark the engine cannot read as
  // being on a chip or not. Same principle as bsp (ADR 0009, 2026-11-13).
  if (isSameControl(step.focusAfter, step.focusBefore) && !showsNothing(step)) {
    return {
      verdict: 'inconclusive',
      summary: 'Marks a chip without moving focus',
      reason:
        `After ${actionLabel(step, index)}, focus was still on ${describeFocus(step.focusAfter)}, ` +
        `but the accessibility tree changed or something was announced. ${describeHeard(step)} ` +
        `Whether that puts the user on chip ${expectedChipPositions[index]} cannot be read from focus.`,
    };
  }
  return {
    verdict: 'differs',
    summary: index === 0 ? 'Left Arrow does not reach a chip' : 'Arrows do not follow chip order',
    reason:
      `After ${actionLabel(step, index)}, focus was on ${describeFocus(step.focusAfter)}, ` +
      `not on chip ${expectedChipPositions[index]}. ${describeHeard(step)}`,
  };
}

export function evaluateArrows(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'arrows') {
    return unsupported(input.scenarioId);
  }
  const steps = observedSteps(input, 4);
  if (!steps) {
    return incomplete('Four settled Arrow observations are required.');
  }
  const navigation = chipNavigationDifference(steps);
  if (navigation) return navigation;
  const entry = initialFocus(input);
  if (!entry || !isSameControl(steps[3]!.focusAfter, entry)) {
    return {
      verdict: 'differs',
      summary: 'Right Arrow does not return to the input',
      reason: 'Right Arrow past the last chip did not return to input.',
    };
  }
  return {
    verdict: 'follows',
    summary: 'Moves through chips and back to the input',
    reason: 'Arrow keys moved through chips and returned to input.',
  };
}
