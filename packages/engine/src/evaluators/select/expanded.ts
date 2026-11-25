import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  incomplete,
  isOnSelect,
  isShown,
  notJudged,
  observedSteps,
  selectNode,
  type Moment,
} from './facts.ts';

type Reading = 'shown' | 'hidden' | 'away' | 'not-judged' | { difference: string };

/**
 * One moment against the rule. Not judged (select-rules.ts): focus away from the select, a
 * select that exposes no expanded state, and a listbox with no options.
 */
function read(moment: Moment): Reading {
  const { focus, popup } = moment;
  if (!isOnSelect(focus, selectNode(moment))) return 'away';
  if (focus.states.expanded === undefined) return 'not-judged';
  if (isShown(popup)) {
    return focus.states.expanded
      ? 'shown'
      : {
          difference: `${popup.options.length} options were in the tree while the select was exposed as collapsed`,
        };
  }
  if (popup.present) return 'not-judged';
  return focus.states.expanded
    ? { difference: 'no option was in the tree while the select was exposed as expanded' }
    : 'hidden';
}

/**
 * Focus away from the select in every step is the rule's own exclusion, told apart from a select
 * that exposes no expanded state (verdict audit, 2026-11-24): DOM focus in the list is charged
 * to "Focus stays on the select", not here.
 */
function nothingJudged(allAway: boolean): VerdictResult {
  if (allAway) {
    return notJudged(
      'Focus was not on the select',
      'After every step DOM focus was away from the select, in the list or elsewhere; the rule is about the focused select.',
    );
  }
  return notJudged(
    'No expanded state to read',
    'In no step did the focused select expose an expanded state next to a list the engine could read.',
  );
}

/**
 * Follows. Where no judged step had the list shown, only the collapsed half was seen, and the
 * summary says so: a select whose focus leaves for the list is never judged expanded (verdict
 * audit, 2026-11-24).
 */
function follows(judged: number, shown: number, total: number): VerdictResult {
  const steps = judged === 1 ? 'the one step' : `each of the ${judged} steps`;
  const counts = `${steps} judged (${total - judged} not judged)`;
  if (shown === 0) {
    return {
      verdict: 'follows',
      summary: 'Collapsed matches; the list shown was not judged',
      reason: `The select was exposed as collapsed with no option in the tree after ${counts}; in no judged step was the list shown.`,
      judgedSteps: judged,
    };
  }
  return {
    verdict: 'follows',
    summary: 'Expanded matches the list',
    reason: `The expanded state matched whether options were in the tree after ${counts}.`,
    judgedSteps: judged,
  };
}

export function evaluateExpanded(input: EvaluatorInput): VerdictResult {
  const steps = observedSteps(input, 1);
  if (!steps) return incomplete;
  let [judged, shown, away] = [0, 0, 0];
  for (const [index, { after }] of steps.entries()) {
    const reading = read(after);
    if (reading === 'away') away += 1;
    if (reading === 'away' || reading === 'not-judged') continue;
    judged += 1;
    if (reading === 'shown') shown += 1;
    if (typeof reading === 'object') {
      return {
        verdict: 'differs',
        summary: 'Expanded does not match the list',
        reason: `After step ${index + 1}, ${reading.difference}.`,
      };
    }
  }
  // The count is given even when it is nought: the site folds scenarios by it.
  if (judged === 0) return { ...nothingJudged(away === steps.length), judgedSteps: 0 };
  return follows(judged, shown, steps.length);
}
