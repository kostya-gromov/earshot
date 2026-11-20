import type { FocusInfo, Step, TabSetState, VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';

/** Focus and the tab set before or after a step. */
export interface Moment {
  focus: FocusInfo;
  tabSet: TabSetState;
}

export interface ObservedStep {
  step: Step;
  before: Moment;
  after: Moment;
}

/** The scenario's steps with everything a tabs rule reads, or undefined when any part is missing. */
export function observedSteps(input: EvaluatorInput): readonly ObservedStep[] | undefined {
  if (input.steps.length === 0) return undefined;
  const observed: ObservedStep[] = [];
  for (const step of input.steps) {
    if (!step.tabSet || !step.settle.quiet) return undefined;
    observed.push({
      step,
      before: { focus: step.focusBefore, tabSet: step.tabSet.before },
      after: { focus: step.focusAfter, tabSet: step.tabSet.after },
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
  reason: 'A step did not settle, or the tabs and panels were not recorded.',
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

export const follows = (summary: string, reason: string): VerdictResult => ({
  verdict: 'follows',
  summary,
  reason,
});

export const tabNamesOf = ({ tabs }: TabSetState): string[] => tabs.map(({ name }) => name);

/**
 * The one definition of "focused tab" (tabs-rules.ts): the tab the focused element names with
 * aria-activedescendant, or the tab that holds DOM focus. Undefined when focus is not on a tab.
 */
export function focusedTab({ focus, tabSet }: Moment): string | undefined {
  const names = tabNamesOf(tabSet);
  const named = focus.activeDescendant?.name;
  if (named !== undefined && names.includes(named)) return named;
  if (!focus.item) return undefined;
  // `item` counts the elements in the DOM, `tabs` only those in the tree; they line up only when
  // every tab is in the tree, so otherwise the focused tab's own name decides.
  if (focus.item.count === names.length) return names[focus.item.index - 1];
  return focus.role === 'tab' && names.includes(focus.name) ? focus.name : undefined;
}

/** The one definition of "active tab": the single tab exposed as selected, else undefined. */
export function activeTab({ tabs }: TabSetState): string | undefined {
  const selected = tabs.filter(({ states }) => states.selected === true);
  return selected.length === 1 ? selected[0]!.name : undefined;
}

/** Factual wording for reasons: `tab "Overview"`, or `the document` when focus fell to body. */
export const describeFocus = ({ isBody, role, name }: FocusInfo): string =>
  isBody ? 'the document' : `${role ?? 'an element without a role'} "${name}"`;

export const isPress = ({ action }: Step, key: string): boolean =>
  action.type === 'press' && action.key === key;

/** "the selection stayed on Overview" / "Activity became the active tab", for reasons. */
export function describeSelection(before: Moment, after: Moment): string {
  const was = activeTab(before.tabSet);
  const now = activeTab(after.tabSet);
  if (now === undefined) return 'no single tab was active afterwards';
  return now === was ? `the selection stayed on "${now}"` : `"${now}" became the active tab`;
}
