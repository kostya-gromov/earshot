import type { TargetEntry } from '@earshot/contracts';
import styles from './matrix.module.css';

type NativeEntry = Extract<TargetEntry, { status: 'browser-native' }>;

/** "A (X)", "A (X) and B (Y)", "A (X), B (Y) and C (Z)". */
function named(entries: readonly NativeEntry[]): string {
  const parts = entries.map(({ system, component }) => `${system} (${component})`);
  return parts.length < 3
    ? parts.join(' and ')
    : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1) ?? ''}`;
}

/**
 * Systems whose select is the browser's own: not measured, since the browser draws the list
 * (2026-11-24). Not "no equivalent component": the component is there. A system measured
 * for its custom select is said, in one line, to ship the native one as well, so it does not
 * read as offering only the custom one.
 */
export function BrowserNative({ entries }: { entries: readonly TargetEntry[] }) {
  const native = entries.flatMap((entry) => (entry.status === 'browser-native' ? [entry] : []));
  if (native.length === 0) return null;
  const measured = new Set(
    entries.flatMap(({ status, system }) => (status === 'measured' ? [system] : [])),
  );
  const only = native.filter(({ system }) => !measured.has(system));
  const also = native.filter(({ system }) => measured.has(system));
  // The browser's own select is measured once, as a variant of the reference: said here, or
  // "not measured" under the matrix read against "measured as evidence" above it (design
  // review 2026-11-25-select).
  const isNativeMeasured = entries.some(
    (entry) => entry.status === 'measured' && entry['variant-of'] === 'reference',
  );
  return (
    <>
      {only.length > 0 && (
        <p className={styles.absent}>
          <span className={styles.nativeSystems}>{named(only)}</span>{' '}
          {only.length === 1 ? 'uses' : 'use'} the browser’s own select: not measured, since the
          browser draws its list.
        </p>
      )}
      {also.length > 0 && (
        <p className={styles.absent}>
          <span className={styles.nativeSystems}>{named(also)}</span>{' '}
          {also.length === 1 ? 'also ships' : 'also ship'} the browser’s own select, not measured.
        </p>
      )}
      {isNativeMeasured && (
        <p className={styles.absent}>
          The select element itself is measured once, beside the reference, as evidence for the
          design requirement on choosing it; it is not counted.
        </p>
      )}
    </>
  );
}
