import { describe, expect, it } from 'vitest';
import { inputWithChipsScenarios } from '../../src/scenarios/input-with-chips.ts';

describe('inputWithChipsScenarios', () => {
  it('defines the ten approved scenarios in order', () => {
    expect(inputWithChipsScenarios.map(({ id }) => id)).toEqual([
      'chip-tab',
      'chip-shift-tab',
      'chip-arrows',
      'tab-out',
      'shift-tab-out',
      'tab-from-chip',
      'backspace-twice',
      'arrows',
      'delete-focused',
      'remove-click',
    ]);
  });

  it('uses one target-independent initial state', () => {
    expect(
      inputWithChipsScenarios.every(({ initialState }) => initialState.selectedItemCount === 3),
    ).toBe(true);
  });

  it('uses a semantic interaction id for the click scenario', () => {
    expect(inputWithChipsScenarios.at(-1)?.steps).toEqual([
      { type: 'click', target: 'second-remove-control' },
    ]);
  });

  it('covers every input-with-chips rule', () => {
    expect(new Set(inputWithChipsScenarios.flatMap(({ rules }) => rules))).toEqual(
      new Set(['chip-stop', 'chip-arrows', 'tab', 'arrows', 'bsp', 'keep-focus', 'say', 'count']),
    );
  });
});
