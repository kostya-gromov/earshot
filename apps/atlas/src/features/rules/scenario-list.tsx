'use client';

import { Fragment, useState } from 'react';
import { VerdictBadge } from '@/features/evidence';
import {
  decidingScenario,
  hasDecidingScenario,
  ruleWideResult,
  type LaneVerdict,
  type ReplayLane,
} from '@/lib/replay';
import { foldLabel, foldRowWords } from '@/lib/scenario-fold-words';
import { groupScenarios } from '@/lib/scenario-groups';
import { Disclosure } from '@/ui';
import styles from './depth.module.css';

export interface Scenario {
  id: string;
  label: string;
}

interface ScenarioListProps {
  lane: ReplayLane;
  ruleId: string;
  scenarios: readonly Scenario[];
  current: string;
  onSelect: (id: string) => void;
}

/** A scenario's own result, with the number of steps its recording holds. */
type Result = LaneVerdict['basis'][number] & { recordedSteps?: number | undefined };

/**
 * The mark of the scenario behind the verdict, or of the one that says why none was reached;
 * or that the row repeats the rule's verdict, when no scenario was judged on its own.
 */
function markOf(verdict: LaneVerdict | undefined, id: string): string | undefined {
  // Said on the row, so a result the engine did not record for the scenario never looks like
  // one it did (verdict audit, 2026-11-17).
  if (ruleWideResult(verdict, id)) return 'The rule’s verdict, not this scenario’s';
  if (!verdict || id !== decidingScenario(verdict)) return undefined;
  if (!hasDecidingScenario(verdict)) return undefined;
  return verdict.verdict === 'inconclusive' ? 'Why it was not judged' : 'Decided the verdict';
}

interface ScenarioButtonProps {
  scenario: Scenario;
  /** This system's own result for the scenario, when the file records one. */
  own: Result | undefined;
  words: string | undefined;
  mark?: string | undefined;
  isCurrent: boolean;
  onSelect: (id: string) => void;
  /** In a fold: name and words on one line, “Escape · 3 steps judged”. */
  isInline?: boolean;
}

/** One scenario with this system's own result for it; the one behind the verdict is marked. */
function ScenarioButton(props: ScenarioButtonProps) {
  const { scenario, own, words, mark, isCurrent, onSelect, isInline = false } = props;
  return (
    <button
      type="button"
      className={styles.scenario}
      data-inline={isInline || undefined}
      aria-pressed={isCurrent}
      onClick={() => onSelect(scenario.id)}
    >
      {own && <VerdictBadge verdict={own.verdict} isMarkOnly />}
      <span>
        <b>{scenario.label}</b>
        {isInline && words ? <span className={styles.count}> · {words}</span> : words}
        {mark && <em className={styles.decided}>{mark}</em>}
      </span>
    </button>
  );
}

/**
 * Which folds are open, by system and by the scenario that leads the fold: a fold opened for one
 * system says nothing about another's, whose groups are other groups. And which scenario each
 * closed fold keeps out in the list: the one the person watched from it last. It stays there
 * after they choose another row, until the fold is opened, so that nothing under the pointer
 * moves when a choice is made below it (panel invariant "row-stays", 2026-11-16).
 */
function useFolds(laneId: string) {
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set());
  const [kept, setKept] = useState<Readonly<Record<string, string>>>({});
  const keyOf = (lead: Scenario) => `${laneId}:${lead.id}`;
  return {
    foldOf: (lead: Scenario) => ({
      keptId: kept[keyOf(lead)],
      fold: {
        isOpen: opened.has(keyOf(lead)),
        onOpenChange: (isOpen: boolean) => {
          setOpened((keys) => {
            const next = new Set(keys);
            if (isOpen) next.add(keyOf(lead));
            else next.delete(keyOf(lead));
            return next;
          });
          // Opened, the fold shows all its scenarios again: none needs keeping out.
          if (isOpen) setKept(({ [keyOf(lead)]: _gone, ...rest }) => rest);
        },
      },
    }),
    /** Before another scenario is chosen: the closed fold that held this one keeps showing it. */
    keep: (lead: Scenario, scenarioId: string) => {
      if (!opened.has(keyOf(lead))) setKept((all) => ({ ...all, [keyOf(lead)]: scenarioId }));
    },
  };
}

/** Each scenario's result with the number of steps its recording holds, for the step counts. */
const resultsOf = (lane: ReplayLane, ruleId: string): Result[] =>
  (lane.verdicts[ruleId]?.basis ?? []).map((entry) => ({
    ...entry,
    recordedSteps: lane.steps[entry.scenario]?.length,
  }));

