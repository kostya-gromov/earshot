import type { ReactNode } from 'react';
import { measuredOn } from '@/lib/measured-on';
import { methodTotals, type MethodSource, type MethodTotals } from '@/lib/method-totals';
import { Arrival, SectionHead } from '@/ui';
import { RecordingLead, RecordingPlate, VerdictLead, VerdictPlate } from './method-strip';
import styles from './method.module.css';

interface Step {
  label: string;
  title: string;
  text: string;
  show: ReactNode;
  /** The step's count, shown large beside its title. */
  lead: ReactNode;
}

const copy = {
  recording:
    'The engine opens each component in Chromium, presses the keys and records focus, the accessibility tree and live region announcements after every step.',
  verdict:
    'Every scenario runs three times. A verdict is inconclusive when the engine cannot judge: the start state could not be reached, there was nothing to judge, or the runs disagreed. A difference gets no red mark, and where a trade-off is written, the rule shows it.',
};

const systems = (count: number) => `${count} design ${count === 1 ? 'system' : 'systems'}`;

/** "Combobox (10 rules, 6 systems counted)": the parts the totals are the sum of. */
const countedIn = ({ name, rules, systems: counted }: MethodTotals['patterns'][number]) =>
  `${name} (${rules} ${rules === 1 ? 'rule' : 'rules'}, ${counted} ${counted === 1 ? 'system' : 'systems'} counted)`;

const listed = (items: readonly string[]) =>
  new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(items);

/** What the totals are counted from, so every number above can be traced. */
function Source({ totals }: { totals: MethodTotals }) {
  if (!totals.latest) return null;
  return (
    <p className={styles.source}>
      Totals for every pattern measured so far: {listed(totals.patterns.map(countedIn))}. The
      reference implementation and the measurements a pattern sets aside are left out;{' '}
      {systems(totals.systems)} are counted in all. Latest measurement {measuredOn(totals.latest)}.{' '}
      <a href="/methodology/">How the engine measures, and every page the rules cite</a>
    </p>
  );
}

/** The two steps, each with what it has produced so far; nothing until something is measured. */
function methodSteps(totals: MethodTotals): Step[] {
  if (totals.systems === 0) return [];
  return [
    {
      label: 'Recording',
      title: 'Real keys in a real browser',
      text: copy.recording,
      lead: <RecordingLead totals={totals} />,
      show: <RecordingPlate totals={totals} />,
    },
    {
      label: 'Verdict',
      title: 'Judged three times, and explained',
      text: copy.verdict,
      lead: <VerdictLead verdicts={totals.verdicts} />,
      show: (
        <Arrival className={styles.show}>
          <VerdictPlate verdicts={totals.verdicts} />
        </Arrival>
      ),
    },
  ];
}

/** What the numbers below are for, and the rules counted in one line. */
function Lede({ totals }: { totals: MethodTotals }) {
  const { total, fromStandards, recommendations } = totals.rules;
  return (
    <>
      Every verdict on this site, the findings above among them, is judged from these recordings,
      and each links to its steps and raw data. {total} rules so far, in {totals.patterns.length}{' '}
      patterns: {fromStandards} from the standards, {recommendations} Earshot recommendations.
    </>
  );
}

/**
 * How it is measured, on the home page after the findings: the recording and the verdicts, each
 * with what it has produced so far, counted from the measurement files, as the evidence the
 * findings stand on (2026-11-25). The rule step and its list of every cited page are gone:
 * thirty links to w3.org read as part of the site (external feedback, 2026-11-24), and
 * /methodology lists every cited page in "What the rules rest on". The drawings carry a measured
 * count each (design review 2026-11-13), so nothing is shown until something is measured.
 */
export function HowSection({ sources }: { sources: readonly MethodSource[] }) {
  const totals = methodTotals(sources);
  return (
    <section id="how" aria-labelledby="how-title">
      <SectionHead
        id="how-title"
        title="How it is measured."
        quiet="Recordings, then verdicts."
        isSplit
      >
        <Lede totals={totals} />
      </SectionHead>
      <ol className={styles.steps}>
        {methodSteps(totals).map(({ label, title, text, lead, show }, index) => (
          <li key={label} className={styles.step} data-wide>
            <div className={styles.side}>
              <div className={styles.say}>
                <p className={styles.stepLabel}>
                  <span aria-hidden="true">{index + 1}</span> {label}
                </p>
                <h3>{title}</h3>
                <p className={styles.text}>{text}</p>
              </div>
            </div>
            {lead}
            {show}
          </li>
        ))}
      </ol>
      <Source totals={totals} />
    </section>
  );
}
