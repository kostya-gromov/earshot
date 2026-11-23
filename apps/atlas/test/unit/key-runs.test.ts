import { describe, expect, it } from 'vitest';
import { keyRuns, pressesDone } from '../../src/lib/key-runs';

describe('keyRuns', () => {
  it('folds repeats of one key and leaves different keys apart', () => {
    expect(keyRuns(['Shift+Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab'])).toEqual([
      { key: 'Shift+Tab', start: 0, count: 4 },
    ]);
    expect(keyRuns(['ArrowDown', 'ArrowDown', 'Enter', 'ArrowDown'])).toEqual([
      { key: 'ArrowDown', start: 0, count: 2 },
      { key: 'Enter', start: 2, count: 1 },
      { key: 'ArrowDown', start: 3, count: 1 },
    ]);
    expect(keyRuns([])).toEqual([]);
  });

  it('says which press of a run the recording is at', () => {
    const run = { key: 'Tab', start: 2, count: 3 };
    expect([-1, 1, 2, 3, 4, 9].map((index) => pressesDone(run, index))).toEqual([0, 0, 1, 2, 3, 3]);
  });
});
