import { describe, expect, it } from 'vitest';
import { evaluateArrows } from '../../../src/evaluators/input-with-chips/arrows.ts';
import { evaluateBackspace } from '../../../src/evaluators/input-with-chips/bsp.ts';
import { evaluateSay } from '../../../src/evaluators/input-with-chips/say.ts';
import { evaluateTab } from '../../../src/evaluators/input-with-chips/tab.ts';
import { evaluatorInput, focus, otherSystem, step } from './fixtures.ts';

const { input, chip, removedChip } = otherSystem;
const announcement = (text: string) => ({
  text,
  politeness: 'polite' as const,
  at: 1,
  insertedLate: false,
});

describe('input-with-chips evaluators judge structure, not reference wording', () => {
  it('follows Backspace twice when chips are named differently', () => {
    const result = evaluateBackspace(
      evaluatorInput('backspace-twice', [
        step({ focusBefore: input, focusAfter: chip(3) }),
        step({
          focusBefore: chip(3),
          focusAfter: chip(2, 2),
          axDiff: { added: [], removed: removedChip(3), changed: [] },
        }),
      ]),
    );
    expect(result.verdict).toBe('follows');
  });

  it('differs when the first Backspace focuses a control outside the chip set', () => {
    const clearAll = focus({ role: 'button', name: 'Clear all', path: '#clear-all' });
    const result = evaluateBackspace(
      evaluatorInput('backspace-twice', [
        step({ focusBefore: input, focusAfter: clearAll }),
        step({ focusBefore: clearAll }),
      ]),
    );
    expect(result.verdict).toBe('differs');
  });

  it('follows arrows when the input is a textbox rather than a combobox', () => {
    const result = evaluateArrows(
      evaluatorInput('arrows', [
        step({ focusBefore: input, focusAfter: chip(3) }),
        step({ focusBefore: chip(3), focusAfter: chip(2) }),
        step({ focusBefore: chip(2), focusAfter: chip(3) }),
        step({ focusBefore: chip(3), focusAfter: input }),
      ]),
    );
    expect(result.verdict).toBe('follows');
  });

  it('follows Tab from a chip when chips are named differently', () => {
    const outside = focus({ role: 'textbox', name: 'Subject', isInsideComponent: false });
    const result = evaluateTab(
      evaluatorInput('tab-from-chip', [
        step({ focusBefore: input, focusAfter: chip(3) }),
        step({ focusBefore: chip(3), focusAfter: outside }),
      ]),
    );
    expect(result.verdict).toBe('follows');
  });

  it('follows a click removal that announces the chip label and returns to a textbox', () => {
    const result = evaluateSay(
      evaluatorInput('remove-click', [
        step({
          action: { type: 'click', target: { role: 'button', name: 'Clear person 2' } },
          focusBefore: input,
          focusAfter: input,
          announcements: [announcement('person 2 removed. 2 selected')],
          axDiff: { added: [], removed: removedChip(2), changed: [] },
        }),
      ]),
    );
    expect(result.verdict).toBe('follows');
  });

  it('differs when the announcement does not name the removed chip', () => {
    const result = evaluateSay(
      evaluatorInput('remove-click', [
        step({
          action: { type: 'click', target: { role: 'button', name: 'Clear person 2' } },
          focusBefore: input,
          focusAfter: input,
          announcements: [announcement('Item removed. 2 selected')],
          axDiff: {
            added: [],
            removed: [...removedChip(2), { role: 'image', name: 'Remove' }],
            changed: [],
          },
        }),
      ]),
    );
    expect(result.verdict).toBe('differs');
  });
});

