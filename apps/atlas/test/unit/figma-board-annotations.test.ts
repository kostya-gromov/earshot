import { describe, expect, it } from 'vitest';
import { combobox, inputWithChips } from '@earshot/contracts';
import { boardSpec } from '../../src/lib/figma-board';
import { boardAnnotations } from '../../src/lib/figma-board-annotations';
import { boardPins } from '../../src/lib/figma-board-pins';

const of = (pattern: typeof combobox) =>
  boardAnnotations(boardSpec(pattern, boardPins[pattern.id] ?? {}));

describe('boardAnnotations', () => {
  it('gives each pinned layer one annotation, in the order of the notes', () => {
    expect(of(inputWithChips).map((annotation) => annotation.layer)).toEqual([
      'Chip / focused',
      'Remove button',
      'Chip text',
      'Error text',
      'Keyboard hint',
      'Field',
      'Input with chips',
    ]);
  });

  it('puts two requirements about one layer into that layer’s one annotation', () => {
    const active = of(combobox).filter((annotation) => annotation.layer === 'Option / active');
    expect(active).toHaveLength(1);
    expect(active[0]?.markdown).toContain('**Draw the active option as focused');
    expect(active[0]?.markdown).toContain('**Active option marked at 3:1, not by a faint tint**');
  });

  it('writes the title in bold, the reason, and each source as a link', () => {
    const [first] = of(inputWithChips);
    expect(first?.markdown).toBe(
      [
        '**Focus ring on every chip**',
        inputWithChips.requirements[0]?.reason,
        '[WCAG 2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)\n' +
          '[WCAG 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)',
      ].join('\n\n'),
    );
  });

  it('says the same without markup, with each source’s address written out', () => {
    const [first] = of(inputWithChips);
    expect(first?.plain).not.toMatch(/\*\*|\]\(/);
    expect(first?.plain).toContain(
      'WCAG 2.4.7 Focus Visible: https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html',
    );
  });
});
