import { boxed, markFocused, pad, row } from './layout.ts';
import { grey, stack, textLayer } from './shapes.ts';

/*
 * Menu button as a plain drawing: the button and its open menu with one item in focus. The
 * layer names are what the pins in src/lib/figma-board-pins.ts point at.
 */

function menuItem(label: string, isFocused: boolean): FrameNode {
  const name = isFocused ? `Item / ${label}, focused` : `Item / ${label}`;
  const frame = pad(row(name, 200, 32), 12, 0);
  frame.cornerRadius = 4;
  if (isFocused) markFocused(frame);
  frame.appendChild(textLayer(label, { name: isFocused ? 'Item text / focused' : 'Item text' }));
  return frame;
}

function menu(): FrameNode {
  const frame = boxed(pad(stack('VERTICAL', 'Menu'), 4, 4), 0.8);
  frame.appendChild(menuItem('Rename', false));
  frame.appendChild(menuItem('Duplicate', true));
  frame.appendChild(menuItem('Archive', false));
  frame.appendChild(menuItem('Delete', false));
  return frame;
}

function menuTrigger(): FrameNode {
  const frame = boxed(pad(stack('HORIZONTAL', 'Button'), 12, 8), 0.45);
  frame.appendChild(textLayer('Actions', { name: 'Button text', isMedium: true }));
  return frame;
}

export function drawMenuButton(): FrameNode {
  const root = pad(stack('VERTICAL', 'Menu button', 4), 32, 32);
  root.fills = grey(1);
  root.appendChild(menuTrigger());
  root.appendChild(menu());
  return root;
}
