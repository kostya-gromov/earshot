import styles from './lab.module.css';
import { speechScale, typeScale } from './tokens';

const sample = 'Backspace twice to remove';
const speechSample = 'Hiroshi Matsui removed. 2 selected';

export function TypeSection() {
  return (
    <section className={styles.section} aria-labelledby="lab-type">
      <h2 id="lab-type" className={styles.sectionTitle}>
        Type
      </h2>
      <div>
        {typeScale.map((size) => (
          <div key={size} className={styles.row}>
            <span className={styles.name}>--text-{size}</span>
            <span style={{ fontSize: `var(--text-${size})`, lineHeight: 1.2 }}>{sample}</span>
          </div>
        ))}
      </div>
      <p className={styles.note}>
        Serif italic is reserved for what a screen reader would say: Newsreader, self-hosted through
        next/font. The D1a mockup used Iowan Old Style, which exists only on Apple systems; the last
        row shows it for comparison where it is installed.
      </p>
      <div>
        {speechScale.map((size) => (
          <div key={size} className={styles.row}>
            <span className={styles.name}>--{size}</span>
            <span className={styles.speech} style={{ fontSize: `var(--${size})` }}>
              {speechSample}
            </span>
          </div>
        ))}
        <div className={styles.row}>
          <span className={styles.name}>Iowan (D1a)</span>
          <span
            className={styles.speech}
            style={{ fontSize: 'var(--speech-lg)', fontFamily: "'Iowan Old Style', serif" }}
          >
            {speechSample}
          </span>
        </div>
      </div>
    </section>
  );
}
