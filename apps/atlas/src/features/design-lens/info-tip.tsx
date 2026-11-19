'use client';

import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import styles from './design-lens.module.css';

interface InfoTipProps {
  /** What the button is about, for its name: "About copying for Figma". */
  label: string;
  children: ReactNode;
}

/**
 * A note behind an "i": shown while the button is under the pointer or has focus, and described
 * to a screen reader as the button's description. It stays while the pointer is over the note
 * itself and goes on Escape without moving focus (WCAG 1.4.13, content on hover or focus).
 */
export function InfoTip({ label, children }: InfoTipProps) {
  const id = useId();
  const [isShown, setIsShown] = useState(false);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') setIsShown(false);
  };
  return (
    <span
      className={styles.tip}
      onMouseEnter={() => setIsShown(true)}
      onMouseLeave={() => setIsShown(false)}
    >
      <button
        type="button"
        className={styles.tipButton}
        aria-label={label}
        aria-describedby={id}
        onFocus={() => setIsShown(true)}
        onBlur={() => setIsShown(false)}
        onClick={() => setIsShown(true)}
        onKeyDown={onKeyDown}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <circle cx="8" cy="8" r="6.25" />
          <path d="M8 7.25v3.5M8 5.1v.1" />
        </svg>
      </button>
      {/* In the page while hidden, so the description is there before the note is shown. */}
      <span id={id} role="tooltip" className={styles.tipNote} data-shown={isShown || undefined}>
        {children}
      </span>
    </span>
  );
}
