import type { ReactNode } from 'react';
import styles from './badge.module.css';

/**
 * Tones are the meaning colours (apps/atlas/CLAUDE.md): match, loss (something was lost, such as focus),
 * differ (behaves differently from the rule: neutral, because differing is not failing), and
 * neutral for everything else.
 */
export type BadgeTone = 'match' | 'loss' | 'differ' | 'neutral';

interface BadgeProps {
  tone: BadgeTone;
  children: ReactNode;
  /** Only the marker shows, in a small round tile; the label stays as the accessible text. */
  isMarkOnly?: boolean;
  /**
   * A different shape within a tone, for two states that share a colour but not a meaning:
   * "dash" for something that does not apply, beside the ring of something not decided.
   */
  mark?: 'dash';
}

/**
 * A short status label. The marker's shape differs per tone (dot, cross, ring), so the meaning
 * survives without colour (WCAG 1.4.1) and in forced colours.
 */
export function Badge({ tone, children, isMarkOnly = false, mark }: BadgeProps) {
  return (
    <span
      className={styles.badge}
      data-tone={tone}
      data-mark={mark}
      data-mark-only={isMarkOnly || undefined}
    >
      <span className={styles.marker} aria-hidden="true" />
      {isMarkOnly ? <span className="visually-hidden">{children}</span> : children}
    </span>
  );
}
