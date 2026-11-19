import type { VerdictResult } from '@earshot/contracts';

export interface JudgedShare {
  judged: number;
  total: number;
}

/**
 * How many of a verdict's scenarios could judge the rule, when some could not: a follows or a
 * differs that rests on part of the rule (ADR 0004, amended 2026-11-11). Undefined when every
 * scenario judged, when nothing was judged, or for files without a recorded basis.
 */
interface VerdictWithBasis {
  verdict: VerdictResult['verdict'];
  basis?: readonly { verdict: VerdictResult['verdict'] }[] | undefined;
}

export function judgedShare({ verdict, basis = [] }: VerdictWithBasis): JudgedShare | undefined {
  if (verdict !== 'follows' && verdict !== 'differs') return undefined;
  const judged = basis.filter(
    (entry) => entry.verdict === 'follows' || entry.verdict === 'differs',
  );
  if (judged.length === basis.length) return undefined;
  return { judged: judged.length, total: basis.length };
}

/** "Judged on 1 of 3 scenarios": said next to a verdict that rests on part of the rule. */
export const describeShare = ({ judged, total }: JudgedShare): string =>
  `Judged on ${judged} of ${total} scenarios`;
