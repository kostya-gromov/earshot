import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { describeFocus, differs, focusedTab, follows, incomplete, notJudged } from './facts.ts';
import { isStep, tabFromTab } from './tab-out.ts';

/**
 * APG: Tab from the tab list moves to "the tabpanel unless the first element containing
 * meaningful content inside the tabpanel is focusable". On every measured page the only element
 * in a panel that takes focus is its first content, so anywhere inside the shown panel follows.
 * Judged only once focus left the tab list; staying in it is `tab-out`'s.
 */
export function evaluatePanelReachable(input: EvaluatorInput): VerdictResult {
  const tab = tabFromTab(input);
  if (!isStep(tab)) return tab;
  const { focus } = tab.after;
  if (focusedTab(tab.after) !== undefined) {
    return notJudged('Focus stayed in the tab list', 'Tab did not move focus out of the tab list.');
  }
  if (focus.isBody) {
    return notJudged(
      'Focus fell to the document',
      'Tab left focus on the document; that is tab-out’s.',
    );
  }
  if (focus.isInsidePanel === undefined) return incomplete;
  const landed = describeFocus(focus);
  if (!focus.isInsidePanel) {
    return differs('Tab skips the panel', `Tab moved focus past the shown panel, to ${landed}.`);
  }
  return follows('Tab reaches the panel', `Tab moved focus into the shown panel, to ${landed}.`);
}
