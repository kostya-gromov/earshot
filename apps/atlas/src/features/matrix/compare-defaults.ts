import type { Pattern, TargetEntry } from '@earshot/contracts';
import type { LoadedMeasurement } from '@/data/measurements';
import { isReference, notCountedAdapters } from '@/lib/agreement';
import { defaultComparison } from '@/lib/compare-selection';

/** The comparison's first view, computed from the verdicts so it stays true after a re-measure. */
export function defaultCompared(
  pattern: Pattern,
  {
    measured,
    targets,
  }: { measured: readonly LoadedMeasurement[]; targets: readonly TargetEntry[] },
): string[] {
  const notCounted = notCountedAdapters(targets);
  const modelled = new Set(
    pattern.tradeOffs.flatMap((entry) => (entry.kind === 'model' ? entry.seenIn : [])),
  );
  const candidates = measured
    .map(({ measurement }) => measurement)
    .filter((measurement) => !isReference(measurement))
    .map(({ target, verdicts }) => {
      const all = Object.values(verdicts).map(({ verdict }) => verdict);
      return {
        id: target.adapter,
        follows: all.filter((verdict) => verdict === 'follows').length,
        differs: all.filter((verdict) => verdict === 'differs').length,
        isCounted: !notCounted.has(target.adapter),
        hasModel: modelled.has(target.adapter),
      };
    });
  return defaultComparison(candidates);
}
