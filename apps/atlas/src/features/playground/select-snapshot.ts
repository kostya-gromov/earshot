import type { SelectSnapshot } from './select-tour';

/** Reads the mounted reference select: focus, whether its list is shown, the active option. */
export function snapshotSelect(root: HTMLElement): SelectSnapshot {
  const select = root.querySelector('[role="combobox"]');
  const activeId = select?.getAttribute('aria-activedescendant');
  const option = activeId ? document.getElementById(activeId) : null;
  return {
    focusOnSelect: select !== null && document.activeElement === select,
    isOpen: select?.getAttribute('aria-expanded') === 'true',
    active: option?.textContent ?? null,
    value: select?.textContent ?? '',
  };
}
