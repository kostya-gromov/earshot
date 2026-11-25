import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  activeOption,
  describeFocus,
  incomplete,
  isOnSelect,
  isArrow,
  isPress,
  notJudged,
  observedSteps,
  selectNode,
  unsupported,
  type ObservedStep,
} from './facts.ts';

/** What a key at an end of the list did; all three follow, and which one is recorded. */
type EndOutcome = 'stayed' | 'returned to the select' | 'moved on to the other end';

type Reading = { kind: 'move' } | { kind: 'end'; outcome: EndOutcome } | { difference: string };

const place = (index: number, name: string) => `option ${index + 1}, "${name}"`;

/**
 * No option active after a key at an end: that returned to the select only where focus is on it
 * (verdict audit, 2026-11-24); focus lost to the page or left elsewhere is no return.
 */
function readReturn({ after }: ObservedStep, key: string): Reading {
  if (isOnSelect(after.focus, selectNode(after))) {
    return { kind: 'end', outcome: 'returned to the select' };
  }
  return {
    difference: `${key} option left no option active, and focus was on ${describeFocus(after.focus)}, not on the select`,
  };
}

/**
 * At an end, the key does nothing, returns to the select, or moves on to the other end: APG's
 * pattern names the first two and does not rule out the third (2026-11-24). Landing
 * anywhere else differs.
 */
function readEnd(observed: ObservedStep, from: { index: number; name: string }): Reading {
  const to = activeOption(observed.after);
  const isDown = isPress(observed.step, 'ArrowDown');
  const key = isDown ? 'Down Arrow at the last' : 'Up Arrow at the first';
  if (!to) return readReturn(observed, key);
  if (to.index === from.index) return { kind: 'end', outcome: 'stayed' };
  const otherEnd = isDown ? 0 : observed.before.popup.options.length - 1;
  if (to.index === otherEnd) return { kind: 'end', outcome: 'moved on to the other end' };
  return { difference: `${key} option made ${place(to.index, to.name)} active` };
}

function readStep(observed: ObservedStep): Reading | undefined {
  const from = activeOption(observed.before);
  if (!from || !isArrow(observed.step)) return undefined;
  const delta = isPress(observed.step, 'ArrowDown') ? 1 : -1;
  const expected = from.index + delta;
  if (expected < 0 || expected >= observed.before.popup.options.length) {
    return readEnd(observed, from);
  }
  const to = activeOption(observed.after);
  if (to?.index === expected) return { kind: 'move' };
  const landed = to ? place(to.index, to.name) : 'no option';
  return {
    difference: `from ${place(from.index, from.name)}, ${delta === 1 ? 'Down' : 'Up'} Arrow made ${landed} active; option ${expected + 1} was expected`,
  };
}

/** "stayed (1), moved on to the other end (1)", in the order first seen. */
function endWords(ends: readonly EndOutcome[]): string {
  if (ends.length === 0) return 'No end of the list was reached.';
  const counts = new Map<EndOutcome, number>();
  for (const outcome of ends) counts.set(outcome, (counts.get(outcome) ?? 0) + 1);
  const listed = [...counts].map(([outcome, count]) => `${outcome} (${count})`).join(', ');
  return `At an end of the list: ${listed}. APG names doing nothing and returning to the select, and does not rule out moving on.`;
}

/** APG: arrows move to the next or previous option; what they do at an end is recorded. */
export function evaluateArrows(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'move') return unsupported(input.scenarioId);
  const steps = observedSteps(input, 1);
  if (!steps) return incomplete;
  let moves = 0;
  const ends: EndOutcome[] = [];
  for (const [index, observed] of steps.entries()) {
    const reading = readStep(observed);
    if (!reading) continue;
    if ('difference' in reading) {
      return {
        verdict: 'differs',
        summary: 'Arrows do not move as APG describes',
        reason: `In step ${index + 1}, ${reading.difference}.`,
      };
    }
    if (reading.kind === 'move') moves += 1;
    else ends.push(reading.outcome);
  }
  if (moves + ends.length === 0) {
    return notJudged(
      'No option became active',
      'No arrow key started from an active option, so there was nothing to judge. "Down Arrow opens the list on an option" covers it.',
    );
  }
  return {
    verdict: 'follows',
    summary: 'Arrows move through the options',
    reason: `In ${moves} steps an arrow key moved to the next or previous option. ${endWords(ends)}`,
  };
}
