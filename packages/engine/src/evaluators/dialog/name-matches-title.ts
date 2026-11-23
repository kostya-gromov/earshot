import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { differs, follows, isVerdict, notJudged, opening } from './facts.ts';

const scenarios = new Set(['open']);

/** An Atlas recommendation: a person should not hear one title and see another. */
export function evaluateNameMatchesTitle(input: EvaluatorInput): VerdictResult {
  const start = opening(input, scenarios);
  if (isVerdict(start)) return start;
  const { dialog, heading } = start.opened.after.dialog;
  const name = dialog!.name.trim();
  if (name === '') {
    return notJudged(
      'The dialog has no name',
      'The dialog has no accessible name to compare; that is the question of “The dialog has a role and a name”.',
    );
  }
  if (heading === undefined) {
    return notJudged(
      'No heading in the dialog',
      `The dialog is named "${name}" and has no heading in the accessibility tree to compare it with.`,
    );
  }
  if (name !== heading.trim()) {
    return differs(
      'The name is not the visible title',
      `The dialog is named "${name}" and its visible title is "${heading.trim()}".`,
    );
  }
  return follows(
    'The name is the visible title',
    `The dialog’s name and its visible title are both "${name}".`,
  );
}
