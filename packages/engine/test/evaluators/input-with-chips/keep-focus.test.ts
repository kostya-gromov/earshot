import { describe, expect, it } from 'vitest';
import { evaluateKeepFocus } from '../../../src/evaluators/input-with-chips/keep-focus.ts';
import { evaluatorInput, focus, removeFocus, step } from './fixtures.ts';

const removed = {
  added: [],
  removed: [
    { role: 'StaticText', name: 'item 2' },
    { role: 'button', name: 'Remove item 2' },
  ],
  changed: [],
};
const click = (focusAfter: ReturnType<typeof focus>) =>
  evaluatorInput('remove-click', [
    step({
      action: { type: 'click', target: { role: 'button', name: 'Remove item 2' } },
      focusAfter,
      axDiff: removed,
    }),
  ]);

// Decided 2026-11-09 (the owner's review of the verdict audit): where focus lands is a rule under
// WCAG 2.4.3; whether the removal is announced is the separate "say" recommendation.
describe('evaluateKeepFocus', () => {
  it('follows when a click removal returns focus to the input, announced or not', () => {
    expect(evaluateKeepFocus(click(focus()))).toEqual({
      verdict: 'follows',
      summary: 'Focus stays in the field',
      reason: 'After the removal, focus stayed in the field.',
    });
  });

  it('follows when a keyboard removal moves focus to a neighbouring chip', () => {
    const result = evaluateKeepFocus(
      evaluatorInput('delete-focused', [
        step({ focusAfter: removeFocus(3) }),
        step({ focusBefore: removeFocus(3), focusAfter: removeFocus(2, 2), axDiff: removed }),
      ]),
    );
    expect(result.verdict).toBe('follows');
  });

  it('differs when focus falls to the document', () => {
    const body = focus({ role: null, name: '', isBody: true, isInsideComponent: false });
    expect(evaluateKeepFocus(click(body)).summary).toBe(
      'Focus falls to the document after removal',
    );
  });

  it('differs when focus leaves the component', () => {
    const outside = focus({ role: 'textbox', name: 'Subject', isInsideComponent: false });
    expect(evaluateKeepFocus(click(outside)).verdict).toBe('differs');
  });

  // 2.4.3 asks that focus stays meaningful, not that it lands on the input. A neighbouring chip
  // is accepted after a keyboard removal, so it is accepted after a click too (2026-11-09).
  it('follows when a click removal leaves focus on a neighbouring chip', () => {
    expect(evaluateKeepFocus(click(removeFocus(2, 2))).verdict).toBe('follows');
  });

  it('is inconclusive when the keyboard step removed nothing', () => {
    expect(evaluateKeepFocus(evaluatorInput('delete-focused', [step(), step()])).verdict).toBe(
      'inconclusive',
    );
  });
});
