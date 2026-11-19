'use client';

import { useMemo, useState, type KeyboardEvent } from 'react';
import { filterItems, firstEnabled, moveActive, type PaletteItem } from './palette-model';

interface PaletteState {
  query: string;
  results: readonly PaletteItem[];
  active: number | undefined;
  setQuery: (query: string) => void;
  setActive: (index: number) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  reset: () => void;
}

/**
 * Query, results and the active option for the palette's combobox. Typing makes the first
 * selectable result active; arrows move it; Enter chooses it. DOM focus stays in the input.
 */
export function usePalette(
  items: readonly PaletteItem[],
  onChoose: (item: PaletteItem) => void,
): PaletteState {
  const [query, setQueryState] = useState('');
  const results = useMemo(() => filterItems(items, query), [items, query]);
  const [active, setActiveState] = useState<number | undefined>(() => firstEnabled(items));

  function setQuery(next: string) {
    setQueryState(next);
    setActiveState(firstEnabled(filterItems(items, next)));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      const chosen = active === undefined ? undefined : results[active];
      if (!chosen || chosen.isDisabled) return;
      event.preventDefault();
      onChoose(chosen);
      return;
    }
    const next = moveActive(active, event.key, results);
    if (next === undefined) return;
    event.preventDefault();
    setActiveState(next);
  }

  return {
    query,
    results,
    active,
    setQuery,
    setActive: (index) => {
      if (!results[index]?.isDisabled) setActiveState(index);
    },
    handleKeyDown,
    reset: () => setQuery(''),
  };
}
