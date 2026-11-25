import type { Measurement, Pattern, Verdict } from '@earshot/contracts';
import { countedVerdicts } from './agreement';

/** One rule as the counted systems behaved on it, read from typed verdicts only. */
export interface RuleFinding {
  id: string;
  title: string;
  isFromStandards: boolean;
  follows: number;
  judged: number;
  /** Every counted system's verdict on the rule, in the measurements' order. */
  verdicts: readonly { adapter: string; system: string; verdict: Verdict }[];
  /** Counted systems that differ, by name, in the measurements' order. */
  differ: readonly { adapter: string; system: string }[];
  /**
   * How many of the differing systems a hand-written alternative or model names (`seenIn`):
   * their difference has a "why" on the rule's panel.
   */
  explained: number;
  /** Whether any of those trade-offs is still a draft, not yet reviewed. */
  hasDraft: boolean;
}

interface FindingInput {
  pattern: Pattern;
  measurements: readonly Measurement[];
  notCounted: ReadonlySet<string>;
}

/**
 * The systems a trade-off of this rule is written for, alternatives and models alike, each with
 * the review status of its text: a draft is said as one (verdict audit 2026-11-25).
 */
function writtenFor(pattern: Pattern, ruleId: string): ReadonlyMap<string, 'draft' | 'reviewed'> {
  const entries = pattern.tradeOffs.flatMap((entry): [string, 'draft' | 'reviewed'][] => {
    const covers =
      entry.kind === 'model' ? entry.ruleIds.includes(ruleId) : entry.ruleId === ruleId;
    if (!covers || entry.kind === 'none') return [];
    return (entry.seenIn ?? []).map((adapter) => [adapter, entry.status]);
  });
  return new Map(entries);
}

/** Every rule of the pattern, in its order, with what the counted systems did. */
export function ruleFindings({ pattern, measurements, notCounted }: FindingInput): RuleFinding[] {
  return pattern.rules.map((rule) => {
    const verdicts = countedVerdicts(rule.id, measurements, notCounted);
    const differ = verdicts
      .filter(({ verdict }) => verdict === 'differs')
      .map(({ adapter, system }) => ({ adapter, system }));
    const follows = verdicts.filter(({ verdict }) => verdict === 'follows').length;
    const written = writtenFor(pattern, rule.id);
    return {
      verdicts: verdicts.map(({ adapter, system, verdict }) => ({ adapter, system, verdict })),
      id: rule.id,
      title: rule.title,
      isFromStandards: rule.level === 'rule',
      follows,
      judged: follows + differ.length,
      differ,
      explained: differ.filter(({ adapter }) => written.has(adapter)).length,
      hasDraft: differ.some(({ adapter }) => written.get(adapter) === 'draft'),
    };
  });
}

/**
 * The rules most counted systems differ from, most first; a tie keeps the order the rules are
 * listed in. Chosen by count so that no one picks the flattering or the damning line.
 */
export const mostDiffering = (findings: readonly RuleFinding[], limit: number): RuleFinding[] =>
  findings
    .filter(({ differ }) => differ.length > 0)
    .map((finding, index) => ({ finding, index }))
    .toSorted((a, b) => b.finding.differ.length - a.finding.differ.length || a.index - b.index)
    .slice(0, limit)
    .map(({ finding }) => finding);

/** How many differences there are, and how many are on rules from the standards. */
export function differenceSplit(findings: readonly RuleFinding[]) {
  const differences = findings.reduce((sum, { differ }) => sum + differ.length, 0);
  const fromStandards = findings
    .filter(({ isFromStandards }) => isFromStandards)
    .reduce((sum, { differ }) => sum + differ.length, 0);
  return { differences, fromStandards };
}
