import type { TargetEntry } from '@earshot/contracts';
import styles from './matrix.module.css';

const firstEvidence = (evidence: string | readonly string[]): string =>
  typeof evidence === 'string' ? evidence : (evidence[0] ?? '');

/** Systems checked and found to have no equivalent component, each linked to its evidence. */
export function NotApplicable({ entries }: { entries: readonly TargetEntry[] }) {
  const absent = entries.flatMap((entry) => (entry.status === 'not-applicable' ? [entry] : []));
  if (absent.length === 0) return null;
  return (
    <p className={styles.absent}>
      <span>No equivalent component:</span>{' '}
      {absent.map((entry, index) => (
        <span key={entry.system}>
          {index > 0 && ', '}
          <a href={firstEvidence(entry.evidence)} title={entry.reason}>
            {entry.system}
          </a>
        </span>
      ))}
    </p>
  );
}
