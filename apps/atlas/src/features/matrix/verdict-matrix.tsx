'use client';

import { useState } from 'react';
import type { Verdict } from '@earshot/contracts';
import { VerdictBadge } from '@/features/evidence';
import type { Cell } from '@/lib/grid-navigation';
import type { MatrixCell, MatrixColumn, MatrixRow } from './matrix-data';
import { MatrixHead, startsGroup } from './matrix-head';
import { MatrixKey } from './matrix-key';
import { useGridFocus } from './use-grid-focus';
import styles from './verdict-matrix.module.css';

/** Each starts with the badge's own word: a speech user says what they see (WCAG 2.5.3). */
const words: Readonly<Record<Verdict, string>> = {
  follows: 'Follows',
  differs: 'Differs',
  inconclusive: 'Inconclusive, not judged',
  'not-applicable': 'Not applicable',
};

/** Everything a cell says, in one line: its accessible name and the readout under the grid. */
function describe(column: MatrixColumn, row: MatrixRow, cell: MatrixCell): string {
  return [
    `${column.name}, ${row.title}: ${words[cell.verdict]}. ${cell.summary}`,
    cell.share,
    cell.isModel ? 'Explained by a different model' : undefined,
    column.isCounted ? undefined : 'Not counted',
  ]
    .filter(Boolean)
    .join('. ');
}

interface RowViewProps {
  row: MatrixRow;
  r: number;
  columns: readonly MatrixColumn[];
  hot: Cell | undefined;
  onHot: (cell: Cell | undefined) => void;
  grid: ReturnType<typeof useGridFocus>;
}

function RowView({ row, r, columns, hot, onHot, grid }: RowViewProps) {
  return (
    <tr data-hot={hot?.row === r || undefined}>
      <th scope="row">
        {row.title}
        <span>
          {row.isRecommendation ? 'Atlas recommendation' : 'From the standards'}
          {/* The reference is named only where it does not follow; the note below says the rest. */}
          {row.reference &&
            row.reference !== 'follows' &&
            ` · Reference: ${words[row.reference].toLowerCase()}`}
        </span>
      </th>
      {columns.map((column, c) => {
        const cell = column.cells[r];
        const isActive = grid.active.row === r && grid.active.column === c;
        const here = { row: r, column: c };
        return (
          <td
            key={column.id}
            data-hot={hot?.column === c || undefined}
            data-muted={!column.isCounted || undefined}
            data-group-start={startsGroup(columns, c)}
          >
            {cell && (
              <a
                ref={grid.register(here)}
                href={`#ev-${row.id}-${column.id}`}
                tabIndex={isActive ? 0 : -1}
                aria-label={describe(column, row, cell)}
                data-model={cell.isModel || undefined}
                onFocus={() => {
                  grid.setActive(here);
                  onHot(here);
                }}
                onMouseEnter={() => onHot(here)}
              >
                <VerdictBadge verdict={cell.verdict} isMarkOnly />
                {cell.share && <i className={styles.partial} aria-hidden="true" />}
              </a>
            )}
          </td>
        );
      })}
    </tr>
  );
}

const howTo =
  'Point at a verdict, or Tab into the table: arrow keys move, Enter opens the rule with that system\u2019s recording.';

/**
 * The cell under the pointer or focus, in words, and how to use the table while nothing is.
 * Screen readers hear the same from each cell's name and the table's description.
 */
function Readout({ rows, columns, hot }: VerdictMatrixProps & { hot: Cell | undefined }) {
  const row = hot && rows[hot.row];
  const column = hot && columns[hot.column];
  const cell = hot && column?.cells[hot.row];
  const isIdle = !(row && column && cell);
  return (
    <p className={styles.readout} data-idle={isIdle || undefined} aria-hidden="true">
      {isIdle ? howTo : describe(column, row, cell)}
    </p>
  );
}

/**
 * Where every column comes from: the raw measurement file and its date. One shared date is said
 * once, not after every system.
 */
function RawLinks({ columns }: { columns: readonly MatrixColumn[] }) {
  const dates = new Set(columns.map(({ measuredOn }) => measuredOn));
  const shared = dates.size === 1 ? columns[0]?.measuredOn : undefined;
  return (
    <p className={styles.raw}>
      {shared ? `Raw data, measured ${shared}: ` : 'Raw data: '}
      {columns.map((column, i) => (
        <span key={column.id}>
          {i > 0 && ' · '}
          <a href={column.rawHref}>{column.name}</a>
          {!shared && ` ${column.measuredOn}`}
        </span>
      ))}
    </p>
  );
}

interface VerdictMatrixProps {
  rows: readonly MatrixRow[];
  columns: readonly MatrixColumn[];
}

/**
 * Every rule against every measured system, one mark per cell. Pointing at or focusing a cell
 * lights its row and column and reads it out below; Enter opens the rule with that system.
 */
export function VerdictMatrix({ rows, columns }: VerdictMatrixProps) {
  const [hot, setHot] = useState<Cell | undefined>();
  const grid = useGridFocus({ rows: rows.length, columns: columns.length });
  return (
    <div className={styles.matrix}>
      <MatrixKey columns={columns} />
      <div className={styles.scroller}>
        <table
          role="grid"
          aria-labelledby="matrix-title"
          aria-describedby="matrix-help"
          onKeyDown={grid.onKeyDown}
          onMouseLeave={() => setHot(undefined)}
          onBlur={(event) =>
            !event.currentTarget.contains(event.relatedTarget) && setHot(undefined)
          }
        >
          <caption id="matrix-title" className="visually-hidden">
            Every rule against every measured system
          </caption>
          <MatrixHead columns={columns} hot={hot} />
          <tbody>
            {rows.map((row, r) => (
              <RowView
                key={row.id}
                row={row}
                r={r}
                columns={columns}
                hot={hot}
                onHot={setHot}
                grid={grid}
              />
            ))}
          </tbody>
        </table>
      </div>
      <Readout rows={rows} columns={columns} hot={hot} />
      {/* Said once on screen by the readout; this copy is the table's description. */}
      <p id="matrix-help" className="visually-hidden">
        Arrow keys move between verdicts; Enter opens the rule with that system&rsquo;s recording.
      </p>
      <RawLinks columns={columns} />
    </div>
  );
}
