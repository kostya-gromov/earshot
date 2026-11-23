import type { BoardNote, BoardSpec } from '../src/lib/figma-board.ts';
import { drawNotes, pin } from './notes.ts';
import { grey } from './shapes.ts';

/* The board: the drawing, a numbered pin on the layer each note is about, the notes beside it. */

const margin = 48;

function layerNamed(board: FrameNode, name: string): SceneNode {
  const layer = board.findOne((node) => node.name === name);
  if (!layer) throw new Error(`The drawing has no layer named "${name}".`);
  return layer;
}

function boxOf(node: SceneNode): Rect {
  const box = node.absoluteBoundingBox;
  if (!box) throw new Error(`Layer "${node.name}" has no place on the canvas.`);
  return box;
}

/** The centre of a note's pin, in canvas coordinates. */
function pinCentre(board: FrameNode, note: BoardNote): Vector {
  const box = boxOf(layerNamed(board, note.pin.layer));
  const middle = box.y + box.height / 2;
  switch (note.pin.place) {
    case 'top': {
      // On the upper edge of the container when one is named, so pins clear the layers inside it.
      const edge = note.pin.edgeOf ? boxOf(layerNamed(board, note.pin.edgeOf)) : box;
      return { x: box.x + box.width / 2, y: edge.y };
    }
    case 'after':
      return { x: box.x + box.width + 14, y: middle };
    case 'right':
      return { x: box.x + box.width, y: middle };
    case 'corner':
      return { x: box.x + box.width, y: box.y };
  }
}

function placePins(board: FrameNode, spec: BoardSpec): void {
  const origin = boxOf(board);
  for (const note of spec.notes) {
    const centre = pinCentre(board, note);
    const mark = pin(note.number);
    board.appendChild(mark);
    mark.x = Math.round(centre.x - origin.x - mark.width / 2);
    mark.y = Math.round(centre.y - origin.y - mark.height / 2);
  }
}

export function drawBoard(spec: BoardSpec, element: FrameNode, origin: string): FrameNode {
  const board = figma.createFrame();
  board.name = `${element.name}, annotated`;
  board.fills = grey(0.96);
  board.appendChild(element);
  element.x = margin;
  element.y = margin;
  placePins(board, spec);
  const notes = drawNotes(spec, origin);
  board.appendChild(notes);
  notes.x = margin + element.width + margin;
  notes.y = margin;
  board.resize(notes.x + notes.width + margin, Math.max(element.height, notes.height) + margin * 2);
  return board;
}
