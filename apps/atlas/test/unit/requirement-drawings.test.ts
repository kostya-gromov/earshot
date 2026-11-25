import { describe, expect, it } from 'vitest';
import { patterns } from '@earshot/contracts';
import { drawnRequirementIds } from '../../src/features/design-lens/drawn';

// Tabs and the modal dialog shipped with no drawings in "For design", and nothing noticed
// (2026-11-25). The drawings are typed against drawnRequirementIds, so this list is
// what the page can draw.
describe('the drawings in "For design"', () => {
  it('cover every requirement of every published pattern', () => {
    const drawn = new Set<string>(drawnRequirementIds);
    const missing = Object.values(patterns).flatMap((pattern) =>
      pattern.requirements
        .filter(({ id }) => !drawn.has(id))
        .map(({ id }) => `${pattern.id}: ${id}`),
    );
    expect(missing).toEqual([]);
  });
});
