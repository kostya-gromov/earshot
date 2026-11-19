import type { Step, VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { incomplete, unsupported } from './common-verdicts.ts';
import {
  chipPosition,
  describeFocus,
  isSameControl,
  observedSteps,
  removedFocusedNode,
  removedNode,
  showsNothing,
} from './facts.ts';

/**
 * The first press left focus where it was and the second still removed a chip. One principle,
 * shared with the arrows rule (ADR 0009, 2026-11-13): a chip counts as marked when focus, the
 * accessibility tree or an announcement shows it. A mark none of them shows (Chakra UI's
 * highlight on screen, from the scenario's starting state) is no mark for the person this rule
 * is written for, so it differs; the reason still says that the removal took two presses. The
 * verdict speaks for the recorded starting state only: the same component announces a highlight
 * right after a removal.
 */
const unmarkedFirstPress = (first: Step): VerdictResult => ({
  verdict: 'differs',
  summary: 'First Backspace shows no chip about to go',
  reason: `A removal took two presses: the first Backspace removed nothing, the second removed a chip. But after the first, focus was still on ${describeFocus(first.focusAfter)}, the accessibility tree did not change and nothing was announced, so nothing says which chip is about to go.`,
});

/** The tree changed or something was said, with focus in place: a mark the engine cannot read. */
const markedWithoutFocus: VerdictResult = {
  verdict: 'inconclusive',
  summary: 'First press marks a chip without moving focus',
  reason:
    'The first Backspace left focus where it was, but the accessibility tree changed or something was announced, and the second removed a chip. Whether that tells the user which chip is about to go cannot be read from focus.',
};

/** Two presses removed a chip, but the first never moved focus to it. */
function twoPressesWithoutFocus(first: Step, second: Step): VerdictResult | undefined {
  const stayed = isSameControl(first.focusAfter, first.focusBefore);
  if (!stayed || !removedNode(second)) return undefined;
  return showsNothing(first) ? unmarkedFirstPress(first) : markedWithoutFocus;
}

const notLastChip: VerdictResult = {
  verdict: 'differs',
  summary: 'First Backspace does not focus the last chip',
  reason: 'The first Backspace did not focus the last chip.',
};

export function evaluateBackspace(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'backspace-twice') {
    return unsupported(input.scenarioId);
  }
  const steps = observedSteps(input, 2);
  if (!steps) {
    return incomplete('Two settled Backspace observations are required.');
  }
  const [first, second] = steps;
  if (removedNode(first!)) {
    return {
      verdict: 'differs',
      summary: 'First Backspace removes a chip',
      reason: 'The first Backspace removed a chip immediately.',
    };
  }
  const chip = chipPosition(first!.focusAfter);
  const unfocused = chip ? undefined : twoPressesWithoutFocus(first!, second!);
  if (unfocused) return unfocused;
  if (!chip || chip.position !== chip.count) {
    return notLastChip;
  }
  if (!removedFocusedNode(second!)) {
    return {
      verdict: 'differs',
      summary: 'Second Backspace does not remove the chip',
      reason: 'The second Backspace did not remove the focused chip.',
    };
  }
  return {
    verdict: 'follows',
    summary: 'First press focuses the chip, second removes it',
    reason: 'Backspace focused the last chip, then removed it.',
  };
}
