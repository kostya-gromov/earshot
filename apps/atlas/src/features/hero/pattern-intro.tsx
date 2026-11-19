import type { Pattern } from '@earshot/contracts';
import styles from './pattern-intro.module.css';

interface PatternIntroProps {
  pattern: Pattern;
  /** "2 of 2": among the patterns that have a page. A pattern without one is not counted. */
  position: string;
  /** The pattern being worked on next, named apart from the count: it is not a page yet. */
  next?: string | undefined;
}

/** Title on the left, what it is on the right (D1a). */
export function PatternIntro({ pattern, position, next }: PatternIntroProps) {
  return (
    <section className={styles.intro} aria-labelledby="pattern-title">
      <div>
        <p className={styles.kicker}>
          Pattern <span aria-hidden="true">·</span> {position}
          {next && <span className={styles.next}>Next: {next}, in progress</span>}
        </p>
        <h1 id="pattern-title" className={styles.title}>
          {pattern.name}
        </h1>
      </div>
      <div>
        <p className={styles.lede}>{pattern.description}</p>
        <p className={styles.aka}>
          Also called{' '}
          {pattern.aliases.map((alias, index) => (
            <span key={alias}>
              {/* One name never breaks across lines, "multi-select" included. */}
              <span className={styles.alias}>{alias.toLowerCase()}</span>
              {index < pattern.aliases.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
