'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { VerdictBadge } from '@/features/evidence';
import { RecordingLegend, StepField, listRows, useClock } from '@/features/replay';
import { describeStep, type ReplayLane, type ReplayStep } from '@/lib/replay';
import { Keycap, SpeechLine } from '@/ui';
import styles from './grid.module.css';

/**
 * Lanes per row: all of them, up to four. A fourth lane used to wrap the grid to two by two and
 * push everything below down by 190 px; narrower screens still go two by two (see the styles).
 */
const columnsFor = (count: number): number => Math.min(Math.max(count, 1), 4);

export interface GridScenario {
  id: string;
  label: string;
  /** The rule this scenario shows best; its verdict closes each cell. */
  ruleId: string;
}

function Said({ step }: { step: ReplayStep }) {
  const line = step.heard[0] ?? step.speech.at(-1);
  return (
    <>
      <span className={styles.what}>{describeStep(step)}</span>
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
 * Every step's words in one cell, only the current one shown: the cell is as tall as its longest
 * step from the first frame, so the replay never moves the page (CLS), and steps crossfade.
 */
function SaidStack({ steps, index }: { steps: readonly ReplayStep[]; index: number }) {
  return (
    <div className={styles.said}>
      {steps.map((step, i) => (
        <p key={i} className={styles.saidStep} data-current={i === index || undefined}>
          <Said step={step} />
        </p>
      ))}
    </div>
  );
}

interface GridCellProps {
  lane: ReplayLane;
  scenario: GridScenario;
  index: number;
  people: readonly string[];
  /** False when no lane leaves the field in this scenario: no control beside it to draw. */
  hasControls: boolean;
  /** Smaller chips when four lanes share the row. */
  size: 'sm' | 'xs';
  /** Rows every lane keeps for a list, so the words under the schematics stay on one line. */
  rows: number;
}

/** True when the keys take focus out of the field in any lane (Tab, Shift+Tab). */
const leavesField = (lanes: readonly ReplayLane[], scenarioId: string): boolean =>
  lanes.some((lane) => (lane.steps[scenarioId] ?? []).some(({ to }) => to.kind === 'outside'));

/** One system at this point of the replay, with the verdict for the rule the keys test. */
function GridCell({ lane, scenario, index, people, hasControls, size, rows }: GridCellProps) {
  const steps = lane.steps[scenario.id] ?? [];
  const verdict = lane.verdicts[scenario.ruleId];
  return (
    <article className={styles.cell}>
      <h3 className={styles.name}>
        {lane.name} <span>{lane.version}</span>
      </h3>
      {steps.length > 0 ? (
        <StepField
          steps={steps}
          index={index}
          people={people}
          size={size}
          hasControls={hasControls}
          rows={rows}
        />
      ) : (
        <p className={styles.silent}>Could not reach the starting state, so nothing was pressed.</p>
      )}
      <SaidStack steps={steps} index={index} />
      {verdict && (
        <p className={styles.verdict}>
          <VerdictBadge verdict={verdict.verdict} isMarkOnly /> {verdict.summary}
        </p>
      )}
    </article>
  );
}

interface LanesProps {
  scenario: GridScenario;
  lanes: readonly ReplayLane[];
  people: readonly string[];
}

/** Every lane on one clock; a new scenario mounts a fresh clock (keyed by the caller). */
function Lanes({ scenario, lanes, people }: LanesProps) {
  const root = useRef<HTMLDivElement>(null);
  const keys = (lanes.find((lane) => lane.isReference) ?? lanes[0])?.steps[scenario.id] ?? [];
  const { index, isPlaying, toggle } = useClock({ steps: keys.length, root });
  const hasControls = leavesField(lanes, scenario.id);
  const rows = listRows(lanes.map((lane) => lane.steps[scenario.id] ?? []));
  return (
    <>
      <div className={styles.keys}>
        <span aria-hidden="true" className={styles.keyRow}>
          {keys.map((step, i) => (
            <span key={i} data-done={i < index || undefined}>
              <Keycap keys={step.key === 'Click' ? 'Click' : step.key} pressed={i === index} />
            </span>
          ))}
        </span>
        <button type="button" className={styles.pause} onClick={toggle}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
      {/* A list or a menu replay has marks and kinds of spoken line to name, here above it. */}
      <RecordingLegend recordings={lanes.map((lane) => lane.steps[scenario.id] ?? [])} />
      <div
        ref={root}
        className={styles.grid}
        data-lanes={lanes.length}
        style={{ '--columns': columnsFor(lanes.length) } as CSSProperties}
      >
        {lanes.map((lane) => (
          <GridCell
            key={lane.id}
            lane={lane}
            scenario={scenario}
            index={index}
            people={people}
            hasControls={hasControls}
            size={lanes.length > 3 ? 'xs' : 'sm'}
            rows={rows}
          />
        ))}
      </div>
    </>
  );
}

interface ReplayGridProps {
  scenarios: readonly GridScenario[];
  lanes: readonly ReplayLane[];
  people: readonly string[];
}

/** The same keys pressed in the reference and every picked system, replayed side by side. */
export function ReplayGrid({ scenarios, lanes, people }: ReplayGridProps) {
  const [current, setCurrent] = useState(scenarios[0]);
  if (!current) return null;
  return (
    <div className={styles.replay}>
      <div className={styles.scenarios} role="group" aria-label="Keys to replay">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            aria-pressed={scenario.id === current.id}
            onClick={() => setCurrent(scenario)}
          >
            {scenario.label}
          </button>
        ))}
      </div>
      <Lanes key={current.id} scenario={current} lanes={lanes} people={people} />
    </div>
  );
}
