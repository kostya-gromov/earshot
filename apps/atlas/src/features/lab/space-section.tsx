import styles from './lab.module.css';
import { durations, radii, spaceScale } from './tokens';

export function SpaceSection() {
  return (
    <section className={styles.section} aria-labelledby="lab-space">
      <h2 id="lab-space" className={styles.sectionTitle}>
        Space, radius and motion
      </h2>
      <div>
        {spaceScale.map((step) => (
          <div key={step} className={styles.row}>
            <span className={styles.name}>--space-{step}</span>
            <div className={styles.bar} style={{ width: `var(--space-${step})` }} />
          </div>
        ))}
      </div>
      <div className={styles.swatches}>
        {radii.map((size) => (
          <div key={size} className={styles.swatch}>
            <div className={styles.radius} style={{ borderRadius: `var(--radius-${size})` }} />
            <span className={styles.name}>--radius-{size}</span>
          </div>
        ))}
      </div>
      <div>
        {durations.map(({ name, use }) => (
          <div key={name} className={styles.row}>
            <span className={styles.name}>--{name}</span>
            <span className={styles.note}>{use}. Zero under reduced motion.</span>
          </div>
        ))}
      </div>
    </section>
  );
}
