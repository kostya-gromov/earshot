import type { Measurement, Pattern } from '@earshot/contracts';
import { CodeLens } from '@/features/code-lens';
import { DesignLens } from '@/features/design-lens';
import { PatternIntro } from '@/features/hero';
import { Playground, RuleSet, TourProvider } from '@/features/playground';
import { ApgNote } from '@/features/rules';
import { RunItSection } from '@/features/run-it';
import { Tabs } from '@/ui';
import styles from './page.module.css';

interface OpeningSceneProps {
  pattern: Pattern;
  position: string;
  next: string | undefined;
}

/** Hero, playground and the rule set read as one opening scene, so no section gap between them. */
export function OpeningScene({ pattern, position, next }: OpeningSceneProps) {
  return (
    <div>
      <PatternIntro pattern={pattern} position={position} next={next} />
      <TourProvider patternId={pattern.id}>
        <Playground patternId={pattern.id} />
        <RuleSet titles={Object.fromEntries(pattern.rules.map(({ id, title }) => [id, title]))} />
      </TourProvider>
      <ApgNote pattern={pattern} />
    </div>
  );
}

/** "Run it on your component", in the words of this pattern's own recording. */
export function RunSection({ pattern, reference }: LensSectionProps) {
  const first = reference?.scenarios[0];
  if (!reference || !first) return null;
  return (
    <RunItSection
      patternId={pattern.id}
      scenarioCount={reference.scenarios.length}
      startingState={first.initialState}
    />
  );
}

interface LensSectionProps {
  pattern: Pattern;
  reference: Measurement | undefined;
}

/** "For design" and "For code": the same pattern through each role's questions. */
export function LensSection({ pattern, reference }: LensSectionProps) {
  return (
    <section id="lens" className={styles.section} aria-labelledby="lens-title">
      <h2 id="lens-title" className="visually-hidden">
        Details for your role
      </h2>
      <Tabs
        label="Details for your role"
        variant="lens"
        queryKey="lens"
        items={[
          {
            id: 'design',
            label: 'For design',
            description: 'What accessibility asks of the design, with reasons and sources',
            panel: <DesignLens pattern={pattern} />,
          },
          {
            id: 'code',
            label: 'For code',
            description: 'The reference source with notes, and the behavior contract',
            panel: <CodeLens patternId={pattern.id} reference={reference} />,
          },
        ]}
      />
    </section>
  );
}
