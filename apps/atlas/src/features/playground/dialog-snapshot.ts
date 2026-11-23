import type { DialogSnapshot } from './dialog-tour';

/** Reads the mounted reference dialog: whether it is open, and where focus is. */
export function snapshotDialog(root: HTMLElement): DialogSnapshot {
  const dialog = root.querySelector('dialog');
  const controls = dialog ? [...dialog.querySelectorAll('input, button')] : [];
  const focused = document.activeElement;
  const place = focused ? controls.indexOf(focused) : -1;
  return {
    isOpen: dialog?.open ?? false,
    onOpener: focused !== null && focused === root.querySelector('[data-dialog-open]'),
    focused: place === -1 ? null : place + 1,
    count: controls.length,
  };
}
