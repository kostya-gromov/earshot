import { readReferenceSource } from '@/data/reference';
import { PlaygroundClient } from './playground-client';
import { playgroundSources } from './playground-sources';
import styles from './playground.module.css';

/** The one raised surface of the page: the reference running live (apps/atlas/CLAUDE.md). */
export async function Playground({ patternId }: { patternId: string }) {
  const source = playgroundSources[patternId];
  if (!source) return null;
  const markup = await readReferenceSource(patternId, `${source.entry}.html`);
  const base = `/reference/${patternId}/${source.entry}`;
  return (
    <section
      className={styles.playground}
      aria-labelledby="playground-title"
      data-layout={source.layout}
    >
      <link rel="stylesheet" href={`${base}.css`} precedence="default" />
      <PlaygroundClient
        patternId={patternId}
        markup={markup}
        moduleUrl={`${base}.js`}
        layout={source.layout}
      />
    </section>
  );
}
