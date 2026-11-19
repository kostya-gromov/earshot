import { attachFieldMotion } from './field-motion';
import { holdFieldHeight } from './hold-height';
import { directory, initialPeople } from './people';

type Stop = () => void;

/** How the playground runs one pattern's reference: Strategy, one entry per pattern. */
export interface LivePattern {
  /** The component's root inside the reference markup. */
  rootSelector: string;
  /** Starts the reference from its own module, with the data the engine measures it with. */
  start: (module: unknown, root: HTMLElement) => Stop;
  /** What Atlas adds around the running reference besides speech; the reference is unchanged. */
  attach: (root: HTMLElement) => Stop[];
  /** The key the empty playground invites: the first thing worth pressing in this pattern. */
  firstKey: string;
  /** Where that key is pressed, as the invitation says it: “Press Enter on the button”. */
  firstKeyPlace: 'in the field' | 'on the button';
  /** False when the reference has no live region: nothing is ever heard but focus landing. */
  announces: boolean;
  /** "Watch it": the keys a person would press. One character is typed text. */
  watchSequence: readonly string[];
}

interface ChipFieldModule {
  createChipField: (
    root: HTMLElement,
    options: { initial?: readonly string[]; directory?: readonly string[] },
  ) => { destroy: Stop };
}

interface ComboboxModule {
  createCombobox: (root: HTMLElement, options: { options: readonly string[] }) => Stop;
}

interface MenuButtonModule {
  createMenuButton: (
    root: HTMLElement,
    options: {
      items: readonly { name: string; isDisabled?: boolean }[];
      onAction: (name: string) => void;
    },
  ) => Stop;
}

/** The four items every menu button target is measured with (docs/patterns/menu-button.md). */
const menuItems = [
  { name: 'Rename' },
  { name: 'Duplicate' },
  { name: 'Archive', isDisabled: true },
  { name: 'Delete' },
] as const;

/**
 * The menu button with the line its items' action writes, beside it: plain text, as on the
 * reference's own page, so a person sees that an item ran and not only that the menu closed.
 */
function startMenuButton(module: unknown, root: HTMLElement): Stop {
  const line = document.createElement('p');
  line.dataset.lastAction = '';
  line.textContent = 'Last action: none';
  root.after(line);
  const stop = (module as MenuButtonModule).createMenuButton(root, {
    items: menuItems,
    onAction: (name) => {
      line.textContent = `Last action: ${name}`;
      line.dataset.ran = '';
    },
  });
  return () => {
    stop();
    line.remove();
  };
}

/** The six options every combobox target is measured with (docs/patterns/combobox.md). */
const fruit = ['Apple', 'Apricot', 'Avocado', 'Cherry', 'Kiwi', 'Plum'] as const;

export const livePatterns: Readonly<Record<string, LivePattern>> = {
  'input-with-chips': {
    rootSelector: '[data-chip-field]',
    start: (module, root) =>
      (module as ChipFieldModule).createChipField(root, { initial: initialPeople, directory })
        .destroy,
    attach: (root) => [attachFieldMotion(root), holdFieldHeight(root)],
    firstKey: 'Backspace',
    firstKeyPlace: 'in the field',
    announces: true,
    watchSequence: ['Backspace', 'Backspace', 'ArrowLeft', 'ArrowRight', 'ArrowRight'],
  },
  combobox: {
    rootSelector: '[data-combobox]',
    start: (module, root) => (module as ComboboxModule).createCombobox(root, { options: fruit }),
    // The list has its own reserved room under the field (playground.module.css): no motion yet.
    attach: () => [],
    firstKey: 'ArrowDown',
    firstKeyPlace: 'in the field',
    announces: true,
    watchSequence: ['a', 'ArrowDown', 'ArrowDown', 'ArrowUp', 'Enter'],
  },
  'menu-button': {
    rootSelector: '[data-menu-button]',
    start: startMenuButton,
    // The menu has its own reserved room under the button (playground.module.css).
    attach: () => [],
    firstKey: 'Enter',
    firstKeyPlace: 'on the button',
    announces: false,
    watchSequence: ['Enter', 'ArrowDown', 'ArrowUp', 'ArrowDown', 'Enter'],
  },
};
