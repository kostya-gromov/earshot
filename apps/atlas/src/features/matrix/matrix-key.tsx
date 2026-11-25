import type { Verdict } from '@earshot/contracts';
import { VerdictBadge } from '@/features/evidence';
import type { MatrixColumn } from './matrix-data';
import styles from './verdict-matrix.module.css';

const order: readonly { verdict: Verdict; word: string }[] = [
  { verdict: 'follows', word: 'Follows' },
  { verdict: 'differs', word: 'Differs' },
  { verdict: 'inconclusive', word: 'Inconclusive' },
  { verdict: 'not-applicable', word: 'Not applicable' },
];

/**
 * What each mark in the table means, drawn with the table's own marks. Only marks the table
 * uses are listed. Each cell's name says the same in words, so the key is for sighted readers.
 */
export function MatrixKey({ columns }: { columns: readonly MatrixColumn[] }) {
  const cells = columns.flatMap(({ cells: column }) => column.flatMap((cell) => cell ?? []));
  const used = new Set(cells.map(({ verdict }) => verdict));
  return (
    <ul className={styles.key} aria-label="Key">
      {order
        .filter(({ verdict }) => used.has(verdict))
        .map(({ verdict, word }) => (
          <li key={verdict}>
            <span aria-hidden="true">
              <VerdictBadge verdict={verdict} isMarkOnly />
            </span>
            {word}
          </li>
        ))}
      {cells.some(({ share }) => share) && (
        <li>
          <i className={styles.keyDot} aria-hidden="true" />
          {/* One span: the item is a flex row, and its gap put a space before the colon. */}
          <span>
            Judged on part of its scenarios
            <span className={styles.keyNote}>
              : the rule’s other scenarios could not be judged for this system
            </span>
          </span>
        </li>
      )}
      {cells.some(({ isModel }) => isModel) && (
        <li>
          <i className={styles.keyFrame} aria-hidden="true" />
          {/* One span: the item is a flex row, and its gap put a space before the colon. */}
          <span>
            Explained by a different model
            <span className={styles.keyNote}>
              : a written trade-off describes the system’s different model; the rule shows it
            </span>
          </span>
        </li>
      )}
    </ul>
  );
}
