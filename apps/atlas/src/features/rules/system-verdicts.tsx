'use client';

import { VerdictBadge } from '@/features/evidence';
import type { ReplayLane } from '@/lib/replay';
import { describeShare, judgedShare } from '@/lib/verdict-basis';
import styles from './depth.module.css';

interface SystemVerdictsProps {
  ruleId: string;
  lanes: readonly ReplayLane[];
  current: string;
  onSelect: (id: string) => void;
}

/** Every system's verdict for this rule; each is a button that shows that system's recordings. */
export function SystemVerdicts({ ruleId, lanes, current, onSelect }: SystemVerdictsProps) {
  return (
    <div className={styles.verdicts} role="group" aria-label="Whose recording">
      {lanes.map((option) => {
        const verdict = option.verdicts[ruleId];
        const share = verdict && judgedShare(verdict);
        return (
          <button
            key={option.id}
            type="button"
            data-system={option.id}
            aria-pressed={option.id === current}
            onClick={() => onSelect(option.id)}
          >
            {verdict && <VerdictBadge verdict={verdict.verdict} isMarkOnly />}
            <span>
              <b>{option.name}</b>
              {verdict?.summary}
              {share && <em className={styles.decided}>{describeShare(share)}</em>}
              {option.uncounted && (
                <em className={styles.decided}>Not counted: {option.uncounted}</em>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
