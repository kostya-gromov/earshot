'use client';

import { useCallback, useRef, type RefObject } from 'react';
import { afterSettle } from './field-snapshot';
import { createKeyObserver, type KeyObserver } from './key-observer';
import { useTourActions } from './tour-context';

/**
 * Feeds real key presses to the tour: lights the rule and records the field before and after.
 * Call it from a capture-phase listener: the reference's own handlers run later and move focus.
 */
export function useTourKeys(rootRef: RefObject<HTMLElement | null>) {
  const tour = useTourActions();
  const observerRef = useRef<KeyObserver<unknown> | undefined>(undefined);
  return useCallback(
    (key: string) => {
      const root = rootRef.current;
      if (!root || !tour) return;
      tour.light(key, root);
      observerRef.current ??= createKeyObserver(tour.observe);
      const observer = observerRef.current;
      const id = observer.keyDown(key, tour.snapshot(root));
      void afterSettle().then(() => observer.settle(id, tour.snapshot(root)));
    },
    [rootRef, tour],
  );
}
