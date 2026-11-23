import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { describeFocus, differs, follows, isInside, isOpen, isVerdict } from './facts.ts';
import { runKey, tabRun } from './tab-run.ts';

/** APG: "Tab and Shift + Tab do not move focus outside the dialog." */
export function evaluateContained(input: EvaluatorInput): VerdictResult {
  const run = tabRun(input);
  if (isVerdict(run)) return run;
  const key = runKey(run);
  // Leaving the page for the browser's controls is not landing on the page behind: `wrap`'s.
  const judged = run.filter(({ after }) => isOpen(after) && !after.focus.leftPage);
  const escaped = judged.find(({ after }) => !isInside(after));
  if (escaped) {
    const where = describeFocus(escaped.after.focus);
    return {
      ...differs(
        escaped.after.focus.isBody ? 'Focus falls to the document' : 'Tab reaches the page behind',
        `${key} from ${describeFocus(escaped.before.focus)} left focus on ${where}, outside the open dialog.`,
      ),
      judgedSteps: judged.length,
    };
  }
  return {
    ...follows(
      'Tab stays inside the dialog',
      `Focus was inside the dialog after each of ${judged.length} presses of ${key}.`,
    ),
    judgedSteps: judged.length,
  };
}
