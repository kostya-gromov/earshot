import type { Measurement, Pattern } from '@earshot/contracts';
import { isReference } from '@/lib/agreement';
import { measuredOn } from '@/lib/measured-on';
import type { PatternSummary } from '@/lib/pattern-summary';
import { plannedPatterns } from '@/lib/planned-patterns';
import { SectionHead } from '@/ui';
import { PatternGlyph } from './pattern-glyphs';
import sections from './sections.module.css';
import styles from './patterns.module.css';

export interface PatternEntry {
  pattern: Pattern;
  measurements: readonly Measurement[];
  summary: PatternSummary;
  /** Adapters measured but not counted: deprecated, or measured on a stand-in component. */
  notCounted: ReadonlySet<string>;
}

/**
 * The pattern as a still drawing: three chips, focus on the last. It used to play a sequence
 * that matched no recording, in the colour of keyboard focus; the page's one moving scene is the
 * measured one at the top (design review 2026-11-13). `data-done` selects the drawing's resting
 * frame.
 */
function Glyph({ id }: { id: string }) {
  return (
    <div className={`${sections.figure} ${styles.glyph}`} data-done>
      <PatternGlyph id={id} />
    </div>
  );
}

/** Design systems whose verdicts count for the pattern, by name, as the pattern page counts. */
const countedSystems = ({ measurements, notCounted }: PatternEntry): string[] =>
  measurements
    .filter(
      (m) =>
        m.provenance.status === 'measured' && !isReference(m) && !notCounted.has(m.target.adapter),
    )
    .map((m) => m.target.system);

/** Measured systems kept out of agreement counts: shown, never counted. */
const setAsideIn = ({ measurements, notCounted }: PatternEntry): number =>
  measurements.filter((m) => notCounted.has(m.target.adapter)).length;

const names = new Intl.ListFormat('en-GB', { type: 'conjunction' });
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * What was measured, in words: the counted systems by name, then one quiet line with the counts
 * (the same ones the pattern page counts agreement from) and what was left out. It was large
 * figures and rows of numbers, which the method section above already gives for every pattern.
 */
function Measured(entry: PatternEntry) {
  const counted = countedSystems(entry);
  const setAside = setAsideIn(entry);
  const absent = entry.summary.notApplicable;
  const left = [
    setAside > 0 && `${setAside} more measured but not counted`,
    absent > 0 && `${plural(absent, 'system', 'systems')} without this component`,
  ].filter(Boolean);
  return (
    <>
      {counted.length > 0 && (
        <p className={styles.measuredIn}>Measured in {names.format(counted)}.</p>
      )}
      <p className={styles.counts}>
        {plural(entry.pattern.rules.length, 'rule', 'rules')},{' '}
        {plural(counted.length, 'system', 'systems')} counted.
        {/* Each has its own reason (deprecated, or its own component not measured yet). */}
        {left.length > 0 && ` ${left.join('; ')}: the reasons are on the pattern page.`}
      </p>
    </>
  );
}

/**
 * A published pattern as one wide row: its drawing, then its name, what it is, where it was
 * measured, and the way in. The whole row is the link's target.
 */
function PublishedEntry(entry: PatternEntry) {
  const { pattern, summary } = entry;
  return (
    <li className={styles.published}>
      <Glyph id={pattern.id} />
      <div className={styles.detail}>
        <span className={styles.status} data-live>
          {summary.lastMeasuredAt ? `Measured ${measuredOn(summary.lastMeasuredAt)}` : 'Published'}
        </span>
        <h3 className={styles.name}>
          <a href={`/patterns/${pattern.id}/`}>{pattern.name}</a>
        </h3>
        <p className={styles.description}>{pattern.description}</p>
        <Measured {...entry} />
        <span className={styles.open} aria-hidden="true">
          Open the pattern <span>→</span>
        </span>
      </div>
    </li>
  );
}

/** The patterns: published ones as wide rows, announced ones as quiet lines under them. */
export function PatternList({ entries }: { entries: readonly PatternEntry[] }) {
  return (
    <section id="patterns" className={styles.patterns} aria-labelledby="patterns-title">
      <SectionHead
        id="patterns-title"
        title="Patterns."
        quiet="One at a time, measured properly."
        isSplit
      >
        Each pattern is proposed, its rules are checked against the current APG and WCAG pages, and
        only then measured.
      </SectionHead>
      <ul className={styles.catalog}>
        {entries.map((entry) => (
          <PublishedEntry key={entry.pattern.id} {...entry} />
        ))}
        {/* Announced patterns: a quiet line each, no drawing and no numbers until they are measured. */}
        {plannedPatterns.map(({ id, name, description }) => (
          <li key={id} className={styles.planned} data-planned>
            <h3 className={styles.plannedName}>{name}</h3>
            <p>{description}</p>
            <span className={styles.status}>In progress</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
