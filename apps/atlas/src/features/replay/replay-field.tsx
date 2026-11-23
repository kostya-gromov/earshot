'use client';

import type { ReplayFocus, ReplayState, ReplayStep } from '@/lib/replay';
import { controlLabels } from './control-labels';
import styles from './replay.module.css';
import { useRing, type Ring } from './use-ring';

/** The focused part of the field: a chip by its place among the chips still there. */
function targetKey(focus: ReplayFocus, present: readonly string[]): string {
  switch (focus.kind) {
    case 'chip':
      return present[focus.index - 1] ?? 'field';
    case 'input':
    case 'other':
      return 'field';
    case 'outside':
      return 'outside';
    case 'away':
      // No part of the drawing has it, and it is not a loss: no ring, and never the red one.
      return 'away';
    case 'body':
      return 'page';
  }
}

interface ReplayFieldProps {
  state: ReplayState;
  people: readonly string[];
  size?: 'lg' | 'md' | 'sm' | 'xs';
  /** The control after the field on the measured page, where Tab lands. */
  nextLabel?: string;
  /** The whole recording, so the controls keep one width while it plays. */
  steps?: readonly ReplayStep[];
  /**
   * False where the recording never leaves the field (one Backspace): the controls around it
   * would only look like buttons to press.
   */
  hasControls?: boolean;
}

interface ControlProps {
  label: string;
  isTarget: boolean;
  /** Every name it takes in the recording: invisible, they hold its width at the longest. */
  sizes: readonly string[];
  isShown?: boolean;
}

/** A control outside the field, named as the recording names it. */
function Control({ label, isTarget, sizes, isShown = true }: ControlProps) {
  return (
    <span
      className={styles.next}
      data-part={isTarget ? 'outside' : undefined}
      data-hidden={!isShown || undefined}
    >
      {sizes.map((size) => (
        <span key={size} className={styles.sizer}>
          {size}
        </span>
      ))}
      <span>{label}</span>
    </span>
  );
}

function RingMark({ ring, isLoss }: { ring: Ring; isLoss: boolean }) {
  return (
    <span
      className={styles.ring}
      data-loss={isLoss || undefined}
      style={{
        transform: `translate(${ring.x}px, ${ring.y}px)`,
        width: ring.width,
        height: ring.height,
      }}
    />
  );
}

interface Controls {
  /** Shown before the field only when focus went there (Shift+Tab out of it). */
  before: string | undefined;
  after: { label: string; isTarget: boolean };
}

/** The controls around the field, named as the recording names them where focus reached one. */
function controlsAround(state: ReplayState, nextLabel: string): Controls {
  const { focus, step } = state;
  if (focus.kind !== 'outside')
    return { before: undefined, after: { label: nextLabel, isTarget: false } };
  const label = focus.name || nextLabel;
  if (step?.key.startsWith('Shift+'))
    return { before: label, after: { label: nextLabel, isTarget: false } };
  return { before: undefined, after: { label, isTarget: true } };
}

interface PlacementOptions {
  nextLabel: string;
  steps: readonly ReplayStep[];
  hasControls: boolean;
}

/**
 * The controls to draw before and after the field, sized for the whole recording. The control
 * before is kept, unseen, from the start when Shift+Tab reaches it at any step, so its arrival
 * never narrows the field.
 */
function placedControls(
  state: ReplayState,
  { nextLabel, steps, hasControls }: PlacementOptions,
): { before: ControlProps | undefined; after: ControlProps | undefined } {
  if (!hasControls) return { before: undefined, after: undefined };
  const { before, after } = controlsAround(state, nextLabel);
  const labels = controlLabels(steps, nextLabel);
  const isBeforeHeld = before !== undefined || labels.before.length > 0;
  return {
    before: isBeforeHeld
      ? {
          label: before ?? labels.before[0] ?? '',
          isTarget: before !== undefined,
          sizes: labels.before,
          isShown: before !== undefined,
        }
      : undefined,
    after: { ...after, sizes: labels.after },
  };
}

function Chips({ people, removed }: { people: readonly string[]; removed: readonly string[] }) {
  return people.map((person) => (
    <span
      key={person}
      className={styles.chip}
      data-part={person}
      data-gone={removed.includes(person) || undefined}
    >
      {person}
    </span>
  ));
}

/**
 * The field with every chip, invisible under the live one. Chips only leave during a replay, so
 * this is its tallest state: the slot keeps that height and the page never moves as rows unwrap.
 */
function FieldGhost({ people }: { people: readonly string[] }) {
  return (
    <div className={styles.field} data-ghost>
      {people.map((person) => (
        <span key={person} className={styles.chip}>
          {person}
        </span>
      ))}
      <span className={styles.input} />
    </div>
  );
}

/**
 * A schematic of the recorded tree, not a picture of the system: the chips still there, the
 * input, the controls around the field, and where focus is. Hidden from assistive technology;
 * the same facts are always written beside it.
 */
export function ReplayField({
  state,
  people,
  size = 'md',
  nextLabel = 'Next field',
  steps = [],
  hasControls = true,
}: ReplayFieldProps) {
  const present = people.filter((person) => !state.removed.includes(person));
  const key = targetKey(state.focus, present);
  const { box, ring } = useRing(key);
  const { before, after } = placedControls(state, { nextLabel, steps, hasControls });
  return (
    <div ref={box} className={styles.wrap} data-size={size} aria-hidden="true">
      {before && <Control {...before} />}
      <div className={styles.slot}>
        <FieldGhost people={people} />
        <div className={styles.field} data-part="field" data-focus={state.focus.kind}>
          <Chips people={people} removed={state.removed} />
          <span className={styles.input}>
            <span className={styles.caret} />
          </span>
        </div>
      </div>
      {after && <Control {...after} />}
      {/* Outside the page there is nothing here to ring, and the last place must not keep it. */}
      {ring && key !== 'away' && <RingMark ring={ring} isLoss={key === 'page'} />}
    </div>
  );
}
