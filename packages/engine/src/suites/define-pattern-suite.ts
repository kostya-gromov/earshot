import { NonEmpty, RuleId, Slug } from '@earshot/contracts';
import type { PatternSuite } from './types.ts';

function duplicate(values: readonly string[]): string | undefined {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return undefined;
}

function checkScenarios<State, InteractionId extends string>(
  suite: PatternSuite<State, InteractionId>,
  ruleIds: ReadonlySet<string>,
): void {
  const duplicateScenario = duplicate(suite.scenarios.map(({ id }) => id));
  if (duplicateScenario) throw new Error(`Duplicate scenario id "${duplicateScenario}".`);
  for (const scenario of suite.scenarios) {
    Slug.parse(scenario.id);
    NonEmpty.parse(scenario.requestedStateDescription);
    if (scenario.rules.length === 0) {
      throw new Error(`Scenario "${scenario.id}" must cover at least one rule.`);
    }
    if (scenario.steps.length === 0) {
      throw new Error(`Scenario "${scenario.id}" must contain at least one step.`);
    }
    for (const ruleId of scenario.rules) {
      RuleId.parse(ruleId);
      if (!ruleIds.has(ruleId)) {
        throw new Error(`Scenario "${scenario.id}" references unknown rule "${ruleId}".`);
      }
    }
  }
}

function checkRules<State, InteractionId extends string>(
  suite: PatternSuite<State, InteractionId>,
  ruleIds: ReadonlySet<string>,
): void {
  for (const ruleId of ruleIds) {
    if (!suite.evaluators[ruleId]) throw new Error(`Missing evaluator for rule "${ruleId}".`);
    if (!suite.scenarios.some(({ rules }) => rules.includes(ruleId))) {
      throw new Error(`No scenario covers rule "${ruleId}".`);
    }
  }
  for (const ruleId of Object.keys(suite.evaluators)) {
    if (!ruleIds.has(ruleId)) throw new Error(`Evaluator references unknown rule "${ruleId}".`);
  }
}

export function definePatternSuite<State, InteractionId extends string>(
  suite: PatternSuite<State, InteractionId>,
): PatternSuite<State, InteractionId> {
  const ruleIds = new Set(suite.pattern.rules.map(({ id }) => id));
  checkScenarios(suite, ruleIds);
  checkRules(suite, ruleIds);
  const duplicateTarget = duplicate(suite.targets.map(({ id }) => id));
  if (duplicateTarget) throw new Error(`Duplicate target id "${duplicateTarget}".`);
  return suite;
}
