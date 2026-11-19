/*
 * The listbox popup: which options are shown and which one is active. DOM focus never comes
 * here; the combobox points at the active option with aria-activedescendant (APG combobox,
 * "Listbox Popup Keyboard Interaction").
 */

export interface OptionListOptions {
  input: HTMLInputElement;
  /** The role="listbox" element. */
  popup: HTMLElement;
  options: readonly string[];
}

export type OptionList = ReturnType<typeof createOptionList>;

export function createOptionList({ input, popup, options }: OptionListOptions) {
  let shown: readonly string[] = [];
  /** Index of the active option among the shown ones, -1 when none. */
  let active = -1;
  const optionId = (index: number) => `${popup.id}-opt-${index}`;

  function render() {
    popup.replaceChildren(
      ...shown.map((name, index) =>
        optionElement({ name, id: optionId(index), isActive: index === active }),
      ),
    );
    const isOpen = shown.length > 0;
    popup.hidden = !isOpen;
    input.setAttribute('aria-expanded', String(isOpen));
    if (active >= 0) input.setAttribute('aria-activedescendant', optionId(active));
    else input.removeAttribute('aria-activedescendant');
  }

  return {
    isOpen: () => shown.length > 0,
    activeName: (): string | null => shown[active] ?? null,

    /** The options that contain the text; every option when the text is empty. */
    matching(text: string): readonly string[] {
      const query = text.trim().toLowerCase();
      return options.filter((name) => name.toLowerCase().includes(query));
    },

    /** Shows these options with none active: list autocomplete with manual selection. */
    show(names: readonly string[]) {
      shown = names;
      active = -1;
      render();
    },

    close() {
      shown = [];
      active = -1;
      render();
    },

    /** Moves to the next or previous option; past either end it wraps, as the APG list example does. */
    move(delta: 1 | -1) {
      if (shown.length === 0) return;
      const from = active === -1 && delta === -1 ? 0 : active;
      active = (from + delta + shown.length) % shown.length;
      render();
    },
  };
}

function optionElement({ name, id, isActive }: { name: string; id: string; isActive: boolean }) {
  const option = document.createElement('li');
  option.setAttribute('role', 'option');
  option.id = id;
  option.setAttribute('aria-selected', String(isActive));
  option.textContent = name; // user-visible data, never innerHTML
  return option;
}
