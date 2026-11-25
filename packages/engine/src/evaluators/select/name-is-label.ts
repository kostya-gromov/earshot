import type { AccessibleNode, VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import { shortfall } from './name-and-value.ts';
import {
  describeFocus,
  incomplete,
  hasValue,
  isOnSelect,
  nameHoldsValue,
  notJudged,
  observedSteps,
  plainText,
  selectNode,
  unsupported,
  type ObservedStep,
} from './facts.ts';

/**
 * The shortfalls of name-and-value that concern the name: no combobox role (a button that
 * carries the chosen option in its name), an empty name, a name holding the value. A select
 * with no value but a name that is its label is judged here (2026-11-24): the missing
 * value is name-and-value's alone.
 */
const isNameCharged = (select: AccessibleNode): boolean =>
  select.role !== 'combobox' || select.name.trim() === '' || nameHoldsValue(select);

/**
 * With no value, a name that is more than the label may be carrying the chosen option, which
 * name-and-value already charges for the missing value (verdict audit, 2026-11-24): not judged
 * here, so one defect differs in one rule. A no-value name that is its label is still judged.
 */
const isNoValueNameCharged = (select: AccessibleNode, label: string): boolean =>
  !hasValue(select) && plainText(select.name) !== plainText(label);

/** Focus elsewhere, a name charged to name-and-value, or a label with no text. */
function notJudgedHere(after: ObservedStep['after'], label: string): VerdictResult | undefined {
  const { focus } = after;
  if (!isOnSelect(focus, selectNode(after))) {
    return notJudged('Focus was not on the select', `Tab put focus on ${describeFocus(focus)}.`);
  }
  const isCharged = isNameCharged(focus) || isNoValueNameCharged(focus, label);
  const charged = isCharged ? shortfall(focus) : undefined;
  if (charged) {
    return notJudged(
      'Charged to the name and value',
      `When the select had focus, ${charged}; that is charged to "A name, and the value apart from it".`,
    );
  }
  if (label.trim() === '') {
    return notJudged('No visible label', 'The label the adapter locates showed no text.');
  }
  return undefined;
}

/**
 * Earshot recommendation: the select's name is its visible label and nothing more, case and
 * punctuation aside. The label is what the page showed, recorded on the step. Not judged where
 * name-and-value already differs on the name: one defect, one rule.
 */
export function evaluateNameIsLabel(input: EvaluatorInput): VerdictResult {
  if (input.scenarioId !== 'tab-in') return unsupported(input.scenarioId);
  const step = observedSteps(input, 1)?.at(-1);
  const label = step?.step.label?.after;
  if (!step || label === undefined) return incomplete;
  const { focus } = step.after;
  const skipped = notJudgedHere(step.after, label);
  if (skipped) return skipped;
  if (plainText(focus.name) === plainText(label)) {
    return {
      verdict: 'follows',
      summary: 'The name is the visible label',
      reason: `The select was named "${focus.name}", and its visible label read "${label}".`,
    };
  }
  return {
    verdict: 'differs',
    summary: 'The name is not the visible label',
    reason: `The select was named "${focus.name}", and its visible label read "${label}".`,
  };
}
