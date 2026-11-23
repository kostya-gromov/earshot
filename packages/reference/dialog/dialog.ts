/*
 * Reference modal dialog: a window over the page, opened by a button (docs/proposals/dialog.md).
 * Framework-free; the browser runs this file with types removed.
 *
 * Built on the native <dialog> opened with showModal(). The browser then does most of the
 * pattern itself: it reports the dialog as modal, makes the page behind inert, moves focus to
 * the first focusable element, closes on Escape and puts focus back on the button. One thing it
 * does not do as APG describes: Tab on the last element leaves the page for the browser's own
 * controls before it comes back to the first. This file adds that wrap and nothing else.
 */

const TABBABLE = 'input, button, select, textarea, a[href], [tabindex]:not([tabindex="-1"])';

const isUsable = (element: HTMLElement) =>
  !element.hasAttribute('disabled') && element.getClientRects().length > 0;

/** The elements Tab stops on inside the dialog, in order. */
const tabStops = (dialog: HTMLDialogElement): HTMLElement[] =>
  [...dialog.querySelectorAll<HTMLElement>(TABBABLE)].filter(isUsable);

/** Tab on the last stop goes to the first, Shift+Tab on the first to the last. */
function wrapTab(dialog: HTMLDialogElement, event: KeyboardEvent) {
  if (event.key !== 'Tab') return;
  const stops = tabStops(dialog);
  const first = stops[0];
  const last = stops.at(-1);
  if (!first || !last) return;
  const edge = event.shiftKey ? first : last;
  if (document.activeElement !== edge) return;
  event.preventDefault();
  (event.shiftKey ? last : first).focus();
}

export function createDialog(root: HTMLElement): () => void {
  const dialog = root.querySelector<HTMLDialogElement>('dialog')!;
  const opener = root.querySelector<HTMLElement>('[data-dialog-open]')!;
  const controller = new AbortController();
  const { signal } = controller;

  opener.addEventListener('click', () => dialog.showModal(), { signal });
  dialog.addEventListener('keydown', (event) => wrapTab(dialog, event), { signal });
  dialog.addEventListener(
    'click',
    (event) => {
      if ((event.target as Element).closest('[data-dialog-close]')) dialog.close();
    },
    { signal },
  );
  return () => controller.abort();
}
