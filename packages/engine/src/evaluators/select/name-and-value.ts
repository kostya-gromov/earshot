import type { AccessibleNode, VerdictResult } from '@earshot/contracts';
import type { EvaluatorInput } from '../../model/evaluator.ts';
import {
  describeFocus,
  incomplete,
  isOnSelect,
  nameHoldsValue,
  notJudged,
  observedSteps,
  selectNode,
  unsupported,
} from './facts.ts';

const judgedScenarios: ReadonlySet<string> = new Set(['tab-in', 'enter']);

function shortfalls(select: AccessibleNode): string[] {
  const found: string[] = [];
  if (select.role !== 'combobox') {
    found.push(
      `it was exposed as ${select.role ?? 'an element without a role'}, not as a combobox`,
    );
  }
  const hasName = select.name.trim() !== '';
  if (!hasName) found.push('its name was empty');
  if ((select.treeValue ?? '') === '') {
    found.push(
      hasName ? `it exposed no value; its name was "${select.name}"` : 'it exposed no value',
    );
  } else if (nameHoldsValue(select)) {
    found.push(`its name "${select.name}" contains its value "${select.treeValue ?? ''}"`);
  }
  return found;
}

/**
 * Every way the focused select falls short of a role, a name and a value apart from it, in one
 * phrase: a rule that leaves a select to this one finds its own reason here (verdict audit,
 * 2026-11-24: a reason that named only the role hid the missing value).
 */
export function shortfall(select: AccessibleNode): string | undefined {
  const found = shortfalls(select);
  if (found.length < 2) return found[0];
  return `${found.slice(0, -1).join(', ')}, and ${found.at(-1) ?? ''}`;
}

/**
 * APG: a combobox has a name distinct from its value. Judged on the focused select after the
 * scenario's last step: arriving by Tab, and after Enter. Which option the value holds after
 * Enter is "Enter chooses the active option", not this rule.
 */
export function evaluateNameAndValue(input: EvaluatorInput): VerdictResult {
  if (!judgedScenarios.has(input.scenarioId)) return unsupported(input.scenarioId);
  const last = observedSteps(input, 1)?.at(-1);
  if (!last) return incomplete;
  const { focus } = last.after;
  if (!isOnSelect(focus, selectNode(last.after))) {
    return notJudged(
      'Focus was not on the select',
      `After the last step focus was on ${describeFocus(focus)}, so the focused select could not be read.`,
    );
  }
  const problem = shortfall(focus);
  if (problem) {
    return {
      verdict: 'differs',
      summary: 'Name and value are not apart',
      reason: `When the select had focus, ${problem}.`,
    };
  }
  return {
    verdict: 'follows',
    summary: 'A name, and the value apart from it',
    reason: `The focused combobox was named "${focus.name}" and had the value "${focus.treeValue ?? ''}".`,
  };
}
