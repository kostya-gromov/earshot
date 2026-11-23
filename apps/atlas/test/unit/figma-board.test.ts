import { describe, expect, it } from 'vitest';
import { inputWithChips } from '@earshot/contracts';
import { boardSpec } from '../../src/lib/figma-board';
import { boardPins } from '../../src/lib/figma-board-pins';

const pins = boardPins['input-with-chips'] ?? {};

describe('boardSpec', () => {
  it('numbers a note per requirement, in the order of the page', () => {
    const { notes } = boardSpec(inputWithChips, pins);
    expect(notes.map((note) => note.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(notes.map((note) => note.title).slice(0, 2)).toEqual([
      'Focus ring on every chip',
      'Remove target at least 24 by 24 px',
    ]);
  });

  it('gives each note the reason and the named sources of its requirement', () => {
    const [first] = boardSpec(inputWithChips, pins).notes;
    expect(first?.reason).toBe(inputWithChips.requirements[0]?.reason);
    expect(first?.sources).toEqual([
      {
        name: 'WCAG 2.4.7 Focus Visible',
        url: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html',
      },
      {
        name: 'WCAG 1.4.11 Non-text Contrast',
        url: 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html',
      },
    ]);
  });

  it('says in the title when a requirement is Atlas guidance beyond WCAG', () => {
    const last = boardSpec(inputWithChips, pins).notes.at(-1);
    expect(last?.title).toBe('Prefer read-only over disabled (Atlas guidance, beyond WCAG)');
  });

  it('names the pattern in the title of the notes', () => {
    expect(boardSpec(inputWithChips, pins).title).toBe(
      'Accessibility requirements for the design: Input with chips',
    );
  });

  it('says where on the site the requirements are, as a path', () => {
    expect(boardSpec(inputWithChips, pins).path).toBe('/patterns/input-with-chips/#lens');
  });

  it('puts each note on the layer its pin names', () => {
    const [first] = boardSpec(inputWithChips, pins).notes;
    expect(first?.pin).toEqual({ layer: 'Chip / focused', place: 'top', edgeOf: 'Field' });
  });

  it('refuses a requirement that has no pin on the drawing', () => {
    const rest = Object.fromEntries(Object.entries(pins).filter(([id]) => id !== 'focus-ring'));
    expect(() => boardSpec(inputWithChips, rest)).toThrow(/focus-ring.*no pin/);
  });

  it('refuses a pin whose requirement the pattern no longer has', () => {
    const withoutLast = {
      ...inputWithChips,
      requirements: inputWithChips.requirements.slice(0, -1),
    };
    expect(() => boardSpec(withoutLast, pins)).toThrow(/read-only-over-disabled.*no requirement/);
  });
});
