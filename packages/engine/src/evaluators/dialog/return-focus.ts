import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { isSameElement } from '../../model/same-element.ts';
import { closing } from './closing.ts';
import { describeFocus, differs, follows, isOpen, isVerdict, notJudged } from './facts.ts';

const scenarios = new Set(['escape', 'escape-typing', 'cancel']);

/** APG: "When a dialog closes, focus returns to the element that invoked the dialog". */
export function evaluateReturnFocus(input: EvaluatorInput): VerdictResult {
  const close = closing(input, scenarios);
  if (isVerdict(close)) return close;
  const { after } = close.last;
  if (isOpen(after)) {
    return notJudged('The dialog did not close', `${close.words} left the dialog open.`);
  }
  // Setup put focus on the button, so the focus before Enter is the invoker.
  const invoker = close.opened.before.focus;
  if (isSameElement(invoker, after.focus)) {
    return follows(
      'Focus returns to the button',
      `${close.words} closed the dialog and focus was back on ${describeFocus(after.focus)}.`,
    );
  }
  return differs(
    after.focus.isBody ? 'Focus falls to the document' : 'Focus lands on another element',
    `${close.words} closed the dialog and focus was on ${describeFocus(after.focus)}, not on ${describeFocus(invoker)}.`,
  );
}
