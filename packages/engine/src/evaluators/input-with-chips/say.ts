import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { incomplete, unsupported } from './common-verdicts.ts';
import { observedSteps } from './facts.ts';
import {
  saidTexts,
  type ChangeAnnouncement,
  type LiveText,
} from '../../model/change-announcement.ts';
import { removalAnnouncement } from './removal-announcement.ts';
import { missingRemoval, removalStepIndex } from './removal-step.ts';

/**
 * Announce the removal: an Earshot recommendation (decided 2026-11-09). Earshot reads a chip that
 * disappears as a status message under WCAG 4.1.3; the criterion's text centres on messages
 * added to the page, so this is not presented as required. Where focus lands is "keep-focus".
 */
export function evaluateSay(input: EvaluatorInput): VerdictResult {
  const index = removalStepIndex(input);
  if (index === undefined) return unsupported(input.scenarioId);
  const steps = observedSteps(input, index + 1);
  if (!steps) return incomplete('The removal observation is incomplete.');
  const missing = missingRemoval(input, index);
  if (missing) return missing;
  const announcement = removalAnnouncement(steps[index]!, input.recorded ?? []);
  return verdictOf(announcement);
}

/** Texts written into a region that was there need no remark; any other arrival is quoted. */
function followsReason(texts: readonly LiveText[]): string {
  if (texts.every(({ arrival }) => arrival === 'written')) {
    return 'The removal was announced and named the removed value.';
  }
  return `The removal was announced, naming the removed value: ${saidTexts(texts)}.`;
}

function verdictOf(announcement: ChangeAnnouncement): VerdictResult {
  switch (announcement.kind) {
    case 'silent':
      return {
        verdict: 'differs',
        summary: 'Removal is not announced',
        reason: 'The removal was not announced.',
      };
    case 'not-counted':
      return {
        verdict: 'differs',
        summary: 'Removal is not announced',
        reason: announcement.reason,
      };
    case 'undetermined':
      return {
        verdict: 'inconclusive',
        summary: 'Announcement could not be judged',
        reason: announcement.reason,
      };
    case 'announced':
      return {
        verdict: 'follows',
        summary: 'Announced, naming the value',
        reason: followsReason(announcement.texts),
      };
  }
}
