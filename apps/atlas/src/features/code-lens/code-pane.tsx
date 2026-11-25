'use client';

import { useEffect, useRef } from 'react';
import styles from './code-lens.module.css';

export interface LineMark {
  line: number;
  span: number;
}

/** Highlighted source from the build; a picked note marks its lines and scrolls them into view. */
export function CodePane({ html, mark }: { html: string; mark: LineMark | undefined }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const lines = ref.current?.querySelectorAll<HTMLElement>('.line') ?? [];
    lines.forEach((line, index) => {
      const isMarked =
        mark !== undefined && index + 1 >= mark.line && index + 1 < mark.line + mark.span;
      line.toggleAttribute('data-marked', isMarked);
    });
    const first = ref.current?.querySelector<HTMLElement>('.line[data-marked]');
    const scroller = ref.current?.closest<HTMLElement>('[role="tabpanel"]');
    if (!first || !scroller) return;
    const offset = first.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    scroller.scrollTop += offset - 48;
    // Below 860 px the code sits above the notes, so the page has to come to the lines as well
    // (design review, 2026-11-24): the least scroll that shows them, below the sticky header
    // (html's scroll-padding-top). Where they are already on screen, nothing moves.
    const isReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    first.scrollIntoView({ block: 'nearest', behavior: isReduced ? 'instant' : 'smooth' });
  }, [mark]);
  return <div ref={ref} className={styles.code} dangerouslySetInnerHTML={{ __html: html }} />;
}
