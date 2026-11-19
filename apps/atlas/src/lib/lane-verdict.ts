import type { Measurement, Verdict } from '@earshot/contracts';
import { reasonsByScenario } from './verdict-reasons';

/** One system's verdict on a rule, with each covering scenario's own result. */
export interface LaneVerdict {
  verdict: Verdict;
  summary: string;
  /**
   * Each covering scenario's own result. Empty when the engine reached the verdict before
   * judging any scenario (a precondition), and for files older than engine 0.9.0.
   * `reason` is the scenario's own sentence from the rule's reason; empty when it has none.
   */
  basis: readonly ScenarioBasis[];
}

/** One covering scenario's own result for a rule. */
export interface ScenarioBasis {
  scenario: string;
  verdict: Verdict;
  summary: string;
  reason: string;
  /** How many steps the scenario's evaluator judged, when the file records it. */
  judgedSteps?: number | undefined;
}

/**
 * The scenario that decided a verdict: the first covering scenario whose own result is the
 * rule's. Undefined when no scenario has a result of its own (see `basis`).
 */
export const decidingScenario = ({ verdict, basis }: LaneVerdict): string | undefined =>
  basis.find((entry) => entry.verdict === verdict)?.scenario;

/**
 * Whether one scenario decided the verdict by itself. Not when the rule follows in words of its
 * own that no scenario says: the engine gives those only when every scenario follows (ADR 0004,
 * amendment of 2026-11-17), so "The chips are one Tab stop" rests on both keys, and marking the
 * Tab row as the one that decided it would claim for one key what it takes two to show.
 */
export function hasDecidingScenario(verdict: LaneVerdict): boolean {
  if (decidingScenario(verdict) === undefined) return false;
  if (verdict.verdict !== 'follows') return true;
  return verdict.basis.some(({ summary }) => summary === verdict.summary);
}

/**
 * What a rule's verdict says of one of its scenarios when the file records no result for any:
 * the engine reached the verdict before judging a scenario on its own (a precondition, such as
 * "Separate controls, not one widget"), so the verdict and its words hold for each of them.
 * Only for a verdict that judged nothing. A judged one always records its basis, and a file
 * without one (before engine 0.9.0) does not say which scenario followed and which differed.
 */
export function ruleWideResult(
  verdict: LaneVerdict | undefined,
  scenario: string,
): ScenarioBasis | undefined {
  if (!verdict || verdict.basis.length > 0) return undefined;
  if (verdict.verdict === 'follows' || verdict.verdict === 'differs') return undefined;
  return { scenario, verdict: verdict.verdict, summary: verdict.summary, reason: '' };
}

/** Each scenario's result with its own sentence of the rule's reason (ADR 0004: "[id] text"). */
export function basisWithReasons(
  basis: NonNullable<Measurement['verdicts'][string]['basis']>,
  reason: string,
): LaneVerdict['basis'] {
  const reasons = reasonsByScenario(reason);
  return basis.map((entry) => ({
    ...entry,
    reason: reasons.find(({ scenarioId }) => scenarioId === entry.scenario)?.text ?? '',
  }));
}

/**
 * What a system's replay shows when it has no recording of the scenario the person chose, in
 * words that hold for its verdict: an inconclusive one was decided by no scenario, and a verdict
 * reached before any scenario was judged has none behind it (verdict audit, 2026-11-17).
 */
export function describeFallback(verdict: LaneVerdict | undefined): string {
  if (!verdict || decidingScenario(verdict) === undefined) return 'the rule’s first scenario';
  if (verdict.verdict === 'inconclusive') return 'the scenario that says why it was not judged';
  return 'the scenario that decided its verdict';
}
