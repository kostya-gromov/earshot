import type { Measurement } from '@earshot/contracts';
import { scenarioReplay } from '@/lib/replay';
import { ExampleLanes } from './example-lanes';
import styles from './example.module.css';

interface ExampleSectionProps {
  /** Counted design systems only: measured, not the reference, not deprecated. */
  systems: readonly Measurement[];
  people: readonly string[];
  /** The pattern the recording is of, named in the frame's line of provenance. */
  patternName: string;
}

/**
 * One real measurement, the scene of the home page's opening: Backspace, once, in each system.
 * One line says what it shows, the frame holds the recordings with where they come from, and
 * under it is why that matters and the longer account of what Earshot is.
 */
export function ExampleSection({ systems, people, patternName }: ExampleSectionProps) {
  const lanes = systems.map((m) => ({
    adapter: m.target.adapter,
    system: m.target.system,
    version: m.target.systemVersion.version,
    steps: scenarioReplay(m, 'backspace-twice', people).slice(0, 1),
  }));
  return (
    <section className={styles.scene} aria-labelledby="example-title">
      <h2 id="example-title" className={styles.title}>
        These fields look the same.{' '}
        <span className={styles.quiet}>They do not behave the same.</span>
      </h2>
      <ExampleLanes lanes={lanes} people={people} patternName={patternName} />
      <div className={styles.after}>
        <div>
          <p className={styles.point}>
            Accessibility checkers test markup, not what happens after a key press.
          </p>
          <p className={styles.note}>
            Recorded by the Earshot engine in Chromium. Spoken lines are a semantic model, not
            screen reader output.
          </p>
        </div>
        <p className={styles.lede}>
          For the components teams build again and again: rules that start from WCAG 2.2 and the
          ARIA Authoring Practices and say where they go further, a working reference, and
          recordings of what real design systems do. One pattern at a time, measured in Chromium.
        </p>
      </div>
    </section>
  );
}
