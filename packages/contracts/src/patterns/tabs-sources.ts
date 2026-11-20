import type { Source } from '../schema/index.ts';
import { wcagSource } from './wcag-source.ts';

// Quoted from the dated snapshots in docs/sources/; `pnpm sources:check` passed on this date.
export const checkedAt = '2026-11-19';

const tabs = 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs';

export const apg = {
  about: {
    kind: 'apg',
    title: 'Tabs Pattern: about this pattern',
    url: `${tabs}/#about`,
    checkedAt,
  },
  keyboard: {
    kind: 'apg',
    title: 'Tabs Pattern: keyboard interaction',
    url: `${tabs}/#keyboard_interaction`,
    checkedAt,
  },
  roles: {
    kind: 'apg',
    title: 'Tabs Pattern: WAI-ARIA roles, states, and properties',
    url: `${tabs}/#roles_states_properties`,
    checkedAt,
  },
  automaticExample: {
    kind: 'apg',
    title: 'Example of Tabs with Automatic Activation',
    url: `${tabs}/examples/tabs-automatic/`,
    checkedAt,
  },
  manualExample: {
    kind: 'apg',
    title: 'Example of Tabs with Manual Activation',
    url: `${tabs}/examples/tabs-manual/`,
    checkedAt,
  },
  selectionFollowsFocus: {
    kind: 'apg',
    title: 'Developing a Keyboard Interface: deciding when to make selection follow focus',
    url: 'https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_selection_follows_focus',
    checkedAt,
  },
  focusVisible: {
    kind: 'apg',
    title: 'Developing a Keyboard Interface: discernible and predictable keyboard focus',
    url: 'https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_focus_discernable_predictable',
    checkedAt,
  },
  focusVsSelection: {
    kind: 'apg',
    title: 'Developing a Keyboard Interface: focus vs. selection and the perception of dual focus',
    url: 'https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_focus_vs_selection',
    checkedAt,
  },
} satisfies Record<string, Source>;

export const wcag = wcagSource(checkedAt);
