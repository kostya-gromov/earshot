import type { VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { arrowMoves } from './arrows.ts';
import {
  differs,
  follows,
  incomplete,
  notJudged,
  observedSteps,
  tabNamesOf,
  unsupported,
} from './facts.ts';

const arrowName = (key: string) => (key === 'ArrowRight' ? 'Right Arrow' : 'Left Arrow');

/** APG: Left Arrow on the first tab moves to the last; Right Arrow on the last, to the first. */
export function evaluateWrap(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'ends') return unsupported(input.scenarioId);
  const steps = observedSteps(input);
  if (!steps) return incomplete;
  const atEnds = arrowMoves(steps).filter(({ neighbour }) => neighbour === undefined);
  if (atEnds.length === 0) {
    return notJudged('No arrow at an end', 'No arrow key was pressed outward from an end tab.');
  }
  // Arrow keys that move focus nowhere, not even to a neighbour, are `arrows`' defect alone.
  if (arrowMoves(steps).every(({ from, landed }) => landed === from)) {
    return notJudged(
      'Arrow keys did not move focus',
      'No arrow key moved focus, at the ends or between neighbours; that is the arrows rule’s.',
    );
  }
  for (const { observed, key, from, landed } of atEnds) {
    const names = tabNamesOf(observed.before.tabSet);
    const other = key === 'ArrowLeft' ? names.at(-1) : names[0];
    if (landed === other) continue;
    const where = landed === undefined ? 'off the tabs' : `on "${landed}"`;
    return differs(
      'Arrow keys stop at the end',
      `${arrowName(key)} on "${from}" left focus ${where}, not on "${other}".`,
    );
  }
  const lines = atEnds.map(
    ({ key, from, landed }) => `${arrowName(key)} on "${from}" moved focus to "${landed}".`,
  );
  return { ...follows('Arrow keys wrap at the ends', lines.join(' ')), judgedSteps: atEnds.length };
}
