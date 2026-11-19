'use client';

import { useLayoutEffect, useRef, useState } from 'react';

export interface Ring {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * One ring travels to the part named `key` (a `data-part` inside the box, or the box itself for
 * "page"), measuring again whenever anything in the box resizes, so it follows a collapsing chip.
 */
export function useRing(key: string) {
  const box = useRef<HTMLDivElement>(null);
  const [ring, setRing] = useState<Ring | undefined>(undefined);
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return undefined;
    const measure = () => {
      const target =
        key === 'page' ? element : element.querySelector<HTMLElement>(`[data-part="${key}"]`);
      if (!target) return;
      const origin = element.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      setRing({
        x: rect.left - origin.left,
        y: rect.top - origin.top,
        width: rect.width,
        height: rect.height,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    element.querySelectorAll('[data-part]').forEach((part) => observer.observe(part));
    observer.observe(element);
    return () => observer.disconnect();
  }, [key]);
  return { box, ring };
}
