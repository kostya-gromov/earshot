import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadSystemSources } from '@/data/system-sources';
import { SiteFooter } from '@/features/site-footer';
import { SiteHeader } from '@/features/site-header';
import { SystemPatterns } from '@/features/system-page';
import { systemIds, systemPatterns } from '@/lib/system-profile';
import styles from './page.module.css';

export const dynamicParams = false;

export async function generateStaticParams() {
  return systemIds(await loadSystemSources()).map(({ id }) => ({ id }));
}

type Props = { params: Promise<{ id: string }> };

async function systemOf(params: Props['params']) {
  const { id } = await params;
  const sources = await loadSystemSources();
  const system = systemIds(sources).find((entry) => entry.id === id);
  return system ? { system, entries: systemPatterns(sources, system) } : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await systemOf(params);
  return found
    ? {
        title: found.system.name,
        description: `What Earshot measured in ${found.system.name}, pattern by pattern.`,
      }
    : {};
}

/** One design system across every pattern (apps/atlas/CLAUDE.md: /systems/[id]). */
export default async function SystemPage({ params }: Props) {
  const found = await systemOf(params);
  if (!found) notFound();
  const { system, entries } = found;
  return (
    <div className={styles.wrap}>
      <SiteHeader crumbs={[{ label: system.name, href: `/systems/${system.id}/` }]} />
      <main className={styles.page}>
        <header className={styles.head}>
          <h1>{system.name}</h1>
          <p>
            What Earshot measured in {system.name}, pattern by pattern: which component and version,
            whether it is counted, and its verdict on every rule, differences first. Differing is
            not failing: where a trade-off is written for {system.name}, the rule shows it.
          </p>
        </header>
        <SystemPatterns system={system.name} entries={entries} />
      </main>
      <SiteFooter />
    </div>
  );
}
