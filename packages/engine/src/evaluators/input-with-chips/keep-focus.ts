import type { Step, VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { incomplete, unsupported } from './common-verdicts.ts';
import { observedSteps } from './facts.ts';
import { missingRemoval, removalStepIndex } from './removal-step.ts';

function lostFocus(removal: Step): VerdictResult | undefined {
  if (removal.focusAfter.isBody) {
    return {
      verdict: 'differs',
      summary: 'Focus falls to the document after removal',
      reason: 'Focus fell to the document after removal.',
    };
  }
  if (!removal.focusAfter.isInsideComponent) {
    return {
      verdict: 'differs',
      summary: 'Focus leaves the field after removal',
      reason: 'Focus left the component after removal.',
    };
  }
  return undefined;
}

/**
 * Keep focus in the field (WCAG 2.4.3): after any removal, by key or click, focus stays in the
 * component, on a neighbouring chip or the input, and never falls to the document or leaves.
 * Whether the removal was announced is the separate "say" recommendation.
 */
export function evaluateKeepFocus(input: EvaluatorInput): VerdictResult {
  const index = removalStepIndex(input);
  if (index === undefined) return unsupported(input.scenarioId);
  const steps = observedSteps(input, index + 1);
  if (!steps) return incomplete('The removal observation is incomplete.');
  const removal = steps[index]!;
  const difference = missingRemoval(input, index) ?? lostFocus(removal);
  if (difference) return difference;
  return {
    verdict: 'follows',
    summary: 'Focus stays in the field',
    reason: 'After the removal, focus stayed in the field.',
  };
}
