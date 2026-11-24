import styles from './how-to-read.module.css';

/**
 * The honesty statement in one line, for pages that are not the home page: the full statement
 * lives on the home page and in the methodology (design review 2026-11-10: the same block on
 * every page read as filler).
 */
export function HowToReadNote() {
  return (
    <aside className={styles.note} aria-label="How to read Earshot">
      <p>
        <strong>Guidance, not certification.</strong> Following these rules does not make a product
        conform to WCAG, and differing from them does not make it fail. Spoken lines are a semantic
        model, not screen reader output. Measured in Chromium.{' '}
        <a href="/methodology/">Read the methodology</a>
      </p>
    </aside>
  );
}
