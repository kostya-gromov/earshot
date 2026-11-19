import type { VerdictResult } from '@earshot/contracts';

/*
 * One rule's verdict from the scenarios that cover it (ADR 0004). Runs of one scenario are
 * compared in run-results.ts; this module only combines scenario results.
 */

export interface RuleEvidence {
  scenarioId: string;
  result: VerdictResult;
  /** The scenario's runs completed and agreed, so its observations can be trusted. */
  reliable: boolean;
}

const describeEntries = (entries: readonly RuleEvidence[]): string =>
  entries.map(({ scenarioId, result }) => `[${scenarioId}] ${result.reason}`).join(' ');

/** The first deciding scenario's phrase stands for the rule; the reason lists every one. */
const deciding = (entries: readonly RuleEvidence[]) => ({
  summary: entries[0]!.result.summary,
  reason: describeEntries(entries),
});

/** Scenarios that could not judge a rule may say why in different ways; none is the rule's. */
function everySummary(entries: readonly RuleEvidence[]): string {
  const summaries = [...new Set(entries.map(({ result }) => result.summary))];
  const joined = summaries
    .map((summary, index) =>
      index === 0 ? summary : summary.charAt(0).toLowerCase() + summary.slice(1),
    )
    .join('; ');
  // Summaries are short phrases (at most 60 characters); the reason always lists every one.
  return joined.length <= 60 ? joined : `${summaries[0]} (+${summaries.length - 1} more)`;
}

const withVerdict = (entries: readonly RuleEvidence[], verdict: VerdictResult['verdict']) =>
  entries.filter(({ result }) => result.verdict === verdict);

/** Each covering scenario's own result, so the page can show what decided the verdict. */
const basisOf = (entries: readonly RuleEvidence[]): NonNullable<VerdictResult['basis']> =>
  entries.map(({ scenarioId, result }) => ({
    scenario: scenarioId,
    verdict: result.verdict,
    summary: result.summary,
    ...(result.judgedSteps === undefined ? {} : { judgedSteps: result.judgedSteps }),
  }));

/** A judged verdict stands for the rule; scenarios that could not judge stay in its reason. */
function judged(
  verdict: 'differs' | 'follows',
  entries: readonly RuleEvidence[],
): Omit<VerdictResult, 'basis'> {
  const deciders = withVerdict(entries, verdict);
  const unjudged = withVerdict(entries, 'inconclusive');
  const note = unjudged.length > 0 ? ` Not judged: ${describeEntries(unjudged)}` : '';
  // A difference in one scenario must not read as a difference in all (verdict audit 2026-11-14:
  // MUI's Down Arrow differs from an empty field and follows once the list is shown).
  const followers = verdict === 'differs' ? withVerdict(entries, 'follows') : [];
  const elsewhere = followers.length > 0 ? ` Follows in: ${describeEntries(followers)}` : '';
  return {
    verdict,
    summary: deciding(deciders).summary,
    reason: describeEntries(deciders) + elsewhere + note,
  };
}

/**
 * ADR 0004, amended 2026-11-07 and 2026-11-11. Unreliable runs (flaky, setup failed, errored) make
 * the rule inconclusive: nothing they show is trusted. Otherwise a judged result stands on its
 * own: any difference makes the rule differ, else any scenario that follows makes it follow, and
 * the scenarios that could not judge it are named in the reason. Only when no scenario could
 * judge is the rule inconclusive. Every result records each scenario's own outcome as its basis.
 */
export function aggregateRuleVerdicts(
  ruleId: string,
  entries: readonly RuleEvidence[],
): VerdictResult {
  if (entries.length === 0) {
    return {
      verdict: 'inconclusive',
      summary: 'No scenario judged this rule',
      reason: `No scenario evaluated rule "${ruleId}".`,
    };
  }
  const basis = basisOf(entries);
  const unreliable = entries.filter(({ reliable }) => !reliable);
  if (unreliable.length > 0) return { verdict: 'inconclusive', ...deciding(unreliable), basis };
  for (const verdict of ['differs', 'follows'] as const) {
    if (withVerdict(entries, verdict).length > 0) return { ...judged(verdict, entries), basis };
  }
  const unjudged = withVerdict(entries, 'inconclusive');
  if (unjudged.length > 0) {
    return {
      verdict: 'inconclusive',
      summary: everySummary(unjudged),
      reason: describeEntries(unjudged),
      basis,
    };
  }
  return { verdict: 'not-applicable', ...deciding(entries), basis };
}

/**
 * A rule's verdict in the rule's own words, when every scenario that covers it follows. A
 * scenario says what its own key did ("Tab leaves the chips"); taken as the rule's summary it
 * described a rule about two keys by one of them (verdict audit 2026-11-17). Only the summary
 * changes, and only then: a difference, or a follows that rests on part of the scenarios,
 * keeps the words of the scenario that decided it.
 */
export function summarizeRule(verdict: VerdictResult, phrase: string | undefined): VerdictResult {
  if (phrase === undefined || verdict.verdict !== 'follows') return verdict;
  const followsEverywhere = verdict.basis?.every((entry) => entry.verdict === 'follows') ?? false;
  return followsEverywhere ? { ...verdict, summary: phrase } : verdict;
}
