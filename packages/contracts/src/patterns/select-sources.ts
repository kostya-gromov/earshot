import type { Source } from '../schema/index.ts';
import { wcagSource } from './wcag-source.ts';

// Quoted from the dated snapshots in docs/sources/; `pnpm sources:check` passed on this date.
export const checkedAt = '2026-11-24';

const combobox = 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox';

export const apg = {
  about: {
    kind: 'apg',
    title: 'Combobox Pattern: about this pattern',
    url: `${combobox}/#about`,
    checkedAt,
  },
  keyboard: {
    kind: 'apg',
    title: 'Combobox Pattern: keyboard interaction',
    url: `${combobox}/#keyboard_interaction`,
    checkedAt,
  },
  roles: {
    kind: 'apg',
    title: 'Combobox Pattern: WAI-ARIA roles, states, and properties',
    url: `${combobox}/#roles_states_properties`,
    checkedAt,
  },
  activeDescendant: {
    kind: 'apg',
    title:
      'Developing a Keyboard Interface: managing focus in composites using aria-activedescendant',
    url: 'https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_focus_activedescendant',
    checkedAt,
  },
  /** For the name-and-value trade-off: how descriptions are presented (added 2026-11-24). */
  namesAndDescriptions: {
    kind: 'apg',
    title: 'Providing Accessible Names and Descriptions',
    url: 'https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/',
    checkedAt,
  },
  /** For native-select-first: the browser's select styled with CSS (added 2026-11-25). */
  mdnCustomizableSelect: {
    kind: 'other',
    title: 'MDN: Customizable select elements',
    url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select',
    checkedAt: '2026-11-25',
  },
  chromeCustomizableSelect: {
    kind: 'other',
    title: 'Chrome for Developers: a customizable select',
    url: 'https://developer.chrome.com/blog/a-customizable-select',
    checkedAt: '2026-11-25',
  },
  example: {
    kind: 'apg',
    title: 'Select-Only Combobox Example',
    url: `${combobox}/examples/combobox-select-only/`,
    checkedAt,
  },
} satisfies Record<string, Source>;

export const wcag = wcagSource(checkedAt);
