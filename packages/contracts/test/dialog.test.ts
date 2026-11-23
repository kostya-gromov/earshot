import { describe, expect, it } from 'vitest';
import { dialog, patterns, patternsInProgress } from '../src/index.ts';

describe('dialog pattern', () => {
  it('is one of the patterns since 2026-11-23, and none is in progress', () => {
    expect(patterns[dialog.id]).toBe(dialog);
    expect(patternsInProgress).toEqual({});
  });

  it('has the ten rules of the opened proposal, two of them Atlas recommendations', () => {
    expect(dialog.rules.map((rule) => rule.id)).toEqual([
      'open-focus',
      'focus-not-on-dialog',
      'contained',
      'wrap',
      'escape',
      'return-focus',
      'named-dialog',
      'name-matches-title',
      'modal',
      'outside-inert',
    ]);
    expect(
      dialog.rules.filter((rule) => rule.level === 'recommendation').map((rule) => rule.id),
    ).toEqual(['focus-not-on-dialog', 'name-matches-title']);
  });

  it('cites an APG page in every rule', () => {
    for (const rule of dialog.rules) {
      expect(rule.sources.some((source) => source.kind === 'apg')).toBe(true);
    }
  });

  it('says when contained and wrap are not judged, as the other conditional rules do', () => {
    for (const id of ['contained', 'wrap']) {
      const rule = dialog.rules.find((candidate) => candidate.id === id)!;
      expect(rule.description).toContain('Not judged when focus never moved into the dialog');
    }
  });

  it('says in return-focus that a close by a click outside is recorded, not judged', () => {
    const returnFocus = dialog.rules.find((rule) => rule.id === 'return-focus')!;
    expect(returnFocus.description).toContain(
      'A close by a click outside is recorded and not judged: only some systems close on that click',
    );
  });

  it('names the document in contained, which its evaluator charges', () => {
    const contained = dialog.rules.find((rule) => rule.id === 'contained')!;
    expect(contained.description).toContain('or let it fall to the document');
  });

  it('holds two trade-offs the owner reviewed; the one for wrap names no system', () => {
    expect(dialog.tradeOffs.map((tradeOff) => tradeOff.status)).toEqual(['reviewed', 'reviewed']);
    // No gain on record for leaving the modal property out, so it is a note, not an alternative.
    expect(dialog.tradeOffs[1]).toMatchObject({ kind: 'none', ruleId: 'modal' });
    expect(dialog.tradeOffs[0]).toMatchObject({
      kind: 'alternative',
      ruleId: 'wrap',
      status: 'reviewed',
    });
    expect(dialog.tradeOffs[0]).not.toHaveProperty('seenIn');
  });

  it('has the six design requirements the owner approved, two of them from WCAG itself', () => {
    expect(dialog.requirements.map(({ id }) => id)).toEqual([
      'visible-title',
      'visible-close',
      'page-behind-dimmed',
      'dialog-focus-visible',
      'initial-focus-decided',
      'close-target',
    ]);
    expect(dialog.requirements.filter(({ level }) => level === 'wcag').map(({ id }) => id)).toEqual(
      ['dialog-focus-visible', 'close-target'],
    );
    // `wcag` only with a WCAG page behind it; `guidance` here always rests on APG.
    for (const { level, sources } of dialog.requirements) {
      expect(
        sources.some(({ kind }) => kind === level || (level === 'guidance' && kind === 'apg')),
      ).toBe(true);
    }
  });
});
