import type { Step, VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput, Precondition } from '../../model/evaluator.ts';
import { incomplete, unsupported } from './common-verdicts.ts';
import { chipPosition, describeFocus, observedSteps } from './facts.ts';
import { separateControls, separateControlsReason, tabBetweenChips } from './separate-controls.ts';

function moved(step: Step, { expected, key }: { expected: number; key: string }) {
  if (chipPosition(step.focusAfter)?.position === expected) return undefined;
  const from = chipPosition(step.focusBefore)?.position;
  const direction = key === 'Left Arrow' ? 'previous' : 'next';
  return {
    verdict: 'differs' as const,
    summary: `${key} does not move to the ${direction} chip`,
    reason: `From chip ${from}, ${key} left focus on ${describeFocus(step.focusAfter)}, not on chip ${expected}.`,
  };
}

/**
 * APG roving tabindex: arrow keys move focus within a composite widget. Judged from the last
 * chip, Left Arrow then Right Arrow, so it does not depend on reaching the chips from the input.
 */
export function evaluateChipArrows(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'chip-arrows') return unsupported(input.scenarioId);
  const steps = observedSteps(input, 2);
  if (!steps) return incomplete('Two settled Arrow observations are required.');
  const [left, right] = steps;
  const start = chipPosition(left!.focusBefore);
  if (!start || start.position < 2) {
    return {
      verdict: 'inconclusive',
      summary: 'Did not start on the last chip',
      reason: `Focus was on ${describeFocus(left!.focusBefore)}, not on the last chip, before Left Arrow.`,
    };
  }
  const difference =
    moved(left!, { expected: start.position - 1, key: 'Left Arrow' }) ??
    moved(right!, { expected: start.position, key: 'Right Arrow' });
  if (difference) return difference;
  return {
    verdict: 'follows',
    summary: 'Arrows move between chips',
    reason: `From chip ${start.position}, Left Arrow moved to chip ${start.position - 1} and Right Arrow back to chip ${start.position}.`,
  };
}

/**
 * Arrow keys move inside a composite widget. Separate controls with no arrow keys are not one
 * (verdict audit 2026-11-11): nothing to judge. When Tab moves between chips but arrows do work,
 * that design is judged once, by chip-stop (third verdict audit, 2026-11-10).
 */
export const chipArrowsPrecondition: Precondition = (scenarios) => {
  const separate = separateControls(scenarios);
  if (separate) {
    return {
      verdict: 'not-applicable',
      summary: 'Separate controls, not one widget',
      reason: separateControlsReason(separate),
    };
  }
  const tab = tabBetweenChips(scenarios);
  if (!tab) return undefined;
  return {
    verdict: 'inconclusive',
    summary: 'Each chip is its own Tab stop',
    reason: `In ${tab.scenarioId}, ${tab.key} moved from chip ${tab.from} to chip ${tab.to}: the chips are separate Tab stops, not one composite widget, so arrow keys inside them are not expected. "The chips are one Tab stop" covers it.`,
  };
};
