import type { Source } from '../schema/index.ts';
import { wcagSource } from './wcag-source.ts';

// All links checked against the live pages on this date.
export const checkedAt = '2026-10-31';

export const apg = {
  combobox: {
    kind: 'apg',
    title: 'Combobox Pattern',
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
    checkedAt,
  },
  rovingTabindex: {
    kind: 'apg',
    title:
      'Developing a Keyboard Interface: managing focus within components using a roving tabindex',
    url: 'https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex',
    checkedAt,
  },
  /** The section's id was read on the live page on 2026-11-17. */
  focusPersistence: {
    kind: 'apg',
    title: 'Developing a Keyboard Interface: discernible and predictable keyboard focus',
    url: 'https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_focus_discernable_predictable',
    checkedAt: '2026-11-17',
  },
  disabledControls: {
    kind: 'apg',
    title: 'Developing a Keyboard Interface: focusability of disabled controls',
    url: 'https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#focusabilityofdisabledcontrols',
    checkedAt,
  },
  pillList: {
    kind: 'apg',
    title: 'Layout Grid Examples: pill list for a list of message recipients',
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/layout-grids/#ex2_label',
    checkedAt: '2026-11-10',
  },
} satisfies Record<string, Source>;

export const wcag = wcagSource(checkedAt);
