import type { BoardNote, BoardSpec } from './figma-board.ts';

/*
 * A board's notes as Figma's own annotations: one per layer, because the notes of two
 * requirements can sit on the same layer and Figma's REST API reads "a maximum of 1 annotation"
 * per node. Plain data, written into the plugin when it is built; the plugin only assigns it.
 * Not part of a board's own data, so it does not change what a saved .fig is fingerprinted from.
 */

export interface LayerAnnotation {
  /** The name of the layer in the drawing, the same one the note's pin points at. */
  layer: string;
  /** Title in bold, the reason, the sources as links. */
  markdown: string;
  /** The same without markup, for when Figma does not take the markdown. */
  plain: string;
}

const markdownOf = (note: BoardNote): string =>
  [
    `**${note.title}**`,
    note.reason,
    note.sources.map((source) => `[${source.name}](${source.url})`).join('\n'),
  ].join('\n\n');

const plainOf = (note: BoardNote): string =>
  [note.title, note.reason, ...note.sources.map((source) => `${source.name}: ${source.url}`)].join(
    '\n',
  );

/** One annotation per pinned layer, in the order the layers first appear in the notes. */
export function boardAnnotations(spec: BoardSpec): LayerAnnotation[] {
  const layers = [...new Set(spec.notes.map((note) => note.pin.layer))];
  return layers.map((layer) => {
    const notes = spec.notes.filter((note) => note.pin.layer === layer);
    return {
      layer,
      markdown: notes.map(markdownOf).join('\n\n'),
      plain: notes.map(plainOf).join('\n\n'),
    };
  });
}
