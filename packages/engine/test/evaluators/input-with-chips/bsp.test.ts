import { describe, expect, it } from 'vitest';
import { evaluateBackspace } from '../../../src/evaluators/input-with-chips/bsp.ts';
import { evaluatorInput, removeFocus, step } from './fixtures.ts';

describe('evaluateBackspace', () => {
  it('follows when first Backspace focuses and second removes the last chip', () => {
    const result = evaluateBackspace(
      evaluatorInput('backspace-twice', [
        step({ focusAfter: removeFocus(3) }),
        step({
          focusBefore: removeFocus(3),
          focusAfter: removeFocus(2, 2),
          axDiff: {
            added: [],
            removed: [{ role: 'button', name: 'Remove item 3' }],
            changed: [],
          },
        }),
      ]),
    );
    expect(result.verdict).toBe('follows');
  });

  it('differs when the first Backspace removes immediately', () => {
    const result = evaluateBackspace(
      evaluatorInput('backspace-twice', [
        step({ axDiff: { added: [], removed: [{ role: 'listitem', name: '' }], changed: [] } }),
        step(),
      ]),
    );
    expect(result.verdict).toBe('differs');
  });

  it('differs when the first Backspace focuses a chip other than the last', () => {
    const result = evaluateBackspace(
      evaluatorInput('backspace-twice', [
        step({ focusAfter: removeFocus(2) }),
        step({
          focusBefore: removeFocus(2),
          axDiff: {
            added: [],
            removed: [{ role: 'button', name: 'Remove item 2' }],
            changed: [],
          },
        }),
      ]),
    );
    expect(result.verdict).toBe('differs');
  });

  it('differs when the removed node is not the focused chip', () => {
    const result = evaluateBackspace(
      evaluatorInput('backspace-twice', [
        step({ focusAfter: removeFocus(3) }),
        step({
          focusBefore: removeFocus(3),
          axDiff: { added: [], removed: [{ role: 'StaticText', name: 'Hint' }], changed: [] },
        }),
      ]),
    );
    expect(result.verdict).toBe('differs');
  });

  it('is inconclusive when a step did not settle', () => {
    const result = evaluateBackspace(
      evaluatorInput('backspace-twice', [
        step({ focusAfter: removeFocus(3), settle: { ms: 1000, quiet: false } }),
        step(),
      ]),
    );
    expect(result.verdict).toBe('inconclusive');
  });

  // Decided 2026-11-13 (ADR 0009), replacing the decision of 2026-11-09 that left this
  // inconclusive: a chip counts as marked when focus, the accessibility tree or an announcement
  // shows it. Chakra UI highlights the last tag on screen only, so for this rule nothing marks
  // it. The same principle decides "arrows", so one clause is no longer judged two ways.
  it('differs when two presses remove a chip but the first shows nothing at all', () => {
    const result = evaluateBackspace(
      evaluatorInput('backspace-twice', [
        step(),
        step({
          axDiff: {
            added: [],
            removed: [{ role: 'button', name: 'Delete tag Hiroshi Matsui' }],
            changed: [],
          },
        }),
      ]),
    );
    expect(result).toEqual({
      verdict: 'differs',
      summary: 'First Backspace shows no chip about to go',
      reason:
        'A removal took two presses: the first Backspace removed nothing, the second removed a chip. But after the first, focus was still on combobox "To", the accessibility tree did not change and nothing was announced, so nothing says which chip is about to go.',
    });
  });

  it('is inconclusive when the first press marks a chip without moving focus', () => {
    const result = evaluateBackspace(
      evaluatorInput('backspace-twice', [
        step({
          announcements: [
            { text: 'Hiroshi Matsui', politeness: 'assertive', at: 1, insertedLate: false },
          ],
        }),
        step({
          axDiff: {
            added: [],
            removed: [{ role: 'StaticText', name: 'Hiroshi Matsui' }],
            changed: [],
          },
        }),
      ]),
    );
    expect(result.verdict).toBe('inconclusive');
    expect(result.summary).toBe('First press marks a chip without moving focus');
  });

  it('differs when neither press does anything', () => {
    expect(evaluateBackspace(evaluatorInput('backspace-twice', [step(), step()])).verdict).toBe(
      'differs',
    );
  });
});
