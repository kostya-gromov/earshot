import { patterns, type Measurement, type Pattern } from '@earshot/contracts';
import { notCountedAdapters } from '@/lib/agreement';
import { patternSummary, type PatternSummary } from '@/lib/pattern-summary';
import { loadMeasurements } from './measurements';
import { loadTargets } from './targets';

/** One pattern with what was measured for it: what a list of patterns shows. */
export interface PatternEntry {
  pattern: Pattern;
  measurements: readonly Measurement[];
  summary: PatternSummary;
  /** Adapters measured but not counted: deprecated, or measured on a stand-in component. */
  notCounted: ReadonlySet<string>;
}

async function loadEntry(pattern: Pattern): Promise<PatternEntry> {
  const [loaded, targets] = await Promise.all([loadMeasurements(pattern), loadTargets(pattern.id)]);
  const measurements = loaded.map(({ measurement }) => measurement);
  return {
    pattern,
    measurements,
    summary: patternSummary(measurements, targets),
    notCounted: notCountedAdapters(targets),
  };
}

/** Every pattern with a page, in the registry's order: the order they were added in. */
export const loadPatternEntries = (): Promise<PatternEntry[]> =>
  Promise.all(Object.values(patterns).map(loadEntry));
