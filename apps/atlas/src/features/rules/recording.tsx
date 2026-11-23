'use client';

import { useRef, type RefObject } from 'react';
import { KeyRow, RecordingLegend, StepField, useClock } from '@/features/replay';
import {
  describeStep,
  endsOutsidePage,
  focusWords,
  notModelledWords,
  spokenLines,
  type ReplayLane,
  type ReplayStep,
} from '@/lib/replay';
import { Keycap, SpeechLine } from '@/ui';
import styles from './depth.module.css';

/** Every line the semantic model spoke at a step: announcements in violet, focus in ink. */
function Spoken({ step }: { step: ReplayStep }) {
  const lines = spokenLines(step);
  // Upright and grey, like "Nothing said": a statement about the model, not something heard.
  const unspoken = endsOutsidePage(step) ? notModelledWords : 'Nothing said';
  if (lines.length === 0) return <p className={styles.silent}>{unspoken}</p>;
  return lines.map((line) => (
    <SpeechLine key={line} source={step.heard.includes(line) ? 'announcement' : 'focus'} size="sm">
      {line}
    </SpeechLine>
  ));
}

/**
 * A live region that entered the page with this step already holding text, in the words the
 * combobox replay uses. Shown for every pattern: a verdict may quote it (engine 0.14.0).
 */
function Arrived({ step }: { step: ReplayStep }) {
  if (step.arrived.length === 0) return null;
  return (
    <p className={styles.tree}>
      A live region arrived holding: {step.arrived.map((text) => `“${text}”`).join(', ')}.
    </p>
  );
}

/** Nodes that left the accessibility tree with this step, word for word. */
function TreeChange({ step }: { step: ReplayStep }) {
  // A list that opens or closes is already drawn and said; its options are not listed again.
  if (step.left.length === 0 || step.combobox || step.menu) return null;
  return <p className={styles.tree}>Left the accessibility tree: {step.left.join(', ')}</p>;
}

interface StepStackProps {
  steps: readonly ReplayStep[];
  index: number;
  start: string | undefined;
}

/**
 * The starting state and every step in words, in one cell, only the current one shown: the
 * block is as tall as its longest step from the first frame, so a step with a spoken line and a
 * tree change never pushes the page down, and the next one never pulls it back (CLS).
 */
function StepStack({ steps, index, start }: StepStackProps) {
  return (
    <div className={styles.speech}>
      <div className={styles.step} data-current={index < 0 || undefined}>
        <p className={styles.what}>Starting state: {start ?? 'as recorded'}</p>
      </div>
      {steps.map((step, i) => (
        <div key={i} className={styles.step} data-current={i === index || undefined}>
          <p className={styles.what}>{describeStep(step)}</p>
          <Spoken step={step} />
          <Arrived step={step} />
          <TreeChange step={step} />
        </div>
      ))}
    </div>
  );
}

/** For a lane the schematic cannot draw faithfully: every step, as recorded. */
function TextSteps({ steps, start }: { steps: readonly ReplayStep[]; start: string | undefined }) {
  return (
    <ol className={styles.textSteps}>
      <li className={styles.what}>Starting state: {start ?? 'as recorded'}</li>
      {steps.map((step, i) => (
        <li key={i}>
          <Keycap keys={step.key} size="sm" />
          <div>
            <p className={styles.what}>Focus: {focusWords(step.to)}</p>
            <Spoken step={step} />
            <Arrived step={step} />
            <TreeChange step={step} />
            {step.added.length > 0 && (
              <p className={styles.tree}>Joined the accessibility tree: {step.added.join(', ')}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

interface RecordingProps {
  lane: ReplayLane;
  scenarioId: string;
  people: readonly string[];
  /**
   * Rows to keep for a list or a menu: the longest this system shows in any scenario of the
   * rule, so every recording of the system is drawn at one height from its first frame.
   */
  rows?: number;
}

interface RecordingViewProps extends RecordingProps {
  /** The step shown; -1 is the starting state. */
  index: number;
  /** The pause control of a playing recording; a recording that only keeps room has none. */
  control?: { isPlaying: boolean; toggle: () => void };
  rootRef?: RefObject<HTMLDivElement | null>;
}

/** A recording at one step: what is drawn and written, whoever keeps the time. */
function RecordingView(props: RecordingViewProps) {
  const { lane, scenarioId, people, rows, index, control, rootRef } = props;
  const steps = lane.steps[scenarioId] ?? [];
  const start = lane.starts[scenarioId];
  if (steps.length === 0) {
    const failure = lane.failures[scenarioId];
    return <p className={styles.silent}>{failure ?? 'Nothing was recorded for this scenario.'}</p>;
  }
  if (!lane.isSchematic) {
    return (
      <div className={styles.recording}>
        <p className={styles.note}>
          Shown as text: this component moves a removed token&rsquo;s name into the input, so the
          schematic field cannot draw its removals faithfully.
        </p>
        <TextSteps steps={steps} start={start} />
      </div>
    );
  }
  return (
    <div ref={rootRef} className={styles.recording}>
      <div className={styles.keys}>
        <span aria-hidden="true">
          <KeyRow keys={steps.map(({ key }) => key)} index={index} />
        </span>
        <button type="button" className={styles.pause} onClick={control?.toggle}>
          {control?.isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
      <RecordingLegend recordings={[steps]} />
      {/* A control beside the field only where the keys take focus out of it. */}
      <StepField
        steps={steps}
        index={index}
        people={people}
        hasControls={steps.some(({ to }) => to.kind === 'outside')}
        {...(rows === undefined ? {} : { rows })}
      />
      <StepStack steps={steps} index={index} start={start} />
    </div>
  );
}

/** One system's recording of one scenario, on a loop with a pause control, or as text. */
export function Recording(props: RecordingProps) {
  const root = useRef<HTMLDivElement>(null);
  const { lane, scenarioId } = props;
  const count = lane.steps[scenarioId]?.length ?? 0;
  const { index, isPlaying, toggle } = useClock({ steps: lane.isSchematic ? count : 0, root });
  return <RecordingView {...props} index={index} control={{ isPlaying, toggle }} rootRef={root} />;
}

/**
 * The same recording, still and unseen, to keep room: stacked under the one that plays, the
 * recordings of a system make its place as tall as the tallest of them from the first frame, so
 * nothing under it moves when another scenario is chosen (rule-replay.tsx).
 */
export function RecordingGhost(props: RecordingProps) {
  return <RecordingView {...props} index={-1} />;
}
