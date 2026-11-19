import type { Source } from '@earshot/contracts';
import styles from './rules.module.css';

const prefix = (source: Source): string => {
  switch (source.kind) {
    case 'apg':
      return 'APG';
    case 'wcag':
      return `WCAG ${source.sc}`;
    case 'other':
      return '';
  }
};

/** "Understanding SC 2.4.7: Focus Visible" reads as "Focus Visible" next to its "WCAG 2.4.7". */
const shortTitle = (source: Source): string =>
  source.kind === 'wcag' ? source.title.replace(/^Understanding SC [\d.]+:\s*/, '') : source.title;

interface SourceLinksProps {
  sources: readonly Source[];
  /**
   * Shows only "WCAG 2.4.7" for criteria; the name stays in the link's accessible name, so the
   * visible text still starts it (WCAG 2.5.3).
   */
  isCompact?: boolean;
}

/**
 * Every rule and requirement links its sources (CLAUDE.md 2.3). The links stay one compact list;
 * the notes on indirect sources follow it as a second level (design review 2026-11-10). Each
 * note names its criterion, so it still reads on its own.
 */
export function SourceLinks({ sources, isCompact = false }: SourceLinksProps) {
  const notes = sources.flatMap(({ note }) => (note ? [note] : []));
  return (
    <div className={styles.sourceBlock}>
      <ul className={styles.sources} aria-label="Sources">
        {sources.map((source) => {
          const hideTitle = isCompact && source.kind === 'wcag';
          return (
            <li key={source.url}>
              <a href={source.url} className={styles.source}>
                {/* Compact links have no visible title, so the kind carries the underline. */}
                <span
                  className={
                    hideTitle ? `${styles.sourceKind} ${styles.sourceTitle}` : styles.sourceKind
                  }
                >
                  {prefix(source)}
                </span>{' '}
                <span className={hideTitle ? 'visually-hidden' : styles.sourceTitle}>
                  {shortTitle(source)}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      {notes.map((note) => (
        <p key={note} className={styles.sourceNote}>
          {note}
        </p>
      ))}
    </div>
  );
}
