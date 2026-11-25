import type { RuleFinding } from './pattern-findings';

export const plural = (count: number, one: string, many: string): string =>
  `${count} ${count === 1 ? one : many}`;

/** "1 of 6 follow": over the systems the rule could be judged on. */
export const followsWords = ({ follows, judged }: RuleFinding): string => `${follows} of ${judged}`;

/** Which kind of rule it is, in the glossary's words. */
export const levelWords = ({ isFromStandards }: RuleFinding): string =>
  isFromStandards ? 'rule from the standards' : 'Earshot recommendation';

/**
 * Where a trade-off is written for the systems that differ, the line says so, so a contested rule
 * on a list is not read as a failure (2026-11-25). Only what is on record: that a
 * trade-off is written, for whom. "Another reading of APG" gave Fluent 2 a position on APG it
 * never took, and "another approach" or "on purpose" claimed an intent no recording shows
 * (verdict audit 2026-11-25).
 */
export function whyWords(finding: RuleFinding): string | undefined {
  const { explained, differ, hasDraft } = finding;
  if (explained === 0) return undefined;
  // A draft is said where it is counted, not only on the pattern page (verdict audit 2026-11-25).
  const draft = hasDraft
    ? differ.length === 1
      ? ', not reviewed yet'
      : ', not all reviewed yet'
    : '';
  const [only] = differ;
  if (differ.length === 1 && only) return `a trade-off is written for ${only.system}${draft}`;
  // Not written for every system that differs: one sentence for some would read as if it spoke
  // for all (2026-11-25), so the line points to the rule instead.
  return explained === differ.length
    ? `a trade-off is written for each system that differs${draft}`
    : undefined;
}
