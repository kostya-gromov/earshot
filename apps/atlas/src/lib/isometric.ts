/** A point in the drawing's space: x runs right and towards the viewer, y left and towards, z up. */
export type Point3 = readonly [x: number, y: number, z: number];

export interface Box {
  x: number;
  y: number;
  z: number;
  /** Size along x, y and z. */
  w: number;
  d: number;
  h: number;
}

const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;

// One decimal is finer than a drawn line, and keeps the markup short.
const round = (value: number) => Math.round(value * 10) / 10;

/** Where a point lands on the page in an isometric view (screen y grows downwards). */
export const project = ([x, y, z]: Point3): readonly [number, number] => [
  round((x - y) * COS),
  round((x + y) * SIN - z),
];

/** An SVG path through the points, closed into a face unless it is an open line. */
export function pathThrough(points: readonly Point3[], isClosed = true): string {
  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${project(point).join(' ')}`)
    .join('');
  return isClosed ? `${line}Z` : line;
}

/** A flat rectangle lying at height z. */
export const flatRect = ({ x, y, z, w, d }: Omit<Box, 'h'>): Point3[] => [
  [x, y, z],
  [x + w, y, z],
  [x + w, y + d, z],
  [x, y + d, z],
];

/** The three faces of a box the viewer can see, as paths: its top and its two near sides. */
export function boxFaces(box: Box): { top: string; left: string; right: string } {
  const { x, y, z, w, d, h } = box;
  const top = z + h;
  return {
    top: pathThrough(flatRect({ ...box, z: top })),
    left: pathThrough([
      [x, y + d, top],
      [x + w, y + d, top],
      [x + w, y + d, z],
      [x, y + d, z],
    ]),
    right: pathThrough([
      [x + w, y, top],
      [x + w, y + d, top],
      [x + w, y + d, z],
      [x + w, y, z],
    ]),
  };
}
