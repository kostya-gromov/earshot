import type { Verdict } from '@earshot/contracts';
import { Badge, type BadgeTone } from '@/ui';

const presentation: Readonly<Record<Verdict, { tone: BadgeTone; label: string; mark?: 'dash' }>> = {
  follows: { tone: 'match', label: 'Follows' },
  // Differing is not failing (CLAUDE.md 2.5), so it is not drawn in the loss colour.
  differs: { tone: 'differ', label: 'Differs' },
  // Not a failure: the engine could not judge, and says why next to the badge.
  inconclusive: { tone: 'neutral', label: 'Inconclusive' },
  // Neutral too, but a dash: it does not apply, which is not the same as not judged.
  'not-applicable': { tone: 'neutral', label: 'Not applicable', mark: 'dash' },
};

/** A measured verdict as a badge. Only data with status "measured" may reach this component. */
export function VerdictBadge({
  verdict,
  prefix = '',
  isMarkOnly = false,
}: {
  verdict: Verdict;
  prefix?: string;
  isMarkOnly?: boolean;
}) {
  const { tone, label, mark } = presentation[verdict];
  return (
    <Badge tone={tone} isMarkOnly={isMarkOnly} {...(mark && { mark })}>
      {prefix}
      {label}
    </Badge>
  );
}
