import { describe, expect, it } from 'vitest';
import type { Measurement, Pattern, Verdict } from '@earshot/contracts';
import { methodTotals } from '../../src/lib/method-totals';

const focus = (name: string) => ({ isBody: false, role: 'button', name });

interface StepShape {
  from: string;
  to: string;
  removed?: number;
  said?: number;
}

const step = ({ from, to, removed = 0, said = 0 }: StepShape) => ({
  focusBefore: focus(from),
  focusAfter: focus(to),
  axDiff: { added: [], removed: Array.from({ length: removed }, () => ({})), changed: [] },
  announcements: Array.from({ length: said }, () => ({})),
});

interface FileShape {
  adapter: string;
  verdict: Verdict;
  steps: StepShape[];
  measuredAt?: string;
}

const measurement = ({ adapter, verdict, steps, measuredAt = '2026-11-01T00:00:00Z' }: FileShape) =>
  ({
    target: { adapter, system: adapter },
    provenance: { status: 'measured', measuredAt, runs: 3 },
    scenarios: [
      {
        runs: [
          { status: 'completed', steps: steps.map(step) },
          { status: 'setup-failed', reason: 'no page' },
        ],
      },
    ],
    verdicts: { bsp: { verdict, summary: verdict, reason: verdict } },
  }) as unknown as Measurement;

const source = (url: string, note?: string, relation?: 'related' | 'rationale') => ({
  ...(note && { note }),
  ...(relation && { relation }),
  kind: 'wcag',
  sc: '2.4.3',
  title: `Understanding SC 2.4.3: Page ${url}`,
  url,
});

const pattern = {
  id: 'input-with-chips',
  name: 'Input with chips',
  rules: [
    {
      id: 'bsp',
      title: 'Backspace twice',
      level: 'recommendation',
      keys: ['Backspace'],
      sources: [source('a')],
    },
    {
      id: 'keep-focus',
      title: 'Keep focus',
      level: 'rule',
      keys: ['Backspace', 'Delete'],
      sources: [
        source('a'),
        source('b', 'Related: not asked for.', 'related'),
        source('c', 'The example’s keyboard table for Enter.'),
        source('d', 'Cited as rationale. The criterion covers something else.', 'rationale'),
      ],
    },
  ],
} as unknown as Pattern;

const none: ReadonlySet<string> = new Set();

describe('methodTotals', () => {
  const measurements = [
    measurement({ adapter: 'reference', verdict: 'follows', steps: [{ from: 'a', to: 'b' }] }),
    measurement({
      adapter: 'fluent',
      verdict: 'follows',
      measuredAt: '2026-11-13T00:00:00Z',
      steps: [
        { from: 'a', to: 'a', removed: 1, said: 2 },
        { from: 'a', to: 'b' },
      ],
    }),
    measurement({ adapter: 'primer', verdict: 'differs', steps: [{ from: 'a', to: 'a' }] }),
  ];
  const totals = methodTotals([{ pattern, measurements, notCounted: none }]);

  it('counts rules by level and lists each cited page once, by its short name, marking one no rule applies', () => {
    expect(totals.rules).toEqual({
      total: 2,
      fromStandards: 1,
      recommendations: 1,
      cited: [
        { label: 'WCAG 2.4.3', title: 'Page a', url: 'a', isRelatedOnly: false },
        { label: 'WCAG 2.4.3', title: 'Page b', url: 'b', isRelatedOnly: true },
        // A note that only says where on the page to look does not make the page "related".
        { label: 'WCAG 2.4.3', title: 'Page c', url: 'c', isRelatedOnly: false },
        { label: 'WCAG 2.4.3', title: 'Page d', url: 'd', isRelatedOnly: true },
      ],
    });
  });

  // Verdict audit 2026-11-14: with the reference and set-aside systems in, the recording counts
  // described more systems than the verdicts beside them.
  it('counts recorded steps of the counted systems only, never the reference', () => {
    expect(totals.recording).toEqual({ steps: 3, focusMoved: 1, treeChanged: 1, announced: 1 });
    expect(totals.systems).toBe(2);
    expect(totals.runs).toBe(3);
  });

  it('counts verdicts of the same systems, and which differences are against the standards', () => {
    expect(totals.verdicts).toEqual({
      total: 2,
      follows: 1,
      differs: 1,
      differsFromStandards: 0,
      inconclusive: 0,
      notApplicable: 0,
    });
  });

  it('leaves systems that are not counted out of recordings and verdicts alike', () => {
    const counted = methodTotals([{ pattern, measurements, notCounted: new Set(['primer']) }]);
    expect(counted.verdicts.total).toBe(1);
    expect(counted.recording.steps).toBe(2);
    expect(counted.systems).toBe(1);
  });

  // Verdict audit 2026-11-14: a system measured for two patterns is still one design system.
  it('counts a design system once however many patterns it is measured for', () => {
    const twice = methodTotals([
      { pattern, measurements, notCounted: none },
      { pattern, measurements, notCounted: none },
    ]);
    expect(twice.systems).toBe(2);
    expect(twice.recording.steps).toBe(6);
    // Each pattern is told with its own rules and counted systems, so the totals can be re-added.
    expect(twice.patterns).toEqual([
      { name: pattern.name, rules: pattern.rules.length, systems: 2 },
      { name: pattern.name, rules: pattern.rules.length, systems: 2 },
    ]);
  });

  it('reports the most recent measurement date', () => {
    expect(totals.latest).toBe('2026-11-13T00:00:00Z');
  });

  it('ignores illustrative files, and a pattern with no measured file adds no rules', () => {
    const sample = {
      ...measurement({ adapter: 'sample', verdict: 'follows', steps: [{ from: 'a', to: 'b' }] }),
      provenance: { status: 'illustrative', note: 'sample' },
    } as Measurement;
    const empty = methodTotals([{ pattern, measurements: [sample], notCounted: none }]);
    expect(empty.systems).toBe(0);
    expect(empty.patterns).toEqual([]);
    expect(empty.rules.total).toBe(0);
    expect(empty.latest).toBeUndefined();
  });
});
