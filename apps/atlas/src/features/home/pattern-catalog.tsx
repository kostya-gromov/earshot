import type { Pattern } from '@earshot/contracts';
import type { PatternEntry } from '@/data/pattern-entries';
import { measuredOn } from '@/lib/measured-on';
import { Glyph, countedSystems, setAsideIn, setAsideNames } from './pattern-card';
import styles from './catalog.module.css';
import { ExternalLink } from '@/ui';

const names = new Intl.ListFormat('en-GB', { type: 'conjunction' });

/**
 * A source by its page's name. A title that also names a section ("Developing a Keyboard
 * Interface: managing focus within…") links the page's name and says the section after it: as
 * one link it was three underlined lines in the row (design review 2026-11-23). The link still
 * leads to the section.
 */
function SourceLink({ url, title }: { url: string; title: string }) {
  const [page, ...section] = title.split(': ');
  return (
    <>
      <ExternalLink href={url}>{page}</ExternalLink>
      {section.length > 0 && ` (${section.join(': ')})`}
    </>
  );
}

/** Which APG pattern this is, or which ones it is built on when it has none of its own. */
function Apg({ apg }: Pick<Pattern, 'apg'>) {
  if (apg.dedicated) {
    return (
      <>
        APG pattern: <ExternalLink href={apg.pattern.url}>{apg.pattern.title}</ExternalLink>.
      </>
    );
  }
  return (
    <>
      No APG pattern of its own. Built on{' '}
      {apg.builtOn.map((source, index) => (
        <span key={source.url}>
          {index > 0 && ' and '}
          <SourceLink {...source} />
        </span>
      ))}
      .
    </>
  );
}

interface FactProps {
  count: number;
  one: string;
  many: string;
  /** A count kept out of agreement: said, and quieter than the two the pattern is counted by. */
  isAside?: boolean;
}

/**
 * A count and what it counts, in two tracks: every number in one column and every label in the
 * next, so the counts can be read down a row and from row to row.
 */
function Fact({ count, one, many, isAside = false }: FactProps) {
  return (
    <li className={isAside ? styles.aside : undefined}>
      <b>{count}</b> <span>{count === 1 ? one : many}</span>
    </li>
  );
}

/**
 * What can be compared from row to row, one fact a line: the counts the pattern page counts
 * agreement from, what was left out of them, and when it was last measured.
 */
function Facts(entry: PatternEntry) {
  const setAside = setAsideIn(entry);
  const absent = entry.summary.notApplicable;
  const { lastMeasuredAt } = entry.summary;
  const more = 'more measured, not counted';
  return (
    <ul className={styles.facts}>
      <Fact count={entry.pattern.rules.length} one="rule" many="rules" />
      <Fact count={countedSystems(entry).length} one="system counted" many="systems counted" />
      {/* Each has its own reason, given on the pattern page (deprecated, or not measured yet). */}
      {setAside > 0 && <Fact count={setAside} one={more} many={more} isAside />}
      {absent > 0 && (
        <Fact
          count={absent}
          one="system without this component"
          many="systems without this component"
          isAside
        />
      )}
      {entry.summary.notMeasuredYet.length > 0 && (
        <Fact
          count={entry.summary.notMeasuredYet.length}
          one="system not measured yet"
          many="systems not measured yet"
          isAside
        />
      )}
      {lastMeasuredAt && <li className={styles.when}>Measured {measuredOn(lastMeasuredAt)}</li>}
    </ul>
  );
}

/**
 * Where it was measured, then who is left out, by name, in one paragraph: measured and not
 * counted, without the component, not measured yet. Named for a maintainer looking for their
 * system (first-visit review, 2026-11-25); one paragraph, so two rows still fit a 900 px screen.
 */
function MeasuredIn({ entry }: { entry: PatternEntry }) {
  const counted = countedSystems(entry);
  const setAside = setAsideNames(entry);
  const { notApplicableNames, notMeasuredYet } = entry.summary;
  const parts = [
    counted.length > 0 && `Measured in ${names.format(counted)}.`,
    setAside.length > 0 && `Measured, not counted: ${names.format(setAside)}.`,
    notApplicableNames.length > 0 && `Without this component: ${names.format(notApplicableNames)}.`,
    notMeasuredYet.length > 0 && `Not measured yet: ${names.format(notMeasuredYet)}.`,
  ].filter(Boolean);
  return parts.length > 0 ? <p>{parts.join(' ')}</p> : null;
}

/**
 * A pattern as a row of the catalogue, in three parts: a small drawing, what it is (with its
 * other names and its APG source, from the pattern's own data), and its facts. Denser than the
 * home page's row, so several can be compared on one screen (design review 2026-11-23). The
 * whole row is the link's target; a source link lies above it.
 */
function PatternRow(entry: PatternEntry) {
  const { pattern } = entry;
  return (
    <li className={styles.row}>
      <Glyph id={pattern.id} form="compact" />
      <div className={styles.main}>
        <h2 className={styles.name}>
          <a href={`/patterns/${pattern.id}/`}>{pattern.name}</a>
        </h2>
        <p className={styles.description}>{pattern.description}</p>
        <div className={styles.about}>
          {pattern.aliases.length > 0 && (
            <p>Also called {names.format(pattern.aliases.map((alias) => alias.toLowerCase()))}.</p>
          )}
          <p>
            <Apg apg={pattern.apg} />
          </p>
          {/* Who is left out, by name, in the wide column: in the narrow column of figures the
              names made the row twice as tall (design review, 2026-11-25). */}
          <MeasuredIn entry={entry} />
        </div>
      </div>
      <div className={styles.side}>
        <Facts {...entry} />
        <span className={styles.open} aria-hidden="true">
          Open the pattern <span>→</span>
        </span>
      </div>
    </li>
  );
}

/** Every pattern with a page, in the order they were added. */
export function PatternCatalog({ entries }: { entries: readonly PatternEntry[] }) {
  return (
    <ul className={styles.catalog} aria-label="Patterns">
      {entries.map((entry) => (
        <PatternRow key={entry.pattern.id} {...entry} />
      ))}
    </ul>
  );
}
