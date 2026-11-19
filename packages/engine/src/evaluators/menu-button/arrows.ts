import type { PopupState, VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  activeItem,
  describeFocus,
  describeItem,
  differs,
  incomplete,
  isPress,
  isShown,
  notJudged,
  observedSteps,
  unsupported,
  type ObservedStep,
} from './facts.ts';

const scenarios: readonly string[] = ['move', 'ends'];

const isEnabled = (popup: PopupState, index: number) =>
  popup.options[index]?.states.disabled !== true;

/**
 * Where an arrow key may take the active item from `from`: the item beside it, or the next one
 * that can be activated (whether a disabled item is a stop is another rule's question). With
 * nothing further to go to, it may stay or wrap to the other end.
 */
function allowedAfter(popup: PopupState, from: number, direction: 1 | -1): ReadonlySet<number> {
  const indexes = popup.options.map((_, index) => index);
  const ahead = indexes.filter((index) => (index - from) * direction > 0);
  const enabledAhead = ahead.filter((index) => isEnabled(popup, index));
  const nearest = (list: readonly number[]) => (direction === 1 ? list[0] : list.at(-1));
  const allowed = [nearest(ahead), nearest(enabledAhead)];
  if (enabledAhead.length === 0) {
    const enabled = indexes.filter((index) => isEnabled(popup, index));
    const farEnd = direction === 1 ? [indexes[0], enabled[0]] : [indexes.at(-1), enabled.at(-1)];
    allowed.push(from, ...farEnd);
  }
  return new Set(allowed.filter((index): index is number => index !== undefined));
}

type Reading = { moved: true } | { difference: string } | undefined;

function readArrow(observed: ObservedStep, key: 'ArrowDown' | 'ArrowUp'): Reading {
  const { before, after } = observed;
  const from = activeItem(before);
  if (!isShown(before.popup) || !from) return undefined;
  const count = before.popup.options.length;
  const to = activeItem(after);
  if (!to) {
    return {
      difference: `${key} from ${describeItem(from, count)} left no item active: focus was on ${describeFocus(after.focus)}.`,
    };
  }
  const allowed = allowedAfter(before.popup, from.index, key === 'ArrowDown' ? 1 : -1);
  if (allowed.has(to.index)) return { moved: true };
  return {
    difference: `${key} from ${describeItem(from, count)} went to ${describeItem(to, count)}.`,
  };
}

const arrowOf = ({ step }: ObservedStep) =>
  (['ArrowDown', 'ArrowUp'] as const).find((key) => isPress(step, key));

/**
 * APG: Down Arrow moves to the next item and Up Arrow to the previous one, optionally wrapping
 * at the ends. Staying at an end and wrapping both follow.
 */
export function evaluateArrows(input: EvaluatorInput): VerdictResult {
  if (!scenarios.includes(input.scenarioId)) return unsupported(input.scenarioId);
  const steps = observedSteps(input, 2);
  if (!steps) return incomplete;
  const readings = steps.flatMap((observed) => {
    const key = arrowOf(observed);
    const reading = key && readArrow(observed, key);
    return reading ? [reading] : [];
  });
  const wrong = readings.find((reading) => 'difference' in reading);
  if (wrong && 'difference' in wrong)
    return differs('Arrows do not move in order', wrong.difference);
  if (readings.length === 0) {
    return notJudged(
      'No arrow key with an active item',
      'No arrow key was pressed while the menu was shown with an active item, so nothing was judged.',
    );
  }
  const count = readings.length === 1 ? '1 arrow key step' : `${readings.length} arrow key steps`;
  return {
    verdict: 'follows',
    summary: 'Arrows move through the items',
    reason: `In ${count} the active item moved to the next or the previous item, or stayed or wrapped at an end.`,
    judgedSteps: readings.length,
  };
}
