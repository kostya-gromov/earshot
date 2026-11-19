/*
 * The suggestion popup of the APG combobox. DOM focus stays in the input; the active
 * option is exposed with aria-activedescendant, so screen readers announce it.
 */

const MAX_SUGGESTIONS = 5;

export interface SuggestionsOptions {
  input: HTMLInputElement;
  /** The role="listbox" element. */
  popup: HTMLElement;
  /** Names that may still be suggested. */
  candidates: () => readonly string[];
  onPick: (name: string) => void;
  signal: AbortSignal;
}

export type Suggestions = ReturnType<typeof createSuggestions>;

export function createSuggestions({
  input,
  popup,
  candidates,
  onPick,
  signal,
}: SuggestionsOptions) {
  /** Index of the active suggestion, -1 when none. */
  let active = -1;
  const optionId = (i: number) => `${popup.id}-opt-${i}`;

  function matches(): string[] {
    const query = input.value.trim().toLowerCase();
    if (!query) return [];
    return candidates()
      .filter((name) => name.toLowerCase().includes(query))
      .slice(0, MAX_SUGGESTIONS);
  }

  function render() {
    const items = matches();
    popup.replaceChildren(
      ...items.map((name, i) => optionElement({ name, id: optionId(i), isActive: i === active })),
    );
    const isOpen = items.length > 0;
    popup.hidden = !isOpen;
    input.setAttribute('aria-expanded', String(isOpen));
    if (isOpen && active >= 0) input.setAttribute('aria-activedescendant', optionId(active));
    else input.removeAttribute('aria-activedescendant');
  }

  function close() {
    active = -1;
    render();
  }

  bindPointer({ popup, onPick, signal });
  input.addEventListener('input', close, { signal });
  // Deferred so a click on an option lands before the popup closes.
  input.addEventListener('blur', () => setTimeout(close, 0), { signal });

  return {
    close,
    isOpen: () => !popup.hidden,
    /** Name of the active option, or null when none is active. */
    activeName: (): string | null => (active >= 0 ? (matches()[active] ?? null) : null),

    /** Moves the active option, wrapping around. Returns false when there is nothing to move through. */
    move(delta: 1 | -1): boolean {
      const count = matches().length;
      if (count === 0) return false;
      active = (active + delta + count) % count;
      render();
      return true;
    },
  };
}

function bindPointer({
  popup,
  onPick,
  signal,
}: Pick<SuggestionsOptions, 'popup' | 'onPick' | 'signal'>) {
  popup.addEventListener('mousedown', (e) => e.preventDefault(), { signal }); // keep focus in input
  popup.addEventListener(
    'click',
    (e) => {
      const option = (e.target as Element).closest('[role="option"]');
      if (option) onPick(option.textContent ?? '');
    },
    { signal },
  );
}

function optionElement({ name, id, isActive }: { name: string; id: string; isActive: boolean }) {
  const option = document.createElement('li');
  option.setAttribute('role', 'option');
  option.id = id;
  option.setAttribute('aria-selected', String(isActive));
  option.textContent = name; // user-visible data, never innerHTML
  return option;
}
