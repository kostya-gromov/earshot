import type { Metadata } from 'next';
import { patterns, type Pattern } from '@earshot/contracts';
import { loadMeasurements } from '@/data/measurements';
import { loadTargets } from '@/data/targets';
import {
  Changes,
  Contents,
  Corrections,
  Coverage,
  HowToReadAResult,
  InShort,
  Limitations,
  Provenance,
  Scenarios,
  SemanticModel,
  Standards,
  Terms,
  Verdicts,
  WhatARunDoes,
  WhatIsRecorded,
  WhichSystems,
} from '@/features/methodology';
import { SiteFooter } from '@/features/site-footer';
import { SiteHeader } from '@/features/site-header';
import { isReference, notCountedReasons } from '@/lib/agreement';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Methodology',
  description:
    'Where the rules of Atlas come from, how it measures keyboard behavior and announcements in Chromium, how verdicts are reached, and what the measurements cannot tell you.',
};

/**
 * Every pattern's files: the method is shown with its real data, and with all of it. The page
 * once loaded the first pattern alone and read as that pattern's story (2026-11-17).
 */
async function loadPattern(pattern: Pattern) {
  const [loaded, targets] = await Promise.all([loadMeasurements(pattern), loadTargets(pattern.id)]);
  const measured = loaded.filter(({ measurement }) => measurement.provenance.status === 'measured');
  return {
    pattern,
    targets,
    reference: measured.find(({ measurement }) => isReference(measurement))?.measurement,
    systems: measured.filter(({ measurement }) => !isReference(measurement)),
  };
}

type Loaded = Awaited<ReturnType<typeof loadPattern>>;

/** What the coverage table shows for one pattern. */
const coverageOf = ({ pattern, systems, targets }: Loaded) => ({
  name: pattern.name,
  systems: systems.map(({ measurement }) => measurement),
  targets,
  notCounted: notCountedReasons(targets),
});

export default async function MethodologyPage() {
  const all = Object.values(patterns);
  const groups = await Promise.all(all.map(loadPattern));
  // One file as the example of a provenance block: the first system of the first pattern.
  const example = groups[0]?.systems[0];
  return (
    <div className={styles.wrap}>
      <SiteHeader crumbs={[{ label: 'Methodology', href: '/methodology/' }]} />
      <main className={styles.page}>
        <header className={styles.head}>
          <h1>Methodology</h1>
          <p>
            Where the rules come from, how the engine measures behavior, what the spoken lines are,
            how verdicts are reached, and what the measurements cannot tell you.
          </p>
        </header>
        <InShort />
        <Contents />
        <Standards patterns={all} />
        <WhichSystems>
          <Coverage groups={groups.map(coverageOf)} />
        </WhichSystems>
        <WhatARunDoes />
        <Scenarios
          groups={groups.flatMap(({ pattern, reference }) =>
            reference ? [{ pattern, reference }] : [],
          )}
        />
        <WhatIsRecorded />
        <SemanticModel />
        <Verdicts />
        <HowToReadAResult />
        <Provenance
          example={example?.measurement}
          rawHref={example ? `/${example.file}` : undefined}
        />
        <Limitations />
        <Changes />
        <Corrections />
        <Terms />
      </main>
      <SiteFooter />
    </div>
  );
}
