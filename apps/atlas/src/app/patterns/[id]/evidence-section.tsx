import type { Measurement, Pattern, TargetEntry } from '@earshot/contracts';
import type { LoadedMeasurement } from '@/data/measurements';
import { RuleTradeOffs } from '@/features/evidence';
import { RuleDepth } from '@/features/rules';
import { deprecatedAdapters, notCountedAdapters, notCountedReasons } from '@/lib/agreement';
import { SectionHead } from '@/ui';
import {
  countedOf,
  playgroundActionsOf,
  replayLanesOf,
  scenariosByRule,
  systemDetails,
} from './evidence-data';
import styles from './page.module.css';

/** The rules section's statement, and which measured systems agreement leaves out. */
function EvidenceHead() {
  return (
    <SectionHead
      id="evidence-title"
      title="The rules."
      quiet="What each asks, where it comes from, and what every system did."
      isSplit
    >
      The engine presses real keys and records focus, the accessibility tree and live region
      announcements. Agreement counts measured design systems only; the reference is the baseline
      and never counts.
    </SectionHead>
  );
}

interface EvidenceSectionProps {
  pattern: Pattern;
  measurements: readonly LoadedMeasurement[];
  targets: readonly TargetEntry[];
  reference: Measurement | undefined;
  people: readonly string[];
}

/** Every rule in depth: what it asks, every system's recording, trade-offs and evidence. */
export function EvidenceSection({
  pattern,
  measurements,
  targets,
  reference,
  people,
}: EvidenceSectionProps) {
  const all = measurements.map(({ measurement }) => measurement);
  const notCounted = notCountedAdapters(targets);
  const { agreement, verdicts } = countedOf(pattern, all, notCounted);
  const reasons = notCountedReasons(targets);
  const measuredLoaded = measurements.filter(
    ({ measurement }) => measurement.provenance.status === 'measured',
  );
  const referenceVerdicts = Object.fromEntries(
    Object.entries(reference?.verdicts ?? {}).map(([id, { verdict }]) => [id, verdict]),
  );
  return (
    <section className={styles.section} aria-labelledby="evidence-title">
      <EvidenceHead />
      <RuleDepth
        pattern={pattern}
        scenariosByRule={scenariosByRule(pattern, reference)}
        lanes={replayLanesOf(
          measuredLoaded,
          { notCounted: reasons, deprecated: deprecatedAdapters(targets) },
          people,
        )}
        people={people}
        agreement={agreement}
        verdicts={verdicts}
        referenceVerdicts={referenceVerdicts}
        tradeOffs={(ruleId) => (
          <RuleTradeOffs pattern={pattern} ruleId={ruleId} measured={measuredLoaded} />
        )}
        details={systemDetails(pattern, measuredLoaded, targets)}
        playgroundActions={playgroundActionsOf(reference)}
      />
    </section>
  );
}
