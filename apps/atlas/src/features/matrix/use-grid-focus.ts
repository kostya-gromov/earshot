'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { nextCell, type Cell } from '@/lib/grid-navigation';

/**
 * Roving focus for a grid of links (APG grid): one Tab stop, the arrow keys move between cells.
 * Returns the active cell, a ref setter per cell and the key handler for the grid.
 */
export function useGridFocus(size: { rows: number; columns: number }) {
  const [active, setActive] = useState<Cell>({ row: 0, column: 0 });
  const cells = useRef(new Map<string, HTMLAnchorElement>());
  const key = ({ row, column }: Cell) => `${row}:${column}`;

  const register = (cell: Cell) => (element: HTMLAnchorElement | null) => {
    if (element) cells.current.set(key(cell), element);
    else cells.current.delete(key(cell));
  };

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const next = nextCell(active, { key: event.key, ctrlKey: event.ctrlKey }, size);
    if (!next) return;
    event.preventDefault();
    setActive(next);
    cells.current.get(key(next))?.focus();
  }

  return { active, setActive, register, onKeyDown };
}
