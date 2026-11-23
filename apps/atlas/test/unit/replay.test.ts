import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Measurement } from '@earshot/contracts';
import { endsOutsidePage, scenarioReplay, spokenLines } from '../../src/lib/replay';

// From the measured file: the last Shift+Tab of "tab-in-back" goes on past the page's first field.
const tabsOf = (adapter: string) =>
  Measurement.parse(
    JSON.parse(
      readFileSync(
        path.join(import.meta.dirname, `../../../../data/measurements/tabs/${adapter}.json`),
        'utf8',
      ),
    ),
  );

describe('a step that ends outside the page', () => {
  it('has no spoken line: since engine 0.20.0 the file holds none for it either', () => {
    const steps = scenarioReplay(tabsOf('react-aria'), 'tab-in-back', []);
    const last = steps.at(-1)!;
    expect(endsOutsidePage(last)).toBe(true);
    expect(last.speech).toEqual([]);
    expect(spokenLines(last)).toEqual([]);
    // Every other step keeps its lines as recorded.
    const first = steps[0]!;
    expect(endsOutsidePage(first)).toBe(false);
    expect(spokenLines(first)).toEqual(first.speech);
  });
});

const load = (adapter: string) =>
  Measurement.parse(
    JSON.parse(
      readFileSync(
        path.join(
          import.meta.dirname,
          `../../../../data/measurements/input-with-chips/${adapter}.json`,
        ),
        'utf8',
      ),
    ),
  );
const people = ['Irene Oh', 'Greg Fisher', 'Hiroshi Matsui'];

describe('scenarioReplay', () => {
  it('follows focus to a chip by its place, and removes the chip on the second press', () => {
    const steps = scenarioReplay(load('reference'), 'backspace-twice', people);
    expect(
      steps.map(({ to }) => (to.kind === 'chip' ? `${to.index} of ${to.count}` : to.kind)),
    ).toEqual(['3 of 3', '2 of 2']);
    expect(steps.map(({ removed }) => removed)).toEqual([[], ['Hiroshi Matsui']]);
    expect(steps[1]?.heard).toEqual(['Hiroshi Matsui removed. 2 selected']);
  });

  it('reads a chip removed on the first press when focus stays in the input', () => {
    const steps = scenarioReplay(load('mui'), 'backspace-twice', people);
    expect(steps.map(({ to }) => to.kind)).toEqual(['input', 'input']);
    expect(steps.map(({ removed }) => removed)).toEqual([['Hiroshi Matsui'], ['Greg Fisher']]);
  });

  // A re-render removes and adds the same node in one step; that is not a removal.
  it('does not count a node that left and came back in the same step', () => {
    const steps = scenarioReplay(load('primer'), 'arrows', people);
    expect(steps[0]?.removed).toEqual([]);
  });

  it('removes nothing when the keys never reach the chips', () => {
    const steps = scenarioReplay(load('react-aria'), 'backspace-twice', people);
    expect(steps.flatMap(({ removed }) => removed)).toEqual([]);
  });

  it('returns no steps for a scenario whose setup never ran', () => {
    expect(scenarioReplay(load('chakra'), 'chip-tab', people)).toEqual([]);
  });
});
