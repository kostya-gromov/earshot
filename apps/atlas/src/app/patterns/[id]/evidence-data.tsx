import type { Measurement, Pattern, TargetEntry } from '@earshot/contracts';
import type { LoadedMeasurement } from '@/data/measurements';
import { SystemEvidence, playgroundKeys } from '@/features/evidence';
import { ReplayInPlayground } from '@/features/playground';
import { countedVerdicts, isReference, ruleAgreement } from '@/lib/agreement';
import { replayLane } from '@/lib/replay';
import { isExplainedByModel, modelsFor } from '@/lib/trade-offs';

// Build-time data for the rules section: plain values and server-rendered evidence per system.

/** The scenarios that test each rule, as the reference measurement records them. */
export function scenariosByRule(pattern: Pattern, reference: Measurement | undefined) {
  return Object.fromEntries(
    pattern.rules.map(({ id }) => [
      id,
      (reference?.scenarios ?? []).filter(({ rules }) => rules.includes(id)).map((s) => s.id),
    ]),
  );
}

/** Agreement and the counted verdicts per rule, from measured design systems only. */
export function countedOf(
  pattern: Pattern,
  all: readonly Measurement[],
  notCounted: ReadonlySet<string>,
) {
  return {
    agreement: Object.fromEntries(
      pattern.rules.map(({ id }) => [id, ruleAgreement(id, all, notCounted)]),
    ),
    verdicts: Object.fromEntries(
      pattern.rules.map(({ id }) => [id, countedVerdicts(id, all, notCounted)]),
    ),
  };
}

interface NotCounted {
  /** Adapter to the reason it is not counted. */
  notCounted: ReadonlyMap<string, string>;
  deprecated: ReadonlySet<string>;
}

/**
 * The reference first, then the counted systems, then the ones not counted, with every recording
 * a rule's replay needs. A deprecated component is shown as text: its tree diff cannot draw its
 * removals faithfully (its removed token's name moves into the input).
 */
export function replayLanesOf(
  measured: readonly LoadedMeasurement[],
  { notCounted, deprecated }: NotCounted,
  people: readonly string[],
) {
  const scenarioIds = [
    ...new Set(measured.flatMap(({ measurement }) => measurement.scenarios.map(({ id }) => id))),
  ];
  const rank = (m: Measurement) => (isReference(m) ? 0 : notCounted.has(m.target.adapter) ? 2 : 1);
  return measured
    .map(({ measurement }) => measurement)
    .toSorted((a, b) => rank(a) - rank(b))
    .map((m) =>
      replayLane(m, {
        scenarioIds,
        people,
        isSchematic: !deprecated.has(m.target.adapter),
        uncounted: notCounted.get(m.target.adapter),
      }),
    );
}

/** Each measured system's evidence for a rule, by adapter: shown under the rule's player. */
export function systemDetails(
  pattern: Pattern,
  measured: readonly LoadedMeasurement[],
  targets: readonly TargetEntry[],
) {
  return (ruleId: string) => {
    const models = modelsFor(pattern, { ruleId });
    return Object.fromEntries(
      measured.map((loaded) => {
        const { adapter } = loaded.measurement.target;
        const entry = targets.find((t) => t.status === 'measured' && t.adapter === adapter);
        // A model is named beside a system only where it explains that system's verdict here.
        const verdict = loaded.measurement.verdicts[ruleId]?.verdict;
        const explains = verdict !== undefined && isExplainedByModel(verdict);
        const model = explains ? models.find(({ seenIn }) => seenIn.includes(adapter)) : undefined;
        return [
          adapter,
          <SystemEvidence
            key={adapter}
            ruleId={ruleId}
            loaded={loaded}
            entry={entry}
            model={model}
          />,
        ];
      }),
    );
  };
}

/** "Replay in playground" for each of the reference's scenarios: its recorded keys, live. */
export function playgroundActionsOf(reference: Measurement | undefined) {
  return Object.fromEntries(
    (reference?.scenarios ?? []).flatMap((scenario) => {
      const keys = playgroundKeys(scenario);
      return keys ? [[scenario.id, <ReplayInPlayground key={scenario.id} keys={keys} />]] : [];
    }),
  );
}