type Folded = { scenario: Scenario; own: Result | undefined };

interface FoldProps {
  /** The scenarios folded under a row, each with its own result. */
  folded: readonly Folded[];
  /** What they share, in the evaluator's own short words. */
  shared: string | undefined;
  current: string;
  onSelect: (id: string) => void;
  fold: { isOpen: boolean; onOpenChange: (isOpen: boolean) => void };
  /** The scenario of this fold the person watched last, shown outside it while it is closed. */
  keptId: string | undefined;
}

interface FoldedRowProps {
  row: Folded;
  current: string;
  onSelect: (id: string) => void;
}

function FoldedRow({ row: { scenario, own }, current, onSelect }: FoldedRowProps) {
  return (
    <ScenarioButton
      scenario={scenario}
      own={own}
      words={own && foldRowWords(own)}
      isCurrent={scenario.id === current}
      onSelect={onSelect}
      isInline
    />
  );
}

/**
 * The scenarios that say the same as the row above: what they share once, then what differs.
 * Closed over the scenario the person is watching, the fold keeps that one row in the list,
 * under its button, and counts the others: the person chose it, and closing a group must not
 * change what they are looking at (2026-11-16).
 */
function Fold({ folded, shared, current, onSelect, fold, keptId }: FoldProps) {
  const find = (id: string | undefined) => folded.find(({ scenario }) => scenario.id === id);
  // The scenario being watched, or the last one watched from this fold: one row, never two.
  const chosen = fold.isOpen ? undefined : (find(current) ?? find(keptId));
  const inside = folded.filter((row) => row !== chosen);
  return (
    <>
      <li className={styles.fold}>
        <Disclosure
          label={foldLabel(inside.flatMap(({ own }) => own ?? []))}
          {...fold}
          tone="plain"
          isBare
        >
          <p className={styles.shared}>{shared}</p>
          <ul className={styles.scenarios}>
            {inside.map((row) => (
              <li key={row.scenario.id}>
                <FoldedRow row={row} current={current} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        </Disclosure>
      </li>
      {chosen && (
        <li className={styles.kept}>
          <FoldedRow row={chosen} current={current} onSelect={onSelect} />
        </li>
      )}
    </>
  );
}

/**
 * The scenarios that test this rule, each with this system's own result for it. The one behind
 * the verdict is marked, so the replay never contradicts the verdict beside it. Scenarios that
 * say the same but for their step counts are folded under one of them, behind a disclosure that
 * says how many they are and how many steps were judged in them. Opened, the fold says what they
 * share once, and each row only what sets it apart: twelve rows of one paragraph pushed
 * everything below them out of sight (design reviews of 2026-11-16).
 */
export function ScenarioList({ lane, ruleId, scenarios, current, onSelect }: ScenarioListProps) {
  const verdict = lane.verdicts[ruleId];
  const results = resultsOf(lane, ruleId);
  // A verdict reached before any scenario was judged holds for each: its rows say it too.
  const resultOf = (id: string): Result | undefined =>
    results.find((entry) => entry.scenario === id) ?? ruleWideResult(verdict, id);
  const rows = groupScenarios(scenarios, results, verdict && decidingScenario(verdict));
  const folds = useFolds(lane.id);
  // The fold that holds the scenario being left keeps showing it, so no row moves on a choice.
  const select = (id: string) => {
    const from = rows.find(({ same }) => same.some((other) => other.id === current));
    if (from) folds.keep(from.scenario, current);
    onSelect(id);
  };
  return (
    <ul className={styles.scenarios} aria-label={`${lane.name}: the scenarios behind this verdict`}>
      {rows.map(({ scenario, same }) => (
        <Fragment key={scenario.id}>
          <li>
            <ScenarioButton
              scenario={scenario}
              own={resultOf(scenario.id)}
              words={resultOf(scenario.id)?.summary}
              mark={markOf(verdict, scenario.id)}
              isCurrent={scenario.id === current}
              onSelect={select}
            />
          </li>
          {/* Its own items: inside the row above, the fold would read as part of that scenario. */}
          {same.length > 0 && (
            <Fold
              folded={same.map((other) => ({ scenario: other, own: resultOf(other.id) }))}
              shared={resultOf(scenario.id)?.summary}
              current={current}
              onSelect={select}
              {...folds.foldOf(scenario)}
            />
          )}
        </Fragment>
      ))}
    </ul>
  );
}
