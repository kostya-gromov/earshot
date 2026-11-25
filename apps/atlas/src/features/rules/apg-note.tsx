import type { Pattern } from '@earshot/contracts';
import styles from './rules.module.css';
import { ExternalLink } from '@/ui';

/** Which APG pattern this is, or which ones it is built from when there is none. */
export function ApgNote({ pattern }: { pattern: Pattern }) {
  if (pattern.apg.dedicated) {
    return (
      <p className={styles.apgNote}>
        APG pattern:{' '}
        <ExternalLink href={pattern.apg.pattern.url}>{pattern.apg.pattern.title}</ExternalLink>.
      </p>
    );
  }
  return (
    <p className={styles.apgNote}>
      {pattern.apg.note} Built on{' '}
      {pattern.apg.builtOn.map((source, index) => (
        <span key={source.url}>
          {index > 0 && ' and '}
          <ExternalLink href={source.url}>{source.title}</ExternalLink>
        </span>
      ))}
      .
    </p>
  );
}
