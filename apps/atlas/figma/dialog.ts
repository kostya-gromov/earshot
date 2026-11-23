import { boxed, pad, row } from './layout.ts';
import { centred, grey, stack, textLayer } from './shapes.ts';

/*
 * Modal dialog as a plain drawing: the page behind dimmed, and on it the dialog with a visible
 * title, a close button, and two actions with focus on the less destructive one. The layer
 * names are what the pins in src/lib/figma-board-pins.ts point at.
 */

function dialogHeader(): FrameNode {
  const frame = row('Header', 280, 24);
  frame.primaryAxisAlignItems = 'SPACE_BETWEEN';
  frame.appendChild(textLayer('Delete project?', { name: 'Title', size: 16, isMedium: true }));
  const close = centred('Close button', 24, textLayer('×', { name: 'Close icon' }));
  close.fills = grey(0.92);
  frame.appendChild(close);
  return frame;
}

function dialogButton(label: string, isFocused: boolean): FrameNode {
  const name = isFocused ? 'Button / focused' : `Button / ${label}`;
  const frame = boxed(pad(stack('HORIZONTAL', name), 12, 8), 0.45);
  if (isFocused) {
    frame.strokes = grey(0.1);
    frame.strokeWeight = 2;
    frame.strokeAlign = 'OUTSIDE';
  }
  frame.appendChild(textLayer(label, { name: 'Button text', isMedium: true }));
  return frame;
}

function dialogActions(): FrameNode {
  const frame = row('Actions', 280, 36);
  frame.primaryAxisAlignItems = 'MAX';
  // The ring of the focused button is outside it, and a frame that clips would cut it off.
  frame.clipsContent = false;
  frame.appendChild(dialogButton('Cancel', true));
  frame.appendChild(dialogButton('Delete', false));
  return frame;
}

function dialogBox(): FrameNode {
  const frame = boxed(pad(stack('VERTICAL', 'Dialog', 16), 20, 20), 0.8);
  frame.cornerRadius = 8;
  frame.clipsContent = false;
  frame.appendChild(dialogHeader());
  const body = textLayer('This removes the project and its history for everyone.', {
    name: 'Body text',
    size: 13,
    shade: 0.25,
  });
  frame.appendChild(body);
  body.resize(280, body.height);
  body.textAutoResize = 'HEIGHT';
  frame.appendChild(dialogActions());
  return frame;
}

export function drawDialog(): FrameNode {
  // The frame is the page behind: a mid grey stands for the dimming, with no colour of its own.
  const root = pad(stack('VERTICAL', 'Modal dialog'), 48, 48);
  root.fills = grey(0.55);
  root.appendChild(dialogBox());
  return root;
}
