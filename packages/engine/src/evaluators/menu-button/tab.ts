import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { isSameElement } from '../../model/same-element.ts';
import {
  activeItem,
  describeFocus,
  differs,
  firstInMenu,
  incomplete,
  isShown,
  notJudged,
  observedSteps,
  unsupported,
  type ObservedStep,
} from './facts.ts';

/** Focus is still in the menu: either Tab did nothing, or it went to another element there. */
function staysInMenu({ before, after }: ObservedStep, landed: string): VerdictResult {
  const stayed = isSameElement(before.focus, after.focus);
  const sameItem = activeItem(before)?.name === activeItem(after)?.name;
  if (stayed && sameItem) {
    return differs(
      'Tab stays in the menu',
      `Tab left focus where it was, on ${landed}, and the menu stayed shown with ${after.popup.options.length} items.`,
    );
  }
  return differs('Tab stays in the menu', `Tab moved focus to ${landed}, inside the menu.`);
}

/**
 * APG: Tab and Shift+Tab do not move focus among the items; from an item they move focus out of
 * the menu and close it. Where focus lands outside the menu is recorded, not judged.
 */
export function evaluateTab(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'tab-open') return unsupported(input.scenarioId);
  const steps = observedSteps(input, 2);
  if (!steps) return incomplete;
  const tab = firstInMenu(steps, 'Tab');
  if (!tab) {
    return notJudged('Menu not shown', 'The menu was not shown before Tab, so nothing was judged.');
  }
  const landed = describeFocus(tab.after.focus);
  if (activeItem(tab.after) || tab.after.focus.isInsidePopup) return staysInMenu(tab, landed);
  if (isShown(tab.after.popup)) {
    return differs(
      'Menu stays shown after Tab',
      `Tab moved focus to ${landed} and left the menu shown with ${tab.after.popup.options.length} items.`,
    );
  }
  return {
    verdict: 'follows',
    summary: 'Tab leaves and closes the menu',
    reason: `Tab moved focus out of the menu, to ${landed}, and the menu closed.`,
  };
}
