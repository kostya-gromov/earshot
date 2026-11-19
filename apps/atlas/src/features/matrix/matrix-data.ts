import type { Pattern, Verdict } from '@earshot/contracts';
import type { LoadedMeasurement } from '@/data/measurements';
import { isReference } from '@/lib/agreement';
import { measuredOn } from '@/lib/measured-on';
import { modelsFor } from '@/lib/trade-offs';
import { describeShare, judgedShare } from '@/lib/verdict-basis';

export interface MatrixCell {
  verdict: Verdict;
  summary: string;
  /** "Judged on 1 of 3 scenarios", when the verdict rests on part of the rule. */
  share: string | undefined;
  /** A different model explains this verdict (React Aria's separate grid). */
  isModel: boolean;
}

export interface MatrixColumn {
  id: string;
  name: string;
  version: string;
  measuredOn: string;
  rawHref: string;
  /** False for a system shown but never counted; `uncounted` then says why. */
  isCounted: boolean;
  uncounted: string | undefined;
  /** One per rule, in the pattern's order; undefined where the file has no verdict. */
  cells: readonly (MatrixCell | undefined)[];
}

export interface MatrixRow {
  id: string;
  title: string;
  isRecommendation: boolean;
  /** The reference's verdict, told beside the rule rather than as a column. */
  reference: Verdict | undefined;
}

function columnOf(
  pattern: Pattern,
  { measurement, file }: LoadedMeasurement,
  notCounted: ReadonlyMap<string, string>,
): MatrixColumn {
  const { adapter, system, systemVersion } = measurement.target;
  const { provenance } = measurement;
  return {
    id: adapter,
    name: system,
    version: 'reason' in systemVersion ? 'version unknown' : systemVersion.version,
    measuredOn: provenance.status === 'measured' ? measuredOn(provenance.measuredAt) : '',
    rawHref: `/${file}`,
    isCounted: !notCounted.has(adapter),
    uncounted: notCounted.get(adapter),
    cells: pattern.rules.map((rule) => {
      const result = measurement.verdicts[rule.id];
      if (!result) return undefined;
      const share = judgedShare(result);
      return {
        verdict: result.verdict,
        summary: result.summary,
        share: share && describeShare(share),
        isModel:
          modelsFor(pattern, { ruleId: rule.id, adapter, verdict: result.verdict }).length > 0,
      };
    }),
  };
}

/** Every rule against every measured system, as plain data for the matrix. */
export function matrixOf(
  pattern: Pattern,
  measured: readonly LoadedMeasurement[],
  notCounted: ReadonlyMap<string, string>,
): { rows: MatrixRow[]; columns: MatrixColumn[] } {
  const reference = measured.find(({ measurement }) => isReference(measurement))?.measurement;
  const systems = measured
    .filter(({ measurement }) => !isReference(measurement))
    // Counted systems first; a deprecated one closes the row.
    .toSorted(
      (a, b) =>
        Number(notCounted.has(a.measurement.target.adapter)) -
        Number(notCounted.has(b.measurement.target.adapter)),
    );
  return {
    rows: pattern.rules.map(({ id, title, level }) => ({
      id,
      title,
      isRecommendation: level === 'recommendation',
      reference: reference?.verdicts[id]?.verdict,
    })),
    columns: systems.map((loaded) => columnOf(pattern, loaded, notCounted)),
  };
}
