import type { LayerAnnotation } from '../src/lib/figma-board-annotations.ts';

/*
 * Figma's own annotations on a board's layers, beside the notes that are layers. Figma refuses
 * the write without a Full seat on a paid plan (seen on a Starter plan, 2026-11-21), and it
 * refuses reading too, so nothing here reads `annotations`: a new board has none to keep.
 * The write that succeeds has not been seen by us; see docs/proposals/figma-plugin.md, step 5.
 */

type Annotatable = SceneNode & AnnotationsMixin;

const isRefusal = (error: unknown): boolean => String(error).includes('permission');

function writeOne(layer: Annotatable, annotation: LayerAnnotation): void {
  try {
    layer.annotations = [{ labelMarkdown: annotation.markdown }];
  } catch (error) {
    if (isRefusal(error)) throw error;
    // Markup Figma does not take is not a reason to lose the note: the same words, plain.
    layer.annotations = [{ label: annotation.plain }];
  }
}

/** Writes the annotations; returns why not, as Figma said it, when it would not. */
export function annotateBoard(
  board: FrameNode,
  annotations: readonly LayerAnnotation[],
): string | undefined {
  try {
    for (const annotation of annotations) {
      const layer = board.findOne((node) => node.name === annotation.layer);
      if (layer && 'annotations' in layer) writeOne(layer, annotation);
    }
    return undefined;
  } catch (error) {
    return String(error);
  }
}
