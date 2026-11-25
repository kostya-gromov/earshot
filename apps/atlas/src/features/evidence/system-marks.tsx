import type { Verdict } from '@earshot/contracts';
import { VerdictBadge } from './verdict-badge';
import styles from './system-marks.module.css';

/** Follows first, then the differences, then what could not be judged: read left to right. */
const order: Readonly<Record<Verdict, number>> = {
  follows: 0,
  differs: 1,
  inconclusive: 2,
  'not-applicable': 3,
};

interface SystemMarksProps {
  verdicts: readonly { adapter: string; system: string; verdict: Verdict }[];
  label: string;
}

/**
 * One rule's verdicts as a row of systems, each with the matrix's own mark: "1 of 6" seen at a
 * glance as one tick among crosses, not only read (2026-11-25). Each mark keeps its word
 * as accessible text, so the row reads "Follows Fluent 2, Differs Atlassian…".
 */
export function SystemMarks({ verdicts, label }: SystemMarksProps) {
  const sorted = verdicts.toSorted((a, b) => order[a.verdict] - order[b.verdict]);
  return (
    <ul className={styles.marks} aria-label={label}>
      {sorted.map(({ adapter, system, verdict }) => (
        <li key={adapter} data-verdict={verdict}>
          <VerdictBadge verdict={verdict} isMarkOnly />
          <span>{system}</span>
        </li>
      ))}
    </ul>
  );
}
