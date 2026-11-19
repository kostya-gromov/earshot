import type { MenuSnapshot } from './menu-tour';

/** The menu item that holds DOM focus inside the reference, if one does. */
function focusedItem(root: HTMLElement): Element | null {
  const focused = document.activeElement;
  const isItem = focused?.getAttribute('role') === 'menuitem' && root.contains(focused);
  return isItem ? focused : null;
}

/** The line beside the reference that its items' action writes (live-patterns.ts). */
const lastActionOf = (root: HTMLElement): string =>
  root.parentElement?.querySelector('[data-last-action]')?.textContent ?? '';

/** Reads the mounted reference menu button: focus, whether the menu is shown, the focused item. */
export function snapshotMenu(root: HTMLElement): MenuSnapshot {
  const button = root.querySelector('[aria-haspopup="menu"]');
  const item = focusedItem(root);
  return {
    focusOnButton: button !== null && document.activeElement === button,
    isOpen: button?.getAttribute('aria-expanded') === 'true',
    active: item?.textContent ?? null,
    activeIsDisabled: item?.getAttribute('aria-disabled') === 'true',
    lastAction: lastActionOf(root),
  };
}
