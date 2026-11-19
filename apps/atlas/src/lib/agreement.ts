import type { Measurement, TargetEntry, Verdict } from '@earshot/contracts';
import { judgedShare, type JudgedShare } from './verdict-basis';

export interface RuleAgreement {
  /** Measured design systems with a verdict for this rule. The reference is never counted. */
  measured: number;
  /** Systems the rule could be judged on (follows or differs); inconclusive ones are not. */
  judged: number;
  follows: number;
  differs: number;
  inconclusive: number;
  notApplicable: number;
}

/** The reference is the baseline the rules are written from, not a system that agrees with them. */
export const isReference = (measurement: Measurement): boolean =>
  measurement.target.adapter === 'reference';

export interface SystemVerdict {
  system: string;
  /** The target's adapter id: models and links name systems by it. */
  adapter: string;
  verdict: Verdict;
  /** Set when the verdict rests on part of the rule's scenarios (ADR 0004, 2026-11-11). */
  share?: JudgedShare | undefined;
}

/**
 * The verdicts that count for a rule, one per measured design system (apps/atlas/CLAUDE.md: measured
 * records only; illustrative records, the reference and deprecated components never count).
 */
export function countedVerdicts(
  ruleId: string,
  measurements: readonly Measurement[],
  notCounted: ReadonlySet<string> = new Set(),
): SystemVerdict[] {
  return measurements
    .filter(
      (m) =>
        m.provenance.status === 'measured' && !isReference(m) && !notCounted.has(m.target.adapter),
    )
    .flatMap((m) => {
      const verdict = m.verdicts[ruleId];
      return verdict
        ? [
            {
              system: m.target.system,
              adapter: m.target.adapter,
              verdict: verdict.verdict,
              share: judgedShare(verdict),
            },
          ]
        : [];
    });
}

/** How many measured systems follow a rule, out of those it could be judged on. */
export function ruleAgreement(
  ruleId: string,
  measurements: readonly Measurement[],
  notCounted: ReadonlySet<string> = new Set(),
): RuleAgreement {
  const verdicts = countedVerdicts(ruleId, measurements, notCounted).map(({ verdict }) => verdict);
  const count = (value: Verdict) => verdicts.filter((verdict) => verdict === value).length;
  return {
    measured: verdicts.length,
    judged: count('follows') + count('differs'),
    follows: count('follows'),
    differs: count('differs'),
    inconclusive: count('inconclusive'),
    notApplicable: count('not-applicable'),
  };
}

type MeasuredTarget = Extract<TargetEntry, { status: 'measured' }>;

const whyNotCounted = (entry: MeasuredTarget): string | undefined =>
  entry.deprecated ? 'its component is deprecated by its maintainers' : entry['not-counted'];

/**
 * Measured systems shown with their evidence but not counted, each with its reason in the words
 * that follow "Not counted:". Two cases: components their own maintainers deprecated (agreement
 * should describe what teams are advised to use, decided 2026-11-08), and a system measured on a
 * composition while its dedicated component cannot be measured yet (decided 2026-11-13).
 */
export function notCountedReasons(targets: readonly TargetEntry[]): ReadonlyMap<string, string> {
  return new Map(
    targets.flatMap((entry): [string, string][] => {
      const reason = entry.status === 'measured' ? whyNotCounted(entry) : undefined;
      return entry.status === 'measured' && reason ? [[entry.adapter, reason]] : [];
    }),
  );
}

export const notCountedAdapters = (targets: readonly TargetEntry[]): ReadonlySet<string> =>
  new Set(notCountedReasons(targets).keys());

/** Deprecated components: their recordings are shown as text, not drawn (lib/replay.ts). */
export const deprecatedAdapters = (targets: readonly TargetEntry[]): ReadonlySet<string> =>
  new Set(
    targets.flatMap((entry) =>
      entry.status === 'measured' && entry.deprecated ? [entry.adapter] : [],
    ),
  );
