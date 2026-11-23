import { boxed, markFocused, pad, row } from './layout.ts';
import { grey, stack, textLayer } from './shapes.ts';

/*
 * Combobox as a plain drawing: a label that stays, a field with typed text, and the open list
 * with one option active. The layer names are what the pins in src/lib/figma-board-pins.ts
 * point at.
 */

function comboboxField(): FrameNode {
  const frame = boxed(pad(row('Field', 280, 40), 12, 0), 0.45);
  frame.appendChild(textLayer('Li', { name: 'Typed text' }));
  return frame;
}

function option(value: string, isActive: boolean): FrameNode {
  const frame = pad(row(isActive ? 'Option / active' : 'Option / rest', 272, 32), 12, 0);
  frame.cornerRadius = 4;
  if (isActive) markFocused(frame);
  frame.appendChild(textLayer(value, { name: isActive ? 'Option text / active' : 'Option text' }));
  return frame;
}

function listbox(): FrameNode {
  const frame = boxed(pad(stack('VERTICAL', 'Listbox'), 4, 4), 0.8);
  frame.appendChild(option('Lima', false));
  frame.appendChild(option('Lisbon', true));
  frame.appendChild(option('Lille', false));
  return frame;
}

export function drawCombobox(): FrameNode {
  const root = pad(stack('VERTICAL', 'Combobox', 8), 32, 32);
  root.fills = grey(1);
  root.appendChild(textLayer('City', { name: 'Label', isMedium: true }));
  root.appendChild(comboboxField());
  root.appendChild(listbox());
  return root;
}
