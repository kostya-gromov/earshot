import type { Measurement, Pattern, TargetEntry } from '@earshot/contracts';
import type { LoadedMeasurement } from '@/data/measurements';
import { isReference, notCountedReasons } from '@/lib/agreement';
import { differenceSplit, ruleFindings, type RuleFinding } from '@/lib/pattern-findings';
import { Composition, Differences } from './opening-parts';
import styles from './pattern-opening.module.css';

const names = new Intl.ListFormat('en-GB', { type: 'conjunction' });

interface PatternOpeningProps {
  pattern: Pattern;
  measurements: readonly LoadedMeasurement[];
  targets: readonly TargetEntry[];
}

/** Which kind of rule the differences are on: most are often the site's own recommendations. */
function splitWords(findings: readonly RuleFinding[]): string | undefined {
  const { differences: all, fromStandards } = differenceSplit(findings);
  if (all === 0) return undefined;
  if (all === 1) {
    return fromStandards === 1
      ? 'The one difference is on a rule from the standards.'
      : 'The one difference is on an Earshot recommendation.';
  }
  if (fromStandards === 0) return `All ${all} differences are on Earshot recommendations.`;
  if (fromStandards === all) return `All ${all} differences are on rules from the standards.`;
  return `${fromStandards} of the ${all} differences are on rules from the standards; ${all - fromStandards} on Earshot recommendations.`;
}

/** Measured and not counted, said where the counts are, each with its reason. */
function NotCounted({ measurements, targets }: Omit<PatternOpeningProps, 'pattern'>) {
  const reasons = notCountedReasons(targets);
  const componentOf = (adapter: string) =>
    targets.find((entry) => entry.status === 'measured' && entry.adapter === adapter)?.component;
  // What was measured is named with why it is not counted: "TokenField is not measured yet"
  // left a maintainer asking what was (first-visit review, 2026-11-25).
  const setAside = measurements
    .filter(({ measurement }) => reasons.has(measurement.target.adapter))
    .map(({ measurement }) => {
      const { adapter, system } = measurement.target;
      const component = componentOf(adapter);
      return `${system}${component ? `, measured as ${component}` : ''}: ${reasons.get(adapter) ?? ''}`;
    });
  const variants = variantWords(measurements, reasons);
  if (setAside.length === 0 && variants === undefined) return null;
  return (
    <p className={styles.quiet}>
      {setAside.length > 0 && `Not counted: ${setAside.join('; ')}. `}
      {variants}
    </p>
  );
}

/**
 * The line for what is shown beside a counted system or the reference. A system's second setup
 * is named, its difference left to its evidence in the rule panel (design review 2026-11-25b:
 * three grey lines of parentheticals). A variant of the reference is no setup of a system, so it
 * is said by its reason ("The browser’s own select, measured as evidence for …"): "a second
 * setup of Reference" said nothing true of it (2026-11-25).
 */
function variantWords(
  measurements: readonly LoadedMeasurement[],
  reasons: ReadonlyMap<string, string>,
): string | undefined {
  const ofSystems: string[] = [];
  const ofReference: string[] = [];
  for (const { measurement: parent, variants = [] } of measurements) {
    for (const { measurement } of variants) {
      const reason = reasons.get(measurement.target.adapter);
      if (isReference(parent) && reason) ofReference.push(reason);
      else ofSystems.push(measurement.target.system);
    }
  }
  const lines = [
    ...(ofSystems.length > 0
      ? [`a second setup of ${names.format(ofSystems)}, described with its evidence`]
      : []),
    ...ofReference.map((reason) => reason.charAt(0).toLowerCase() + reason.slice(1)),
  ];
  return lines.length > 0 ? `Also shown, not counted: ${lines.join('; ')}.` : undefined;
}

const isCounted = (reasons: ReadonlyMap<string, string>) => (m: Measurement) =>
  m.provenance.status === 'measured' && !isReference(m) && !reasons.has(m.target.adapter);

/**
 * What the measurements show, before the reference and the rules: what was measured, where the
 * counted systems differ, whether that is from the standards or from Earshot's recommendations,
 * and what was measured but not counted. Every line is counted from typed verdicts, rule levels
 * and targets.yaml. Placed between the description and the rules (2026-11-24); its lines
 * from the content audit of 2026-11-25, after a first-visit review found the pages never said
 * how the systems compare.
 */
export function PatternOpening({ pattern, measurements, targets }: PatternOpeningProps) {
  const reasons = notCountedReasons(targets);
  const all = measurements.map(({ measurement }) => measurement);
  const counted = all.filter(isCounted(reasons));
  if (counted.length === 0) return null;
  const findings = ruleFindings({
    pattern,
    measurements: all,
    notCounted: new Set(reasons.keys()),
  });
  const split = splitWords(findings);
  return (
    <section className={styles.opening} aria-labelledby="opening-title">
      <h2 id="opening-title" className={styles.title}>
        What the measurements show
      </h2>
      <div className={styles.body}>
        <Composition pattern={pattern} systems={counted.length} {...(split && { split })} />
        <Differences findings={findings} />
        <NotCounted measurements={measurements} targets={targets} />
      </div>
    </section>
  );
}
