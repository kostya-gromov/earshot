'use client';

import { useEffect, useRef, useState } from 'react';

interface Edges {
  /** Content is scrolled out of view above the top edge. */
  above: boolean;
  /** Content continues below the bottom edge. */
  below: boolean;
}

/**
 * Which edges of a scrolling box hide content, so a fade is drawn only where there is something
 * to scroll to: at the bottom until the end of the list, at the top once it is scrolled.
 */
export function useScrollEdges<Box extends HTMLElement>() {
  const ref = useRef<Box>(null);
  const [edges, setEdges] = useState<Edges>({ above: false, below: false });
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const read = () => {
      const above = box.scrollTop > 1;
      const below = box.scrollTop + box.clientHeight < box.scrollHeight - 1;
      setEdges((now) => (now.above === above && now.below === below ? now : { above, below }));
    };
    read();
    box.addEventListener('scroll', read, { passive: true });
    const resized = new ResizeObserver(read);
    resized.observe(box);
    return () => {
      box.removeEventListener('scroll', read);
      resized.disconnect();
    };
  }, []);
  return { ref, edges };
}
