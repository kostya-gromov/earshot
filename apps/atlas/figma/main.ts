import type { BoardSpec } from '../src/lib/figma-board.ts';
import { drawBoard } from './board.ts';
import { drawings } from './drawings.ts';

/*
 * Draws a pattern's board on the current page, to the right of what is already there. It adds
 * one frame and reads only where the page's other nodes end.
 */

export async function drawPattern(spec: BoardSpec, origin: string): Promise<string> {
  const draw = drawings[spec.pattern];
  if (!draw) throw new Error(`No drawing for the pattern "${spec.pattern}".`);
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  const page = figma.currentPage;
  const right = Math.max(0, ...page.children.map((node) => node.x + node.width));
  const board = drawBoard(spec, draw(), origin);
  page.appendChild(board);
  board.x = right + 200;
  board.y = 200;
  return board.id;
}
