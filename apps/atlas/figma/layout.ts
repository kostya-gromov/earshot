import { grey, stack } from './shapes.ts';

/* Layout shared by the drawings of lists: padding, a row of fixed size, a white box with a border. */

export function pad(frame: FrameNode, horizontal: number, vertical: number): FrameNode {
  frame.paddingLeft = horizontal;
  frame.paddingRight = horizontal;
  frame.paddingTop = vertical;
  frame.paddingBottom = vertical;
  return frame;
}

/** A row of a fixed size with its content at the start, centred on the cross axis. */
export function row(name: string, width: number, height: number): FrameNode {
  const frame = stack('HORIZONTAL', name, 8);
  frame.resize(width, height);
  frame.primaryAxisSizingMode = 'FIXED';
  frame.counterAxisSizingMode = 'FIXED';
  frame.counterAxisAlignItems = 'CENTER';
  return frame;
}

/** A white surface with a border: a field, a popup, a panel. `shade` is the border's grey. */
export function boxed(frame: FrameNode, shade: number): FrameNode {
  frame.cornerRadius = 6;
  frame.fills = grey(1);
  frame.strokes = grey(shade);
  return frame;
}

/** The mark of the row that has focus: a fill that is not faint alone, and an outline inside it. */
export function markFocused(frame: FrameNode): FrameNode {
  frame.fills = grey(0.9);
  frame.strokes = grey(0.1);
  frame.strokeWeight = 2;
  frame.strokeAlign = 'INSIDE';
  return frame;
}
