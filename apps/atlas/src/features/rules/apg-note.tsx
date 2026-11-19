import type { Pattern } from '@earshot/contracts';
import styles from './rules.module.css';

/** Which APG pattern this is, or which ones it is built from when there is none. */
export function ApgNote({ pattern }: { pattern: Pattern }) {
  if (pattern.apg.dedicated) {
    return (
      <p className={styles.apgNote}>
        APG pattern: <a href={pattern.apg.pattern.url}>{pattern.apg.pattern.title}</a>.
      </p>
    );
  }
  return (
    <p className={styles.apgNote}>
      {pattern.apg.note} Built on{' '}
      {pattern.apg.builtOn.map((source, index) => (
        <span key={source.url}>
          {index > 0 && ' and '}
          <a href={source.url}>{source.title}</a>
        </span>
      ))}
      .
    </p>
  );
}
