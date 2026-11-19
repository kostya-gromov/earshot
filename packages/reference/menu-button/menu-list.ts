/*
 * The menu: which item holds focus. Items take DOM focus with tabindex="-1" (APG menu pattern,
 * "Each item in the menu has tabindex set to -1"), so the browser scrolls the focused item into
 * view and a screen reader reads it as focus moves.
 */

export interface MenuItem {
  name: string;
  /** Shown and focusable, and Enter on it does nothing (APG: focusable, cannot be activated). */
  isDisabled?: boolean;
}

export type MenuList = ReturnType<typeof createMenuList>;

export function createMenuList(menu: HTMLElement, items: readonly MenuItem[]) {
  const elements = items.map(itemElement);
  menu.replaceChildren(...elements);

  const focusAt = (index: number) => elements[index]?.focus();
  const focused = () => elements.findIndex((element) => element === document.activeElement);

  return {
    first: () => focusAt(0),
    last: () => focusAt(elements.length - 1),

    /** The next or previous item, disabled ones included; past either end it wraps. */
    move(delta: 1 | -1) {
      focusAt((focused() + delta + elements.length) % elements.length);
    },

    /** The next item after the focused one whose name starts with the character, if any. */
    moveToLetter(character: string) {
      const from = focused();
      const order = elements.map((_, offset) => (from + 1 + offset) % elements.length);
      const match = order.find((index) =>
        items[index]?.name.toLowerCase().startsWith(character.toLowerCase()),
      );
      if (match !== undefined) focusAt(match);
    },

    /** The item an event came from, when it can be activated. */
    activatable(target: EventTarget | null): MenuItem | undefined {
      const index = elements.findIndex((element) => element === target);
      const item = items[index];
      return item && !item.isDisabled ? item : undefined;
    },
  };
}

function itemElement({ name, isDisabled }: MenuItem) {
  const item = document.createElement('li');
  item.setAttribute('role', 'menuitem');
  item.tabIndex = -1;
  // aria-disabled, not removal from focus: a disabled item stays discoverable by arrow keys.
  if (isDisabled) item.setAttribute('aria-disabled', 'true');
  item.textContent = name; // user-visible data, never innerHTML
  return item;
}
