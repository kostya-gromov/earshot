import { boxed, pad } from './layout.ts';
import { grey, stack, textLayer } from './shapes.ts';

/*
 * Tabs as a plain drawing: three tabs, one selected and another in focus, so the two marks can
 * be told apart, and the selected tab's panel. The layer names are what the pins in
 * src/lib/figma-board-pins.ts point at.
 */

type TabState = 'selected' | 'focused' | 'rest';

/** A bar under the label: dark on the selected tab, and there but empty on the others. */
function marker(isSelected: boolean): RectangleNode {
  const bar = figma.createRectangle();
  bar.name = isSelected ? 'Selected marker' : 'No marker';
  bar.resize(16, 2);
  bar.fills = isSelected ? grey(0.1) : [];
  bar.layoutAlign = 'STRETCH';
  return bar;
}

function tab(label: string, state: TabState): FrameNode {
  const frame = stack('VERTICAL', `Tab / ${state}`);
  // A ring outside the tab is cut off by a frame that clips.
  frame.clipsContent = false;
  frame.cornerRadius = 4;
  if (state === 'focused') {
    frame.strokes = grey(0.1);
    frame.strokeWeight = 2;
    frame.strokeAlign = 'OUTSIDE';
  }
  const text = pad(stack('HORIZONTAL', 'Tab label'), 12, 8);
  text.appendChild(textLayer(label, { name: 'Tab text', isMedium: state === 'selected' }));
  frame.appendChild(text);
  frame.appendChild(marker(state === 'selected'));
  return frame;
}

function tabList(): FrameNode {
  const frame = stack('HORIZONTAL', 'Tab list', 4);
  frame.clipsContent = false;
  frame.appendChild(tab('Overview', 'selected'));
  frame.appendChild(tab('Activity', 'focused'));
  frame.appendChild(tab('Settings', 'rest'));
  return frame;
}

function panel(): FrameNode {
  const frame = boxed(pad(stack('VERTICAL', 'Panel'), 16, 16), 0.8);
  frame.resize(360, 96);
  frame.primaryAxisSizingMode = 'FIXED';
  frame.counterAxisSizingMode = 'FIXED';
  frame.appendChild(textLayer('Panel of the selected tab', { name: 'Panel text', shade: 0.35 }));
  return frame;
}

export function drawTabs(): FrameNode {
  const root = pad(stack('VERTICAL', 'Tabs', 8), 32, 32);
  root.clipsContent = false;
  root.fills = grey(1);
  root.appendChild(tabList());
  root.appendChild(panel());
  return root;
}
