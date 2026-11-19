'use client';

import { useEffect, useSyncExternalStore } from 'react';

const isApplePlatform = (): boolean => /Mac|iPhone|iPad/.test(navigator.userAgent);
const noSubscription = () => () => {};

/** Whether to show ⌘ or Ctrl. The server renders Ctrl; the client corrects it after hydration. */
export function useIsApple(): boolean {
  return useSyncExternalStore(noSubscription, isApplePlatform, () => false);
}

/** Runs `onTrigger` for ⌘K on Apple platforms and Ctrl+K elsewhere, anywhere on the page. */
export function useShortcut(key: string, onTrigger: () => void): void {
  useEffect(() => {
    function handle(event: globalThis.KeyboardEvent) {
      const hasModifier = event.metaKey || event.ctrlKey;
      if (!hasModifier || event.altKey || event.key.toLowerCase() !== key) return;
      event.preventDefault();
      onTrigger();
    }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [key, onTrigger]);
}
