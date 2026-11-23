import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { isSameElement } from '../../model/same-element.ts';
import {
  describeFocus,
  differs,
  follows,
  isInside,
  isVerdict,
  notJudged,
  type ObservedStep,
} from './facts.ts';
import { runKey, tabRun } from './tab-run.ts';

const leftDialog = ({ after }: ObservedStep) => !isInside(after) && !after.focus.leftPage;

/**
 * The first press that came back to an element the run had already rested on, having moved to
 * get there. It shows that the run came round; it need not be the press that went round the end
 * (going backwards from the first element, that one is the first press).
 */
function returnIndex(run: readonly ObservedStep[]): number {
  return run.findIndex((observed, index) => {
    const moved = !isSameElement(observed.before.focus, observed.after.focus);
    const seen = [run[0]!.before, ...run.slice(0, index).map(({ after }) => after)];
    return moved && seen.some(({ focus }) => isSameElement(focus, observed.after.focus));
  });
}

const rests = (run: readonly ObservedStep[]) =>
  run.map(({ after }) => describeFocus(after.focus)).join(', ');

/** Only what was recorded: the page lost focus, and whether a later press was inside the dialog. */
function leftPageReason(run: readonly ObservedStep[], leftAt: number): string {
  const left = run[leftAt]!;
  const returned = run.slice(leftAt + 1).find(({ after }) => isInside(after));
  const went = `${runKey(run)} on ${describeFocus(left.before.focus)} took focus off the page: the document no longer had focus`;
  return returned
    ? `${went}. A later press put it on ${describeFocus(returned.after.focus)}, inside the dialog.`
    : `${went}, and no later press of the run put it back inside the dialog.`;
}

/**
 * APG: Tab on the last tabbable element moves focus to the first, Shift+Tab on the first to the
 * last. Read from where focus rested: a run in one direction can only come back to an element
 * it has been on by going round the end.
 */
export function evaluateWrap(input: EvaluatorInput): VerdictResult {
  const run = tabRun(input);
  if (isVerdict(run)) return run;
  const key = runKey(run);
  if (run.some(leftDialog)) {
    return notJudged(
      'Focus left the dialog',
      `${key} put focus outside the dialog; that is the question of “Tab stays inside the dialog”.`,
    );
  }
  const leftAt = run.findIndex(({ after }) => after.focus.leftPage);
  if (leftAt !== -1) {
    return {
      ...differs('Tab leaves the page at the end', leftPageReason(run, leftAt)),
      judgedSteps: run.length,
    };
  }
  const stuck = run.find(({ before, after }) => isSameElement(before.focus, after.focus));
  if (stuck) {
    return {
      ...differs(
        'Tab stops at the end',
        `${key} on ${describeFocus(stuck.before.focus)} left focus where it was.`,
      ),
      judgedSteps: run.length,
    };
  }
  const backAt = returnIndex(run);
  const back = run[backAt];
  if (!back) {
    return notJudged(
      'The run did not come round',
      `${run.length} presses of ${key} did not come back to an element focus had been on: ${rests(run)}.`,
    );
  }
  return {
    ...follows(
      'Tab wraps at the ends',
      `${key} came round inside the dialog: after ${backAt + 1} presses focus was again on ${describeFocus(back.after.focus)}. Focus rested on: ${rests(run)}.`,
    ),
    judgedSteps: run.length,
  };
}
