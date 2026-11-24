import { describe, expect, it } from 'vitest';
import { patterns, patternsInProgress, tabs } from '../src/index.ts';

describe('tabs pattern', () => {
  it('has a page on the site: it is in `patterns`, no longer in progress', () => {
    expect(patterns[tabs.id]).toBe(tabs);
    expect(patternsInProgress[tabs.id]).toBeUndefined();
  });

  it('has the nine rules of the approved proposal, one of them an Earshot recommendation', () => {
    expect(tabs.rules.map((rule) => rule.id)).toEqual([
      'tab-in',
      'tab-out',
      'panel-reachable',
      'arrows',
      'wrap',
      'activate',
      'selected',
      'panel',
      'vertical-keys-free',
    ]);
    expect(tabs.rules.filter((rule) => rule.level === 'recommendation')).toHaveLength(1);
  });

  it('cites an APG page in every rule', () => {
    for (const rule of tabs.rules) {
      expect(rule.sources.some((source) => source.kind === 'apg')).toBe(true);
    }
  });
});
