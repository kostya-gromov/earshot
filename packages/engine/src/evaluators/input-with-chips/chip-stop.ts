import type { Step, VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput, Precondition } from '../../model/evaluator.ts';
import { incomplete, unsupported } from './common-verdicts.ts';
import { chipPosition, describeFocus, isSameControl, observedSteps } from './facts.ts';
import { separateControls, separateControlsReason } from './separate-controls.ts';

const keyOf: Readonly<Record<string, string>> = {
  'chip-tab': 'Tab',
  'chip-shift-tab': 'Shift+Tab',
};

/** Where Tab landed if it did not leave the chips: another chip, the same chip, or inside it. */
function stayedInChips(
  step: Step,
  { from, key }: { from: number; key: string },
): VerdictResult | undefined {
  const to = chipPosition(step.focusAfter);
  const isSameChip = to?.position === from;
  if (to && isSameChip && !isSameControl(step.focusAfter, step.focusBefore)) {
    return {
      verdict: 'differs',
      summary: `${key} stops on a control inside the chip`,
      reason: `From chip ${from}, ${key} moved focus to ${describeFocus(step.focusAfter)} inside the same chip: a second Tab stop within the chips.`,
    };
  }
  if (to && !isSameControl(step.focusAfter, step.focusBefore)) {
    return {
      verdict: 'differs',
      summary: `${key} moves to another chip`,
      reason: `From chip ${from}, ${key} moved focus to chip ${to.position}: each chip is its own Tab stop.`,
    };
  }
  if (to) {
    return {
      verdict: 'differs',
      summary: `${key} stays on the chip`,
      reason: `From chip ${from}, ${key} left focus on the same chip.`,
    };
  }
  return undefined;
}

/**
 * APG roving tabindex: a composite widget is one Tab stop. Judged on the chips alone, from the
 * last chip, so it holds whether a system joins the chips to the input or not (2026-11-10).
 */
export function evaluateChipStop(input: EvaluatorInput): VerdictResult {
  const key = keyOf[input.scenarioId];
  if (!key) return unsupported(input.scenarioId);
  const steps = observedSteps(input, 1);
  if (!steps) return incomplete('The Tab observation is incomplete.');
  const [step] = steps;
  const from = chipPosition(step!.focusBefore);
  if (!from) {
    return {
      verdict: 'inconclusive',
      summary: 'Did not start on a chip',
      reason: `Focus was on ${describeFocus(step!.focusBefore)}, not on a chip, before ${key}.`,
    };
  }
  const landed = stayedInChips(step!, { from: from.position, key });
  if (landed) return landed;
  return {
    verdict: 'follows',
    summary: `${key} leaves the chips`,
    reason: `From chip ${from.position}, ${key} left the chips for ${describeFocus(step!.focusAfter)}.`,
  };
}

/**
 * APG asks for one Tab stop inside a composite widget; separate controls with no arrow keys
 * between them are not one, so the rule does not apply (verdict audit 2026-11-11, B1).
 */
export const chipStopPrecondition: Precondition = (scenarios) => {
  const separate = separateControls(scenarios);
  if (!separate) return undefined;
  return {
    verdict: 'not-applicable',
    summary: 'Separate controls, not one widget',
    reason: separateControlsReason(separate),
  };
};
