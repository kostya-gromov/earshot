/*
 * The few shapes every drawing for Figma is made of. Greys only: the drawing shows structure and
 * states, and how a team styles its component stays with the team.
 */

export const grey = (value: number): SolidPaint[] => [
  { type: 'SOLID', color: { r: value, g: value, b: value } },
];

export interface TextLook {
  name?: string;
  size?: number;
  /** 0 is black, 1 is white. */
  shade?: number;
  isMedium?: boolean;
}

export function textLayer(characters: string, look: TextLook = {}): TextNode {
  const text = figma.createText();
  text.fontName = { family: 'Inter', style: look.isMedium ? 'Medium' : 'Regular' };
  text.characters = characters;
  text.fontSize = look.size ?? 14;
  text.fills = grey(look.shade ?? 0.15);
  text.name = look.name ?? characters;
  return text;
}

/** An auto-layout frame that hugs its children and has no fill of its own. */
export function stack(direction: 'HORIZONTAL' | 'VERTICAL', name: string, gap = 0): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.layoutMode = direction;
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.itemSpacing = gap;
  frame.fills = [];
  return frame;
}

/** A fixed square with its one child centred: a remove button, a numbered pin. */
export function centred(name: string, side: number, child: SceneNode): FrameNode {
  const frame = stack('HORIZONTAL', name);
  frame.resize(side, side);
  frame.primaryAxisSizingMode = 'FIXED';
  frame.counterAxisSizingMode = 'FIXED';
  frame.primaryAxisAlignItems = 'CENTER';
  frame.counterAxisAlignItems = 'CENTER';
  frame.cornerRadius = side / 2;
  frame.appendChild(child);
  return frame;
}
