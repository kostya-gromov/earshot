'use client';

import { useCallback, useState } from 'react';

const scrollBehavior = (): ScrollBehavior =>
  matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

/**
 * The way back from the playground to the control that sent the reader there ("Replay in
 * playground" sits thousands of pixels below it). Scroll and focus return to that control, so a
 * replay is a round trip, not a one-way jump (design review 2026-11-13).
 */
export function useReturnTo() {
  const [from, setFrom] = useState<HTMLElement>();
  const goBack = useCallback(() => {
    setFrom(undefined);
    // Its rule may have been switched away since; then there is nowhere to return to.
    if (!from?.isConnected || from.offsetParent === null) return;
    from.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
    from.focus({ preventScroll: true });
  }, [from]);
  return { canGoBack: from !== undefined, setFrom, goBack };
}
