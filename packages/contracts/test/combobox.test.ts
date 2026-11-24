import { describe, expect, it } from 'vitest';
import { combobox, patterns, patternsInProgress } from '../src/index.ts';

describe('combobox pattern', () => {
  it('has a page on the site: it is in `patterns`, no longer in progress', () => {
    expect(patterns[combobox.id]).toBe(combobox);
    expect(patternsInProgress[combobox.id]).toBeUndefined();
  });

  it('has the ten approved rules, two of them Earshot recommendations', () => {
    expect(combobox.rules.map((rule) => rule.id)).toEqual([
      'tab',
      'expanded',
      'down',
      'focus-stays',
      'arrows',
      'selected',
      'enter',
      'escape',
      'say-results',
      'say-count',
    ]);
    const recommendations = combobox.rules.filter((rule) => rule.level === 'recommendation');
    expect(recommendations.map((rule) => rule.id)).toEqual(['say-results', 'say-count']);
  });

  it('cites the APG combobox pattern for every rule the standards ask for', () => {
    for (const rule of combobox.rules.filter((r) => r.level === 'rule')) {
      expect(rule.sources.some((source) => source.kind === 'apg')).toBe(true);
    }
  });

  it('marks a WCAG criterion that does not itself ask for the behaviour as related', () => {
    const wcagSources = combobox.rules.flatMap((rule) =>
      rule.sources.filter((source) => source.kind === 'wcag'),
    );
    expect(wcagSources.length).toBeGreaterThan(0);
    for (const source of wcagSources) expect(source.note).toMatch(/^Related: /);
  });

  it('says in the text of every recommendation that it is ours', () => {
    for (const rule of combobox.rules.filter((r) => r.level === 'recommendation')) {
      expect(rule.description).toContain('An Earshot recommendation');
    }
  });
});
