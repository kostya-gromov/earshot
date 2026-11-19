import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { judgeEnds } from './ends.ts';
import {
  activeOption,
  incomplete,
  isArrow,
  isPress,
  notJudged,
  observedSteps,
  unsupported,
  type ObservedStep,
  type StepReading,
} from './facts.ts';

export const noActiveOption = notJudged(
  'No option became active',
  'No arrow key made an option active, so there was nothing to judge. "Down Arrow goes to an option" covers it.',
);

/** A move from one active option to its neighbour; undefined when the step is not such a move. */
function readMove({ step, before, after }: ObservedStep): StepReading {
  const from = activeOption(before);
  if (!from || !isArrow(step)) return undefined;
  const delta = isPress(step, 'ArrowDown') ? 1 : -1;
  const expected = from.index + delta;
  // A move off either end is the business of the `ends` scenario.
  if (expected < 0 || expected >= before.popup.options.length) return undefined;
  const to = activeOption(after);
  if (to?.index === expected) return { follows: true };
  const landed = to ? `option ${to.index + 1}, "${to.name}"` : 'no option';
  return {
    difference: `from option ${from.index + 1}, ${delta === 1 ? 'Down' : 'Up'} Arrow made ${landed} active; option ${expected + 1} was expected`,
  };
}

function judgeMoves(steps: readonly ObservedStep[]): VerdictResult {
  let followed = 0;
  for (const [index, observed] of steps.entries()) {
    const result = readMove(observed);
    if (!result) continue;
    if ('follows' in result) followed += 1;
    else {
      return {
        verdict: 'differs',
        summary: 'Arrow does not move to the neighbour',
        reason: `In step ${index + 1}, ${result.difference}.`,
      };
    }
  }
  if (followed === 0) return noActiveOption;
  return {
    verdict: 'follows',
    summary: 'Arrows move through the options',
    reason: `In ${followed} steps an arrow key moved from the active option to the next or the previous one.`,
  };
}

/** APG: Down Arrow moves to the next option, Up Arrow to the previous one. */
export function evaluateArrows(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'type-then-move' && input.scenarioId !== 'ends') {
    return unsupported(input.scenarioId);
  }
  const steps = observedSteps(input, 1);
  if (!steps) return incomplete;
  return input.scenarioId === 'ends' ? judgeEnds(steps, input) : judgeMoves(steps);
}
