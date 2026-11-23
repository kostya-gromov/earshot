import styles from './playground.module.css';

/**
 * "You would hear", over an open modal dialog. The reference is the browser's own dialog opened
 * as modal: while it is open the whole page behind it is dimmed and inert, the playground's
 * transcript too, and that transcript is what the playground is for. So the line that was just
 * said is shown again in a popover, which the browser draws above the dialog's backdrop
 * (checked in Chromium, 2026-11-22). The popover is outside the dialog, so it is inert as well:
 * it cannot take focus or a click, and it is not in the accessibility tree. A screen reader
 * user hears the real dialog and loses nothing; the full transcript is there once it closes.
 * The reference is not changed.
 */
export function attachDialogHeard(root: HTMLElement): () => void {
  const dialog = root.querySelector('dialog');
  const section = root.closest('section');
  const log = section?.querySelector('[role="log"]');
  // What the playground says about itself ("Next step: press Tab yourself"): the dialog can lie
  // over it, so it is shown here too.
  const status = section?.querySelector('[role="status"]');
  if (!dialog || !log || typeof HTMLElement.prototype.showPopover !== 'function') return () => {};
  const heard = document.createElement('div');
  heard.popover = 'manual';
  heard.className = styles.heardOver ?? '';
  const label = document.createElement('span');
  label.textContent = 'You would hear';
  const line = document.createElement('span');
  const note = document.createElement('span');
  heard.append(label, line, note);
  document.body.append(heard);

  // Right under the dialog and as wide as it: one thing with it, not a message in a corner.
  const place = () => {
    const box = dialog.getBoundingClientRect();
    heard.style.left = `${box.left}px`;
    heard.style.width = `${box.width}px`;
    heard.style.top = `${box.bottom + 12}px`;
  };
  const show = () => {
    // The transcript's last line: what was just said, in the words the playground shows.
    line.textContent = log.lastElementChild?.textContent ?? '';
    note.textContent = status?.textContent ?? '';
    const isShown = heard.matches(':popover-open');
    if (dialog.open) place();
    if (dialog.open && !isShown) heard.showPopover();
    if (!dialog.open && isShown) heard.hidePopover();
  };
  const onDialog = new MutationObserver(show);
  onDialog.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  const watched = new MutationObserver(show);
  for (const element of [log, status]) {
    if (element) watched.observe(element, { childList: true, subtree: true, characterData: true });
  }
  window.addEventListener('resize', show);
  return () => {
    onDialog.disconnect();
    watched.disconnect();
    window.removeEventListener('resize', show);
    heard.remove();
  };
}
