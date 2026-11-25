import type { Metadata } from 'next';
import type { Measurement } from '@earshot/contracts';
import { loadPatternEntries, type PatternEntry } from '@/data/pattern-entries';
import { loadTargets } from '@/data/targets';
import { HowToRead } from '@/features/honesty';
import { ExampleSection, HomeIntro, HowSection, PatternFindings } from '@/features/home';
import { initialPeople } from '@/features/playground';
import { SiteFooter } from '@/features/site-footer';
import { SiteHeader } from '@/features/site-header';
import { isReference } from '@/lib/agreement';
import { seenFor } from '@/lib/observed-as';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: { absolute: 'Earshot: how design systems behave for keyboard and screen reader users' },
};

/** The rule the opening's recording is evidence for. */
const SCENE_RULE = 'bsp';

/** Counted design systems only: measured, not the reference, not set aside. */
const countedIn = (entry: PatternEntry | undefined): Measurement[] =>
  (entry?.measurements ?? []).filter(
    (m) =>
      m.provenance.status === 'measured' &&
      !isReference(m) &&
      !entry?.notCounted.has(m.target.adapter),
  );

/** Every design system counted for at least one pattern, in the order first met. */
function countedSystems(entries: readonly PatternEntry[]): { id: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const m of entries.flatMap(countedIn)) seen.set(m.target.adapter, m.target.system);
  return [...seen].map(([id, name]) => ({ id, name }));
}

async function Scene({ chips }: { chips: PatternEntry | undefined }) {
  const counted = countedIn(chips);
  const rule = chips?.pattern.rules.find(({ id }) => id === SCENE_RULE);
  if (!chips || !rule || counted.length === 0) return null;
  const seen = seenFor(await loadTargets(chips.pattern.id), rule.id);
  return (
    <ExampleSection
      systems={counted}
      seen={seen}
      people={initialPeople}
      patternName={chips.pattern.name}
      rule={rule}
      ruleHref={`/patterns/${chips.pattern.id}/#rule-${rule.id}`}
    />
  );
}

/**
 * Who Earshot is for and one finding with its rule; every pattern with its finding; how it is
 * measured, the recording and the verdicts as evidence; how to read it. The rule step and every
 * cited page are on /methodology (2026-11-25).
 */
export default async function HomePage() {
  const entries = await loadPatternEntries();
  const chips = entries.find(({ pattern }) => pattern.id === 'input-with-chips');
  return (
    <div className={styles.wrap}>
      {/* The same lit stage as a pattern page's opening (D1a): one soft light, a fading grid. */}
      <div className={styles.backdrop} aria-hidden="true" />
      <SiteHeader crumbs={[]} />
      <main className={styles.page}>
        <HomeIntro systems={countedSystems(entries)} scene={<Scene chips={chips} />} />
        <PatternFindings entries={entries} />
        <HowSection sources={entries} />
        <HowToRead />
      </main>
      <SiteFooter />
    </div>
  );
}
