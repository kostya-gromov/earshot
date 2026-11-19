'use client';

import { useRef } from 'react';
import { ReplayField } from '@/features/replay';
import { backspaceOutcome } from '@/lib/backspace-summary';
import { describeStep, replayStateAt, type ReplayStep } from '@/lib/replay';
import { Keycap, SpeechLine } from '@/ui';
import { useExamplePress } from './use-example-press';
import styles from './example.module.css';

export interface ExampleLane {
  adapter: string;
  system: string;
  version: string;
  steps: readonly ReplayStep[];
}

function Result({ step }: { step: ReplayStep }) {
  const line = step.heard[0] ?? step.speech.at(-1);
  return (
    <>
      <span>
        {step.removed.length > 0 || step.to.kind === 'chip'
          ? describeStep(step)
          : 'Nothing changed in the accessibility tree'}
      </span>
      {line ? (
        <SpeechLine source={step.heard.length > 0 ? 'announcement' : 'focus'} size="sm">
          {line}
        </SpeechLine>
      ) : (
        <span className={styles.silent}>Nothing said</span>
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
 * phrase is always there, unseen until the press, so the row keeps one height.
 */
function OutcomeLabel({
  recorded,
  isShown,
}: {
  recorded: ReplayStep | undefined;
  isShown: boolean;
}) {
  const outcome = backspaceOutcome(recorded);
  return (
    <p className={styles.label} data-shown={isShown || undefined}>
      {outcome.charAt(0).toUpperCase() + outcome.slice(1)}
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
        <OutcomeLabel recorded={lane.steps[0]} isShown={state.step !== undefined} />
        <Outcome recorded={lane.steps[0]} step={state.step} />
      </div>
    </div>
  );
}

interface ExampleLanesProps {
  lanes: readonly ExampleLane[];
  people: readonly string[];
  patternName: string;
}

/**
 * The frame: a line of provenance (which pattern, which key, which run) with the one control,
 * then every system's recording of that key, played together. A hairline, not a raised surface
 * and not a drawn window: everything in it is recorded.
 */
export function ExampleLanes({ lanes, people, patternName }: ExampleLanesProps) {
  const root = useRef<HTMLDivElement>(null);
  const { isPressed, hasPlayed, message, press, onKeyDown } = useExamplePress(lanes, root);
  return (
    <div className={styles.frame}>
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
