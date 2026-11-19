import { describe, expect, it } from 'vitest';
import { evaluateCount } from '../../../src/evaluators/input-with-chips/count.ts';
import { evaluatorInput, focus, step } from './fixtures.ts';

const heard = (text: string) => ({
  text,
  politeness: 'polite' as const,
  at: 1,
  insertedLate: false,
});
const clickRemoval = (text: string | undefined) =>
  evaluatorInput('remove-click', [
    step({
      action: { type: 'click', target: { role: 'button', name: 'Remove item 2' } },
      focusAfter: focus(),
      announcements: text === undefined ? [] : [heard(text)],
      axDiff: {
        added: [],
        removed: [
          { role: 'StaticText', name: 'item 2' },
          { role: 'button', name: 'Remove item 2' },
        ],
        changed: [],
      },
    }),
  ]);

describe('evaluateCount', () => {
  it('follows when the removal announcement says how many remain', () => {
    expect(evaluateCount(clickRemoval('item 2 removed. 2 selected'))).toEqual({
      verdict: 'follows',
      summary: 'Says how many remain',
      reason: 'The removal announcement included the new count of 2.',
    });
  });

  it('differs when the removal is announced without the new count', () => {
    expect(evaluateCount(clickRemoval('option item 2, deselected'))).toEqual({
      verdict: 'differs',
      summary: 'Announced without the new count',
      reason: 'Removal was announced as "option item 2, deselected" without the new count of 2.',
    });
  });

  it('differs when the count is wrong', () => {
    expect(evaluateCount(clickRemoval('item 2 removed. 3 selected')).verdict).toBe('differs');
  });

  // A removal that is not announced at all is the "say" rule's difference; counting it here too
  // would charge one defect twice.
  it('is inconclusive when the removal was not announced', () => {
    expect(evaluateCount(clickRemoval(undefined))).toEqual({
      verdict: 'inconclusive',
      summary: 'Removal not announced',
      reason:
        'The removal was not announced, so there is no count to judge. "Announce the removal" covers it.',
    });
  });

  it('is inconclusive when the keyboard removal step removed nothing', () => {
    expect(evaluateCount(evaluatorInput('delete-focused', [step(), step()])).verdict).toBe(
      'inconclusive',
    );
  });
});
