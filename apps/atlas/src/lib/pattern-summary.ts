import type { Measurement, TargetEntry } from '@earshot/contracts';
import { isReference } from './agreement';

export interface PatternSummary {
  /** Design systems with a measured file; the reference is the baseline and not counted. */
  measuredSystems: number;
  notApplicable: number;
  planned: number;
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
    planned: targets.filter(({ status }) => status === 'planned').length,
    lastMeasuredAt: dates.toSorted().at(-1),
  };
}
