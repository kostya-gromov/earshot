'use client';

import type { KeyboardEvent } from 'react';
import { Keycap } from '../keycap/keycap';
import { useIsApple } from './use-shortcut';
import styles from './command-palette.module.css';

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={styles.searchIcon}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3 3" />
    </svg>
  );
}

/** How the list is moved, in keycaps; shown, not read: the keys are the combobox's own. */
export function PaletteHints() {
  return (
    <p className={styles.hints} aria-hidden="true">
      <span>
        <Keycap keys="ArrowUp" size="sm" />
        <Keycap keys="ArrowDown" size="sm" /> move
      </span>
      <span>
        <Keycap keys="Enter" size="sm" /> open
      </span>
      <span>
        <Keycap keys="Esc" size="sm" /> close
      </span>
    </p>
  );
}

/** The button that opens the palette; it advertises the shortcut to assistive technology too. */
export function PaletteTrigger({ label, onOpen }: { label: string; onOpen: () => void }) {
  const isApple = useIsApple();
  return (
    <button
      type="button"
      className={styles.trigger}
      onClick={onOpen}
      aria-keyshortcuts="Meta+K Control+K"
    >
      <SearchIcon />
      <span className={styles.triggerLabel}>{label}</span>
      <kbd className={styles.shortcut} aria-hidden="true">
        {isApple ? '⌘K' : 'Ctrl K'}
      </kbd>
    </button>
  );
}

interface PaletteInputProps {
  label: string;
  placeholder: string;
  listId: string;
  activeOptionId: string | undefined;
  hasResults: boolean;
  query: string;
  onQuery: (query: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

/** The editable combobox. DOM focus never leaves it; aria-activedescendant names the active option. */
export function PaletteInput(props: PaletteInputProps) {
  return (
    <div className={styles.field}>
      <SearchIcon />
      <input
        className={styles.input}
        role="combobox"
        aria-label={props.label}
        aria-expanded={props.hasResults}
        aria-controls={props.listId}
        aria-autocomplete="list"
        aria-activedescendant={props.activeOptionId}
        autoComplete="off"
        spellCheck={false}
        placeholder={props.placeholder}
        value={props.query}
        onChange={(event) => props.onQuery(event.target.value)}
        onKeyDown={props.onKeyDown}
      />
    </div>
  );
}

interface Results {
  noun: string;
  count: number;
  query: string;
  /** What the listed items say when none of them can be chosen: "in progress". */
  unavailable?: string | undefined;
}

/**
 * What the status region says after each change of the query. When every match is one that
 * cannot be chosen, it says why: Enter then does nothing, and silence would not explain it.
 */
export function resultsMessage({ noun, count, query, unavailable }: Results): string {
  if (count === 0) return `No ${noun} matches “${query.trim()}”.`;
  const found = `${count} ${noun}${count === 1 ? '' : 's'}`;
  return unavailable ? `${found}, ${unavailable}` : found;
}
