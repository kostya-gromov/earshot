import type { Page } from '@playwright/test';
import type { ComboboxInteraction, ComboboxState } from '../../scenarios/combobox.ts';
import type { Adapter } from '../adapter.ts';
import { checkEmptyClosed, clicksNothing } from '../combobox/harness.ts';
import { harnessRoot, harnessTarget, readHarnessVersion } from '../harness-target.ts';

/** GitHub Primer Autocomplete, rendered from @primer/react by packages/harness/primer. */
const input = (page: Page) => harnessRoot(page).getByRole('combobox', { name: 'Fruit' });
// Page-wide, not under the root: the popup is rendered outside the field.
const listbox = (page: Page) => page.getByRole('listbox');
const options = (page: Page) => listbox(page).getByRole('option');

export function createPrimerComboboxAdapter(
  url: string,
): Adapter<ComboboxState, ComboboxInteraction> {
  return {
    id: 'primer',
    system: 'GitHub Primer',
    version: 1,
    url,
    page: 'packages/harness/primer/combobox.html',
    root: harnessRoot,
    items: { locate: options, description: 'Elements with role="option" in the listbox.' },
    popup: { locate: listbox, description: 'The element with role="listbox".' },
    ready: (page) => input(page).waitFor({ timeout: 20_000 }),
    setup: checkEmptyClosed(input, options),
    resolveClickTarget: clicksNothing,
    readVersion: readHarnessVersion,
    notes:
      'The menu is rendered in an overlay. The page follows the docs "Default" example, single selection.',
  };
}

export const createPrimerComboboxTarget = () =>
  harnessTarget('primer', createPrimerComboboxAdapter, 'combobox.html');
