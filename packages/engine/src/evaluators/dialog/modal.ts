import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { differs, follows, isVerdict, opening } from './facts.ts';

const scenarios = new Set(['open']);

/**
 * APG: "The dialog container element has aria-modal set to true." Read from the accessibility
 * tree, where the browser's own modal dialog reports the same state without the attribute
 * (docs/proposals/dialog.md, decision 4).
 */
export function evaluateModal(input: EvaluatorInput): VerdictResult {
  const start = opening(input, scenarios);
  if (isVerdict(start)) return start;
  const { name, states } = start.opened.after.dialog.dialog!;
  if (states.modal !== true) {
    return differs(
      'The dialog is not exposed as modal',
      `The open dialog "${name}" is not reported as modal in the accessibility tree.`,
    );
  }
  return follows(
    'The dialog says it is modal',
    `The open dialog "${name}" is reported as modal in the accessibility tree.`,
  );
}
