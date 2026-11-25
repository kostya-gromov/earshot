import type { SystemPattern } from '@/lib/system-profile';
import { SystemPatternBlock } from './system-pattern';
import styles from './system-page.module.css';

/** Counted first, then shown and not counted, then not measured: the page opens on what counts. */
const rank = (entry: SystemPattern) => {
  if (entry.kind === 'not-measured') return 2;
  return entry.notCounted ? 1 : 0;
};
const ordered = (entries: readonly SystemPattern[]) =>
  entries.toSorted((a, b) => rank(a) - rank(b));

/**
 * Every pattern's word on one system, then how to answer it. The page a maintainer asked for
 * ("is my library here, does it count, where does it differ, where do I respond?"; first-visit
 * reviews, 2026-11-25), opened the same day.
 */
export function SystemPatterns({
  system,
  entries,
}: {
  system: string;
  entries: readonly SystemPattern[];
}) {
  return (
    <>
      <div className={styles.patterns}>
        {ordered(entries).map((entry) => (
          <SystemPatternBlock key={entry.pattern.id} entry={entry} />
        ))}
      </div>
      <p className={styles.correction}>
        Each verdict opens on its pattern page with {system}’s recording, raw data and a link to
        suggest a correction, which opens a public issue on GitHub.{' '}
        <a href="/methodology/#corrections">How corrections work</a>
      </p>
    </>
  );
}
