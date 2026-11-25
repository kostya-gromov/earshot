import styles from './how-to-read.module.css';

/** Each title is a claim and, where there is one, what it is not: bright, then grey. */
const points = [
  {
    claim: 'Advice,',
    not: 'not a conformance claim',
    text: 'Following these rules does not make a product conform to WCAG, and differing from them does not make it fail. Test with people who use assistive technology.',
  },
  {
    claim: 'Modelled speech,',
    not: 'not a screen reader',
    text: 'Spoken lines are built from the browser’s accessibility tree and live regions in one fixed format. They are not NVDA or VoiceOver output.',
  },
  {
    claim: 'Counted,',
    not: 'or shown and set aside',
    text: 'A system counts for a pattern when its own component for that pattern is measured. A component its maintainers deprecated, a stand-in measured while the dedicated one is not, or a second setup of a counted component is shown with its reason on the pattern page and left out of every count.',
  },
  {
    claim: 'Open to correction',
    text: 'Every result shows its version, browser and date and links to the raw data. Each system’s card has a link to suggest a correction, which opens a public issue on GitHub.',
  },
];

/**
 * How to read what Earshot shows (apps/atlas/CLAUDE.md, the honesty statement): how it is
 * measured is the section above it; here, what it is and is not, and what is counted. "Who it is
 * for" moved to the opening (2026-11-25).
 */
export function HowToRead() {
  return (
    <section aria-labelledby="guidance-title">
      <div className={styles.inner}>
        <div className={styles.bandHead}>
          <h2 id="guidance-title">
            How to read it. <span>Guidance, not certification.</span>
          </h2>
          <p>
            Earshot turns the accessibility standards into practical advice for one pattern at a
            time, and shows what real design systems do. It helps you choose or build; it does not
            audit you. <a href="/methodology/">Read the methodology</a>
          </p>
        </div>
        <ul className={styles.list}>
          {points.map(({ claim, not, text }) => (
            <li key={claim}>
              <h3>
                {claim}
                {not && <span> {not}</span>}
              </h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
