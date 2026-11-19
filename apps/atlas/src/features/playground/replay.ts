const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ReplayOptions {
  root: HTMLElement;
  keys: readonly string[];
  onKey: (key: string) => void;
  isCancelled: () => boolean;
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
 * Dispatches key events to whatever has focus, so the reference's own handlers run and the real
 * behavior shows. Tab cannot be scripted (browsers do not move focus for synthetic events), so a
 * sequence stops there and returns the step the person should take.
 */
export async function replayKeys({ root, keys, onKey, isCancelled }: ReplayOptions) {
  // Without scrolling: the caller scrolls the field into view smoothly, and a plain focus()
  // would jump there first.
  // Where every recording starts: the field's input, or the button of a menu button.
  root.querySelector<HTMLElement>('input, [aria-haspopup="menu"]')?.focus({ preventScroll: true });
  for (const key of keys) {
    await pause(reducedMotion() ? 350 : 700);
    if (isCancelled()) return undefined;
    if (needsPerson(key)) return key;
    onKey(key);
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    );
    if (key.length === 1) typeCharacter(key);
  }
  return undefined;
}
