/*
 * Typing letters to reach an option, as the browser's own select does (APG select-only example,
 * "Printable Characters"). Optional in the APG pattern, so the engine records it, not judges it.
 */

/** Letters typed within this many milliseconds of each other form one search. */
const PAUSE_MS = 500;

/** Collects the letters typed in quick succession; a pause starts a new search. */
export function createTypeBuffer() {
  let buffer = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (letter: string): string => {
    clearTimeout(timer);
    buffer += letter.toLowerCase();
    timer = setTimeout(() => (buffer = ''), PAUSE_MS);
    return buffer;
  };
}

/**
 * The option the typed letters lead to, or -1. The same letter again cycles through the options
 * that start with it; different letters find the first option that starts with all of them.
 */
export function matchIndex(
  options: readonly string[],
  { typed, from }: { typed: string; from: number },
): number {
  const first = typed[0] ?? '';
  const isRepeat = [...typed].every((letter) => letter === first);
  const query = isRepeat ? first : typed;
  const start = isRepeat ? from + 1 : Math.max(0, from);
  for (let step = 0; step < options.length; step += 1) {
    const index = (start + step) % options.length;
    if (options[index]?.toLowerCase().startsWith(query)) return index;
  }
  return -1;
}

export const isPrintable = (event: KeyboardEvent): boolean =>
  event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey;
