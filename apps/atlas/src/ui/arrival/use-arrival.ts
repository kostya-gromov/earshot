'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Marks an element `data-state="waiting"` until it is first scrolled into view, then "seen", so
 * its styles can bring its parts in once, in order. Without script, under reduced motion, or
 * when the element is already on screen at load, the state is never set: nothing is hidden and
 * nothing moves. Styles must animate only from the state.
 */
export function useArrival(
  ref: RefObject<HTMLElement | null>,
  /** Called once when the element is first seen. Pass a stable function. */
  onSeen?: (element: HTMLElement) => void,
): void {
  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (element.dataset.state === 'seen') return undefined;
    // Any part on screen at load counts: a frame half in view that stayed empty until the
    // reader scrolled read as a failed load (design review 2026-11-23).
    if (element.getBoundingClientRect().top < window.innerHeight) return undefined;
    // Set on the element, not in React state: nothing re-renders, the styles do the rest.
    element.dataset.state = 'waiting';
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        element.dataset.state = 'seen';
        onSeen?.(element);
        observer.disconnect();
      },
      { rootMargin: '0px 0px -15% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, onSeen]);
}
