'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { useIsSeen } from '@/features/replay';
import { summarizeBackspace } from '@/lib/backspace-summary';
import { replayStateAt } from '@/lib/replay';
import type { ExampleLane } from './example-lanes';

/** Long enough to see the starting state first, short enough to happen before the reader moves on. */
const firstPressMs = 900;
/** How long "Press again" shows the starting state before the press. */
const startHoldMs = 400;

/**
 * The example's one press. It plays once by itself the first time it is seen, so the opening
 * shows the behaviour instead of a waiting state; then it waits for the reader, keeps the result,
 * and starts over on request. A screen reader hears the summary only after the reader's own press:
 * a sentence arriving unprompted on load would interrupt them.
 */
export function useExamplePress(
  lanes: readonly ExampleLane[],
  root: RefObject<HTMLElement | null>,
) {
  const [isPressed, setIsPressed] = useState(false);
  const [isAnnounced, setIsAnnounced] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const hasActed = useRef(false);
  // A quarter in view: at half it never played in the first view at 1440, and the fold ended on
  // rows waiting for a key (design review 2026-11-25b); the opening now leaves two rows in it.
  const isSeen = useIsSeen(root, 0.25);

  useEffect(() => {
    if (!isSeen || hasActed.current) return undefined;
    // Under reduced motion the result is shown at once; the change itself is instant there.
    const isReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(
      () => {
        hasActed.current = true;
        setHasPlayed(true);
        setIsPressed(true);
      },
      isReduced ? 0 : firstPressMs,
    );
    return () => clearTimeout(timer);
  }, [isSeen]);

  const replay = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(replay.current), []);

  /**
   * Plays the press. Once it has played, one click shows it again: back to the starting state,
   * held long enough to be seen, then the press (design review 2026-11-12: "Start over" took two
   * actions to see the behaviour again).
   */
  const press = () => {
    hasActed.current = true;
    clearTimeout(replay.current);
    const play = () => {
      setIsAnnounced(true);
      setHasPlayed(true);
      setIsPressed(true);
    };
    if (!isPressed) return play();
    setIsAnnounced(false);
    setIsPressed(false);
    // Held under reduced motion as well: with no hold the two states swapped within a frame or
    // two, and the button looked like it did nothing.
    replay.current = setTimeout(play, startHoldMs);
  };

  // The real key works too while the button has focus: the example is about that key.
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Backspace') return;
    event.preventDefault();
    press();
  };

  const message =
    isPressed && isAnnounced
      ? summarizeBackspace(lanes.map((lane) => replayStateAt(lane.steps, 0).step))
      : '';
  return { isPressed, hasPlayed, message, press, onKeyDown };
}
