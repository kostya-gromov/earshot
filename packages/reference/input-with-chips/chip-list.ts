/*
 * The chips: a list of remove buttons with roving focus. The whole list is one Tab stop
 * (every button has tabindex="-1"); arrow keys move between chips.
 */

// White initials on these stay at 5.4:1 or more (WCAG 1.4.3).
const AVATAR_COLORS = ['#6941c6', '#107569', '#c11574', '#155eef', '#b93815'];

export type RemovalSource = 'keyboard' | 'pointer';

export interface ChipListOptions {
  /** The <ul> that holds the chips. */
  list: HTMLElement;
  /** Removes the listeners when aborted. */
  signal: AbortSignal;
  onRemove: (index: number, source: RemovalSource) => void;
  /** Focus leaves the chips for the input. */
  onExit: () => void;
}

export type ChipList = ReturnType<typeof createChipList>;

type KeyAction = (i: number, buttons: HTMLButtonElement[], options: ChipListOptions) => void;

/** What each key does when a remove button has focus. */
const KEY_ACTIONS: Partial<Record<string, KeyAction>> = {
  ArrowLeft: (i, buttons) => buttons[i - 1]?.focus(), // stays put on the first chip
  ArrowRight: (i, buttons, { onExit }) =>
    i < buttons.length - 1 ? buttons[i + 1]?.focus() : onExit(),
  Home: (_i, buttons) => buttons[0]?.focus(),
  End: (_i, _buttons, { onExit }) => onExit(),
  Escape: (_i, _buttons, { onExit }) => onExit(),
  Backspace: (i, _buttons, { onRemove }) => onRemove(i, 'keyboard'),
  Delete: (i, _buttons, { onRemove }) => onRemove(i, 'keyboard'),
};

export function createChipList(options: ChipListOptions) {
  const { list, signal, onRemove } = options;
  const buttons = () => [...list.querySelectorAll<HTMLButtonElement>('.chip__remove')];

  list.addEventListener(
    'click',
    (e) => {
      const button = (e.target as Element).closest<HTMLButtonElement>('.chip__remove');
      if (button) onRemove(buttons().indexOf(button), 'pointer');
    },
    { signal },
  );

  list.addEventListener(
    'keydown',
    (e) => {
      const all = buttons();
      const i = all.indexOf(e.target as HTMLButtonElement);
      if (i < 0) return;
      if (e.key === 'Tab' && !e.shiftKey) {
        // One stop for the whole field, also from a chip. The input follows the chips, so
        // move focus there and let the browser's own Tab continue from it, out of the field.
        // Shift+Tab already leaves backwards: nothing in the field comes before the chips.
        options.onExit();
        return;
      }
      const action = KEY_ACTIONS[e.key];
      if (!action) return;
      e.preventDefault();
      action(i, all, options);
    },
    { signal },
  );

  return {
    /** `focusIndex` is the chip to focus after rendering. */
    render(names: readonly string[], focusIndex: number | null = null) {
      // Built with DOM APIs, never innerHTML: names are user input.
      list.replaceChildren(...names.map(chipElement));
      if (focusIndex != null) buttons()[focusIndex]?.focus();
    },
    focusLast: () => buttons().at(-1)?.focus(),
  };
}

function chipElement(name: string): HTMLLIElement {
  const chip = document.createElement('li');
  chip.className = 'chip';
  chip.append(avatarElement(name), document.createTextNode(name), removeButton(name));
  return chip;
}

function avatarElement(name: string): HTMLSpanElement {
  const avatar = document.createElement('span');
  avatar.className = 'chip__avatar';
  avatar.setAttribute('aria-hidden', 'true');
  // Colour follows the name, not the position, so chips keep their colour when others are removed.
  avatar.style.background = AVATAR_COLORS[hash(name) % AVATAR_COLORS.length] ?? '';
  avatar.textContent = initials(name);
  return avatar;
}

function removeButton(name: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'chip__remove';
  button.tabIndex = -1;
  button.setAttribute('aria-label', `Remove ${name}`);
  // Static markup, no user input.
  button.innerHTML =
    '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" stroke="currentColor" stroke-width="1.6"><path d="M2 2l6 6M8 2l-6 6"/></svg>';
  return button;
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('');

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}
