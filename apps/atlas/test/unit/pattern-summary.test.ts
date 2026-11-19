import { describe, expect, it } from 'vitest';
import type { Measurement, TargetEntry } from '@earshot/contracts';
import { patternSummary } from '../../src/lib/pattern-summary';

const measured = (adapter: string, measuredAt: string) =>
  ({
    target: { adapter },
    provenance: { status: 'measured', measuredAt },
  }) as unknown as Measurement;

const targets = [
  { status: 'measured', system: 'A' },
  { status: 'planned', system: 'React Aria' },
  { status: 'not-applicable', system: 'Carbon' },
  { status: 'not-applicable', system: 'GOV.UK' },
] as unknown as TargetEntry[];

describe('patternSummary', () => {
  it('counts measured design systems without the reference, and the latest date', () => {
    const summary = patternSummary(
      [
        measured('reference', '2026-11-08T00:00:00.000Z'),
        measured('atlassian', '2026-11-06T00:00:00.000Z'),
        measured('fluent', '2026-11-07T00:00:00.000Z'),
      ],
      targets,
    );
    expect(summary).toEqual({
      measuredSystems: 2,
      notApplicable: 2,
      planned: 1,
      lastMeasuredAt: '2026-11-07T00:00:00.000Z',
    });
  });

  it('never counts an illustrative record as measured', () => {
    const sample = {
      target: { adapter: 'x' },
      provenance: { status: 'illustrative' },
    } as unknown as Measurement;
    expect(patternSummary([sample], []).measuredSystems).toBe(0);
    expect(patternSummary([sample], []).lastMeasuredAt).toBeUndefined();
  });
});
