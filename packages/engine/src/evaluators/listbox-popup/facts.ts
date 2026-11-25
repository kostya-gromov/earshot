import type { FocusInfo, PopupState, Step, VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';

/** Focus and the popup at one moment: before or after a step's action. */
export interface Moment {
  focus: FocusInfo;
  popup: PopupState;
}

export interface ObservedStep {
  step: Step;
  before: Moment;
  after: Moment;
}

/** The scenario's steps with their popup states, or undefined when any is missing or unsettled. */
export function observedSteps(
  input: EvaluatorInput,
  count: number,
): readonly ObservedStep[] | undefined {
  if (input.steps.length < count) return undefined;
  const observed: ObservedStep[] = [];
  for (const step of input.steps) {
    if (!step.popup || !step.settle.quiet) return undefined;
    observed.push({
      step,
      before: { focus: step.focusBefore, popup: step.popup.before },
      after: { focus: step.focusAfter, popup: step.popup.after },
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
  reason: 'A step did not settle, or the popup was not recorded.',
};

export const notJudged = (summary: string, reason: string): VerdictResult => ({
  verdict: 'inconclusive',
  summary,
  reason,
});

export type ActiveVia = 'active-descendant' | 'dom-focus' | 'selected';

export interface ActiveOption {
  name: string;
  /** Zero-based place among the options shown at that moment. */
  index: number;
  via: ActiveVia;
}

const selectedIndexes = ({ options }: PopupState): number[] =>
  options.flatMap((option, index) => (option.states.selected === true ? [index] : []));

/**
 * The one definition of "active option" (combobox-rules.ts, select-rules.ts): the option the
 * focused element names with aria-activedescendant; or the option that holds DOM focus; or, when
 * neither exists, the one option exposed as selected. Which of the three it was is charged once,
 * by focus-stays.
 */
export function activeOption({ focus, popup }: Moment): ActiveOption | undefined {
  const names = popup.options.map(({ name }) => name);
  const named = focus.activeDescendant;
  if (named?.role === 'option' && names.includes(named.name)) {
    return { name: named.name, index: names.indexOf(named.name), via: 'active-descendant' };
  }
  const focused = focus.item && popup.options[focus.item.index - 1];
  if (focus.item && focused) {
    return { name: focused.name, index: focus.item.index - 1, via: 'dom-focus' };
  }
  return soleSelected(popup);
}

/** The third form: no reference and no DOM focus, and exactly one option exposed as selected. */
function soleSelected(popup: PopupState): ActiveOption | undefined {
  const [only, ...others] = selectedIndexes(popup);
  const option = only === undefined ? undefined : popup.options[only];
  if (only === undefined || others.length > 0 || !option) return undefined;
  return { name: option.name, index: only, via: 'selected' };
}

/** aria-activedescendant is set and does not lead to an option of the popup. */
export function pointsAwayFromOptions({ focus, popup }: Moment): boolean {
  if (focus.activeDescendantUnresolved) return true;
  const named = focus.activeDescendant;
  if (!named) return false;
  return named.role !== 'option' || !popup.options.some(({ name }) => name === named.name);
}

export const isShown = ({ options }: PopupState): boolean => options.length > 0;

export const selectedNames = (popup: PopupState): string[] =>
  selectedIndexes(popup).map((index) => popup.options[index]?.name ?? '');

/** The combobox is wherever focus was when the scenario started (initial state: focus in it). */
export const isCombobox = (focus: FocusInfo, input: EvaluatorInput): boolean => {
  const initial = input.steps[0]?.focusBefore;
  return (
    !!initial &&
    !focus.item &&
    focus.isInsideComponent === initial.isInsideComponent &&
    focus.role === initial.role &&
    focus.name === initial.name
  );
};

export const isOutsideComponent = ({ isBody, isInsideComponent, item }: FocusInfo): boolean =>
  !isBody && !isInsideComponent && !item;

/** Factual wording for reasons: `combobox "Fruit"`, or `the document` when focus fell to body. */
export const describeFocus = ({ isBody, role, name }: FocusInfo): string =>
  isBody ? 'the document' : `${role ?? 'an element without a role'} "${name}"`;

export const isPress = ({ action }: Step, key: string): boolean =>
  action.type === 'press' && action.key === key;

/** What one step shows against a rule: it follows, it differs (with the fact), or nothing to judge. */
export type StepReading = { follows: true } | { difference: string } | undefined;

export const isArrow = (step: Step): boolean =>
  isPress(step, 'ArrowDown') || isPress(step, 'ArrowUp');
