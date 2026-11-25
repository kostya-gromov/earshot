import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  activeOption,
  hasValue,
  incomplete,
  isPress,
  noOpener,
  noValue,
  notJudged,
  observedSteps,
  selectNode,
  unsupported,
  type ObservedStep,
} from './facts.ts';

/** The scenario's first step and its closing Escape, or undefined when either is missing. */
function firstAndEscape(input: EvaluatorInput): [ObservedStep, ObservedStep] | undefined {
  const steps = observedSteps(input, 1);
  const [first, escape] = [steps?.[0], steps?.at(-1)];
  return first && escape && isPress(escape.step, 'Escape') ? [first, escape] : undefined;
}

interface Values {
  was: string;
  is: string;
}

/** The value before the list opened and after Escape, or the verdict when they cannot be read. */
function readValues(first: ObservedStep, escape: ObservedStep): Values | VerdictResult {
  const [start, end] = [selectNode(first.before), selectNode(escape.after)];
  if (!start || !end) return noOpener;
  if (!hasValue(start) || !hasValue(end)) return noValue;
  return { was: start.treeValue ?? '', is: end.treeValue ?? '' };
}

/**
 * Earshot recommendation: after the arrows move to another option, Escape leaves the value as it
 * was before the list opened. Read from the select itself, so judged wherever focus went.
 */
export function evaluateEscapeKeepsValue(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'escape') return unsupported(input.scenarioId);
  const ends = firstAndEscape(input);
  if (!ends) return incomplete;
  const [first, escape] = ends;
  const values = readValues(first, escape);
  if ('verdict' in values) return values;
  const { was, is } = values;
  const active = activeOption(escape.before);
  if (!active || active.name === was) {
    return notJudged(
      'No other option was active',
      `Before Escape no option other than the value "${was}" was active, so keeping it shows nothing.`,
    );
  }
  if (is === was) {
    return {
      verdict: 'follows',
      summary: 'Escape keeps the value',
      reason: `With "${active.name}" active, Escape closed the list and the value stayed "${was}".`,
    };
  }
  return {
    verdict: 'differs',
    summary: 'Escape changes the value',
    reason: `The value was "${was}" before the list opened; with "${active.name}" active, after Escape it was "${is}".`,
  };
}
