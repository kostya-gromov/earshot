'use client';

import { useId, useSyncExternalStore } from 'react';
import { applyTheme, storedTheme, type ThemeChoice } from './theme';
import styles from './theme-switch.module.css';

const choices: readonly { value: ThemeChoice; label: string }[] = [
  { value: 'system', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/**
 * The choice lives on <html data-theme>, so every switch on the page reads the same one: the
 * menu and the footer each have one, and choosing in either is shown in both.
 */
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

/** On the server nothing is stored: the page follows the system until it runs. */
const serverChoice = (): ThemeChoice => 'system';

/**
 * Three toggle buttons in a group named by its visible label; the pressed one is the active
 * theme. In the menu and the footer, not the header: a setting chosen once did not need the
 * header's room (design review 2026-11-18, decided 2026-11-19).
 */
export function ThemeSwitch({ size = 'regular' }: { size?: 'regular' | 'compact' }) {
  const labelId = useId();
  const choice = useSyncExternalStore(subscribe, storedTheme, serverChoice);
  return (
    <div className={styles.theme} data-size={size}>
      <span id={labelId} className={styles.label}>
        Theme
      </span>
      <div className={styles.segmented} role="group" aria-labelledby={labelId}>
        {choices.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={choice === value}
            onClick={() => applyTheme(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
