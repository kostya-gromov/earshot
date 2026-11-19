'use client';

import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react';
import { useArrival } from '@/ui';

// Longer than the longest run in recording-figures.module.css, so a run always ends by itself.
const RUN_MS = 1700;
// When first seen the figures play in turn, each starting as the one before settles, so the
// whole chain is over in about three seconds.
const FIRST_MS = 300;
const TURN_MS = 900;

/** Starts a figure's run unless one is going: a run that started always finishes. */
function play(figure: Element) {
  if (figure.hasAttribute('data-play')) return;
  figure.setAttribute('data-play', '');
  window.setTimeout(() => figure.removeAttribute('data-play'), RUN_MS);
}

function playInTurn(stage: HTMLElement) {
  stage.querySelectorAll('[data-figure]').forEach((figure, index) => {
    window.setTimeout(() => play(figure), FIRST_MS + index * TURN_MS);
  });
}

function replay(event: PointerEvent<HTMLDivElement>) {
  if (!(event.target instanceof Element)) return;
  const figure = event.target.closest('[data-figure]');
  if (figure) play(figure);
}

interface FigureStageProps {
  /** A CSS Modules class: possibly undefined by type, never in practice. */
  className: string | undefined;
  children: ReactNode;
  /**
   * `seen` (default): the figures play in turn once the block is first seen. `in-view`: each
   * plays when most of it is on screen, for a block whose figure is far below its top edge (a
   * run that starts under the fold is a run nobody sees; design review 2026-11-15).
   */
  playWhen?: 'seen' | 'in-view';
}

/**
 * The block holding the recording figures: each plays once, in turn, when the block is first
 * seen, and again when pointed at or tapped. The styles run only with motion allowed.
 */
export function FigureStage({ className, children, playWhen = 'seen' }: FigureStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  useArrival(ref, playWhen === 'seen' ? playInTurn : undefined);
  useEffect(() => {
    const stage = ref.current;
    if (!stage || playWhen !== 'in-view') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const { isIntersecting, target } of entries.filter((entry) => entry.isIntersecting)) {
          if (isIntersecting) play(target);
          observer.unobserve(target);
        }
      },
      { threshold: 0.6 },
    );
    stage.querySelectorAll('[data-figure]').forEach((figure) => observer.observe(figure));
    return () => observer.disconnect();
  }, [playWhen]);
  return (
    <div ref={ref} className={className} onPointerOver={replay}>
      {children}
    </div>
  );
}
