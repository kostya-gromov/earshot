import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  activeItem,
  differs,
  firstInMenu,
  incomplete,
  isPress,
  notJudged,
  observedSteps,
  unsupported,
  type Moment,
  type ObservedStep,
} from './facts.ts';

/** The active item as a reason names it: quoted, or "no item". */
const nameOf = (moment: Moment) => {
  const active = activeItem(moment);
  return active ? `"${active.name}"` : 'no item';
};

/** The last item an arrow could rest on: the last one that can be activated, else the last. */
function lastIndex({ popup }: Moment): number {
  const enabled = popup.options.flatMap(({ states }, index) => (states.disabled ? [] : [index]));
  return enabled.at(-1) ?? popup.options.length - 1;
}

interface Keys {
  up: ObservedStep;
  end: ObservedStep;
  /** The Home pressed after End: the one that has somewhere to come back from. */
  home: ObservedStep;
}

/** The presses, when the menu was open on its first item before Up Arrow. */
function keysFromFirstItem(steps: readonly ObservedStep[]): Keys | undefined {
  const up = firstInMenu(steps, 'ArrowUp');
  const end = firstInMenu(steps, 'End');
  const home = steps.findLast((observed) => isPress(observed.step, 'Home'));
  if (!up || !end || !home || activeItem(up.before)?.index !== 0) return undefined;
  return { up, end, home };
}

/** Where the arrows do not wrap: End reaches the last item, Home the first. */
function judgeWithoutWrap(keys: Keys): VerdictResult {
  const { end, home } = keys;
  if (activeItem(end.after)?.index !== lastIndex(end.before)) {
    return differs(
      'End does not reach the last item',
      `The arrows do not wrap, and End made ${nameOf(end.after)} active, not the last item.`,
    );
  }
  if (activeItem(home.after)?.index !== 0) {
    return differs(
      'Home does not reach the first item',
      `The arrows do not wrap, and Home made ${nameOf(home.after)} active, not the first item.`,
    );
  }
  return {
    verdict: 'follows',
    summary: 'Home and End reach the ends',
    reason: `The arrows do not wrap; End made ${nameOf(end.after)} active and Home ${nameOf(home.after)}.`,
  };
}

/**
 * Where the arrows wrap, APG does not ask for the two keys, and optional behavior is recorded,
 * not judged: a menu that has them anyway must not count as following more than one that does
 * exactly what the source asks (2026-11-16).
 */
function recordWithWrap(keys: Keys, wrappedTo: string): VerdictResult {
  return {
    verdict: 'not-applicable',
    summary: 'Arrows wrap',
    reason: `Up Arrow at the first item wrapped to "${wrappedTo}", so APG does not ask for Home and End here. End made ${nameOf(keys.end.after)} active and Home ${nameOf(keys.home.after)} (recorded, not judged).`,
  };
}

/**
 * APG asks for Home and End only "if arrow key wrapping is not supported". The Up Arrow at the
 * first item shows which it is. Without wrapping the two keys are judged; with it the rule is
 * not applicable, whatever the keys do.
 */
export function evaluateHomeEnd(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'home-end') return unsupported(input.scenarioId);
  const steps = observedSteps(input, 5);
  if (!steps) return incomplete;
  const keys = keysFromFirstItem(steps);
  if (!keys) {
    return notJudged(
      'Menu not open on its first item',
      'The menu was not shown with its first item active before Up Arrow, so whether the arrows wrap could not be read.',
    );
  }
  const afterUp = activeItem(keys.up.after);
  if (!afterUp || afterUp.index === 0) return judgeWithoutWrap(keys);
  return recordWithWrap(keys, afterUp.name);
}
