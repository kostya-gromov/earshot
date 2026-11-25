import { describe, expect, it } from 'vitest';
import { patterns, patternsInProgress, select } from '../src/index.ts';

describe('select pattern', () => {
  it('is one of the patterns since 2026-11-25, and no longer in progress', () => {
    expect(patterns[select.id]).toBe(select);
    expect(patternsInProgress[select.id]).toBeUndefined();
  });

  it('has the eleven rules of the approved proposal, two of them Earshot recommendations', () => {
    expect(select.rules.map((rule) => rule.id)).toEqual([
      'tab',
      'name-and-value',
      'name-is-label',
      'down',
      'expanded',
      'focus-stays',
      'arrows',
      'selected',
      'enter',
      'escape',
      'escape-keeps-value',
    ]);
    expect(
      select.rules.filter((rule) => rule.level === 'recommendation').map((rule) => rule.id),
    ).toEqual(['name-is-label', 'escape-keeps-value']);
  });

  it('cites an APG page in every rule, and WCAG only as related or rationale', () => {
    for (const rule of select.rules) {
      expect(rule.sources.some((source) => source.kind === 'apg')).toBe(true);
      for (const source of rule.sources.filter(({ kind }) => kind === 'wcag')) {
        expect(source.relation).toBe('related');
      }
    }
  });

  it('charges a name that holds the value once, to name-and-value', () => {
    const nameIsLabel = select.rules.find((rule) => rule.id === 'name-is-label')!;
    expect(nameIsLabel.description).toContain(
      'Not judged where the select is not exposed as a combobox, its name is empty, its name contains the value, or, with no value, its name is more than its label',
    );
  });

  it('holds a reviewed trade-off for each rule a measured system differs on', () => {
    expect(
      select.tradeOffs.map((tradeOff) => tradeOff.kind !== 'model' && tradeOff.ruleId),
    ).toEqual(['selected', 'focus-stays', 'name-and-value']);
    expect(select.tradeOffs.every((tradeOff) => tradeOff.status === 'reviewed')).toBe(true);
  });

  it('names in selected the roles sentence that allows the other model', () => {
    const selected = select.rules.find((rule) => rule.id === 'selected')!;
    expect(selected.description).toContain('“visually indicated as the currently selected value”');
  });
});
