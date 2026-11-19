import type { Source } from '../schema/index.ts';
import { wcagSource } from './wcag-source.ts';

// Quoted from the dated snapshots in docs/sources/; `pnpm sources:check` passed on this date.
export const checkedAt = '2026-11-16';

const patterns = 'https://www.w3.org/WAI/ARIA/apg/patterns';

export const apg = {
  buttonKeyboard: {
    kind: 'apg',
    title: 'Menu Button Pattern: keyboard interaction',
    url: `${patterns}/menu-button/#keyboard_interaction`,
    checkedAt,
  },
  buttonRoles: {
    kind: 'apg',
    title: 'Menu Button Pattern: WAI-ARIA roles, states, and properties',
    url: `${patterns}/menu-button/#roles_states_properties`,
    checkedAt,
  },
  menuKeyboard: {
    kind: 'apg',
    title: 'Menu and Menubar Pattern: keyboard interaction',
    url: `${patterns}/menubar/#keyboard_interaction`,
    checkedAt,
  },
  menuRoles: {
    kind: 'apg',
    title: 'Menu and Menubar Pattern: WAI-ARIA roles, states, and properties',
    url: `${patterns}/menubar/#roles_states_properties`,
    checkedAt,
  },
  actionsExample: {
    kind: 'apg',
    title: 'Action Menu Button Example Using aria-activedescendant',
    url: `${patterns}/menu-button/examples/menu-button-actions-active-descendant/`,
    checkedAt,
  },
  activeDescendant: {
    kind: 'apg',
    title:
      'Developing a Keyboard Interface: managing focus in composites using aria-activedescendant',
    url: 'https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_focus_activedescendant',
    checkedAt,
  },
  disabledControls: {
    kind: 'apg',
    title: 'Developing a Keyboard Interface: focusability of disabled controls',
    url: 'https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#focusabilityofdisabledcontrols',
    checkedAt,
  },
} satisfies Record<string, Source>;

export const wcag = wcagSource(checkedAt);
