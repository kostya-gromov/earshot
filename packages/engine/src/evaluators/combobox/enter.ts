import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { noActiveOption } from './arrows.ts';
import {
  activeOption,
  incomplete,
  isPress,
  isShown,
  notJudged,
  observedSteps,
  unsupported,
  type ObservedStep,
} from './facts.ts';

/**
 * APG: Enter accepts the option by placing its value in the combobox, or by a default action on
 * it (its example then clears the field). The cursor is not recorded and not judged.
 */
export function evaluateEnter(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'accept') return unsupported(input.scenarioId);
  const steps = observedSteps(input, 1);
  if (!steps) return incomplete;
  const enter = steps.find(({ step }) => isPress(step, 'Enter'));
  if (!enter) return incomplete;
  const active = activeOption(enter.before);
  if (!active) return noActiveOption;
  if (isShown(enter.after.popup)) {
    return {
      verdict: 'differs',
      summary: 'Popup stays open after Enter',
      reason: `With "${active.name}" active, Enter left ${enter.after.popup.options.length} options in the tree.`,
    };
  }
  return judgeValue(enter, active.name);
}

/** With the popup closed: the option's value in the input, an empty input, or other text. */
function judgeValue({ after }: ObservedStep, name: string): VerdictResult {
  const { value, description } = after.focus;
  if (value === undefined) {
    return notJudged(
      'No text field to read',
      'After Enter, focus was not on a text field, so its value was not read.',
    );
  }
  if (value === name) {
    return {
      verdict: 'follows',
      summary: 'Enter accepts the active option',
      reason: `Enter closed the popup and put "${name}" in the combobox.`,
    };
  }
  if (value === '') {
    // Some systems show the accepted value beside the input and say so in its description.
    const shown = description?.includes(name)
      ? ` The input's description now reads "${description}".`
      : ' Where the value went is not recorded.';
    return {
      verdict: 'follows',
      summary: 'Enter accepts and clears the field',
      reason: `With "${name}" active, Enter closed the popup and left the input empty. APG allows a default action on the value in place of putting it in the input.${shown}`,
    };
  }
  return {
    verdict: 'differs',
    summary: 'Enter keeps other text',
    reason: `With "${name}" active, Enter closed the popup and the combobox held "${value}".`,
  };
}
