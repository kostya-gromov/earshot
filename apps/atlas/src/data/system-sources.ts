import type { PatternSource } from '@/lib/system-profile';
import { loadPatternEntries } from './pattern-entries';
import { loadTargets } from './targets';

/** Every pattern with its counted-or-not measurements and its targets: what a system page reads. */
export async function loadSystemSources(): Promise<PatternSource[]> {
  const entries = await loadPatternEntries();
  return Promise.all(
    entries.map(async ({ pattern, measurements }) => ({
      pattern,
      measurements,
      targets: await loadTargets(pattern.id),
    })),
  );
}
