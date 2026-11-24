import { describe, expect, it } from 'vitest';
import type { Pattern, Requirement } from '@earshot/contracts';
import { annotationText, annotationsText } from '../../src/lib/figma-annotation';

const targetSize = 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html';
const apgPage = 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/';

const requirement = (overrides: Partial<Requirement> = {}): Requirement => ({
  id: 'target-size',
  title: 'Remove buttons are at least 24 by 24 px',
  reason: 'A small target is hard to hit with a finger or a tremor.',
  level: 'wcag',
  sources: [
    {
      kind: 'wcag',
      sc: '2.5.8',
      title: 'Understanding SC 2.5.8: Target Size (Minimum)',
      url: targetSize,
      checkedAt: '2026-11-01',
    },
  ],
  ...overrides,
});

describe('annotationText', () => {
  it('gives the title, the reason and a line per source, as plain lines', () => {
    expect(annotationText(requirement())).toBe(
      [
        'Remove buttons are at least 24 by 24 px',
        'A small target is hard to hit with a finger or a tremor.',
        `WCAG 2.5.8 Target Size (Minimum): ${targetSize}`,
      ].join('\n'),
    );
  });

  it('says when a requirement is Earshot guidance beyond WCAG', () => {
    const text = annotationText(requirement({ level: 'guidance' }));
    expect(text.split('\n')[0]).toBe(
      'Remove buttons are at least 24 by 24 px (Earshot guidance, beyond WCAG)',
    );
  });

  it('says how a page cited only as related or as rationale stands to the requirement', () => {
    const text = annotationText(
      requirement({
        sources: [
          {
            kind: 'apg',
            title: 'Combobox Pattern',
            url: apgPage,
            checkedAt: '2026-11-01',
            relation: 'rationale',
            note: 'Cited for its reasoning.',
          },
        ],
      }),
    );
    expect(text.split('\n')[2]).toBe(`APG, Combobox Pattern (rationale): ${apgPage}`);
  });

  it('carries no markup', () => {
    expect(annotationText(requirement())).not.toMatch(/[<>*_#`]/);
  });
});

describe('annotationsText', () => {
  it('puts every requirement under a line naming the pattern, a blank line apart', () => {
    const pattern = {
      name: 'Combobox',
      requirements: [requirement(), requirement({ title: 'Focus is visible' })],
    } as unknown as Pattern;
    const blocks = annotationsText(pattern).split('\n\n');
    expect(blocks[0]).toBe('Accessibility requirements for the design: Combobox');
    expect(blocks.slice(1).map((block) => block.split('\n')[0])).toEqual([
      'Remove buttons are at least 24 by 24 px',
      'Focus is visible',
    ]);
  });
});
