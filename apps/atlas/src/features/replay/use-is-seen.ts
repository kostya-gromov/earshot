'use client';

import { useEffect, useState, type RefObject } from 'react';

/** True while the element is on screen and the tab is visible, so motion never runs unseen. */
export function useIsSeen(ref: RefObject<HTMLElement | null>, threshold = 0.3): boolean {
  const [isSeen, setIsSeen] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    let isOnScreen = false;
    const update = () => setIsSeen(isOnScreen && document.visibilityState === 'visible');
    const observer = new IntersectionObserver(
      ([entry]) => {
        isOnScreen = entry?.isIntersecting ?? false;
        update();
      },
      { threshold },
    );
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, [ref, threshold]);
  return isSeen;
}
