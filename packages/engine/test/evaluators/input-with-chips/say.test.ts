import { describe, expect, it } from 'vitest';
import { evaluateSay } from '../../../src/evaluators/input-with-chips/say.ts';
import { evaluatorInput, focus, removeFocus, step } from './fixtures.ts';

const removal = {
  text: 'item 3 removed. 2 selected',
  politeness: 'polite' as const,
  at: 1,
  insertedLate: false,
};

describe('evaluateSay', () => {
  it('follows when removal is announced and focus stays in the component', () => {
    const result = evaluateSay(
      evaluatorInput('delete-focused', [
        step({ focusAfter: removeFocus(3) }),
        step({
          focusBefore: removeFocus(3),
          focusAfter: removeFocus(2, 2),
          announcements: [removal],
          axDiff: {
            added: [],
            removed: [
              { role: 'StaticText', name: 'item 3' },
              { role: 'button', name: 'Remove item 3' },
            ],
            changed: [],
          },
        }),
      ]),
    );
    expect(result.verdict).toBe('follows');
  });

  it('differs when no removal is announced', () => {
    const result = evaluateSay(
      evaluatorInput('remove-click', [step({ focusAfter: focus(), announcements: [] })]),
    );
    expect(result.verdict).toBe('differs');
  });

  it('differs when the focused chip was not removed', () => {
    const result = evaluateSay(
      evaluatorInput('delete-focused', [
        step({ focusAfter: removeFocus(3) }),
        step({
          focusBefore: removeFocus(3),
          focusAfter: removeFocus(2, 2),
          announcements: [removal],
          axDiff: { added: [], removed: [{ role: 'StaticText', name: 'Hint' }], changed: [] },
        }),
      ]),
    );
    expect(result.verdict).toBe('differs');
  });

  it('differs when click removes a different chip; the count is judged by its own rule', () => {
    const wrongChip = evaluateSay(
      evaluatorInput('remove-click', [
        step({
          action: { type: 'click', target: { role: 'button', name: 'Remove item 2' } },
          announcements: [{ ...removal, text: 'Item 1 removed. 2 selected' }],
          axDiff: {
            added: [],
            removed: [{ role: 'button', name: 'Remove item 1' }],
            changed: [],
          },
        }),
      ]),
    );
    const wrongCount = evaluateSay(
      evaluatorInput('remove-click', [
        step({
          action: { type: 'click', target: { role: 'button', name: 'Remove item 2' } },
          announcements: [{ ...removal, text: 'Item 2 removed. 999 selected' }],
          axDiff: {
            added: [],
            removed: [
              { role: 'StaticText', name: 'item 2' },
              { role: 'button', name: 'Remove item 2' },
            ],
            changed: [],
          },
        }),
      ]),
    );

    expect(wrongChip.verdict).toBe('differs');
    // Decided 2026-11-09 (the owner's review): the new count is the separate "count" rule.
    expect(wrongCount.verdict).toBe('follows');
  });

  it('accepts equivalent removal wording', () => {
    const result = evaluateSay(
      evaluatorInput('remove-click', [
        step({
          action: { type: 'click', target: { role: 'button', name: 'Remove item 2' } },
          announcements: [{ ...removal, text: 'Removed item 2; 2 items selected' }],
          axDiff: {
            added: [],
            removed: [
              { role: 'StaticText', name: 'item 2' },
              { role: 'button', name: 'Remove item 2' },
            ],
            changed: [],
          },
        }),
      ]),
    );

    expect(result.verdict).toBe('follows');
  });

  it('follows when the announcement names the chip without the new count', () => {
    const result = evaluateSay(
      evaluatorInput('remove-click', [
        step({
          action: { type: 'click', target: { role: 'button', name: 'Remove item 2' } },
          announcements: [{ ...removal, text: 'option item 2, deselected.' }],
          axDiff: {
            added: [],
            removed: [
              { role: 'StaticText', name: 'item 2' },
              { role: 'button', name: 'Remove item 2' },
            ],
            changed: [],
          },
        }),
      ]),
    );
    expect(result.verdict).toBe('follows');
  });

  it('accepts other wording when the chip and the new count are both announced', () => {
    const result = evaluateSay(
      evaluatorInput('remove-click', [
        step({
          action: { type: 'click', target: { role: 'button', name: 'Remove item 2' } },
          announcements: [{ ...removal, text: 'item 2 deselected, 2 selected' }],
          axDiff: {
            added: [],
            removed: [
              { role: 'StaticText', name: 'item 2' },
              { role: 'button', name: 'Remove item 2' },
            ],
            changed: [],
          },
        }),
      ]),
    );
    expect(result.verdict).toBe('follows');
  });

  it('judges the removal that happened even when focus stayed in the input', () => {
    // Bsp judges whether the right chip was focused first; say judges how a removal is spoken.
    const result = evaluateSay(
      evaluatorInput('backspace-twice', [
        step(),
        step({
          announcements: [{ ...removal, text: 'item 2 removed. 1 selected' }],
          axDiff: { added: [], removed: [{ role: 'StaticText', name: 'item 2' }], changed: [] },
        }),
      ]),
    );
    expect(result.verdict).toBe('follows');
  });

  it('judges the first Backspace when it already removed a chip', () => {
    // Verdict audit 2026-11-13: with the second step judged, a system that removes at once had
    // its second removal read as the first, and the count asked of it was one too high.
    const result = evaluateSay(
      evaluatorInput('backspace-twice', [
        step({
          announcements: [{ ...removal, text: 'item 3 removed. 2 selected' }],
          axDiff: { added: [], removed: [{ role: 'StaticText', name: 'item 3' }], changed: [] },
        }),
        step({
          axDiff: { added: [], removed: [{ role: 'StaticText', name: 'item 2' }], changed: [] },
        }),
      ]),
    );
    expect(result.verdict).toBe('follows');
  });

  it('is inconclusive when the keyboard removal step removed nothing', () => {
    const result = evaluateSay(evaluatorInput('delete-focused', [step(), step()]));
    expect(result).toEqual({
      verdict: 'inconclusive',
      summary: 'Nothing removed to judge',
      reason: 'Step 2 removed nothing, so there was no removal to judge.',
    });
  });

  it('is inconclusive for an unsupported scenario', () => {
    expect(evaluateSay(evaluatorInput('unknown', [step()])).verdict).toBe('inconclusive');
  });

  // Verdict audit 2026-11-15: React Aria's removal by click brings in a polite region holding
  // every remaining name run together; the same region arrives when Tab moves into the tags.
  describe('a live region that enters the page with its text', () => {
    const region = { text: 'Irene OhGreg FisherHiroshi Matsui', politeness: 'polite' as const };
    const click = step({
      action: { type: 'click', target: { role: 'button', name: 'Remove Greg Fisher' } },
      focusAfter: focus(),
      insertedRegions: [region],
      axDiff: {
        added: [],
        removed: [
          { role: 'row', name: 'Greg Fisher' },
          { role: 'button', name: 'Remove Greg Fisher' },
        ],
        changed: [],
      },
    });
    const tab = step({ action: { type: 'press', key: 'Tab' }, insertedRegions: [region] });

    it('is quoted and not counted when the same text appears without a removal', () => {
      const input = evaluatorInput('remove-click', [click]);
      const result = evaluateSay({
        ...input,
        recorded: [input, evaluatorInput('tab-out', [tab])],
      });
      expect(result).toEqual({
        verdict: 'differs',
        summary: 'Removal is not announced',
        reason:
          'A live region entered the page in this step already holding "Irene OhGreg FisherHiroshi Matsui". The same text appeared after Tab in [tab-out], with no removal. So it is not counted as an announcement of the removal.',
      });
    });

    it('follows when it names the removed value and appears nowhere without a removal', () => {
      const named = { ...click, insertedRegions: [{ ...region, text: 'Greg Fisher removed' }] };
      const result = evaluateSay(evaluatorInput('remove-click', [named]));
      expect(result).toMatchObject({
        verdict: 'follows',
        reason:
          'The removal was announced, naming the removed value: "Greg Fisher removed" (in a region that entered the page already holding its text).',
      });
    });

    it('is not counted when it names the value and also appears where nothing was removed', () => {
      const listing = { ...region, text: 'Selected: Greg Fisher' };
      const input = evaluatorInput('remove-click', [{ ...click, insertedRegions: [listing] }]);
      const result = evaluateSay({
        ...input,
        recorded: [input, evaluatorInput('tab-out', [{ ...tab, insertedRegions: [listing] }])],
      });
      expect(result.verdict).toBe('differs');
      expect(result.reason).toContain('The same text appeared after Tab in [tab-out]');
    });

    it('is inconclusive when the recording does not show what was removed', () => {
      const unnamed = {
        ...click,
        action: { type: 'click' as const, target: { role: null, name: '' } },
        axDiff: { added: [], removed: [{ role: 'generic', name: '' }], changed: [] },
      };
      const result = evaluateSay(evaluatorInput('remove-click', [unnamed]));
      expect(result).toMatchObject({
        verdict: 'inconclusive',
        summary: 'Announcement could not be judged',
      });
      expect(result.reason).toContain('"Irene OhGreg FisherHiroshi Matsui"');
    });
  });
});
