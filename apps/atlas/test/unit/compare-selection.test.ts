import { describe, expect, it } from 'vitest';
import {
  defaultComparison,
  maxCompared,
  parseCompared,
  serializeCompared,
  toggleCompared,
} from '../../src/lib/compare-selection';

const available = ['atlassian', 'fluent', 'primer', 'mui', 'react-aria', 'chakra'];
const fallback = ['mui', 'react-aria'];

describe('parseCompared', () => {
  it('reads known systems from the query, in the order given', () => {
    expect(parseCompared('chakra,fluent', { available, fallback })).toEqual(['chakra', 'fluent']);
  });

  it('falls back to the default when the query is missing or names nothing we measured', () => {
    expect(parseCompared(null, { available, fallback })).toEqual(fallback);
    expect(parseCompared('carbon,,', { available, fallback })).toEqual(fallback);
  });

  it('drops duplicates and keeps at most three', () => {
    expect(parseCompared('mui,mui,fluent,chakra,primer', { available, fallback })).toEqual([
      'mui',
      'fluent',
      'chakra',
    ]);
  });
});

describe('toggleCompared', () => {
  it('adds a system that is not selected', () => {
    expect(toggleCompared(['mui'], 'chakra')).toEqual(['mui', 'chakra']);
  });

  it('removes a selected system, even the last one', () => {
    expect(toggleCompared(['mui', 'chakra'], 'mui')).toEqual(['chakra']);
    expect(toggleCompared(['mui'], 'mui')).toEqual([]);
  });

  it('does not add a fourth system', () => {
    const full = ['mui', 'chakra', 'fluent'];
    expect(full).toHaveLength(maxCompared);
    expect(toggleCompared(full, 'primer')).toBe(full);
  });
});

it('serializes the selection for the query string', () => {
  expect(serializeCompared(['react-aria', 'mui'])).toBe('react-aria,mui');
});

describe('defaultComparison', () => {
  const system = (id: string, [follows, differs]: [number, number], extra = {}) => ({
    id,
    follows,
    differs,
    isCounted: true,
    hasModel: false,
    ...extra,
  });

  it('pairs the closest match to the reference with the system that differs most', () => {
    expect(
      defaultComparison([
        system('atlassian', [0, 4]),
        system('fluent', [2, 2]),
        system('mui', [1, 2]),
      ]),
    ).toEqual(['fluent', 'atlassian']);
  });

  it('breaks ties by order, and prefers a difference a model explains', () => {
    expect(
      defaultComparison([
        system('atlassian', [0, 4]),
        system('fluent', [2, 2]),
        system('mui', [2, 2]),
        system('react-aria', [0, 4], { hasModel: true }),
      ]),
    ).toEqual(['fluent', 'react-aria']);
  });

  it('never picks a system that is not counted', () => {
    expect(
      defaultComparison([system('primer', [3, 0], { isCounted: false }), system('mui', [1, 3])]),
    ).toEqual(['mui']);
  });
});
