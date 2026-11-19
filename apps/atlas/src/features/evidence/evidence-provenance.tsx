import type { Measurement, TargetEntry } from '@earshot/contracts';
import { correctionLink } from '@/lib/correction-link';
import { measuredOn } from '@/lib/measured-on';
import styles from './evidence.module.css';

const versionOf = ({ systemVersion }: Measurement['target']): string =>
  'reason' in systemVersion ? 'version unknown' : systemVersion.version;

/** The operating system as readers call it; the engine records Node's platform name. */
const systemNames: Readonly<Record<string, string>> = {
  darwin: 'macOS',
  linux: 'Linux',
  win32: 'Windows',
};

/**
 * The line every measured card shows (apps/atlas/CLAUDE.md): system version, browser, the
 * operating system it ran on (some systems announce differently by platform) and date.
 * Engine version, runs, the page's path and how chips are found are in the raw JSON linked beside
 * it; repeating them under every rule served no reader. Why a version is unknown is not in that
 * file's summary, so it stays here, in a line.
 */
export function EvidenceProvenance({ measurement }: { measurement: Measurement }) {
  const { target, provenance } = measurement;
  if (provenance.status !== 'measured') return null;
  return (
    <>
      <ul className={styles.provenance} aria-label="Provenance">
        <li>
          {target.system} {versionOf(target)}
        </li>
        <li>
          {provenance.browser.replace(/^chromium/, 'Chromium')} on{' '}
          {systemNames[provenance.os] ?? provenance.os}
        </li>
        <li>{measuredOn(provenance.measuredAt)}</li>
      </ul>
      {'reason' in target.systemVersion && (
        <p className={styles.versionReason}>Version unknown: {target.systemVersion.reason}</p>
      )}
    </>
  );
}

interface VariantProvenanceProps {
  measurement: Measurement;
  file: string;
}

/**
 * The provenance of a variant's measurement, beside the note that cites it: version, date and
 * engine, and the file itself. A variant has no card of its own, so this line is all a reader
 * has to check the note against (ADR 0005, amendment of 2026-11-16).
 */
export function VariantProvenance({ measurement, file }: VariantProvenanceProps) {
  const { target, provenance } = measurement;
  if (provenance.status !== 'measured') return null;
  return (
    <span className={styles.variantProvenance}>
      {target.system} {versionOf(target)}, {provenance.browser.replace(/^chromium/, 'Chromium')} on{' '}
      {systemNames[provenance.os] ?? provenance.os}, engine {provenance.engineVersion},{' '}
      {measuredOn(provenance.measuredAt)}. <a href={`/${file}`}>Raw JSON of this recording</a>
    </span>
  );
}

interface EvidenceLinksProps {
  measurement: Measurement;
  file: string;
  entry: TargetEntry | undefined;
  ruleId: string;
}

/** Raw data, the system's own docs and demo, and a way to tell us we got it wrong (CLAUDE.md 2.5). */
export function EvidenceLinks({ measurement, file, entry, ruleId }: EvidenceLinksProps) {
  const { url } = measurement.target;
  return (
    <>
      <a href={`/${file}`}>Raw JSON</a>
      {entry?.docs && <a href={entry.docs}>Docs</a>}
      {/* Local pages (reference, harness) are repository paths, not public addresses. */}
      {url.startsWith('https://') && <a href={url}>Example page</a>}
      {entry?.status === 'measured' && entry['docs-example'] && (
        <a href={entry['docs-example']}>Docs example</a>
      )}
      {/* A new issue, filled in with this card: the system, version, rule, verdict and file. */}
      <a href={correctionLink({ measurement, file, ruleId })}>Suggest a correction</a>
    </>
  );
}
