'use client';

import { useEffect } from 'react';

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
