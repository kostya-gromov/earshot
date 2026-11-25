import type { Measurement, TargetEntry } from '@earshot/contracts';
import { isReference } from './agreement';

/** "Its tab components…" to "its tab components…", inside a parenthesis. */
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

export interface PatternSummary {
  /** Design systems with a measured file; the reference is the baseline and not counted. */
  measuredSystems: number;
  notApplicable: number;
  /** The systems that have no component for this pattern, by name. */
  notApplicableNames: readonly string[];
  planned: number;
  /** Systems not measured yet that say why, as "GitHub Primer (its tab components…)". */
  notMeasuredYet: readonly string[];
  lastMeasuredAt: string | undefined;
}

/** What the home page says about one pattern, from measured records only (apps/atlas/CLAUDE.md). */
export function patternSummary(
  measurements: readonly Measurement[],
  targets: readonly TargetEntry[],
): PatternSummary {
  const systems = measurements.filter((m) => m.provenance.status === 'measured' && !isReference(m));
  const dates = systems.flatMap(({ provenance }) =>
    provenance.status === 'measured' ? [provenance.measuredAt] : [],
  );
  return {
    measuredSystems: systems.length,
    notApplicable: targets.filter(({ status }) => status === 'not-applicable').length,
    notApplicableNames: targets.flatMap((entry) =>
      entry.status === 'not-applicable' ? [entry.system] : [],
    ),
    planned: targets.filter(({ status }) => status === 'planned').length,
    notMeasuredYet: targets.flatMap((entry) =>
      entry.status === 'planned' && entry.reason
        ? [`${entry.system} (${lowerFirst(entry.reason).replace(/\.$/, '')})`]
        : [],
    ),
    lastMeasuredAt: dates.toSorted().at(-1),
  };
}
