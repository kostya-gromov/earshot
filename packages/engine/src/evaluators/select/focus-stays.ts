import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  activeOption,
  describeFocus,
  incomplete,
  isArrow,
  isOnSelect,
  notJudged,
  observedSteps,
  pointsAwayFromOptions,
  selectNode,
  unsupported,
  type ObservedStep,
  type StepReading,
} from './facts.ts';

const judgedScenarios: ReadonlySet<string> = new Set(['open', 'move']);

function describeReference({ focus }: ObservedStep['after']): string {
  if (focus.activeDescendantUnresolved || !focus.activeDescendant) {
    return 'aria-activedescendant named an element that does not exist';
  }
  const { role, name } = focus.activeDescendant;
  return `aria-activedescendant named ${role ?? 'an element without a role'} "${name}", which is not an option of the list`;
}

/** The select as the tree gave it at this moment, or at the start when it left the tree. */
type StartSelect = ReturnType<typeof selectNode>;

function readStep({ after }: ObservedStep, start: StartSelect): StepReading {
  if (after.focus.item) {
    return { difference: `DOM focus moved onto ${describeFocus(after.focus)}` };
  }
  if (pointsAwayFromOptions(after)) return { difference: describeReference(after) };
  const active = activeOption(after);
  if (!active) return undefined;
  // DOM focus on the list itself, or anywhere but the select, while an option is active.
  if (!isOnSelect(after.focus, selectNode(after) ?? start)) {
    return { difference: `DOM focus moved onto ${describeFocus(after.focus)}` };
  }
  if (active.via !== 'selected') return { follows: true };
  return {
    difference: `"${active.name}" was marked as selected, but aria-activedescendant was not set`,
  };
}

/** The summary names where DOM focus went: the options, the list itself, or elsewhere. */
function summaryOf(difference: string, focus: ObservedStep['after']['focus']): string {
  if (!difference.startsWith('DOM focus')) return 'Active option is not referenced';
  if (focus.item) return 'DOM focus moves onto the options';
  return focus.isInsidePopup ? 'DOM focus moves onto the list' : 'DOM focus leaves the select';
}

/**
 * APG: DOM focus remains on the combobox, and aria-activedescendant refers to the focused option.
 * Owns three designs, each once: focus moved onto the list or its options, an option marked without the
 * reference, and a reference that leads to no option, an element that does not exist included.
 */
export function evaluateFocusStays(input: EvaluatorInput): VerdictResult {
  if (!judgedScenarios.has(input.scenarioId)) return unsupported(input.scenarioId);
  const steps = observedSteps(input, 1);
  if (!steps) return incomplete;
  let followed = 0;
  for (const [index, observed] of steps.entries()) {
    if (!isArrow(observed.step)) continue;
    const result = readStep(observed, steps[0]?.before.popup.opener);
    if (!result) continue;
    if ('follows' in result) followed += 1;
    else {
      return {
        verdict: 'differs',
        summary: summaryOf(result.difference, observed.after.focus),
        reason: `After step ${index + 1}, ${result.difference}.`,
      };
    }
  }
  if (followed === 0) {
    return notJudged(
      'No option became active',
      'No arrow key made an option active, so there was nothing to judge. "Down Arrow opens the list on an option" covers it.',
    );
  }
  return {
    verdict: 'follows',
    summary: 'Focus stays on the select',
    reason: `In ${followed} arrow key ${followed === 1 ? 'step' : 'steps'} DOM focus stayed on the select and aria-activedescendant named the active option.`,
  };
}
