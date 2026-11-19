import type { ReactNode } from 'react';
import styles from './lab.module.css';

/** Renders the same content in the light and the dark theme, side by side. */
export function ThemePair({ children }: { children: ReactNode }) {
  return (
    <div className={styles.pair}>
      <div className={styles.theme} data-theme="light">
        <p className={styles.themeLabel}>Light</p>
        {children}
      </div>
      <div className={styles.theme} data-theme="dark">
        <p className={styles.themeLabel}>Dark</p>
        {children}
      </div>
    </div>
  );
}
