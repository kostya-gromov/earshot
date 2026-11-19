import type { CSSProperties } from 'react';
import { boxFaces, pathThrough, project, type Box, type Point3 } from '@/lib/isometric';
import styles from './recording-figures.module.css';

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

const line = (from: Point3, to: Point3) => pathThrough([from, to], false);

// Two sheets of the standards at the back, the rule's card in front. Each sheet has lines of
// text; one of them is the passage a rule cites, and a connector runs from it to the card.
const wcag: Box = { x: -66, y: -18, z: 0, w: 40, d: 52, h: 2 };
const apg: Box = { x: -18, y: -66, z: 0, w: 52, d: 40, h: 2 };
const card: Box = { x: 14, y: 14, z: 0, w: 40, d: 40, h: 6 };

/** Where the cited passage sits on each sheet: the row the connector leaves from. */
const cited = { wcag: 30, apg: 30 };

const wcagText = [-8, 4, 16].map((y) => line([-60, y, 2], [-34, y, 2]));
const apgText = [-8, 4, 16].map((x) => line([x, -60, 2], [x, -34, 2]));

const connectors = [
  { key: 'wcag', from: [-26, cited.wcag, 0], to: [14, cited.wcag, 0] },
  { key: 'apg', from: [cited.apg, -26, 0], to: [cited.apg, 14, 0] },
] as const satisfies readonly { key: string; from: Point3; to: Point3 }[];

/** How far a pulse travels along its connector, in the drawing's units, for its one run. */
function travel(from: Point3, to: Point3): CSSProperties {
  const [x1, y1] = project(from);
  const [x2, y2] = project(to);
  return { '--dx': `${x2 - x1}px`, '--dy': `${y2 - y1}px` } as CSSProperties;
}

function Label({ at, children }: { at: readonly [number, number]; children: string }) {
  return (
    <text className={styles.label} x={at[0]} y={at[1]} textAnchor="middle">
      {children}
    </text>
  );
}

/**
 * How a rule is made: a passage of WCAG and a passage of APG lead to one rule. A run sends a
 * mark along each connector to the card, which lifts once when they arrive. In the page's greys
 * only: nothing here is focus or speech, so neither of their colours is used.
 */
export function RuleFigure() {
  return (
    <svg className={styles.figure} viewBox="-100 -64 200 146" aria-hidden="true" focusable="false">
      {connectors.map(({ key, from, to }) => (
        <path key={key} className={styles.connector} d={line(from, to)} />
      ))}
      <Slab box={wcag} />
      <Slab box={apg} />
      {[...wcagText, ...apgText].map((d) => (
        <path key={d} className={styles.mark} d={d} />
      ))}
      <path className={styles.passage} d={line([-60, cited.wcag, 2], [-30, cited.wcag, 2])} />
      <path className={styles.passage} d={line([cited.apg, -60, 2], [cited.apg, -30, 2])} />
      {connectors.map(({ key, from, to }) => {
        const [cx, cy] = project(from);
        return (
          <circle
            key={key}
            className={styles.carried}
            cx={cx}
            cy={cy}
            r="2.4"
            style={travel(from, to)}
          />
        );
      })}
      <g className={styles.ruleCard}>
        <Slab box={card} />
        <path className={styles.passage} d={line([20, 26, 6], [46, 26, 6])} />
        <path className={styles.mark} d={line([20, 38, 6], [38, 38, 6])} />
      </g>
      <Label at={[-47, -50]}>WCAG</Label>
      <Label at={[47, -50]}>APG</Label>
      <Label at={[0, 74]}>Rule</Label>
    </svg>
  );
}
