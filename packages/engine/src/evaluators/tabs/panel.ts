import type { TabSetState, VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { activeTab, differs, follows, incomplete, observedSteps } from './facts.ts';
import { everyMoment } from './moments.ts';

/**
 * The names the shown panel may carry. With one active tab, only its name. Without one, which
 * `selected` is charged with, any tab that could be the active one: the selected tabs if there
 * are several, every tab if none is selected.
 */
function acceptedNames(tabSet: TabSetState): string[] {
  const active = activeTab(tabSet);
  if (active !== undefined) return [active];
  const selected = tabSet.tabs.filter(({ states }) => states.selected === true);
  return (selected.length > 0 ? selected : tabSet.tabs).map(({ name }) => name);
}

function panelProblem(tabSet: TabSetState): string | undefined {
  const { panels } = tabSet;
  if (panels.length === 0) return 'no panel was shown';
  if (panels.length > 1) {
    return `${panels.length} panels were shown (${panels.map(({ name }) => `"${name}"`).join(', ')})`;
  }
  const accepted = acceptedNames(tabSet);
  const shown = panels[0]!.name;
  if (accepted.includes(shown)) return undefined;
  const named = shown === '' ? 'had no name' : `was named "${shown}"`;
  return `the shown panel ${named} while ${accepted.map((name) => `"${name}"`).join(' or ')} was the active tab`;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * APG: one panel displayed at a time, each panel labelled by its tab. Judged before the first key
 * and after every step.
 */
export function evaluatePanel(input: EvaluatorInput): VerdictResult {
  const steps = observedSteps(input);
  if (!steps) return incomplete;
  const moments = everyMoment(steps);
  for (const { tabSet, when } of moments) {
    const problem = panelProblem(tabSet);
    if (problem) {
      return {
        ...differs('Shown panel does not match its tab', `${capitalize(when)}, ${problem}.`),
        judgedSteps: moments.length,
      };
    }
  }
  return {
    ...follows(
      'One panel shown, named by its tab',
      `At each of the ${moments.length} recorded moments one panel was shown, named by the active tab.`,
    ),
    judgedSteps: moments.length,
  };
}
