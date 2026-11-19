import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { incomplete, isCombobox, isShown, notJudged, observedSteps, type Moment } from './facts.ts';

type Reading = 'agrees' | 'not-judged' | { difference: string };

/**
 * One moment against the rule. Not judged (combobox-rules.ts): a listbox with no options, focus
 * away from the combobox, and a combobox whose focused element exposes no expanded state.
 */
function read({ focus, popup }: Moment, input: EvaluatorInput): Reading {
  if (!isCombobox(focus, input) || focus.states.expanded === undefined) return 'not-judged';
  if (isShown(popup)) {
    return focus.states.expanded
      ? 'agrees'
      : {
          difference: `${popup.options.length} options were in the tree while the combobox was exposed as collapsed`,
        };
  }
  if (popup.present) return 'not-judged';
  return focus.states.expanded
    ? { difference: 'no popup was in the tree while the combobox was exposed as expanded' }
    : 'agrees';
}

/** Text that matches nothing: whatever a system shows then is not judged. */
const isUnjudgedScenario = (scenarioId: string): boolean => scenarioId === 'no-match';

export function evaluateExpanded(input: EvaluatorInput): VerdictResult {
  const steps = observedSteps(input, 1);
  if (!steps) return incomplete;
  if (isUnjudgedScenario(input.scenarioId)) {
    return notJudged(
      'Text matches nothing',
      'What a system shows for text that matches nothing is not judged.',
    );
  }
  let judged = 0;
  for (const [index, { after }] of steps.entries()) {
    const reading = read(after, input);
    if (reading === 'not-judged') continue;
    judged += 1;
    if (reading !== 'agrees') {
      return {
        verdict: 'differs',
        summary: 'Expanded does not match the popup',
        reason: `After step ${index + 1}, ${reading.difference}.`,
      };
    }
  }
  if (judged === 0) {
    return notJudged(
      'No expanded state to read',
      'In no step did the focused combobox expose an expanded state next to a popup the engine could read.',
    );
  }
  return {
    verdict: 'follows',
    summary: 'Expanded matches the popup',
    reason: `The expanded state matched whether options were in the tree after ${judged === 1 ? 'the one step' : `each of the ${judged} steps`} judged (${steps.length - judged} not judged).`,
    judgedSteps: judged,
  };
}
