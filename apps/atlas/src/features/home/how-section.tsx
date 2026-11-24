import type { ReactNode } from 'react';
import { measuredOn } from '@/lib/measured-on';
import { methodTotals, type MethodSource, type MethodTotals } from '@/lib/method-totals';
import { Arrival, SectionHead } from '@/ui';
import { RecordingLead, RecordingPlate, VerdictLead, VerdictPlate } from './method-strip';
import { RuleAside, RuleLead, RuleSources } from './rule-plate';
import styles from './method.module.css';

interface Step {
  label: string;
  title: string;
  text: string;
  show: ReactNode;
  /** A wide step's count, shown large beside its title. */
  lead?: ReactNode;
  /**
   * Under the title, in the same column, which then stays in view while the step's output
   * scrolls beside it: the step's count, drawing and meters.
   */
  aside?: ReactNode;
  /** The step's output runs the full width under its text, not beside it. */
  isWide?: boolean;
}

const copy = {
  rule: 'Each rule links the WCAG criterion or APG practice it applies or relates to. Where Earshot goes further, the rule is marked as a recommendation and says why.',
  recording:
    'The engine opens each component in Chromium, presses the keys and records focus, the accessibility tree and live region announcements after every step.',
  verdict:
    'Every scenario runs three times. A verdict is inconclusive when the engine cannot judge: the start state could not be reached, there was nothing to judge, or the runs disagreed. A system that differs gets the trade-off explained, not a red mark.',
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
      <a href="/methodology/">How the engine measures</a>
    </p>
  );
}

/** The three steps, each with what it has produced so far; nothing until something is measured. */
function methodSteps(totals: MethodTotals): Step[] {
  const isMeasured = totals.systems > 0;
  return [
    {
      label: 'Rule',
      title: 'Starts from the standards',
      text: copy.rule,
      lead: isMeasured && <RuleLead rules={totals.rules} patterns={totals.patterns.length} />,
      aside: isMeasured && <RuleAside rules={totals.rules} />,
      show: isMeasured && <RuleSources rules={totals.rules} />,
    },
    {
      label: 'Recording',
      title: 'Real keys in a real browser',
      text: copy.recording,
      lead: isMeasured && <RecordingLead totals={totals} />,
      show: isMeasured && <RecordingPlate totals={totals} />,
      isWide: true,
    },
    {
      label: 'Verdict',
      title: 'Judged three times, and explained',
      text: copy.verdict,
      lead: isMeasured && <VerdictLead verdicts={totals.verdicts} />,
      show: isMeasured && (
        <Arrival className={styles.show}>
          <VerdictPlate verdicts={totals.verdicts} />
        </Arrival>
      ),
      isWide: true,
    },
  ];
}

/**
 * How Earshot works, for every pattern at once, as three steps down the page: what the step is,
 * and what it has produced so far, counted from the measurement files. The first step sits on
 * the page's split; the recording and the verdicts run the full width, so the page is not one
 * split from top to bottom (design review 2026-11-14). The
 * drawings in the recording step each carry a measured count (design review 2026-11-13:
 * schematics alone went from showing to telling), so nothing is shown until something is
 * measured.
 */
export function HowSection({ sources }: { sources: readonly MethodSource[] }) {
  const totals = methodTotals(sources);
  return (
    <section id="how" aria-labelledby="how-title">
      <SectionHead
        id="how-title"
        title="Rules, recordings, verdicts."
        quiet="The same method for every pattern."
        isSplit
      >
        The same engine measures the reference implementation and every design system, so results
        compare fairly and can be repeated.
      </SectionHead>
      <ol className={styles.steps}>
        {methodSteps(totals).map(({ label, title, text, lead, aside, show, isWide }, index) => (
          <li
            key={label}
            className={styles.step}
            data-wide={isWide || undefined}
            data-beside={Boolean(aside) || undefined}
          >
            <div className={styles.side} data-sticky={Boolean(aside) || undefined}>
              <div className={styles.say}>
                <p className={styles.stepLabel}>
                  <span aria-hidden="true">{index + 1}</span> {label}
                </p>
                <h3>{title}</h3>
                <p className={styles.text}>{text}</p>
              </div>
              {aside}
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
