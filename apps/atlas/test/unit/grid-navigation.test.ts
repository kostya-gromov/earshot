import { describe, expect, it } from 'vitest';
import { nextCell } from '../../src/lib/grid-navigation';

const size = { rows: 8, columns: 6 };
const press = (key: string, ctrlKey = false) => ({ key, ctrlKey });

describe('nextCell', () => {
  it('moves one cell with the arrows and stops at the edges', () => {
    expect(nextCell({ row: 0, column: 0 }, press('ArrowRight'), size)).toEqual({
      row: 0,
      column: 1,
    });
    expect(nextCell({ row: 0, column: 0 }, press('ArrowLeft'), size)).toEqual({
      row: 0,
      column: 0,
    });
    expect(nextCell({ row: 7, column: 5 }, press('ArrowDown'), size)).toEqual({
      row: 7,
      column: 5,
    });
    expect(nextCell({ row: 3, column: 2 }, press('ArrowUp'), size)).toEqual({ row: 2, column: 2 });
  });

  it('goes to the row ends with Home and End, and the grid ends with Ctrl', () => {
    expect(nextCell({ row: 3, column: 2 }, press('Home'), size)).toEqual({ row: 3, column: 0 });
    expect(nextCell({ row: 3, column: 2 }, press('End'), size)).toEqual({ row: 3, column: 5 });
    expect(nextCell({ row: 3, column: 2 }, press('Home', true), size)).toEqual({
      row: 0,
      column: 0,
    });
    expect(nextCell({ row: 3, column: 2 }, press('End', true), size)).toEqual({
      row: 7,
      column: 5,
    });
  });

  it('leaves other keys to the browser', () => {
    expect(nextCell({ row: 0, column: 0 }, press('Enter'), size)).toBe(undefined);
  });
});
