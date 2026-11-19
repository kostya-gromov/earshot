import type { ReactNode } from 'react';
import styles from './speech-line.module.css';

/**
 * Where a spoken line comes from: the screen reader describing where focus landed, or a live
 * region message. Both are heard; colour separates the page's own message from the focus echo.
 */
export type SpeechSource = 'focus' | 'announcement';

export type SpeechSize = 'lg' | 'md' | 'sm';

interface SpeechLineProps {
  source: SpeechSource;
  size?: SpeechSize;
  /** Older lines in a transcript recede. */
  isPast?: boolean;
  children: ReactNode;
}

/** One line of the semantic model, in serif italic so what is heard reads apart from what is seen. */
export function SpeechLine({ source, size = 'md', isPast = false, children }: SpeechLineProps) {
  return (
    <q
      className={styles.line}
      data-source={source}
      data-size={size}
      data-past={isPast || undefined}
    >
      {children}
    </q>
  );
}
