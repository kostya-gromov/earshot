import { describe, expect, it } from 'vitest';
import { Measurement, checkMeasurementAgainstPattern, inputWithChips } from '../src/index.ts';
import { measuredSample } from './fixtures.ts';

const messages = (input: unknown) => {
  const result = Measurement.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
};

describe('Measurement schema', () => {
  it('accepts a complete measured record', () => {
    expect(messages(measuredSample())).toEqual([]);
  });

  it('rejects a measured record without engine provenance', () => {
    const sample = measuredSample();
    const { engineVersion: _, ...provenance } = sample.provenance;
    expect(messages({ ...sample, provenance })).not.toEqual([]);
  });

  it('rejects an illustrative record that carries measured fields', () => {
    const sample = measuredSample();
    const provenance = { ...sample.provenance, status: 'illustrative', note: 'Sample data' };
    expect(messages({ ...sample, provenance })).not.toEqual([]);
  });

  it('rejects an unknown system version without a reason', () => {
    const sample = measuredSample();
    sample.target.systemVersion = { version: 'unknown' } as never;
    expect(messages(sample)).not.toEqual([]);
  });

  it('rejects "unknown" smuggled in as a regular version', () => {
    const sample = measuredSample();
    sample.target.systemVersion = { version: 'unknown', source: 'guess' };
    expect(messages(sample)).not.toEqual([]);
  });

  it('records a locally served page by its repository path, never a local port', () => {
    const sample = measuredSample();
    sample.target.url = 'packages/harness/fluent/index.html';
    expect(messages(sample)).toEqual([]);
    sample.target.url = 'harness/fluent';
    expect(messages(sample)).not.toEqual([]);
  });

  it('rejects fields the schema does not know', () => {
    expect(messages({ ...measuredSample(), score: 97 })).not.toEqual([]);
  });

  it('requires every scenario to keep all runs', () => {
    const sample = measuredSample();
    sample.scenarios[0]!.runs.pop();
    expect(messages(sample)).toEqual([
      expect.stringContaining('scenarios.0.runs: Expected 3 runs'),
    ]);
  });

  it('requires inconsistent runs to leave an inconclusive verdict', () => {
    const sample = measuredSample();
    sample.provenance.consistent = false;
    expect(messages(sample)).toEqual([expect.stringContaining('provenance.consistent')]);

    sample.verdicts.bsp = {
      verdict: 'inconclusive',
      summary: 'Runs disagreed',
      reason: 'flaky: runs disagreed on step 1',
    };
    expect(messages(sample)).toEqual([]);
  });

  it('rejects a verdict for a rule no scenario exercises', () => {
    const sample = measuredSample();
    Object.assign(sample.verdicts, {
      tab: { verdict: 'follows', summary: 'Leaves in one step', reason: 'Tab left the field.' },
    });
    expect(messages(sample)).toEqual([expect.stringContaining('verdicts.tab')]);
  });
});

describe('verdict summary', () => {
  it('is required, so every verdict has a short phrase for the comparison matrix', () => {
    const sample = measuredSample();
    sample.verdicts.bsp = { verdict: 'follows', reason: 'First Backspace moved focus.' } as never;
    expect(messages(sample)).toEqual([expect.stringContaining('verdicts.bsp.summary')]);
  });

  it('fits a matrix cell: at most 60 characters', () => {
    const sample = measuredSample();
    sample.verdicts.bsp.summary = 'x'.repeat(61);
    expect(messages(sample)).toEqual([expect.stringContaining('verdicts.bsp.summary')]);
  });
});

describe('checkMeasurementAgainstPattern', () => {
  it('reports rules of the pattern that have no verdict', () => {
    const m = Measurement.parse(measuredSample());
    expect(checkMeasurementAgainstPattern(m, inputWithChips)).toEqual([
      'verdicts: missing verdict for rule "chip-stop"',
      'verdicts: missing verdict for rule "chip-arrows"',
      'verdicts: missing verdict for rule "tab"',
      'verdicts: missing verdict for rule "arrows"',
      'verdicts: missing verdict for rule "keep-focus"',
      'verdicts: missing verdict for rule "say"',
      'verdicts: missing verdict for rule "count"',
    ]);
  });
});
