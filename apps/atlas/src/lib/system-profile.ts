import type { Measurement, Pattern, TargetEntry, Verdict } from '@earshot/contracts';
import { isReference, notCountedReasons } from './agreement';

/** One rule as this system did on it. */
export interface SystemRule {
  id: string;
  title: string;
  isFromStandards: boolean;
  verdict: Verdict;
  summary: string;
  /** Where the pattern writes why this system differs: another model, or an alternative. */
  explainedBy: 'model' | 'alternative' | undefined;
}

export type SystemPattern =
  | {
      kind: 'measured';
      pattern: Pattern;
      component: string | undefined;
      version: string;
      measuredAt: string;
      /** Why the measurement is shown and not counted; undefined when it counts. */
      notCounted: string | undefined;
      rules: readonly SystemRule[];
    }
  | { kind: 'not-measured'; pattern: Pattern; reason: string };

export interface PatternSource {
  pattern: Pattern;
  measurements: readonly Measurement[];
  targets: readonly TargetEntry[];
}

export interface SystemId {
  /** The adapter id, the page's address: /systems/react-aria/. */
  id: string;
  name: string;
}

/** Differences first, then what could not be judged, then what follows. */
const order: Readonly<Record<Verdict, number>> = {
  differs: 0,
  inconclusive: 1,
  'not-applicable': 2,
  follows: 3,
};

function explainedBy(pattern: Pattern, ruleId: string, adapter: string): SystemRule['explainedBy'] {
  for (const entry of pattern.tradeOffs) {
    if (
      entry.kind === 'model' &&
      entry.ruleIds.includes(ruleId) &&
      entry.seenIn.includes(adapter)
    ) {
      return 'model';
    }
    if (
      entry.kind === 'alternative' &&
      entry.ruleId === ruleId &&
      entry.seenIn?.includes(adapter)
    ) {
      return 'alternative';
    }
  }
  return undefined;
}

function rulesOf(pattern: Pattern, measurement: Measurement): SystemRule[] {
  return pattern.rules
    .flatMap((rule) => {
      const verdict = measurement.verdicts[rule.id];
      if (!verdict) return [];
      return [
        {
          id: rule.id,
          title: rule.title,
          isFromStandards: rule.level === 'rule',
          verdict: verdict.verdict,
          summary: verdict.summary,
          explainedBy: explainedBy(pattern, rule.id, measurement.target.adapter),
        },
      ];
    })
    .toSorted((a, b) => order[a.verdict] - order[b.verdict]);
}

/** Why a system has no measurement for a pattern, where its entry says so. */
function notMeasuredReason(entry: TargetEntry | undefined): string | undefined {
  if (entry?.status === 'not-applicable') return entry.reason;
  return entry?.status === 'planned' ? entry.reason : undefined;
}

const versionOf = ({ target }: Measurement): string =>
  'version' in target.systemVersion ? target.systemVersion.version : 'unknown';

/** What one pattern says about one system: its measurement, why it is not measured, or nothing. */
function patternFor(source: PatternSource, system: SystemId): SystemPattern | undefined {
  const { pattern, measurements, targets } = source;
  const { id: adapter, name } = system;
  // Entries not measured may name no adapter (GitHub Primer for tabs): found by the system's name.
  const entry =
    targets.find((target) => 'adapter' in target && target.adapter === adapter) ??
    targets.find((target) => target.system === name);
  const measurement = measurements.find((m) => m.target.adapter === adapter && !isReference(m));
  if (measurement?.provenance.status === 'measured') {
    return {
      kind: 'measured',
      pattern,
      component: entry?.component,
      version: versionOf(measurement),
      measuredAt: measurement.provenance.measuredAt,
      notCounted: notCountedReasons(targets).get(adapter),
      rules: rulesOf(pattern, measurement),
    };
  }
  const reason = notMeasuredReason(entry);
  return reason ? { kind: 'not-measured', pattern, reason } : undefined;
}

/** Every pattern's word on one system, in the patterns' order. */
export const systemPatterns = (
  sources: readonly PatternSource[],
  system: SystemId,
): SystemPattern[] => sources.flatMap((source) => patternFor(source, system) ?? []);

/**
 * Every system with a page: measured for at least one pattern under its own adapter, the
 * reference and variants (another setup of a system) left out.
 */
export function systemIds(sources: readonly PatternSource[]): SystemId[] {
  const seen = new Map<string, string>();
  for (const { measurements } of sources) {
    for (const m of measurements) {
      if (m.provenance.status === 'measured' && !isReference(m)) {
        seen.set(m.target.adapter, m.target.system);
      }
    }
  }
  return [...seen].map(([id, name]) => ({ id, name }));
}
