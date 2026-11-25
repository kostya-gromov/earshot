'use client';

import type { ReactNode } from 'react';
import { listRows } from '@/features/replay';
import { describeFallback, type ReplayLane } from '@/lib/replay';
import { Recording, RecordingGhost } from './recording';
import { ScenarioList, type Scenario } from './scenario-list';
import { SystemVerdicts } from './system-verdicts';
import { useLinkedSystem } from './use-linked-system';
import { useRulePlayer } from './use-rule-player';
import { useSceneRoom } from './use-scene-room';
import styles from './depth.module.css';

interface RuleReplayProps {
  ruleId: string;
  scenarios: readonly Scenario[];
  lanes: readonly ReplayLane[];
  people: readonly string[];
  /** Each system's evidence (notes, provenance, links), rendered on the server, by lane id. */
  details: Readonly<Record<string, ReactNode>>;
  /** "Replay in playground" for the reference, by scenario id. */
  playgroundActions: Readonly<Record<string, ReactNode>>;
}

/**
 * What was measured and what is worth knowing about the chosen system, under both columns at the
 * panel's width: in the narrow column beside the list of systems it ran far below the replay,
 * next to nothing (design review 2026-11-16). The id keeps "#ev-<rule>-<system>" a real anchor;
 * focus goes to the system's button.
 */
function SystemDetails({ anchor, children }: { anchor: string; children: ReactNode }) {
  return (
    <div id={anchor} className={styles.details}>
      {children}
    </div>
  );
}

interface SceneProps {
  lane: ReplayLane;
  /** The scenario that plays. */
  scenario: string;
  scenarios: readonly Scenario[];
  people: readonly string[];
  rows: number;
}

/**
 * The recording that plays, in a place as tall as the tallest recording this system has for the
 * rule: the others lie under it, still, unseen and out of reach, only to keep that room. From
 * the first frame, so the list below never moves when another scenario is chosen. It replaces a
 * height that was held as it grew, which left the first choices to jump (design review
 * 2026-11-16; decided the same day).
 *
 * Not for a scenario that shows no list at all: its recording takes only the room it needs.
 * Kept as tall as a recording with a list, it stood over a large empty space (* 2026-11-17). The price is known: between such a scenario and one with a list the rows below
 * move again.
 */
function Scene({ lane, scenario, scenarios, people, rows }: SceneProps) {
  const hasList = listRows([lane.steps[scenario] ?? []]) > 0;
  const others = hasList ? scenarios.filter(({ id }) => id !== scenario) : [];
  return (
    <div className={styles.sizer}>
      {/* Which scenario plays, on the recording itself: its row may be far down the list, or off
          the screen once the page has scrolled to the recording (panel invariant "choice-named"). */}
      <p className={styles.sceneTitle}>
        {scenarios.find(({ id }) => id === scenario)?.label ?? scenario}
      </p>
      {others.map(({ id }) => (
        <div key={id} className={styles.ghost} aria-hidden="true" inert>
          <RecordingGhost lane={lane} scenarioId={id} people={people} rows={rows} />
        </div>
      ))}
      <div>
        <Recording
          key={`${lane.id}-${scenario}`}
          lane={lane}
          scenarioId={scenario}
          people={people}
          rows={hasList ? rows : 0}
        />
      </div>
    </div>
  );
}

interface MissingProps {
  lane: ReplayLane;
  ruleId: string;
  /** The scenario shown in its place. */
  shown: string;
  /** The scenario the person chose and this system did not record, by its label. */
  label: string | undefined;
}

/** Said when the chosen scenario cannot be shown for this system, so the change is not silent. */
function Missing({ lane, ruleId, shown, label }: MissingProps) {
  if (label === undefined) return null;
  // Nothing is "shown instead" when the scenario behind the verdict has no recording either
  // (every chip scenario of Chakra UI failed its setup): the sentence then says only that.
  const isRecorded = (lane.steps[shown]?.length ?? 0) > 0;
  return (
    <p className={styles.missing} role="status">
      {lane.name} has no recording of “{label}”
      {isRecorded
        ? `. Shown instead: ${describeFallback(lane.verdicts[ruleId])}.`
        : ', nor of the scenario behind its verdict.'}
    </p>
  );
}

/**
 * One player per rule: pick a system, then one of the scenarios behind its verdict, and watch
 * that recording, with the system's evidence underneath. It opens on the scenario that decided
 * the verdict, so the replay and the verdict beside it never disagree; a scenario the person
 * chooses is kept as they go from system to system, so they can compare one scenario across all
 * (use-rule-player.ts).
 */
export function RuleReplay(props: RuleReplayProps) {
  const { ruleId, scenarios, lanes, people, details, playgroundActions } = props;
  const player = useRulePlayer({ ruleId, lanes, first: scenarios[0]?.id ?? '' });
  const { lane, scenario } = player;
  // A string, so the effect inside does not restart when the lanes array is a new one.
  const systems = lanes.map(({ id }) => id).join(' ');
  useLinkedSystem({ ruleId, systems, select: player.selectSystem });
  useSceneRoom(player.recording);
  // Every recording of the system is drawn with room for its longest list (see also Scene).
  const rows = lane ? listRows(scenarios.map(({ id }) => lane.steps[id] ?? [])) : 0;
  return (
    <div id={`player-${ruleId}`} className={styles.watch}>
      {lane && (
        <div className={styles.stage}>
          {/* The scene first; it stays in view while the list under it is read (depth.module.css). */}
          <div ref={player.recording} className={styles.scene}>
            <Scene
              lane={lane}
              scenario={scenario}
              scenarios={scenarios}
              people={people}
              rows={rows}
            />
          </div>
          <Missing
            lane={lane}
            ruleId={ruleId}
            shown={scenario}
            label={scenarios.find(({ id }) => id === player.missing)?.label ?? player.missing}
          />
          <ScenarioList
            lane={lane}
            ruleId={ruleId}
            scenarios={scenarios}
            current={scenario}
            onSelect={player.selectScenario}
          />
          {lane.isReference && playgroundActions[scenario]}
        </div>
      )}
      <div className={styles.side}>
        <SystemVerdicts
          ruleId={ruleId}
          lanes={lanes}
          current={player.current}
          onSelect={player.selectSystem}
        />
      </div>
      {lane && <SystemDetails anchor={`ev-${ruleId}-${lane.id}`}>{details[lane.id]}</SystemDetails>}
    </div>
  );
}
