import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { removedActionTarget, removedNode } from './facts.ts';

/** The step expected to remove a chip in each scenario that removes one. */
const expectedRemovalStep: Readonly<Record<string, number>> = {
  'backspace-twice': 1,
  'delete-focused': 1,
  'remove-click': 0,
};

/**
 * The step judged as the removal. In backspace-twice some systems remove a chip with the first
 * Backspace; the second then removes another chip, or only text the first one left in the input.
 * Judging the second there asked for a count one too high and could call a text deletion a
 * removal (verdict audit 2026-11-13), so the first step that removed something is the one judged.
 * Whether removing at once is right is the bsp rule's question, not asked again here.
 */
export function removalStepIndex(input: EvaluatorInput): number | undefined {
  const expected = expectedRemovalStep[input.scenarioId];
  if (input.scenarioId !== 'backspace-twice' || expected === undefined) return expected;
  const first = input.steps.slice(0, expected).findIndex(removedNode);
  return first === -1 ? expected : first;
}

/**
 * Whether the judged step removed something. Which chip a key removes is judged by bsp and
 * arrows, so a keyboard step only needs to have removed something; a click must remove the chip
 * it clicked.
 */
export function missingRemoval(input: EvaluatorInput, index: number): VerdictResult | undefined {
  const removal = input.steps[index]!;
  if (input.scenarioId === 'remove-click') {
    if (removedActionTarget(removal)) return undefined;
    return {
      verdict: 'differs',
      summary: 'The clicked chip stays',
      reason: 'The clicked chip was not removed.',
    };
  }
  if (removedNode(removal)) return undefined;
  return {
    verdict: 'inconclusive',
    summary: 'Nothing removed to judge',
    reason: `Step ${index + 1} removed nothing, so there was no removal to judge.`,
  };
}
