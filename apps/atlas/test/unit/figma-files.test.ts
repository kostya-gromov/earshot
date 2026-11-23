import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fingerprintOf, specOf } from '../../scripts/figma-drawing';
import { figmaFiles } from '../../src/data/figma-files';

const publicFolder = join(import.meta.dirname, '..', '..', 'public');

describe('fingerprintOf', () => {
  const spec = specOf('input-with-chips');
  if (!spec) throw new Error('input-with-chips has a drawing');

  it('is the same for the same board', () => {
    expect(fingerprintOf(spec)).toBe(fingerprintOf(structuredClone(spec)));
  });

  it('changes when a word of a requirement changes', () => {
    const [first, ...rest] = spec.notes;
    if (!first) throw new Error('the board has notes');
    const reworded = { ...spec, notes: [{ ...first, reason: `${first.reason} More.` }, ...rest] };
    expect(fingerprintOf(reworded)).not.toBe(fingerprintOf(spec));
  });
});

describe('the files for Figma on the site', () => {
  it('are all there', () => {
    const missing = Object.values(figmaFiles).filter(
      ({ file }) => !existsSync(join(publicFolder, file)),
    );
    expect(missing).toEqual([]);
  });

  // Red here means a requirement, a source or the drawing changed after the file was saved:
  // build the plugin, draw and save the file again, then record it (scripts/figma-plugin.ts).
  it('were each drawn from the board as it is now', () => {
    const stale = Object.entries(figmaFiles).filter(([id, record]) => {
      const spec = specOf(id);
      return !spec || fingerprintOf(spec) !== record.madeFrom;
    });
    expect(stale.map(([id]) => id)).toEqual([]);
  });
});
