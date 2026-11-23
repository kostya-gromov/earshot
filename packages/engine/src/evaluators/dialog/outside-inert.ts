import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { closing } from './closing.ts';
import {
  describeFocus,
  differs,
  follows,
  isInside,
  isOpen,
  isVerdict,
  notJudged,
} from './facts.ts';

const scenarios = new Set(['outside-click']);

/** APG: "users cannot interact with content outside an active dialog window." */
export function evaluateOutsideInert(input: EvaluatorInput): VerdictResult {
  const click = closing(input, scenarios);
  if (isVerdict(click)) return click;
  const { step, after } = click.last;
  if (step.action.type !== 'click') {
    return notJudged('No click outside', 'The scenario’s last step was not a click.');
  }
  const field = `${step.action.target.role ?? 'element'} "${step.action.target.name}"`;
  // The click goes to the point where the field is, on whatever covers it: not "on the field".
  const where = `where ${field} is, behind the dialog,`;
  if (!isOpen(after)) {
    return follows('A click outside closes the dialog', `A click ${where} closed the dialog.`);
  }
  if (!isInside(after) && !after.focus.isBody) {
    return differs(
      'A click reaches the page behind',
      `A click ${where} put focus on ${describeFocus(after.focus)} while the dialog stayed open.`,
    );
  }
  return follows(
    'The page behind cannot be used',
    `A click ${where} left the dialog open and focus on ${describeFocus(after.focus)}.`,
  );
}
