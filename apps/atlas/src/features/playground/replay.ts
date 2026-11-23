import { asAfterAKey, showFocusRing } from './show-focus';

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ReplayOptions {
  root: HTMLElement;
  keys: readonly string[];
  onKey: (key: string) => void;
  isCancelled: () => boolean;
  /**
   * How long to rest after each key before the next, when a pattern needs longer than the usual
   * beat: a dialog that opens over the page has to be seen, and its line read, before it closes.
   */
  holdMs?: number | undefined;
}

/** Steps a script cannot perform for the person: Tab, and clicks recorded as "Click “name”". */
const needsPerson = (key: string) => key.endsWith('Tab') || key.startsWith('Click');

/** What the playground says when a replay stops at a step the person has to take. */
export const nextStepNote = (key: string): string =>
  key.startsWith('Click')
    ? `Next step: ${key.replace('Click', 'click')} yourself`
    : `Next step: press ${key} yourself`;

/**
 * One character is typed text. A script cannot type, so it does what the browser does after the
 * key: puts the character in the focused input and fires the input event the reference listens to.
 */
function typeCharacter(character: string) {
  const input = document.activeElement;
  if (!(input instanceof HTMLInputElement)) return;
  input.value += character;
  input.dispatchEvent(
    new InputEvent('input', { data: character, inputType: 'insertText', bubbles: true }),
  );
}

/**
 * A dialog's reference is the browser's own button and dialog element, and a synthetic key does
 * not make the browser act on them. So the script does what the browser does after the key:
 * Enter or Space on the button clicks it, and Escape in an open dialog closes it, which also
 * puts focus back where it was.
 */
function nativeDefault(key: string) {
  const focused = document.activeElement;
  if (!(focused instanceof HTMLElement) || !focused.closest('[data-dialog]')) return;
  if ((key === 'Enter' || key === ' ') && focused instanceof HTMLButtonElement) focused.click();
  if (key === 'Escape') focused.closest('dialog')?.close();
  if (key === 'Tab') nextInDialog(focused)?.focus(asAfterAKey);
}

/** The open modal dialog focus is in, if any: there the next Tab stop is known. */
const openDialogOf = (element: Element | null) =>
  element?.closest<HTMLDialogElement>('[data-dialog] dialog[open]') ?? null;

/**
 * Where the browser's Tab would go from here inside the dialog: the next field or button. Past
 * the last there is none, on purpose: that press is the reference's own to handle, and it does,
 * since its handler also hears a scripted key.
 */
function nextInDialog(from: HTMLElement): HTMLElement | undefined {
  const stops = [...(openDialogOf(from)?.querySelectorAll<HTMLElement>('input, button') ?? [])];
  return stops[stops.indexOf(from) + 1];
}

/**
 * Tab in an open modal dialog can be shown: at the last element the reference's own handler
 * takes the key and wraps, and before it the script moves focus as the browser would. Anywhere
 * else Tab goes where the page decides, and that stays the person's to press.
 */
const canShowTab = (key: string) => key === 'Tab' && openDialogOf(document.activeElement) !== null;

/** One key: the event the reference's handlers hear, then what the browser would do after it. */
function pressKey(key: string) {
  // False when a handler took the key (preventDefault): then the browser would do nothing more.
  const isLeftToBrowser = document.activeElement?.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
  );
  if (key.length === 1) typeCharacter(key);
  else if (isLeftToBrowser) nativeDefault(key);
}

/**
 * Dispatches key events to whatever has focus, so the reference's own handlers run and the real
 * behavior shows. Tab cannot be scripted (browsers do not move focus for synthetic events), so a
 * sequence stops there and returns the step the person should take; inside an open modal dialog
 * it can be shown (canShowTab).
 */
export async function replayKeys({ root, keys, onKey, isCancelled, holdMs }: ReplayOptions) {
  // Without scrolling: the caller scrolls the field into view smoothly, and a plain focus()
  // would jump there first.
  // Where every recording starts: the field's input, the button of a menu button, the button
  // that opens a dialog (it comes before the dialog's own field in the markup), or the selected
  // tab, the one Tab stop of a tab list. Without a start the keys reach the body and do nothing.
  root
    .querySelector<HTMLElement>(
      '[data-dialog-open], input, [aria-haspopup="menu"], [role="tab"][aria-selected="true"]',
    )
    ?.focus(asAfterAKey);
  const beat = reducedMotion() ? 350 : 700;
  for (const [index, key] of keys.entries()) {
    // The first key comes after the usual beat; the hold is for reading what a key did. It is
    // reading time, not motion, so it is the same under reduced motion.
    await pause(index === 0 ? beat : Math.max(beat, holdMs ?? 0));
    if (isCancelled()) return undefined;
    if (needsPerson(key) && !canShowTab(key)) return key;
    onKey(key);
    pressKey(key);
    // Where the key sent focus, it is seen, as after a real key (show-focus.ts).
    showFocusRing();
  }
  return undefined;
}
