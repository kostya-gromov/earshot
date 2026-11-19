import type { ReactNode } from 'react';
import styles from './section-head.module.css';

interface SectionHeadProps {
  /** The id the section's aria-labelledby points to. */
  id: string;
  title: string;
  /**
   * The quiet second half of a two-tone statement: the claim bright, its context grey (the
   * device the reference sites share, design review 2026-11-10). Part of the heading's name.
   */
  quiet?: string;
  /** A short status shown beside the title, such as "Coming later". Not an eyebrow. */
  status?: string;
  /** One or two sentences: under the title, or beside it when `isSplit`. */
  children?: ReactNode;
  /** Statement on the left, lead on the right, aligned to the statement's last line. */
  isSplit?: boolean;
  /**
   * The display size every page section uses. A split head always has it; "display" gives it to
   * a head that shares its row with something else (a form), so section titles match.
   */
  size?: 'default' | 'display';
}

/**
 * A page section's opening: a display title and a short lead. No eyebrow above the title: the
 * title says what the section is (design review 2026-11-10).
 */
export function SectionHead(props: SectionHeadProps) {
  const { id, title, quiet, status, children, isSplit = false, size = 'default' } = props;
  return (
    <header className={styles.head} data-split={isSplit || undefined} data-size={size}>
      <h2 id={id} className={styles.title}>
        {title}
        {quiet && <span className={styles.quiet}> {quiet}</span>}
        {status && <span className={styles.status}>{status}</span>}
      </h2>
      {children && <p className={styles.lead}>{children}</p>}
    </header>
  );
}
