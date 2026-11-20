import { focusLine, optionLine } from './dom-speech';

export type Say = (text: string, source: 'focus' | 'announcement') => void;

/** Longer than a click's own handlers and a frame of the reference take to put focus back. */
const gestureSettles = 60;

/**
 * One press of the pointer is one move of focus at most. A click takes focus off the field for
 * a moment and the reference puts it back, sometimes twice, and a click on a menu button lands
 * on the button and then on an item: said one by one, the lines ran past faster than they
 * could be read, and a key never did that (2026-11-17). So while the pointer is down
 * nothing is said about focus, and once the click has settled the place focus ended in is said
 * once, and only if it is not where focus was before the press.
 */
function pointerGesture(root: HTMLElement, say: Say) {
  let before: Element | null | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const settle = () => {
    const was = before;
    before = undefined;
    const now = document.activeElement;
    if (now && now !== was && root.contains(now)) say(focusLine(now), 'focus');
  };
  const onDown = () => {
    clearTimeout(timer);
    // A second press before the first has settled is the same gesture: keep where it began.
    if (before === undefined) before = document.activeElement;
  };
  const onUp = () => {
    if (before === undefined) return;
    clearTimeout(timer);
    timer = setTimeout(settle, gestureSettles);
  };
  root.addEventListener('pointerdown', onDown, true);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  return {
    isHolding: () => before !== undefined,
    detach: () => {
      clearTimeout(timer);
      root.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    },
  };
}

/**
 * Listens to the mounted reference: focus moves, live region messages and the combobox's active
 * option (virtual focus). Returns a cleanup that removes every listener.
 */
export function attachSpeech(root: HTMLElement, say: Say): () => void {
  const status = root.querySelector('[role="status"]');
  const input = root.querySelector('input');
  const pointer = pointerGesture(root, say);
  const onFocus = (event: FocusEvent) => {
    const { target } = event;
    if (!(target instanceof Element) || pointer.isHolding()) return;
    // Read once the handler that moved focus has finished, as the engine reads a step after it:
    // the reference's tabs focus a tab and then select it, and a line read at the moment focus
    // landed left "selected" out (design review, 2026-11-20).
    queueMicrotask(() => {
      if (document.activeElement === target) say(focusLine(target), 'focus');
    });
  };
  // The same key is heard twice on the root: on the way down, before the reference's handler on
  // the input moves the active option, and on the way up, right after it. Two keys inside one
  // frame are then two lines, each with its own option.
  let before: string | null | undefined;
  const onKeyDown = () => {
    before = input?.getAttribute('aria-activedescendant');
  };
  const onKeyHandled = () => {
    const id = input?.getAttribute('aria-activedescendant');
    const option = id ? document.getElementById(id) : null;
    if (id && id !== before && option) say(optionLine(option), 'focus');
  };
  const observer = new MutationObserver(() => {
    const text = status?.textContent?.trim();
    if (text) say(text, 'announcement');
  });
  root.addEventListener('focusin', onFocus);
  root.addEventListener('keydown', onKeyDown, true);
  root.addEventListener('keydown', onKeyHandled);
  if (status) observer.observe(status, { childList: true, characterData: true, subtree: true });
  return () => {
    pointer.detach();
    root.removeEventListener('focusin', onFocus);
    root.removeEventListener('keydown', onKeyDown, true);
    root.removeEventListener('keydown', onKeyHandled);
    observer.disconnect();
  };
}
