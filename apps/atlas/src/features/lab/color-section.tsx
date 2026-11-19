import styles from './lab.module.css';
import { ThemePair } from './theme-pair';
import { meaningColors, surfaceColors, textColors, type ColorToken } from './tokens';

function Swatches({ tokens }: { tokens: readonly ColorToken[] }) {
  return (
    <div className={styles.swatches}>
      {tokens.map(({ name, note }) => (
        <div key={name} className={styles.swatch}>
          <div className={styles.chip} style={{ background: `var(--${name})` }} />
          <span className={styles.name}>--{name}</span>
          <span className={styles.note}>{note}</span>
        </div>
      ))}
    </div>
  );
}

export function ColorSection() {
  return (
    <section className={styles.section} aria-labelledby="lab-color">
      <h2 id="lab-color" className={styles.sectionTitle}>
        Colour
      </h2>
      <p className={styles.note}>
        Colour encodes meaning only. These four hues are the only ones on the site; everything else
        is neutral.
      </p>
      <ThemePair>
        <Swatches tokens={meaningColors} />
        <Swatches tokens={surfaceColors} />
        <Swatches tokens={textColors} />
      </ThemePair>
    </section>
  );
}
