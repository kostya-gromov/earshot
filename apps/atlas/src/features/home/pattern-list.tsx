import type { PatternEntry } from '@/data/pattern-entries';
import { plannedPatterns } from '@/lib/planned-patterns';
import { SectionHead } from '@/ui';
import { PatternCard } from './pattern-card';
import styles from './patterns.module.css';

/**
 * How many patterns the home page shows. With five the list was two to four screens long and
 * grew with every pattern (design review 2026-11-23); the rest are on /patterns/.
 */
const SHOWN = 3;

/** The patterns added last, newest first. Entries come in the order they were added. */
export const latestEntries = (entries: readonly PatternEntry[]): PatternEntry[] =>
  entries.slice(-SHOWN).reverse();

/** Under the rows, in the middle: the way to every pattern, as the page's outlined button. */
function AllPatterns({ count }: { count: number }) {
  return (
    <p className={styles.all}>
      <a href="/patterns/">
        View all {count} patterns <span aria-hidden="true">→</span>
      </a>
    </p>
  );
}

/**
 * The patterns added last as wide rows, announced ones as quiet lines under them, and the way
 * to all of them.
 */
export function PatternList({ entries }: { entries: readonly PatternEntry[] }) {
  return (
    <section id="patterns" className={styles.patterns} aria-labelledby="patterns-title">
      <SectionHead
        id="patterns-title"
        title="Patterns."
        quiet="One at a time, measured properly."
        isSplit
      >
        Each pattern is proposed, its rules are checked against the current APG and WCAG pages, and
        only then measured. Below are the ones added last.
      </SectionHead>
      <ul className={styles.catalog}>
        {latestEntries(entries).map((entry) => (
          <PatternCard key={entry.pattern.id} entry={entry} />
        ))}
        {/* Announced patterns: a quiet line each, no drawing and no numbers until they are measured. */}
        {plannedPatterns.map(({ id, name, description }) => (
          <li key={id} className={styles.planned} data-planned>
            <h3 className={styles.plannedName}>{name}</h3>
            <p>{description}</p>
            <span className={styles.status}>In progress</span>
          </li>
        ))}
      </ul>
      {entries.length > SHOWN && <AllPatterns count={entries.length} />}
    </section>
  );
}
