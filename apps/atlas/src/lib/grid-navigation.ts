export interface Cell {
  row: number;
  column: number;
}

/**
 * APG grid keyboard model (https://www.w3.org/WAI/ARIA/apg/patterns/grid/): arrows move one cell
 * and stop at the edges, Home and End go to the row's ends, Ctrl+Home and Ctrl+End to the grid's.
 * Returns the cell to focus, or undefined when the key is not part of the pattern.
 */
export function nextCell(
  { row, column }: Cell,
  { key, ctrlKey }: { key: string; ctrlKey: boolean },
  { rows, columns }: { rows: number; columns: number },
): Cell | undefined {
  const lastRow = rows - 1;
  const lastColumn = columns - 1;
  switch (key) {
    case 'ArrowRight':
      return { row, column: Math.min(column + 1, lastColumn) };
    case 'ArrowLeft':
      return { row, column: Math.max(column - 1, 0) };
    case 'ArrowDown':
      return { row: Math.min(row + 1, lastRow), column };
    case 'ArrowUp':
      return { row: Math.max(row - 1, 0), column };
    case 'Home':
      return ctrlKey ? { row: 0, column: 0 } : { row, column: 0 };
    case 'End':
      return ctrlKey ? { row: lastRow, column: lastColumn } : { row, column: lastColumn };
    default:
      return undefined;
  }
}
