import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { closing } from './closing.ts';
import { differs, follows, isOpen, isVerdict } from './facts.ts';

const scenarios = new Set(['escape', 'escape-typing']);

/** APG: "Escape: Closes the dialog." */
export function evaluateEscape(input: EvaluatorInput): VerdictResult {
  const close = closing(input, scenarios);
  if (isVerdict(close)) return close;
  if (isOpen(close.last.after)) {
    return differs('Escape does not close the dialog', `${close.words} left the dialog open.`);
  }
  return follows('Escape closes the dialog', `${close.words} closed the dialog.`);
}
