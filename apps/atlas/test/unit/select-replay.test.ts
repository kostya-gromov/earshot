import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Measurement } from '@earshot/contracts';
import { describe, expect, it } from 'vitest';
import { describeComboboxChange, describeComboboxStep } from '../../src/lib/combobox-replay';
import { selectSteps } from '../../src/lib/select-replay';

// From the measured files: a replay says nothing the recording does not hold.
const measured = path.join(import.meta.dirname, '../../../../data/measurements/select');
const run = (adapter: string, scenarioId: string) => {
  const measurement = Measurement.parse(
    JSON.parse(readFileSync(path.join(measured, `${adapter}.json`), 'utf8')),
  );
  const first = measurement.scenarios.find(({ id }) => id === scenarioId)?.runs[0];
  if (first?.status !== 'completed') throw new Error(`${adapter}: no completed run`);
  return first.steps;
};

describe('a select replay', () => {
  it('draws the value the tree gives the select, not a text field', () => {
    const [opened] = selectSteps(run('reference', 'open'));
    expect(opened!.before).toMatchObject({
      isSelect: true,
      value: 'Banana',
      focus: { kind: 'select' },
    });
    expect(opened!.after.options).toHaveLength(5);
    expect(opened!.after.focus).toEqual({ kind: 'select' });
  });

  it('says which value Enter leaves', () => {
    const steps = selectSteps(run('reference', 'enter'));
    const chosen = steps.at(-1)!;
    expect(chosen.after.value).toBe('Cherry');
    expect(describeComboboxChange(chosen)).toContain('Value “Cherry”.');
  });

  it('draws no value while the select is out of the tree, as MUI’s is with its list open', () => {
    // Not the last value read: the tree held none at that step (verdict audit, 2026-11-24).
    const [opened] = selectSteps(run('mui', 'open'));
    expect(opened!.after).toMatchObject({ value: undefined, isOutOfTree: true });
    expect(opened!.after.focus).toMatchObject({ kind: 'option' });
    expect(describeComboboxChange(opened!)).toContain('The select is not in the tree.');
  });

  it('gives the description where the select names no value, as Atlassian’s does', () => {
    const [arrived] = selectSteps(run('atlassian', 'tab-in'));
    expect(arrived!.after).toMatchObject({ value: undefined, description: 'Banana' });
    expect(describeComboboxStep(arrived!)).toContain('No value; described as “Banana”');
  });

  it('names focus on the list itself, as Chakra UI records it', () => {
    const [opened] = selectSteps(run('chakra', 'open'));
    expect(opened!.after.focus).toEqual({ kind: 'list' });
    expect(describeComboboxChange(opened!)).toContain('Focus on the list itself.');
  });

  it('says “No value” on every step of a select that never has one (design review, 2026-11-24)', () => {
    for (const step of selectSteps(run('react-aria', 'tab-in'))) {
      expect(describeComboboxChange(step)).toContain('No value.');
    }
  });

  it('draws no value where the select exposes none, as React Aria’s button does', () => {
    const [opened] = selectSteps(run('react-aria', 'open'));
    expect(opened!.before.value).toBeUndefined();
    expect(opened!.before.focus).toEqual({ kind: 'select' });
  });
});
