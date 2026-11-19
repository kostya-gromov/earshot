/*
 * Reference combobox: editable, listbox popup, list autocomplete with manual selection
 * (docs/patterns/combobox.md). Framework-free; the browser runs this file with types removed.
 */
import { createAnnouncer } from './announcer.ts';
import { createOptionList, type OptionList } from './option-list.ts';

export interface ComboboxOptions {
  options: readonly string[];
}

const countMessage = (count: number): string => {
  if (count === 0) return 'No suggestions';
  return count === 1 ? '1 suggestion' : `${count} suggestions`;
};

interface Parts {
  input: HTMLInputElement;
  list: OptionList;
  announce: (text: string) => void;
}

function accept({ input, list }: Parts, name: string) {
  input.value = name;
  // The cursor goes to the end of the accepted value (APG, Enter).
  input.setSelectionRange(name.length, name.length);
  list.close();
}

/** Arrow keys open the popup when it is closed, then move through it. */
function moveOrOpen({ input, list }: Parts, delta: 1 | -1) {
  if (!list.isOpen()) list.show(list.matching(input.value));
  list.move(delta);
}

function onKeydown(parts: Parts, event: KeyboardEvent) {
  const { input, list } = parts;
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowUp':
      event.preventDefault(); // the caret stays where it is
      return moveOrOpen(parts, event.key === 'ArrowDown' ? 1 : -1);
    case 'Enter': {
      const name = list.activeName();
      if (name !== null) accept(parts, name);
      return undefined;
    }
    case 'Escape':
      // Open: close and keep the text. Closed: clear it (optional in APG).
      if (list.isOpen()) return list.close();
      input.value = '';
      return undefined;
    default:
      return undefined;
  }
}

export function createCombobox(root: HTMLElement, { options }: ComboboxOptions): () => void {
  const input = root.querySelector<HTMLInputElement>('[role="combobox"]')!;
  const popup = root.querySelector<HTMLElement>('[role="listbox"]')!;
  const status = root.querySelector<HTMLElement>('[role="status"]')!;
  const controller = new AbortController();
  const { signal } = controller;
  const parts: Parts = {
    input,
    list: createOptionList({ input, popup, options }),
    announce: createAnnouncer(status),
  };

  input.addEventListener('keydown', (event) => onKeydown(parts, event), { signal });
  input.addEventListener(
    'input',
    () => {
      const matches = parts.list.matching(input.value);
      parts.list.show(matches);
      parts.announce(countMessage(matches.length));
    },
    { signal },
  );
  // Deferred so a click on an option lands before the popup closes.
  input.addEventListener('blur', () => setTimeout(() => parts.list.close(), 0), { signal });
  popup.addEventListener('mousedown', (event) => event.preventDefault(), { signal }); // keep focus in the input
  popup.addEventListener(
    'click',
    (event) => {
      const option = (event.target as Element).closest('[role="option"]');
      if (option) accept(parts, option.textContent ?? '');
    },
    { signal },
  );

  return () => controller.abort();
}
