import styles from './matrix.module.css';

interface NotCountedProps {
  /** Measured systems kept out of agreement, each with the words that follow "not counted:". */
  systems: readonly { name: string; reason: string }[];
  /** Systems named as candidates and not measured yet. */
  planned: readonly string[];
}

/**
 * Which measured systems agreement leaves out, and why: said once, under the matrix that shows
 * them, not in the rules' lead paragraph (design review 2026-11-13).
 */
export function NotCounted({ systems, planned }: NotCountedProps) {
  if (systems.length === 0 && planned.length === 0) return null;
  return (
    <p className={styles.absent}>
      {systems.map(({ name, reason }) => (
        <span key={name}>
          {name} is measured but not counted: {reason}.{' '}
        </span>
      ))}
      {planned.length > 0 && <span>Not measured yet: {planned.join(', ')}.</span>}
    </p>
  );
}
