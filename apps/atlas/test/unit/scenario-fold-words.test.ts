import { describe, expect, it } from 'vitest';
import { foldLabel, foldRowWords } from '../../src/lib/scenario-fold-words';
import type { ScenarioResult } from '../../src/lib/scenario-groups';

const result = (judgedSteps: number | undefined, recordedSteps?: number): ScenarioResult => ({
  scenario: 's',
  verdict: 'follows',
  summary: 'Matches',
  reason: 'Matched after each of the 3 steps judged (0 not judged).',
  judgedSteps,
  recordedSteps,
});

describe('foldLabel', () => {
  it('sums the judged steps the files give', () => {
    expect(foldLabel([result(3, 3), result(5, 6), result(1, 1)])).toBe(
      '3 more scenarios, same result, 9 steps judged',
    );
    expect(foldLabel([result(1, 1)])).toBe('1 more scenario, same result, 1 step judged');
  });

  it('gives no count where a file gives none for a scenario', () => {
    expect(foldLabel([result(3, 3), result(undefined, 2)])).toBe('2 more scenarios, same result');
  });

  it('does not call scenarios with nothing judged a result that repeats', () => {
    expect(foldLabel([result(0, 1), result(0, 3), result(0, 2)])).toBe(
      '3 more scenarios recorded, not judged',
    );
  });
});

describe('foldRowWords', () => {
  it('says how many steps were judged, and how many were not when any were not', () => {
    expect(foldRowWords(result(4, 4))).toBe('4 steps judged');
    expect(foldRowWords(result(1, 1))).toBe('1 step judged');
    expect(foldRowWords(result(5, 6))).toBe('5 steps judged, 1 not judged');
  });

  it('says how many steps were recorded where none was judged', () => {
    expect(foldRowWords(result(0, 3))).toBe('3 steps recorded');
    expect(foldRowWords(result(0))).toBe('not judged');
  });

  it('gives the reason in full where the file records no count', () => {
    expect(foldRowWords(result(undefined, 3))).toMatch(/^Matched after each/);
  });
});
