import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { noActiveOption } from './arrows.ts';
import {
  activeOption,
  incomplete,
  isArrow,
  observedSteps,
  selectedNames,
  unsupported,
} from './facts.ts';

const quoted = (names: readonly string[]): string =>
  names.length === 0 ? 'no option' : names.map((name) => `"${name}"`).join(', ');

/** APG: the option shown as the current one has aria-selected true, and only one option has it. */
export function evaluateSelected(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'type-then-move') return unsupported(input.scenarioId);
  const steps = observedSteps(input, 1);
  if (!steps) return incomplete;
  let judged = 0;
  for (const [index, { step, after }] of steps.entries()) {
    const active = isArrow(step) ? activeOption(after) : undefined;
    if (!active) continue;
    judged += 1;
    const selected = selectedNames(after.popup);
    if (selected.length !== 1 || selected[0] !== active.name) {
      return {
        verdict: 'differs',
        summary: 'Selected is not the active option',
        reason: `After step ${index + 1}, "${active.name}" was active and ${quoted(selected)} was exposed as selected.`,
      };
    }
  }
  if (judged === 0) return noActiveOption;
  return {
    verdict: 'follows',
    summary: 'Only the active option is selected',
    reason: `In ${judged} steps the active option, and no other, was exposed as selected.`,
  };
}
