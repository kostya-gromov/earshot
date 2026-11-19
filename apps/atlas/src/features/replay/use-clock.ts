'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useIsSeen } from './use-is-seen';

const startMs = 900;
const holdMs = 2400;

interface ClockOptions {
  /** Steps in one pass; the clock runs -1 (start) .. steps - 1, then starts over. */
  steps: number;
  root: RefObject<HTMLElement | null>;
  stepMs?: number;
}

/**
 * One clock for every lane of a replay. It plays only while seen; under reduced motion it starts
 * paused on the last step (apps/atlas/CLAUDE.md). A pause control is always offered (WCAG 2.2.2).
 */
export function useClock({ steps, root, stepMs = 1200 }: ClockOptions) {
  const [index, setIndex] = useState(steps - 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const decided = useRef(false);
  const isSeen = useIsSeen(root);

  useEffect(() => {
    if (decided.current) return;
    decided.current = true;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setIndex(-1);
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    if (!isPlaying || !isSeen || steps === 0) return undefined;
    const delay = index === -1 ? startMs : index === steps - 1 ? holdMs : stepMs;
    const timer = setTimeout(() => setIndex((i) => (i >= steps - 1 ? -1 : i + 1)), delay);
    return () => clearTimeout(timer);
  }, [index, isPlaying, isSeen, steps, stepMs]);

  const toggle = useCallback(() => setIsPlaying((playing) => !playing), []);
  /** Starts the pass again, for a reader who picked other keys. */
  const restart = useCallback(() => {
    const isReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setIndex(isReduced ? steps - 1 : -1);
    setIsPlaying(!isReduced);
  }, [steps]);
  return { index, isPlaying, toggle, restart };
}
