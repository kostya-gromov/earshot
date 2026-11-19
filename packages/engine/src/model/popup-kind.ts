import type { AccessibleStates } from '@earshot/contracts';

type PopupKind = NonNullable<AccessibleStates['hasPopup']>;

const kinds: readonly PopupKind[] = ['menu', 'listbox', 'tree', 'grid', 'dialog'];

/**
 * The popup a role has without saying so (WAI-ARIA): a combobox has a listbox. Writing the
 * default on the element changes nothing for assistive technology, so it is not a fact about the
 * component worth saying, and two systems that differ only in whether they write it must not
 * read differently (2026-11-16).
 */
const defaultKinds: Readonly<Record<string, PopupKind>> = { combobox: 'listbox' };

/**
 * The popup an element says it has, beyond what its role already means. From its aria-haspopup
 * attribute as written: "true" is a menu; "false", an empty value and any token the
 * specification does not define are none. The role's own default is none as well.
 */
export function popupKindOf(attribute: string | null, role: string | null): PopupKind | undefined {
  const written = attribute === 'true' ? 'menu' : kinds.find((kind) => kind === attribute);
  return role !== null && written === defaultKinds[role] ? undefined : written;
}
