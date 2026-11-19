import { describe, expect, it } from 'vitest';
import type { Measurement, Verdict } from '@earshot/contracts';
import type { TargetEntry } from '@earshot/contracts';
import { countedVerdicts, notCountedAdapters, ruleAgreement } from '../../src/lib/agreement';

const measurement = (adapter: string, verdicts: Record<string, Verdict>): Measurement =>
  ({
    target: { adapter, system: adapter },
    provenance: { status: 'measured' },
    verdicts: Object.fromEntries(
      Object.entries(verdicts).map(([rule, verdict]) => [
        rule,
        { verdict, summary: verdict, reason: verdict },
      ]),
    ),
  }) as unknown as Measurement;

describe('ruleAgreement', () => {
  const reference = measurement('reference', { bsp: 'follows' });
  const systems = [
    measurement('atlassian', { bsp: 'differs' }),
    measurement('fluent', { bsp: 'follows' }),
    measurement('primer', { bsp: 'inconclusive' }),
  ];

  it('counts measured systems by verdict and never counts the reference', () => {
    expect(ruleAgreement('bsp', [reference, ...systems])).toEqual({
      measured: 3,
      judged: 2,
      follows: 1,
      differs: 1,
      inconclusive: 1,
      notApplicable: 0,
    });
  });

  // Verdict audit 2026-11-09: "0 of 5 follow" read as five systems that do not, when three
  // could not be judged. Agreement is counted over the systems the rule could be judged on.
  it('counts as judged only the systems that follow or differ', () => {
    expect(ruleAgreement('bsp', [reference, ...systems]).judged).toBe(2);
  });

  it('ignores illustrative records entirely', () => {
    const sample = {
      ...measurement('sample', { bsp: 'follows' }),
      provenance: { status: 'illustrative', note: 'sample' },
    } as Measurement;
    expect(ruleAgreement('bsp', [sample]).measured).toBe(0);
  });

  it('reports nothing measured for a rule no system has a verdict for', () => {
    expect(ruleAgreement('tab', systems).measured).toBe(0);
  });

  it('leaves out components their own maintainers deprecated', () => {
    expect(ruleAgreement('bsp', [reference, ...systems], new Set(['primer']))).toEqual({
      measured: 2,
      judged: 2,
      follows: 1,
      differs: 1,
      inconclusive: 0,
      notApplicable: 0,
    });
  });
});

describe('countedVerdicts', () => {
  it('names each counted system with its verdict, without the reference or deprecated ones', () => {
    const all = [
      measurement('reference', { bsp: 'follows' }),
      measurement('atlassian', { bsp: 'differs' }),
      measurement('primer', { bsp: 'follows' }),
    ];
    expect(countedVerdicts('bsp', all, new Set(['primer']))).toEqual([
      { system: 'atlassian', adapter: 'atlassian', verdict: 'differs' },
    ]);
  });
});

describe('notCountedAdapters', () => {
  it('names the measured targets that carry a deprecation notice', () => {
    const targets = [
      {
        status: 'measured',
        system: 'Primer',
        adapter: 'primer',
        deprecated: 'https://primer.style/x',
      },
      { status: 'measured', system: 'Fluent', adapter: 'fluent' },
      { status: 'not-applicable', system: 'Carbon' },
    ] as unknown as TargetEntry[];
    expect([...notCountedAdapters(targets)]).toEqual(['primer']);
  });
});
