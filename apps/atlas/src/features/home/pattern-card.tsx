import type { PatternEntry } from '@/data/pattern-entries';
import { isReference } from '@/lib/agreement';
import { measuredOn } from '@/lib/measured-on';
import { Arrival } from '@/ui';
import { PatternGlyph } from './pattern-glyphs';
import sections from './sections.module.css';
import styles from './patterns.module.css';

/**
 * The pattern as a still drawing: three chips, focus on the last. It used to play a sequence
 * that matched no recording, in the colour of keyboard focus; the page's one moving scene is the
 * measured one at the top (design review 2026-11-13). `data-done` selects the drawing's resting
 * frame. In its compact form, on the list of all patterns, the drawing fades in once when first scrolled to (Motion: Arrival);
 * its frame and the text beside it are never hidden.
 */
export function Glyph({ id, form }: { id: string; form: 'wide' | 'compact' }) {
  if (form === 'wide') {
    return (
      <div className={`${sections.figure} ${styles.glyph}`} data-done>
        <PatternGlyph id={id} />
      </div>
    );
  }
  return (
    <div className={`${sections.figure} ${styles.glyphCompact}`} data-done>
      <Arrival className={styles.arriving}>
        <PatternGlyph id={id} />
      </Arrival>
    </div>
  );
}

/** Design systems whose verdicts count for the pattern, by name, as the pattern page counts. */
export const countedSystems = ({ measurements, notCounted }: PatternEntry): string[] =>
  measurements
    .filter(
      (m) =>
        m.provenance.status === 'measured' && !isReference(m) && !notCounted.has(m.target.adapter),
    )
    .map((m) => m.target.system);

/** The systems measured but kept out of agreement counts, by name. */
export const setAsideNames = ({ measurements, notCounted }: PatternEntry): string[] =>
  measurements.filter((m) => notCounted.has(m.target.adapter)).map((m) => m.target.system);

/** Measured systems kept out of agreement counts: shown, never counted. */
export const setAsideIn = ({ measurements, notCounted }: PatternEntry): number =>
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
 * A published pattern as one wide row of the home page: its drawing, then its name, what it is,
 * where it was measured, and the way in. The whole row is the link's target.
 */
export function PatternCard({ entry }: { entry: PatternEntry }) {
  const { pattern, summary } = entry;
  return (
    <li className={styles.published}>
      <Glyph id={pattern.id} form="wide" />
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
