/*
 * Shared data contracts. Every data file is parsed with these schemas at the boundary
 * (CI, site build, engine output), so code past the boundary can trust the types. Where
 * honesty matters, the schema makes the dishonest state unrepresentable rather than relying
 * on reviewers to notice it.
 */
export { NonEmpty, PatternId, RuleId, Slug } from './primitives.ts';
export { Source } from './sources.ts';
export { Pattern, Requirement, Rule, TradeOff } from './pattern.ts';
export {
  AccessibleNode,
  AccessibleStates,
  Action,
  Announcement,
  AxDiff,
  FocusInfo,
  InsertedRegion,
  Run,
  Scenario,
  Settle,
  Step,
  Verdict,
  VerdictResult,
  PopupState,
  TabSetState,
} from './observation.ts';
export { Measurement, Provenance, SystemVersion, Target } from './measurement.ts';
export { checkMeasurementAgainstPattern } from './measurement-checks.ts';
export {
  Observation,
  TargetEntry,
  Targets,
  measurementOf,
  variantEntries,
  type MeasuredEntry,
} from './targets.ts';
