import type { CSSProperties, ReactNode } from 'react';
import { boxFaces, flatRect, pathThrough, project, type Box, type Point3 } from '@/lib/isometric';
import styles from './recording-figures.module.css';

/** A box as line art: its two near sides, then its top. Filled, so it hides what is behind. */
function Slab({ box }: { box: Box }) {
  const { top, left, right } = boxFaces(box);
  return (
    <g>
      <path className={styles.side} d={left} />
      <path className={styles.side} d={right} />
      <path className={styles.top} d={top} />
    </g>
  );
}

// Every figure is drawn at the same scale, so their lines weigh the same side by side.
function Figure({ viewBox, children }: { viewBox: string; children: ReactNode }) {
  return (
    <svg className={styles.figure} viewBox={viewBox} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

const chipStarts = [-62, -24, 14];

/** Focus: a field with three chips and the focus ring on one; a run steps it along and back. */
export function FocusFigure() {
  return (
    <Figure viewBox="-100 -87 200 160">
      <Slab box={{ x: -70, y: -30, z: 0, w: 140, d: 60, h: 6 }} />
      {chipStarts.map((x) => (
        <Slab key={x} box={{ x, y: -18, z: 6, w: 34, d: 36, h: 8 }} />
      ))}
      <path
        className={styles.mark}
        d={pathThrough(
          [
            [58, -12, 6],
            [58, 12, 6],
          ],
          false,
        )}
      />
      <path
        className={styles.ring}
        d={pathThrough(flatRect({ x: -65, y: -21, z: 14, w: 40, d: 42 }))}
      />
    </Figure>
  );
}

const plate = { x: -42, y: -42, w: 84, d: 84, h: 5 };
const treeHeight = 17;
const root: Point3 = [-26, 0, treeHeight];
const middle: Point3 = [0, 0, treeHeight];
const branches: readonly (readonly [Point3, Point3])[] = [
  [root, [0, -22, treeHeight]],
  [root, middle],
  [root, [0, 22, treeHeight]],
  [middle, [26, -11, treeHeight]],
  [middle, [26, 11, treeHeight]],
];
const nodes = [root, ...branches.map(([, to]) => to)];

/**
 * The accessibility tree: what is drawn on the surface, and the tree under it. A run parts the
 * layers and clears the surface, so the tree shows through, then closes them again.
 */
export function TreeFigure() {
  return (
    <Figure viewBox="-100 -95 200 160">
      <g className={styles.layerLow}>
        <Slab box={{ ...plate, z: 0 }} />
      </g>
      <g className={styles.layerMid}>
        <Slab box={{ ...plate, z: 12 }} />
        {branches.map(([from, to]) => (
          <path key={to.join()} className={styles.branch} d={pathThrough([from, to], false)} />
        ))}
        {nodes.map((node) => {
          const [cx, cy] = project(node);
          return <circle key={node.join()} className={styles.node} cx={cx} cy={cy} r="2.6" />;
        })}
      </g>
      <g className={styles.layerTop}>
        <Slab box={{ ...plate, z: 24 }} />
        <g className={styles.surface}>
          <path d={pathThrough(flatRect({ x: -32, y: -10, z: 29, w: 64, d: 20 }))} />
          <path d={pathThrough(flatRect({ x: -28, y: -6, z: 29, w: 18, d: 12 }))} />
          <path d={pathThrough(flatRect({ x: -6, y: -6, z: 29, w: 18, d: 12 }))} />
        </g>
      </g>
    </Figure>
  );
}

// A circle on the ground, seen from this angle, is an ellipse this much wider and flatter.
const RING_WIDE = 1.2247;
const RING_FLAT = 0.7071;
const waves = [34, 52, 70];

/**
 * Announcements: a live region with what it says going out from it. The rings at rest stay; a
 * run sends a new ring out over each of them.
 */
export function AnnouncementFigure() {
  return (
    <Figure viewBox="-100 -84 200 160">
      {waves.map((radius, index) => {
        const ring = {
          style: { '--wave': index } as CSSProperties,
          rx: radius * RING_WIDE,
          ry: radius * RING_FLAT,
        };
        return (
          <g key={radius}>
            <ellipse className={styles.wave} {...ring} />
            <ellipse className={styles.pulse} {...ring} />
          </g>
        );
      })}
      <Slab box={{ x: -20, y: -20, z: 0, w: 40, d: 40, h: 8 }} />
      <path
        className={styles.mark}
        d={`${pathThrough(
          [
            [-10, -6, 8],
            [10, -6, 8],
          ],
          false,
        )}${pathThrough(
          [
            [-10, 4, 8],
            [4, 4, 8],
          ],
          false,
        )}`}
      />
    </Figure>
  );
}
