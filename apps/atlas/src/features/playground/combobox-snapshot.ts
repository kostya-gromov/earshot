import type { ComboboxSnapshot } from './combobox-tour';

/** Reads the mounted reference combobox: focus, whether its list is shown, the active option. */
export function snapshotCombobox(root: HTMLElement): ComboboxSnapshot {
  const input = root.querySelector('input');
  const activeId = input?.getAttribute('aria-activedescendant');
  const option = activeId ? document.getElementById(activeId) : null;
  return {
    focusOnInput: input !== null && document.activeElement === input,
    isOpen: input?.getAttribute('aria-expanded') === 'true',
    active: option?.textContent ?? null,
    value: input?.value ?? '',
  };
}
