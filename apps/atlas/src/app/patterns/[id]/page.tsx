import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { patterns } from '@earshot/contracts';
import { loadMeasurements } from '@/data/measurements';
import { loadTargets } from '@/data/targets';
import { PatternOpening } from '@/features/hero';
import { HowToReadNote } from '@/features/honesty';
import { SystemsSection } from '@/features/matrix';
import { PlaygroundLinkProvider, peopleOf } from '@/features/playground';
import { SiteFooter } from '@/features/site-footer';
import { SiteHeader } from '@/features/site-header';
import { isReference } from '@/lib/agreement';
import { plannedPatterns } from '@/lib/planned-patterns';
import { EvidenceSection } from './evidence-section';
import { LensSection, OpeningScene, RunSection } from './page-sections';
import styles from './page.module.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(patterns).map((id) => ({ id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pattern = patterns[(await params).id];
  return pattern ? { title: pattern.name, description: pattern.description } : {};
}

export default async function PatternPage({ params }: Props) {
  const pattern = patterns[(await params).id];
  if (!pattern) notFound();
  const [measurements, targets] = await Promise.all([
    loadMeasurements(pattern),
    loadTargets(pattern.id),
  ]);
  const reference = measurements.map(({ measurement }) => measurement).find(isReference);
  const people = peopleOf(pattern.id);
  // Only patterns that have a page are counted: a site built on provenance does not promise
  // one that does not exist. The announced one is named apart (2026-11-15).
  const ids = Object.keys(patterns);
  const position = `${ids.indexOf(pattern.id) + 1} of ${ids.length}`;

  return (
    <div className={styles.wrap}>
      <div className={styles.backdrop} aria-hidden="true" />
      <SiteHeader
        crumbs={[
          { label: 'Patterns', href: '/patterns/' },
          { label: pattern.name, href: `/patterns/${pattern.id}/` },
        ]}
      />
      <main className={styles.page}>
        <PlaygroundLinkProvider>
          <OpeningScene
            pattern={pattern}
            position={position}
            next={plannedPatterns[0]?.name}
            findings={<PatternOpening {...{ pattern, measurements, targets }} />}
          />
          <SystemsSection
            pattern={pattern}
            measurements={measurements}
            targets={targets}
            people={people}
          />
          <EvidenceSection
            pattern={pattern}
            measurements={measurements}
            targets={targets}
            reference={reference}
            people={people}
          />
          <RunSection pattern={pattern} reference={reference} />
          <LensSection pattern={pattern} reference={reference} />
          <HowToReadNote />
        </PlaygroundLinkProvider>
      </main>
      <SiteFooter />
    </div>
  );
}
