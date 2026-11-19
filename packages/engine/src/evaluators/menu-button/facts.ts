import type { FocusInfo, PopupState, Step, VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';

/** Focus, the menu and what the page says the last action was, before or after a step. */
export interface Moment {
  focus: FocusInfo;
  popup: PopupState;
  effect: string;
}

export interface ObservedStep {
  step: Step;
  before: Moment;
  after: Moment;
}

/** The scenario's steps with everything a menu rule reads, or undefined when any part is missing. */
export function observedSteps(
  input: EvaluatorInput,
  count: number,
): readonly ObservedStep[] | undefined {
  if (input.steps.length < count) return undefined;
  const observed: ObservedStep[] = [];
  for (const step of input.steps) {
    if (!step.popup || !step.effect || !step.settle.quiet) return undefined;
    observed.push({
      step,
      before: { focus: step.focusBefore, popup: step.popup.before, effect: step.effect.before },
      after: { focus: step.focusAfter, popup: step.popup.after, effect: step.effect.after },
    });
  }
  return observed;
}

/** A scenario this evaluator was not written for: a registration bug made visible, not a finding. */
export const unsupported = (scenarioId: string): VerdictResult => ({
  verdict: 'inconclusive',
  summary: 'Scenario not supported',
  reason: `Unsupported scenario "${scenarioId}".`,
});

export const incomplete: VerdictResult = {
  verdict: 'inconclusive',
  summary: 'Observations incomplete',
  reason: 'A step did not settle, or the menu or the last action was not recorded.',
};

export const notJudged = (summary: string, reason: string): VerdictResult => ({
  verdict: 'inconclusive',
  summary,
  reason,
});

export const differs = (summary: string, reason: string): VerdictResult => ({
  verdict: 'differs',
  summary,
  reason,
});

export interface ActiveItem {
  name: string;
  /** Zero-based place among the items shown at that moment. */
  index: number;
  via: 'active-descendant' | 'dom-focus';
  isDisabled: boolean;
}

const itemAt = (
  popup: PopupState,
  index: number,
  via: ActiveItem['via'],
): ActiveItem | undefined => {
  const item = popup.options[index];
  return item && { name: item.name, index, via, isDisabled: item.states.disabled === true };
};

/**
 * The one definition of "active item" (menu-button-rules.ts): the item the focused menu names
 * with aria-activedescendant, or the item that holds DOM focus. APG gives both ways; which one a
 * system uses is recorded and never judged.
 */
export function activeItem({ focus, popup }: Moment): ActiveItem | undefined {
  const named = focus.activeDescendant;
  const index = named ? popup.options.findIndex(({ name }) => name === named.name) : -1;
  if (index !== -1) return itemAt(popup, index, 'active-descendant');
  return focus.item ? itemAt(popup, focus.item.index - 1, 'dom-focus') : undefined;
}

export const isShown = ({ options }: PopupState): boolean => options.length > 0;

/** The button is wherever focus was when the scenario started (initial state: focus on it). */
export const isButton = (focus: FocusInfo, input: EvaluatorInput): boolean => {
  const initial = input.steps[0]?.focusBefore;
  return (
    !!initial &&
    !focus.item &&
    !focus.isBody &&
    focus.isInsidePopup !== true &&
    focus.role === initial.role &&
    focus.name === initial.name
  );
};

/** Factual wording for reasons: `button "Actions"`, or `the document` when focus fell to body. */
export const describeFocus = ({ isBody, role, name }: FocusInfo): string =>
  isBody ? 'the document' : `${role ?? 'an element without a role'} "${name}"`;

export const describeItem = ({ name, index }: ActiveItem, of: number): string =>
  `"${name}" (${index + 1} of ${of})`;

export const isPress = ({ action }: Step, key: string): boolean =>
  action.type === 'press' && action.key === key;

/** The page's line changed with this step: an item's own handler ran. */
export const ranAnAction = ({ before, after }: ObservedStep): boolean =>
  after.effect !== before.effect;

/** The first step that pressed `key` while the menu was shown. */
export const firstInMenu = (steps: readonly ObservedStep[], key: string) =>
  steps.find((observed) => isPress(observed.step, key) && isShown(observed.before.popup));

/** The Enter that acts on an item: the last one pressed while the menu was shown. */
export const enterOnItem = (steps: readonly ObservedStep[]) =>
  steps.findLast((observed) => isPress(observed.step, 'Enter') && isShown(observed.before.popup));
