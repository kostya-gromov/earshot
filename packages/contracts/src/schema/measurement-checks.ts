import type { Measurement } from './measurement.ts';
import type { Pattern } from './pattern.ts';

/**
 * Checks a parsed measurement against its pattern's rules. Separate from the schema because
 * it needs the pattern itself. Returns human-readable problems; an empty list means valid.
 */
export function checkMeasurementAgainstPattern(m: Measurement, pattern: Pattern): string[] {
  const ruleIds = new Set(pattern.rules.map((r) => r.id));

  const unknownVerdicts = Object.keys(m.verdicts)
    .filter((id) => !ruleIds.has(id))
    .map((id) => `verdicts.${id}: not a rule of ${pattern.id}`);

  const unknownScenarioRules = m.scenarios.flatMap((s, i) =>
    s.rules
      .filter((id) => !ruleIds.has(id))
      .map((id) => `scenarios.${i}.rules: unknown rule "${id}"`),
  );

  // Only measured records must judge every rule; illustrative samples may be partial.
  const missingVerdicts =
    m.provenance.status === 'measured'
      ? [...ruleIds]
          .filter((id) => !(id in m.verdicts))
          .map((id) => `verdicts: missing verdict for rule "${id}"`)
      : [];

  return [...unknownVerdicts, ...unknownScenarioRules, ...missingVerdicts];
}
