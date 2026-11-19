'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A panel shown by its button (APG disclosure): the button says whether it is expanded, and the
 * panel closes on Escape, with focus back on the button, on a press outside it, and when focus
 * leaves it. Not a dialog: the page under it stays in reach.
 */
export function useDisclosure() {
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const isOutside = (target: EventTarget | null) =>
      target instanceof Node && !root.current?.contains(target);
    const onPress = (event: PointerEvent) => {
      if (isOutside(event.target)) setIsOpen(false);
    };
    const onFocus = (event: FocusEvent) => {
      if (isOutside(event.target)) setIsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      button.current?.focus();
    };
    document.addEventListener('pointerdown', onPress);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPress);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  return {
    root,
    button,
    isOpen,
    toggle: () => setIsOpen((was) => !was),
    close: () => setIsOpen(false),
  };
}
