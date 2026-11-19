import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { incomplete, unsupported } from './common-verdicts.ts';
import { observedSteps } from './facts.ts';
import { countDifference, removalAnnouncement } from './removal-announcement.ts';
import { missingRemoval, removalStepIndex } from './removal-step.ts';

/** Three chips before the scenario; the judged step is the first that removes one. */
const countAfterRemoval = 2;

/**
 * An Atlas recommendation beyond WCAG (decided 2026-11-09): the removal announcement says how
 * many values remain. Judged only when the removal was announced and named, so a removal nobody
 * hears is the "say" rule's difference and is not charged twice.
 */
export function evaluateCount(input: EvaluatorInput): VerdictResult {
  const index = removalStepIndex(input);
  if (index === undefined) return unsupported(input.scenarioId);
  const steps = observedSteps(input, index + 1);
  if (!steps) return incomplete('The removal observation is incomplete.');
  const removal = steps[index]!;
  const missing = missingRemoval(input, index);
  if (missing) {
    return { verdict: 'inconclusive', summary: 'Nothing removed', reason: missing.reason };
  }
  const announcement = removalAnnouncement(removal, input.recorded ?? []);
  if (announcement.kind !== 'announced') {
    return {
      verdict: 'inconclusive',
      summary: 'Removal not announced',
      reason:
        'The removal was not announced, so there is no count to judge. "Announce the removal" covers it.',
    };
  }
  const difference = countDifference(removal, announcement.texts, countAfterRemoval);
  if (difference) return { verdict: 'differs', ...difference };
  return {
    verdict: 'follows',
    summary: 'Says how many remain',
    reason: `The removal announcement included the new count of ${countAfterRemoval}.`,
  };
}
