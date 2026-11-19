import type { CSSProperties, ReactNode } from 'react';
import type { Verdict } from '@earshot/contracts';
import { VerdictBadge } from '@/features/evidence';
import type { MethodTotals } from '@/lib/method-totals';
import { FigureStage } from './figure-stage';
import { AnnouncementFigure, FocusFigure, TreeFigure } from './recording-figures';
import styles from './method.module.css';

const count = (value: number) => value.toLocaleString('en-GB');

/**
 * What a step has produced so far: the count large, what it counts under it. Beside or under
 * the step's title, where a number has a subject (design review 2026-11-14).
 */
export function Lead({ value, children }: { value: number; children: ReactNode }) {
  return (
    <p className={styles.lead}>
      <strong>{count(value)}</strong> {children}
    </p>
  );
}

export const plural = (value: number, one: string, many: string) =>
  `${count(value)} ${value === 1 ? one : many}`;

const channels = [
  { key: 'focusMoved', label: 'Focus moved', tone: 'focus', figure: <FocusFigure /> },
  { key: 'treeChanged', label: 'Tree changed', tone: 'neutral', figure: <TreeFigure /> },
  { key: 'announced', label: 'Announced', tone: 'heard', figure: <AnnouncementFigure /> },
] as const;

/**
 * Step 2: how many steps the engine recorded, and the three things it records in each, drawn
 * and counted: in how many steps focus moved, the accessibility tree changed, a live region
 * announced something.
 */
export function RecordingPlate({ totals }: { totals: MethodTotals }) {
  const { recording } = totals;
  const of = recording.steps;
  return (
    <FigureStage className={styles.show}>
      <div className={styles.plate}>
        <ul className={styles.channels}>
          {channels.map(({ key, label, tone, figure }, index) => (
            <li key={key} data-figure>
              {figure}
              <p
                className={styles.row}
                data-tone={tone}
                data-empty={recording[key] === 0 || undefined}
                style={
                  { '--row': index, '--share': of > 0 ? recording[key] / of : 0 } as CSSProperties
                }
              >
                <span>{label}</span>
                <strong className={styles.value}>{count(recording[key])}</strong>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </FigureStage>
  );
}

const verdictRows: readonly { verdict: Verdict; key: keyof MethodTotals['verdicts'] }[] = [
  { verdict: 'follows', key: 'follows' },
  { verdict: 'differs', key: 'differs' },
  { verdict: 'inconclusive', key: 'inconclusive' },
  { verdict: 'not-applicable', key: 'notApplicable' },
];

/**
 * Which rules the differences are from: a difference from an Atlas recommendation is not a
 * difference from the standards, and the totals alone read as if it were (verdict audit
 * 2026-11-14).
 */
function DifferenceNote({ verdicts }: { verdicts: MethodTotals['verdicts'] }) {
  const { differs, differsFromStandards: fromStandards } = verdicts;
  if (differs === 0) return null;
  const all = plural(differs, 'difference', 'differences');
  return (
    <p className={styles.finding}>
      {fromStandards === 0
        ? `None of the ${all} is from a rule that WCAG or APG asks for: all are from Atlas recommendations.`
        : `Of the ${all}, ${count(fromStandards)} ${fromStandards === 1 ? 'is' : 'are'} from a rule that WCAG or APG asks for; the rest are from Atlas recommendations.`}
    </p>
  );
}

/**
 * Step 3: every verdict of the counted design systems, as one bar divided by outcome with the
 * counts under it. Only a match has a colour: differing is not failing, so it stays neutral.
 */
export function VerdictPlate({ verdicts }: { verdicts: MethodTotals['verdicts'] }) {
  return (
    <div className={styles.plate}>
      {/* The legend under the bar says the same in words and numbers. */}
      <div className={styles.stack} aria-hidden="true">
        {verdictRows
          .filter(({ key }) => verdicts[key] > 0)
          .map(({ verdict, key }) => (
            <span key={verdict} data-verdict={verdict} style={{ flexGrow: verdicts[key] }} />
          ))}
      </div>
      <dl className={styles.legend}>
        {verdictRows.map(({ verdict, key }) => (
          <div key={verdict}>
            <dt>
              <VerdictBadge verdict={verdict} />
            </dt>
            <dd>{count(verdicts[key])}</dd>
          </div>
        ))}
      </dl>
      <DifferenceNote verdicts={verdicts} />
    </div>
  );
}

/** Step 2's lead: how many steps, in how many systems, from how many runs. */
export function RecordingLead({ totals }: { totals: MethodTotals }) {
  const { recording, systems, runs } = totals;
  return (
    <Lead value={recording.steps}>
      {recording.steps === 1 ? 'step' : 'steps'} recorded in{' '}
      {plural(systems, 'design system', 'design systems')}
      {runs !== undefined && `, from ${plural(runs, 'run', 'runs')} of every scenario`}
    </Lead>
  );
}

/** Step 3's lead: how many verdicts, and whose. */
export function VerdictLead({ verdicts }: { verdicts: MethodTotals['verdicts'] }) {
  return (
    <Lead value={verdicts.total}>
      {verdicts.total === 1 ? 'verdict' : 'verdicts'} so far, for the design systems that are
      counted
    </Lead>
  );
}
