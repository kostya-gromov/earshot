import type { Metadata } from 'next';
import { loadPatternEntries } from '@/data/pattern-entries';
import { HowToRead } from '@/features/honesty';
import { ExampleSection, HomeIntro, HowSection, PatternList } from '@/features/home';
import { initialPeople } from '@/features/playground';
import { SiteFooter } from '@/features/site-footer';
import { SiteHeader } from '@/features/site-header';
import { isReference } from '@/lib/agreement';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: { absolute: 'Earshot: measured keyboard, focus and announcement behavior' },
};

/** What Earshot is, shown with one real recording; how it works; the patterns; how to read it. */
export default async function HomePage() {
  const entries = await loadPatternEntries();
  const chips = entries.find(({ pattern }) => pattern.id === 'input-with-chips');
  // The example shows counted design systems only: measured, not the reference, not deprecated.
  const counted = (chips?.measurements ?? []).filter(
    (m) =>
      m.provenance.status === 'measured' &&
      !isReference(m) &&
      !chips?.notCounted.has(m.target.adapter),
  );
  return (
    <div className={styles.wrap}>
      <SiteHeader crumbs={[]} />
      <main className={styles.page}>
        <HomeIntro
          scene={
            counted.length > 0 && (
              <ExampleSection
                systems={counted}
                people={initialPeople}
                patternName={chips?.pattern.name ?? ''}
              />
            )
          }
        />
        <HowSection sources={entries} />
        <PatternList entries={entries} />
        <HowToRead />
      </main>
      <SiteFooter />
    </div>
  );
}
