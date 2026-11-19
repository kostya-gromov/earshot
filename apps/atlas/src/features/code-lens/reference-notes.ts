/**
 * Notes on the reference source, hand-written. Each finds its first line by text, so a note
 * survives edits around it; a note whose text is gone fails the build (locateNotes).
 */
export interface ReferenceNote {
  file: string;
  /** Text on the first line the note explains. */
  find: string;
  /** How many lines from there it explains. */
  span: number;
  title: string;
  text: string;
}

export const referenceFileOrder = [
  'chip-field.html',
  'chip-field.css',
  'chip-field.ts',
  'chip-list.ts',
  'suggestions.ts',
  'selection.ts',
  'announcer.ts',
] as const;

export const referenceNotes: readonly ReferenceNote[] = [
  {
    file: 'chip-field.html',
    find: 'role="combobox"',
    span: 5,
    title: 'The input is an APG combobox',
    text: 'Typing and suggestions follow the combobox pattern.',
  },
  {
    file: 'chip-field.html',
    find: 'Live region exists from the start',
    span: 2,
    title: 'The live region exists from load',
    text: 'Regions inserted later are often missed by screen readers.',
  },
  {
    file: 'chip-field.ts',
    find: 'Two-step removal',
    span: 2,
    title: 'Backspace twice',
    text: 'The first Backspace only moves focus to the last chip.',
  },
  {
    file: 'chip-field.ts',
    find: 'Keyboard removal stays among the chips',
    span: 4,
    title: 'Focus never falls to the page',
    text: 'After removal, focus goes to a neighbouring chip or the input.',
  },
  {
    file: 'chip-list.ts',
    find: 'One stop for the whole field',
    span: 6,
    title: 'One Tab stop, also from a chip',
    text: 'Tab from a chip hands off to the input, then leaves.',
  },
  {
    file: 'chip-list.ts',
    find: 'ArrowLeft: (i, buttons)',
    span: 3,
    title: 'Arrows move between chips',
    text: 'Right Arrow past the last chip returns to the input.',
  },
  {
    file: 'announcer.ts',
    find: 'Clear first',
    span: 4,
    title: 'Repeated messages still speak',
    text: 'Clearing first makes the same text a new change.',
  },
  {
    file: 'chip-field.css',
    find: 'WCAG 2.5.8',
    span: 2,
    title: '24 px remove target',
    text: 'The icon is small; the button is not.',
  },
];

/** The files of a reference in reading order, with the notes on them. */
export interface ReferenceGuide {
  files: readonly string[];
  notes: readonly ReferenceNote[];
}

export interface LocatedNote extends ReferenceNote {
  /** 1-based line where the note starts. */
  line: number;
}

/** Finds each note's lines in the sources. A missing file or text is a broken note: it throws. */
export function locateNotes(
  notes: readonly ReferenceNote[],
  sources: Readonly<Record<string, string>>,
): LocatedNote[] {
  return notes.map((note) => {
    const source = sources[note.file];
    if (source === undefined) throw new Error(`Note "${note.title}": no file ${note.file}`);
    const index = source.split('\n').findIndex((text) => text.includes(note.find));
    if (index === -1) throw new Error(`Note "${note.title}": "${note.find}" not in ${note.file}`);
    return { ...note, line: index + 1 };
  });
}
