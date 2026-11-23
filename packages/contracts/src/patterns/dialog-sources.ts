import type { Source } from '../schema/index.ts';
import { wcagSource } from './wcag-source.ts';

// Quoted from the dated snapshots in docs/sources/; `pnpm sources:check` passed on this date
// (again on 2026-11-23, when the design requirements first cited three WCAG pages).
export const checkedAt = '2026-11-23';

const dialog = 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal';

export const apg = {
  about: {
    kind: 'apg',
    title: 'Dialog (Modal) Pattern: about this pattern',
    url: `${dialog}/#about`,
    checkedAt,
  },
  keyboard: {
    kind: 'apg',
    title: 'Dialog (Modal) Pattern: keyboard interaction',
    url: `${dialog}/#keyboard_interaction`,
    checkedAt,
  },
  roles: {
    kind: 'apg',
    title: 'Dialog (Modal) Pattern: WAI-ARIA roles, states, and properties',
    url: `${dialog}/#roles_states_properties`,
    checkedAt,
  },
  example: {
    kind: 'apg',
    title: 'Modal Dialog Example',
    url: `${dialog}/examples/dialog/`,
    checkedAt,
  },
} satisfies Record<string, Source>;

export const wcag = wcagSource(checkedAt);
