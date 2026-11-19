import { describe, expect, it } from 'vitest';
import { evaluateArrows } from '../../../src/evaluators/input-with-chips/arrows.ts';
import { evaluatorInput, focus, removeFocus, step } from './fixtures.ts';

describe('evaluateArrows', () => {
  it('follows the expected chip navigation sequence', () => {
    const result = evaluateArrows(
      evaluatorInput('arrows', [
        step({ focusAfter: removeFocus(3) }),
        step({ focusAfter: removeFocus(2) }),
        step({ focusAfter: removeFocus(3) }),
        step({ focusAfter: focus() }),
      ]),
    );
    expect(result.verdict).toBe('follows');
  });

  it('differs when Right Arrow does not return to the input', () => {
    const result = evaluateArrows(
      evaluatorInput('arrows', [
        step({ focusAfter: removeFocus(3) }),
        step({ focusAfter: removeFocus(2) }),
        step({ focusAfter: removeFocus(3) }),
        step({ focusAfter: removeFocus(3) }),
      ]),
    );
    expect(result.verdict).toBe('differs');
  });

  // Same principle as "bsp" (ADR 0009, 2026-11-13): a mark that focus does not show but the
  // accessibility tree or an announcement does is not a plain difference; the engine cannot say
  // whether it puts the user on the chip (a caret crossing a token that is named aloud).
  it('is inconclusive when Left Arrow marks a chip without moving focus', () => {
    const named = {
      text: 'Hiroshi Matsui',
      politeness: 'assertive' as const,
      at: 1,
      insertedLate: false,
    };
    const result = evaluateArrows(
      evaluatorInput('arrows', [
        step({ action: { type: 'press', key: 'ArrowLeft' }, announcements: [named] }),
        step({ action: { type: 'press', key: 'ArrowLeft' } }),
        step({ action: { type: 'press', key: 'ArrowRight' } }),
        step({ action: { type: 'press', key: 'ArrowRight' } }),
      ]),
    );
    expect(result.verdict).toBe('inconclusive');
    expect(result.summary).toBe('Marks a chip without moving focus');
  });

  it('says where focus was and what was heard when arrows do not reach a chip', () => {
    const result = evaluateArrows(
      evaluatorInput('arrows', [
        step({ action: { type: 'press', key: 'ArrowLeft' } }),
        step({ action: { type: 'press', key: 'ArrowLeft' } }),
        step({ action: { type: 'press', key: 'ArrowRight' } }),
        step({ action: { type: 'press', key: 'ArrowRight' } }),
      ]),
    );
    expect(result).toEqual({
      verdict: 'differs',
      summary: 'Left Arrow does not reach a chip',
      reason:
        'After step 1 (ArrowLeft), focus was on combobox "To", not on chip 3. Nothing was announced.',
    });
  });

  it('is inconclusive when observations are incomplete', () => {
    expect(evaluateArrows(evaluatorInput('arrows', [step()])).verdict).toBe('inconclusive');
  });

  // Second verdict audit, 2026-11-10: moving between chips is the APG rule "chip-arrows". Here
  // only crossing between the input and the chips is judged, so that defect is not charged twice.
  it('leaves movement between chips to chip-arrows', () => {
    const result = evaluateArrows(
      evaluatorInput('arrows', [
        step({ focusAfter: removeFocus(3) }),
        step({ focusAfter: removeFocus(3) }),
        step({ focusAfter: removeFocus(3) }),
        step({ focusAfter: focus() }),
      ]),
    );
    expect(result).toEqual({
      verdict: 'inconclusive',
      summary: 'Arrows do not move between chips',
      reason:
        'Left Arrow reached the last chip, but the arrows did not then move between chips, so the way back to the input could not be tested. Moving between chips is judged by "Arrows move between chips".',
    });
  });
});
