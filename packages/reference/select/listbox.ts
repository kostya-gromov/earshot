/*
 * The select's list: which option is chosen, which is active, and whether the list is shown.
 * DOM focus never comes here; the select points at the active option with
 * aria-activedescendant (APG combobox, "Listbox Popup Keyboard Interaction").
 */

export interface ListboxOptions {
  /** The role="combobox" element; its text is the chosen option. */
  select: HTMLElement;
  /** The role="listbox" element. */
  popup: HTMLElement;
  options: readonly string[];
  value: string;
}

export type Listbox = ReturnType<typeof createListbox>;

export function createListbox({ select, popup, options, value }: ListboxOptions) {
  const optionId = (index: number) => `${popup.id}-opt-${index}`;
  const last = options.length - 1;
  let chosen = Math.max(0, options.indexOf(value));
  /** Index of the active option, -1 while the list is hidden. */
  let active = -1;

  popup.replaceChildren(...options.map((name, index) => optionElement(name, optionId(index))));
  const elements = [...popup.children] as HTMLElement[];

  function render() {
    const isOpen = active >= 0;
    popup.hidden = !isOpen;
    select.setAttribute('aria-expanded', String(isOpen));
    select.textContent = options[chosen] ?? '';
    // Only the active option is selected: selection follows focus in the list (APG, Listbox Popup).
    elements.forEach((element, index) => {
      element.setAttribute('aria-selected', String(index === active));
    });
    if (!isOpen) return select.removeAttribute('aria-activedescendant');
    select.setAttribute('aria-activedescendant', optionId(active));
    // The browser does not scroll an active descendant into view; zoomed users need it to.
    elements[active]?.scrollIntoView({ block: 'nearest' });
  }

  const moveTo = (index: number) => {
    active = Math.min(last, Math.max(0, index));
    render();
  };

  render();
  return {
    options,
    isOpen: () => active >= 0,
    chosenIndex: () => chosen,
    activeIndex: () => active,
    lastIndex: () => last,
    /** Shows the list with this option active. */
    open: moveTo,
    moveTo,
    /** Moves by delta and stops at either end: neither APG page wraps a select's list. */
    moveBy: (delta: number) => moveTo(active + delta),
    /** Hides the list; the value stays as it was (Escape, a click on the select). */
    close() {
      active = -1;
      render();
    },
    /** The active option becomes the value, and the list closes. */
    choose() {
      if (active >= 0) chosen = active;
      active = -1;
      render();
    },
    indexOf: (element: Element) => elements.indexOf(element as HTMLElement),
  };
}

function optionElement(name: string, id: string) {
  const option = document.createElement('li');
  option.setAttribute('role', 'option');
  option.id = id;
  option.textContent = name; // user-visible data, never innerHTML
  return option;
}
