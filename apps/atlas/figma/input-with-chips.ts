import { centred, grey, stack, textLayer } from './shapes.ts';

/*
 * Input with chips as a plain drawing: a label, a field with a chip at rest, one in focus and an
 * invalid one, a keyboard hint and the text that explains the invalid chip. The layer names are
 * what the pins in src/lib/figma-board-pins.ts point at.
 */

type ChipState = 'rest' | 'focused' | 'invalid';

function chip(value: string, state: ChipState): FrameNode {
  const frame = stack('HORIZONTAL', `Chip / ${state}`, 4);
  frame.paddingLeft = 10;
  frame.paddingRight = 4;
  frame.paddingTop = 4;
  frame.paddingBottom = 4;
  frame.counterAxisAlignItems = 'CENTER';
  frame.cornerRadius = 16;
  frame.fills = grey(0.92);
  if (state !== 'rest') frame.strokes = grey(0.1);
  if (state === 'focused') {
    frame.strokeWeight = 2;
    frame.strokeAlign = 'OUTSIDE';
  }
  // Dashed, not red: the drawing has no colour, and the requirement is that text says it.
  if (state === 'invalid') frame.dashPattern = [3, 3];
  frame.appendChild(textLayer(value, { name: 'Chip text' }));
  const remove = centred('Remove button', 24, textLayer('×', { name: 'Remove icon' }));
  remove.fills = grey(0.82);
  frame.appendChild(remove);
  return frame;
}

function field(): FrameNode {
  const frame = stack('HORIZONTAL', 'Field', 8);
  frame.layoutWrap = 'WRAP';
  frame.counterAxisSpacing = 8;
  frame.paddingLeft = 8;
  frame.paddingRight = 8;
  frame.paddingTop = 8;
  frame.paddingBottom = 8;
  frame.resize(420, 48);
  frame.primaryAxisSizingMode = 'FIXED';
  frame.counterAxisAlignItems = 'CENTER';
  frame.maxHeight = 136;
  frame.cornerRadius = 6;
  frame.fills = grey(1);
  frame.strokes = grey(0.45);
  frame.appendChild(chip('Canberra', 'rest'));
  frame.appendChild(chip('Lisbon', 'focused'));
  frame.appendChild(chip('Osl', 'invalid'));
  frame.appendChild(textLayer('Add a city', { name: 'Input placeholder', shade: 0.45 }));
  return frame;
}

export function drawInputWithChips(): FrameNode {
  const root = stack('VERTICAL', 'Input with chips', 8);
  root.paddingLeft = 32;
  root.paddingRight = 32;
  root.paddingTop = 32;
  root.paddingBottom = 32;
  root.fills = grey(1);
  root.appendChild(textLayer('Recipients', { name: 'Label', isMedium: true }));
  root.appendChild(field());
  root.appendChild(
    textLayer('Backspace removes the last chip. Arrow keys move between chips.', {
      name: 'Keyboard hint',
      size: 12,
      shade: 0.35,
    }),
  );
  root.appendChild(
    textLayer('“Osl” is not a city in the list. Edit or remove it.', {
      name: 'Error text',
      size: 12,
    }),
  );
  return root;
}
