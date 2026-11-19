/*
 * Reference menu button: a button that opens a menu of actions (docs/patterns/menu-button.md).
 * Framework-free; the browser runs this file with types removed.
 */
import { createMenuList, type MenuItem, type MenuList } from './menu-list.ts';

export interface MenuButtonOptions {
  items: readonly MenuItem[];
  /** Called with the item's name when it is activated: the item's action. */
  onAction: (name: string) => void;
}

interface Parts {
  button: HTMLButtonElement;
  menu: HTMLElement;
  list: MenuList;
  onAction: (name: string) => void;
}

const isOpen = ({ menu }: Parts) => !menu.hidden;

function open(parts: Parts, at: 'first' | 'last') {
  parts.menu.hidden = false;
  parts.button.setAttribute('aria-expanded', 'true');
  parts.list[at]();
}

function close({ button, menu }: Parts) {
  menu.hidden = true;
  button.setAttribute('aria-expanded', 'false');
}

/** Runs the item's action, closes the menu and returns focus to the button (APG example). */
function activate(parts: Parts, target: EventTarget | null) {
  const item = parts.list.activatable(target);
  // A disabled item is focusable and cannot be activated: nothing runs and the menu stays.
  if (!item) return;
  close(parts);
  parts.button.focus();
  parts.onAction(item.name);
}

/** Enter, Space and Down Arrow open on the first item; Up Arrow on the last. */
function onButtonKeydown(parts: Parts, event: KeyboardEvent) {
  const at = { Enter: 'first', ' ': 'first', ArrowDown: 'first', ArrowUp: 'last' } as const;
  const where = at[event.key as keyof typeof at];
  if (!where) return;
  event.preventDefault(); // no click from the same key, and no page scroll
  open(parts, where);
}

function onMenuKeydown(parts: Parts, event: KeyboardEvent) {
  const moves = {
    ArrowDown: () => parts.list.move(1),
    ArrowUp: () => parts.list.move(-1),
    Home: () => parts.list.first(),
    End: () => parts.list.last(),
    Enter: () => activate(parts, event.target),
    ' ': () => activate(parts, event.target),
    Escape: () => {
      close(parts);
      parts.button.focus();
    },
  };
  const move = moves[event.key as keyof typeof moves];
  if (move) {
    event.preventDefault();
    return move();
  }
  // Tab is left to the browser: focus moves on, and the menu closes when focus has left it.
  if (event.key.length === 1) parts.list.moveToLetter(event.key);
}

export function createMenuButton(root: HTMLElement, options: MenuButtonOptions): () => void {
  const button = root.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')!;
  const menu = root.querySelector<HTMLElement>('[role="menu"]')!;
  const controller = new AbortController();
  const { signal } = controller;
  const parts: Parts = {
    button,
    menu,
    list: createMenuList(menu, options.items),
    onAction: options.onAction,
  };

  button.addEventListener('keydown', (event) => onButtonKeydown(parts, event), { signal });
  // Space activates a button on keyup; the keydown above already opened the menu.
  button.addEventListener('keyup', (event) => event.key === ' ' && event.preventDefault(), {
    signal,
  });
  button.addEventListener('click', () => (isOpen(parts) ? close(parts) : open(parts, 'first')), {
    signal,
  });
  menu.addEventListener('keydown', (event) => onMenuKeydown(parts, event), { signal });
  menu.addEventListener('click', (event) => activate(parts, event.target), { signal });
  // Focus that leaves the button and the menu closes it: Tab, or a click elsewhere.
  root.addEventListener(
    'focusout',
    (event) => {
      if (!root.contains(event.relatedTarget as Node | null)) close(parts);
    },
    { signal },
  );

  return () => controller.abort();
}
