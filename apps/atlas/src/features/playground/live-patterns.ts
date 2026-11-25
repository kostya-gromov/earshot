import { attachDialogHeard } from './dialog-heard';
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
  /** What Earshot adds around the running reference besides speech; the reference is unchanged. */
  attach: (root: HTMLElement) => Stop[];
  /** The key the empty playground invites: the first thing worth pressing in this pattern. */
  firstKey: string;
  /** Where that key is pressed, as the invitation says it: “Press Enter on the button”. */
  firstKeyPlace: 'in the field' | 'on the button' | 'on a tab' | 'on the select';
  /** False when the reference has no live region: nothing is ever heard but focus landing. */
  announces: boolean;
  /** "Watch it": the keys a person would press. One character is typed text. */
  watchSequence: readonly string[];
  /** How long "Watch it" rests after each key, where the usual beat is too short to follow. */
  watchHoldMs?: number;
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

interface DialogModule {
  createDialog: (root: HTMLElement) => Stop;
}

interface SelectModule {
  createSelect: (root: HTMLElement, options: { options: readonly string[]; value: string }) => Stop;
}

interface TabsModule {
  createTabs: (root: HTMLElement) => Stop;
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

/** The five options and the value every select target is measured with (docs/proposals/select.md). */
const selectFruit = ['Apple', 'Apricot', 'Banana', 'Cherry', 'Date'] as const;

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
  tabs: {
    rootSelector: '[data-tabs]',
    start: (module, root) => (module as TabsModule).createTabs(root),
    attach: () => [],
    firstKey: 'ArrowRight',
    firstKeyPlace: 'on a tab',
    announces: false,
    watchSequence: ['ArrowRight', 'ArrowRight', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'Tab'],
  },
  dialog: {
    rootSelector: '[data-dialog]',
    start: (module, root) => (module as DialogModule).createDialog(root),
    // The transcript's last line, shown over the open dialog's backdrop.
    attach: (root) => [attachDialogHeard(root)],
    firstKey: 'Enter',
    firstKeyPlace: 'on the button',
    announces: false,
    // Opens it, goes round it once and closes it: every step of the tour is seen. Tab can be
    // shown here and nowhere else (replay.ts): the third Tab is on the last button, where the
    // reference's own handler wraps it to the field. It never stops with the dialog open, which
    // would leave the page behind unusable (2026-11-23).
    watchSequence: ['Enter', 'Tab', 'Tab', 'Tab', 'Escape'],
    // Long enough to see where focus went and read what was said, before the next key: at the
    // usual beat the dialog was gone in 0.7 s (2026-11-23).
    watchHoldMs: 1700,
  },
  select: {
    rootSelector: '[data-select]',
    start: (module, root) =>
      (module as SelectModule).createSelect(root, { options: selectFruit, value: 'Banana' }),
    // The list has its own reserved room under the select (playground.module.css).
    attach: () => [],
    firstKey: 'ArrowDown',
    firstKeyPlace: 'on the select',
    announces: false,
    // Opens on the value, moves down and back, then chooses: every step but Escape is seen.
    watchSequence: ['ArrowDown', 'ArrowDown', 'ArrowUp', 'ArrowDown', 'Enter'],
  },
};