describe('chips that expose no role or set position', () => {
  const left = { type: 'press', key: 'ArrowLeft' } as const;
  const right = { type: 'press', key: 'ArrowRight' } as const;
  const token = (name: string) =>
    focus({
      role: 'generic',
      name: `${name} (press backspace or delete to remove)`,
      path: `#${name}`,
    });

  it('is inconclusive on arrows when focus moves between unpositioned elements', () => {
    const result = evaluateArrows(
      evaluatorInput('arrows', [
        step({ action: left, focusBefore: input, focusAfter: token('typescript') }),
        step({ action: left, focusBefore: token('typescript'), focusAfter: token('javascript') }),
        step({ action: right, focusBefore: token('javascript'), focusAfter: token('typescript') }),
        step({ action: right, focusBefore: token('typescript'), focusAfter: input }),
      ]),
    );
    expect(result).toEqual({
      verdict: 'inconclusive',
      summary: 'Focus moves, but chips expose no position',
      reason:
        'After step 1 (ArrowLeft), focus was on generic "typescript (press backspace or delete to remove)", which exposes no set position and is not one of the chips the adapter locates, so whether it is chip 3 cannot be read.',
    });
  });

  // Decided 2026-11-08 (in review): Tab from a chip uses the same chip test as the arrows
  // rule. An item with no set position cannot be read as a chip, so neither rule judges it.
  it('does not test Tab from an item that cannot be read as a chip', () => {
    const outside = focus({ role: 'textbox', name: 'Subject', isInsideComponent: false });
    const result = evaluateTab(
      evaluatorInput('tab-from-chip', [
        step({ focusBefore: input, focusAfter: token('typescript') }),
        step({ focusBefore: token('typescript'), focusAfter: outside }),
      ]),
    );
    expect(result.verdict).toBe('inconclusive');
  });

  it('judges a click on an unnamed remove icon by whether anything was removed', () => {
    const result = evaluateSay(
      evaluatorInput('remove-click', [
        step({
          action: { type: 'click', target: { role: null, name: '' } },
          focusBefore: input,
          focusAfter: token('css'),
          axDiff: {
            added: [],
            removed: [
              { role: 'generic', name: 'javascript (press backspace or delete to remove)' },
            ],
            changed: [],
          },
        }),
      ]),
    );
    expect(result).toEqual({
      verdict: 'differs',
      summary: 'Removal is not announced',
      reason: 'The removal was not announced.',
    });
  });
});

// Decided 2026-11-09 (in review): no rule text asks for "n of m". A chip without a set
// position is still a chip when it is one of the items the adapter locates; its position is
// its place among them, and the missing set position is shown as a separate observation.
describe('chips the adapter locates but the accessibility tree gives no position', () => {
  const left = { type: 'press', key: 'ArrowLeft' } as const;
  const right = { type: 'press', key: 'ArrowRight' } as const;
  const named = (index: number) =>
    focus({
      role: 'button',
      name: ['Irene Oh', 'Greg Fisher', 'Hiroshi Matsui'][index - 1]!,
      item: { index, count: 3 },
      path: `#chip-${index}`,
    });

  it('follows arrows through located chips in order', () => {
    const result = evaluateArrows(
      evaluatorInput('arrows', [
        step({ action: left, focusBefore: input, focusAfter: named(3) }),
        step({ action: left, focusBefore: named(3), focusAfter: named(2) }),
        step({ action: right, focusBefore: named(2), focusAfter: named(3) }),
        step({ action: right, focusBefore: named(3), focusAfter: input }),
      ]),
    );
    expect(result.verdict).toBe('follows');
  });

  it('differs when a located chip is out of order', () => {
    const result = evaluateArrows(
      evaluatorInput('arrows', [
        step({ action: left, focusBefore: input, focusAfter: named(1) }),
        step({ action: left, focusBefore: named(1), focusAfter: named(1) }),
        step({ action: right, focusBefore: named(1), focusAfter: named(2) }),
        step({ action: right, focusBefore: named(2), focusAfter: input }),
      ]),
    );
    expect(result.verdict).toBe('differs');
  });

  it('tests Tab from a located chip', () => {
    const outside = focus({ role: 'textbox', name: 'Subject', isInsideComponent: false });
    const result = evaluateTab(
      evaluatorInput('tab-from-chip', [
        step({ action: left, focusBefore: input, focusAfter: named(3) }),
        step({ focusBefore: named(3), focusAfter: outside }),
      ]),
    );
    expect(result.verdict).toBe('follows');
  });

  it('prefers the set position the accessibility tree exposes', () => {
    const exposed = focus({
      role: 'option',
      name: 'Hiroshi Matsui',
      posInSet: 3,
      setSize: 3,
      item: { index: 1, count: 3 },
    });
    const result = evaluateArrows(
      evaluatorInput('arrows', [
        step({ action: left, focusBefore: input, focusAfter: exposed }),
        step({ action: left, focusBefore: exposed, focusAfter: named(2) }),
        step({ action: right, focusBefore: named(2), focusAfter: exposed }),
        step({ action: right, focusBefore: exposed, focusAfter: input }),
      ]),
    );
    expect(result.verdict).toBe('follows');
  });
});
