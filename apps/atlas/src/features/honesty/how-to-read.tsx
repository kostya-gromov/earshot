import { Readers } from './readers';
import styles from './how-to-read.module.css';

/** Each title is a claim and, where there is one, what it is not: bright, then grey. */
const points = [
  {
    claim: 'Advice,',
    not: 'not a conformance claim',
    text: 'Following these rules does not make a product conform to WCAG, and differing from them does not make it fail. Test with people who use assistive technology.',
  },
  {
    claim: 'A semantic model,',
    not: 'not a screen reader',
    text: 'Spoken lines are built from the browser’s accessibility tree and live regions in one fixed format. They are not NVDA or VoiceOver output.',
  },
  {
    claim: 'Open to correction',
    text: 'Every result shows its version, browser and date and links to the raw data, so it can be checked. The channel for corrections opens with the first public release.',
  },
];

/**
 * The honesty statement (apps/atlas/CLAUDE.md): what this guidance is, and what it is not. One
 * compact band, not a display section: it qualifies the page, it is not its message (design
 * review 2026-11-12). It is text, so it does not arrive: it is simply there.
 */
export function HowToRead() {
  return (
    <section aria-labelledby="guidance-title">
      <div className={styles.inner}>
        <div className={styles.bandHead}>
          <h2 id="guidance-title">
            Guidance, <span>not certification.</span>
          </h2>
          <p>
            Atlas turns the accessibility standards into practical advice for one component at a
            time, and shows what real design systems do. It helps you decide; it does not audit you.{' '}
            <a href="/methodology/">Read the methodology</a>
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
        <Readers />
      </div>
    </section>
  );
}
