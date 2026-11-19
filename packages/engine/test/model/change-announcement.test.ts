import type { Step } from '@earshot/contracts';
import { describe, expect, it } from 'vitest';
import {
  judgeChangeAnnouncement,
  liveTexts,
  saidTexts,
  textsSeenWithout,
} from '../../src/model/change-announcement.ts';
import { step } from '../evaluators/input-with-chips/fixtures.ts';

const written = (text: string, insertedLate = false) => ({
  text,
  politeness: 'polite' as const,
  at: 1,
  insertedLate,
});
const inserted = (text: string) => ({ text, politeness: 'polite' as const });
const change = { noun: 'removal', named: 'the removed value' };
const removes = (value: Step) => value.axDiff.removed.length > 0;

describe('liveTexts', () => {
  it('reads written texts and regions that arrived with text, and says how each arrived', () => {
    const texts = liveTexts(
      step({
        announcements: [written('A'), written('B', true)],
        insertedRegions: [inserted('C')],
      }),
    );
    expect(texts).toEqual([
      { text: 'A', arrival: 'written' },
      { text: 'B', arrival: 'written-late' },
      { text: 'C', arrival: 'inserted' },
    ]);
    expect(saidTexts(texts)).toBe(
      '"A", "B", "C" (in a region that entered the page during this step) (in a region that entered the page already holding its text)',
    );
  });
});

describe('a region that arrives and is written to in the same step', () => {
  it('is one text, not two', () => {
    const texts = liveTexts(
      step({ announcements: [written('Apple', true)], insertedRegions: [inserted('Apple')] }),
    );
    expect(texts).toEqual([{ text: 'Apple', arrival: 'written-late' }]);
  });
});

describe('textsSeenWithout', () => {
  it('finds a text only in steps without the change, with where it was first seen', () => {
    const removal = step({
      announcements: [written('Gone')],
      axDiff: { added: [], removed: [{ role: 'row', name: 'X' }], changed: [] },
    });
    const tab = step({ action: { type: 'press', key: 'Tab' }, insertedRegions: [inserted('All')] });
    const seen = textsSeenWithout(
      [
        { scenarioId: 'remove-click', steps: [removal] },
        { scenarioId: 'tab-out', steps: [tab] },
        { scenarioId: 'tab-from-chip', steps: [tab] },
      ],
      removes,
    );
    expect([...seen.keys()]).toEqual(['All']);
    expect(seen.get('All')?.scenarioId).toBe('tab-out');
  });
});

describe('judgeChangeAnnouncement', () => {
  const ask = (value: Step, names: (text: string) => boolean | undefined, seen = new Map()) =>
    judgeChangeAnnouncement({ step: value, names, seenWithout: seen, change });

  it('is silent when no live region held any text', () => {
    expect(ask(step(), () => true)).toEqual({ kind: 'silent' });
  });

  it('counts the texts that name the change and appear nowhere without it', () => {
    const result = ask(step({ announcements: [written('X removed'), written('Hint')] }), (text) =>
      text.includes('X'),
    );
    expect(result).toEqual({
      kind: 'announced',
      texts: [{ text: 'X removed', arrival: 'written' }],
    });
  });

  it('does not count a text that names nothing, and says so with the quote', () => {
    expect(ask(step({ announcements: [written('Updated')] }), () => false)).toEqual({
      kind: 'not-counted',
      reason:
        'A live region said "Updated". It does not name the removed value. So it is not counted as an announcement of the removal.',
    });
  });

  it('cannot tell when nothing rules a text out and the recording does not show the change', () => {
    const result = ask(step({ announcements: [written('Updated')] }), () => undefined);
    expect(result.kind).toBe('undetermined');
  });
});
