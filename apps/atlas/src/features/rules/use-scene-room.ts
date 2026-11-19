'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Tells the column how tall the recording at its top is, as `--scene-room` on the recording's
 * parent. The recording may stay stuck at the top of the window while the list under it scrolls
 * (depth.module.css); a row that takes keyboard focus must then be brought to rest below it, not
 * under it, and the stylesheet needs this height to say so (WCAG 2.4.11, Focus Not Obscured;
 * design review 2026-11-16). The height differs by system and by width, so it is measured.
 */
export function useSceneRoom(scene: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = scene.current;
    const column = element?.parentElement;
    if (!element || !column) return undefined;
    const observer = new ResizeObserver(() => {
      column.style.setProperty('--scene-room', `${element.offsetHeight}px`);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [scene]);
}
