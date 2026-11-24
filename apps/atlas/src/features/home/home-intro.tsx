import type { ReactNode } from 'react';
import styles from './home.module.css';

/**
 * What Earshot is, in one statement and one sentence, then the page's one scene across the full
 * width: a real recording (apps/atlas/CLAUDE.md, signature motion replays measured steps, not a
 * drawing). The longer account of what Earshot holds sits under the scene.
 */
export function HomeIntro({ scene }: { scene: ReactNode }) {
  return (
    <section className={styles.intro} aria-labelledby="home-title">
      <h1 id="home-title" className={styles.title}>
        How should an interactive component behave?{' '}
        <span className={styles.quiet}>Earshot&nbsp;answers with evidence.</span>
      </h1>
      <div className={styles.row}>
        <p className={styles.lede}>
          Rules from WCAG and APG, a working reference, and recordings of what real design systems
          do for keyboard and screen reader users.
        </p>
        <div className={styles.actions}>
          <a className={styles.primary} href="#patterns">
            Browse patterns
          </a>
          <a className={styles.secondary} href="#how">
            How it works
          </a>
        </div>
      </div>
      <div className={styles.sceneWrap}>{scene}</div>
    </section>
  );
}
