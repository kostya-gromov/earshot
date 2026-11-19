'use client';

import { useRef, type ReactNode } from 'react';
import { useArrival } from './use-arrival';

interface ArrivalProps {
  /** A CSS Modules class: its styles decide what waits and how it comes in. */
  className: string | undefined;
  children: ReactNode;
}

/** A block whose parts arrive once, the first time it is scrolled into view (use-arrival.ts). */
export function Arrival({ className, children }: ArrivalProps) {
  const ref = useRef<HTMLDivElement>(null);
  useArrival(ref);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
