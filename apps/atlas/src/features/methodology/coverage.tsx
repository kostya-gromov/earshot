import type { Measurement, TargetEntry } from '@earshot/contracts';
import { measuredOn } from '@/lib/measured-on';
import styles from './methodology.module.css';

interface CoverageProps {
  /** The pattern's name, for the table's caption. */
  name: string;
  /** Measured design systems, without the reference. */
  systems: readonly Measurement[];
  targets: readonly TargetEntry[];
  /** Adapters measured but not counted in agreement, each with its reason. */
  notCounted: ReadonlyMap<string, string>;
}

const firstUrl = (evidence: string | readonly string[]): string =>
  typeof evidence === 'string' ? evidence : (evidence[0] ?? '');

const versionOf = ({ target }: Measurement): string =>
  'reason' in target.systemVersion ? 'unknown' : target.systemVersion.version;

function statusOf(entry: TargetEntry | undefined, uncounted: string | undefined) {
  if (uncounted) return `Shown, not counted: ${uncounted}`;
  if (entry?.status === 'measured' && entry.composition) return 'Counted. A docs composition';
  return 'Counted';
}

interface SystemRowProps {
  system: Measurement;
  entry: TargetEntry | undefined;
  uncounted: string | undefined;
}

/** One measured system. Roles are written out: on a phone the row is restyled as a stacked record. */
function SystemRow({ system, entry, uncounted }: SystemRowProps) {
  const { provenance, target } = system;
  return (
    <tr role="row">
      <th scope="row" role="rowheader">
        {target.system}
      </th>
      <td role="cell" data-label="Component">
        {entry?.component ?? ''}
      </td>
      <td role="cell" data-label="Version">
        {versionOf(system)}
      </td>
      <td role="cell" data-label="Measured">
        {provenance.status === 'measured' && measuredOn(provenance.measuredAt)}
      </td>
      <td role="cell" data-label="In agreement counts">
        {statusOf(entry, uncounted)}
      </td>
    </tr>
  );
}

/** What is measured today, from the measurement files themselves: versions and dates, not prose. */
function MeasuredTable({ name, systems, targets, notCounted }: CoverageProps) {
  const entryFor = (system: Measurement) =>
    targets.find((entry) => entry.status === 'measured' && entry.adapter === system.target.adapter);
  return (
    <div className={styles.scroller}>
      <table className={`${styles.table} ${styles.stack}`} role="table">
        <caption className="visually-hidden">Measured systems for {name}</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">
              System
            </th>
            <th scope="col" role="columnheader">
              Component
            </th>
            <th scope="col" role="columnheader">
              Version
            </th>
            <th scope="col" role="columnheader">
              Measured
            </th>
            <th scope="col" role="columnheader">
              In agreement counts
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {systems.map((system) => (
            <SystemRow
              key={system.target.adapter}
              system={system}
              entry={entryFor(system)}
              uncounted={notCounted.get(system.target.adapter)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Systems checked and left out, each with the reason and where their docs show it. */
function LeftOut({ targets }: { targets: readonly TargetEntry[] }) {
  const absent = targets.flatMap((entry) => (entry.status === 'not-applicable' ? [entry] : []));
  const planned = targets.flatMap((entry) => (entry.status === 'planned' ? [entry] : []));
  return (
    <>
      {absent.length > 0 && (
        <>
          <h3>Checked, with no equivalent component</h3>
          <ul>
            {absent.map((entry) => (
              <li key={entry.system}>
                <b>{entry.system}.</b> {entry.reason}{' '}
                <a href={firstUrl(entry.evidence)}>Where {entry.system}’s docs show it</a>
              </li>
            ))}
          </ul>
        </>
      )}
      {planned.length > 0 && (
        <p>Not measured yet: {planned.map(({ system }) => system).join(', ')}.</p>
      )}
    </>
  );
}

/** The inclusion rule's result for one pattern: who is measured, who is not, and why. */
function PatternCoverage(props: CoverageProps) {
  return (
    <>
      <h3>{props.name}</h3>
      <MeasuredTable {...props} />
      <LeftOut targets={props.targets} />
    </>
  );
}

/** What is measured today, pattern by pattern, in the patterns' order. */
export function Coverage({ groups }: { groups: readonly CoverageProps[] }) {
  return groups.map((group) => <PatternCoverage key={group.name} {...group} />);
}
