import type { VerdictResult } from '@earshot/contracts';

/** A scenario this evaluator was not written for: a registration bug made visible, not a finding. */
export const unsupported = (scenarioId: string): VerdictResult => ({
  verdict: 'inconclusive',
  summary: 'Scenario not supported',
  reason: `Unsupported scenario "${scenarioId}".`,
});

/** Too few settled observations to judge the rule. */
export const incomplete = (reason: string): VerdictResult => ({
  verdict: 'inconclusive',
  summary: 'Observations incomplete',
  reason,
});
