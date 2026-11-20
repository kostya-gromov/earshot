import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  describeSelection,
  differs,
  focusedTab,
  follows,
  incomplete,
  isPress,
  notJudged,
  observedSteps,
  tabNamesOf,
  unsupported,
  type ObservedStep,
} from './facts.ts';

const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };

/** A step that pressed Right or Left Arrow from a tab, with the neighbour it should reach. */
export interface ArrowMove {
  observed: ObservedStep;
  key: string;
  from: string;
  /** The tab the key should reach, or undefined when it would go past an end. */
  neighbour: string | undefined;
  /** The tab focus is on afterwards, if any. */
  landed: string | undefined;
}

export function arrowMoves(steps: readonly ObservedStep[]): ArrowMove[] {
  return steps.flatMap((observed) => {
    const key = Object.keys(offsets).find((name) => isPress(observed.step, name));
    const from = focusedTab(observed.before);
    if (!key || from === undefined) return [];
    const names = tabNamesOf(observed.before.tabSet);
    const neighbour = names[names.indexOf(from) + offsets[key]!];
    return [{ observed, key, from, neighbour, landed: focusedTab(observed.after) }];
  });
}

const arrowName = (key: string) => (key === 'ArrowRight' ? 'Right Arrow' : 'Left Arrow');

/**
 * APG: Right Arrow moves focus to the next tab, Left Arrow to the previous one. Judged between
 * neighbours; the ends are `wrap`'s. Whether the tab is activated on the way is recorded.
 */
export function evaluateArrows(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'move') return unsupported(input.scenarioId);
  const steps = observedSteps(input);
  if (!steps) return incomplete;
  const moves = arrowMoves(steps).filter(({ neighbour }) => neighbour !== undefined);
  if (moves.length === 0) {
    return notJudged('No arrow from a tab', 'No arrow key was pressed with focus on a tab.');
  }
  const wrong = moves.find(({ neighbour, landed }) => landed !== neighbour);
  if (wrong) {
    const where = wrong.landed === undefined ? 'off the tabs' : `to "${wrong.landed}"`;
    return differs(
      'Arrow keys do not reach the neighbour',
      `${arrowName(wrong.key)} from "${wrong.from}" moved focus ${where}, not to "${wrong.neighbour}".`,
    );
  }
  const lines = moves.map(
    ({ observed, key, from, landed }) =>
      `${arrowName(key)} moved focus from "${from}" to "${landed}"; ${describeSelection(observed.before, observed.after)}.`,
  );
  return { ...follows('Arrows move between the tabs', lines.join(' ')), judgedSteps: moves.length };
}
