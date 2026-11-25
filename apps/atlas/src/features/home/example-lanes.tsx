'use client';

import { useRef, type ReactNode } from 'react';
import { ReplayField } from '@/features/replay';
import { backspaceOutcome } from '@/lib/backspace-summary';
import {
  describeStep,
  endsOutsidePage,
  notModelledWords,
  replayStateAt,
  spokenLines,
  type ReplayStep,
} from '@/lib/replay';
import type { SeenNote } from '@/lib/observed-as';
import { Keycap, SpeechLine } from '@/ui';
import { useExamplePress } from './use-example-press';
import styles from './example.module.css';

export interface ExampleLane {
  adapter: string;
  system: string;
  version: string;
  steps: readonly ReplayStep[];
  /**
   * A change seen on screen where the tree shows nothing: a hand-made note from targets.yaml,
   * shown under the recording with its own caption, never as part of it (2026-11-25).
   */
  onScreen?: SeenNote | undefined;
}

function Result({ step }: { step: ReplayStep }) {
  const line = step.heard[0] ?? spokenLines(step).at(-1);
  const hasChanged = step.removed.length > 0 || step.to.kind === 'chip';
  return (
    <>
      {/* Where nothing changed, the row's label already says so ("Changed nothing in the
          accessibility tree"); said twice it read as two findings. */}
      {hasChanged && <span>{describeStep(step)}</span>}
      {line ? (
        <span className={styles.spoken}>
          <span className={styles.modelled}>Modelled speech</span>
          <SpeechLine source={step.heard.length > 0 ? 'announcement' : 'focus'} size="sm">
            {line}
          </SpeechLine>
        </span>
      ) : (
        <span className={styles.silent}>
          {endsOutsidePage(step) ? notModelledWords : 'No modelled speech'}
        </span>
      )}
    </>
  );
}

/**
 * The waiting line and the result share one cell, only one of them shown: the row is as tall as
 * its result from the start, so the press, which often comes by itself while the reader is
 * scrolling, never moves the page (CLS).
 */
function Outcome({
  recorded,
  step,
}: {
  recorded: ReplayStep | undefined;
  step: ReplayStep | undefined;
}) {
  return (
    <div className={styles.outcomeSlot}>
      <p className={styles.outcome} data-current={!step || undefined}>
        Waiting for Backspace
      </p>
      {recorded && (
        <p className={styles.outcome} data-current={step !== undefined || undefined}>
          <Result step={recorded} />
        </p>
      )}
    </div>
  );
}

/**
 * "Removed a chip": one aligned phrase per row, so the results compare at a glance. The recorded
 * phrase is always there, unseen until the press, so the row keeps one height. Where a change
 * was seen on screen that the tree does not show, the row points to it; what was seen is told
 * under the recording, apart from it.
 */
function OutcomeLabel({ lane, isShown }: { lane: ExampleLane; isShown: boolean }) {
  const outcome = backspaceOutcome(lane.steps[0]);
  const hasSeen = outcome === 'changed nothing in the accessibility tree' && lane.onScreen;
  return (
    <p className={styles.label} data-shown={isShown || undefined}>
      {outcome.charAt(0).toUpperCase() + outcome.slice(1)}
      {hasSeen && <span className={styles.seenAs}> · a change on screen, seen by hand, below</span>}
    </p>
  );
}

interface LaneProps {
  lane: ExampleLane;
  people: readonly string[];
  index: number;
}

/** One system's recording at this point: its name, the field, then what happened and was said. */
function Lane({ lane, people, index }: LaneProps) {
  const state = replayStateAt(lane.steps, index);
  return (
    <div className={styles.lane}>
      <p className={styles.name}>
        {lane.system} <span>{lane.version}</span>
      </p>
      {/* No controls around the field: the Backspace story never leaves it. */}
      <div className={styles.field}>
        <ReplayField state={state} people={people} size="sm" hasControls={false} />
      </div>
      <div className={styles.result}>
        <OutcomeLabel lane={lane} isShown={state.step !== undefined} />
        <Outcome recorded={lane.steps[0]} step={state.step} />
      </div>
    </div>
  );
}

interface ExampleLanesProps {
  lanes: readonly ExampleLane[];
  people: readonly string[];
  patternName: string;
  /** The finding, as the frame's heading, above its line of provenance. */
  head?: ReactNode;
}

/**
 * The frame: a line of provenance (which pattern, which key, which run) with the one control,
 * then every system's recording of that key, played together. A hairline, not a raised surface
 * and not a drawn window: everything in it is recorded.
 */
export function ExampleLanes({ lanes, people, patternName, head }: ExampleLanesProps) {
  const root = useRef<HTMLDivElement>(null);
  const { isPressed, hasPlayed, message, press, onKeyDown } = useExamplePress(lanes, root);
  return (
    <div className={styles.frame}>
      {head}
      <div className={styles.bar}>
        <ul className={styles.facts}>
          <li>{patternName}</li>
          <li>
            <Keycap keys="Backspace" size="sm" pressed={isPressed} /> once, in an empty field
          </li>
          <li>Run 1 of 3</li>
        </ul>
        <button type="button" className={styles.press} onClick={press} onKeyDown={onKeyDown}>
          {/* One label once it has played: it no longer flips back while a replay resets. */}
          {hasPlayed ? 'Press again' : 'Press Backspace'}
        </button>
        <p role="status" className="visually-hidden">
          {message}
        </p>
      </div>
      <div ref={root} className={styles.lanes}>
        {lanes.map((lane) => (
          <Lane key={lane.adapter} lane={lane} people={people} index={isPressed ? 0 : -1} />
        ))}
      </div>
    </div>
  );
}
