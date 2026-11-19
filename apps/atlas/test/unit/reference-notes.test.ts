import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  locateNotes,
  referenceFileOrder,
  referenceNotes,
} from '../../src/features/code-lens/reference-notes';

const folder = path.join(import.meta.dirname, '../../../../packages/reference/input-with-chips');
const sources = Object.fromEntries(
  referenceFileOrder.map((file) => [file, readFileSync(path.join(folder, file), 'utf8')]),
);

describe('reference notes', () => {
  it('every note still points at text in the reference', () => {
    const located = locateNotes(referenceNotes, sources);
    expect(located).toHaveLength(referenceNotes.length);
    for (const note of located) {
      expect(sources[note.file]?.split('\n')[note.line - 1]).toContain(note.find);
    }
  });

  it('fails loudly when the text a note explains is gone', () => {
    const [first] = referenceNotes;
    expect(() => locateNotes([{ ...first!, find: 'no such line' }], sources)).toThrow(
      /not in chip-field.html/,
    );
  });
});

// Every pattern's notes are checked the same way: a note that lost its line fails here first.
describe('combobox reference notes', () => {
  it('every note still points at text in the reference', async () => {
    const { comboboxFileOrder, comboboxNotes } =
      await import('../../src/features/code-lens/combobox-notes');
    const combobox = path.join(import.meta.dirname, '../../../../packages/reference/combobox');
    const files = Object.fromEntries(
      comboboxFileOrder.map((file) => [file, readFileSync(path.join(combobox, file), 'utf8')]),
    );
    const located = locateNotes(comboboxNotes, files);
    for (const note of located) {
      expect(files[note.file]?.split('\n')[note.line - 1]).toContain(note.find);
    }
    // Each file of the reference is shown, so each has at least one note to enter it by.
    expect(new Set(located.map((note) => note.file)).size).toBe(comboboxFileOrder.length);
  });
});
