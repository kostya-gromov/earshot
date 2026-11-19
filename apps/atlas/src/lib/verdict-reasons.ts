import type { Measurement, Scenario } from '@earshot/contracts';

export interface ScenarioReason {
  /** Undefined when the evaluator wrote one reason for the whole rule. */
  scenarioId: string | undefined;
  text: string;
  /** False for scenarios listed after "Not judged:" (ADR 0004): they could not decide. */
  isJudged: boolean;
}

const notJudged = /\s*Not judged:\s*$/;

/**
 * The aggregated reason reads "[a] text. [b] text. Not judged: [c] text." (ADR 0004). Splitting it
 * lets each recorded scenario carry its own sentence instead of the whole paragraph.
 */
export function reasonsByScenario(reason: string): ScenarioReason[] {
  const parts = reason.split(/\[([a-z0-9-]+)\]\s*/);
  if (parts.length === 1) return [{ scenarioId: undefined, text: reason.trim(), isJudged: true }];
  const reasons: ScenarioReason[] = [];
  let isJudged = true;
  for (let index = 1; index < parts.length; index += 2) {
    const text = parts[index + 1] ?? '';
    reasons.push({ scenarioId: parts[index], text: text.replace(notJudged, '').trim(), isJudged });
    if (notJudged.test(text)) isJudged = false;
  }
  return reasons;
}

export interface RuleScenario {
  scenario: Scenario;
  reason: ScenarioReason | undefined;
}

/** The scenarios that exercise a rule, the ones its reason names first and in that order. */
export function scenariosForRule(measurement: Measurement, ruleId: string): RuleScenario[] {
  const verdict = measurement.verdicts[ruleId];
  const reasons = verdict ? reasonsByScenario(verdict.reason) : [];
  const rank = (id: string) => {
    const index = reasons.findIndex(({ scenarioId }) => scenarioId === id);
    return index === -1 ? reasons.length : index;
  };
  return measurement.scenarios
    .filter(({ rules }) => rules.includes(ruleId))
    .map((scenario) => ({
      scenario,
      reason: reasons.find(({ scenarioId }) => scenarioId === scenario.id),
    }))
    .sort((a, b) => rank(a.scenario.id) - rank(b.scenario.id));
}
