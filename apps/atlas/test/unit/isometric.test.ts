import { describe, expect, it } from 'vitest';
import { boxFaces, pathThrough, project } from '../../src/lib/isometric';

describe('project', () => {
  it('puts the origin at the origin and height straight up the page', () => {
    expect(project([0, 0, 0])).toEqual([0, 0]);
    expect(project([0, 0, 10])).toEqual([0, -10]);
  });

  it('sends x right and down, y left and down, by the same amount', () => {
    expect(project([10, 0, 0])).toEqual([8.7, 5]);
    expect(project([0, 10, 0])).toEqual([-8.7, 5]);
  });
});

describe('pathThrough', () => {
  it('closes a face and leaves a line open when asked', () => {
    const points = [
      [0, 0, 0],
      [10, 0, 0],
    ] as const;
    expect(pathThrough(points)).toBe('M0 0L8.7 5Z');
    expect(pathThrough(points, false)).toBe('M0 0L8.7 5');
  });
});

describe('boxFaces', () => {
  it('draws the top at the box height and both near sides down to its base', () => {
    const faces = boxFaces({ x: 0, y: 0, z: 0, w: 10, d: 10, h: 4 });
    expect(faces.top).toBe('M0 -4L8.7 1L0 6L-8.7 1Z');
    expect(faces.left).toBe('M-8.7 1L0 6L0 10L-8.7 5Z');
    expect(faces.right).toBe('M8.7 1L0 6L0 10L8.7 5Z');
  });
});
