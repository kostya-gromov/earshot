import type { Verdict } from '@earshot/contracts';
import { VerdictBadge } from '@/features/evidence';
import type { RuleAgreement, SystemVerdict } from '@/lib/agreement';
import type { ModelShare } from '@/lib/trade-offs';
import { describeShare } from '@/lib/verdict-basis';
import styles from './rules.module.css';

// Grouped, so the strip reads at a glance like a short bar: who follows, who differs, who could
// not be judged.
const order: readonly Verdict[] = ['follows', 'differs', 'inconclusive', 'not-applicable'];

const byVerdict = (verdicts: readonly SystemVerdict[]) =>
  order.flatMap((verdict) => verdicts.filter((entry) => entry.verdict === verdict));

/** One mark per counted system; the name and verdict are the mark's accessible text. */
function VerdictStrip({ verdicts }: { verdicts: readonly SystemVerdict[] }) {
  return (
    <ul className={styles.strip} aria-label="Verdict by system">
      {byVerdict(verdicts).map(({ system, verdict }) => (
        <li key={system} title={system}>
          <VerdictBadge verdict={verdict} prefix={`${system}: `} isMarkOnly />
        </li>
      ))}
    </ul>
  );
}

const list = new Intl.ListFormat('en', { type: 'conjunction' });

/** The systems with one verdict, by name: a count alone leaves the reader to find them. */
const namesWith = (verdicts: readonly SystemVerdict[], verdict: Verdict): string =>
  list.format(verdicts.filter((entry) => entry.verdict === verdict).map(({ system }) => system));

/** The systems outside the count, by name: those that could not be judged, those it does not fit. */
function Outside({ verdicts }: { verdicts: readonly SystemVerdict[] }) {
  const unjudged = verdicts.filter(({ verdict }) => verdict === 'inconclusive').length;
  const unfit = verdicts.some(({ verdict }) => verdict === 'not-applicable');
  return (
    <>
      {unjudged > 0 && (
        <span className={styles.agreeExtra}>
          {unjudged} not judged (inconclusive): {namesWith(verdicts, 'inconclusive')}
        </span>
      )}
      {unfit && (
        <span className={styles.agreeExtra}>
          Does not apply to {namesWith(verdicts, 'not-applicable')}
        </span>
      )}
    </>
  );
}

interface CountsProps {
  follows: number;
  judged: number;
  modelShares: readonly ModelShare[];
}

/**
 * "1 of 5 follow", and for each reviewed model "4 of 5 share one other model" (or, for a single
 * system, "1 of 4 uses another model"): the second in the
 * first one's size and ink, because it is the other half of the same fact.
 */
function Counts({ follows, judged, modelShares }: CountsProps) {
  return (
    <>
      <span className={styles.agree}>
        <b>
          {follows} of {judged}
        </b>{' '}
        judged {judged === 1 ? 'system follows' : 'systems follow'}
      </span>
      {modelShares.map(({ count, href }) => (
        <span key={href} className={styles.agree}>
          <b>
            {count} of {judged}
          </b>{' '}
          {/* One system shares with nobody: it uses another model. */}
          {count === 1 ? 'uses' : 'share'}{' '}
          <a href={href}>{count === 1 ? 'another' : 'one other'} model</a>
        </span>
      ))}
    </>
  );
}

interface AgreementProps {
  agreement: RuleAgreement;
  verdicts: readonly SystemVerdict[];
  reference: Verdict | undefined;
  /** One design that explains this rule's difference together with others (modelCountNote). */
  modelNote?: string | undefined;
  /** Reviewed models that judged systems share, each said as a count beside the first. */
  modelShares?: readonly ModelShare[];
}

/**
 * "1 of 3 judged systems follow": the denominator is the systems the rule could be judged on,
 * so an inconclusive verdict never reads as a system that does not follow (verdict audit,
 * 2026-11-09). Measured systems only; the reference never counts. Which systems are left out
 * is said once, in the section's lead, not on every rule.
 */
export function Agreement({
  agreement,
  verdicts,
  reference,
  modelNote,
  modelShares = [],
}: AgreementProps) {
  const { measured, judged, follows } = agreement;
  return (
    <div className={styles.status}>
      <span className={styles.agreeLabel}>Agreement</span>
      {measured === 0 && <span className={styles.agree}>Not measured yet</span>}
      {measured > 0 && <VerdictStrip verdicts={verdicts} />}
      {measured > 0 && judged === 0 && (
        <span className={styles.agree}>No measured system could be judged</span>
      )}
      {judged > 0 && <Counts follows={follows} judged={judged} modelShares={modelShares} />}
      {modelNote && <span className={styles.agreeExtra}>{modelNote}</span>}
      <Outside verdicts={verdicts} />
      {verdicts.flatMap(({ system, share }) =>
        share
          ? [
              <span key={system} className={styles.agreeExtra}>
                {system}: {describeShare(share).toLowerCase()}
              </span>,
            ]
          : [],
      )}
      {reference && (
        <span>
          <VerdictBadge verdict={reference} prefix="Reference: " />
        </span>
      )}
    </div>
  );
}
