import styles from './brand-mark.module.css';

/**
 * The Atlas mark: the Tab key. The arrow runs to its stop, and the stop is in the focus colour,
 * which on this site means one thing: focus landed here. What Atlas measures, in one sign: a key
 * was pressed, and this is where focus went (chosen by the owner on 2026-11-17 from four drafts;
 * it replaces the keycap inside a focus ring). Decorative: the brand name always sits next to it.
 */
export function BrandMark() {
  return (
    <svg className={styles.mark} viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <rect className={styles.key} x="2" y="2" width="20" height="20" rx="6" />
      <path className={styles.arrow} d="M6.6 12h7M10.7 8.7 14 12l-3.3 3.3" />
      <path className={styles.stop} d="M17.3 8v8" />
    </svg>
  );
}
