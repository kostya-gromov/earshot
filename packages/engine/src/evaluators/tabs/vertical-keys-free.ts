import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { isSameElement } from '../../model/same-element.ts';
import {
  activeTab,
  describeFocus,
  differs,
  follows,
  incomplete,
  isPress,
  observedSteps,
  unsupported,
} from './facts.ts';

const verticalKeys = ['ArrowDown', 'ArrowUp'];
const keyName = (key: string) => (key === 'ArrowDown' ? 'Down Arrow' : 'Up Arrow');

/**
 * APG note: a horizontal tab list "does not listen for Down Arrow or Up Arrow". The engine sees
 * that focus and selection stay; whether the page scrolled is not recorded.
 */
export function evaluateVerticalKeysFree(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'vertical-keys') return unsupported(input.scenarioId);
  const steps = observedSteps(input);
  if (!steps) return incomplete;
  for (const { step, before, after } of steps) {
    const key = verticalKeys.find((name) => isPress(step, name));
    if (!key) continue;
    if (!isSameElement(before.focus, after.focus)) {
      return differs(
        `${keyName(key)} moves focus`,
        `${keyName(key)} moved focus from ${describeFocus(before.focus)} to ${describeFocus(after.focus)}.`,
      );
    }
    if (activeTab(before.tabSet) !== activeTab(after.tabSet)) {
      return differs(
        `${keyName(key)} changes the selection`,
        `${keyName(key)} changed the active tab from "${activeTab(before.tabSet)}" to "${activeTab(after.tabSet)}".`,
      );
    }
  }
  return follows(
    'Up and Down Arrow leave the tabs alone',
    'Down Arrow and Up Arrow left focus and the selection where they were.',
  );
}
