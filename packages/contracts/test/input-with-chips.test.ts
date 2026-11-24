import { describe, expect, it } from 'vitest';
import { Pattern, inputWithChips } from '../src/index.ts';

describe('input-with-chips metadata', () => {
  it('has the eight rules from docs/patterns/input-with-chips.md, in order', () => {
    expect(inputWithChips.rules.map((r) => r.id)).toEqual([
      'chip-stop',
      'chip-arrows',
      'tab',
      'arrows',
      'bsp',
      'keep-focus',
      'say',
      'count',
    ]);
  });

  // Verdict audit 2026-11-09: only what a cited WCAG criterion or APG practice asks is a rule.
  it('marks what no cited standard asks for as an Earshot recommendation', () => {
    const levels = Object.fromEntries(inputWithChips.rules.map((r) => [r.id, r.level]));
    expect(levels).toEqual({
      'chip-stop': 'rule',
      // No cited page names Left and Right Arrow for chips in a row (2026-11-17).
      'chip-arrows': 'recommendation',
      tab: 'recommendation',
      arrows: 'recommendation',
      bsp: 'recommendation',
      // WCAG 2.4.3 is about the order of focus, not where it goes after a removal (2026-11-17).
      'keep-focus': 'recommendation',
      say: 'recommendation',
      count: 'recommendation',
    });
  });

  it('has a trade-off entry for every rule', () => {
    const ruleIds = inputWithChips.rules.map((r) => r.id);
    const perRule = inputWithChips.tradeOffs.flatMap((t) => (t.kind === 'model' ? [] : [t.ruleId]));
    expect(new Set(perRule)).toEqual(new Set(ruleIds));
  });

  it('keeps trade-offs as drafts until they are reviewed: the two models are, since 2026-11-15', () => {
    const status = (kind: string) =>
      new Set(inputWithChips.tradeOffs.flatMap((t) => (t.kind === kind ? [t.status] : [])));
    expect(status('model')).toEqual(new Set(['reviewed']));
    expect(status('alternative')).toEqual(new Set(['draft']));
  });

  it('links WCAG sources to the 2.2 Understanding page of the cited criterion', () => {
    const sources = [...inputWithChips.rules, ...inputWithChips.requirements].flatMap(
      (x) => x.sources,
    );
    for (const source of sources.filter((s) => s.kind === 'wcag')) {
      expect(source.title).toContain(source.sc);
    }
  });
});

describe('Pattern schema invariants', () => {
  const clone = () =>
    structuredClone(inputWithChips) as Record<string, unknown> & typeof inputWithChips;

  it('rejects duplicate rule ids', () => {
    const p = clone();
    p.rules.push({ ...p.rules[0]! });
    expect(Pattern.safeParse(p).success).toBe(false);
  });

  it('rejects a trade-off for an unknown rule', () => {
    const p = clone();
    p.tradeOffs[0] = { ...p.tradeOffs[0]!, ruleId: 'nope' } as (typeof p.tradeOffs)[number];
    expect(Pattern.safeParse(p).success).toBe(false);
  });

  it('rejects a model trade-off that names an unknown rule', () => {
    const p = clone();
    const model = p.tradeOffs.find((t) => t.kind === 'model')!;
    if (model.kind === 'model') model.ruleIds = ['tab', 'nope'];
    expect(Pattern.safeParse(p).success).toBe(false);
  });

  it('rejects a rule without sources', () => {
    const p = clone();
    p.rules[0]!.sources = [];
    expect(Pattern.safeParse(p).success).toBe(false);
  });

  it('rejects a WCAG link outside the WCAG 2.2 Understanding pages', () => {
    const p = clone();
    p.rules[0]!.sources = [
      {
        kind: 'wcag',
        sc: '2.1.1',
        title: 'Understanding SC 2.1.1: Keyboard',
        url: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
        checkedAt: '2026-10-31',
      },
    ];
    expect(Pattern.safeParse(p).success).toBe(false);
  });
});
