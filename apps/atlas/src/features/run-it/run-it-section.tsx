import { SectionHead } from '@/ui';
import { RunForm } from './run-form';
import styles from './run-it.module.css';
import { SuggestSystem } from './suggest-system';

const steps = [
  'Your story’s play function brings the component to the starting state',
  'The engine presses the same keys as for the reference',
  'You get a verdict per rule, with the recorded steps',
];

interface RunItSectionProps {
  patternId: string;
  scenarioCount: number;
  /** The state every scenario of this pattern starts from, as the reference recorded it. */
  startingState: string;
}

/**
 * "Run it on your component": what the product will do with a team's own story (not open yet),
 * and below it the path that is open, suggesting a public design system.
 */
export function RunItSection({ patternId, scenarioCount, startingState }: RunItSectionProps) {
  return (
    <section className={styles.run} aria-labelledby="run-title">
      <div>
        <SectionHead
          id="run-title"
          title="Run it on your component"
          status="Coming later"
          size="display"
        >
          Earshot will open your public Storybook story in Chromium and run the same {scenarioCount}{' '}
          scenarios. Every scenario starts from one state: {startingState}. Your story reaches it
          with a play function, so the setup is yours, not our guess. Nothing runs yet.
        </SectionHead>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step}>
              <span className={styles.number} aria-hidden="true">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
      <RunForm storyName={`${patternId}--for-earshot`} />
      <SuggestSystem patternId={patternId} scenarioCount={scenarioCount} />
    </section>
  );
}
