/// <reference types="node" />
/*
 * What a pattern's board for Figma is made from: the drawing code of figma/, the board's data
 * from contracts and the site's address. Shared by the plugin build and by the record of which
 * of these a saved .fig was drawn from.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { patterns } from '@earshot/contracts';
import { boardSpec, type BoardSpec } from '../src/lib/figma-board.ts';
import { boardPins } from '../src/lib/figma-board-pins.ts';
import { siteOrigin } from '../src/lib/site-origin.ts';

const drawing = join(import.meta.dirname, '..', 'figma');
const read = (file: string): string => readFileSync(join(drawing, file), 'utf8');

/** What every board is drawn with, whatever the pattern. */
const shared = ['shapes.ts', 'notes.ts', 'board.ts'];

/** The modules that draw each pattern's own element. */
const elements: Readonly<Record<string, readonly string[]>> = {
  'input-with-chips': ['input-with-chips.ts'],
  combobox: ['layout.ts', 'combobox.ts'],
  'menu-button': ['layout.ts', 'menu-button.ts'],
  tabs: ['layout.ts', 'tabs.ts'],
  dialog: ['layout.ts', 'dialog.ts'],
};

/** The whole plugin in dependency order: a module comes after the ones it imports from. */
const plugin = [
  'shapes.ts',
  'layout.ts',
  'input-with-chips.ts',
  'combobox.ts',
  'menu-button.ts',
  'tabs.ts',
  'dialog.ts',
  'notes.ts',
  'board.ts',
  'drawings.ts',
  'main.ts',
  'annotations.ts',
  'plugin.ts',
];

/** Every module of the plugin as written, types and all. */
export const pluginSources = (): string[] => plugin.map(read);

/**
 * The modules one pattern's board looks the way it does because of. Where a board lands on the
 * page and which patterns the plugin offers are not among them, so another pattern's drawing
 * does not make this one's saved file look stale.
 */
export const drawingSources = (id: string): string[] =>
  [...shared, ...(elements[id] ?? [])].map(read);

/** The board of a pattern that has a drawing; nothing for one that has none. */
export function specOf(id: string): BoardSpec | undefined {
  const pattern = patterns[id];
  const pins = boardPins[id];
  return pattern && pins ? boardSpec(pattern, pins) : undefined;
}

/**
 * One value that changes when anything a saved file shows would change: a requirement's words,
 * a source, a pin, the drawing, the address. Taken from the sources as written, not from the
 * built script, so a new Node that strips types differently does not make every file look stale.
 */
export function fingerprintOf(spec: BoardSpec): string {
  const made = [...drawingSources(spec.pattern), JSON.stringify(spec), siteOrigin].join('\n');
  return createHash('sha256').update(made).digest('hex');
}
