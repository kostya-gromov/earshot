import type { ReactNode } from 'react';
import styles from './lens-intro.module.css';

/** A lens part's heading with one line on what it holds. */
export function LensIntro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.intro}>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
