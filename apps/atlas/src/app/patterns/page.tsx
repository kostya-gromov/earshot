import type { Metadata } from 'next';
import { loadPatternEntries } from '@/data/pattern-entries';
import { PatternCatalog } from '@/features/home';
import { SiteFooter } from '@/features/site-footer';
import { SiteHeader } from '@/features/site-header';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Patterns',
  description:
    'Every pattern Atlas has measured: its rules, a working reference, and recordings of how design systems behave for keyboard and screen reader users.',
};

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Every pattern with a page. The home page shows the three added last and leads here. */
export default async function PatternsPage() {
  const entries = await loadPatternEntries();
  const rules = entries.reduce((sum, { pattern }) => sum + pattern.rules.length, 0);
  return (
    <div className={styles.wrap}>
      <SiteHeader crumbs={[{ label: 'Patterns', href: '/patterns/' }]} />
      <main className={styles.page}>
        <header className={styles.head}>
          <h1>Patterns</h1>
          <p>
            {plural(entries.length, 'pattern', 'patterns')}, {plural(rules, 'rule', 'rules')}, in
            the order they were added. Each has its rules with their sources, a working reference,
            and recordings of how design systems behave.
          </p>
        </header>
        <PatternCatalog entries={entries} />
      </main>
      <SiteFooter />
    </div>
  );
}
