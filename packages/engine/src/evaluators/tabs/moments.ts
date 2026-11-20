import type { TabSetState } from '@earshot/contracts';
import type { ObservedStep } from './facts.ts';

/** One recorded state of the tab set, and the words that say when it was recorded. */
export interface TabSetMoment {
  tabSet: TabSetState;
  when: string;
}

const keyOf = ({ step }: ObservedStep) =>
  step.action.type === 'press' ? step.action.key : step.action.type;

/**
 * Every state the scenario recorded: before its first step, then after each step. Rules that
 * hold "after every step" (`selected`, `panel`) judge each of them.
 */
export function everyMoment(steps: readonly ObservedStep[]): TabSetMoment[] {
  const [first] = steps;
  if (!first) return [];
  return [
    { tabSet: first.before.tabSet, when: 'before the first key' },
    ...steps.map((observed, index) => ({
      tabSet: observed.after.tabSet,
      when: `after ${keyOf(observed)} (step ${index + 1})`,
    })),
  ];
}
