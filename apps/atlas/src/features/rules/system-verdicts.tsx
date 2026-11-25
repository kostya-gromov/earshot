'use client';

import { VerdictBadge } from '@/features/evidence';
import type { LaneVerdict } from '@/lib/lane-verdict';
import type { ReplayLane } from '@/lib/replay';
import { describeShare, judgedShare } from '@/lib/verdict-basis';
import styles from './depth.module.css';

interface SystemVerdictsProps {
  ruleId: string;
  lanes: readonly ReplayLane[];
  current: string;
  onSelect: (id: string) => void;
}

/** The engine's sentence for the scenario that decided a difference, where it wrote one. */
const reasonOf = (verdict: LaneVerdict): string | undefined =>
  verdict.basis.find((entry) => entry.verdict === 'differs' && entry.reason)?.reason;

interface SystemTextProps {
  name: string;
  verdict: LaneVerdict | undefined;
  isCurrent: boolean;
  uncounted: string | undefined;
}

/** A system's name, its outcome, and what qualifies it: a share, the engine's reason, not counted. */
function SystemText({ name, verdict, isCurrent, uncounted }: SystemTextProps) {
  const share = verdict && judgedShare(verdict);
  // What was read, in the engine's words ("not reported as modal in the accessibility tree"),
  // for the chosen system only: under every system it repeated the summary and made the rows
  // uneven (design review 2026-11-25).
  const reason = isCurrent && verdict?.verdict === 'differs' ? reasonOf(verdict) : undefined;
  return (
    <span>
      <b>{name}</b>
      {verdict?.summary}
      {share && <em className={styles.decided}>{describeShare(share)}</em>}
      {reason && <em className={styles.decided}>{reason}</em>}
      {uncounted && <em className={styles.decided}>Not counted: {uncounted}</em>}
    </span>
  );
}

/** Every system's verdict for this rule; each is a button that shows that system's recordings. */
export function SystemVerdicts({ ruleId, lanes, current, onSelect }: SystemVerdictsProps) {
  return (
    <>
      {/* The panel opens on the reference: a maintainer did not know their own system's
          evidence and correction link were one choice away (first-visit review, 2026-11-25).
          Above the group, not in it: inside the phone's scrolling row it became a column of
          one word a line and stretched every card (design review 2026-11-25b). */}
      <p className={styles.verdictsHint}>
        Choose a system to see its recording, raw data and correction link.
      </p>
      <div className={styles.verdicts} role="group" aria-label="Whose recording">
        {lanes.map((option) => {
          const verdict = option.verdicts[ruleId];
          return (
            <button
              key={option.id}
              type="button"
              data-system={option.id}
              aria-pressed={option.id === current}
              data-uncounted={option.uncounted ? true : undefined}
              onClick={() => onSelect(option.id)}
            >
              {verdict && <VerdictBadge verdict={verdict.verdict} isMarkOnly />}
              <SystemText
                name={option.name}
                verdict={verdict}
                isCurrent={option.id === current}
                uncounted={option.uncounted}
              />
            </button>
          );
        })}
      </div>
    </>
  );
}
