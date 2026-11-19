import type { Source } from '../schema/index.ts';
import { wcagSource } from './wcag-source.ts';

// Quoted from the dated snapshots in docs/sources/; `pnpm sources:check` passed on this date.
export const checkedAt = '2026-11-15';

export const apg = {
  keyboard: {
    kind: 'apg',
    title: 'Combobox Pattern: keyboard interaction',
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/#keyboard_interaction',
    checkedAt,
  },
  roles: {
    kind: 'apg',
    title: 'Combobox Pattern: WAI-ARIA roles, states, and properties',
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/#roles_states_properties',
    checkedAt,
  },
  activeDescendant: {
    kind: 'apg',
    title:
      'Developing a Keyboard Interface: managing focus in composites using aria-activedescendant',
    url: 'https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_focus_activedescendant',
    checkedAt,
  },
  listExample: {
    kind: 'apg',
    title: 'Editable Combobox With List Autocomplete Example',
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/',
    checkedAt,
  },
} satisfies Record<string, Source>;

export const wcag = wcagSource(checkedAt);
