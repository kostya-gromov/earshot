import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { isOpen, isVerdict, notJudged, opening, type ObservedStep } from './facts.ts';

/** How the scenario asks the dialog to close, in the words of a reason. */
const closeWords: Record<string, string> = {
  escape: 'Escape',
  'escape-typing': 'Escape, with text typed into the field,',
  cancel: 'A click on Cancel',
};

export interface Closing {
  /** The first step: Enter on the button, with focus on it before. */
  opened: ObservedStep;
  /** The last step: the one that asks the dialog to close. */
  last: ObservedStep;
  words: string;
}

/** The scenario's closing step, once the dialog was open before it. */
export function closing(
  input: EvaluatorInput,
  scenarios: ReadonlySet<string>,
): Closing | VerdictResult {
  const start = opening(input, scenarios);
  if (isVerdict(start)) return start;
  const last = start.steps.at(-1)!;
  if (!isOpen(last.before)) {
    return notJudged(
      'The dialog was not open',
      'The dialog was no longer open before the step that closes it.',
    );
  }
  return { opened: start.opened, last, words: closeWords[input.scenarioId] ?? 'The last step' };
}
