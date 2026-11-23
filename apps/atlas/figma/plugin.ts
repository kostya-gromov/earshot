import type { LayerAnnotation } from '../src/lib/figma-board-annotations.ts';
import type { BoardSpec } from '../src/lib/figma-board.ts';
import { annotateBoard } from './annotations.ts';
import { drawPattern } from './main.ts';

/*
 * The plugin's entry: shows the window, then adds a board for each pattern the window names.
 * It only ever adds frames to the current page; it reads and changes nothing that is there.
 * Not part of what a saved .fig is fingerprinted from: it decides which boards, not how one looks.
 */

type WindowMessage =
  | { type: 'add'; patterns: string[]; annotate: boolean }
  | { type: 'size'; height: number }
  | { type: 'close' };

const width = 320;

type Sent = object & { type: unknown };

function sizeOf(sent: Sent): WindowMessage | undefined {
  return 'height' in sent && typeof sent.height === 'number'
    ? { type: 'size', height: sent.height }
    : undefined;
}

function choiceOf(sent: Sent): WindowMessage | undefined {
  return 'patterns' in sent && Array.isArray(sent.patterns)
    ? {
        type: 'add',
        patterns: sent.patterns.map(String),
        annotate: 'annotate' in sent && sent.annotate === true,
      }
    : undefined;
}

/** What the window sent, or nothing when it is not one of its three messages. */
function messageOf(sent: unknown): WindowMessage | undefined {
  if (typeof sent !== 'object' || sent === null || !('type' in sent)) return undefined;
  if (sent.type === 'close') return { type: 'close' };
  if (sent.type === 'size') return sizeOf(sent);
  if (sent.type === 'add') return choiceOf(sent);
  return undefined;
}

/** A pattern's board and the same notes as Figma's own annotations. */
export interface PluginBoard {
  spec: BoardSpec;
  annotations: LayerAnnotation[];
}

interface Choice {
  boards: readonly PluginBoard[];
  origin: string;
  annotate: boolean;
}

/** What is said when the boards are in: how many, and what became of the annotations asked for. */
function noticeOf(count: number, annotate: boolean, refused: string | undefined): string {
  const added = count === 1 ? 'Added 1 board' : `Added ${String(count)} boards`;
  if (!annotate) return `${added}.`;
  if (refused === undefined) return `${added} with Figma annotations.`;
  if (refused.includes('permission')) {
    return `${added}. Figma annotations need a Full seat on a paid plan, so the notes are layers only.`;
  }
  return `${added}. Figma annotations were not added: ${refused}`;
}

async function addBoards({ boards, origin, annotate }: Choice): Promise<void> {
  const added: SceneNode[] = [];
  let refused: string | undefined;
  for (const { spec, annotations } of boards) {
    const node = await figma.getNodeByIdAsync(await drawPattern(spec, origin));
    if (node?.type !== 'FRAME') continue;
    added.push(node);
    // After one refusal the rest would be refused the same way.
    if (annotate && refused === undefined) refused = annotateBoard(node, annotations);
  }
  figma.currentPage.selection = added;
  figma.viewport.scrollAndZoomIntoView(added);
  figma.notify(noticeOf(added.length, annotate, refused));
}

export function runPlugin(boards: readonly PluginBoard[], origin: string): void {
  figma.showUI(__html__, { width, height: 280, themeColors: true, title: 'Earshot Atlas' });
  figma.ui.onmessage = (sent: unknown) => {
    const message = messageOf(sent);
    if (!message) return;
    if (message.type === 'size') {
      figma.ui.resize(width, Math.ceil(message.height));
      return;
    }
    if (message.type === 'close') {
      figma.closePlugin();
      return;
    }
    const chosen = boards.filter(({ spec }) => message.patterns.includes(spec.pattern));
    addBoards({ boards: chosen, origin, annotate: message.annotate }).then(
      () => figma.closePlugin(),
      (error: unknown) => figma.closePlugin(`Nothing was added: ${String(error)}`),
    );
  };
}
