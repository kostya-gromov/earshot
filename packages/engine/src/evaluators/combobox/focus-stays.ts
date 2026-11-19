import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  activeOption,
  describeFocus,
  incomplete,
  isArrow,
  isCombobox,
  notJudged,
  observedSteps,
  pointsAwayFromOptions,
  unsupported,
  type ObservedStep,
  type StepReading,
} from './facts.ts';

const judgedScenarios: ReadonlySet<string> = new Set(['open-down', 'type-then-move']);

function describeReference({ focus }: ObservedStep['after']): string {
  if (focus.activeDescendantUnresolved || !focus.activeDescendant) {
    return 'aria-activedescendant named an element that does not exist';
  }
  const { role, name } = focus.activeDescendant;
  return `aria-activedescendant named ${role ?? 'an element without a role'} "${name}", which is not an option of the popup`;
}

function readStep({ after }: ObservedStep, input: EvaluatorInput): StepReading {
  if (after.focus.item) {
    return { difference: `DOM focus moved onto ${describeFocus(after.focus)}` };
  }
  if (pointsAwayFromOptions(after)) return { difference: describeReference(after) };
  const active = activeOption(after);
  if (!active || !isCombobox(after.focus, input)) return undefined;
  if (active.via !== 'selected') return { follows: true };
  return {
    difference: `"${active.name}" was marked as selected, but aria-activedescendant was not set`,
  };
}

/**
 * APG: DOM focus is maintained on the combobox, and aria-activedescendant refers to the focused
 * element in the popup. Owns three designs, each once: focus moved onto the options, an option
 * marked without the reference, and a reference that leads to no option.
 */
export function evaluateFocusStays(input: EvaluatorInput): VerdictResult {
  if (!judgedScenarios.has(input.scenarioId)) return unsupported(input.scenarioId);
  const steps = observedSteps(input, 1);
  if (!steps) return incomplete;
  let followed = 0;
  for (const [index, observed] of steps.entries()) {
    if (!isArrow(observed.step)) continue;
    const result = readStep(observed, input);
    if (!result) continue;
    if ('follows' in result) followed += 1;
    else {
      return {
        verdict: 'differs',
        summary: observed.after.focus.item
          ? 'DOM focus moves onto the options'
          : 'Active option is not referenced',
        reason: `After step ${index + 1}, ${result.difference}.`,
      };
    }
  }
  if (followed === 0) {
    return notJudged(
      'No option became active',
      'No arrow key made an option active, so there was nothing to judge. "Down Arrow goes to an option" covers it.',
    );
  }
  return {
    verdict: 'follows',
    summary: 'Focus stays in the combobox',
    reason: `In ${followed} arrow key ${followed === 1 ? 'step' : 'steps'} DOM focus stayed on the combobox and aria-activedescendant named the active option.`,
  };
}
