import type { BoardNote, BoardSpec } from '../src/lib/figma-board.ts';
import { centred, grey, stack, textLayer } from './shapes.ts';

/* The column of notes beside the drawing: a numbered row per requirement, sources as links. */

const noteWidth = 380;

export function pin(number: number): FrameNode {
  const label = textLayer(String(number), { size: 10, shade: 1, isMedium: true });
  const frame = centred(`Pin ${String(number)}`, 16, label);
  frame.fills = grey(0.1);
  return frame;
}

function small(characters: string, name: string): TextNode {
  const text = textLayer(characters, { name, size: 12, shade: 0.25 });
  text.lineHeight = { unit: 'PIXELS', value: 18 };
  return text;
}

function link(text: TextNode, start: number, target: { name: string; url: string }): void {
  const end = start + target.name.length;
  text.setRangeHyperlink(start, end, { type: 'URL', value: target.url });
  text.setRangeTextDecoration(start, end, 'UNDERLINE');
}

function noteRow(note: BoardNote): FrameNode {
  const row = stack('HORIZONTAL', `Note ${String(note.number)}`, 10);
  row.appendChild(pin(note.number));
  const lines = [note.title, note.reason, ...note.sources.map((source) => source.name)];
  const text = small(lines.join('\n'), note.title);
  text.setRangeFontName(0, note.title.length, { family: 'Inter', style: 'Medium' });
  text.setRangeFills(0, note.title.length, grey(0.1));
  let start = note.title.length + 1 + note.reason.length + 1;
  for (const source of note.sources) {
    link(text, start, source);
    start += source.name.length + 1;
  }
  row.appendChild(text);
  text.resize(noteWidth, text.height);
  text.textAutoResize = 'HEIGHT';
  return row;
}

/** Where the notes come from, so a file passed on still leads back to reasons and sources. */
function fromLine(spec: BoardSpec, origin: string): TextNode {
  const lead = 'From Earshot Atlas: ';
  const address = `${origin}${spec.path}`;
  const shown = address.replace(/^https:\/\//, '').replace(/\/#.*$/, '');
  const text = small(`${lead}${shown}`, 'From');
  link(text, lead.length, { name: shown, url: address });
  return text;
}

export function drawNotes(spec: BoardSpec, origin: string): FrameNode {
  const column = stack('VERTICAL', 'Notes', 20);
  column.appendChild(textLayer(spec.title, { name: 'Notes title', shade: 0.1, isMedium: true }));
  for (const note of spec.notes) column.appendChild(noteRow(note));
  column.appendChild(fromLine(spec, origin));
  return column;
}
