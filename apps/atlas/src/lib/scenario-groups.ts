/** A scenario's own result for a rule: what decides whether two scenarios say the same thing. */
export interface ScenarioResult {
  scenario: string;
  verdict: string;
  /** The evaluator's own short statement of the result, without numbers. */
  summary: string;
  /** The scenario's own reason, word for word; empty when the file gives none. */
  reason: string;
  /** How many steps the evaluator judged, when the file records it. */
  judgedSteps?: number | undefined;
  /** How many steps the scenario recorded, when its recording is at hand. */
  recordedSteps?: number | undefined;
}

export interface ScenarioRow<S> {
  scenario: S;
  /** Scenarios that say the same as this one but for their step counts, folded under it. */
  same: readonly S[];
}

/**
 * Fewer than this many alike are all shown. A fold costs a row of its own (the button), so it
 * has to hide at least three: with three alike it would trade three rows for two and hide the
 * recordings of a short list for nothing (input with chips has many rules with three scenarios).
 */
const smallestFold = 4;

/** The steps a scenario recorded and did not judge; undefined when either count is unknown. */
export function notJudgedSteps({ judgedSteps, recordedSteps }: ScenarioResult): number | undefined {
  if (judgedSteps === undefined || recordedSteps === undefined) return undefined;
  return Math.max(0, recordedSteps - judgedSteps);
}

/**
 * A reason with this scenario's own step counts taken out, for comparison only. Only the numbers
 * the file gives as its counts of judged and not judged steps are set aside: any other number in
 * the sentence (a position, a count of items) has to match like every word does. A scenario
 * whose file records no count is compared word for word (2026-11-16).
 */
function withoutStepCounts(result: ScenarioResult): string {
  if (result.judgedSteps === undefined) return result.reason;
  const counts = new Set([result.judgedSteps, notJudgedSteps(result)]);
  return result.reason.replace(/\d+/g, (digits) => (counts.has(Number(digits)) ? '#' : digits));
}

/** What two scenarios must share to be alike; undefined for one that is never folded. */
function keyOf(result: ScenarioResult | undefined): string | undefined {
  if (!result || result.reason === '') return undefined;
  return [result.verdict, result.summary, withoutStepCounts(result)].join('\u0000');
}

/**
 * The scenarios of a rule as rows, with those that say the same folded under one of them. Two
 * scenarios are alike only when their verdict and their summary are the same and their reasons
 * match word for word once each one's own step counts are set aside. A scenario with no reason
 * of its own is never folded. The scenario that decided the verdict is always a row of its own,
 * never inside a fold.
 */
export function groupScenarios<S extends { id: string }>(
  scenarios: readonly S[],
  results: readonly ScenarioResult[],
  deciding: string | undefined,
): ScenarioRow<S>[] {
  const keys = new Map(
    scenarios.map(({ id }) => [id, keyOf(results.find((entry) => entry.scenario === id))]),
  );
  const alike = (id: string) => {
    const key = keys.get(id);
    return key === undefined ? [] : scenarios.filter((other) => keys.get(other.id) === key);
  };
  const folded = new Set<string>();
  const rows: ScenarioRow<S>[] = [];
  for (const scenario of scenarios) {
    if (folded.has(scenario.id)) continue;
    const group = alike(scenario.id);
    if (group.length < smallestFold) {
      rows.push({ scenario, same: [] });
      continue;
    }
    // The deciding scenario leads its group; otherwise the first in the order shown.
    const lead = group.find(({ id }) => id === deciding) ?? scenario;
    const same = group.filter(({ id }) => id !== lead.id);
    same.forEach(({ id }) => folded.add(id));
    folded.add(lead.id);
    rows.push({ scenario: lead, same });
  }
  return rows;
}
