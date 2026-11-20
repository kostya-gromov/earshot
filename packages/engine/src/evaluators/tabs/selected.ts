import type { TabSetState, VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { differs, follows, incomplete, notJudged, observedSteps } from './facts.ts';
import { everyMoment } from './moments.ts';

/** What is wrong with the tab set's selected states, or undefined when exactly one is selected. */
function selectionProblem({ tabs }: TabSetState): string | undefined {
  const selected = tabs.filter(({ states }) => states.selected === true).map(({ name }) => name);
  const stateless = tabs
    .filter(({ states }) => states.selected === undefined)
    .map(({ name }) => name);
  if (selected.length === 0) return 'no tab was selected';
  if (selected.length > 1) return `${selected.length} tabs were selected (${selected.join(', ')})`;
  if (stateless.length > 0) {
    return `the tree gave ${stateless.map((name) => `"${name}"`).join(', ')} no selected state`;
  }
  return undefined;
}

/**
 * APG: "The active tab element has the state aria-selected set to true and all other tab
 * elements have it set to false." Judged before the first key and after every step.
 */
export function evaluateSelected(input: EvaluatorInput): VerdictResult {
  const steps = observedSteps(input);
  if (!steps) return incomplete;
  const moments = everyMoment(steps);
  if (moments.some(({ tabSet }) => tabSet.tabs.length === 0)) {
    return notJudged('No tabs recorded', 'At some moment no tab was in the accessibility tree.');
  }
  for (const { tabSet, when } of moments) {
    const problem = selectionProblem(tabSet);
    if (problem)
      return {
        ...differs('Not exactly one tab selected', `${capitalize(when)}, ${problem}.`),
        judgedSteps: moments.length,
      };
  }
  return {
    ...follows(
      'Exactly one tab selected',
      `At each of the ${moments.length} recorded moments exactly one tab was selected and every other tab was not.`,
    ),
    judgedSteps: moments.length,
  };
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
