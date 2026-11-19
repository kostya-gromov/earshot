'use client';

import { useCallback, useId, useRef } from 'react';
import type { PaletteItem } from './palette-model';
import { PaletteOptions } from './palette-options';
import { PaletteHints, PaletteInput, PaletteTrigger, resultsMessage } from './palette-parts';
import { usePalette } from './use-palette';
import { useShortcut } from './use-shortcut';
import styles from './command-palette.module.css';

interface CommandPaletteProps {
  /** What the palette finds, for example "pattern"; used in the trigger and the input label. */
  noun: string;
  items: readonly PaletteItem[];
  /** Defaults to following the item's link. */
  onChoose?: (item: PaletteItem) => void;
  /** The palette's name, on its button and its window; "Find a pattern" by default. */
  label?: string;
  /** What the empty field says; the name by default. */
  placeholder?: string;
}

const followLink = (item: PaletteItem) => window.location.assign(item.href);
const capitalized = (word: string) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`;

interface PaletteFootProps {
  noun: string;
  results: readonly PaletteItem[];
  query: string;
}

/** Under the list: how it is moved, and what was found, said after each change of the query. */
function PaletteFoot({ noun, results, query }: PaletteFootProps) {
  // Every match is one that cannot be chosen: say what they say about themselves.
  const unavailable = results.every(({ isDisabled }) => isDisabled)
    ? results[0]?.description?.toLowerCase()
    : undefined;
  return (
    <div className={styles.foot}>
      <PaletteHints />
      <p role="status" className={styles.status}>
        {resultsMessage({ noun, count: results.length, query, unavailable })}
      </p>
    </div>
  );
}

/**
 * ⌘K / Ctrl+K palette: an APG combobox with a list popup inside a native modal dialog. The
 * dialog traps focus, makes the page inert, closes on Escape and returns focus on close.
 */
export function CommandPalette(props: CommandPaletteProps) {
  const { noun, items, onChoose = followLink } = props;
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const choose = (item: PaletteItem) => {
    dialogRef.current?.close();
    onChoose(item);
  };
  const palette = usePalette(items, choose);
  const open = useCallback(() => dialogRef.current?.showModal(), []);
  useShortcut('k', open);

  const label = props.label ?? `Find a ${noun}`;
  const listId = `${id}-list`;
  const optionId = (index: number) => `${id}-option-${index}`;
  const count = palette.results.length;

  return (
    <>
      <PaletteTrigger label={label} onOpen={open} />
      <dialog ref={dialogRef} className={styles.dialog} aria-label={label} onClose={palette.reset}>
        <PaletteInput
          label={label}
          placeholder={props.placeholder ?? label}
          listId={listId}
          activeOptionId={palette.active === undefined ? undefined : optionId(palette.active)}
          hasResults={count > 0}
          query={palette.query}
          onQuery={palette.setQuery}
          onKeyDown={palette.handleKeyDown}
        />
        <PaletteOptions
          id={listId}
          label={`${capitalized(noun)}s`}
          results={palette.results}
          active={palette.active}
          optionId={optionId}
          onChoose={choose}
          onHover={palette.setActive}
        />
        <PaletteFoot noun={noun} results={palette.results} query={palette.query} />
      </dialog>
    </>
  );
}
