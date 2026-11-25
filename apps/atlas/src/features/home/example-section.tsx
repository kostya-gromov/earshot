import type { Measurement, Rule } from '@earshot/contracts';
import { ruleAgreement } from '@/lib/agreement';
import { backspaceOutcome, countOutcomes, saysNothing } from '@/lib/backspace-summary';
import { plural } from '@/lib/finding-words';
import { measuredOn } from '@/lib/measured-on';
import type { SeenNote } from '@/lib/observed-as';
import { scenarioReplay } from '@/lib/replay';
import { ExampleLanes, type ExampleLane } from './example-lanes';
import styles from './example.module.css';

interface ExampleSectionProps {
  /** Counted design systems only: measured, not the reference, not deprecated. */
  systems: readonly Measurement[];
  people: readonly string[];
  /** The pattern the recording is of, named in the frame's line of provenance. */
  patternName: string;
  /** The rule the recording is evidence for, and where its evidence is. */
  rule: Pick<Rule, 'id' | 'title' | 'level'>;
  ruleHref: string;
  /** What each system was seen to do on screen, from targets.yaml, by adapter. */
  seen: ReadonlyMap<string, SeenNote>;
}

/**
 * What was seen on screen where the recording shows nothing, under its own caption and apart
 * from the frame: "Seen by hand · Chakra UI 3.38.0 · 13 Nov 2026" (2026-11-25).
 */
function SeenByHand({ notes }: { notes: readonly SeenNote[] }) {
  if (notes.length === 0) return null;
  return (
    <ul className={styles.seen}>
      {notes.map(({ system, text, how, version, date }) => (
        <li key={system}>
          <p className={styles.seenHead}>
            {how} · {version ? `${system} ${version}` : system} · {measuredOn(date)}
          </p>
          <p>
            {text}. The engine records focus, the accessibility tree and announcements, not what is
            drawn, so this is not part of the recording above.
          </p>
        </li>
      ))}
    </ul>
  );
}

/** The order outcomes are shown in: what changed most first, so alike rows sit together. */
const outcomeOrder = [
  'removed a chip',
  'moved focus to a chip',
  'changed nothing in the accessibility tree',
] as const;

const rank = (lane: ExampleLane) => outcomeOrder.indexOf(backspaceOutcome(lane.steps[0]));

/** Each counted system's first press, as a row of the frame. */
function lanesOf({ systems, people, seen }: ExampleSectionProps): ExampleLane[] {
  // Grouped by what the press did, so "which three, and who is silent?" is answered by the
  // rows themselves, not by a line of names over them (2026-11-25: too dense).
  return systems
    .map((m): ExampleLane => ({
      adapter: m.target.adapter,
      system: m.target.system,
      version: m.target.systemVersion.version,
      steps: scenarioReplay(m, 'backspace-twice', people).slice(0, 1),
      onScreen: seen.get(m.target.adapter),
    }))
    .toSorted((a, b) => rank(a) - rank(b));
}

interface FindingHeadProps {
  rule: Pick<Rule, 'title'>;
  ruleHref: string;
  follows: number;
  judged: number;
  level: string;
  outcomes: number;
  systems: number;
  silent: number;
}

/** The finding as the frame's heading: what the press did, its rule, and how many follow it. */
function FindingHead(props: FindingHeadProps) {
  const { rule, ruleHref, follows, judged, level, outcomes, systems, silent } = props;
  return (
    <div className={styles.head}>
      <div className={styles.finding}>
        <h2 id="example-title" className={styles.title}>
          Backspace in an empty field:{' '}
          <span className={styles.quiet}>
            {plural(outcomes, 'behavior', 'behaviors')} in{' '}
            {plural(systems, 'design system', 'design systems')}; {silent} with no modelled speech.
          </span>
        </h2>
        <p className={styles.ruleLine}>
          Rule: <a href={ruleHref}>{rule.title}</a> · {level}
        </p>
      </div>
      <p className={styles.score}>
        <b>
          {follows} of {judged}
        </b>
        <span>follow</span>
      </p>
    </div>
  );
}

/**
 * One real measurement, the scene of the home page's opening: Backspace, once, in each system.
 * Its heading is the finding (2026-11-25): the behaviour, counted from the recordings (how
 * many different outcomes, how many said nothing); under it, in one line, the rule as the link to
 * its evidence, its kind and how many judged systems follow it, so a difference is not read as a
 * failure. The rows below are grouped by outcome.
 */
export function ExampleSection(props: ExampleSectionProps) {
  const { systems, people, patternName, rule, ruleHref } = props;
  const lanes = lanesOf(props);
  const firstPresses = lanes.map(({ steps }) => steps[0]);
  const silent = firstPresses.filter(saysNothing).length;
  const { follows, judged } = ruleAgreement(rule.id, systems);
  const level = rule.level === 'rule' ? 'Rule from the standards' : 'Earshot recommendation';
  return (
    <section className={styles.scene} aria-labelledby="example-title">
      {/* The finding is the frame's own heading, as a product shot carries its title: the
          recording reads as one picture, not lines stacked over it (2026-11-25, with
          Linear beside it). The rule is the link to its evidence; the count sits at its right. */}
      <ExampleLanes
        lanes={lanes}
        people={people}
        patternName={patternName}
        head={
          <FindingHead
            {...{ rule, ruleHref, follows, judged, level }}
            outcomes={countOutcomes(firstPresses)}
            systems={lanes.length}
            silent={silent}
          />
        }
      />
      <p className={styles.note}>
        Recorded by the Earshot engine in Chromium. The fields are drawn from the accessibility
        tree, not the screen; modelled speech is built from the same tree, not taken from a screen
        reader.
      </p>
      <SeenByHand
        notes={lanes.flatMap(({ steps, onScreen }) =>
          onScreen && backspaceOutcome(steps[0]) === 'changed nothing in the accessibility tree'
            ? [onScreen]
            : [],
        )}
      />
    </section>
  );
}
