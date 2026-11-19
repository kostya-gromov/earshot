'use client';

import { useEffect, useRef } from 'react';
import { livePatterns } from './live-patterns';

interface LiveReferenceProps {
  patternId: string;
  /** The reference markup, read at build time from the reference's own .html file. */
  markup: string;
  moduleUrl: string;
  /** Called with the field's root once it is live; may return a cleanup. */
  onMount?: (root: HTMLElement) => (() => void) | void;
}

/**
 * Mounts the framework-free reference into a node React never renders into (ADR 0001), so the
 * code on the page is the code that runs. Remounting (Reset, Strict Mode) starts from markup.
 */
export function LiveReference(props: LiveReferenceProps) {
  const { patternId, markup, moduleUrl, onMount } = props;
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const live = livePatterns[patternId];
    if (!mount || !live) return;
    let stop: (() => void) | undefined;
    let detach: (() => void) | void;
    let isCancelled = false;
    mount.innerHTML = markup;
    void import(/* webpackIgnore: true */ /* turbopackIgnore: true */ moduleUrl).then(
      (module: unknown) => {
        const root = mount.querySelector<HTMLElement>(live.rootSelector);
        if (isCancelled || !root) return;
        stop = live.start(module, root);
        detach = onMount?.(root);
        root.dataset.ready = 'true';
      },
    );
    return () => {
      isCancelled = true;
      detach?.();
      stop?.();
      mount.innerHTML = '';
    };
  }, [patternId, markup, moduleUrl, onMount]);

  // The markup is in the HTML from the start, so the field holds its place before the module
  // loads (no layout shift). React never updates it again; the effect owns it from then on.
  return (
    <div
      ref={mountRef}
      data-testid="live-reference"
      dangerouslySetInnerHTML={{ __html: markup }}
      suppressHydrationWarning
    />
  );
}
