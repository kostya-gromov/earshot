import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { differs, follows, isVerdict, opening } from './facts.ts';

const scenarios = new Set(['open']);

/** APG: the container "has a role of dialog" and a name from aria-labelledby or aria-label. */
export function evaluateNamedDialog(input: EvaluatorInput): VerdictResult {
  const start = opening(input, scenarios);
  if (isVerdict(start)) return start;
  const { role, name } = start.opened.after.dialog.dialog!;
  if (role !== 'dialog') {
    return differs(
      'The role is not dialog',
      `The open dialog is exposed with the role ${role ?? 'none'}, not dialog.`,
    );
  }
  if (name.trim() === '') {
    return differs(
      'The dialog has no name',
      'The open dialog has the role dialog and no accessible name.',
    );
  }
  return follows(
    'The dialog has a role and a name',
    `The open dialog is exposed as dialog "${name}".`,
  );
}
