import type { Cell } from '@/lib/grid-navigation';
import type { MatrixColumn } from './matrix-data';
import styles from './verdict-matrix.module.css';

/** Marks the first column that is shown but not counted: a rule and a gap start the group there. */
export const startsGroup = (columns: readonly MatrixColumn[], c: number): true | undefined =>
  (!columns[c]?.isCounted && (c === 0 || columns[c - 1]?.isCounted)) || undefined;

/**
 * One label over the columns that are shown but not counted. For the eye only: each of those
 * column headers says "not counted" itself, and so does every cell's name.
 */
function Groups({ columns }: { columns: readonly MatrixColumn[] }) {
  const counted = columns.filter(({ isCounted }) => isCounted).length;
  const rest = columns.length - counted;
  if (rest === 0) return null;
  return (
    <tr className={styles.groups} aria-hidden="true">
      <td colSpan={counted + 1} />
      <td colSpan={rest} data-group-start>
        Shown, not counted
      </td>
    </tr>
  );
}

interface MatrixHeadProps {
  columns: readonly MatrixColumn[];
  hot: Cell | undefined;
}

/**
 * The table's columns and its header: the system names, and over the last ones the label of the
 * group that is shown but not counted. Column widths are set here, on the columns themselves,
 * because the first header row is that label and spans several of them.
 */
export function MatrixHead({ columns, hot }: MatrixHeadProps) {
  return (
    <>
      <colgroup>
        <col className={styles.ruleColumn} />
        {columns.map(({ id }) => (
          <col key={id} className={styles.systemColumn} />
        ))}
      </colgroup>
      <thead>
        <Groups columns={columns} />
        <tr>
          <td />
          {columns.map((column, c) => (
            <th
              key={column.id}
              scope="col"
              data-hot={hot?.column === c || undefined}
              data-muted={!column.isCounted || undefined}
              data-group-start={startsGroup(columns, c)}
            >
              {column.name}
              <span className={styles.version}>{column.version}</span>
              {/* Seen on a phone, where the group label has no room; always in the header's name. */}
              {!column.isCounted && <span className={styles.uncounted}>not counted</span>}
            </th>
          ))}
        </tr>
      </thead>
    </>
  );
}
